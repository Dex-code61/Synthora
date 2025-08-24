import { prisma } from '@/lib/prisma';
import { FileStory } from './story-generator';

export interface CacheOptions {
  maxAge?: number; // in milliseconds
  forceRefresh?: boolean;
}

export class StoryCacheService {
  private defaultMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  /**
   * Get cached story for a file
   */
  async getCachedStory(
    repositoryId: number,
    filePath: string,
    options: CacheOptions = {}
  ): Promise<FileStory | null> {
    if (options.forceRefresh) {
      return null;
    }

    try {
      const cached = await prisma.fileStory.findUnique({
        where: {
          repositoryId_filePath: {
            repositoryId,
            filePath
          }
        }
      });

      if (!cached) {
        return null;
      }

      // Check if cache is expired
      const maxAge = options.maxAge || this.defaultMaxAge;
      const isExpired = Date.now() - cached.generatedAt.getTime() > maxAge;
      
      if (isExpired) {
        // Optionally clean up expired cache
        await this.deleteCachedStory(repositoryId, filePath);
        return null;
      }

      // Parse the cached story content
      return this.parseStoredStory(filePath, cached.storyContent, cached.generatedAt);
    } catch (error) {
      console.error('Error retrieving cached story:', error);
      return null;
    }
  }

  /**
   * Cache a generated story
   */
  async cacheStory(
    repositoryId: number,
    story: FileStory
  ): Promise<void> {
    try {
      const storyContent = JSON.stringify({
        story: story.story,
        sections: story.sections
      });

      await prisma.fileStory.upsert({
        where: {
          repositoryId_filePath: {
            repositoryId,
            filePath: story.filePath
          }
        },
        update: {
          storyContent,
          generatedAt: story.generatedAt
        },
        create: {
          repositoryId,
          filePath: story.filePath,
          storyContent,
          generatedAt: story.generatedAt
        }
      });
    } catch (error) {
      console.error('Error caching story:', error);
      // Don't throw - caching failures shouldn't break the main flow
    }
  }

  /**
   * Delete cached story for a specific file
   */
  async deleteCachedStory(repositoryId: number, filePath: string): Promise<void> {
    try {
      await prisma.fileStory.delete({
        where: {
          repositoryId_filePath: {
            repositoryId,
            filePath
          }
        }
      });
    } catch (error) {
      // Ignore errors if story doesn't exist
      if (error instanceof Error && !error.message.includes('Record to delete does not exist')) {
        console.error('Error deleting cached story:', error);
      }
    }
  }

  /**
   * Get all cached stories for a repository
   */
  async getCachedStoriesForRepository(repositoryId: number): Promise<FileStory[]> {
    try {
      const cached = await prisma.fileStory.findMany({
        where: { repositoryId },
        orderBy: { generatedAt: 'desc' }
      });

      return cached.map(story => 
        this.parseStoredStory(story.filePath, story.storyContent, story.generatedAt)
      );
    } catch (error) {
      console.error('Error retrieving cached stories for repository:', error);
      return [];
    }
  }

  /**
   * Clear all cached stories for a repository
   */
  async clearRepositoryCache(repositoryId: number): Promise<void> {
    try {
      await prisma.fileStory.deleteMany({
        where: { repositoryId }
      });
    } catch (error) {
      console.error('Error clearing repository cache:', error);
    }
  }

  /**
   * Clear expired cache entries across all repositories
   */
  async clearExpiredCache(maxAge: number = this.defaultMaxAge): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      
      const result = await prisma.fileStory.deleteMany({
        where: {
          generatedAt: {
            lt: cutoffDate
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics for a repository
   */
  async getCacheStats(repositoryId: number): Promise<{
    totalStories: number;
    oldestStory: Date | null;
    newestStory: Date | null;
    averageAge: number;
  }> {
    try {
      const stories = await prisma.fileStory.findMany({
        where: { repositoryId },
        select: { generatedAt: true }
      });

      if (stories.length === 0) {
        return {
          totalStories: 0,
          oldestStory: null,
          newestStory: null,
          averageAge: 0
        };
      }

      const dates = stories.map(s => s.generatedAt.getTime());
      const now = Date.now();
      
      return {
        totalStories: stories.length,
        oldestStory: new Date(Math.min(...dates)),
        newestStory: new Date(Math.max(...dates)),
        averageAge: (now - dates.reduce((sum, date) => sum + date, 0) / dates.length) / (1000 * 60 * 60 * 24) // in days
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalStories: 0,
        oldestStory: null,
        newestStory: null,
        averageAge: 0
      };
    }
  }

  /**
   * Check if a story needs refresh based on file's last modification
   */
  async shouldRefreshStory(
    repositoryId: number,
    filePath: string,
    fileLastModified: Date
  ): Promise<boolean> {
    try {
      const cached = await prisma.fileStory.findUnique({
        where: {
          repositoryId_filePath: {
            repositoryId,
            filePath
          }
        },
        select: { generatedAt: true }
      });

      if (!cached) {
        return true; // No cache, needs generation
      }

      // Refresh if file was modified after story was generated
      return fileLastModified > cached.generatedAt;
    } catch (error) {
      console.error('Error checking if story needs refresh:', error);
      return true; // Default to refresh on error
    }
  }

  /**
   * Parse stored story content back to FileStory format
   */
  private parseStoredStory(filePath: string, storyContent: string, generatedAt: Date): FileStory {
    try {
      const parsed = JSON.parse(storyContent);
      return {
        filePath,
        story: parsed.story || '',
        sections: {
          creation: parsed.sections?.creation || '',
          evolution: parsed.sections?.evolution || '',
          keyChanges: parsed.sections?.keyChanges || [],
          currentState: parsed.sections?.currentState || '',
          recommendations: parsed.sections?.recommendations || []
        },
        generatedAt
      };
    } catch (error) {
      // Fallback for malformed cache data
      return {
        filePath,
        story: storyContent,
        sections: {
          creation: '',
          evolution: '',
          keyChanges: [],
          currentState: '',
          recommendations: []
        },
        generatedAt
      };
    }
  }

  /**
   * Batch cache multiple stories
   */
  async batchCacheStories(repositoryId: number, stories: FileStory[]): Promise<void> {
    try {
      const operations = stories.map(story => {
        const storyContent = JSON.stringify({
          story: story.story,
          sections: story.sections
        });

        return prisma.fileStory.upsert({
          where: {
            repositoryId_filePath: {
              repositoryId,
              filePath: story.filePath
            }
          },
          update: {
            storyContent,
            generatedAt: story.generatedAt
          },
          create: {
            repositoryId,
            filePath: story.filePath,
            storyContent,
            generatedAt: story.generatedAt
          }
        });
      });

      await prisma.$transaction(operations);
    } catch (error) {
      console.error('Error batch caching stories:', error);
    }
  }
}

export const storyCacheService = new StoryCacheService();