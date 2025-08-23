import { describe, it, expect, beforeEach, vi } from "vitest";
import { GitAnalyzer } from "@/lib/services/git-analyzer";
import { Commit } from "@/types/git";
import simpleGit from "simple-git";

// Mock simple-git
vi.mock("simple-git");
const mockSimpleGit = vi.mocked(simpleGit);

// Mock fs
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    existsSync: vi.fn(),
    statSync: vi.fn(),
  };
});

describe("GitAnalyzer", () => {
  let gitAnalyzer: GitAnalyzer;
  let mockGit: any;

  beforeEach(() => {
    mockGit = {
      checkIsRepo: vi.fn(),
      log: vi.fn(),
      diffSummary: vi.fn(),
    };
    
    mockSimpleGit.mockReturnValue(mockGit);
    gitAnalyzer = new GitAnalyzer("/test/repo", mockGit);
  });

  describe("calculateFileMetrics", () => {
    it("should calculate basic file metrics correctly", async () => {
      const commits: Commit[] = [
        {
          sha: "abc123",
          author: "John Doe",
          email: "john@example.com",
          message: "Add new feature",
          timestamp: new Date("2024-01-01"),
          filesChanged: 2,
          insertions: 50,
          deletions: 10,
          files: [
            {
              filePath: "src/app.ts",
              changeType: "modified",
              insertions: 30,
              deletions: 5,
            },
            {
              filePath: "src/utils.ts",
              changeType: "added",
              insertions: 20,
              deletions: 5,
            },
          ],
        },
        {
          sha: "def456",
          author: "Jane Smith",
          email: "jane@example.com",
          message: "Fix bug in app.ts",
          timestamp: new Date("2024-01-02"),
          filesChanged: 1,
          insertions: 5,
          deletions: 2,
          files: [
            {
              filePath: "src/app.ts",
              changeType: "modified",
              insertions: 5,
              deletions: 2,
            },
          ],
        },
        {
          sha: "ghi789",
          author: "John Doe",
          email: "john@example.com",
          message: "Update utils.ts",
          timestamp: new Date("2024-01-03"),
          filesChanged: 1,
          insertions: 10,
          deletions: 0,
          files: [
            {
              filePath: "src/utils.ts",
              changeType: "modified",
              insertions: 10,
              deletions: 0,
            },
          ],
        },
      ];

      const fileMetrics = await gitAnalyzer.calculateFileMetrics(commits);

      expect(fileMetrics).toHaveLength(2);

      // Check app.ts metrics
      const appMetrics = fileMetrics.find(m => m.filePath === "src/app.ts");
      expect(appMetrics).toBeDefined();
      expect(appMetrics!.commitCount).toBe(2);
      expect(appMetrics!.authorCount).toBe(2);
      expect(appMetrics!.totalChanges).toBe(42); // 30+5+5+2
      expect(appMetrics!.bugCommits).toBe(1); // "Fix bug" commit
      expect(appMetrics!.authors).toEqual(["John Doe", "Jane Smith"]);
      expect(appMetrics!.lastModified).toEqual(new Date("2024-01-02"));

      // Check utils.ts metrics
      const utilsMetrics = fileMetrics.find(m => m.filePath === "src/utils.ts");
      expect(utilsMetrics).toBeDefined();
      expect(utilsMetrics!.commitCount).toBe(2);
      expect(utilsMetrics!.authorCount).toBe(1);
      expect(utilsMetrics!.totalChanges).toBe(35); // 20+5+10+0
      expect(utilsMetrics!.bugCommits).toBe(0);
      expect(utilsMetrics!.authors).toEqual(["John Doe"]);
      expect(utilsMetrics!.lastModified).toEqual(new Date("2024-01-03"));
    });

    it("should handle empty commit history", async () => {
      const commits: Commit[] = [];
      const fileMetrics = await gitAnalyzer.calculateFileMetrics(commits);
      expect(fileMetrics).toHaveLength(0);
    });

    it("should identify bug fix commits correctly", async () => {
      const commits: Commit[] = [
        {
          sha: "abc123",
          author: "John Doe",
          email: "john@example.com",
          message: "fix: resolve memory leak",
          timestamp: new Date("2024-01-01"),
          filesChanged: 1,
          insertions: 10,
          deletions: 5,
          files: [
            {
              filePath: "src/memory.ts",
              changeType: "modified",
              insertions: 10,
              deletions: 5,
            },
          ],
        },
        {
          sha: "def456",
          author: "Jane Smith",
          email: "jane@example.com",
          message: "hotfix: critical bug in auth",
          timestamp: new Date("2024-01-02"),
          filesChanged: 1,
          insertions: 3,
          deletions: 1,
          files: [
            {
              filePath: "src/auth.ts",
              changeType: "modified",
              insertions: 3,
              deletions: 1,
            },
          ],
        },
        {
          sha: "ghi789",
          author: "John Doe",
          email: "john@example.com",
          message: "add new feature",
          timestamp: new Date("2024-01-03"),
          filesChanged: 1,
          insertions: 20,
          deletions: 0,
          files: [
            {
              filePath: "src/feature.ts",
              changeType: "added",
              insertions: 20,
              deletions: 0,
            },
          ],
        },
      ];

      const fileMetrics = await gitAnalyzer.calculateFileMetrics(commits);

      const memoryMetrics = fileMetrics.find(m => m.filePath === "src/memory.ts");
      const authMetrics = fileMetrics.find(m => m.filePath === "src/auth.ts");
      const featureMetrics = fileMetrics.find(m => m.filePath === "src/feature.ts");

      expect(memoryMetrics!.bugCommits).toBe(1);
      expect(authMetrics!.bugCommits).toBe(1);
      expect(featureMetrics!.bugCommits).toBe(0);
    });

    it("should calculate risk scores correctly", async () => {
      const commits: Commit[] = [
        // High-risk file: many commits, many authors, many changes, bug fixes
        ...Array.from({ length: 20 }, (_, i) => ({
          sha: `commit${i}`,
          author: `Author${i % 3}`, // 3 different authors
          email: `author${i % 3}@example.com`,
          message: i % 5 === 0 ? "fix bug" : "update code",
          timestamp: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
          filesChanged: 1,
          insertions: 50,
          deletions: 10,
          files: [
            {
              filePath: "src/high-risk.ts",
              changeType: "modified" as const,
              insertions: 50,
              deletions: 10,
            },
          ],
        })),
        // Low-risk file: few commits, one author, small changes, no bugs
        {
          sha: "low-risk-commit",
          author: "Single Author",
          email: "single@example.com",
          message: "add utility function",
          timestamp: new Date("2024-01-01"),
          filesChanged: 1,
          insertions: 10,
          deletions: 0,
          files: [
            {
              filePath: "src/low-risk.ts",
              changeType: "added",
              insertions: 10,
              deletions: 0,
            },
          ],
        },
      ];

      const fileMetrics = await gitAnalyzer.calculateFileMetrics(commits);

      const highRiskMetrics = fileMetrics.find(m => m.filePath === "src/high-risk.ts");
      const lowRiskMetrics = fileMetrics.find(m => m.filePath === "src/low-risk.ts");

      expect(highRiskMetrics!.riskScore).toBeGreaterThan(lowRiskMetrics!.riskScore);
      expect(highRiskMetrics!.riskScore).toBeGreaterThan(0.5);
      expect(lowRiskMetrics!.riskScore).toBeLessThan(0.3);
    });
  });

  describe("detectPatterns", () => {
    it("should detect frequently changed files", async () => {
      const commits: Commit[] = Array.from({ length: 10 }, (_, i) => ({
        sha: `commit${i}`,
        author: "Author",
        email: "author@example.com",
        message: "update",
        timestamp: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
        filesChanged: 1,
        insertions: 10,
        deletions: 0,
        files: [
          {
            filePath: i < 5 ? "src/frequent.ts" : "src/other.ts",
            changeType: "modified" as const,
            insertions: 10,
            deletions: 0,
          },
        ],
      }));

      const patterns = await gitAnalyzer.detectPatterns(commits);

      const frequentChangesPattern = patterns.find(p => p.type === "frequent_changes");
      expect(frequentChangesPattern).toBeDefined();
      expect(frequentChangesPattern!.files).toContain("src/frequent.ts");
      expect(frequentChangesPattern!.files).toContain("src/other.ts");
    });

    it("should detect bug-prone files", async () => {
      const commits: Commit[] = [
        {
          sha: "bug1",
          author: "Author",
          email: "author@example.com",
          message: "fix critical bug",
          timestamp: new Date("2024-01-01"),
          filesChanged: 1,
          insertions: 5,
          deletions: 2,
          files: [
            {
              filePath: "src/buggy.ts",
              changeType: "modified",
              insertions: 5,
              deletions: 2,
            },
          ],
        },
        {
          sha: "bug2",
          author: "Author",
          email: "author@example.com",
          message: "hotfix for issue",
          timestamp: new Date("2024-01-02"),
          filesChanged: 1,
          insertions: 3,
          deletions: 1,
          files: [
            {
              filePath: "src/buggy.ts",
              changeType: "modified",
              insertions: 3,
              deletions: 1,
            },
          ],
        },
        {
          sha: "feature",
          author: "Author",
          email: "author@example.com",
          message: "add new feature",
          timestamp: new Date("2024-01-03"),
          filesChanged: 1,
          insertions: 20,
          deletions: 0,
          files: [
            {
              filePath: "src/clean.ts",
              changeType: "added",
              insertions: 20,
              deletions: 0,
            },
          ],
        },
      ];

      const patterns = await gitAnalyzer.detectPatterns(commits);

      const bugPronePattern = patterns.find(p => p.type === "bug_prone_files");
      expect(bugPronePattern).toBeDefined();
      expect(bugPronePattern!.files).toContain("src/buggy.ts");
      expect(bugPronePattern!.files).not.toContain("src/clean.ts");
    });
  });

  describe("calculateBasicTeamInsights", () => {
    it("should calculate contribution metrics correctly", async () => {
      const commits: Commit[] = [
        {
          sha: "commit1",
          author: "John Doe",
          email: "john@example.com",
          message: "feature A",
          timestamp: new Date("2024-01-01"),
          filesChanged: 1,
          insertions: 10,
          deletions: 0,
          files: [],
        },
        {
          sha: "commit2",
          author: "John Doe",
          email: "john@example.com",
          message: "feature B",
          timestamp: new Date("2024-01-02"),
          filesChanged: 1,
          insertions: 15,
          deletions: 0,
          files: [],
        },
        {
          sha: "commit3",
          author: "Jane Smith",
          email: "jane@example.com",
          message: "feature C",
          timestamp: new Date("2024-01-03"),
          filesChanged: 1,
          insertions: 20,
          deletions: 0,
          files: [],
        },
      ];

      // Mock repository validation and git operations
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.log.mockResolvedValue({ all: [] });
      
      // Mock the methods to return our test data
      vi.spyOn(gitAnalyzer, "isValidRepository").mockResolvedValue(true);
      vi.spyOn(gitAnalyzer, "getCommitHistory").mockResolvedValue(commits);
      vi.spyOn(gitAnalyzer, "calculateFileMetrics").mockResolvedValue([]);
      vi.spyOn(gitAnalyzer, "detectPatterns").mockResolvedValue([]);
      
      const analysis = await gitAnalyzer.analyzeRepository();

      expect(analysis.teamInsights.contributionMetrics.totalCommits).toBe(3);
      expect(analysis.teamInsights.contributionMetrics.activeContributors).toBe(2);
      expect(analysis.teamInsights.contributionMetrics.codeOwnership["John Doe"]).toBeCloseTo(0.67, 2);
      expect(analysis.teamInsights.contributionMetrics.codeOwnership["Jane Smith"]).toBeCloseTo(0.33, 2);
    });
  });
});