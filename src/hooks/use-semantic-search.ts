import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface SearchResult {
  id: string;
  type: 'commit' | 'comment' | 'pr';
  title: string;
  content: string;
  snippet: string;
  similarity: number;
  timestamp?: Date;
  author?: string;
  filePaths?: string[];
  url?: string;
}

export interface SearchFilters {
  contentTypes?: ('commit' | 'comment' | 'pr')[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  authors?: string[];
  filePaths?: string[];
  minSimilarity?: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
}

export function useSemanticSearch(repositoryId: number) {
  const queryClient = useQueryClient();
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    total: 0,
    hasMore: false,
    isLoading: false,
    error: null,
    filters: {},
  });

  // Check if embeddings are ready
  const { data: searchStatus } = useQuery({
    queryKey: ['semantic-search-status', repositoryId],
    queryFn: async () => {
      const response = await fetch(
        `/api/repositories/${repositoryId}/search/semantic?action=status`
      );
      if (!response.ok) {
        throw new Error('Failed to check search status');
      }
      return response.json();
    },
    refetchInterval: (data) => {
      // Refetch every 5 seconds if embeddings are not ready
      return data?.ready ? false : 5000;
    },
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async ({
      query,
      options = {},
    }: {
      query: string;
      options?: SearchOptions;
    }) => {
      const response = await fetch(
        `/api/repositories/${repositoryId}/search/semantic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            ...options,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      return response.json() as Promise<SearchResponse>;
    },
    onMutate: ({ query }) => {
      setSearchState(prev => ({
        ...prev,
        query,
        isLoading: true,
        error: null,
      }));
    },
    onSuccess: (data, { options }) => {
      setSearchState(prev => ({
        ...prev,
        results: options?.offset ? [...prev.results, ...data.results] : data.results,
        total: data.total,
        hasMore: data.hasMore,
        isLoading: false,
      }));
    },
    onError: (error: Error) => {
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    },
  });

  // Get search suggestions
  const { data: suggestions, refetch: refetchSuggestions } = useQuery({
    queryKey: ['search-suggestions', repositoryId, searchState.query],
    queryFn: async () => {
      if (!searchState.query || searchState.query.length < 2) {
        return [];
      }

      const response = await fetch(
        `/api/repositories/${repositoryId}/search/semantic?action=suggestions&query=${encodeURIComponent(searchState.query)}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }
      
      const data = await response.json();
      return data.suggestions || [];
    },
    enabled: searchState.query.length >= 2,
    staleTime: 30000, // Cache suggestions for 30 seconds
  });

  // Search function
  const search = useCallback(
    (query: string, options?: SearchOptions) => {
      if (!query.trim()) {
        setSearchState(prev => ({
          ...prev,
          query: '',
          results: [],
          total: 0,
          hasMore: false,
          error: null,
        }));
        return;
      }

      searchMutation.mutate({
        query: query.trim(),
        options: {
          ...options,
          filters: { ...searchState.filters, ...options?.filters },
        },
      });
    },
    [searchMutation, searchState.filters]
  );

  // Load more results
  const loadMore = useCallback(() => {
    if (!searchState.hasMore || searchState.isLoading || !searchState.query) {
      return;
    }

    searchMutation.mutate({
      query: searchState.query,
      options: {
        offset: searchState.results.length,
        filters: searchState.filters,
      },
    });
  }, [
    searchState.hasMore,
    searchState.isLoading,
    searchState.query,
    searchState.results.length,
    searchState.filters,
    searchMutation,
  ]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setSearchState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));

    // Re-search with new filters if there's an active query
    if (searchState.query) {
      searchMutation.mutate({
        query: searchState.query,
        options: {
          filters: { ...searchState.filters, ...newFilters },
        },
      });
    }
  }, [searchState.query, searchState.filters, searchMutation]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      results: [],
      total: 0,
      hasMore: false,
      isLoading: false,
      error: null,
      filters: {},
    });
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    updateFilters({
      contentTypes: undefined,
      dateRange: undefined,
      authors: undefined,
      filePaths: undefined,
      minSimilarity: 0.7,
    });
  }, [updateFilters]);

  return {
    // State
    ...searchState,
    isReady: searchStatus?.ready || false,
    suggestions: suggestions || [],

    // Actions
    search,
    loadMore,
    updateFilters,
    clearSearch,
    resetFilters,
    refetchSuggestions,

    // Status
    isSearching: searchMutation.isPending,
    canLoadMore: searchState.hasMore && !searchState.isLoading,
  };
}