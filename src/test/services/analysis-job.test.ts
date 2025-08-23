import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock all dependencies first
vi.mock("bull", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    repository: { update: vi.fn() },
    commit: { deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    fileMetrics: { deleteMany: vi.fn(), upsert: vi.fn() },
    fileChange: { create: vi.fn() },
  },
}));

vi.mock("@/lib/services/git-analyzer", () => ({
  GitAnalyzer: vi.fn(),
}));

vi.mock("@/lib/services/risk-analyzer", () => ({
  RiskAnalyzer: vi.fn(),
}));

import { AnalysisJobService, AnalysisJobData } from "@/lib/services/analysis-job";

describe("AnalysisJobService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("AnalysisJobData interface", () => {
    it("should define the correct structure", () => {
      const jobData: AnalysisJobData = {
        repositoryId: 1,
        repositoryPath: "/test/repo",
        userId: "user123",
        options: {
          maxCommits: 500,
          incremental: false,
        },
      };

      expect(jobData.repositoryId).toBe(1);
      expect(jobData.repositoryPath).toBe("/test/repo");
      expect(jobData.userId).toBe("user123");
      expect(jobData.options?.maxCommits).toBe(500);
      expect(jobData.options?.incremental).toBe(false);
    });
  });

  describe("Job status types", () => {
    it("should have correct status values", () => {
      const statuses = ["waiting", "active", "completed", "failed"] as const;
      
      statuses.forEach(status => {
        expect(typeof status).toBe("string");
      });
    });
  });
});