import { describe, it, expect, beforeEach } from "vitest";
import { RiskAnalyzer } from "@/lib/services/risk-analyzer";
import { FileMetrics } from "@/types/analysis";

describe("RiskAnalyzer", () => {
  let riskAnalyzer: RiskAnalyzer;

  beforeEach(() => {
    riskAnalyzer = new RiskAnalyzer();
  });

  describe("calculateRiskScores", () => {
    it("should calculate risk scores for all files", () => {
      const fileMetrics: FileMetrics[] = [
        {
          filePath: "src/high-risk.ts",
          commitCount: 50,
          authorCount: 8,
          riskScore: 0.8,
          totalChanges: 1000,
          bugCommits: 15,
          lastModified: new Date("2024-01-01"),
          authors: ["author1", "author2", "author3", "author4", "author5", "author6", "author7", "author8"],
        },
        {
          filePath: "src/low-risk.ts",
          commitCount: 5,
          authorCount: 1,
          riskScore: 0.2,
          totalChanges: 50,
          bugCommits: 0,
          lastModified: new Date("2024-01-01"),
          authors: ["author1"],
        },
      ];

      const riskScores = riskAnalyzer.calculateRiskScores(fileMetrics);

      expect(riskScores).toHaveLength(2);
      
      const highRiskScore = riskScores.find(r => r.filePath === "src/high-risk.ts");
      const lowRiskScore = riskScores.find(r => r.filePath === "src/low-risk.ts");

      expect(highRiskScore).toBeDefined();
      expect(lowRiskScore).toBeDefined();
      
      expect(highRiskScore!.score).toBeGreaterThan(lowRiskScore!.score);
      expect(highRiskScore!.factors.changeFrequency).toBeGreaterThan(lowRiskScore!.factors.changeFrequency);
      expect(highRiskScore!.factors.authorDiversity).toBeGreaterThan(lowRiskScore!.factors.authorDiversity);
      expect(highRiskScore!.factors.changeVolume).toBeGreaterThan(lowRiskScore!.factors.changeVolume);
      expect(highRiskScore!.factors.bugRatio).toBeGreaterThan(lowRiskScore!.factors.bugRatio);
    });

    it("should generate appropriate recommendations", () => {
      const fileMetrics: FileMetrics[] = [
        {
          filePath: "src/problematic.ts",
          commitCount: 40, // High frequency
          authorCount: 9,  // High diversity
          riskScore: 0.9,  // High risk
          totalChanges: 900, // High volume
          bugCommits: 15,  // High bug ratio
          lastModified: new Date("2024-01-01"),
          authors: Array.from({ length: 9 }, (_, i) => `author${i + 1}`),
        },
      ];

      const riskScores = riskAnalyzer.calculateRiskScores(fileMetrics);
      const riskScore = riskScores[0];

      expect(riskScore.recommendations).toContain("Consider refactoring this frequently changed file");
      expect(riskScore.recommendations).toContain("High author diversity - ensure consistent coding standards");
      expect(riskScore.recommendations).toContain("Large change volume - consider breaking into smaller modules");
      expect(riskScore.recommendations).toContain("High bug ratio - prioritize for code review and testing");
      // Check that we have a reasonable risk score
      expect(riskScore.score).toBeGreaterThan(0.5);
    });
  });

  describe("identifyHotspots", () => {
    it("should identify files above risk threshold", () => {
      const fileMetrics: FileMetrics[] = [
        {
          filePath: "src/critical.ts",
          commitCount: 50,
          authorCount: 8,
          riskScore: 0.9,
          totalChanges: 1000,
          bugCommits: 20,
          lastModified: new Date("2024-01-01"),
          authors: Array.from({ length: 8 }, (_, i) => `author${i + 1}`),
        },
        {
          filePath: "src/high.ts",
          commitCount: 35,
          authorCount: 6,
          riskScore: 0.75,
          totalChanges: 600,
          bugCommits: 10,
          lastModified: new Date("2024-01-01"),
          authors: Array.from({ length: 6 }, (_, i) => `author${i + 1}`),
        },
        {
          filePath: "src/medium.ts",
          commitCount: 20,
          authorCount: 3,
          riskScore: 0.55,
          totalChanges: 300,
          bugCommits: 5,
          lastModified: new Date("2024-01-01"),
          authors: ["author1", "author2", "author3"],
        },
        {
          filePath: "src/low.ts",
          commitCount: 5,
          authorCount: 1,
          riskScore: 0.2,
          totalChanges: 50,
          bugCommits: 0,
          lastModified: new Date("2024-01-01"),
          authors: ["author1"],
        },
      ];

      const hotspots = riskAnalyzer.identifyHotspots(fileMetrics, 0.5);

      expect(hotspots).toHaveLength(3); // critical, high, medium
      expect(hotspots.map(h => h.filePath)).toEqual([
        "src/critical.ts",
        "src/high.ts", 
        "src/medium.ts"
      ]);

      // Check risk levels
      expect(hotspots[0].riskLevel).toBe("critical");
      expect(hotspots[1].riskLevel).toBe("high");
      expect(hotspots[2].riskLevel).toBe("medium");
    });

    it("should provide detailed reasons for hotspots", () => {
      const fileMetrics: FileMetrics[] = [
        {
          filePath: "src/hotspot.ts",
          commitCount: 35,
          authorCount: 7,
          riskScore: 0.8,
          totalChanges: 800,
          bugCommits: 10,
          lastModified: new Date("2024-01-01"),
          authors: Array.from({ length: 7 }, (_, i) => `author${i + 1}`),
        },
      ];

      const hotspots = riskAnalyzer.identifyHotspots(fileMetrics);
      const hotspot = hotspots[0];

      expect(hotspot.reasons).toContain("High risk score");
      expect(hotspot.reasons).toContain("High commit frequency (35 commits)");
      expect(hotspot.reasons).toContain("Many contributors (7 authors)");
      expect(hotspot.reasons).toContain("Large change volume (800 changes)");
      expect(hotspot.reasons.some(r => r.includes("Bug fixes present"))).toBe(true);
    });

    it("should sort hotspots by risk score descending", () => {
      const fileMetrics: FileMetrics[] = [
        {
          filePath: "src/medium.ts",
          commitCount: 20,
          authorCount: 3,
          riskScore: 0.6,
          totalChanges: 300,
          bugCommits: 5,
          lastModified: new Date("2024-01-01"),
          authors: ["author1", "author2", "author3"],
        },
        {
          filePath: "src/high.ts",
          commitCount: 35,
          authorCount: 6,
          riskScore: 0.8,
          totalChanges: 600,
          bugCommits: 10,
          lastModified: new Date("2024-01-01"),
          authors: Array.from({ length: 6 }, (_, i) => `author${i + 1}`),
        },
        {
          filePath: "src/critical.ts",
          commitCount: 50,
          authorCount: 8,
          riskScore: 0.9,
          totalChanges: 1000,
          bugCommits: 20,
          lastModified: new Date("2024-01-01"),
          authors: Array.from({ length: 8 }, (_, i) => `author${i + 1}`),
        },
      ];

      const hotspots = riskAnalyzer.identifyHotspots(fileMetrics, 0.5);

      expect(hotspots[0].filePath).toBe("src/critical.ts");
      expect(hotspots[1].filePath).toBe("src/high.ts");
      expect(hotspots[2].filePath).toBe("src/medium.ts");
    });
  });

  describe("predictRiskTrends", () => {
    it("should detect increasing risk trend", () => {
      const historicalMetrics: FileMetrics[][] = [
        [
          {
            filePath: "src/trending.ts",
            commitCount: 10,
            authorCount: 2,
            riskScore: 0.3,
            totalChanges: 100,
            bugCommits: 1,
            lastModified: new Date("2024-01-01"),
            authors: ["author1", "author2"],
          },
        ],
        [
          {
            filePath: "src/trending.ts",
            commitCount: 20,
            authorCount: 4,
            riskScore: 0.6,
            totalChanges: 300,
            bugCommits: 5,
            lastModified: new Date("2024-01-15"),
            authors: ["author1", "author2", "author3", "author4"],
          },
        ],
        [
          {
            filePath: "src/trending.ts",
            commitCount: 35,
            authorCount: 6,
            riskScore: 0.8,
            totalChanges: 600,
            bugCommits: 12,
            lastModified: new Date("2024-02-01"),
            authors: Array.from({ length: 6 }, (_, i) => `author${i + 1}`),
          },
        ],
      ];

      const trends = riskAnalyzer.predictRiskTrends(historicalMetrics);

      expect(trends).toHaveLength(1);
      expect(trends[0].filePath).toBe("src/trending.ts");
      expect(trends[0].trend).toBe("increasing");
      expect(trends[0].confidence).toBeGreaterThan(0.5);
      expect(trends[0].historicalScores).toHaveLength(3);
    });

    it("should detect decreasing risk trend", () => {
      const historicalMetrics: FileMetrics[][] = [
        [
          {
            filePath: "src/improving.ts",
            commitCount: 40,
            authorCount: 8,
            riskScore: 0.9,
            totalChanges: 800,
            bugCommits: 20,
            lastModified: new Date("2024-01-01"),
            authors: Array.from({ length: 8 }, (_, i) => `author${i + 1}`),
          },
        ],
        [
          {
            filePath: "src/improving.ts",
            commitCount: 25,
            authorCount: 5,
            riskScore: 0.6,
            totalChanges: 500,
            bugCommits: 8,
            lastModified: new Date("2024-01-15"),
            authors: Array.from({ length: 5 }, (_, i) => `author${i + 1}`),
          },
        ],
        [
          {
            filePath: "src/improving.ts",
            commitCount: 15,
            authorCount: 3,
            riskScore: 0.3,
            totalChanges: 200,
            bugCommits: 2,
            lastModified: new Date("2024-02-01"),
            authors: ["author1", "author2", "author3"],
          },
        ],
      ];

      const trends = riskAnalyzer.predictRiskTrends(historicalMetrics);

      expect(trends).toHaveLength(1);
      expect(trends[0].filePath).toBe("src/improving.ts");
      expect(trends[0].trend).toBe("decreasing");
      expect(trends[0].confidence).toBeGreaterThan(0.5);
    });

    it("should detect stable risk trend", () => {
      const historicalMetrics: FileMetrics[][] = [
        [
          {
            filePath: "src/stable.ts",
            commitCount: 20,
            authorCount: 3,
            riskScore: 0.5,
            totalChanges: 300,
            bugCommits: 5,
            lastModified: new Date("2024-01-01"),
            authors: ["author1", "author2", "author3"],
          },
        ],
        [
          {
            filePath: "src/stable.ts",
            commitCount: 22,
            authorCount: 3,
            riskScore: 0.52,
            totalChanges: 320,
            bugCommits: 5,
            lastModified: new Date("2024-01-15"),
            authors: ["author1", "author2", "author3"],
          },
        ],
        [
          {
            filePath: "src/stable.ts",
            commitCount: 21,
            authorCount: 3,
            riskScore: 0.48,
            totalChanges: 310,
            bugCommits: 5,
            lastModified: new Date("2024-02-01"),
            authors: ["author1", "author2", "author3"],
          },
        ],
      ];

      const trends = riskAnalyzer.predictRiskTrends(historicalMetrics);

      expect(trends).toHaveLength(1);
      expect(trends[0].filePath).toBe("src/stable.ts");
      expect(trends[0].trend).toBe("stable");
      expect(trends[0].confidence).toBe(0.8);
    });

    it("should handle files with insufficient data", () => {
      const historicalMetrics: FileMetrics[][] = [
        [
          {
            filePath: "src/single.ts",
            commitCount: 10,
            authorCount: 2,
            riskScore: 0.3,
            totalChanges: 100,
            bugCommits: 1,
            lastModified: new Date("2024-01-01"),
            authors: ["author1", "author2"],
          },
        ],
      ];

      const trends = riskAnalyzer.predictRiskTrends(historicalMetrics);

      expect(trends).toHaveLength(0); // Should skip files with < 2 data points
    });
  });
});