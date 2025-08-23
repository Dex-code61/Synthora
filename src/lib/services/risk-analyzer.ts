import { FileMetrics, RiskScore } from "@/types/analysis";

export interface Hotspot {
  filePath: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
  metrics: {
    commitCount: number;
    authorCount: number;
    totalChanges: number;
    bugCommits: number;
  };
}

export interface RiskTrend {
  filePath: string;
  trend: "increasing" | "decreasing" | "stable";
  confidence: number;
  historicalScores: { date: Date; score: number }[];
}

export class RiskAnalyzer {
  /**
   * Calculates comprehensive risk scores for all files
   */
  calculateRiskScores(fileMetrics: FileMetrics[]): RiskScore[] {
    return fileMetrics.map((metrics) => {
      const daysSinceLastChange = Math.floor(
        (Date.now() - metrics.lastModified.getTime()) / (1000 * 60 * 60 * 24)
      );

      const riskScore = this.calculateDetailedRiskScore(
        metrics.commitCount,
        metrics.authorCount,
        metrics.totalChanges,
        metrics.bugCommits,
        daysSinceLastChange
      );

      return {
        ...riskScore,
        filePath: metrics.filePath,
      };
    });
  }

  /**
   * Identifies high-risk files (hotspots)
   */
  identifyHotspots(fileMetrics: FileMetrics[], threshold: number = 0.6): Hotspot[] {
    const hotspots: Hotspot[] = [];

    for (const metrics of fileMetrics) {
      if (metrics.riskScore >= threshold) {
        const reasons: string[] = [];
        let riskLevel: "low" | "medium" | "high" | "critical";

        // Determine risk level and reasons
        if (metrics.riskScore >= 0.9) {
          riskLevel = "critical";
          reasons.push("Extremely high risk score");
        } else if (metrics.riskScore >= 0.7) {
          riskLevel = "high";
          reasons.push("High risk score");
        } else if (metrics.riskScore >= 0.5) {
          riskLevel = "medium";
          reasons.push("Medium risk score");
        } else {
          riskLevel = "low";
        }

        // Add specific reasons based on metrics
        if (metrics.commitCount > 30) {
          reasons.push(`High commit frequency (${metrics.commitCount} commits)`);
        }
        if (metrics.authorCount > 5) {
          reasons.push(`Many contributors (${metrics.authorCount} authors)`);
        }
        if (metrics.totalChanges > 500) {
          reasons.push(`Large change volume (${metrics.totalChanges} changes)`);
        }
        if (metrics.bugCommits > 0) {
          const bugRatio = (metrics.bugCommits / metrics.commitCount) * 100;
          reasons.push(`Bug fixes present (${bugRatio.toFixed(1)}% of commits)`);
        }

        hotspots.push({
          filePath: metrics.filePath,
          riskScore: metrics.riskScore,
          riskLevel,
          reasons,
          metrics: {
            commitCount: metrics.commitCount,
            authorCount: metrics.authorCount,
            totalChanges: metrics.totalChanges,
            bugCommits: metrics.bugCommits,
          },
        });
      }
    }

    return hotspots.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Predicts risk trends based on historical data
   */
  predictRiskTrends(historicalMetrics: FileMetrics[][]): RiskTrend[] {
    // Group metrics by file path
    const fileGroups = new Map<string, FileMetrics[]>();
    
    historicalMetrics.forEach((metricsSnapshot) => {
      metricsSnapshot.forEach((metrics) => {
        if (!fileGroups.has(metrics.filePath)) {
          fileGroups.set(metrics.filePath, []);
        }
        fileGroups.get(metrics.filePath)!.push(metrics);
      });
    });

    const trends: RiskTrend[] = [];

    for (const [filePath, metrics] of fileGroups) {
      if (metrics.length < 2) continue; // Need at least 2 data points

      // Sort by last modified date
      const sortedMetrics = metrics.sort(
        (a, b) => a.lastModified.getTime() - b.lastModified.getTime()
      );

      const historicalScores = sortedMetrics.map((m) => ({
        date: m.lastModified,
        score: m.riskScore,
      }));

      // Calculate trend
      const firstScore = sortedMetrics[0].riskScore;
      const lastScore = sortedMetrics[sortedMetrics.length - 1].riskScore;
      const scoreDiff = lastScore - firstScore;

      let trend: "increasing" | "decreasing" | "stable";
      let confidence: number;

      if (Math.abs(scoreDiff) < 0.1) {
        trend = "stable";
        confidence = 0.8;
      } else if (scoreDiff > 0) {
        trend = "increasing";
        confidence = Math.min(scoreDiff * 2, 1.0);
      } else {
        trend = "decreasing";
        confidence = Math.min(Math.abs(scoreDiff) * 2, 1.0);
      }

      trends.push({
        filePath,
        trend,
        confidence,
        historicalScores,
      });
    }

    return trends;
  }

  /**
   * Calculates detailed risk score with factors breakdown
   */
  private calculateDetailedRiskScore(
    commitCount: number,
    authorCount: number,
    totalChanges: number,
    bugCommits: number,
    daysSinceLastChange: number = 0
  ): Omit<RiskScore, "filePath"> {
    // Normalize factors (0-1 scale)
    const changeFrequency = Math.min(commitCount / 50, 1);
    const authorDiversity = Math.min(authorCount / 10, 1);
    const changeVolume = Math.min(totalChanges / 1000, 1);
    const bugRatio = commitCount > 0 ? bugCommits / commitCount : 0;

    // Additional factor: recency (files changed recently might be more volatile)
    const recencyFactor = daysSinceLastChange > 0 ? Math.min(1 / (daysSinceLastChange / 30), 1) : 0;

    const factors = {
      changeFrequency,
      authorDiversity,
      changeVolume,
      bugRatio,
    };

    // Weighted risk score with recency consideration
    const score = Math.min(
      changeFrequency * 0.25 +
      authorDiversity * 0.15 +
      changeVolume * 0.25 +
      bugRatio * 0.25 +
      recencyFactor * 0.1,
      1.0
    );

    // Generate recommendations based on risk factors
    const recommendations: string[] = [];
    
    if (changeFrequency > 0.7) {
      recommendations.push("Consider refactoring this frequently changed file");
    }
    if (authorDiversity > 0.8) {
      recommendations.push("High author diversity - ensure consistent coding standards");
    }
    if (changeVolume > 0.8) {
      recommendations.push("Large change volume - consider breaking into smaller modules");
    }
    if (bugRatio > 0.3) {
      recommendations.push("High bug ratio - prioritize for code review and testing");
    }
    if (score > 0.8) {
      recommendations.push("Critical risk file - immediate attention recommended");
    }

    return {
      score: Math.round(score * 100) / 100,
      factors,
      recommendations,
    };
  }
}