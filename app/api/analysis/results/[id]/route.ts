import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { RiskAnalyzer } from "@/lib/services/risk-analyzer";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const repositoryId = parseInt(params.id);
    
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

    // Get analysis results
    const [commits, fileMetrics] = await Promise.all([
      prisma.commit.findMany({
        where: { repositoryId },
        include: {
          fileChanges: true,
        },
        orderBy: { timestamp: "desc" },
        take: 100, // Limit for performance
      }),
      prisma.fileMetrics.findMany({
        where: { repositoryId },
        orderBy: { riskScore: "desc" },
      }),
    ]);

    // Calculate additional insights
    const riskAnalyzer = new RiskAnalyzer();
    const riskScores = riskAnalyzer.calculateRiskScores(fileMetrics);
    const hotspots = riskAnalyzer.identifyHotspots(fileMetrics);

    // Calculate summary statistics
    const totalCommits = await prisma.commit.count({
      where: { repositoryId },
    });

    const uniqueAuthors = await prisma.commit.groupBy({
      by: ["authorName"],
      where: { repositoryId },
      _count: {
        authorName: true,
      },
    });

    const totalFiles = fileMetrics.length;
    const highRiskFiles = fileMetrics.filter(f => f.riskScore > 0.7).length;
    const averageRiskScore = fileMetrics.length > 0 
      ? fileMetrics.reduce((sum, f) => sum + f.riskScore, 0) / fileMetrics.length 
      : 0;

    const summary = {
      totalCommits,
      totalFiles,
      uniqueAuthors: uniqueAuthors.length,
      highRiskFiles,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      lastAnalyzed: repository.lastAnalyzed,
    };

    return NextResponse.json({
      success: true,
      data: {
        repositoryId,
        summary,
        recentCommits: commits.map(commit => ({
          sha: commit.sha,
          author: commit.authorName,
          message: commit.message,
          timestamp: commit.timestamp,
          filesChanged: commit.filesChanged,
          insertions: commit.insertions,
          deletions: commit.deletions,
        })),
        fileMetrics: fileMetrics.slice(0, 50), // Limit for performance
        riskScores: riskScores.slice(0, 20), // Top 20 risk scores
        hotspots: hotspots.slice(0, 10), // Top 10 hotspots
      },
    });
  } catch (error) {
    console.error("Failed to get analysis results:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get analysis results",
      },
      { status: 500 }
    );
  }
}