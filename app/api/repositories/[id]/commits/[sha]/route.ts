import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sha: string }> }
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

    const { id, sha } = await params;
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

    // Get the specific commit
    const commit = await prisma.commit.findFirst({
      where: {
        repositoryId,
        sha,
      },
      select: {
        sha: true,
        authorName: true,
        authorEmail: true,
        message: true,
        timestamp: true,
        insertions: true,
        deletions: true,
        fileChanges: {
          select: {
            filePath: true,
            changeType: true,
            insertions: true,
            deletions: true,
          },
        },
      },
    });

    if (!commit) {
      return NextResponse.json(
        {
          success: false,
          error: "Commit not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: commit,
    });
  } catch (error) {
    console.error("Failed to get commit:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get commit",
      },
      { status: 500 }
    );
  }
}