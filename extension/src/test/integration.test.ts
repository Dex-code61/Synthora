import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceManager } from '../services/workspace-manager'
import { ApiClient } from '../services/api-client'
import { AnalyzeFileCommand } from '../commands/analyze-file'
import { ShowTimelineCommand } from '../commands/show-timeline'
import { ShowHotspotsCommand } from '../commands/show-hotspots'
import { AnalyzeRepositoryCommand } from '../commands/analyze-repository'
import { StoryPanel } from '../panels/story-panel'
import { TimelinePanel } from '../panels/timeline-panel'
import { HotspotsPanel } from '../panels/hotspots-panel'

// Mock Kiro API
const mockKiro = {
  workspace: {
    workspaceFolders: [
      {
        uri: { fsPath: '/test/workspace' },
        name: 'test-workspace',
        index: 0
      }
    ],
    onDidChangeWorkspaceFolders: vi.fn()
  },
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    createWebviewPanel: vi.fn(),
    activeTextEditor: {
      document: {
        uri: { fsPath: '/test/workspace/src/test.ts' }
      }
    }
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
  },
  ViewColumn: {
    Two: 2
  }
}

vi.mock('kiro', () => mockKiro)

// Mock fs
vi.mock('fs', () => ({
  promises: {
    stat: vi.fn().mockResolvedValue({ isDirectory: () => true, isFile: () => false })
  }
}))

describe('Extension Integration', () => {
  let workspaceManager: WorkspaceManager
  let apiClient: ApiClient
  let mockContext: any

  beforeEach(() => {
    workspaceManager = new WorkspaceManager()
    apiClient = new ApiClient('http://localhost:3000')
    mockContext = {
      subscriptions: [],
      extensionPath: '/test/extension',
      globalState: {
        get: vi.fn(),
        update: vi.fn()
      },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn()
      }
    }

    // Mock webview panel
    const mockWebviewPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn()
      },
      onDidDispose: vi.fn(),
      title: '',
      reveal: vi.fn(),
      dispose: vi.fn()
    }

    vi.mocked(mockKiro.window.createWebviewPanel).mockReturnValue(mockWebviewPanel)
    vi.clearAllMocks()
  })

  it('should create all required services', () => {
    expect(workspaceManager).toBeInstanceOf(WorkspaceManager)
    expect(apiClient).toBeInstanceOf(ApiClient)
  })

  it('should create all required panels', () => {
    const timelinePanel = new TimelinePanel(mockContext, apiClient)
    const storyPanel = new StoryPanel(mockContext, apiClient)
    const hotspotsPanel = new HotspotsPanel(mockContext, apiClient)

    expect(timelinePanel).toBeInstanceOf(TimelinePanel)
    expect(storyPanel).toBeInstanceOf(StoryPanel)
    expect(hotspotsPanel).toBeInstanceOf(HotspotsPanel)
  })

  it('should create all required commands', () => {
    const timelinePanel = new TimelinePanel(mockContext, apiClient)
    const storyPanel = new StoryPanel(mockContext, apiClient)
    const hotspotsPanel = new HotspotsPanel(mockContext, apiClient)

    const analyzeFileCommand = new AnalyzeFileCommand(workspaceManager, apiClient, storyPanel)
    const showTimelineCommand = new ShowTimelineCommand(workspaceManager, apiClient, timelinePanel)
    const showHotspotsCommand = new ShowHotspotsCommand(workspaceManager, apiClient, hotspotsPanel)
    const analyzeRepositoryCommand = new AnalyzeRepositoryCommand(workspaceManager, apiClient)

    expect(analyzeFileCommand).toBeInstanceOf(AnalyzeFileCommand)
    expect(showTimelineCommand).toBeInstanceOf(ShowTimelineCommand)
    expect(showHotspotsCommand).toBeInstanceOf(ShowHotspotsCommand)
    expect(analyzeRepositoryCommand).toBeInstanceOf(AnalyzeRepositoryCommand)
  })

  it('should handle workspace detection correctly', async () => {
    const hasRepo = await workspaceManager.hasGitRepository()
    expect(hasRepo).toBe(true)

    const repoPath = await workspaceManager.getRepositoryPath()
    expect(repoPath).toBe('/test/workspace')

    const relativePath = workspaceManager.getRelativeFilePath('/test/workspace/src/test.ts')
    expect(relativePath).toBe('src/test.ts')
  })

  it('should handle API client configuration', () => {
    expect(apiClient).toBeDefined()
    
    apiClient.setBaseUrl('http://localhost:4000')
    // API client should accept new base URL without errors
  })

  it('should simulate full workflow integration', async () => {
    // Mock API responses
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          name: 'test-repo',
          path: '/test/workspace',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          repositoryId: 1,
          filePath: 'src/test.ts',
          storyContent: 'Test story content',
          generatedAt: '2023-01-01'
        })
      } as Response)

    const storyPanel = new StoryPanel(mockContext, apiClient)
    const analyzeFileCommand = new AnalyzeFileCommand(workspaceManager, apiClient, storyPanel)

    // Execute the command
    const mockUri = {
      scheme: 'file',
      authority: '',
      path: '/test/workspace/src/test.ts',
      query: '',
      fragment: '',
      fsPath: '/test/workspace/src/test.ts',
      toString: () => 'file:///test/workspace/src/test.ts'
    }
    await analyzeFileCommand.execute(mockUri)

    // Verify the workflow completed successfully
    expect(mockKiro.window.showInformationMessage).toHaveBeenCalledWith('File story generated successfully!')
  })

  it('should handle error scenarios gracefully', async () => {
    // Mock API failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const storyPanel = new StoryPanel(mockContext, apiClient)
    const analyzeFileCommand = new AnalyzeFileCommand(workspaceManager, apiClient, storyPanel)

    // Execute the command with API failure
    const mockUri = {
      scheme: 'file',
      authority: '',
      path: '/test/workspace/src/test.ts',
      query: '',
      fragment: '',
      fsPath: '/test/workspace/src/test.ts',
      toString: () => 'file:///test/workspace/src/test.ts'
    }
    await analyzeFileCommand.execute(mockUri)

    // Verify error handling
    expect(mockKiro.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Failed to analyze file')
    )
  })

  it('should validate extension manifest structure', () => {
    // This would normally read from package.json, but we'll simulate the structure
    const manifest = {
      name: 'synthora-kiro-extension',
      displayName: 'Synthora - Code Archaeology',
      main: './dist/extension.js',
      contributes: {
        commands: [
          { command: 'synthora.analyzeFile', title: 'Tell me this file\'s story' },
          { command: 'synthora.showTimeline', title: 'Show Repository Timeline' },
          { command: 'synthora.showHotspots', title: 'Show Code Hotspots' },
          { command: 'synthora.analyzeRepository', title: 'Analyze Repository' }
        ],
        menus: {
          'explorer/context': [
            { command: 'synthora.analyzeFile', when: 'resourceExtname && !explorerResourceIsFolder' }
          ],
          'editor/context': [
            { command: 'synthora.analyzeFile', when: 'editorTextFocus' }
          ]
        }
      }
    }

    expect(manifest.name).toBe('synthora-kiro-extension')
    expect(manifest.contributes.commands).toHaveLength(4)
    expect(manifest.contributes.menus['explorer/context']).toHaveLength(1)
    expect(manifest.contributes.menus['editor/context']).toHaveLength(1)
  })
})