import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@app/api/repositories/[id]/files/[...path]/story/route';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    repository: {
      findFirst: vi.fn(),
    },
    fileMetrics: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('@/lib/services/story-generator', () => ({
  storyGenerator: {
    generateFileStory: vi.fn(),
  },
}));

vi.mock('@/lib/services/story-cache', () => ({
  storyCacheService: {
    getCachedStory: vi.fn(),
    cacheStory: vi.fn(),
    deleteCachedStory: vi.fn(),
  },
}));

vi.mock('@/lib/services/git-analyzer', () => ({
  GitAnalyzer: vi.fn().mockImplementation(() => ({
    getFileHistory: vi.fn(),
    getCommitHistory: vi.fn(),
  })),
}));

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { storyGenerator } from '@/lib/services/story-generator';
import { storyCacheService } from '@/lib/services/story-cache';
import { GitAnalyzer } from '@/lib/services/git-analyzer';

const mockPrisma = prisma as any;
const mockAuth = auth as any;
const mockHeaders = headers as any;
const mockStoryGenerator = storyGenerator as any;
const mockStoryCacheService = storyCacheService as any;
const MockGitAnalyzer = GitAnalyzer as any;

describe('/api/repositories/[id]/files/[...path]/story', () => {
  const mockSession = {
    user: { id: 'user-1' },
  };

  const mockRepository = {
    id: 1,
    name: 'test-repo',
    path: '/path/to/repo',
    userId: 'user-1',
  };

  const mockFileStory = {
    filePath: 'src/components/test.tsx',
    summary: 'Test component file',
    keyChanges: ['Initial creation', 'Added props'],
    riskFactors: ['Low complexity'],
    recommendations: ['Add tests'],
    lastAnalyzed: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue({});
    mockAuth.api.getSession.mockResolvedValue(mockSession);
    mockPrisma.repository.findFirst.mockResolvedValue(mockRepository);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('should return cached story when available', async () => {
      mockStoryCacheService.getCachedStory.mockResolvedValue(mockFileStory);

      const request = new NextRequest('http://localhost/api/repositories/1/files/src/components/test.tsx/story');
      const params = Promise.resolve({ id: '1', path: ['src', 'components', 'test.tsx'] });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockFileStory);
      expect(data.message).toBe('Story retrieved from cache');
    });

    it('should generate new story when cache is empty', async () => {
      mockStoryCacheService.getCachedStory.mockResolvedValue(null);
      mockStoryGenerator.generateFileStory.mockResolvedValue(mockFileStory);
      
      const mockGitAnalyzer = {
        getFileHistory: vi.fn().mockResolvedValue([]),
        getCommitHistory: vi.fn().mockResolvedValue([]),
      };
      MockGitAnalyzer.mockImplementation(() => mockGitAnalyzer);

      mockPrisma.fileMetrics.findUnique.mockResolvedValue({
        id: 1,
        repositoryId: 1,
        filePath: 'src/components/test.tsx',
        commitCount: 5,
        authorCount: 2,
        riskScore: 0.3,
        totalChanges: 100,
        bugCommits: 1,
        lastModified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/repositories/1/files/src/components/test.tsx/story');
      const params = Promise.resolve({ id: '1', path: ['src', 'components', 'test.tsx'] });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockFileStory);
      expect(data.message).toBe('Story generated successfully');
      expect(mockStoryCacheService.cacheStory).toHaveBeenCalledWith(1, mockFileStory);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/repositories/1/files/src/test.tsx/story');
      const params = Promise.resolve({ id: '1', path: ['src', 'test.tsx'] });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when repository is not found', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/repositories/999/files/src/test.tsx/story');
      const params = Promise.resolve({ id: '999', path: ['src', 'test.tsx'] });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Repository not found or access denied');
    });

    it('should return 400 for invalid repository ID', async () => {
      const request = new NextRequest('http://localhost/api/repositories/invalid/files/src/test.tsx/story');
      const params = Promise.resolve({ id: 'invalid', path: ['src', 'test.tsx'] });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid repository ID');
    });

    it('should return 400 when file path is empty', async () => {
      const request = new NextRequest('http://localhost/api/repositories/1/files/story');
      const params = Promise.resolve({ id: '1', path: [] });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('File path is required');
    });
  });

  describe('POST', () => {
    it('should force generate new story', async () => {
      mockStoryGenerator.generateFileStory.mockResolvedValue(mockFileStory);
      
      const mockGitAnalyzer = {
        getFileHistory: vi.fn().mockResolvedValue([]),
        getCommitHistory: vi.fn().mockResolvedValue([]),
      };
      MockGitAnalyzer.mockImplementation(() => mockGitAnalyzer);

      mockPrisma.fileMetrics.findUnique.mockResolvedValue({
        id: 1,
        repositoryId: 1,
        filePath: 'src/components/test.tsx',
        commitCount: 5,
        authorCount: 2,
        riskScore: 0.3,
        totalChanges: 100,
        bugCommits: 1,
        lastModified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/repositories/1/files/src/components/test.tsx/story', {
        method: 'POST',
      });
      const params = Promise.resolve({ id: '1', path: ['src', 'components', 'test.tsx'] });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockFileStory);
      expect(data.message).toBe('Story generated and cached successfully');
      expect(mockStoryCacheService.cacheStory).toHaveBeenCalledWith(1, mockFileStory);
    });
  });

  describe('DELETE', () => {
    it('should delete cached story successfully', async () => {
      const request = new NextRequest('http://localhost/api/repositories/1/files/src/test.tsx/story', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: '1', path: ['src', 'test.tsx'] });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Cached story deleted successfully');
      expect(mockStoryCacheService.deleteCachedStory).toHaveBeenCalledWith(1, 'src/test.tsx');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/repositories/1/files/src/test.tsx/story', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: '1', path: ['src', 'test.tsx'] });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });
});