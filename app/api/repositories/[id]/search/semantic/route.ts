import { NextRequest, NextResponse } from 'next/server';
import { SemanticSearchService } from '@/lib/services/semantic-search';
import { z } from 'zod';

const searchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  filters: z.object({
    contentTypes: z.array(z.enum(['commit', 'comment', 'pr'])).optional(),
    dateRange: z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).optional(),
    authors: z.array(z.string()).optional(),
    filePaths: z.array(z.string()).optional(),
    minSimilarity: z.number().min(0).max(1).optional().default(0.7),
  }).optional(),
});

const suggestionsRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(10).optional().default(5),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repositoryId = parseInt(params.id);
    if (isNaN(repositoryId)) {
      return NextResponse.json(
        { error: 'Invalid repository ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = searchRequestSchema.parse(body);

    const searchService = new SemanticSearchService();

    // Initialize embeddings if they don't exist
    await searchService.initializeRepositoryEmbeddings(repositoryId);

    // Perform search
    const results = await searchService.search(
      validatedData.query,
      repositoryId,
      {
        limit: validatedData.limit,
        offset: validatedData.offset,
        filters: validatedData.filters ? {
          ...validatedData.filters,
          dateRange: validatedData.filters.dateRange ? {
            from: new Date(validatedData.filters.dateRange.from),
            to: new Date(validatedData.filters.dateRange.to),
          } : undefined,
        } : undefined,
      }
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Semantic search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repositoryId = parseInt(params.id);
    if (isNaN(repositoryId)) {
      return NextResponse.json(
        { error: 'Invalid repository ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'suggestions') {
      const query = searchParams.get('query');
      const limit = parseInt(searchParams.get('limit') || '5');

      if (!query) {
        return NextResponse.json(
          { error: 'Query parameter is required for suggestions' },
          { status: 400 }
        );
      }

      const validatedData = suggestionsRequestSchema.parse({ query, limit });
      const searchService = new SemanticSearchService();

      const suggestions = await searchService.getSearchSuggestions(
        repositoryId,
        validatedData.query,
        validatedData.limit
      );

      return NextResponse.json({ suggestions });
    }

    if (action === 'status') {
      const searchService = new SemanticSearchService();
      const hasEmbeddings = await searchService['embeddingGenerator'].hasEmbeddings(repositoryId);

      return NextResponse.json({
        hasEmbeddings,
        ready: hasEmbeddings,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Semantic search GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}