import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StoryGenerator } from '@/lib/services/story-generator';
import { FileMetrics } from '@/types/analysis';
import { Commit, FileChange } from '@/types/git';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

// Mock the error handler
vi.mock('@/lib/services/story-error-handler', () => ({
  storyErrorHandler: {
    executeWithRetry: vi.fn(),
    classifyError: vi.fn(),
    generateEnhancedFallbackStory: vi.fn()
  }
}));

describe('StoryGenerator', () => {
  let storyGenerator: StoryGenerator;
  let mockCreate: any;
  let mockExecuteWithRetry: any;
  let mockClassifyError: any;
  let mockGenerateEnhancedFallbackStory: any;

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
      message: 'Add Button component',
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
      message: 'Fix button styling issue',
      timestamp: new Date('2024-01-15'),
      filesChanged: 1,
      insertions: 10,
      deletions: 5,
      files: [mockFileHistory[1]]
    }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked OpenAI create function
    const OpenAI = (await import('openai')).default;
    const openaiInstance = new OpenAI();
    mockCreate = vi.mocked(openaiInstance.chat.completions.create);
    
    storyGenerator = new StoryGenerator();
    
    // Get the mocked functions
    const { storyErrorHandler } = await import('@/lib/services/story-error-handler');
    mockExecuteWithRetry = vi.mocked(storyErrorHandler.executeWithRetry);
    mockClassifyError = vi.mocked(storyErrorHandler.classifyError);
    mockGenerateEnhancedFallbackStory = vi.mocked(storyErrorHandler.generateEnhancedFallbackStory);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateFileStory', () => {
    it('should generate a story successfully with AI response', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              creation: 'Button component was created to provide reusable UI elements.',
              evolution: 'The component evolved through multiple iterations with styling improvements.',
              keyChanges: ['Initial implementation', 'Styling fixes', 'Accessibility improvements'],
              currentState: 'Currently stable with low risk score.',
              recommendations: ['Add more unit tests', 'Consider prop validation']
            })
          }
        }]
      };

      mockCreate.mockResolvedValue(mockAIResponse);
      mockExecuteWithRetry.mockImplementation(async (fn: () => void) => await fn());

      const result = await storyGenerator.generateFileStory(
        'src/components/Button.tsx',
        mockFileHistory,
        mockFileMetrics,
        mockCommits
      );

      expect(result).toBeDefined();
      expect(result.filePath).toBe('src/components/Button.tsx');
      expect(result.sections.creation).toContain('Button component was created');
      expect(result.sections.keyChanges).toHaveLength(3);
      expect(result.sections.recommendations).toHaveLength(2);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should handle AI service errors and use fallback', async () => {
      const mockError = new Error('AI service unavailable');
      mockCreate.mockRejectedValue(mockError);

      mockExecuteWithRetry.mockRejectedValue(mockError);
      mockClassifyError.mockReturnValue({
        type: 'ai_service',
        message: 'AI service unavailable',
        retryable: false
      });
      mockGenerateEnhancedFallbackStory.mockReturnValue({
        filePath: 'src/components/Button.tsx',
        story: 'Fallback story for Button component',
        sections: {
          creation: 'Button component was created',
          evolution: 'Component evolved over time',
          keyChanges: ['Initial creation'],
          currentState: 'Currently active',
          recommendations: ['Review for improvements']
        },
        generatedAt: new Date()
      });

      const result = await storyGenerator.generateFileStory(
        'src/components/Button.tsx',
        mockFileHistory,
        mockFileMetrics,
        mockCommits
      );

      expect(result).toBeDefined();
      expect(result.story).toBe('Fallback story for Button component');
      expect(mockGenerateEnhancedFallbackStory).toHaveBeenCalledWith(
        'src/components/Button.tsx',
        mockFileHistory,
        mockFileMetrics,
        mockCommits
      );
    });

    it('should handle malformed AI responses gracefully', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: 'This is not valid JSON response from AI'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockAIResponse);
      mockExecuteWithRetry.mockImplementation(async (fn: () => void) => await fn());

      const result = await storyGenerator.generateFileStory(
        'src/components/Button.tsx',
        mockFileHistory,
        mockFileMetrics,
        mockCommits
      );

      expect(result).toBeDefined();
      expect(result.story).toBe('This is not valid JSON response from AI');
      expect(result.sections.creation).toBe('');
      expect(result.sections.keyChanges).toEqual([]);
    });

    it('should build appropriate prompts for different file types', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              creation: 'Python script created',
              evolution: 'Script evolved',
              keyChanges: ['Initial version'],
              currentState: 'Active',
              recommendations: ['Add tests']
            })
          }
        }]
      };

      mockCreate.mockResolvedValue(mockAIResponse);
      mockExecuteWithRetry.mockImplementation(async (fn: () => void) => await fn());

      const pythonMetrics = { ...mockFileMetrics, filePath: 'scripts/deploy.py' };

      await storyGenerator.generateFileStory(
        'scripts/deploy.py',
        mockFileHistory,
        pythonMetrics,
        mockCommits
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Python')
            })
          ])
        })
      );
    });
  });

  describe('generateTeamInsights', () => {
    it('should generate team insights successfully', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: 'Team shows good collaboration patterns with balanced contributions.'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockAIResponse);
      mockExecuteWithRetry.mockImplementation(async (fn: () => void) => await fn());

      const result = await storyGenerator.generateTeamInsights(
        'test-repo',
        mockCommits,
        { collaborationScore: 0.8 }
      );

      expect(result).toBe('Team shows good collaboration patterns with balanced contributions.');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('test-repo')
            })
          ])
        })
      );
    });

    it('should handle team insights errors with fallback', async () => {
      const mockError = new Error('Rate limit exceeded');
      mockCreate.mockRejectedValue(mockError);

      mockExecuteWithRetry.mockRejectedValue(mockError);
      mockClassifyError.mockReturnValue({
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        retryable: true
      });

      const result = await storyGenerator.generateTeamInsights(
        'test-repo',
        mockCommits,
        {}
      );

      expect(result).toContain('test-repo repository shows');
      expect(result).toContain('2 commits from 2 contributors');
    });
  });

  describe('configuration', () => {
    it('should allow enabling/disabling fallback', () => {
      expect(() => {
        storyGenerator.setFallbackEnabled(false);
        storyGenerator.setFallbackEnabled(true);
      }).not.toThrow();
    });

    it('should throw error when fallback is disabled and AI fails', async () => {
      storyGenerator.setFallbackEnabled(false);
      
      const mockError = new Error('AI service down');
      mockCreate.mockRejectedValue(mockError);
      mockExecuteWithRetry.mockRejectedValue(mockError);

      await expect(
        storyGenerator.generateFileStory(
          'src/components/Button.tsx',
          mockFileHistory,
          mockFileMetrics,
          mockCommits
        )
      ).rejects.toThrow('AI service down');
    });
  });
});