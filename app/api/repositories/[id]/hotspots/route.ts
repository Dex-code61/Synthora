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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get("threshold") || "0.5");
    const limit = parseInt(searchParams.get("limit") || "20");
    const riskLevel = searchParams.get("riskLevel") as "low" | "medium" | "high" | "critical" | null;

    // Get file metrics
    const fileMetricsRaw = await prisma.fileMetrics.findMany({
      where: { 
        repositoryId,
        riskScore: { gte: threshold },
      },
      orderBy: { riskScore: "desc" },
      take: limit,
    });

    // Get authors for each file to match FileMetrics interface
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

    // Calculate hotspots
    const riskAnalyzer = new RiskAnalyzer();
    let hotspots = riskAnalyzer.identifyHotspots(fileMetricsWithAuthors, threshold);

    // Filter by risk level if specified
    if (riskLevel) {
      hotspots = hotspots.filter(h => h.riskLevel === riskLevel);
    }

    // Get additional file information
    const hotspotsWithDetails = await Promise.all(
      hotspots.map(async (hotspot) => {
        // Get recent commits for this file
        const recentCommits = await prisma.commit.findMany({
          where: {
            repositoryId,
            fileChanges: {
              some: {
                filePath: hotspot.filePath,
              },
            },
          },
          orderBy: { timestamp: "desc" },
          take: 5,
          select: {
            sha: true,
            authorName: true,
            message: true,
            timestamp: true,
          },
        });

        // Get authors who worked on this file
        const authors = await prisma.commit.groupBy({
          by: ["authorName"],
          where: {
            repositoryId,
            fileChanges: {
              some: {
                filePath: hotspot.filePath,
              },
            },
          },
          _count: {
            authorName: true,
          },
          orderBy: {
            _count: {
              authorName: "desc",
            },
          },
        });

        return {
          ...hotspot,
          recentCommits,
          authors: authors.map(a => ({
            name: a.authorName,
            commitCount: a._count.authorName,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        repositoryId,
        hotspots: hotspotsWithDetails,
        summary: {
          totalHotspots: hotspots.length,
          criticalFiles: hotspots.filter(h => h.riskLevel === "critical").length,
          highRiskFiles: hotspots.filter(h => h.riskLevel === "high").length,
          mediumRiskFiles: hotspots.filter(h => h.riskLevel === "medium").length,
          threshold,
        },
      },
    });
  } catch (error) {
    console.error("Failed to get hotspots:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get hotspots",
      },
      { status: 500 }
    );
  }
}