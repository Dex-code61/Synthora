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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000);
    const author = searchParams.get("author");
    const since = searchParams.get("since");
    const until = searchParams.get("until");
    const filePath = searchParams.get("filePath");

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
    
    if (filePath) {
      where.fileChanges = {
        some: {
          filePath: filePath,
        },
      };
    }

    // Get total count
    const total = await prisma.commit.count({ where });

    // Get commits with pagination
    const commits = await prisma.commit.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        commits,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Failed to get commits:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get commits",
      },
      { status: 500 }
    );
  }
}