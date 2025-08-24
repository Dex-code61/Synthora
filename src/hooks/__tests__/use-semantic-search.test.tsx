import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSemanticSearch } from '../use-semantic-search';
import React, { ReactNode } from 'react';

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useSemanticSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.filters).toEqual({});
  });

  it('should check search status on mount', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ready: true, hasEmbeddings: true }),
    } as Response);

    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/repositories/1/search/semantic?action=status'
    );
  });

  it('should perform search successfully', async () => {
    const mockSearchResponse = {
      results: [
        {
          id: 'abc123',
          type: 'commit',
          title: 'Fix bug',
          content: 'Fix authentication bug',
          snippet: 'Fix authentication bug',
          similarity: 0.9,
          timestamp: new Date('2024-01-01'),
          author: 'John Doe',
        },
      ],
      total: 1,
      hasMore: false,
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ready: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      } as Response);

    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.search('authentication bug');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    expect(result.current.query).toBe('authentication bug');
    expect(result.current.results[0].title).toBe('Fix bug');
    expect(result.current.total).toBe(1);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle search errors', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ready: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Search failed' }),
      } as Response);

    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.search('test query');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Search failed');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('should load more results', async () => {
    const initialResponse = {
      results: [
        {
          id: '1',
          type: 'commit',
          title: 'Result 1',
          content: 'Content 1',
          snippet: 'Snippet 1',
          similarity: 0.9,
        },
      ],
      total: 2,
      hasMore: true,
    };

    const moreResponse = {
      results: [
        {
          id: '2',
          type: 'commit',
          title: 'Result 2',
          content: 'Content 2',
          snippet: 'Snippet 2',
          similarity: 0.8,
        },
      ],
      total: 2,
      hasMore: false,
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ready: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialResponse),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(moreResponse),
      } as Response);

    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    // Initial search
    await act(async () => {
      result.current.search('test');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    // Load more
    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(2);
    });

    expect(result.current.hasMore).toBe(false);
    expect(result.current.results[0].title).toBe('Result 1');
    expect(result.current.results[1].title).toBe('Result 2');
  });

  it('should get search suggestions', async () => {
    const mockSuggestions = {
      suggestions: ['fix authentication bug', 'authentication middleware'],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ready: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuggestions),
      } as Response);

    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    // Trigger suggestions by setting a query
    await act(async () => {
      result.current.search('auth');
    });

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(mockSuggestions.suggestions);
    });
  });

  it('should update filters and re-search', async () => {
    const mockResponse = {
      results: [],
      total: 0,
      hasMore: false,
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ready: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    // Initial search
    await act(async () => {
      result.current.search('test');
    });

    // Update filters
    await act(async () => {
      result.current.updateFilters({
        contentTypes: ['commit'],
        authors: ['John Doe'],
      });
    });

    await waitFor(() => {
      expect(result.current.filters.contentTypes).toEqual(['commit']);
      expect(result.current.filters.authors).toEqual(['John Doe']);
    });

    // Should have made two search requests
    expect(fetch).toHaveBeenCalledTimes(3); // status + 2 searches
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    // Set some state first
    act(() => {
      result.current.search('test');
    });

    // Clear search
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.filters).toEqual({});
  });

  it('should reset filters', async () => {
    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    // Set filters first
    act(() => {
      result.current.updateFilters({
        contentTypes: ['commit'],
        authors: ['John Doe'],
        minSimilarity: 0.9,
      });
    });

    // Reset filters
    act(() => {
      result.current.resetFilters();
    });

    await waitFor(() => {
      expect(result.current.filters.contentTypes).toBeUndefined();
      expect(result.current.filters.authors).toBeUndefined();
      expect(result.current.filters.minSimilarity).toBe(0.7);
    });
  });

  it('should not search with empty query', () => {
    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.search('   ');
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('should not load more if no more results', () => {
    const { result } = renderHook(() => useSemanticSearch(1), {
      wrapper: createWrapper(),
    });

    // Set state with no more results
    act(() => {
      result.current.search('test');
    });

    const initialFetchCount = vi.mocked(fetch).mock.calls.length;

    act(() => {
      result.current.loadMore();
    });

    // Should not make additional fetch calls
    expect(vi.mocked(fetch).mock.calls.length).toBe(initialFetchCount);
  });
});