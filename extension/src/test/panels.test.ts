import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StoryPanel } from '../panels/story-panel'
import { TimelinePanel } from '../panels/timeline-panel'
import { HotspotsPanel } from '../panels/hotspots-panel'
import { ApiClient } from '../services/api-client'

// Mock Kiro API
const mockKiro = {
  window: {
    createWebviewPanel: vi.fn(),
    showInformationMessage: vi.fn()
  },
  ViewColumn: {
    Two: 2
  },
  workspace: {
    workspaceFolders: [
      {
        uri: { fsPath: '/test/workspace' }
      }
    ]
  },
  commands: {
    executeCommand: vi.fn()
  }
}

vi.mock('kiro', () => mockKiro)

describe('StoryPanel', () => {
  let panel: StoryPanel
  let mockApiClient: ApiClient
  let mockContext: any
  let mockWebviewPanel: any

  beforeEach(() => {
    mockApiClient = {
      getFileStory: vi.fn()
    } as any

    mockContext = {
      subscriptions: []
    }

    mockWebviewPanel = {
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

    panel = new StoryPanel(mockContext, mockApiClient)
    vi.clearAllMocks()
  })

  it('should create and show story panel', async () => {
    const mockStory = {
      id: 1,
      repositoryId: 1,
      filePath: 'src/test.ts',
      storyContent: 'This is a test file story with **bold** text and *italic* text.',
      generatedAt: '2023-01-01T10:00:00Z'
    }

    await panel.show(mockStory, 'src/test.ts')

    expect(mockKiro.window.createWebviewPanel).toHaveBeenCalledWith(
      'synthora.story',
      'File Story',
      2,
      expect.objectContaining({
        enableScripts: true,
        retainContextWhenHidden: true
      })
    )

    expect(mockWebviewPanel.title).toBe('Story: src/test.ts')
    expect(mockWebviewPanel.reveal).toHaveBeenCalledWith(2)
    expect(mockWebviewPanel.webview.html).toContain('src/test.ts')
    expect(mockWebviewPanel.webview.html).toContain('This is a test file story')
  })

  it('should handle refresh message', async () => {
    const mockStory = {
      id: 1,
      repositoryId: 1,
      filePath: 'src/test.ts',
      storyContent: 'Original story',
      generatedAt: '2023-01-01T10:00:00Z'
    }

    const updatedStory = {
      ...mockStory,
      storyContent: 'Updated story'
    }

    vi.mocked(mockApiClient.getFileStory).mockResolvedValue(updatedStory)

    await panel.show(mockStory, 'src/test.ts')

    // Simulate refresh message
    const messageHandler = vi.mocked(mockWebviewPanel.webview.onDidReceiveMessage).mock.calls[0][0]
    await messageHandler({ type: 'refresh' })

    expect(mockApiClient.getFileStory).toHaveBeenCalledWith(1, 'src/test.ts')
    expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith({ type: 'loading', data: true })
    expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith({ type: 'loading', data: false })
  })

  it('should handle open file message', async () => {
    const mockStory = {
      id: 1,
      repositoryId: 1,
      filePath: 'src/test.ts',
      storyContent: 'Test story',
      generatedAt: '2023-01-01T10:00:00Z'
    }

    await panel.show(mockStory, 'src/test.ts')

    // Simulate open file message
    const messageHandler = vi.mocked(mockWebviewPanel.webview.onDidReceiveMessage).mock.calls[0][0]
    await messageHandler({ type: 'openFile', data: { filePath: 'src/test.ts' } })

    expect(mockKiro.commands.executeCommand).toHaveBeenCalledWith(
      'kiro.open',
      expect.objectContaining({ fsPath: '/test/workspace/src/test.ts' })
    )
  })

  it('should format story content with markdown', async () => {
    const mockStory = {
      id: 1,
      repositoryId: 1,
      filePath: 'src/test.ts',
      storyContent: 'This has **bold** and *italic* and `code` formatting.\n\nNew paragraph.',
      generatedAt: '2023-01-01T10:00:00Z'
    }

    await panel.show(mockStory, 'src/test.ts')

    const html = mockWebviewPanel.webview.html
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('</p><p>')
  })
})

describe('TimelinePanel', () => {
  let panel: TimelinePanel
  let mockApiClient: ApiClient
  let mockContext: any
  let mockWebviewPanel: any

  beforeEach(() => {
    mockApiClient = {
      getTimeline: vi.fn()
    } as any

    mockContext = {
      subscriptions: []
    }

    mockWebviewPanel = {
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

    panel = new TimelinePanel(mockContext, mockApiClient)
    vi.clearAllMocks()
  })

  it('should create and show timeline panel', async () => {
    const mockRepository = { 
      id: 1, 
      name: 'test-repo', 
      path: '/test/workspace',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }
    const mockTimeline = [
      {
        sha: 'abc123def456',
        author: 'Test Author',
        email: 'test@example.com',
        message: 'Test commit message',
        timestamp: '2023-01-01T10:00:00Z',
        filesChanged: 3,
        insertions: 15,
        deletions: 8
      }
    ]

    await panel.show(mockTimeline, mockRepository)

    expect(mockKiro.window.createWebviewPanel).toHaveBeenCalledWith(
      'synthora.timeline',
      'Repository Timeline',
      2,
      expect.objectContaining({
        enableScripts: true,
        retainContextWhenHidden: true
      })
    )

    expect(mockWebviewPanel.title).toBe('Timeline: test-repo')
    expect(mockWebviewPanel.reveal).toHaveBeenCalledWith(2)
    expect(mockWebviewPanel.webview.html).toContain('test-repo')
    expect(mockWebviewPanel.webview.html).toContain('abc123de') // Short SHA
    expect(mockWebviewPanel.webview.html).toContain('Test commit message')
    expect(mockWebviewPanel.webview.html).toContain('Test Author')
  })

  it('should handle refresh message', async () => {
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
        timestamp: '2023-01-01T10:00:00Z',
        filesChanged: 1,
        insertions: 10,
        deletions: 5
      }
    ]

    const updatedTimeline = [
      ...mockTimeline,
      {
        sha: 'def456',
        author: 'Another Author',
        email: 'another@example.com',
        message: 'Another commit',
        timestamp: '2023-01-02T10:00:00Z',
        filesChanged: 2,
        insertions: 20,
        deletions: 10
      }
    ]

    vi.mocked(mockApiClient.getTimeline).mockResolvedValue(updatedTimeline)

    await panel.show(mockTimeline, mockRepository)

    // Simulate refresh message
    const messageHandler = vi.mocked(mockWebviewPanel.webview.onDidReceiveMessage).mock.calls[0][0]
    await messageHandler({ type: 'refresh' })

    expect(mockApiClient.getTimeline).toHaveBeenCalledWith(1)
    expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith({ type: 'loading', data: true })
    expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith({ type: 'loading', data: false })
  })

  it('should limit timeline display to 50 commits', async () => {
    const mockRepository = { 
      id: 1, 
      name: 'test-repo', 
      path: '/test/workspace',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }
    const mockTimeline = Array.from({ length: 100 }, (_, i) => ({
      sha: `commit${i}`,
      author: 'Test Author',
      email: 'test@example.com',
      message: `Commit ${i}`,
      timestamp: '2023-01-01T10:00:00Z',
      filesChanged: 1,
      insertions: 10,
      deletions: 5
    }))

    await panel.show(mockTimeline, mockRepository)

    const html = mockWebviewPanel.webview.html
    expect(html).toContain('Showing 50 of 100 commits')
    expect(html).toContain('commit0') // First commit should be shown
    expect(html).not.toContain('commit50') // 51st commit should not be shown
  })
})

