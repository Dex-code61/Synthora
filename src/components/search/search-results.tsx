'use client';

import { SearchResult } from '@/hooks/use-semantic-search';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitCommit, 
  MessageSquare, 
  GitPullRequest, 
  User, 
  Clock, 
  FileText,
  ExternalLink,
  Loader2,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  canLoadMore: boolean;
  onClear: () => void;
}

const typeIcons = {
  commit: GitCommit,
  comment: MessageSquare,
  pr: GitPullRequest,
};

const typeLabels = {
  commit: 'Commit',
  comment: 'Comment',
  pr: 'Pull Request',
};

const typeColors = {
  commit: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  comment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pr: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

function SearchResultItem({ result }: { result: SearchResult }) {
  const Icon = typeIcons[result.type];
  const typeColor = typeColors[result.type];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`text-xs ${typeColor}`}>
                  {typeLabels[result.type]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {Math.round(result.similarity * 100)}% match
                </Badge>
              </div>
              <h3 className="font-medium text-sm leading-tight mb-1 truncate">
                {result.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {result.snippet}
              </p>
            </div>
          </div>
          {result.url && (
            <Link href={result.url} className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {result.author && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{result.author}</span>
            </div>
          )}
          {result.timestamp && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span title={format(result.timestamp, 'PPpp')}>
                {formatDistanceToNow(result.timestamp, { addSuffix: true })}
              </span>
            </div>
          )}
          {result.filePaths && result.filePaths.length > 0 && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>
                {result.filePaths.length === 1 
                  ? result.filePaths[0]
                  : `${result.filePaths.length} files`
                }
              </span>
            </div>
          )}
        </div>
        {result.filePaths && result.filePaths.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {result.filePaths.slice(0, 3).map((filePath, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {filePath.split('/').pop()}
              </Badge>
            ))}
            {result.filePaths.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{result.filePaths.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SearchResults({
  query,
  results,
  total,
  hasMore,
  isLoading,
  onLoadMore,
  canLoadMore,
  onClear,
}: SearchResultsProps) {
  if (results.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No results found</h3>
              <p className="text-sm max-w-md mx-auto">
                No matches found for "{query}". Try adjusting your search terms or filters.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={onClear}>
                Clear search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-medium">
                Search Results for "{query}"
              </h3>
              <Badge variant="secondary">
                {total} result{total !== 1 ? 's' : ''}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((result) => (
          <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={!canLoadMore}
            variant="outline"
            className="min-w-32"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && results.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Searching...</p>
                <p className="text-xs text-muted-foreground">
                  Finding relevant matches for "{query}"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}