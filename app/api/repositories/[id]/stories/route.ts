import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storyCacheService } from '@/lib/services/story-cache';
import { ApiResponse } from '@/types/api';
import { FileStory } from '@/lib/services/story-generator';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<FileStory[]>>> {
  try {
    const repositoryId = parseInt(params.id);
    
    if (isNaN(repositoryId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid repository ID'
      }, { status: 400 });
    }

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId }
    });

    if (!repository) {
      return NextResponse.json({
        success: false,
        error: 'Repository not found'
      }, { status: 404 });
    }

    // Get all cached stories for the repository
    const stories = await storyCacheService.getCachedStoriesForRepository(repositoryId);

    return NextResponse.json({
      success: true,
      data: stories,
      message: `Retrieved ${stories.length} cached stories`
    });

  } catch (error) {
    console.error('Error retrieving repository stories:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve stories'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const repositoryId = parseInt(params.id);
    
    if (isNaN(repositoryId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid repository ID'
      }, { status: 400 });
    }

    // Clear all cached stories for the repository
    await storyCacheService.clearRepositoryCache(repositoryId);

    return NextResponse.json({
      success: true,
      message: 'All cached stories cleared for repository'
    });

  } catch (error) {
    console.error('Error clearing repository stories:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear stories'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ stats: any }>>> {
  try {
    const repositoryId = parseInt(params.id);
    
    if (isNaN(repositoryId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid repository ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'stats':
        const stats = await storyCacheService.getCacheStats(repositoryId);
        return NextResponse.json({
          success: true,
          data: { stats },
          message: 'Cache statistics retrieved'
        });

      case 'cleanup':
        const maxAge = body.maxAge || 7 * 24 * 60 * 60 * 1000; // 7 days default
        const deletedCount = await storyCacheService.clearExpiredCache(maxAge);
        return NextResponse.json({
          success: true,
          data: { stats: { deletedCount } },
          message: `Cleaned up ${deletedCount} expired stories`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: stats, cleanup'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in repository stories POST:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request'
    }, { status: 500 });
  }
}