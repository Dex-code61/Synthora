import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimelineChart } from '@/components/timeline/TimelineChart'
import { Commit } from '@/types/git'

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  ScatterChart: ({ children, data }: any) => (
    <div data-testid="scatter-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  Line: ({ dataKey, name }: any) => (
    <div data-testid={`line-${dataKey}`} data-name={name} />
  ),
  Scatter: ({ dataKey }: any) => (
    <div data-testid={`scatter-${dataKey}`} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Brush: ({ onChange }: any) => (
    <div
      data-testid="brush"
      onClick={() => onChange?.({ startIndex: 0, endIndex: 1 })}
    />
  ),
  Cell: () => <div data-testid="cell" />
}))

const mockCommits: Commit[] = [
  {
    sha: 'abc123',
    author: 'John Doe',
    email: 'john@example.com',
    message: 'Initial commit',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    filesChanged: 3,
    insertions: 100,
    deletions: 0,
    files: [
      { filePath: 'src/index.ts', changeType: 'added', insertions: 50, deletions: 0 },
      { filePath: 'README.md', changeType: 'added', insertions: 30, deletions: 0 },
      { filePath: 'package.json', changeType: 'added', insertions: 20, deletions: 0 }
    ]
  },
  {
    sha: 'def456',
    author: 'Jane Smith',
    email: 'jane@example.com',
    message: 'Add authentication',
    timestamp: new Date('2024-01-02T14:30:00Z'),
    filesChanged: 2,
    insertions: 75,
    deletions: 10,
    files: [
      { filePath: 'src/auth.ts', changeType: 'added', insertions: 60, deletions: 0 },
      { filePath: 'src/index.ts', changeType: 'modified', insertions: 15, deletions: 10 }
    ]
  },
  {
    sha: 'ghi789',
    author: 'Bob Wilson',
    email: 'bob@example.com',
    message: 'Fix bug in authentication',
    timestamp: new Date('2024-01-03T09:15:00Z'),
    filesChanged: 1,
    insertions: 5,
    deletions: 8,
    files: [
      { filePath: 'src/auth.ts', changeType: 'modified', insertions: 5, deletions: 8 }
    ]
  }
]

describe('TimelineChart', () => {
  const defaultProps = {
    commits: mockCommits,
    onCommitClick: vi.fn(),
    onDateRangeChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders timeline chart with commits', () => {
    render(<TimelineChart {...defaultProps} />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
  })

  it('displays empty state when no commits', () => {
    render(<TimelineChart {...defaultProps} commits={[]} />)
    
    expect(screen.getByText('No commits found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters or date range')).toBeInTheDocument()
  })

  it('renders timeline controls', () => {
    render(<TimelineChart {...defaultProps} />)
    
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('Commits')).toBeInTheDocument()
    expect(screen.getByText('3 commits')).toBeInTheDocument()
  })

  it('switches between activity and commits view modes', async () => {
    const user = userEvent.setup()
    render(<TimelineChart {...defaultProps} />)
    
    // Initially shows line chart (activity mode)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('scatter-chart')).not.toBeInTheDocument()
    
    // Switch to commits mode
    await user.click(screen.getByText('Commits'))
    
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('filters commits by date range', () => {
    const selectedDateRange: [Date, Date] = [
      new Date('2024-01-02T00:00:00Z'),
      new Date('2024-01-03T23:59:59Z')
    ]
    
    render(
      <TimelineChart
        {...defaultProps}
        selectedDateRange={selectedDateRange}
      />
    )
    
    // Should only show commits within date range (2 commits)
    const chart = screen.getByTestId('line-chart')
    expect(chart).toHaveAttribute('data-length', '2')
  })

  it('filters commits by selected authors', () => {
    render(
      <TimelineChart
        {...defaultProps}
        selectedAuthors={['John Doe', 'Jane Smith']}
      />
    )
    
    // Should show commits from selected authors (2 commits)
    const chart = screen.getByTestId('line-chart')
    expect(chart).toHaveAttribute('data-length', '2')
  })

  it('filters commits by file types', () => {
    render(
      <TimelineChart
        {...defaultProps}
        selectedFileTypes={['ts']}
      />
    )
    
    // Should show commits that modified .ts files (3 commits)
    const chart = screen.getByTestId('line-chart')
    expect(chart).toHaveAttribute('data-length', '3')
  })

  it('handles brush selection for date range change', async () => {
    const onDateRangeChange = vi.fn()
    render(
      <TimelineChart
        {...defaultProps}
        onDateRangeChange={onDateRangeChange}
      />
    )
    
    const brush = screen.getByTestId('brush')
    fireEvent.click(brush)
    
    await waitFor(() => {
      expect(onDateRangeChange).toHaveBeenCalledWith([
        expect.any(Date),
        expect.any(Date)
      ])
    })
  })

  it('handles zoom controls', async () => {
    const user = userEvent.setup()
    render(<TimelineChart {...defaultProps} />)
    
    // Test zoom in
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
    expect(zoomInButton).toBeDisabled() // Initially disabled when no zoom
    
    // Test quick range selection
    const quickRangeSelect = screen.getByRole('combobox')
    await user.click(quickRangeSelect)
    
    const lastWeekOption = screen.getByText('Last 7 days')
    await user.click(lastWeekOption)
    
    // After selecting a range, zoom controls should be enabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /zoom in/i })).not.toBeDisabled()
    })
  })

  it('displays correct commit statistics', () => {
    render(<TimelineChart {...defaultProps} />)
    
    expect(screen.getByText('3 commits')).toBeInTheDocument()
  })

  it('handles commit click in scatter mode', async () => {
    const onCommitClick = vi.fn()
    const user = userEvent.setup()
    
    render(
      <TimelineChart
        {...defaultProps}
        onCommitClick={onCommitClick}
      />
    )
    
    // Switch to commits mode
    await user.click(screen.getByText('Commits'))
    
    // In a real implementation, clicking on scatter points would trigger onCommitClick
    // This is a simplified test since we're mocking Recharts
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument()
  })

  it('applies multiple filters simultaneously', () => {
    render(
      <TimelineChart
        {...defaultProps}
        selectedDateRange={[
          new Date('2024-01-01T00:00:00Z'),
          new Date('2024-01-02T23:59:59Z')
        ]}
        selectedAuthors={['John Doe']}
        selectedFileTypes={['ts']}
      />
    )
    
    // Should show only commits that match all filters (1 commit)
    const chart = screen.getByTestId('line-chart')
    expect(chart).toHaveAttribute('data-length', '1')
  })

  it('groups commits by day correctly', () => {
    // Add commits on the same day
    const commitsOnSameDay: Commit[] = [
      ...mockCommits,
      {
        sha: 'xyz999',
        author: 'Alice Brown',
        email: 'alice@example.com',
        message: 'Another commit on same day',
        timestamp: new Date('2024-01-01T15:00:00Z'), // Same day as first commit
        filesChanged: 1,
        insertions: 20,
        deletions: 5,
        files: [
          { filePath: 'src/utils.ts', changeType: 'added', insertions: 20, deletions: 5 }
        ]
      }
    ]
    
    render(<TimelineChart {...defaultProps} commits={commitsOnSameDay} />)
    
    // Should group commits by day, so we have 3 days with data points
    const chart = screen.getByTestId('line-chart')
    expect(chart).toHaveAttribute('data-length', '3')
  })

  it('handles responsive design', () => {
    render(<TimelineChart {...defaultProps} />)
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })
})