import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { AnalysisJobService } from "@/lib/services/analysis-job";

const analyzeRequestSchema = z.object({
  maxCommits: z.number().optional().default(1000),
  incremental: z.boolean().optional().default(false),
});

export async function POST(
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

    // Parse request body
    const body = await request.json();
    const { maxCommits, incremental } = analyzeRequestSchema.parse(body);

    // Get last analyzed SHA for incremental analysis
    let lastAnalyzedSha: string | undefined;
    if (incremental && repository.lastAnalyzed) {
      const lastCommit = await prisma.commit.findFirst({
        where: { repositoryId },
        orderBy: { timestamp: "desc" },
        select: { sha: true },
      });
      lastAnalyzedSha = lastCommit?.sha;
    }

    // Start analysis job
    const jobId = await AnalysisJobService.startAnalysis({
      repositoryId,
      repositoryPath: repository.path,
      userId: session.user.id,
      options: {
        maxCommits,
        incremental,
        lastAnalyzedSha,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        repositoryId,
        status: "started",
      },
    });
  } catch (error) {
    console.error("Failed to start repository analysis:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to start analysis",
      },
      { status: 500 }
    );
  }
}