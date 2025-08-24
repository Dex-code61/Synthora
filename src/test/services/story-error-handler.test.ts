import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoryErrorHandler } from '@/lib/services/story-error-handler';
import { FileMetrics } from '@/types/analysis';
import { Commit, FileChange } from '@/types/git';

describe('StoryErrorHandler', () => {
  let errorHandler: StoryErrorHandler;

  const mockFileMetrics: FileMetrics = {
    filePath: 'src/components/Button.tsx',
    commitCount: 15,
    authorCount: 3,
    riskScore: 0.3,
    totalChanges: 45,
    bugCommits: 2,
    lastModified: new Date('2024-01-15'),
    authors: ['Alice', 'Bob', 'Charlie']
  };

  const mockFileHistory: FileChange[] = [
    {
      filePath: 'src/components/Button.tsx',
      changeType: 'added',
      insertions: 50,
      deletions: 0
    },
    {
      filePath: 'src/components/Button.tsx',
      changeType: 'modified',
      insertions: 10,
      deletions: 5
    }
  ];

  const mockCommits: Commit[] = [
    {
      sha: 'abc123',
      author: 'Alice',
      email: 'alice@example.com',
      message: 'Add Button component with accessibility features',
      timestamp: new Date('2024-01-01'),
      filesChanged: 1,
      insertions: 50,
      deletions: 0,
      files: [mockFileHistory[0]]
    },
    {
      sha: 'def456',
      author: 'Bob',
      email: 'bob@example.com',
      message: 'Fix button styling issue and improve hover states',
      timestamp: new Date('2024-01-15'),
      filesChanged: 1,
      insertions: 10,
      deletions: 5,
      files: [mockFileHistory[1]]
    }
  ];

  beforeEach(() => {
    errorHandler = new StoryErrorHandler();
  });

  describe('classifyError', () => {
    it('should classify rate limit errors correctly', () => {
      const error = {
        code: 'rate_limit_exceeded',
        message: 'Rate limit exceeded',
        headers: { 'retry-after': '60' }
      };

      const result = errorHandler.classifyError(error);

      expect(result.type).toBe('rate_limit');
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBe(60);
    });

    it('should classify AI service errors correctly', () => {
      const error = {
        code: 'api_error',
        message: 'Internal server error'
      };

      const result = errorHandler.classifyError(error);

      expect(result.type).toBe('ai_service');
      expect(result.retryable).toBe(true);
    });

    it('should classify network errors correctly', () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };

      const result = errorHandler.classifyError(error);

      expect(result.type).toBe('network');
      expect(result.retryable).toBe(true);
    });

    it('should classify validation errors correctly', () => {
      const error = {
        code: 'invalid_request_error',
        message: 'Invalid request'
      };

      const result = errorHandler.classifyError(error);

      expect(result.type).toBe('validation');
      expect(result.retryable).toBe(false);
    });

    it('should classify HTTP status errors correctly', () => {
      const error = {
        status: 500,
        message: 'Internal server error'
      };

      const result = errorHandler.classifyError(error);

      expect(result.type).toBe('ai_service');
      expect(result.retryable).toBe(true);
    });

    it('should classify 429 status as rate limit', () => {
      const error = {
        status: 429,
        message: 'Too many requests'
      };

      const result = errorHandler.classifyError(error);

      expect(result.type).toBe('rate_limit');
      expect(result.retryable).toBe(true);
    });

    it('should classify unknown errors', () => {
      const error = new Error('Unknown error');

      const result = errorHandler.classifyError(error);

      expect(result.type).toBe('unknown');
      expect(result.retryable).toBe(true);
    });

    it('should handle null/undefined errors', () => {
      const result = errorHandler.classifyError(null);

      expect(result.type).toBe('unknown');
      expect(result.retryable).toBe(false);
    });
  });

  describe('generateEnhancedFallbackStory', () => {
    it('should generate enhanced fallback story with all sections', () => {
      const result = errorHandler.generateEnhancedFallbackStory(
        'src/components/Button.tsx',
        mockFileHistory,
        mockFileMetrics,
        mockCommits
      );

      expect(result.filePath).toBe('src/components/Button.tsx');
      expect(result.story).toContain('Button.tsx');
      expect(result.sections.creation).toContain('Button.tsx');
      expect(result.sections.evolution).toContain('15 commits');
      expect(result.sections.keyChanges).toBeInstanceOf(Array);
      expect(result.sections.currentState).toContain('risk score');
      expect(result.sections.recommendations).toBeInstanceOf(Array);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should identify file types correctly', () => {
      const pythonResult = errorHandler.generateEnhancedFallbackStory(
        'scripts/deploy.py',
        mockFileHistory,
        { ...mockFileMetrics, filePath: 'scripts/deploy.py' },
        mockCommits
      );

      expect(pythonResult.story).toContain('Python');
    });

    it('should analyze commit patterns correctly', () => {
      const commitsWithFeatures = [
        ...mockCommits,
        {
          sha: 'ghi789',
          author: 'Charlie',
          email: 'charlie@example.com',
          message: 'Add new feature for button animations',
          timestamp: new Date('2024-01-20'),
          filesChanged: 1,
          insertions: 20,
          deletions: 0,
          files: [mockFileHistory[0]]
        }
      ];

      const result = errorHandler.generateEnhancedFallbackStory(
        'src/components/Button.tsx',
        mockFileHistory,
        mockFileMetrics,
        commitsWithFeatures
      );

      expect(result.sections.keyChanges.some(change => 
        change.includes('feature')
      )).toBe(true);
    });

    it('should generate appropriate recommendations based on metrics', () => {
      const highRiskMetrics = {
        ...mockFileMetrics,
        riskScore: 0.8,
        authorCount: 1,
        bugCommits: 10,
        commitCount: 20
      };

      // Create commits with single author to trigger knowledge silo detection
      const singleAuthorCommits = [
        {
          ...mockCommits[0],
          author: 'Alice'
        },
        {
          ...mockCommits[1],
          author: 'Alice'
        }
      ];

      const result = errorHandler.generateEnhancedFallbackStory(
        'src/components/Button.tsx',
        mockFileHistory,
        highRiskMetrics,
        singleAuthorCommits
      );
      
      expect(result.sections.recommendations.some(rec => 
        /refactor|complexity|risk/i.test(rec)
      )).toBe(true);
      expect(result.sections.recommendations.some(rec => 
        /review|team|knowledge/i.test(rec)
      )).toBe(true);
      expect(result.sections.recommendations.some(rec => 
        /test/i.test(rec)
      )).toBe(true);
    });
  });

  describe('generateBasicFallbackStory', () => {
    it('should generate basic fallback story', () => {
      const result = errorHandler.generateBasicFallbackStory(
        'src/components/Button.tsx',
        mockFileMetrics
      );

      expect(result.filePath).toBe('src/components/Button.tsx');
      expect(result.story).toContain('Button.tsx');
      expect(result.story).toContain('15 times');
      expect(result.story).toContain('3 different contributors');
      expect(result.sections.creation).toBeDefined();
      expect(result.sections.recommendations).toHaveLength(2);
    });
  });

  describe('executeWithRetry', () => {
    it('should execute operation successfully on first try', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce({ code: 'api_error' }) // Use api_error instead of rate_limit to avoid retry-after delay
        .mockRejectedValueOnce({ code: 'api_error' })
        .mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(mockOperation, {
        maxRetries: 3,
        retryDelay: 10 // Short delay for testing
      });

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = vi.fn().mockRejectedValue({
        code: 'invalid_request_error'
      });

      await expect(
        errorHandler.executeWithRetry(mockOperation)
      ).rejects.toMatchObject({
        code: 'invalid_request_error'
      });

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries limit', async () => {
      const mockOperation = vi.fn().mockRejectedValue({
        code: 'api_error'
      });

      await expect(
        errorHandler.executeWithRetry(mockOperation, {
          maxRetries: 2,
          retryDelay: 10
        })
      ).rejects.toMatchObject({
        code: 'api_error'
      });

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should use retry-after header when available', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce({
          code: 'rate_limit_exceeded',
          headers: { 'retry-after': '1' }
        })
        .mockResolvedValue('success');

      const startTime = Date.now();
      const result = await errorHandler.executeWithRetry(mockOperation);
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000); // At least 1 second delay
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return appropriate messages for different error types', () => {
      const testCases = [
        {
          error: { type: 'rate_limit' as const, message: '', retryable: true },
          expected: /busy.*try again/i
        },
        {
          error: { type: 'ai_service' as const, message: '', retryable: true },
          expected: /unavailable.*basic story/i
        },
        {
          error: { type: 'network' as const, message: '', retryable: true },
          expected: /network.*connection/i
        },
        {
          error: { type: 'validation' as const, message: '', retryable: false },
          expected: /invalid.*file path/i
        },
        {
          error: { type: 'unknown' as const, message: '', retryable: true },
          expected: /unexpected.*fallback/i
        }
      ];

      testCases.forEach(({ error, expected }) => {
        const message = errorHandler.getUserFriendlyMessage(error);
        expect(message).toMatch(expected);
      });
    });
  });

  describe('private helper methods', () => {
    it('should calculate timespan correctly', () => {
      // Test through the enhanced fallback story generation
      const oldCommits = [
        {
          ...mockCommits[0],
          timestamp: new Date('2023-01-01')
        },
        {
          ...mockCommits[1],
          timestamp: new Date('2024-01-01')
        }
      ];

      const result = errorHandler.generateEnhancedFallbackStory(
        'src/components/Button.tsx',
        mockFileHistory,
        mockFileMetrics,
        oldCommits
      );

      // Should contain some timespan reference
      expect(result.sections.evolution).toMatch(/\d+\s+(days|months|years)/);
    });

    it('should identify creation context from commit messages', () => {
      const initialCommit = {
        ...mockCommits[0],
        message: 'Initial commit: Add Button component'
      };

      const result = errorHandler.generateEnhancedFallbackStory(
        'src/components/Button.tsx',
        mockFileHistory,
        mockFileMetrics,
        [initialCommit]
      );

      expect(result.sections.creation).toContain('initial');
    });

    it('should analyze author patterns correctly', () => {
      const singleAuthorCommits = [
        {
          ...mockCommits[0],
          author: 'Alice'
        },
        {
          ...mockCommits[1],
          author: 'Alice'
        }
      ];

      const result = errorHandler.generateEnhancedFallbackStory(
        'src/components/Button.tsx',
        mockFileHistory,
        { ...mockFileMetrics, authorCount: 1 },
        singleAuthorCommits
      );

      expect(result.sections.recommendations.some(rec => 
        /review.*team.*knowledge/i.test(rec) || /knowledge.*silo/i.test(rec)
      )).toBe(true);
    });
  });
});