import { EmbeddingGenerator, EmbeddingResult } from './embedding-generator';
import { prisma } from '@/lib/prisma';

export interface SearchResult {
  id: string;
  type: 'commit' | 'comment' | 'pr';
  title: string;
  content: string;
  snippet: string;
  similarity: number;
  timestamp?: Date;
  author?: string;
  filePaths?: string[];
  url?: string;
}

export interface SearchFilters {
  contentTypes?: ('commit' | 'comment' | 'pr')[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  authors?: string[];
  filePaths?: string[];
  minSimilarity?: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
}

export class SemanticSearchService {
  private embeddingGenerator: EmbeddingGenerator;

  constructor() {
    this.embeddingGenerator = new EmbeddingGenerator();
  }

  /**
   * Perform semantic search across repository content
   */
  async search(
    query: string,
    repositoryId: number,
    options: SearchOptions = {}
  ): Promise<{
    results: SearchResult[];
    total: number;
    hasMore: boolean;
  }> {
    const { limit = 20, offset = 0, filters = {} } = options;
    const { contentTypes, minSimilarity = 0.7 } = filters;

    // Search for similar embeddings
    const embeddingResults = await this.embeddingGenerator.searchSimilar(
      query,
      repositoryId,
      {
        limit: limit + offset + 50, // Get more to account for filtering
        threshold: minSimilarity,
        contentTypes,
      }
    );

    // Convert embedding results to search results with additional context
    const searchResults = await this.enrichSearchResults(
      embeddingResults,
      repositoryId,
      filters
    );

    // Apply additional filters
    const filteredResults = this.applyFilters(searchResults, filters);

    // Paginate results
    const paginatedResults = filteredResults.slice(offset, offset + limit);
    const hasMore = filteredResults.length > offset + limit;

    return {
      results: paginatedResults,
      total: filteredResults.length,
      hasMore,
    };
  }

  /**
   * Enrich embedding results with additional context from database
   */
  private async enrichSearchResults(
    embeddingResults: EmbeddingResult[],
    repositoryId: number,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const embedding of embeddingResults) {
      try {
        let searchResult: SearchResult | null = null;

        switch (embedding.contentType) {
          case 'commit':
            searchResult = await this.enrichCommitResult(embedding, repositoryId);
            break;
          case 'comment':
            searchResult = await this.enrichCommentResult(embedding, repositoryId);
            break;
          case 'pr':
            searchResult = await this.enrichPRResult(embedding, repositoryId);
            break;
        }

        if (searchResult) {
          results.push(searchResult);
        }
      } catch (error) {
        console.error(`Error enriching result for ${embedding.contentId}:`, error);
        // Continue with other results
      }
    }

    return results;
  }

  /**
   * Enrich commit embedding result with commit details
   */
  private async enrichCommitResult(
    embedding: EmbeddingResult,
    repositoryId: number
  ): Promise<SearchResult | null> {
    const commit = await prisma.commit.findUnique({
      where: { sha: embedding.contentId },
      include: {
        fileChanges: {
          select: { filePath: true },
        },
      },
    });

    if (!commit) return null;

    return {
      id: embedding.contentId,
      type: 'commit',
      title: this.truncateText(commit.message, 100),
      content: commit.message,
      snippet: this.extractSnippet(embedding.contentText, 200),
      similarity: embedding.similarity || 0,
      timestamp: commit.timestamp,
      author: commit.authorName,
      filePaths: commit.fileChanges.map(fc => fc.filePath),
      url: `/dashboard/commits/${commit.sha}`,
    };
  }

  /**
   * Enrich comment embedding result (placeholder for future implementation)
   */
  private async enrichCommentResult(
    embedding: EmbeddingResult,
    repositoryId: number
  ): Promise<SearchResult | null> {
    // This would be implemented when we add support for code comments
    return {
      id: embedding.contentId,
      type: 'comment',
      title: 'Code Comment',
      content: embedding.contentText,
      snippet: this.extractSnippet(embedding.contentText, 200),
      similarity: embedding.similarity || 0,
    };
  }

