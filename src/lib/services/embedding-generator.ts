import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

export interface EmbeddingContent {
  contentType: 'commit' | 'comment' | 'pr';
  contentId: string;
  contentText: string;
  repositoryId: number;
}

export interface EmbeddingResult {
  id: number;
  contentType: string;
  contentId: string;
  contentText: string;
  embedding: number[];
  similarity?: number;
}

export class EmbeddingGenerator {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate embedding for a single text content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate and store embeddings for multiple content items
   */
  async generateAndStoreEmbeddings(contents: EmbeddingContent[]): Promise<void> {
    const batchSize = 100; // OpenAI API limit
    
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      
      try {
        // Generate embeddings for the batch
        const texts = batch.map(content => content.contentText);
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: texts,
          encoding_format: 'float',
        });

        // Store embeddings in database
        const embeddingData = batch.map((content, index) => ({
          repositoryId: content.repositoryId,
          contentType: content.contentType,
          contentId: content.contentId,
          contentText: content.contentText,
          embedding: response.data[index].embedding,
        }));

        await prisma.embedding.createMany({
          data: embeddingData,
          skipDuplicates: true,
        });

        console.log(`Stored ${embeddingData.length} embeddings for batch ${Math.floor(i / batchSize) + 1}`);
      } catch (error) {
        console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Continue with next batch instead of failing completely
      }
    }
  }

  /**
   * Generate embeddings for all commits in a repository
   */
  async generateCommitEmbeddings(repositoryId: number): Promise<void> {
    const commits = await prisma.commit.findMany({
      where: { repositoryId },
      select: {
        sha: true,
        message: true,
        authorName: true,
        timestamp: true,
      },
    });

    const contents: EmbeddingContent[] = commits.map(commit => ({
      contentType: 'commit' as const,
      contentId: commit.sha,
      contentText: `${commit.message} (by ${commit.authorName})`,
      repositoryId,
    }));

    await this.generateAndStoreEmbeddings(contents);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Search for similar embeddings using cosine similarity
   */
  async searchSimilar(
    queryText: string,
    repositoryId: number,
    options: {
      limit?: number;
      threshold?: number;
      contentTypes?: string[];
    } = {}
  ): Promise<EmbeddingResult[]> {
    const { limit = 10, threshold = 0.7, contentTypes } = options;

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(queryText);

    // Get all embeddings for the repository
    const embeddings = await prisma.embedding.findMany({
      where: {
        repositoryId,
        ...(contentTypes && { contentType: { in: contentTypes } }),
      },
    });

    // Calculate similarities
    const results: EmbeddingResult[] = embeddings
      .map(embedding => ({
        ...embedding,
        similarity: this.cosineSimilarity(queryEmbedding, embedding.embedding),
      }))
      .filter(result => result.similarity! >= threshold)
      .sort((a, b) => b.similarity! - a.similarity!)
      .slice(0, limit);

    return results;
  }

  /**
   * Delete all embeddings for a repository
   */
  async deleteRepositoryEmbeddings(repositoryId: number): Promise<void> {
    await prisma.embedding.deleteMany({
      where: { repositoryId },
    });
  }

  /**
   * Check if embeddings exist for a repository
   */
  async hasEmbeddings(repositoryId: number): Promise<boolean> {
    const count = await prisma.embedding.count({
      where: { repositoryId },
    });
    return count > 0;
  }
}