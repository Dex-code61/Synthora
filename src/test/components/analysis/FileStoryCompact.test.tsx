import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { FileStoryCompact } from '@/components/analysis/FileStoryCompact'
import * as storyHooks from '@/hooks/use-stories'

// Mock the hooks
vi.mock('@/hooks/use-stories', () => ({
  useFileStory: vi.fn(),
  useGenerateFileStory: vi.fn()
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Maximize2: () => <div data-testid="maximize-icon" />
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
      'Added variant system',
      'Improved performance',
      'Added dark mode support'
    ],
    currentState: 'This TypeScript React file currently has a low risk score of 0.2 and appears relatively stable.',
    recommendations: [
      'Consider adding more comprehensive unit tests',
      'Document the variant system in Storybook',
      'Add performance benchmarks'
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

describe('FileStoryCompact', () => {
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
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Button.tsx')).toBeInTheDocument()
      // Check for skeleton elements by their data-slot attribute
      const skeletonElements = document.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('should show generating state when creating story', async () => {
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      const mockMutateAsync = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      const generateButton = screen.getByRole('button', { name: /generate/i })
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
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('No story available')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
    })

    it('should call generate story with short options', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(mockStory)
      
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      const generateButton = screen.getByRole('button', { name: /generate/i })
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          repositoryId: '1',
          filePath: 'src/components/Button.tsx',
          options: {
            includeRecommendations: true,
            maxLength: 'short',
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
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)
    })

    it('should display story sections in compact format', () => {
      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Button.tsx')).toBeInTheDocument()
      expect(screen.getByText('15/07/2023')).toBeInTheDocument()
      
      // Check compact sections
      expect(screen.getByText('Creation')).toBeInTheDocument()
      expect(screen.getByText('Current State')).toBeInTheDocument()
      
      // Creation and current state should be truncated with line-clamp
      const creationText = screen.getByText(mockStory.sections.creation)
      expect(creationText).toBeInTheDocument()
      expect(creationText).toHaveClass('line-clamp-2')
    })

    it('should show key changes count and expand/collapse functionality', () => {
      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      const keyChangesButton = screen.getByRole('button', { name: /key changes \(5\)/i })
      expect(keyChangesButton).toBeInTheDocument()

      // Should show chevron down initially
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument()

      // Click to expand
      fireEvent.click(keyChangesButton)

      // Should show chevron up when expanded
      expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument()

      // Should show all key changes
      mockStory.sections.keyChanges.forEach(change => {
        expect(screen.getByText(change)).toBeInTheDocument()
      })

      // Click to collapse
      fireEvent.click(keyChangesButton)

      // Should hide key changes
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument()
    })

    it('should show limited recommendations with count', () => {
      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Recommendations (3)')).toBeInTheDocument()
      
      // Should show first 2 recommendations
      expect(screen.getByText(mockStory.sections.recommendations[0])).toBeInTheDocument()
      expect(screen.getByText(mockStory.sections.recommendations[1])).toBeInTheDocument()
      
      // Should show "+1 more recommendations" text
      expect(screen.getByText('+1 more recommendations')).toBeInTheDocument()
    })

    it('should call onExpand when expand button is clicked', () => {
      const mockOnExpand = vi.fn()
      
      render(<FileStoryCompact {...defaultProps} onExpand={mockOnExpand} />, { wrapper: createWrapper() })

      const expandButton = screen.getByRole('button', { name: /view full story/i })
      fireEvent.click(expandButton)

      expect(mockOnExpand).toHaveBeenCalled()
    })

    it('should call onExpand when maximize icon is clicked', () => {
      const mockOnExpand = vi.fn()
      
      render(<FileStoryCompact {...defaultProps} onExpand={mockOnExpand} />, { wrapper: createWrapper() })

      const maximizeButton = screen.getByTestId('maximize-icon').closest('button')
      fireEvent.click(maximizeButton!)

      expect(mockOnExpand).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message', () => {
      const error = new Error('Failed to fetch story')
      
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Failed to fetch story')).toBeInTheDocument()
    })

    it('should display generation error', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('Generation failed'))
      
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      const generateButton = screen.getByRole('button', { name: /generate/i })
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
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      const { container } = render(
        <FileStoryCompact {...defaultProps} className="custom-class" />, 
        { wrapper: createWrapper() }
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should respect maxHeight prop for scrollable content', () => {
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: mockStory,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} maxHeight={200} />, { wrapper: createWrapper() })

      // Expand key changes to test scrollable area
      const keyChangesButton = screen.getByRole('button', { name: /key changes/i })
      fireEvent.click(keyChangesButton)

      const scrollableArea = screen.getByText(mockStory.sections.keyChanges[0]).closest('.max-h-32')
      expect(scrollableArea).toHaveStyle({ maxHeight: '0px' }) // 200 - 200 = 0
    })

    it('should handle different file paths correctly', () => {
      const props = {
        ...defaultProps,
        filePath: 'src/utils/helpers/stringUtils.ts'
      }

      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryCompact {...props} />, { wrapper: createWrapper() })

      expect(screen.getByText('stringUtils.ts')).toBeInTheDocument()
    })
  })

  describe('Conditional Rendering', () => {
    it('should not render sections that are empty', () => {
      const storyWithEmptySections = {
        ...mockStory,
        sections: {
          creation: '',
          evolution: '',
          keyChanges: [],
          currentState: 'Some current state',
          recommendations: []
        }
      }

      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: storyWithEmptySections,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.queryByText('Creation')).not.toBeInTheDocument()
      expect(screen.getByText('Current State')).toBeInTheDocument()
      expect(screen.queryByText('Key Changes')).not.toBeInTheDocument()
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument()
    })

    it('should not show expand button when onExpand is not provided', () => {
      vi.mocked(storyHooks.useFileStory).mockReturnValue({
        data: mockStory,
        isLoading: false,
        error: null
      } as any)

      vi.mocked(storyHooks.useGenerateFileStory).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false
      } as any)

      render(<FileStoryCompact {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.queryByRole('button', { name: /view full story/i })).not.toBeInTheDocument()
      expect(screen.queryByTestId('maximize-icon')).not.toBeInTheDocument()
    })
  })
})