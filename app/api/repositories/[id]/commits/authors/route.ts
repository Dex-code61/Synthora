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

    // Get all unique authors
    const authors = await prisma.commit.groupBy({
      by: ["authorName"],
      where: { repositoryId },
      _count: {
        sha: true,
      },
      orderBy: {
        _count: {
          sha: "desc",
        },
      },
    });

    const authorNames = authors.map(author => author.authorName);

    return NextResponse.json({
      success: true,
      data: authorNames,
    });
  } catch (error) {
    console.error("Failed to get authors:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get authors",
      },
      { status: 500 }
    );
  }
}