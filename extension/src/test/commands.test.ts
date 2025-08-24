import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnalyzeFileCommand } from '../commands/analyze-file'
import { ShowTimelineCommand } from '../commands/show-timeline'
import { ShowHotspotsCommand } from '../commands/show-hotspots'
import { WorkspaceManager } from '../services/workspace-manager'
import { ApiClient } from '../services/api-client'
import { StoryPanel } from '../panels/story-panel'
import { TimelinePanel } from '../panels/timeline-panel'
import { HotspotsPanel } from '../panels/hotspots-panel'

// Helper function to create mock URI objects
function createMockUri(fsPath: string) {
  return {
    scheme: 'file',
    authority: '',
    path: fsPath,
    query: '',
    fragment: '',
    fsPath,
    toString: () => `file://${fsPath}`
  }
}

// Mock Kiro API
const mockKiro = {
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn()
  }
}

vi.mock('kiro', () => mockKiro)

describe('AnalyzeFileCommand', () => {
  let command: AnalyzeFileCommand
  let mockWorkspaceManager: WorkspaceManager
  let mockApiClient: ApiClient
  let mockStoryPanel: StoryPanel

  beforeEach(() => {
    mockWorkspaceManager = {
      getCurrentFilePath: vi.fn(),
      isFileInWorkspace: vi.fn(),
      getRepositoryPath: vi.fn(),
      getRelativeFilePath: vi.fn(),
      getRepositoryName: vi.fn()
    } as any

    mockApiClient = {
      checkHealth: vi.fn(),
      getOrCreateRepository: vi.fn(),
      getFileStory: vi.fn()
    } as any

    mockStoryPanel = {
      show: vi.fn()
    } as any

    command = new AnalyzeFileCommand(mockWorkspaceManager, mockApiClient, mockStoryPanel)
    vi.clearAllMocks()
  })

  it('should analyze file successfully', async () => {
    const mockUri = createMockUri('/test/workspace/src/test.ts')
    const mockRepository = { 
      id: 1, 
      name: 'test-repo', 
      path: '/test/workspace',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }
    const mockStory = {
      id: 1,
      repositoryId: 1,
      filePath: 'src/test.ts',
      storyContent: 'Test story',
      generatedAt: '2023-01-01'
    }

    vi.mocked(mockWorkspaceManager.isFileInWorkspace).mockReturnValue(true)
    vi.mocked(mockWorkspaceManager.getRepositoryPath).mockResolvedValue('/test/workspace')
    vi.mocked(mockWorkspaceManager.getRelativeFilePath).mockReturnValue('src/test.ts')
    vi.mocked(mockWorkspaceManager.getRepositoryName).mockReturnValue('test-repo')
    vi.mocked(mockApiClient.checkHealth).mockResolvedValue(true)
    vi.mocked(mockApiClient.getOrCreateRepository).mockResolvedValue(mockRepository)
    vi.mocked(mockApiClient.getFileStory).mockResolvedValue(mockStory)

    await command.execute(mockUri)

    expect(mockApiClient.getOrCreateRepository).toHaveBeenCalledWith('test-repo', '/test/workspace')
    expect(mockApiClient.getFileStory).toHaveBeenCalledWith(1, 'src/test.ts')
    expect(mockStoryPanel.show).toHaveBeenCalledWith(mockStory, 'src/test.ts')
    expect(mockKiro.window.showInformationMessage).toHaveBeenCalledWith('File story generated successfully!')
  })

  it('should show error when no file is selected', async () => {
    vi.mocked(mockWorkspaceManager.getCurrentFilePath).mockReturnValue(null)

    await command.execute()

    expect(mockKiro.window.showErrorMessage).toHaveBeenCalledWith('No file selected or active')
  })

  it('should show error when file is not in workspace', async () => {
    const mockUri = createMockUri('/outside/workspace/test.ts')
    vi.mocked(mockWorkspaceManager.isFileInWorkspace).mockReturnValue(false)

    await command.execute(mockUri)

    expect(mockKiro.window.showErrorMessage).toHaveBeenCalledWith('File is not in the current workspace')
  })

  it('should show error when no Git repository found', async () => {
    const mockUri = createMockUri('/test/workspace/src/test.ts')
    vi.mocked(mockWorkspaceManager.isFileInWorkspace).mockReturnValue(true)
    vi.mocked(mockWorkspaceManager.getRepositoryPath).mockResolvedValue(null)

    await command.execute(mockUri)

    expect(mockKiro.window.showErrorMessage).toHaveBeenCalledWith('No Git repository found in workspace')
  })

  it('should show error when API is not available', async () => {
    const mockUri = createMockUri('/test/workspace/src/test.ts')
    vi.mocked(mockWorkspaceManager.isFileInWorkspace).mockReturnValue(true)
    vi.mocked(mockWorkspaceManager.getRepositoryPath).mockResolvedValue('/test/workspace')
    vi.mocked(mockApiClient.checkHealth).mockResolvedValue(false)

    await command.execute(mockUri)

    expect(mockKiro.window.showErrorMessage).toHaveBeenCalledWith(
      'Synthora API is not available. Please ensure the Next.js application is running.'
    )
  })

  it('should handle API errors gracefully', async () => {
    const mockUri = createMockUri('/test/workspace/src/test.ts')
    const error = new Error('API Error')

    vi.mocked(mockWorkspaceManager.isFileInWorkspace).mockReturnValue(true)
    vi.mocked(mockWorkspaceManager.getRepositoryPath).mockResolvedValue('/test/workspace')
    vi.mocked(mockWorkspaceManager.getRelativeFilePath).mockReturnValue('src/test.ts')
    vi.mocked(mockWorkspaceManager.getRepositoryName).mockReturnValue('test-repo')
    vi.mocked(mockApiClient.checkHealth).mockResolvedValue(true)
    vi.mocked(mockApiClient.getOrCreateRepository).mockRejectedValue(error)

    await command.execute(mockUri)

    expect(mockKiro.window.showErrorMessage).toHaveBeenCalledWith('Failed to analyze file: API Error')
  })
})

