import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { StoryErrorDisplay, StoryErrorInline } from '@/components/analysis/StoryErrorDisplay'
import type { StoryError } from '@/components/analysis/StoryErrorDisplay'

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  HelpCircle: () => <div data-testid="help-circle-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />
}))

describe('StoryErrorDisplay', () => {
  const defaultProps = {
    filePath: 'src/components/Button.tsx'
  }

  describe('Error Type Classification', () => {
    it('should display network error correctly', () => {
      const networkError: StoryError = {
        type: 'network',
        message: 'Network connection failed',
        retryable: true
      }

      render(<StoryErrorDisplay {...defaultProps} error={networkError} />)

      expect(screen.getByText('Connection Issue')).toBeInTheDocument()
      expect(screen.getByText('Network connection issue. Please check your internet connection and try again.')).toBeInTheDocument()
      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument()
    })

    it('should display rate limit error correctly', () => {
      const rateLimitError: StoryError = {
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        retryable: true,
        retryAfter: 60
      }

      render(<StoryErrorDisplay {...defaultProps} error={rateLimitError} />)

      expect(screen.getByText('Service Busy')).toBeInTheDocument()
      expect(screen.getByText('AI service is temporarily busy. Please try again in 60 seconds.')).toBeInTheDocument()
      expect(screen.getByText('Retry available in 60 seconds')).toBeInTheDocument()
      expect(screen.getAllByTestId('clock-icon')).toHaveLength(2) // One in header, one in retry info
    })

    it('should display AI service error correctly', () => {
      const aiServiceError: StoryError = {
        type: 'ai_service',
        message: 'AI service unavailable',
        retryable: true
      }

      render(<StoryErrorDisplay {...defaultProps} error={aiServiceError} />)

      expect(screen.getByText('AI Service Error')).toBeInTheDocument()
      expect(screen.getByText('AI service is currently unavailable. This might be temporary - please try again later.')).toBeInTheDocument()
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
    })

    it('should display validation error correctly', () => {
      const validationError: StoryError = {
        type: 'validation',
        message: 'Invalid file path',
        retryable: false
      }

      render(<StoryErrorDisplay {...defaultProps} error={validationError} />)

      expect(screen.getByText('Invalid Request')).toBeInTheDocument()
      expect(screen.getByText('There was an issue with the request. Please check the file path and try again.')).toBeInTheDocument()
      expect(screen.getAllByTestId('help-circle-icon')).toHaveLength(2) // One in header, one in help link
    })

    it('should display unknown error correctly', () => {
      const unknownError: StoryError = {
        type: 'unknown',
        message: 'Something went wrong',
        retryable: true
      }

      render(<StoryErrorDisplay {...defaultProps} error={unknownError} />)

      expect(screen.getByText('Generation Failed')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getAllByTestId('alert-triangle-icon')).toHaveLength(2) // One in header, one in alert
    })
  })

  describe('Error Normalization', () => {
    it('should handle string errors', () => {
      render(<StoryErrorDisplay {...defaultProps} error="Simple error message" />)

      expect(screen.getByText('Generation Failed')).toBeInTheDocument()
      expect(screen.getByText('Simple error message')).toBeInTheDocument()
    })

    it('should handle Error objects', () => {
      const error = new Error('Standard error')
      render(<StoryErrorDisplay {...defaultProps} error={error} />)

      expect(screen.getByText('Generation Failed')).toBeInTheDocument()
      expect(screen.getByText('Standard error')).toBeInTheDocument()
    })

    it('should classify rate limit from Error message', () => {
      const error = new Error('Rate limit exceeded (429)')
      render(<StoryErrorDisplay {...defaultProps} error={error} />)

      expect(screen.getByText('Service Busy')).toBeInTheDocument()
    })

    it('should classify network error from Error message', () => {
      const error = new Error('Network connection failed')
      render(<StoryErrorDisplay {...defaultProps} error={error} />)

      expect(screen.getByText('Connection Issue')).toBeInTheDocument()
    })
  })

  describe('Suggestions', () => {
    it('should show network error suggestions', () => {
      const networkError: StoryError = {
        type: 'network',
        message: 'Network failed',
        retryable: true
      }

      render(<StoryErrorDisplay {...defaultProps} error={networkError} />)

      expect(screen.getByText('Check your internet connection')).toBeInTheDocument()
      expect(screen.getByText('Try refreshing the page')).toBeInTheDocument()
      expect(screen.getByText('Contact your network administrator if the issue persists')).toBeInTheDocument()
    })

    it('should show rate limit suggestions', () => {
      const rateLimitError: StoryError = {
        type: 'rate_limit',
        message: 'Rate limited',
        retryable: true
      }

      render(<StoryErrorDisplay {...defaultProps} error={rateLimitError} />)

      expect(screen.getByText('Wait a few minutes before trying again')).toBeInTheDocument()
      expect(screen.getByText('Try generating stories for fewer files at once')).toBeInTheDocument()
    })

    it('should show validation error suggestions', () => {
      const validationError: StoryError = {
        type: 'validation',
        message: 'Invalid request',
        retryable: false
      }

      render(<StoryErrorDisplay {...defaultProps} error={validationError} />)

      expect(screen.getByText('Verify the file path is correct')).toBeInTheDocument()
      expect(screen.getByText('Ensure the file exists in the repository')).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should show retry button for retryable errors', () => {
      const mockOnRetry = vi.fn()
      const retryableError: StoryError = {
        type: 'network',
        message: 'Network failed',
        retryable: true
      }

      render(
        <StoryErrorDisplay 
          {...defaultProps} 
          error={retryableError} 
          onRetry={mockOnRetry} 
        />
      )

      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(mockOnRetry).toHaveBeenCalled()
    })

    it('should not show retry button for non-retryable errors', () => {
      const nonRetryableError: StoryError = {
        type: 'validation',
        message: 'Invalid request',
        retryable: false
      }

      render(<StoryErrorDisplay {...defaultProps} error={nonRetryableError} />)

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })

    it('should show dismiss button when onDismiss is provided', () => {
      const mockOnDismiss = vi.fn()
      const error: StoryError = {
        type: 'unknown',
        message: 'Some error',
        retryable: true
      }

      render(
        <StoryErrorDisplay 
          {...defaultProps} 
          error={error} 
          onDismiss={mockOnDismiss} 
        />
      )

      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      expect(dismissButton).toBeInTheDocument()
      
      fireEvent.click(dismissButton)
      expect(mockOnDismiss).toHaveBeenCalled()
    })

    it('should disable retry button when retryAfter is set', () => {
      const mockOnRetry = vi.fn()
      const rateLimitError: StoryError = {
        type: 'rate_limit',
        message: 'Rate limited',
        retryable: true,
        retryAfter: 30
      }

      render(
        <StoryErrorDisplay 
          {...defaultProps} 
          error={rateLimitError} 
          onRetry={mockOnRetry} 
        />
      )

      const retryButton = screen.getByRole('button', { name: /retry in 30s/i })
      expect(retryButton).toBeDisabled()
    })
  })

  describe('Technical Details', () => {
    it('should show technical details when showDetails is true', () => {
      const originalError = new Error('Original error message')
      originalError.stack = 'Error stack trace...'
      
      const error: StoryError = {
        type: 'unknown',
        message: 'Wrapped error',
        retryable: true,
        originalError
      }

      render(
        <StoryErrorDisplay 
          {...defaultProps} 
          error={error} 
          showDetails={true} 
        />
      )

      expect(screen.getByText('Technical Details')).toBeInTheDocument()
      
      // The details should be visible since showDetails is true
      // Look for the error message in the pre element
      expect(screen.getByText(/Original error message/)).toBeInTheDocument()
      expect(screen.getByText(/Error stack trace/)).toBeInTheDocument()
    })

    it('should not show technical details when showDetails is false', () => {
      const originalError = new Error('Original error message')
      const error: StoryError = {
        type: 'unknown',
        message: 'Wrapped error',
        retryable: true,
        originalError
      }

      render(
        <StoryErrorDisplay 
          {...defaultProps} 
          error={error} 
          showDetails={false} 
        />
      )

      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
    })
  })

  describe('Props and Customization', () => {
    it('should apply custom className', () => {
      const error: StoryError = {
        type: 'unknown',
        message: 'Test error',
        retryable: true
      }

      const { container } = render(
        <StoryErrorDisplay 
          {...defaultProps} 
          error={error} 
          className="custom-error-class" 
        />
      )

      expect(container.firstChild).toHaveClass('custom-error-class')
    })

    it('should display correct file name', () => {
      const error: StoryError = {
        type: 'unknown',
        message: 'Test error',
        retryable: true
      }

      render(
        <StoryErrorDisplay 
          {...defaultProps} 
          filePath="src/utils/helpers/stringUtils.ts"
          error={error} 
        />
      )

      expect(screen.getByText('Failed to generate story for:')).toBeInTheDocument()
      expect(screen.getByText('stringUtils.ts')).toBeInTheDocument()
    })
  })
})

