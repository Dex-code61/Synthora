import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { FileStoryPanel } from '@/components/analysis/FileStoryPanel'
import * as storyHooks from '@/hooks/use-stories'

// Mock the hooks
vi.mock('@/hooks/use-stories', () => ({
  useFileStory: vi.fn(),
  useGenerateFileStory: vi.fn(),
  useDeleteFileStory: vi.fn()
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  History: () => <div data-testid="history-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />
}))

const mockStory = {
  filePath: 'src/components/Button.tsx',
  story: 'This is a comprehensive story about the Button component...',
  sections: {
    creation: 'The Button component was created on 2023-01-15 by John Doe as part of the UI library.',
    evolution: 'Over 6 months, this file has evolved through 15 commits in a collaborative effort.',
    keyChanges: [
      'Added TypeScript support',
      'Implemented accessibility features',
      'Added variant system'
    ],
    currentState: 'This TypeScript React file currently has a low risk score of 0.2 and appears relatively stable.',
    recommendations: [
      'Consider adding more comprehensive unit tests',
      'Document the variant system in Storybook'
    ]
  },
  generatedAt: new Date('2023-07-15T10:30:00Z')
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('FileStoryPanel', () => {
  const defaultProps = {
    repositoryId: '1',
    filePath: 'src/components/Button.tsx'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading skeleton when fetching story', () => {
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('File Story: Button.tsx')).toBeInTheDocument()
      // Check for skeleton elements by their data-slot attribute
      const skeletonElements = document.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('should show generating state when creating story', async () => {
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      const mockMutateAsync = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      const generateButton = screen.getByRole('button', { name: /generate story/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        // When generating, it should show the loading skeleton
        const skeletonElements = document.querySelectorAll('[data-slot="skeleton"]')
        expect(skeletonElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('No Story State', () => {
    it('should show generate button when no story exists', () => {
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('No story available')).toBeInTheDocument()
      expect(screen.getByText('Generate an AI-powered story to understand this file\'s evolution and insights.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate story/i })).toBeInTheDocument()
    })

    it('should call generate story when button is clicked', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(mockStory)
      
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      const generateButton = screen.getByRole('button', { name: /generate story/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          repositoryId: '1',
          filePath: 'src/components/Button.tsx',
          options: {
            includeRecommendations: true,
            maxLength: 'medium',
            focusArea: 'technical'
          }
        })
      })
    })
  })

  describe('Story Display', () => {
    beforeEach(() => {
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: mockStory,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)
    })

    it('should display story sections correctly', () => {
      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('File Story: Button.tsx')).toBeInTheDocument()
      expect(screen.getByText('Story Generated')).toBeInTheDocument()
      
      // Check sections
      expect(screen.getByText('The Beginning')).toBeInTheDocument()
      expect(screen.getByText(mockStory.sections.creation)).toBeInTheDocument()
      
      expect(screen.getByText('Evolution')).toBeInTheDocument()
      expect(screen.getByText(mockStory.sections.evolution)).toBeInTheDocument()
      
      expect(screen.getByText('Key Changes')).toBeInTheDocument()
      mockStory.sections.keyChanges.forEach(change => {
        expect(screen.getByText(change)).toBeInTheDocument()
      })
      
      expect(screen.getByText('Current State')).toBeInTheDocument()
      expect(screen.getByText(mockStory.sections.currentState)).toBeInTheDocument()
      
      expect(screen.getByText('Recommendations')).toBeInTheDocument()
      mockStory.sections.recommendations.forEach(rec => {
        expect(screen.getByText(rec)).toBeInTheDocument()
      })
    })

    it('should display complete story text', () => {
      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Complete Story')).toBeInTheDocument()
      expect(screen.getByText(mockStory.story)).toBeInTheDocument()
    })

    it('should show generation date', () => {
      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('15/07/2023')).toBeInTheDocument()
    })

    it('should handle refresh story', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({ data: mockStory })
      
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: mockStory,
        isLoading: false,
        error: null,
        refetch: mockRefetch
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    it('should handle delete story', async () => {
      const mockDeleteAsync = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: mockDeleteAsync,
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockDeleteAsync).toHaveBeenCalledWith({
          repositoryId: '1',
          filePath: 'src/components/Button.tsx'
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should display fetch error', () => {
      const error = new Error('Failed to fetch story')
      
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Failed to fetch story')).toBeInTheDocument()
    })

    it('should display generation error', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('Generation failed'))
      
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      const generateButton = screen.getByRole('button', { name: /generate story/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument()
      })
    })
  })

  describe('Props and Customization', () => {
    it('should apply custom className', () => {
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      const { container } = render(
        <FileStoryPanel {...defaultProps} className="custom-class" />, 
        { wrapper: createWrapper() }
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should call onClose when close button is clicked', () => {
      const mockOnClose = vi.fn()
      
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: mockStory,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} onClose={mockOnClose} />, { wrapper: createWrapper() })

      const closeButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should handle different file paths correctly', () => {
      const props = {
        ...defaultProps,
        filePath: 'src/utils/helpers/stringUtils.ts'
      }

      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...props} />, { wrapper: createWrapper() })

      expect(screen.getByText('File Story: stringUtils.ts')).toBeInTheDocument()
      expect(screen.getByText('src/utils/helpers/stringUtils.ts')).toBeInTheDocument()
    })
  })

  describe('Conditional Rendering', () => {
    it('should not render sections that are empty', () => {
      const storyWithEmptySections = {
        ...mockStory,
        sections: {
          creation: '',
          evolution: 'Some evolution text',
          keyChanges: [],
          currentState: '',
          recommendations: []
        }
      }

      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: storyWithEmptySections,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      vi.mocked(storyHooks.useDeleteFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryPanel {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.queryByText('The Beginning')).not.toBeInTheDocument()
      expect(screen.getByText('Evolution')).toBeInTheDocument()
      expect(screen.queryByText('Key Changes')).not.toBeInTheDocument()
      expect(screen.queryByText('Current State')).not.toBeInTheDocument()
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument()
    })
  })
})