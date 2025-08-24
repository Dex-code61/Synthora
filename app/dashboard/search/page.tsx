'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SemanticSearch } from '@/components/search/semantic-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles } from 'lucide-react';

// Mock repositories for now - in a real app, this would come from an API
const mockRepositories = [
  { id: 1, name: 'synthora', path: '/path/to/synthora' },
  { id: 2, name: 'example-repo', path: '/path/to/example' },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialRepoId = searchParams.get('repository');
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<number>(
    initialRepoId ? parseInt(initialRepoId) : mockRepositories[0]?.id || 1
  );

  const selectedRepository = mockRepositories.find(repo => repo.id === selectedRepositoryId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Semantic Search</h1>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Search through your repository using natural language to find commits, discussions, and code changes.
          </p>
        </div>
      </div>

      {/* Repository Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Repository</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedRepositoryId.toString()}
              onValueChange={(value) => setSelectedRepositoryId(parseInt(value))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {mockRepositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.id.toString()}>
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRepository && (
              <div className="text-sm text-muted-foreground">
                {selectedRepository.path}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Interface */}
      <SemanticSearch 
        repositoryId={selectedRepositoryId}
        className="max-w-4xl mx-auto"
      />

      {/* Help Section */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Search Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Natural Language Queries</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• "bug fixes in authentication"</li>
                <li>• "performance improvements"</li>
                <li>• "database migration changes"</li>
                <li>• "security vulnerabilities"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Search Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Filter by content type (commits, comments, PRs)</li>
                <li>• Filter by date range and authors</li>
                <li>• Adjust similarity threshold</li>
                <li>• Get search suggestions as you type</li>
              </ul>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Semantic search uses AI embeddings to understand the meaning behind your queries, 
              not just keyword matching. This allows you to find relevant content even when 
              the exact words don't match.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}