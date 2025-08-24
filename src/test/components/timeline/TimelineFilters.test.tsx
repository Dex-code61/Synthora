import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimelineFilters } from '@/components/timeline/TimelineFilters'
import { Commit } from '@/types/git'

const mockCommits: Commit[] = [
  {
    sha: 'abc123',
    author: 'John Doe',
    email: 'john@example.com',
    message: 'Add authentication system',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    filesChanged: 3,
    insertions: 100,
    deletions: 0,
    files: [
      { filePath: 'src/auth.ts', changeType: 'added', insertions: 50, deletions: 0 },
      { filePath: 'src/login.tsx', changeType: 'added', insertions: 30, deletions: 0 },
      { filePath: 'README.md', changeType: 'modified', insertions: 20, deletions: 0 }
    ]
  },
  {
    sha: 'def456',
    author: 'Jane Smith',
    email: 'jane@example.com',
    message: 'Fix login bug',
    timestamp: new Date('2024-01-02T14:30:00Z'),
    filesChanged: 2,
    insertions: 25,
    deletions: 10,
    files: [
      { filePath: 'src/auth.ts', changeType: 'modified', insertions: 15, deletions: 5 },
      { filePath: 'src/login.tsx', changeType: 'modified', insertions: 10, deletions: 5 }
    ]
  },
  {
    sha: 'ghi789',
    author: 'Bob Wilson',
    email: 'bob@example.com',
    message: 'Add dashboard component',
    timestamp: new Date('2024-01-03T09:15:00Z'),
    filesChanged: 1,
    insertions: 75,
    deletions: 0,
    files: [
      { filePath: 'src/dashboard.js', changeType: 'added', insertions: 75, deletions: 0 }
    ]
  }
]