  /**
   * Enrich PR embedding result (placeholder for future implementation)
   */
  private async enrichPRResult(
    embedding: EmbeddingResult,
    repositoryId: number
  ): Promise<SearchResult | null> {
    // This would be implemented when we add support for PR data
    return {
      id: embedding.contentId,
      type: 'pr',
      title: 'Pull Request',
      content: embedding.contentText,
      snippet: this.extractSnippet(embedding.contentText, 200),
      similarity: embedding.similarity || 0,
    };
  }

  /**
   * Apply additional filters to search results
   */
  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    let filtered = results;

    // Filter by date range
    if (filters.dateRange) {
      filtered = filtered.filter(result => {
        if (!result.timestamp) return false;
        return result.timestamp >= filters.dateRange!.from && 
               result.timestamp <= filters.dateRange!.to;
      });
    }

    // Filter by authors
    if (filters.authors && filters.authors.length > 0) {
      filtered = filtered.filter(result => 
        result.author && filters.authors!.includes(result.author)
      );
    }

    // Filter by file paths
    if (filters.filePaths && filters.filePaths.length > 0) {
      filtered = filtered.filter(result => {
        if (!result.filePaths) return false;
        return result.filePaths.some(path => 
          filters.filePaths!.some(filterPath => path.includes(filterPath))
        );
      });
    }

    return filtered;
  }

  /**
   * Extract a snippet from content around relevant keywords
   */
  private extractSnippet(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // For now, just truncate from the beginning
    // In a more sophisticated implementation, we could find the most relevant part
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get search suggestions based on repository content
   */
  async getSearchSuggestions(
    repositoryId: number,
    query: string,
    limit: number = 5
  ): Promise<string[]> {
    // Get common terms from commit messages
    const commits = await prisma.commit.findMany({
      where: { 
        repositoryId,
        message: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: { message: true },
      take: 100,
    });

    // Extract keywords and return suggestions
    const suggestions = new Set<string>();
    const words = query.toLowerCase().split(' ');
    
    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      words.forEach(word => {
        if (word.length > 2 && message.includes(word)) {
          // Find phrases containing the word
          const sentences = message.split(/[.!?]+/);
          sentences.forEach(sentence => {
            if (sentence.includes(word)) {
              const cleanSentence = sentence.trim();
              if (cleanSentence.length > query.length && cleanSentence.length < 100) {
                suggestions.add(cleanSentence);
              }
            }
          });
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Initialize embeddings for a repository
   */
  async initializeRepositoryEmbeddings(repositoryId: number): Promise<void> {
    const hasEmbeddings = await this.embeddingGenerator.hasEmbeddings(repositoryId);
    
    if (!hasEmbeddings) {
      console.log(`Generating embeddings for repository ${repositoryId}...`);
      await this.embeddingGenerator.generateCommitEmbeddings(repositoryId);
      console.log(`Embeddings generated for repository ${repositoryId}`);
    }
  }

  /**
   * Update embeddings for new commits
   */
  async updateEmbeddings(repositoryId: number): Promise<void> {
    // Get the latest embedding timestamp
    const latestEmbedding = await prisma.embedding.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' },
    });

    // Get commits newer than the latest embedding
    const newCommits = await prisma.commit.findMany({
      where: {
        repositoryId,
        ...(latestEmbedding && {
          createdAt: { gt: latestEmbedding.createdAt },
        }),
      },
      select: {
        sha: true,
        message: true,
        authorName: true,
      },
    });

    if (newCommits.length > 0) {
      const contents = newCommits.map(commit => ({
        contentType: 'commit' as const,
        contentId: commit.sha,
        contentText: `${commit.message} (by ${commit.authorName})`,
        repositoryId,
      }));

      await this.embeddingGenerator.generateAndStoreEmbeddings(contents);
      console.log(`Updated embeddings for ${newCommits.length} new commits`);
    }
  }
}