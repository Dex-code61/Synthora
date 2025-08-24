import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceManager } from '../services/workspace-manager'
import { ApiClient } from '../services/api-client'

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
    activeTextEditor: {
      document: {
        uri: { fsPath: '/test/workspace/src/test.ts' }
      }
    }
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
  }
}

vi.mock('kiro', () => mockKiro)

// Mock fs
vi.mock('fs', () => ({
  promises: {
    stat: vi.fn().mockResolvedValue({ isDirectory: () => true, isFile: () => false })
  }
}))

describe('WorkspaceManager', () => {
  let workspaceManager: WorkspaceManager

  beforeEach(() => {
    workspaceManager = new WorkspaceManager()
    vi.clearAllMocks()
  })

  describe('hasGitRepository', () => {
    it('should return true when .git directory exists', async () => {
      const result = await workspaceManager.hasGitRepository()
      expect(result).toBe(true)
    })

    it('should return false when no workspace folders exist', async () => {
      mockKiro.workspace.workspaceFolders = undefined as any
      const result = await workspaceManager.hasGitRepository()
      expect(result).toBe(false)
    })
  })

  describe('getRepositoryPath', () => {
    it('should return workspace path when .git exists', async () => {
      const result = await workspaceManager.getRepositoryPath()
      expect(result).toBe('/test/workspace')
    })
  })

  describe('getRelativeFilePath', () => {
    it('should return relative path for file in workspace', () => {
      const result = workspaceManager.getRelativeFilePath('/test/workspace/src/test.ts')
      expect(result).toBe('src/test.ts')
    })

    it('should return null for file outside workspace', () => {
      const result = workspaceManager.getRelativeFilePath('/other/path/test.ts')
      expect(result).toBe(null)
    })
  })

  describe('getCurrentFilePath', () => {
    it('should return active editor file path', () => {
      const result = workspaceManager.getCurrentFilePath()
      expect(result).toBe('/test/workspace/src/test.ts')
    })

    it('should return null when no active editor', () => {
      mockKiro.window.activeTextEditor = undefined as any
      const result = workspaceManager.getCurrentFilePath()
      expect(result).toBe(null)
    })
  })

  describe('isFileInWorkspace', () => {
    it('should return true for file in workspace', () => {
      const result = workspaceManager.isFileInWorkspace('/test/workspace/src/test.ts')
      expect(result).toBe(true)
    })

    it('should return false for file outside workspace', () => {
      const result = workspaceManager.isFileInWorkspace('/other/path/test.ts')
      expect(result).toBe(false)
    })
  })

  describe('getRepositoryName', () => {
    it('should return basename of repository path', () => {
      const result = workspaceManager.getRepositoryName('/path/to/my-repo')
      expect(result).toBe('my-repo')
    })
  })
})

describe('ApiClient', () => {
  let apiClient: ApiClient

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:3000')
    vi.clearAllMocks()
    
    // Mock fetch
    global.fetch = vi.fn()
  })

  describe('checkHealth', () => {
    it('should return true when API is healthy', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' })
      } as Response)

      const result = await apiClient.checkHealth()
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/health')
    })

    it('should return false when API is unhealthy', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await apiClient.checkHealth()
      expect(result).toBe(false)
    })
  })

  describe('getOrCreateRepository', () => {
    it('should return existing repository if found', async () => {
      const existingRepo = {
        id: 1,
        name: 'test-repo',
        path: '/test/path',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([existingRepo])
        } as Response)

      const result = await apiClient.getOrCreateRepository('test-repo', '/test/path')
      expect(result).toEqual(existingRepo)
    })

    it('should create new repository if not found', async () => {
      const newRepo = {
        id: 2,
        name: 'new-repo',
        path: '/new/path',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newRepo)
        } as Response)

      const result = await apiClient.getOrCreateRepository('new-repo', '/new/path')
      expect(result).toEqual(newRepo)
    })
  })

  describe('getFileStory', () => {
    it('should fetch file story successfully', async () => {
      const story = {
        id: 1,
        repositoryId: 1,
        filePath: 'src/test.ts',
        storyContent: 'This is a test file story',
        generatedAt: '2023-01-01'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(story)
      } as Response)

      const result = await apiClient.getFileStory(1, 'src/test.ts')
      expect(result).toEqual(story)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/repositories/1/files/src%2Ftest.ts/story'
      )
    })

    it('should throw error on API failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)

      await expect(apiClient.getFileStory(1, 'src/test.ts')).rejects.toThrow(
        'API request failed: 404 Not Found'
      )
    })
  })

  describe('analyzeRepository', () => {
    it('should start repository analysis', async () => {
      const job = {
        id: 'job-123',
        status: 'pending' as const
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(job)
      } as Response)

      const result = await apiClient.analyzeRepository(1)
      expect(result).toEqual(job)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/repositories/1/analyze',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})