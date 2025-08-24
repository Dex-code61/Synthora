export interface Repository {
  id: number
  name: string
  path: string
  lastAnalyzed?: string
  createdAt: string
  updatedAt: string
}

export interface FileStory {
  id: number
  repositoryId: number
  filePath: string
  storyContent: string
  generatedAt: string
}

export interface FileMetrics {
  filePath: string
  commitCount: number
  authorCount: number
  riskScore: number
  totalChanges: number
  bugCommits: number
  lastModified: string
  authors: string[]
}

export interface Commit {
  sha: string
  author: string
  email: string
  message: string
  timestamp: string
  filesChanged: number
  insertions: number
  deletions: number
}

export interface AnalysisJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  message?: string
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  /**
   * Set the base URL for the API
   */
  setBaseUrl(url: string) {
    this.baseUrl = url
  }

  /**
   * Make a GET request to the API
   */
  private async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Make a POST request to the API
   */
  private async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get or create a repository
   */
  async getOrCreateRepository(name: string, path: string): Promise<Repository> {
    try {
      // Try to get existing repository
      const repositories = await this.get<Repository[]>('/api/repositories')
      const existing = repositories.find(repo => repo.path === path)
      
      if (existing) {
        return existing
      }

      // Create new repository
      return await this.post<Repository>('/api/repositories', { name, path })
    } catch (error) {
      console.error('Failed to get or create repository:', error)
      throw error
    }
  }

  /**
   * Start repository analysis
   */
  async analyzeRepository(repositoryId: number): Promise<AnalysisJob> {
    try {
      return await this.post<AnalysisJob>(`/api/repositories/${repositoryId}/analyze`)
    } catch (error) {
      console.error('Failed to start repository analysis:', error)
      throw error
    }
  }

  /**
   * Get analysis job status
   */
  async getAnalysisStatus(jobId: string): Promise<AnalysisJob> {
    try {
      return await this.get<AnalysisJob>(`/api/analysis/status/${jobId}`)
    } catch (error) {
      console.error('Failed to get analysis status:', error)
      throw error
    }
  }

  /**
   * Get file story
   */
  async getFileStory(repositoryId: number, filePath: string): Promise<FileStory> {
    try {
      const encodedPath = encodeURIComponent(filePath)
      return await this.get<FileStory>(`/api/repositories/${repositoryId}/files/${encodedPath}/story`)
    } catch (error) {
      console.error('Failed to get file story:', error)
      throw error
    }
  }

  /**
   * Get file metrics
   */
  async getFileMetrics(repositoryId: number, filePath: string): Promise<FileMetrics> {
    try {
      const encodedPath = encodeURIComponent(filePath)
      return await this.get<FileMetrics>(`/api/repositories/${repositoryId}/files/${encodedPath}/metrics`)
    } catch (error) {
      console.error('Failed to get file metrics:', error)
      throw error
    }
  }

  /**
   * Get repository timeline
   */
  async getTimeline(repositoryId: number): Promise<Commit[]> {
    try {
      return await this.get<Commit[]>(`/api/repositories/${repositoryId}/timeline`)
    } catch (error) {
      console.error('Failed to get timeline:', error)
      throw error
    }
  }

  /**
   * Get repository hotspots
   */
  async getHotspots(repositoryId: number): Promise<FileMetrics[]> {
    try {
      return await this.get<FileMetrics[]>(`/api/repositories/${repositoryId}/hotspots`)
    } catch (error) {
      console.error('Failed to get hotspots:', error)
      throw error
    }
  }

  /**
   * Check if API is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.get('/api/health')
      return true
    } catch {
      return false
    }
  }
}