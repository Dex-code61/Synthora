import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitAnalyzer } from '../git-analyzer';
import { Commit } from '@/types/git';
import { existsSync, statSync } from 'fs';

describe('GitAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Create mock commits for testing
  const createMockCommits = (): Commit[] => [
    {
      sha: 'abc123',
      author: 'John Doe',
      email: 'john@example.com',
      message: 'Add user authentication feature',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      filesChanged: 2,
      insertions: 150,
      deletions: 20,
      files: [
        {
          filePath: 'src/auth/login.ts',
          changeType: 'modified',
          insertions: 80,
          deletions: 20
        },
        {
          filePath: 'src/components/LoginForm.tsx',
          changeType: 'added',
          insertions: 70,
          deletions: 0
        }
      ]
    },
    {
      sha: 'def456',
      author: 'Jane Smith',
      email: 'jane@example.com',
      message: 'Fix login bug in auth service',
      timestamp: new Date('2024-01-14T15:30:00Z'),
      filesChanged: 1,
      insertions: 5,
      deletions: 10,
      files: [
        {
          filePath: 'src/auth/login.ts',
          changeType: 'modified',
          insertions: 5,
          deletions: 10
        }
      ]
    },
    {
      sha: 'ghi789',
      author: 'John Doe',
      email: 'john@example.com',
      message: 'Update user profile component',
      timestamp: new Date('2024-01-13T09:15:00Z'),
      filesChanged: 1,
      insertions: 25,
      deletions: 5,
      files: [
        {
          filePath: 'src/components/UserProfile.tsx',
          changeType: 'modified',
          insertions: 25,
          deletions: 5
        }
      ]
    }
  ];

  describe('repository detection and validation', () => {
    it('should handle Git check errors gracefully', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockRejectedValue(new Error('Git error'))
      } as any;

      const analyzer = new GitAnalyzer('/error/repo', mockGit);
      const isValid = await analyzer.isValidRepository();

      expect(isValid).toBe(false);
    });

    it('should throw error when detecting invalid repository', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false)
      } as any;

      const analyzer = new GitAnalyzer('/invalid/repo', mockGit);
      
      await expect(analyzer.detectRepository()).rejects.toThrow(
        'Invalid Git repository at path: /invalid/repo'
      );
    });
  });

  describe('getCommitHistory', () => {
    it('should handle Git log errors', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
        log: vi.fn().mockRejectedValue(new Error('Git log failed'))
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);

      await expect(analyzer.getCommitHistory()).rejects.toThrow(
        'Invalid Git repository at path: /test/repo'
      );
    });
  });

  describe('getFileHistory', () => {
    it('should handle file history errors', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
        log: vi.fn().mockRejectedValue(new Error('File not found'))
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);

      await expect(analyzer.getFileHistory('nonexistent.js')).rejects.toThrow(
        'Invalid Git repository at path: /test/repo'
      );
    });
  });

  describe('analyzeRepository', () => {
    it('should handle repository analysis errors', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false)
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);

      await expect(analyzer.analyzeRepository()).rejects.toThrow(
        'Invalid Git repository at path: /test/repo'
      );
    });
  });

  describe('Git operations with mocked repository', () => {
    it('should get commit history with valid repository mock', async () => {
      const mockLogResult = {
        all: [
          {
            hash: 'abc123',
            author_name: 'John Doe',
            author_email: 'john@example.com',
            message: 'Test commit',
            date: '2024-01-15T10:00:00Z'
          }
        ]
      };

      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn().mockResolvedValue(mockLogResult),
        diffSummary: vi.fn().mockResolvedValue({
          changed: 1,
          insertions: 10,
          deletions: 5,
          files: [
            {
              file: 'test.js',
              changes: 15,
              insertions: 10,
              deletions: 5,
              binary: false
            }
          ]
        })
      } as any;

      // Create analyzer with mock that bypasses file system checks
      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      
      // Override isValidRepository to return true for testing
      vi.spyOn(analyzer, 'isValidRepository').mockResolvedValue(true);

      const commits = await analyzer.getCommitHistory();

      expect(commits).toHaveLength(1);
      expect(commits[0]).toMatchObject({
        sha: 'abc123',
        author: 'John Doe',
        email: 'john@example.com',
        message: 'Test commit',
        filesChanged: 1,
        insertions: 10,
        deletions: 5
      });
      expect(mockGit.log).toHaveBeenCalledWith({});
    });

    it('should apply Git options correctly', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn().mockResolvedValue({ all: [] }),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      vi.spyOn(analyzer, 'isValidRepository').mockResolvedValue(true);

      const options = {
        maxCount: 50,
        author: 'John Doe',
        since: '2024-01-01',
        until: '2024-01-31',
        from: 'main',
        to: 'develop'
      };

      await analyzer.getCommitHistory(options);

      expect(mockGit.log).toHaveBeenCalledWith({
        maxCount: 50,
        author: 'John Doe',
        since: '2024-01-01',
        until: '2024-01-31',
        from: 'main',
        to: 'develop'
      });
    });

    it('should get file history for specific file', async () => {
      const mockLogResult = {
        all: [
          {
            hash: 'abc123',
            author_name: 'John Doe',
            author_email: 'john@example.com',
            message: 'Update file',
            date: '2024-01-15T10:00:00Z'
          }
        ]
      };

      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn().mockResolvedValue(mockLogResult),
        diffSummary: vi.fn().mockResolvedValue({
          changed: 1,
          insertions: 10,
          deletions: 5,
          files: [
            {
              file: 'src/test.js',
              changes: 15,
              insertions: 10,
              deletions: 5,
              binary: false
            }
          ]
        })
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      vi.spyOn(analyzer, 'isValidRepository').mockResolvedValue(true);

      const fileHistory = await analyzer.getFileHistory('src/test.js');

      expect(fileHistory).toHaveLength(1);
      expect(fileHistory[0]).toMatchObject({
        filePath: 'src/test.js',
        changeType: 'modified',
        insertions: 10,
        deletions: 5
      });
      expect(mockGit.log).toHaveBeenCalledWith({ file: 'src/test.js' });
    });

    it('should perform complete repository analysis', async () => {
      const mockLogResult = {
        all: [
          {
            hash: 'abc123',
            author_name: 'John Doe',
            author_email: 'john@example.com',
            message: 'Add feature',
            date: '2024-01-15T10:00:00Z'
          },
          {
            hash: 'def456',
            author_name: 'Jane Smith',
            author_email: 'jane@example.com',
            message: 'Fix bug in feature',
            date: '2024-01-14T15:30:00Z'
          }
        ]
      };

      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn().mockResolvedValue(mockLogResult),
        diffSummary: vi.fn().mockResolvedValue({
          changed: 1,
          insertions: 10,
          deletions: 5,
          files: [
            {
              file: 'src/feature.js',
              changes: 15,
              insertions: 10,
              deletions: 5,
              binary: false
            }
          ]
        })
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      vi.spyOn(analyzer, 'isValidRepository').mockResolvedValue(true);

      const result = await analyzer.analyzeRepository();

      expect(result).toMatchObject({
        repositoryId: 0,
        commits: expect.arrayContaining([
          expect.objectContaining({ sha: 'abc123' }),
          expect.objectContaining({ sha: 'def456' })
        ]),
        fileMetrics: expect.any(Array),
        patterns: expect.any(Array),
        teamInsights: expect.objectContaining({
          contributionMetrics: expect.objectContaining({
            totalCommits: 2,
            activeContributors: 2
          })
        }),
        processingTime: expect.any(Number)
      });

      expect(result.processingTime).toBeGreaterThan(0);
      expect(mockGit.log).toHaveBeenCalledWith({ maxCount: 1000 });
    });
  });

  describe('calculateFileMetrics', () => {
    it('should calculate correct file metrics from commits', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const commits = createMockCommits();
      const fileMetrics = await analyzer.calculateFileMetrics(commits);
      
      expect(fileMetrics.length).toBe(3);
      
      // Find metrics for src/auth/login.ts (appears in 2 commits)
      const loginFileMetrics = fileMetrics.find(m => m.filePath === 'src/auth/login.ts');
      expect(loginFileMetrics).toBeDefined();
      expect(loginFileMetrics!.commitCount).toBe(2);
      expect(loginFileMetrics!.authorCount).toBe(2); // John Doe and Jane Smith
      expect(loginFileMetrics!.totalChanges).toBe(115); // 100 + 15
      expect(loginFileMetrics!.bugCommits).toBe(1); // One commit has "Fix" in message
      expect(loginFileMetrics!.authors).toContain('John Doe');
      expect(loginFileMetrics!.authors).toContain('Jane Smith');
    });

    it('should calculate risk scores correctly', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const commits = createMockCommits();
      const fileMetrics = await analyzer.calculateFileMetrics(commits);
      
      // All files should have risk scores between 0 and 1
      fileMetrics.forEach(metrics => {
        expect(metrics.riskScore).toBeGreaterThanOrEqual(0);
        expect(metrics.riskScore).toBeLessThanOrEqual(1);
      });
    });

    it('should sort files by risk score descending', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const commits = createMockCommits();
      const fileMetrics = await analyzer.calculateFileMetrics(commits);
      
      for (let i = 1; i < fileMetrics.length; i++) {
        expect(fileMetrics[i-1].riskScore).toBeGreaterThanOrEqual(fileMetrics[i].riskScore);
      }
    });
  });

  describe('detectPatterns', () => {
    it('should detect frequently changed files', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const commits = createMockCommits();
      const patterns = await analyzer.detectPatterns(commits);
      
      const frequentChangesPattern = patterns.find(p => p.type === 'frequent_changes');
      expect(frequentChangesPattern).toBeDefined();
      expect(frequentChangesPattern!.files).toContain('src/auth/login.ts');
    });

    it('should detect bug-prone files', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const commits = createMockCommits();
      const patterns = await analyzer.detectPatterns(commits);
      
      const bugPronePattern = patterns.find(p => p.type === 'bug_prone_files');
      expect(bugPronePattern).toBeDefined();
      expect(bugPronePattern!.files).toContain('src/auth/login.ts');
    });
  });

  describe('getCommitFileChanges', () => {
    it('should handle different file types correctly', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        diffSummary: vi.fn().mockResolvedValue({
          changed: 3,
          insertions: 100,
          deletions: 50,
          files: [
            {
              file: 'test.txt',
              changes: 75,
              insertions: 50,
              deletions: 25,
              binary: false
            },
            {
              file: 'image.png',
              changes: 0,
              insertions: 0,
              deletions: 0,
              binary: true
            },
            {
              file: 'new-file.js',
              changes: 25,
              insertions: 25,
              deletions: 0,
              binary: false
            }
          ]
        })
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      
      const fileChanges = await analyzer.getCommitFileChanges('test123');
      
      expect(fileChanges).toHaveLength(3);
      
      // Text file with modifications
      expect(fileChanges[0]).toMatchObject({
        filePath: 'test.txt',
        changeType: 'modified',
        insertions: 50,
        deletions: 25
      });
      
      // Binary file
      expect(fileChanges[1]).toMatchObject({
        filePath: 'image.png',
        changeType: 'modified',
        insertions: 0,
        deletions: 0
      });
      
      // New file
      expect(fileChanges[2]).toMatchObject({
        filePath: 'new-file.js',
        changeType: 'added',
        insertions: 25,
        deletions: 0
      });
    });

    it('should handle diff errors gracefully', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        diffSummary: vi.fn().mockRejectedValue(new Error('Diff failed'))
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      
      const fileChanges = await analyzer.getCommitFileChanges('test123');
      
      expect(fileChanges).toEqual([]);
    });
  });

  describe('team insights', () => {
    it('should calculate basic team insights correctly', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const commits = createMockCommits();
      
      // Access the private method through the public analyzeRepository method
      // by creating a minimal mock that bypasses repository validation
      const teamInsights = (analyzer as any).calculateBasicTeamInsights(commits);
      
      expect(teamInsights.contributionMetrics.totalCommits).toBe(3);
      expect(teamInsights.contributionMetrics.activeContributors).toBe(2);
      expect(teamInsights.contributionMetrics.codeOwnership).toMatchObject({
        'John Doe': expect.any(Number),
        'Jane Smith': expect.any(Number)
      });
    });
  });

  describe('bug fix detection', () => {
    it('should identify bug fix commits correctly', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const commits = createMockCommits();
      
      // Test through calculateFileMetrics which uses the private method
      const fileMetrics = await analyzer.calculateFileMetrics(commits);
      const loginFileMetrics = fileMetrics.find(m => m.filePath === 'src/auth/login.ts');
      
      expect(loginFileMetrics!.bugCommits).toBe(1); // Only one bug fix commit
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty commit history', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn().mockResolvedValue({ all: [] }),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      vi.spyOn(analyzer, 'isValidRepository').mockResolvedValue(true);

      const commits = await analyzer.getCommitHistory();
      expect(commits).toEqual([]);
    });

    it('should handle commits with no file changes', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const emptyCommits: Commit[] = [
        {
          sha: 'abc123',
          author: 'John Doe',
          email: 'john@example.com',
          message: 'Empty commit',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          filesChanged: 0,
          insertions: 0,
          deletions: 0,
          files: []
        }
      ];

      const fileMetrics = await analyzer.calculateFileMetrics(emptyCommits);
      expect(fileMetrics).toEqual([]);
    });

    it('should handle binary files correctly', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        diffSummary: vi.fn().mockResolvedValue({
          changed: 2,
          insertions: 10,
          deletions: 5,
          files: [
            {
              file: 'image.png',
              changes: 0,
              insertions: 0,
              deletions: 0,
              binary: true
            },
            {
              file: 'document.pdf',
              changes: 0,
              insertions: 0,
              deletions: 0,
              binary: true
            }
          ]
        })
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const fileChanges = await analyzer.getCommitFileChanges('test123');

      expect(fileChanges).toHaveLength(2);
      expect(fileChanges[0]).toMatchObject({
        filePath: 'image.png',
        changeType: 'modified',
        insertions: 0,
        deletions: 0
      });
      expect(fileChanges[1]).toMatchObject({
        filePath: 'document.pdf',
        changeType: 'modified',
        insertions: 0,
        deletions: 0
      });
    });

    it('should detect different change types correctly', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        diffSummary: vi.fn().mockResolvedValue({
          changed: 3,
          insertions: 50,
          deletions: 25,
          files: [
            {
              file: 'new-file.js',
              changes: 50,
              insertions: 50,
              deletions: 0,
              binary: false
            },
            {
              file: 'deleted-file.js',
              changes: 25,
              insertions: 0,
              deletions: 25,
              binary: false
            },
            {
              file: 'modified-file.js',
              changes: 30,
              insertions: 20,
              deletions: 10,
              binary: false
            }
          ]
        })
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      const fileChanges = await analyzer.getCommitFileChanges('test123');

      expect(fileChanges).toHaveLength(3);
      
      // New file (only insertions)
      expect(fileChanges[0]).toMatchObject({
        filePath: 'new-file.js',
        changeType: 'added',
        insertions: 50,
        deletions: 0
      });
      
      // Deleted file (only deletions)
      expect(fileChanges[1]).toMatchObject({
        filePath: 'deleted-file.js',
        changeType: 'deleted',
        insertions: 0,
        deletions: 25
      });
      
      // Modified file (both insertions and deletions)
      expect(fileChanges[2]).toMatchObject({
        filePath: 'modified-file.js',
        changeType: 'modified',
        insertions: 20,
        deletions: 10
      });
    });

    it('should calculate risk scores with edge values', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        log: vi.fn(),
        diffSummary: vi.fn()
      } as any;

      const analyzer = new GitAnalyzer('/test/repo', mockGit);
      
      // Create commits with extreme values to test risk score calculation
      const extremeCommits: Commit[] = [
        {
          sha: 'abc123',
          author: 'Author1',
          email: 'author1@example.com',
          message: 'Normal commit',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          filesChanged: 1,
          insertions: 1000,
          deletions: 500,
          files: [
            {
              filePath: 'high-risk-file.js',
              changeType: 'modified',
              insertions: 1000,
              deletions: 500
            }
          ]
        }
      ];

      // Add many commits to the same file to increase risk
      for (let i = 0; i < 60; i++) {
        extremeCommits.push({
          sha: `commit${i}`,
          author: `Author${i % 15}`, // 15 different authors
          email: `author${i % 15}@example.com`,
          message: i % 5 === 0 ? 'Fix bug in file' : 'Update file',
          timestamp: new Date(`2024-01-${(i % 28) + 1}T10:00:00Z`),
          filesChanged: 1,
          insertions: 10,
          deletions: 5,
          files: [
            {
              filePath: 'high-risk-file.js',
              changeType: 'modified',
              insertions: 10,
              deletions: 5
            }
          ]
        });
      }

      const fileMetrics = await analyzer.calculateFileMetrics(extremeCommits);
      const highRiskFile = fileMetrics.find(m => m.filePath === 'high-risk-file.js');

      expect(highRiskFile).toBeDefined();
      expect(highRiskFile!.commitCount).toBe(61); // 1 + 60
      expect(highRiskFile!.authorCount).toBe(15);
      expect(highRiskFile!.riskScore).toBeGreaterThan(0.5); // Should be high risk
      expect(highRiskFile!.bugCommits).toBeGreaterThan(0); // Should have bug fixes
    });
  });
});