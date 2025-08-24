import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StoryCacheService } from '@/lib/services/story-cache';
import { FileStory } from '@/lib/services/story-generator';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    fileStory: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

describe('StoryCacheService', () => {
  let storyCacheService: StoryCacheService;
  let mockPrisma: any;

  const mockFileStory: FileStory = {
    filePath: 'src/components/Button.tsx',
    story: 'This is the story of Button component',
    sections: {
      creation: 'Button was created for UI consistency',
      evolution: 'Component evolved through multiple iterations',
      keyChanges: ['Initial implementation', 'Styling improvements'],
      currentState: 'Currently stable and well-maintained',
      recommendations: ['Add more tests', 'Consider accessibility']
    },
    generatedAt: new Date('2024-01-15T10:00:00Z')
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    storyCacheService = new StoryCacheService();
    
    // Get the mocked prisma
    const { prisma } = await import('@/lib/prisma');
    mockPrisma = vi.mocked(prisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCachedStory', () => {
    it('should return cached story when available and not expired', async () => {
      const mockCachedData = {
        repositoryId: 1,
        filePath: 'src/components/Button.tsx',
        storyContent: JSON.stringify({
          story: mockFileStory.story,
          sections: mockFileStory.sections
        }),
        generatedAt: new Date('2024-01-15T10:00:00Z')
      };

      mockPrisma.fileStory.findUnique.mockResolvedValue(mockCachedData);

      const result = await storyCacheService.getCachedStory(1, 'src/components/Button.tsx');

      expect(result).toBeDefined();
      expect(result?.filePath).toBe('src/components/Button.tsx');
      expect(result?.story).toBe(mockFileStory.story);
      expect(result?.sections.creation).toBe(mockFileStory.sections.creation);
      expect(mockPrisma.fileStory.findUnique).toHaveBeenCalledWith({
        where: {
          repositoryId_filePath: {
            repositoryId: 1,
            filePath: 'src/components/Button.tsx'
          }
        }
      });
    });

    it('should return null when no cached story exists', async () => {
      mockPrisma.fileStory.findUnique.mockResolvedValue(null);

      const result = await storyCacheService.getCachedStory(1, 'src/components/Button.tsx');

      expect(result).toBeNull();
    });

    it('should return null and delete expired cache', async () => {
      const expiredDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      const mockCachedData = {
        repositoryId: 1,
        filePath: 'src/components/Button.tsx',
        storyContent: JSON.stringify({
          story: mockFileStory.story,
          sections: mockFileStory.sections
        }),
        generatedAt: expiredDate
      };

      mockPrisma.fileStory.findUnique.mockResolvedValue(mockCachedData);
      mockPrisma.fileStory.delete.mockResolvedValue(mockCachedData);

      const result = await storyCacheService.getCachedStory(1, 'src/components/Button.tsx');

      expect(result).toBeNull();
      expect(mockPrisma.fileStory.delete).toHaveBeenCalledWith({
        where: {
          repositoryId_filePath: {
            repositoryId: 1,
            filePath: 'src/components/Button.tsx'
          }
        }
      });
    });

    it('should respect custom maxAge option', async () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const mockCachedData = {
        repositoryId: 1,
        filePath: 'src/components/Button.tsx',
        storyContent: JSON.stringify({
          story: mockFileStory.story,
          sections: mockFileStory.sections
        }),
        generatedAt: recentDate
      };

      mockPrisma.fileStory.findUnique.mockResolvedValue(mockCachedData);

      // With 1 hour maxAge, should be expired
      const result = await storyCacheService.getCachedStory(
        1, 
        'src/components/Button.tsx',
        { maxAge: 60 * 60 * 1000 } // 1 hour
      );

      expect(result).toBeNull();
    });

    it('should return null when forceRefresh is true', async () => {
      const result = await storyCacheService.getCachedStory(
        1, 
        'src/components/Button.tsx',
        { forceRefresh: true }
      );

      expect(result).toBeNull();
      expect(mockPrisma.fileStory.findUnique).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.fileStory.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await storyCacheService.getCachedStory(1, 'src/components/Button.tsx');

      expect(result).toBeNull();
    });

    it('should handle malformed cached data', async () => {
      const mockCachedData = {
        repositoryId: 1,
        filePath: 'src/components/Button.tsx',
        storyContent: 'invalid json',
        generatedAt: new Date('2024-01-15T10:00:00Z')
      };

      mockPrisma.fileStory.findUnique.mockResolvedValue(mockCachedData);

      const result = await storyCacheService.getCachedStory(1, 'src/components/Button.tsx');

      expect(result).toBeDefined();
      expect(result?.story).toBe('invalid json');
      expect(result?.sections.creation).toBe('');
    });
  });

  describe('cacheStory', () => {
    it('should cache a story successfully', async () => {
      mockPrisma.fileStory.upsert.mockResolvedValue({});

      await storyCacheService.cacheStory(1, mockFileStory);

      expect(mockPrisma.fileStory.upsert).toHaveBeenCalledWith({
        where: {
          repositoryId_filePath: {
            repositoryId: 1,
            filePath: 'src/components/Button.tsx'
          }
        },
        update: {
          storyContent: JSON.stringify({
            story: mockFileStory.story,
            sections: mockFileStory.sections
          }),
          generatedAt: mockFileStory.generatedAt
        },
        create: {
          repositoryId: 1,
          filePath: 'src/components/Button.tsx',
          storyContent: JSON.stringify({
            story: mockFileStory.story,
            sections: mockFileStory.sections
          }),
          generatedAt: mockFileStory.generatedAt
        }
      });
    });

    it('should handle caching errors gracefully', async () => {
      mockPrisma.fileStory.upsert.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(storyCacheService.cacheStory(1, mockFileStory)).resolves.not.toThrow();
    });
  });

  describe('deleteCachedStory', () => {
    it('should delete cached story successfully', async () => {
      mockPrisma.fileStory.delete.mockResolvedValue({});

      await storyCacheService.deleteCachedStory(1, 'src/components/Button.tsx');

      expect(mockPrisma.fileStory.delete).toHaveBeenCalledWith({
        where: {
          repositoryId_filePath: {
            repositoryId: 1,
            filePath: 'src/components/Button.tsx'
          }
        }
      });
    });

    it('should handle deletion errors gracefully', async () => {
      mockPrisma.fileStory.delete.mockRejectedValue(new Error('Record not found'));

      // Should not throw
      await expect(
        storyCacheService.deleteCachedStory(1, 'src/components/Button.tsx')
      ).resolves.not.toThrow();
    });
  });

  describe('getCachedStoriesForRepository', () => {
    it('should return all cached stories for repository', async () => {
      const mockCachedStories = [
        {
          filePath: 'src/components/Button.tsx',
          storyContent: JSON.stringify({
            story: 'Button story',
            sections: { creation: 'Button created', evolution: '', keyChanges: [], currentState: '', recommendations: [] }
          }),
          generatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          filePath: 'src/components/Input.tsx',
          storyContent: JSON.stringify({
            story: 'Input story',
            sections: { creation: 'Input created', evolution: '', keyChanges: [], currentState: '', recommendations: [] }
          }),
          generatedAt: new Date('2024-01-14T10:00:00Z')
        }
      ];

      mockPrisma.fileStory.findMany.mockResolvedValue(mockCachedStories);

      const result = await storyCacheService.getCachedStoriesForRepository(1);

      expect(result).toHaveLength(2);
      expect(result[0].filePath).toBe('src/components/Button.tsx');
      expect(result[1].filePath).toBe('src/components/Input.tsx');
      expect(mockPrisma.fileStory.findMany).toHaveBeenCalledWith({
        where: { repositoryId: 1 },
        orderBy: { generatedAt: 'desc' }
      });
    });

    it('should handle database errors and return empty array', async () => {
      mockPrisma.fileStory.findMany.mockRejectedValue(new Error('Database error'));

      const result = await storyCacheService.getCachedStoriesForRepository(1);

      expect(result).toEqual([]);
    });
  });

  describe('clearRepositoryCache', () => {
    it('should clear all cached stories for repository', async () => {
      mockPrisma.fileStory.deleteMany.mockResolvedValue({ count: 5 });

      await storyCacheService.clearRepositoryCache(1);

      expect(mockPrisma.fileStory.deleteMany).toHaveBeenCalledWith({
        where: { repositoryId: 1 }
      });
    });
  });

  describe('clearExpiredCache', () => {
    it('should clear expired cache entries', async () => {
      mockPrisma.fileStory.deleteMany.mockResolvedValue({ count: 3 });

      const result = await storyCacheService.clearExpiredCache(24 * 60 * 60 * 1000); // 1 day

      expect(result).toBe(3);
      expect(mockPrisma.fileStory.deleteMany).toHaveBeenCalledWith({
        where: {
          generatedAt: {
            lt: expect.any(Date)
          }
        }
      });
    });

    it('should handle errors and return 0', async () => {
      mockPrisma.fileStory.deleteMany.mockRejectedValue(new Error('Database error'));

      const result = await storyCacheService.clearExpiredCache();

      expect(result).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const mockStories = [
        { generatedAt: new Date('2024-01-10T10:00:00Z') },
        { generatedAt: new Date('2024-01-15T10:00:00Z') },
        { generatedAt: new Date('2024-01-20T10:00:00Z') }
      ];

      mockPrisma.fileStory.findMany.mockResolvedValue(mockStories);

      const result = await storyCacheService.getCacheStats(1);

      expect(result.totalStories).toBe(3);
      expect(result.oldestStory).toEqual(new Date('2024-01-10T10:00:00Z'));
      expect(result.newestStory).toEqual(new Date('2024-01-20T10:00:00Z'));
      expect(result.averageAge).toBeGreaterThan(0);
    });

    it('should handle empty repository', async () => {
      mockPrisma.fileStory.findMany.mockResolvedValue([]);

      const result = await storyCacheService.getCacheStats(1);

      expect(result.totalStories).toBe(0);
      expect(result.oldestStory).toBeNull();
      expect(result.newestStory).toBeNull();
      expect(result.averageAge).toBe(0);
    });
  });

  describe('shouldRefreshStory', () => {
    it('should return true when no cached story exists', async () => {
      mockPrisma.fileStory.findUnique.mockResolvedValue(null);

      const result = await storyCacheService.shouldRefreshStory(
        1,
        'src/components/Button.tsx',
        new Date()
      );

      expect(result).toBe(true);
    });

    it('should return true when file was modified after story generation', async () => {
      const storyDate = new Date('2024-01-10T10:00:00Z');
      const fileModifiedDate = new Date('2024-01-15T10:00:00Z');

      mockPrisma.fileStory.findUnique.mockResolvedValue({
        generatedAt: storyDate
      });

      const result = await storyCacheService.shouldRefreshStory(
        1,
        'src/components/Button.tsx',
        fileModifiedDate
      );

      expect(result).toBe(true);
    });

    it('should return false when story is newer than file modification', async () => {
      const storyDate = new Date('2024-01-15T10:00:00Z');
      const fileModifiedDate = new Date('2024-01-10T10:00:00Z');

      mockPrisma.fileStory.findUnique.mockResolvedValue({
        generatedAt: storyDate
      });

      const result = await storyCacheService.shouldRefreshStory(
        1,
        'src/components/Button.tsx',
        fileModifiedDate
      );

      expect(result).toBe(false);
    });
  });

  describe('batchCacheStories', () => {
    it('should cache multiple stories in a transaction', async () => {
      const stories = [mockFileStory, { ...mockFileStory, filePath: 'src/components/Input.tsx' }];
      
      mockPrisma.$transaction.mockResolvedValue([]);

      await storyCacheService.batchCacheStories(1, stories);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            where: expect.objectContaining({
              repositoryId_filePath: expect.objectContaining({
                repositoryId: 1,
                filePath: 'src/components/Button.tsx'
              })
            })
          }),
          expect.objectContaining({
            where: expect.objectContaining({
              repositoryId_filePath: expect.objectContaining({
                repositoryId: 1,
                filePath: 'src/components/Input.tsx'
              })
            })
          })
        ])
      );
    });

    it('should handle batch caching errors gracefully', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      // Should not throw
      await expect(
        storyCacheService.batchCacheStories(1, [mockFileStory])
      ).resolves.not.toThrow();
    });
  });
});