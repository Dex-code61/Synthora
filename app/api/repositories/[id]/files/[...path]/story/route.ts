import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StoryGenerator } from "@/lib/services/story-generator";
import { StoryCacheService } from "@/lib/services/story-cache";
import { StoryErrorHandler } from "@/lib/services/story-error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; path: string[] }> }
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

    const { id, path } = await params;
    const repositoryId = parseInt(id);
    const filePath = path.join("/");

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
    const forceRegenerate = searchParams.get("regenerate") === "true";
    const includeMetrics = searchParams.get("includeMetrics") !== "false";
    const includeHistory = searchParams.get("includeHistory") !== "false";

    try {
      // Check cache first (unless force regenerate is requested)
      const storyCache = new StoryCacheService();
      let cachedStory = null;

      if (!forceRegenerate) {
        cachedStory = await storyCache.getCachedStory(repositoryId, filePath);
        if (cachedStory) {
          return NextResponse.json({
            success: true,
            data: {
              repositoryId,
              filePath,
              story: cachedStory,
              cached: true,
              generatedAt: cachedStory.generatedAt,
            },
          });
        }
      }

      // Check if file exists in the repository
      const fileMetrics = await prisma.fileMetrics.findFirst({
        where: {
          repositoryId,
          filePath,
        },
      });

      if (!fileMetrics) {
        return NextResponse.json(
          {
            success: false,
            error: "File not found in repository analysis",
          },
          { status: 404 }
        );
      }

      // Get file history if requested
      let fileHistory = null;
      if (includeHistory) {
        fileHistory = await prisma.commit.findMany({
          where: {
            repositoryId,
            fileChanges: {
              some: {
                filePath,
              },
            },
          },
          orderBy: { timestamp: "desc" },
          take: 20, // Limit to last 20 commits
          select: {
            sha: true,
            authorName: true,
            authorEmail: true,
            message: true,
            timestamp: true,
            fileChanges: {
              where: {
                filePath,
              },
              select: {
                changeType: true,
                insertions: true,
                deletions: true,
              },
            },
          },
        });
      }

      // Get related files (files that were often changed together)
      const relatedFiles = await prisma.commit.findMany({
        where: {
          repositoryId,
          fileChanges: {
            some: {
              filePath,
            },
          },
        },
        select: {
          fileChanges: {
            where: {
              filePath: {
                not: filePath,
              },
            },
            select: {
              filePath: true,
            },
          },
        },
        take: 50,
      });

      // Count related file frequencies
      const relatedFileFreq: Record<string, number> = {};
      relatedFiles.forEach((commit) => {
        commit.fileChanges.forEach((change) => {
          relatedFileFreq[change.filePath] =
            (relatedFileFreq[change.filePath] || 0) + 1;
        });
      });

      const topRelatedFiles = Object.entries(relatedFileFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([path, frequency]) => ({ filePath: path, frequency }));

      // Generate story
      const storyGenerator = new StoryGenerator();
      const story = await storyGenerator.generateDetailedFileStory({
        repositoryId,
        filePath,
        fileMetrics,
        fileHistory: fileHistory || [],
        relatedFiles: topRelatedFiles,
        includeMetrics,
      });

      // Cache the generated story
      await storyCache.cacheStory(repositoryId, filePath, story);

      return NextResponse.json({
        success: true,
        data: {
          repositoryId,
          filePath,
          story,
          cached: false,
          generatedAt: new Date().toISOString(),
          metadata: {
            fileMetrics: includeMetrics
              ? {
                  commitCount: fileMetrics.commitCount,
                  authorCount: fileMetrics.authorCount,
                  riskScore: fileMetrics.riskScore,
                  totalChanges: fileMetrics.totalChanges,
                  bugCommits: fileMetrics.bugCommits,
                  lastModified: fileMetrics.lastModified,
                }
              : undefined,
            relatedFiles: topRelatedFiles,
            historyCount: fileHistory?.length || 0,
          },
        },
      });
    } catch (storyError) {
      // Handle story generation errors
      const errorHandler = new StoryErrorHandler();
      const classifiedError = errorHandler.classifyError(storyError as Error);
      const userMessage = errorHandler.getUserFriendlyMessage(classifiedError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate file story",
          details: userMessage,
          errorType: classifiedError.type,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to get file story:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get file story",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; path: string[] }> }
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

    const { id, path } = await params;
    const repositoryId = parseInt(id);
    const filePath = path.join("/");

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

    // Parse request body for custom story generation options
    const body = await request.json();
    const {
      customPrompt,
      focusAreas = [],
      includeMetrics = true,
      includeHistory = true,
      maxHistoryItems = 20,
    } = body;

    try {
      // Get file metrics
      const fileMetrics = await prisma.fileMetrics.findFirst({
        where: {
          repositoryId,
          filePath,
        },
      });

      if (!fileMetrics) {
        return NextResponse.json(
          {
            success: false,
            error: "File not found in repository analysis",
          },
          { status: 404 }
        );
      }

      // Get file history
      let fileHistory = null;
      if (includeHistory) {
        fileHistory = await prisma.commit.findMany({
          where: {
            repositoryId,
            fileChanges: {
              some: {
                filePath,
              },
            },
          },
          orderBy: { timestamp: "desc" },
          take: maxHistoryItems,
          select: {
            sha: true,
            authorName: true,
            authorEmail: true,
            message: true,
            timestamp: true,
            fileChanges: {
              where: {
                filePath,
              },
              select: {
                changeType: true,
                insertions: true,
                deletions: true,
              },
            },
          },
        });
      }

      // Generate custom story
      const storyGenerator = new StoryGenerator();
      const story = await storyGenerator.generateCustomDetailedFileStory({
        repositoryId,
        filePath,
        fileMetrics,
        fileHistory: fileHistory || [],
        customPrompt,
        focusAreas,
        includeMetrics,
      });

      // Don't cache custom stories as they are personalized
      return NextResponse.json({
        success: true,
        data: {
          repositoryId,
          filePath,
          story,
          custom: true,
          generatedAt: new Date().toISOString(),
          options: {
            customPrompt,
            focusAreas,
            includeMetrics,
            includeHistory,
          },
        },
      });
    } catch (storyError) {
      // Handle story generation errors
      const errorHandler = new StoryErrorHandler();
      const classifiedError = errorHandler.classifyError(storyError as Error);
      const userMessage = errorHandler.getUserFriendlyMessage(classifiedError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate custom file story",
          details: userMessage,
          errorType: classifiedError.type,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to generate custom file story:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate custom file story",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; path: string[] }> }
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

    const { id, path } = await params;
    const repositoryId = parseInt(id);
    const filePath = path.join("/");

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

    // Clear cached story for this file
    const storyCache = new StoryCacheService();
    await storyCache.deleteCachedStory(repositoryId, filePath);

    return NextResponse.json({
      success: true,
      message: "File story cache cleared successfully",
      data: {
        repositoryId,
        filePath,
        clearedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to clear file story cache:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear file story cache",
      },
      { status: 500 }
    );
  }
}
