import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { SemanticSearchService } from '@/lib/services/semantic-search';

// Mock the SemanticSearchService
vi.mock('@/lib/services/semantic-search');

describe('/api/repositories/[id]/search/semantic', () => {
  let mockSearchService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSearchService = {
      search: vi.fn(),
      initializeRepositoryEmbeddings: vi.fn(),
      getSearchSuggestions: vi.fn(),
      embeddingGenerator: {
        hasEmbeddings: vi.fn(),
      },
    };
    
    vi.mocked(SemanticSearchService).mockImplementation(() => mockSearchService);
  });

  describe('POST', () => {
    it('should perform semantic search successfully', async () => {
      const mockResults = {
        results: [
          {
            id: 'abc123',
            type: 'commit',
            title: 'Fix bug',
            content: 'Fix authentication bug',
            snippet: 'Fix authentication bug',
            similarity: 0.9,
            timestamp: '2024-01-01T00:00:00.000Z',
            author: 'John Doe',
          },
        ],
        total: 1,
        hasMore: false,
      };

      mockSearchService.initializeRepositoryEmbeddings.mockResolvedValue(undefined);
      mockSearchService.search.mockResolvedValue(mockResults);

      const request = new NextRequest('http://localhost/api/repositories/1/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'authentication bug',
          limit: 20,
          offset: 0,
        }),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResults);
      expect(mockSearchService.initializeRepositoryEmbeddings).toHaveBeenCalledWith(1);
      expect(mockSearchService.search).toHaveBeenCalledWith(
        'authentication bug',
        1,
        {
          limit: 20,
          offset: 0,
          filters: undefined,
        }
      );
    });

    it('should handle search with filters', async () => {
      const mockResults = {
        results: [],
        total: 0,
        hasMore: false,
      };

      mockSearchService.initializeRepositoryEmbeddings.mockResolvedValue(undefined);
      mockSearchService.search.mockResolvedValue(mockResults);

      const request = new NextRequest('http://localhost/api/repositories/1/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query',
          filters: {
            contentTypes: ['commit'],
            dateRange: {
              from: '2024-01-01T00:00:00.000Z',
              to: '2024-01-31T23:59:59.999Z',
            },
            authors: ['John Doe'],
            minSimilarity: 0.8,
          },
        }),
      });

      const response = await POST(request, { params: { id: '1' } });

      expect(response.status).toBe(200);
      expect(mockSearchService.search).toHaveBeenCalledWith(
        'test query',
        1,
        {
          limit: 20,
          offset: 0,
          filters: {
            contentTypes: ['commit'],
            dateRange: {
              from: new Date('2024-01-01T00:00:00.000Z'),
              to: new Date('2024-01-31T23:59:59.999Z'),
            },
            authors: ['John Doe'],
            minSimilarity: 0.8,
          },
        }
      );
    });

    it('should return 400 for invalid repository ID', async () => {
      const request = new NextRequest('http://localhost/api/repositories/invalid/search/semantic', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await POST(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid repository ID');
    });

    it('should return 400 for missing query', async () => {
      const request = new NextRequest('http://localhost/api/repositories/1/search/semantic', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 400 for invalid request data', async () => {
      const request = new NextRequest('http://localhost/api/repositories/1/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          limit: -1, // Invalid limit
        }),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 503 for missing OpenAI API key', async () => {
      mockSearchService.initializeRepositoryEmbeddings.mockRejectedValue(
        new Error('OPENAI_API_KEY environment variable is required')
      );

      const request = new NextRequest('http://localhost/api/repositories/1/search/semantic', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('AI service not configured');
    });

    it('should return 500 for other errors', async () => {
      mockSearchService.initializeRepositoryEmbeddings.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/repositories/1/search/semantic', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET', () => {
    it('should return search suggestions', async () => {
      const mockSuggestions = ['fix authentication bug', 'authentication middleware'];
      mockSearchService.getSearchSuggestions.mockResolvedValue(mockSuggestions);

      const request = new NextRequest(
        'http://localhost/api/repositories/1/search/semantic?action=suggestions&query=auth&limit=5'
      );

      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual(mockSuggestions);
      expect(mockSearchService.getSearchSuggestions).toHaveBeenCalledWith(1, 'auth', 5);
    });

    it('should return search status', async () => {
      mockSearchService.embeddingGenerator.hasEmbeddings.mockResolvedValue(true);

      const request = new NextRequest(
        'http://localhost/api/repositories/1/search/semantic?action=status'
      );

      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        hasEmbeddings: true,
        ready: true,
      });
    });

    it('should return 400 for missing query in suggestions', async () => {
      const request = new NextRequest(
        'http://localhost/api/repositories/1/search/semantic?action=suggestions'
      );

      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Query parameter is required for suggestions');
    });

    it('should return 400 for invalid action', async () => {
      const request = new NextRequest(
        'http://localhost/api/repositories/1/search/semantic?action=invalid'
      );

      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action parameter');
    });

    it('should return 400 for invalid repository ID', async () => {
      const request = new NextRequest(
        'http://localhost/api/repositories/invalid/search/semantic?action=status'
      );

      const response = await GET(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid repository ID');
    });

    it('should handle suggestions with default limit', async () => {
      const mockSuggestions = ['suggestion 1', 'suggestion 2'];
      mockSearchService.getSearchSuggestions.mockResolvedValue(mockSuggestions);

      const request = new NextRequest(
        'http://localhost/api/repositories/1/search/semantic?action=suggestions&query=test'
      );

      const response = await GET(request, { params: { id: '1' } });

      expect(response.status).toBe(200);
      expect(mockSearchService.getSearchSuggestions).toHaveBeenCalledWith(1, 'test', 5);
    });
  });
});