describe('ShowTimelineCommand', () => {
  let command: ShowTimelineCommand
  let mockWorkspaceManager: WorkspaceManager
  let mockApiClient: ApiClient
  let mockTimelinePanel: TimelinePanel

  beforeEach(() => {
    mockWorkspaceManager = {
      getRepositoryPath: vi.fn(),
      getRepositoryName: vi.fn()
    } as any

    mockApiClient = {
      checkHealth: vi.fn(),
      getOrCreateRepository: vi.fn(),
      getTimeline: vi.fn()
    } as any

    mockTimelinePanel = {
      show: vi.fn()
    } as any

    command = new ShowTimelineCommand(mockWorkspaceManager, mockApiClient, mockTimelinePanel)
    vi.clearAllMocks()
  })

  it('should show timeline successfully', async () => {
    const mockRepository = { 
      id: 1, 
      name: 'test-repo', 
      path: '/test/workspace',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }
    const mockTimeline = [
      {
        sha: 'abc123',
        author: 'Test Author',
        email: 'test@example.com',
        message: 'Test commit',
        timestamp: '2023-01-01',
        filesChanged: 1,
        insertions: 10,
        deletions: 5
      }
    ]

    vi.mocked(mockWorkspaceManager.getRepositoryPath).mockResolvedValue('/test/workspace')
    vi.mocked(mockWorkspaceManager.getRepositoryName).mockReturnValue('test-repo')
    vi.mocked(mockApiClient.checkHealth).mockResolvedValue(true)
    vi.mocked(mockApiClient.getOrCreateRepository).mockResolvedValue(mockRepository)
    vi.mocked(mockApiClient.getTimeline).mockResolvedValue(mockTimeline)

    await command.execute()

    expect(mockApiClient.getTimeline).toHaveBeenCalledWith(1)
    expect(mockTimelinePanel.show).toHaveBeenCalledWith(mockTimeline, mockRepository)
    expect(mockKiro.window.showInformationMessage).toHaveBeenCalledWith('Timeline loaded successfully!')
  })

  it('should show error when no Git repository found', async () => {
    vi.mocked(mockWorkspaceManager.getRepositoryPath).mockResolvedValue(null)

    await command.execute()

    expect(mockKiro.window.showErrorMessage).toHaveBeenCalledWith('No Git repository found in workspace')
  })
})

describe('ShowHotspotsCommand', () => {
  let command: ShowHotspotsCommand
  let mockWorkspaceManager: WorkspaceManager
  let mockApiClient: ApiClient
  let mockHotspotsPanel: HotspotsPanel

  beforeEach(() => {
    mockWorkspaceManager = {
      getRepositoryPath: vi.fn(),
      getRepositoryName: vi.fn()
    } as any

    mockApiClient = {
      checkHealth: vi.fn(),
      getOrCreateRepository: vi.fn(),
      getHotspots: vi.fn()
    } as any

    mockHotspotsPanel = {
      show: vi.fn()
    } as any

    command = new ShowHotspotsCommand(mockWorkspaceManager, mockApiClient, mockHotspotsPanel)
    vi.clearAllMocks()
  })

  it('should show hotspots successfully', async () => {
    const mockRepository = { 
      id: 1, 
      name: 'test-repo', 
      path: '/test/workspace',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }
    const mockHotspots = [
      {
        filePath: 'src/test.ts',
        commitCount: 50,
        authorCount: 5,
        riskScore: 0.8,
        totalChanges: 100,
        bugCommits: 10,
        lastModified: '2023-01-01',
        authors: ['Author 1', 'Author 2']
      }
    ]

    vi.mocked(mockWorkspaceManager.getRepositoryPath).mockResolvedValue('/test/workspace')
    vi.mocked(mockWorkspaceManager.getRepositoryName).mockReturnValue('test-repo')
    vi.mocked(mockApiClient.checkHealth).mockResolvedValue(true)
    vi.mocked(mockApiClient.getOrCreateRepository).mockResolvedValue(mockRepository)
    vi.mocked(mockApiClient.getHotspots).mockResolvedValue(mockHotspots)

    await command.execute()

    expect(mockApiClient.getHotspots).toHaveBeenCalledWith(1)
    expect(mockHotspotsPanel.show).toHaveBeenCalledWith(mockHotspots, mockRepository)
    expect(mockKiro.window.showInformationMessage).toHaveBeenCalledWith('Code hotspots loaded successfully!')
  })
})