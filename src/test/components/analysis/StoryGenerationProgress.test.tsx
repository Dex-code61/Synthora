import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { StoryGenerationProgress, StoryGenerationProgressInline } from '@/components/analysis/StoryGenerationProgress'

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  X: () => <div data-testid="x-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />
}))

// Mock Progress component
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" data-value={value} className={className} />
  )
}))

describe('StoryGenerationProgress', () => {
  const defaultProps = {
    isGenerating: true,
    filePath: 'src/components/Button.tsx'
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should not render when not generating and no progress', () => {
      const { container } = render(
        <StoryGenerationProgress {...defaultProps} isGenerating={false} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render when generating', () => {
      render(<StoryGenerationProgress {...defaultProps} />)

      expect(screen.getByText('Generating Story')).toBeInTheDocument()
      expect(screen.getByText('Button.tsx')).toBeInTheDocument()
    })

    it('should show cancel button when onCancel is provided', () => {
      const mockOnCancel = vi.fn()
      
      render(<StoryGenerationProgress {...defaultProps} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByTestId('x-icon').closest('button')
      expect(cancelButton).toBeInTheDocument()
      
      fireEvent.click(cancelButton!)
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Progress Updates', () => {
    it('should update progress over time', () => {
      render(<StoryGenerationProgress {...defaultProps} estimatedTime={10} />)

      // Initial state
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText(/0\.0s \/ ~10s/)).toBeInTheDocument()

      // Advance time
      act(() => {
        vi.advanceTimersByTime(1000) // 1 second
      })

      expect(screen.getByText(/1\.0s \/ ~10s/)).toBeInTheDocument()

      // Advance more time
      act(() => {
        vi.advanceTimersByTime(4000) // 5 seconds total
      })

      expect(screen.getByText(/5\.0s \/ ~10s/)).toBeInTheDocument()
    })

    it('should update current step based on progress', () => {
      render(<StoryGenerationProgress {...defaultProps} estimatedTime={15} />)

      // Should start with first step
      expect(screen.getByText('Analyzing file history')).toBeInTheDocument()

      // The step progression is based on cumulative duration, so we need to be more careful with timing
      // Steps: analyzing(3s), processing(4s), generating(6s), finalizing(2s)
      
      // Advance to second step (after 3.1 seconds to be sure we're in the next step)
      act(() => {
        vi.advanceTimersByTime(3100)
      })

      // Should now be in processing step (text is truncated to first 2 words in UI)
      expect(screen.getByText('Processing commit')).toBeInTheDocument()

      // Advance to third step (after 7.1 seconds total)
      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(screen.getByText('Generating AI')).toBeInTheDocument()

      // Advance to final step (after 13.1 seconds total)
      act(() => {
        vi.advanceTimersByTime(6000)
      })

      expect(screen.getByText('Finalizing insights')).toBeInTheDocument()
    })

    it('should show step progress indicators', () => {
      render(<StoryGenerationProgress {...defaultProps} />)

      // Should show 4 steps
      const steps = screen.getAllByTestId('file-text-icon').length + 
                   screen.getAllByTestId('refresh-icon').length + 
                   screen.getAllByTestId('brain-icon').length + 
                   screen.getAllByTestId('lightbulb-icon').length

      expect(steps).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Completion State', () => {
    it('should show completion state when generation finishes', async () => {
      const { rerender } = render(<StoryGenerationProgress {...defaultProps} />)

      // Advance time to show some progress
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Stop generating and wait for effects to complete
      await act(async () => {
        rerender(<StoryGenerationProgress {...defaultProps} isGenerating={false} />)
        // Allow time for the useEffect to run
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByText('Story Generated')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
      expect(screen.getByText('Story generation complete')).toBeInTheDocument()
    })

    it('should show completion message', async () => {
      const { rerender } = render(<StoryGenerationProgress {...defaultProps} />)

      // Advance time first to establish progress
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Stop generating and wait for effects to complete
      await act(async () => {
        rerender(<StoryGenerationProgress {...defaultProps} isGenerating={false} />)
        // Allow time for the useEffect to run
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByText('Story generated successfully!')).toBeInTheDocument()
      expect(screen.getByText('Your file\'s story is ready to view')).toBeInTheDocument()
    })
  })

  describe('Status Messages', () => {
    it('should show generating message when active', () => {
      render(<StoryGenerationProgress {...defaultProps} />)

      expect(screen.getByText('AI is analyzing your file...')).toBeInTheDocument()
      expect(screen.getByText('This may take a few moments depending on file complexity')).toBeInTheDocument()
    })

    it('should show slow progress warning', () => {
      render(<StoryGenerationProgress {...defaultProps} estimatedTime={10} />)

      // Advance time beyond 1.5x estimated time
      act(() => {
        vi.advanceTimersByTime(16000) // 16 seconds, more than 1.5 * 10
      })

      expect(screen.getByText('Taking longer than expected')).toBeInTheDocument()
      expect(screen.getByText('Large files or complex histories may require additional processing time')).toBeInTheDocument()
    })
  })

  describe('Props and Customization', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <StoryGenerationProgress {...defaultProps} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should use custom estimated time', () => {
      render(<StoryGenerationProgress {...defaultProps} estimatedTime={20} />)

      expect(screen.getByText('0.0s / ~20s')).toBeInTheDocument()
    })

    it('should handle different file paths', () => {
      render(
        <StoryGenerationProgress 
          {...defaultProps} 
          filePath="src/utils/helpers/stringUtils.ts" 
        />
      )

      expect(screen.getByText('stringUtils.ts')).toBeInTheDocument()
    })
  })

  describe('Timer Management', () => {
    it('should clean up timer when component unmounts', () => {
      const { unmount } = render(<StoryGenerationProgress {...defaultProps} />)

      // Advance time to start timer
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Unmount component
      unmount()

      // Timer should be cleaned up (no errors should occur)
      act(() => {
        vi.advanceTimersByTime(1000)
      })
    })

    it('should reset progress when isGenerating changes to true', () => {
      const { rerender } = render(
        <StoryGenerationProgress {...defaultProps} isGenerating={false} />
      )

      // Start generating again
      rerender(<StoryGenerationProgress {...defaultProps} isGenerating={true} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText(/0\.0s \/ ~15s/)).toBeInTheDocument()
    })
  })
})

describe('StoryGenerationProgressInline', () => {
  it('should not render when not generating', () => {
    const { container } = render(
      <StoryGenerationProgressInline isGenerating={false} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render when generating', () => {
    render(<StoryGenerationProgressInline isGenerating={true} progress={50} />)

    expect(screen.getByText('Generating story...')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-value', '50')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <StoryGenerationProgressInline 
        isGenerating={true} 
        progress={25} 
        className="custom-inline-class" 
      />
    )

    expect(container.firstChild).toHaveClass('custom-inline-class')
  })

  it('should handle zero progress', () => {
    render(<StoryGenerationProgressInline isGenerating={true} progress={0} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-value', '0')
  })

  it('should handle 100% progress', () => {
    render(<StoryGenerationProgressInline isGenerating={true} progress={100} />)

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-value', '100')
  })
})