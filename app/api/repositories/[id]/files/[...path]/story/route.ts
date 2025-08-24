import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storyGenerator } from "@/lib/services/story-generator";
import { storyCacheService } from "@/lib/services/story-cache";
import { GitAnalyzer } from "@/lib/services/git-analyzer";
import { ApiResponse } from "@/types/api";
import { FileStory } from "@/lib/services/story-generator";

interface RouteParams {
  params: {
    id: string;
    path: string[];
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<FileStory>>> {
  try {
    const repositoryId = parseInt(params.id);
    const filePath = params.path.join("/");

    if (isNaN(repositoryId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository ID",
        },
        { status: 400 }
      );
    }

    if (!filePath) {
      return NextResponse.json(
        {
          success: false,
          error: "File path is required",
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get("refresh") === "true";
    const maxAge = searchParams.get("maxAge")
      ? parseInt(searchParams.get("maxAge")!)
      : undefined;

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
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

    // Try to get cached story first
    const cachedStory = await storyCacheService.getCachedStory(
      repositoryId,
      filePath,
      { forceRefresh, maxAge }
    );

    if (cachedStory && !forceRefresh) {
      return NextResponse.json({
        success: true,
        data: cachedStory,
        message: "Story retrieved from cache",
      });
    }

    // Generate new story
    const story = await generateFileStory(repository, filePath);

    // Cache the generated story
    await storyCacheService.cacheStory(repositoryId, story);

    return NextResponse.json({
      success: true,
      data: story,
      message: "Story generated successfully",
    });
  } catch (error) {
    console.error("Error in file story API:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate file story",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const repositoryId = parseInt(params.id);
    const filePath = params.path.join("/");

    if (isNaN(repositoryId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid repository ID",
        },
        { status: 400 }
      );
    }

    await storyCacheService.deleteCachedStory(repositoryId, filePath);

    return NextResponse.json({
      success: true,
      message: "Cached story deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting cached story:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete cached story",
      },
      { status: 500 }
    );
  }
}

async function generateFileStory(
  repository: { id: number; path: string; name: string },
  filePath: string
): Promise<FileStory> {
  try {
    // Get file history from Git
    const gitAnalyzer = new GitAnalyzer(repository.path);
    const fileHistory = await gitAnalyzer.getFileHistory(filePath);

    // Get commits that affected this file
    const commits = await gitAnalyzer.getCommitHistory({
      maxCount: 100, // Limit to recent commits for performance
    });

    const fileCommits = commits.filter((commit: any) =>
      commit.files.some((f: any) => f.filePath === filePath)
    );

    // Get or calculate file metrics
    let fileMetrics = await prisma.fileMetrics.findUnique({
      where: {
        repositoryId_filePath: {
          repositoryId: repository.id,
          filePath,
        },
      },
    });

    // If no metrics exist, calculate basic ones
    if (!fileMetrics) {
      const authors = [...new Set(fileCommits.map((c: any) => c.author))];
      const totalChanges = fileCommits.reduce((sum: number, c: any) => {
        const fileChange = c.files.find((f: any) => f.filePath === filePath);
        return (
          sum + (fileChange?.insertions || 0) + (fileChange?.deletions || 0)
        );
      }, 0);

      const bugCommits = fileCommits.filter((c: any) =>
        /\b(fix|bug|error|issue|patch)\b/i.test(c.message)
      ).length;

      // Create basic metrics
      fileMetrics = {
        id: 0,
        repositoryId: repository.id,
        filePath,
        commitCount: fileCommits.length,
        authorCount: authors.length,
        riskScore: Math.min(
          1.0,
          (bugCommits / Math.max(fileCommits.length, 1)) * 2
        ), // Simple risk calculation
        totalChanges,
        bugCommits,
        lastModified:
          fileCommits.length > 0 ? fileCommits[0].timestamp : new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Convert to the format expected by StoryGenerator
    const metricsForGenerator = {
      filePath: fileMetrics.filePath,
      commitCount: fileMetrics.commitCount,
      authorCount: fileMetrics.authorCount,
      riskScore: fileMetrics.riskScore,
      totalChanges: fileMetrics.totalChanges,
      bugCommits: fileMetrics.bugCommits,
      lastModified: fileMetrics.lastModified,
      authors: [...new Set(fileCommits.map((c: any) => c.author))] as string[],
    };

    // Generate the story
    const story = await storyGenerator.generateFileStory(
      filePath,
      fileHistory,
      metricsForGenerator,
      fileCommits
    );

    return story;
  } catch (error) {
    console.error("Error generating file story:", error);
    throw new Error(
      `Failed to generate story for ${filePath}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
