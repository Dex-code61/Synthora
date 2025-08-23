import { describe, it, expect, vi } from 'vitest';
import { GitAnalyzer } from '../git-analyzer';
import { Commit } from '@/types/git';

describe('GitAnalyzer', () => {
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
});