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

    // Get all unique file paths and extract extensions
    const files = await prisma.fileChange.groupBy({
      by: ["filePath"],
      where: {
        commit: {
          repositoryId,
        },
      },
    });

    // Extract file extensions
    const extensions = new Set<string>();
    
    files.forEach(file => {
      const filePath = file.filePath;
      const lastDotIndex = filePath.lastIndexOf('.');
      
      if (lastDotIndex > 0 && lastDotIndex < filePath.length - 1) {
        const extension = filePath.substring(lastDotIndex + 1).toLowerCase();
        // Filter out common non-code extensions
        if (extension && !['md', 'txt', 'log', 'tmp'].includes(extension)) {
          extensions.add(extension);
        }
      }
    });

    const fileTypes = Array.from(extensions).sort();

    return NextResponse.json({
      success: true,
      data: fileTypes,
    });
  } catch (error) {
    console.error("Failed to get file types:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get file types",
      },
      { status: 500 }
    );
  }
}