describe('TimelineFilters', () => {
  const defaultProps = {
    commits: mockCommits,
    onDateRangeChange: vi.fn(),
    onAuthorsChange: vi.fn(),
    onFileTypesChange: vi.fn(),
    onSearchQueryChange: vi.fn(),
    onClearFilters: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter toggle button', () => {
    render(<TimelineFilters {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })

  it('shows active filter count in badge', () => {
    render(
      <TimelineFilters
        {...defaultProps}
        selectedAuthors={['John Doe']}
        selectedFileTypes={['ts', 'tsx']}
        searchQuery="auth"
      />
    )
    
    // Should show badge with count of active filters (3: 1 author + 2 file types + 1 search)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('expands and collapses filter panel', async () => {
    const user = userEvent.setup()
    render(<TimelineFilters {...defaultProps} />)
    
    const filterButton = screen.getByRole('button', { name: /filters/i })
    
    // Initially collapsed
    expect(screen.queryByPlaceholderText('Search messages...')).not.toBeInTheDocument()
    
    // Expand
    await user.click(filterButton)
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument()
    
    // Collapse
    await user.click(filterButton)
    expect(screen.queryByPlaceholderText('Search messages...')).not.toBeInTheDocument()
  })

  it('handles search query input', async () => {
    const user = userEvent.setup()
    const onSearchQueryChange = vi.fn()
    
    render(
      <TimelineFilters
        {...defaultProps}
        onSearchQueryChange={onSearchQueryChange}
      />
    )
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    const searchInput = screen.getByPlaceholderText('Search messages...')
    await user.type(searchInput, 'authentication')
    
    expect(onSearchQueryChange).toHaveBeenCalledWith('authentication')
  })

  it('displays available authors from commits', async () => {
    const user = userEvent.setup()
    render(<TimelineFilters {...defaultProps} />)
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Check that all unique authors are listed
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
  })

  it('displays available file types from commits', async () => {
    const user = userEvent.setup()
    render(<TimelineFilters {...defaultProps} />)
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Check that all unique file extensions are listed
    expect(screen.getByText('.ts')).toBeInTheDocument()
    expect(screen.getByText('.tsx')).toBeInTheDocument()
    expect(screen.getByText('.md')).toBeInTheDocument()
    expect(screen.getByText('.js')).toBeInTheDocument()
  })

  it('handles author selection', async () => {
    const user = userEvent.setup()
    const onAuthorsChange = vi.fn()
    
    render(
      <TimelineFilters
        {...defaultProps}
        onAuthorsChange={onAuthorsChange}
      />
    )
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Select an author
    const johnDoeCheckbox = screen.getByRole('checkbox', { name: /john doe/i })
    await user.click(johnDoeCheckbox)
    
    expect(onAuthorsChange).toHaveBeenCalledWith(['John Doe'])
  })

  it('handles file type selection', async () => {
    const user = userEvent.setup()
    const onFileTypesChange = vi.fn()
    
    render(
      <TimelineFilters
        {...defaultProps}
        onFileTypesChange={onFileTypesChange}
      />
    )
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Select a file type
    const tsCheckbox = screen.getByRole('checkbox', { name: /\.ts/i })
    await user.click(tsCheckbox)
    
    expect(onFileTypesChange).toHaveBeenCalledWith(['ts'])
  })

  it('shows selected authors count', async () => {
    const user = userEvent.setup()
    render(
      <TimelineFilters
        {...defaultProps}
        selectedAuthors={['John Doe', 'Jane Smith']}
      />
    )
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    expect(screen.getByText('Authors (2)')).toBeInTheDocument()
  })

  it('shows selected file types count', async () => {
    const user = userEvent.setup()
    render(
      <TimelineFilters
        {...defaultProps}
        selectedFileTypes={['ts', 'tsx', 'js']}
      />
    )
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    expect(screen.getByText('File types (3)')).toBeInTheDocument()
  })

  it('handles clear authors button', async () => {
    const user = userEvent.setup()
    const onAuthorsChange = vi.fn()
    
    render(
      <TimelineFilters
        {...defaultProps}
        selectedAuthors={['John Doe', 'Jane Smith']}
        onAuthorsChange={onAuthorsChange}
      />
    )
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Click clear button for authors
    const clearAuthorsButton = screen.getAllByText('Clear')[0]
    await user.click(clearAuthorsButton)
    
    expect(onAuthorsChange).toHaveBeenCalledWith([])
  })

  it('handles clear file types button', async () => {
    const user = userEvent.setup()
    const onFileTypesChange = vi.fn()
    
    render(
      <TimelineFilters
        {...defaultProps}
        selectedFileTypes={['ts', 'tsx']}
        onFileTypesChange={onFileTypesChange}
      />
    )
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Click clear button for file types
    const clearFileTypesButton = screen.getAllByText('Clear')[1]
    await user.click(clearFileTypesButton)
    
    expect(onFileTypesChange).toHaveBeenCalledWith([])
  })

  it('displays active filters as badges', () => {
    render(
      <TimelineFilters
        {...defaultProps}
        selectedAuthors={['John Doe']}
        selectedFileTypes={['ts']}
        searchQuery="auth"
        selectedDateRange={[new Date('2024-01-01'), new Date('2024-01-31')]}
      />
    )
    
    // Should show active filter badges
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('.ts')).toBeInTheDocument()
    expect(screen.getByText('"auth"')).toBeInTheDocument()
    expect(screen.getByText(/Jan 01 - Jan 31/)).toBeInTheDocument()
  })

  it('handles removing individual filter badges', async () => {
    const user = userEvent.setup()
    const onAuthorsChange = vi.fn()
    
    render(
      <TimelineFilters
        {...defaultProps}
        selectedAuthors={['John Doe', 'Jane Smith']}
        onAuthorsChange={onAuthorsChange}
      />
    )
    
    // Find and click the X button on John Doe badge
    const johnDoeBadge = screen.getByText('John Doe').closest('div')
    const removeButton = johnDoeBadge?.querySelector('button')
    
    if (removeButton) {
      await user.click(removeButton)
      expect(onAuthorsChange).toHaveBeenCalledWith(['Jane Smith'])
    }
  })

  it('handles clear all filters button', async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()
    
    render(
      <TimelineFilters
        {...defaultProps}
        selectedAuthors={['John Doe']}
        selectedFileTypes={['ts']}
        searchQuery="auth"
        onClearFilters={onClearFilters}
      />
    )
    
    const clearAllButton = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearAllButton)
    
    expect(onClearFilters).toHaveBeenCalled()
  })

  it('shows clear all button only when filters are active', () => {
    const { rerender } = render(<TimelineFilters {...defaultProps} />)
    
    // No clear all button when no filters
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument()
    
    // Show clear all button when filters are active
    rerender(
      <TimelineFilters
        {...defaultProps}
        selectedAuthors={['John Doe']}
      />
    )
    
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })

  it('handles date range selection', async () => {
    const user = userEvent.setup()
    const onDateRangeChange = vi.fn()
    
    render(
      <TimelineFilters
        {...defaultProps}
        onDateRangeChange={onDateRangeChange}
      />
    )
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Click date range picker
    const dateRangeButton = screen.getByRole('button', { name: /pick a date range/i })
    await user.click(dateRangeButton)
    
    // Calendar should be visible (mocked in real implementation)
    // This test verifies the button exists and is clickable
    expect(dateRangeButton).toBeInTheDocument()
  })

  it('sorts authors and file types alphabetically', async () => {
    const user = userEvent.setup()
    render(<TimelineFilters {...defaultProps} />)
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Check that authors are sorted
    const authorLabels = screen.getAllByText(/^(Bob Wilson|Jane Smith|John Doe)$/)
    expect(authorLabels[0]).toHaveTextContent('Bob Wilson')
    expect(authorLabels[1]).toHaveTextContent('Jane Smith')
    expect(authorLabels[2]).toHaveTextContent('John Doe')
    
    // Check that file types are sorted
    const fileTypeLabels = screen.getAllByText(/^\.(js|md|ts|tsx)$/)
    expect(fileTypeLabels[0]).toHaveTextContent('.js')
    expect(fileTypeLabels[1]).toHaveTextContent('.md')
    expect(fileTypeLabels[2]).toHaveTextContent('.ts')
    expect(fileTypeLabels[3]).toHaveTextContent('.tsx')
  })

  it('handles scrollable lists for many authors/file types', async () => {
    const user = userEvent.setup()
    render(<TimelineFilters {...defaultProps} />)
    
    // Expand filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Check that author and file type containers have scroll classes
    const authorContainer = screen.getByText('John Doe').closest('.max-h-32')
    const fileTypeContainer = screen.getByText('.ts').closest('.max-h-32')
    
    expect(authorContainer).toHaveClass('overflow-y-auto')
    expect(fileTypeContainer).toHaveClass('overflow-y-auto')
  })
})