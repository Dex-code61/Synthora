export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AnalysisStatus {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  message?: string
  startedAt: Date
  completedAt?: Date
  error?: string
}