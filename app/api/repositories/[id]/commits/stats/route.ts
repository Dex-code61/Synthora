import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const author = searchParams.get("author");
    const since = searchParams.get("since");
    const until = searchParams.get("until");

    // Build where clause
    const where: any = { repositoryId };
    
    if (author) {
      where.authorName = author;
    }
    
    if (since) {
      where.timestamp = { ...where.timestamp, gte: new Date(since) };
    }
    
    if (until) {
      where.timestamp = { ...where.timestamp, lte: new Date(until) };
    }

    // Get commit statistics
    const stats = await prisma.commit.aggregate({
      where,
      _count: {
        sha: true,
      },
      _sum: {
        insertions: true,
        deletions: true,
      },
    });

    // Get unique authors count
    const uniqueAuthors = await prisma.commit.groupBy({
      by: ["authorName"],
      where,
    });

    // Get unique files count
    const uniqueFiles = await prisma.fileChange.groupBy({
      by: ["filePath"],
      where: {
        commit: where,
      },
    });

    // Get date range
    const dateRange = await prisma.commit.aggregate({
      where,
      _min: {
        timestamp: true,
      },
      _max: {
        timestamp: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCommits: stats._count.sha || 0,
        totalInsertions: stats._sum.insertions || 0,
        totalDeletions: stats._sum.deletions || 0,
        uniqueAuthors: uniqueAuthors.length,
        totalFiles: uniqueFiles.length,
        dateRange: {
          earliest: dateRange._min.timestamp?.toISOString() || null,
          latest: dateRange._max.timestamp?.toISOString() || null,
        },
      },
    });
  } catch (error) {
    console.error("Failed to get commit stats:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get commit stats",
      },
      { status: 500 }
    );
  }
}