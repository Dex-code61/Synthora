'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Clock, User, FileText, GitCommit, Loader2 } from 'lucide-react';
import { useSemanticSearch, SearchFilters } from '@/hooks/use-semantic-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchFilters as SearchFiltersComponent } from './search-filters';
import { SearchResults } from './search-results';
import { format } from 'date-fns';

interface SemanticSearchProps {
  repositoryId: number;
  className?: string;
}

export function SemanticSearch({ repositoryId, className }: SemanticSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    query,
    results,
    total,
    hasMore,
    isLoading,
    error,
    filters,
    isReady,
    suggestions,
    search,
    loadMore,
    updateFilters,
    clearSearch,
    resetFilters,
    canLoadMore,
  } = useSemanticSearch(repositoryId);

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const queryToSearch = searchQuery || inputValue;
    if (queryToSearch.trim()) {
      search(queryToSearch.trim());
      setShowSuggestions(false);
    }
  };

  // Handle input changes
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSuggestions(value.length >= 2);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
    setShowSuggestions(false);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return true;
    return value !== undefined && value !== null;
  }).length;

  if (!isReady) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Preparing semantic search...</p>
              <p className="text-xs text-muted-foreground">
                Generating embeddings for repository content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search commits, comments, and discussions..."
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-10 pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                    >
                      <Filter className="h-4 w-4" />
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <SearchFiltersComponent
                      filters={filters}
                      onFiltersChange={updateFilters}
                      onReset={resetFilters}
                      repositoryId={repositoryId}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  onClick={() => handleSearch()}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="h-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg"
              >
                <ScrollArea className="max-h-48">
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground mb-2 px-2">
                      Suggestions
                    </p>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.contentTypes && filters.contentTypes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Types: {filters.contentTypes.join(', ')}
                  <button
                    onClick={() => updateFilters({ contentTypes: undefined })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.dateRange && (
                <Badge variant="secondary" className="text-xs">
                  {format(filters.dateRange.from, 'MMM d')} - {format(filters.dateRange.to, 'MMM d')}
                  <button
                    onClick={() => updateFilters({ dateRange: undefined })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.authors && filters.authors.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Authors: {filters.authors.slice(0, 2).join(', ')}
                  {filters.authors.length > 2 && ` +${filters.authors.length - 2}`}
                  <button
                    onClick={() => updateFilters({ authors: undefined })}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {query && (
        <SearchResults
          query={query}
          results={results}
          total={total}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          canLoadMore={canLoadMore}
          onClear={clearSearch}
        />
      )}

      {/* Empty State */}
      {!query && !error && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Search className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Semantic Search</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Search through your repository using natural language. Find commits, 
                  discussions, and code changes by describing what you're looking for.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span>Try searching for:</span>
                <button
                  onClick={() => handleSuggestionSelect('bug fixes')}
                  className="text-primary hover:underline"
                >
                  "bug fixes"
                </button>
                <span>•</span>
                <button
                  onClick={() => handleSuggestionSelect('authentication changes')}
                  className="text-primary hover:underline"
                >
                  "authentication changes"
                </button>
                <span>•</span>
                <button
                  onClick={() => handleSuggestionSelect('performance improvements')}
                  className="text-primary hover:underline"
                >
                  "performance improvements"
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}