describe('StoryErrorInline', () => {
  it('should display inline error message', () => {
    const error: StoryError = {
      type: 'unknown',
      message: 'Test error',
      retryable: true
    }

    render(<StoryErrorInline error={error} />)

    expect(screen.getByText('Failed to generate story')).toBeInTheDocument()
  })

  it('should display rate limit specific message', () => {
    const rateLimitError: StoryError = {
      type: 'rate_limit',
      message: 'Rate limited',
      retryable: true
    }

    render(<StoryErrorInline error={rateLimitError} />)

    expect(screen.getByText('Service busy, try again later')).toBeInTheDocument()
  })

  it('should show retry button for retryable errors', () => {
    const mockOnRetry = vi.fn()
    const error: StoryError = {
      type: 'network',
      message: 'Network error',
      retryable: true
    }

    render(<StoryErrorInline error={error} onRetry={mockOnRetry} />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(mockOnRetry).toHaveBeenCalled()
  })

  it('should not show retry button for non-retryable errors', () => {
    const error: StoryError = {
      type: 'validation',
      message: 'Validation error',
      retryable: false
    }

    render(<StoryErrorInline error={error} />)

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const error: StoryError = {
      type: 'unknown',
      message: 'Test error',
      retryable: true
    }

    const { container } = render(
      <StoryErrorInline error={error} className="custom-inline-error" />
    )

    expect(container.firstChild).toHaveClass('custom-inline-error')
  })
})