describe('HotspotsPanel', () => {
  let panel: HotspotsPanel
  let mockApiClient: ApiClient
  let mockContext: any
  let mockWebviewPanel: any

  beforeEach(() => {
    mockApiClient = {
      getHotspots: vi.fn()
    } as any

    mockContext = {
      subscriptions: []
    }

    mockWebviewPanel = {
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

    panel = new HotspotsPanel(mockContext, mockApiClient)
    vi.clearAllMocks()
  })

  it('should create and show hotspots panel', async () => {
    const mockRepository = { 
      id: 1, 
      name: 'test-repo', 
      path: '/test/workspace',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }
    const mockHotspots = [
      {
        filePath: 'src/high-risk.ts',
        commitCount: 100,
        authorCount: 8,
        riskScore: 0.9,
        totalChanges: 200,
        bugCommits: 25,
        lastModified: '2023-01-01T10:00:00Z',
        authors: ['Author 1', 'Author 2', 'Author 3']
      },
      {
        filePath: 'src/low-risk.ts',
        commitCount: 5,
        authorCount: 2,
        riskScore: 0.2,
        totalChanges: 10,
        bugCommits: 1,
        lastModified: '2023-01-01T10:00:00Z',
        authors: ['Author 1']
      }
    ]

    await panel.show(mockHotspots, mockRepository)

    expect(mockKiro.window.createWebviewPanel).toHaveBeenCalledWith(
      'synthora.hotspots',
      'Code Hotspots',
      2,
      expect.objectContaining({
        enableScripts: true,
        retainContextWhenHidden: true
      })
    )

    expect(mockWebviewPanel.title).toBe('Hotspots: test-repo')
    expect(mockWebviewPanel.reveal).toHaveBeenCalledWith(2)
    
    const html = mockWebviewPanel.webview.html
    expect(html).toContain('test-repo')
    expect(html).toContain('src/high-risk.ts')
    expect(html).toContain('HIGH RISK') // High risk score should show as HIGH RISK
    expect(html).toContain('src/low-risk.ts')
    expect(html).toContain('LOW RISK') // Low risk score should show as LOW RISK
  })

  it('should sort hotspots by risk score', async () => {
    const mockRepository = { 
      id: 1, 
      name: 'test-repo', 
      path: '/test/workspace',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    }
    const mockHotspots = [
      {
        filePath: 'src/medium-risk.ts',
        commitCount: 50,
        authorCount: 5,
        riskScore: 0.6,
        totalChanges: 100,
        bugCommits: 10,
        lastModified: '2023-01-01T10:00:00Z',
        authors: ['Author 1']
      },
      {
        filePath: 'src/high-risk.ts',
        commitCount: 100,
        authorCount: 8,
        riskScore: 0.9,
        totalChanges: 200,
        bugCommits: 25,
        lastModified: '2023-01-01T10:00:00Z',
        authors: ['Author 1']
      },
      {
        filePath: 'src/low-risk.ts',
        commitCount: 5,
        authorCount: 2,
        riskScore: 0.2,
        totalChanges: 10,
        bugCommits: 1,
        lastModified: '2023-01-01T10:00:00Z',
        authors: ['Author 1']
      }
    ]

    await panel.show(mockHotspots, mockRepository)

    const html = mockWebviewPanel.webview.html
    const highRiskIndex = html.indexOf('src/high-risk.ts')
    const mediumRiskIndex = html.indexOf('src/medium-risk.ts')
    const lowRiskIndex = html.indexOf('src/low-risk.ts')

    // High risk should appear first, then medium, then low
    expect(highRiskIndex).toBeLessThan(mediumRiskIndex)
    expect(mediumRiskIndex).toBeLessThan(lowRiskIndex)
  })

  it('should handle analyze file message', async () => {
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
        commitCount: 10,
        authorCount: 2,
        riskScore: 0.5,
        totalChanges: 20,
        bugCommits: 2,
        lastModified: '2023-01-01T10:00:00Z',
        authors: ['Author 1']
      }
    ]

    await panel.show(mockHotspots, mockRepository)

    // Simulate analyze file message
    const messageHandler = vi.mocked(mockWebviewPanel.webview.onDidReceiveMessage).mock.calls[0][0]
    await messageHandler({ type: 'analyzeFile', data: { filePath: 'src/test.ts' } })

    expect(mockKiro.commands.executeCommand).toHaveBeenCalledWith(
      'synthora.analyzeFile',
      { fsPath: 'src/test.ts' }
    )
  })
})