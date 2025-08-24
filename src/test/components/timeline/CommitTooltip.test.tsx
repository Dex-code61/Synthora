import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommitTooltip } from '@/components/timeline/CommitTooltip'
import { Commit } from '@/types/git'

const mockCommit: Commit = {
  sha: 'abc123def456',
  author: 'John Doe',
  email: 'john@example.com',
  message: 'Add user authentication system with JWT tokens',
  timestamp: new Date('2024-01-15T10:30:00Z'),
  filesChanged: 3,
  insertions: 125,
  deletions: 15,
  files: [
    { filePath: 'src/auth/login.ts', changeType: 'added', insertions: 50, deletions: 0 },
    { filePath: 'src/auth/register.ts', changeType: 'added', insertions: 45, deletions: 0 },
    { filePath: 'src/types/user.ts', changeType: 'modified', insertions: 30, deletions: 15 }
  ]
}

const mockDailyData = {
  timestamp: new Date('2024-01-15T00:00:00Z').getTime(),
  commitCount: 3,
  filesChanged: 8,
  insertions: 200,
  deletions: 25,
  commits: [
    mockCommit,
    {
      sha: 'def456ghi789',
      author: 'Jane Smith',
      email: 'jane@example.com',
      message: 'Fix authentication bug',
      timestamp: new Date('2024-01-15T14:20:00Z'),
      filesChanged: 2,
      insertions: 15,
      deletions: 8,
      files: [
        { filePath: 'src/auth/login.ts', changeType: 'modified', insertions: 10, deletions: 5 },
        { filePath: 'src/components/LoginForm.tsx', changeType: 'modified', insertions: 5, deletions: 3 }
      ]
    }
  ]
}

describe('CommitTooltip', () => {
  it('renders nothing when not active', () => {
    const { container } = render(
      <CommitTooltip active={false} payload={[]} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when no payload', () => {
    const { container } = render(
      <CommitTooltip active={true} payload={[]} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renders individual commit tooltip for scatter chart', () => {
    const payload = [{ payload: { commit: mockCommit } }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Check commit SHA
    expect(screen.getByText('abc123de')).toBeInTheDocument()
    
    // Check commit message
    expect(screen.getByText('Add user authentication system with JWT tokens')).toBeInTheDocument()
    
    // Check author and timestamp
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    
    // Check file statistics
    expect(screen.getByText('3 files')).toBeInTheDocument()
    expect(screen.getByText('125')).toBeInTheDocument() // insertions
    expect(screen.getByText('15')).toBeInTheDocument() // deletions
    
    // Check files changed section
    expect(screen.getByText('Files changed:')).toBeInTheDocument()
    expect(screen.getByText('login.ts')).toBeInTheDocument()
    expect(screen.getByText('register.ts')).toBeInTheDocument()
    expect(screen.getByText('user.ts')).toBeInTheDocument()
  })

  it('renders daily aggregated tooltip for line chart', () => {
    const payload = [{ payload: mockDailyData }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Check daily statistics
    expect(screen.getByText('3')).toBeInTheDocument() // commit count
    expect(screen.getByText('8')).toBeInTheDocument() // files changed
    expect(screen.getByText('+200')).toBeInTheDocument() // insertions
    expect(screen.getByText('-25')).toBeInTheDocument() // deletions
    
    // Check recent commits section
    expect(screen.getByText('Recent commits:')).toBeInTheDocument()
    expect(screen.getByText('abc123')).toBeInTheDocument() // commit SHA
    expect(screen.getByText('def456')).toBeInTheDocument() // second commit SHA
  })

  it('displays change type badges correctly', () => {
    const payload = [{ payload: { commit: mockCommit } }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Check for change type badges
    const badges = screen.getAllByText(/^[AMD]$/) // Added, Modified, Deleted
    expect(badges).toHaveLength(3) // 2 added, 1 modified
    
    // Check specific change types
    expect(screen.getAllByText('A')).toHaveLength(2) // 2 added files
    expect(screen.getAllByText('M')).toHaveLength(1) // 1 modified file
  })

  it('truncates long file lists', () => {
    const commitWithManyFiles: Commit = {
      ...mockCommit,
      files: [
        ...mockCommit.files,
        { filePath: 'src/file4.ts', changeType: 'added', insertions: 10, deletions: 0 },
        { filePath: 'src/file5.ts', changeType: 'added', insertions: 10, deletions: 0 },
        { filePath: 'src/file6.ts', changeType: 'added', insertions: 10, deletions: 0 },
        { filePath: 'src/file7.ts', changeType: 'added', insertions: 10, deletions: 0 }
      ]
    }
    
    const payload = [{ payload: { commit: commitWithManyFiles } }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Should show "+2 more files" since we show max 5 files
    expect(screen.getByText('+2 more files')).toBeInTheDocument()
  })

  it('truncates long commit lists in daily view', () => {
    const dataWithManyCommits = {
      ...mockDailyData,
      commits: [
        ...mockDailyData.commits,
        {
          sha: 'ghi789jkl012',
          author: 'Bob Wilson',
          email: 'bob@example.com',
          message: 'Third commit',
          timestamp: new Date('2024-01-15T16:45:00Z'),
          filesChanged: 1,
          insertions: 10,
          deletions: 2,
          files: []
        },
        {
          sha: 'jkl012mno345',
          author: 'Alice Johnson',
          email: 'alice@example.com',
          message: 'Fourth commit',
          timestamp: new Date('2024-01-15T18:30:00Z'),
          filesChanged: 2,
          insertions: 20,
          deletions: 5,
          files: []
        }
      ]
    }
    
    const payload = [{ payload: dataWithManyCommits }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Should show "+1 more commits" since we show max 3 commits
    expect(screen.getByText('+1 more commits')).toBeInTheDocument()
  })

  it('handles commits with no files', () => {
    const commitWithNoFiles: Commit = {
      ...mockCommit,
      files: []
    }
    
    const payload = [{ payload: { commit: commitWithNoFiles } }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Should still render basic commit info
    expect(screen.getByText('abc123de')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    
    // Files section should not appear
    expect(screen.queryByText('Files changed:')).not.toBeInTheDocument()
  })

  it('formats timestamps correctly', () => {
    const payload = [{ payload: { commit: mockCommit } }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Should display formatted timestamp (exact format may vary by locale)
    expect(screen.getByText(/Jan.*15.*2024/)).toBeInTheDocument()
  })

  it('displays file path correctly', () => {
    const payload = [{ payload: { commit: mockCommit } }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Should show only filename, not full path
    expect(screen.getByText('login.ts')).toBeInTheDocument()
    expect(screen.getByText('register.ts')).toBeInTheDocument()
    expect(screen.getByText('user.ts')).toBeInTheDocument()
    
    // Should not show full paths
    expect(screen.queryByText('src/auth/login.ts')).not.toBeInTheDocument()
  })

  it('applies correct styling for insertions and deletions', () => {
    const payload = [{ payload: { commit: mockCommit } }]
    
    render(<CommitTooltip active={true} payload={payload} />)
    
    // Check for green color class on insertions
    const insertionsElement = screen.getByText('125').closest('div')
    expect(insertionsElement).toHaveClass('text-green-600')
    
    // Check for red color class on deletions
    const deletionsElement = screen.getByText('15').closest('div')
    expect(deletionsElement).toHaveClass('text-red-600')
  })
})