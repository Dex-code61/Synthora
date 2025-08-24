import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { RiskAnalyzer } from "@/lib/services/risk-analyzer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const repositoryId = parseInt(id);
    
    if (isNaN(repositoryId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository ID",
        },
        { status: 400 }
      );
    }

    // Verify repository ownership
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
    });

    if (!repository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not found",
        },
        { status: 404 }
      );
    }

    // Get file metrics
    const fileMetricsRaw = await prisma.fileMetrics.findMany({
      where: { repositoryId },
      orderBy: { riskScore: "desc" },
    });

    if (fileMetricsRaw.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          repositoryId,
          riskScores: [],
          summary: {
            totalFiles: 0,
            averageRiskScore: 0,
            highRiskFiles: 0,
            mediumRiskFiles: 0,
            lowRiskFiles: 0,
            riskDistribution: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
            },
          },
        },
      });
    }

    // Transform data to match FileMetrics interface
    const fileMetricsWithAuthors = await Promise.all(
      fileMetricsRaw.map(async (metrics) => {
        const authors = await prisma.commit.groupBy({
          by: ["authorName"],
          where: {
            repositoryId,
            fileChanges: {
              some: {
                filePath: metrics.filePath,
              },
            },
          },
        });

        return {
          filePath: metrics.filePath,
          commitCount: metrics.commitCount,
          authorCount: metrics.authorCount,
          riskScore: metrics.riskScore,
          totalChanges: metrics.totalChanges,
          bugCommits: metrics.bugCommits,
          lastModified: metrics.lastModified,
          authors: authors.map(a => a.authorName),
        };
      })
    );

    // Calculate risk scores
    const riskAnalyzer = new RiskAnalyzer();
    const riskScores = riskAnalyzer.calculateRiskScores(fileMetricsWithAuthors);

    // Calculate summary statistics
    const totalFiles = fileMetricsRaw.length;
    const averageRiskScore = fileMetricsRaw.reduce((sum, file) => sum + file.riskScore, 0) / totalFiles;
    
    const riskDistribution = {
      critical: fileMetricsRaw.filter(f => f.riskScore >= 0.8).length,
      high: fileMetricsRaw.filter(f => f.riskScore >= 0.6 && f.riskScore < 0.8).length,
      medium: fileMetricsRaw.filter(f => f.riskScore >= 0.4 && f.riskScore < 0.6).length,
      low: fileMetricsRaw.filter(f => f.riskScore < 0.4).length,
    };

    const highRiskFiles = riskDistribution.critical + riskDistribution.high;
    const mediumRiskFiles = riskDistribution.medium;
    const lowRiskFiles = riskDistribution.low;

    // Get top risk factors
    const topRiskFactors = riskScores
      .slice(0, 10)
      .map(score => ({
        filePath: score.filePath,
        riskScore: score.score,
        topFactor: Object.entries(score.factors)
          .sort(([,a], [,b]) => b - a)[0][0],
        topFactorValue: Object.entries(score.factors)
          .sort(([,a], [,b]) => b - a)[0][1],
      }));

    return NextResponse.json({
      success: true,
      data: {
        repositoryId,
        riskScores,
        summary: {
          totalFiles,
          averageRiskScore: Math.round(averageRiskScore * 100) / 100,
          highRiskFiles,
          mediumRiskFiles,
          lowRiskFiles,
          riskDistribution,
        },
        topRiskFactors,
        lastAnalyzed: repository.lastAnalyzed,
      },
    });
  } catch (error) {
    console.error("Failed to get risk analysis:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get risk analysis",
      },
      { status: 500 }
    );
  }
}