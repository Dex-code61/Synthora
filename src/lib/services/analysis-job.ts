import Queue from "bull";
import { GitAnalyzer } from "./git-analyzer";
import { RiskAnalyzer } from "./risk-analyzer";
import { prisma } from "@/lib/prisma";
import { AnalysisResult } from "@/types/analysis";

export interface AnalysisJobData {
  repositoryId: number;
  repositoryPath: string;
  userId: string;
  options?: {
    maxCommits?: number;
    incremental?: boolean;
    lastAnalyzedSha?: string;
  };
}

export interface AnalysisJobResult {
  repositoryId: number;
  success: boolean;
  error?: string;
  metrics?: {
    commitsProcessed: number;
    filesAnalyzed: number;
    processingTime: number;
  };
}

export interface JobStatus {
  id: string;
  status: "waiting" | "active" | "completed" | "failed";
  progress: number;
  data?: AnalysisJobData;
  result?: AnalysisJobResult;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

// Create Redis connection for Bull queue
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

// Create analysis queue
export const analysisQueue = new Queue<AnalysisJobData>("repository-analysis", {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Job processor
analysisQueue.process(async (job) => {
  const { repositoryId, repositoryPath, userId, options } = job.data;
  
  try {
    // Update job progress
    await job.progress(10);

    // Initialize services
    const gitAnalyzer = new GitAnalyzer(repositoryPath);
    const riskAnalyzer = new RiskAnalyzer();

    // Validate repository
    await gitAnalyzer.detectRepository();
    await job.progress(20);

    // Get commit history
    const gitOptions = {
      maxCount: options?.maxCommits || 1000,
    };

    const commits = await gitAnalyzer.getCommitHistory(gitOptions);
    await job.progress(50);

    // Calculate file metrics
    const fileMetrics = await gitAnalyzer.calculateFileMetrics(commits);
    await job.progress(70);

    // Calculate risk scores
    const riskScores = riskAnalyzer.calculateRiskScores(fileMetrics);
    await job.progress(80);

    // Store results in database
    await prisma.$transaction(async (tx) => {
      // Update repository last analyzed timestamp
      await tx.repository.update({
        where: { id: repositoryId },
        data: { lastAnalyzed: new Date() },
      });

      // Clear existing data if not incremental
      if (!options?.incremental) {
        await tx.commit.deleteMany({
          where: { repositoryId },
        });
        await tx.fileMetrics.deleteMany({
          where: { repositoryId },
        });
      }

      // Store commits
      for (const commit of commits) {
        const createdCommit = await tx.commit.upsert({
          where: { sha: commit.sha },
          update: {},
          create: {
            repositoryId,
            sha: commit.sha,
            authorName: commit.author,
            authorEmail: commit.email,
            message: commit.message,
            timestamp: commit.timestamp,
            filesChanged: commit.filesChanged,
            insertions: commit.insertions,
            deletions: commit.deletions,
          },
        });

        // Store file changes
        for (const fileChange of commit.files) {
          await tx.fileChange.create({
            data: {
              commitId: createdCommit.id,
              filePath: fileChange.filePath,
              changeType: fileChange.changeType,
              insertions: fileChange.insertions,
              deletions: fileChange.deletions,
            },
          });
        }
      }

      // Store file metrics
      for (const metrics of fileMetrics) {
        await tx.fileMetrics.upsert({
          where: {
            repositoryId_filePath: {
              repositoryId,
              filePath: metrics.filePath,
            },
          },
          update: {
            commitCount: metrics.commitCount,
            authorCount: metrics.authorCount,
            riskScore: metrics.riskScore,
            totalChanges: metrics.totalChanges,
            bugCommits: metrics.bugCommits,
            lastModified: metrics.lastModified,
          },
          create: {
            repositoryId,
            filePath: metrics.filePath,
            commitCount: metrics.commitCount,
            authorCount: metrics.authorCount,
            riskScore: metrics.riskScore,
            totalChanges: metrics.totalChanges,
            bugCommits: metrics.bugCommits,
            lastModified: metrics.lastModified,
          },
        });
      }
    });

    await job.progress(100);

    return {
      repositoryId,
      success: true,
      metrics: {
        commitsProcessed: commits.length,
        filesAnalyzed: fileMetrics.length,
        processingTime: Date.now() - job.timestamp,
      },
    };
  } catch (error) {
    console.error(`Analysis job failed for repository ${repositoryId}:`, error);
    
    return {
      repositoryId,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

export class AnalysisJobService {
  /**
   * Starts a new analysis job
   */
  static async startAnalysis(data: AnalysisJobData): Promise<string> {
    const job = await analysisQueue.add(data, {
      priority: 1,
      delay: 0,
    });

    return job.id.toString();
  }

  /**
   * Gets the status of a job
   */
  static async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const job = await analysisQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    
    return {
      id: jobId,
      status: state as JobStatus["status"],
      progress: job.progress(),
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
    };
  }

  /**
   * Gets all jobs for a user
   */
  static async getUserJobs(userId: string): Promise<JobStatus[]> {
    const jobs = await analysisQueue.getJobs(["waiting", "active", "completed", "failed"]);
    
    const userJobs = jobs.filter(job => job.data.userId === userId);
    
    const jobStatuses: JobStatus[] = [];
    
    for (const job of userJobs) {
      const state = await job.getState();
      
      jobStatuses.push({
        id: job.id.toString(),
        status: state as JobStatus["status"],
        progress: job.progress(),
        data: job.data,
        result: job.returnvalue,
        error: job.failedReason,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      });
    }

    return jobStatuses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancels a job
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    const job = await analysisQueue.getJob(jobId);
    
    if (!job) {
      return false;
    }

    try {
      await job.remove();
      return true;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Cleans up old jobs
   */
  static async cleanupJobs(): Promise<void> {
    await analysisQueue.clean(24 * 60 * 60 * 1000, "completed"); // Remove completed jobs older than 24 hours
    await analysisQueue.clean(7 * 24 * 60 * 60 * 1000, "failed"); // Remove failed jobs older than 7 days
  }
}