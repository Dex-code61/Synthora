import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimelineControls } from '@/components/timeline/TimelineControls'

describe('TimelineControls', () => {
  const defaultProps = {
    viewMode: 'activity' as const,
    onViewModeChange: vi.fn(),
    onZoom: vi.fn(),
    zoomDomain: null,
    totalCommits: 42,
    dateRange: undefined
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders view mode toggle buttons', () => {
    render(<TimelineControls {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /commits/i })).toBeInTheDocument()
  })

  it('highlights active view mode', () => {
    render(<TimelineControls {...defaultProps} viewMode="activity" />)
    
    const activityButton = screen.getByRole('button', { name: /activity/i })
    const commitsButton = screen.getByRole('button', { name: /commits/i })
    
    // Activity button should have default variant (active)
    expect(activityButton).toHaveClass('bg-primary')
    // Commits button should have outline variant (inactive)
    expect(commitsButton).not.toHaveClass('bg-primary')
  })

  it('handles view mode changes', async () => {
    const user = userEvent.setup()
    const onViewModeChange = vi.fn()
    
    render(
      <TimelineControls
        {...defaultProps}
        onViewModeChange={onViewModeChange}
      />
    )
    
    const commitsButton = screen.getByRole('button', { name: /commits/i })
    await user.click(commitsButton)
    
    expect(onViewModeChange).toHaveBeenCalledWith('commits')
  })

  it('renders zoom controls', () => {
    render(<TimelineControls {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset zoom/i })).toBeInTheDocument()
  })

  it('disables zoom controls when no zoom domain', () => {
    render(<TimelineControls {...defaultProps} zoomDomain={null} />)
    
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /reset zoom/i })).toBeDisabled()
  })

  it('enables zoom controls when zoom domain is set', () => {
    const zoomDomain: [number, number] = [1000, 2000]
    render(<TimelineControls {...defaultProps} zoomDomain={zoomDomain} />)
    
    expect(screen.getByRole('button', { name: /zoom in/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /zoom out/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /reset zoom/i })).not.toBeDisabled()
  })

  it('handles zoom in', async () => {
    const user = userEvent.setup()
    const onZoom = vi.fn()
    const zoomDomain: [number, number] = [1000, 2000]
    
    render(
      <TimelineControls
        {...defaultProps}
        zoomDomain={zoomDomain}
        onZoom={onZoom}
      />
    )
    
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
    await user.click(zoomInButton)
    
    expect(onZoom).toHaveBeenCalledWith([1150, 1850]) // 30% zoom in
  })

  it('handles zoom out', async () => {
    const user = userEvent.setup()
    const onZoom = vi.fn()
    const zoomDomain: [number, number] = [1000, 2000]
    
    render(
      <TimelineControls
        {...defaultProps}
        zoomDomain={zoomDomain}
        onZoom={onZoom}
      />
    )
    
    const zoomOutButton = screen.getByRole('button', { name: /zoom out/i })
    await user.click(zoomOutButton)
    
    expect(onZoom).toHaveBeenCalledWith([800, 2200]) // 40% zoom out
  })

  it('handles reset zoom', async () => {
    const user = userEvent.setup()
    const onZoom = vi.fn()
    const zoomDomain: [number, number] = [1000, 2000]
    
    render(
      <TimelineControls
        {...defaultProps}
        zoomDomain={zoomDomain}
        onZoom={onZoom}
      />
    )
    
    const resetButton = screen.getByRole('button', { name: /reset zoom/i })
    await user.click(resetButton)
    
    expect(onZoom).toHaveBeenCalledWith(null)
  })

  it('renders quick time range selector', () => {
    render(<TimelineControls {...defaultProps} />)
    
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Quick range')).toBeInTheDocument()
  })

  it('handles quick time range selection', async () => {
    const user = userEvent.setup()
    const onZoom = vi.fn()
    
    render(
      <TimelineControls
        {...defaultProps}
        onZoom={onZoom}
      />
    )
    
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    // Select "Last 7 days" option
    const option = screen.getByText('Last 7 days')
    await user.click(option)
    
    // Should call onZoom with date range for last 7 days
    expect(onZoom).toHaveBeenCalledWith([
      expect.any(Number), // start timestamp
      expect.any(Number)  // end timestamp
    ])
  })

  it('displays total commits count', () => {
    render(<TimelineControls {...defaultProps} totalCommits={123} />)
    
    expect(screen.getByText('123 commits')).toBeInTheDocument()
  })

  it('displays date range when provided', () => {
    const dateRange: [Date, Date] = [
      new Date('2024-01-01'),
      new Date('2024-01-31')
    ]
    
    render(
      <TimelineControls
        {...defaultProps}
        dateRange={dateRange}
      />
    )
    
    expect(screen.getByText(/Jan 01 - Jan 31, 2024/)).toBeInTheDocument()
  })

  it('shows zoomed badge when zoom is active', () => {
    const zoomDomain: [number, number] = [1000, 2000]
    
    render(
      <TimelineControls
        {...defaultProps}
        zoomDomain={zoomDomain}
      />
    )
    
    expect(screen.getByText('Zoomed')).toBeInTheDocument()
  })

  it('hides zoomed badge when no zoom', () => {
    render(<TimelineControls {...defaultProps} zoomDomain={null} />)
    
    expect(screen.queryByText('Zoomed')).not.toBeInTheDocument()
  })

  it('renders with responsive layout classes', () => {
    render(<TimelineControls {...defaultProps} />)
    
    const container = screen.getByRole('button', { name: /activity/i }).closest('div')
    expect(container).toHaveClass('flex', 'flex-col', 'sm:flex-row')
  })

  it('includes proper icons for buttons', () => {
    render(<TimelineControls {...defaultProps} />)
    
    // Check for presence of icon elements (Lucide icons render as SVGs)
    const activityButton = screen.getByRole('button', { name: /activity/i })
    const commitsButton = screen.getByRole('button', { name: /commits/i })
    
    expect(activityButton.querySelector('svg')).toBeInTheDocument()
    expect(commitsButton.querySelector('svg')).toBeInTheDocument()
  })

  it('handles all quick range options', async () => {
    const user = userEvent.setup()
    const onZoom = vi.fn()
    
    render(
      <TimelineControls
        {...defaultProps}
        onZoom={onZoom}
      />
    )
    
    const select = screen.getByRole('combobox')
    
    // Test each quick range option
    const ranges = [
      { text: 'Last 7 days', value: '7d' },
      { text: 'Last 30 days', value: '30d' },
      { text: 'Last 3 months', value: '90d' },
      { text: 'Last year', value: '1y' }
    ]
    
    for (const range of ranges) {
      onZoom.mockClear()
      
      await user.click(select)
      const option = screen.getByText(range.text)
      await user.click(option)
      
      expect(onZoom).toHaveBeenCalledWith([
        expect.any(Number),
        expect.any(Number)
      ])
    }
  })

  it('maintains proper spacing and layout', () => {
    render(<TimelineControls {...defaultProps} />)
    
    // Check for proper spacing classes
    const mainContainer = screen.getByRole('button', { name: /activity/i }).closest('.p-4')
    expect(mainContainer).toHaveClass('bg-muted/50', 'rounded-lg')
  })
})