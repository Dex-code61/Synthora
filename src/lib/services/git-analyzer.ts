import simpleGit, { SimpleGit, LogResult, DiffResult } from "simple-git";
import { Commit, FileChange, GitOptions } from "@/types/git";
import {
  AnalysisResult,
  FileMetrics,
  Pattern,
  TeamInsights,
} from "@/types/analysis";
import { existsSync, statSync } from "fs";
import { join } from "path";

export class GitAnalyzer {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string, gitInstance?: SimpleGit) {
    this.repoPath = repoPath;
    this.git = gitInstance || simpleGit(repoPath);
  }

  /**
   * Validates if the given path is a valid Git repository
   */
  async isValidRepository(): Promise<boolean> {
    try {
      // Check if path exists
      if (!existsSync(this.repoPath)) {
        return false;
      }

      // Check if it's a directory
      if (!statSync(this.repoPath).isDirectory()) {
        return false;
      }

      // Check if it's a git repository
      const isRepo = await this.git.checkIsRepo();
      return isRepo;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detects and validates repository, throws error if invalid
   */
  async detectRepository(): Promise<void> {
    const isValid = await this.isValidRepository();
    if (!isValid) {
      throw new Error(`Invalid Git repository at path: ${this.repoPath}`);
    }
  }

  /**
   * Gets commit history with optional filtering
   */
  async getCommitHistory(options?: GitOptions): Promise<Commit[]> {
    await this.detectRepository();

    try {
      const logOptions: any = {};

      if (options?.maxCount) {
        logOptions.maxCount = options.maxCount;
      }
      if (options?.from && options?.to) {
        logOptions.from = options.from;
        logOptions.to = options.to;
      }
      if (options?.author) {
        logOptions.author = options.author;
      }
      if (options?.since) {
        logOptions.since = options.since;
      }
      if (options?.until) {
        logOptions.until = options.until;
      }

      const log: LogResult = await this.git.log(logOptions);

      const commits: Commit[] = [];

      for (const logEntry of log.all) {
        // Get file changes for this commit
        const fileChanges = await this.getCommitFileChanges(logEntry.hash);

        const commit: Commit = {
          sha: logEntry.hash,
          author: logEntry.author_name,
          email: logEntry.author_email,
          message: logEntry.message,
          timestamp: new Date(logEntry.date),
          filesChanged: fileChanges.length,
          insertions: fileChanges.reduce(
            (sum, file) => sum + file.insertions,
            0
          ),
          deletions: fileChanges.reduce((sum, file) => sum + file.deletions, 0),
          files: fileChanges,
        };

        commits.push(commit);
      }

      return commits;
    } catch (error) {
      throw new Error(
        `Failed to get commit history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Gets file changes for a specific commit
   */
  async getCommitFileChanges(commitSha: string): Promise<FileChange[]> {
    try {
      // Get the diff for this commit
      const diffSummary = await this.git.diffSummary([
        `${commitSha}^`,
        commitSha,
      ]);

      const fileChanges: FileChange[] = [];

      for (const file of diffSummary.files) {
        let changeType: "added" | "modified" | "deleted";
        let insertions = 0;
        let deletions = 0;

        // Handle different file types
        if ("binary" in file && file.binary) {
          // Binary file - no insertions/deletions data
          changeType = "modified";
          insertions = 0;
          deletions = 0;
        } else if ("insertions" in file && "deletions" in file) {
          // Text file with insertions/deletions data
          insertions = file.insertions;
          deletions = file.deletions;

          if (insertions > 0 && deletions === 0) {
            changeType = "added";
          } else if (insertions === 0 && deletions > 0) {
            changeType = "deleted";
          } else {
            changeType = "modified";
          }
        } else {
          // Name status file or other type - determine from status if available
          changeType = "modified";
          insertions = 0;
          deletions = 0;
        }

        fileChanges.push({
          filePath: file.file,
          changeType,
          insertions,
          deletions,
        });
      }

      return fileChanges;
    } catch (error) {
      // If we can't get diff (e.g., initial commit), return empty array
      return [];
    }
  }

  /**
   * Gets file history for a specific file
   */
  async getFileHistory(filePath: string): Promise<FileChange[]> {
    await this.detectRepository();

    try {
      const log = await this.git.log({ file: filePath });
      const fileChanges: FileChange[] = [];

      for (const logEntry of log.all) {
        const commitFileChanges = await this.getCommitFileChanges(
          logEntry.hash
        );
        const fileChange = commitFileChanges.find(
          (fc) => fc.filePath === filePath
        );

        if (fileChange) {
          fileChanges.push(fileChange);
        }
      }

      return fileChanges;
    } catch (error) {
      throw new Error(
        `Failed to get file history for ${filePath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Calculates basic file metrics from commits
   */
  async calculateFileMetrics(commits: Commit[]): Promise<FileMetrics[]> {
    const fileMetricsMap = new Map<
      string,
      {
        commitCount: number;
        authors: Set<string>;
        totalChanges: number;
        bugCommits: number;
        lastModified: Date;
      }
    >();

    // Process each commit
    for (const commit of commits) {
      const isBugFix = this.isBugFixCommit(commit.message);

      for (const fileChange of commit.files) {
        const filePath = fileChange.filePath;

        if (!fileMetricsMap.has(filePath)) {
          fileMetricsMap.set(filePath, {
            commitCount: 0,
            authors: new Set(),
            totalChanges: 0,
            bugCommits: 0,
            lastModified: commit.timestamp,
          });
        }

        const metrics = fileMetricsMap.get(filePath)!;
        metrics.commitCount++;
        metrics.authors.add(commit.author);
        metrics.totalChanges += fileChange.insertions + fileChange.deletions;

        if (isBugFix) {
          metrics.bugCommits++;
        }

        // Update last modified if this commit is more recent
        if (commit.timestamp > metrics.lastModified) {
          metrics.lastModified = commit.timestamp;
        }
      }
    }

    // Convert to FileMetrics array
    const fileMetrics: FileMetrics[] = [];

    for (const [filePath, metrics] of fileMetricsMap) {
      const authorCount = metrics.authors.size;
      const riskScore = this.calculateBasicRiskScore(
        metrics.commitCount,
        authorCount,
        metrics.totalChanges,
        metrics.bugCommits
      );

      fileMetrics.push({
        filePath,
        commitCount: metrics.commitCount,
        authorCount,
        riskScore,
        totalChanges: metrics.totalChanges,
        bugCommits: metrics.bugCommits,
        lastModified: metrics.lastModified,
        authors: Array.from(metrics.authors),
      });
    }

    return fileMetrics.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Detects basic patterns in commit history
   */
  async detectPatterns(commits: Commit[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Pattern 1: Files with frequent changes
    const fileChangeCount = new Map<string, number>();
    commits.forEach((commit) => {
      commit.files.forEach((file) => {
        fileChangeCount.set(
          file.filePath,
          (fileChangeCount.get(file.filePath) || 0) + 1
        );
      });
    });

    const frequentlyChangedFiles = Array.from(fileChangeCount.entries())
      .filter(([_, count]) => count > commits.length * 0.1) // Files changed in >10% of commits
      .map(([filePath]) => filePath);

    if (frequentlyChangedFiles.length > 0) {
      patterns.push({
        type: "frequent_changes",
        description: "Files that change frequently across commits",
        confidence: 0.8,
        files: frequentlyChangedFiles,
      });
    }

    // Pattern 2: Bug fix patterns
    const bugFixCommits = commits.filter((commit) =>
      this.isBugFixCommit(commit.message)
    );
    const bugFixFiles = new Set<string>();

    bugFixCommits.forEach((commit) => {
      commit.files.forEach((file) => bugFixFiles.add(file.filePath));
    });

    if (bugFixFiles.size > 0) {
      patterns.push({
        type: "bug_prone_files",
        description: "Files frequently involved in bug fixes",
        confidence: 0.7,
        files: Array.from(bugFixFiles),
      });
    }

    return patterns;
  }

  /**
   * Performs complete repository analysis
   */
  async analyzeRepository(): Promise<AnalysisResult> {
    const startTime = Date.now();

    await this.detectRepository();

    // Get commit history (limit to recent commits for performance)
    const commits = await this.getCommitHistory({ maxCount: 1000 });

    // Calculate file metrics
    const fileMetrics = await this.calculateFileMetrics(commits);

    // Detect patterns
    const patterns = await this.detectPatterns(commits);

    // Basic team insights (simplified for now)
    const teamInsights = this.calculateBasicTeamInsights(commits);

    const processingTime = Date.now() - startTime;

    return {
      repositoryId: 0, // Will be set by the caller
      commits,
      fileMetrics,
      patterns,
      teamInsights,
      processingTime,
    };
  }

  /**
   * Determines if a commit message indicates a bug fix
   */
  private isBugFixCommit(message: string): boolean {
    const bugKeywords = [
      "fix",
      "bug",
      "issue",
      "error",
      "patch",
      "hotfix",
      "bugfix",
    ];
    const lowerMessage = message.toLowerCase();
    return bugKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Calculates a basic risk score for a file
   */
  private calculateBasicRiskScore(
    commitCount: number,
    authorCount: number,
    totalChanges: number,
    bugCommits: number
  ): number {
    // Normalize factors (0-1 scale)
    const changeFrequency = Math.min(commitCount / 50, 1); // Max at 50 commits
    const authorDiversity = Math.min(authorCount / 10, 1); // Max at 10 authors
    const changeVolume = Math.min(totalChanges / 1000, 1); // Max at 1000 changes
    const bugRatio = commitCount > 0 ? bugCommits / commitCount : 0;

    // Weighted risk score
    const riskScore =
      changeFrequency * 0.3 +
      authorDiversity * 0.2 +
      changeVolume * 0.3 +
      bugRatio * 0.2;

    return Math.round(riskScore * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculates basic team insights
   */
  private calculateBasicTeamInsights(commits: Commit[]): TeamInsights {
    const authorCommits = new Map<string, number>();
    const totalCommits = commits.length;

    commits.forEach((commit) => {
      authorCommits.set(
        commit.author,
        (authorCommits.get(commit.author) || 0) + 1
      );
    });

    const codeOwnership: Record<string, number> = {};
    authorCommits.forEach((count, author) => {
      codeOwnership[author] = Math.round((count / totalCommits) * 100) / 100;
    });

    return {
      collaborationPatterns: [], // Will be implemented in later tasks
      knowledgeSilos: [], // Will be implemented in later tasks
      contributionMetrics: {
        totalCommits,
        activeContributors: authorCommits.size,
        codeOwnership,
      },
      reviewPatterns: [], // Will be implemented in later tasks
    };
  }
}
