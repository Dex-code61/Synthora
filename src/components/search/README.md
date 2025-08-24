# Semantic Search Components

This directory contains the React components for the semantic search functionality in Synthora.

## Components

### SemanticSearch
The main search interface component that provides:
- Natural language query input with suggestions
- Real-time search results with similarity scores
- Advanced filtering options (content types, date ranges, authors, file paths)
- Loading states and error handling
- Pagination support

### SearchFilters
A comprehensive filtering component that allows users to:
- Filter by content types (commits, comments, PRs)
- Set date ranges for search results
- Filter by specific authors
- Filter by file paths or patterns
- Adjust similarity threshold for more precise results

### SearchResults
Displays search results with:
- Rich result cards showing content type, similarity score, and metadata
- Context snippets with highlighted relevant content
- Author information and timestamps
- File path information for commits
- Direct links to detailed views

## Usage

```tsx
import { SemanticSearch } from '@/components/search/semantic-search';

function SearchPage() {
  return (
    <SemanticSearch 
      repositoryId={1}
      className="max-w-4xl mx-auto"
    />
  );
}
```

## Features

- **AI-Powered Search**: Uses OpenAI embeddings to understand query intent beyond keyword matching
- **Real-time Suggestions**: Provides search suggestions as users type
- **Advanced Filtering**: Multiple filter options to refine search results
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance**: Optimized with pagination and caching

## API Integration

The components integrate with the semantic search API at `/api/repositories/[id]/search/semantic` which provides:
- POST endpoint for performing searches
- GET endpoint for search suggestions and status checks
- Automatic embedding generation for new repositories
- Vector similarity matching with configurable thresholds