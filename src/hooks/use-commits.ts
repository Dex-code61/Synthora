'use client'

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Commit, GitOptions } from '@/types/git'
import { ApiResponse } from '@/types/api'

// Types pour les paramètres de requête
interface CommitsQueryParams extends GitOptions {
  repositoryId: string
  page?: number
  limit?: number
}

interface CommitsResponse {
  commits: Commit[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Fonction pour récupérer les commits
async function fetchCommits(params: CommitsQueryParams): Promise<CommitsResponse> {
  const { repositoryId, page = 1, limit = 50, ...gitOptions } = params
  
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.fromEntries(
      Object.entries(gitOptions).filter(([_, value]) => value !== undefined)
    )
  })

  const response = await fetch(`/api/repositories/${repositoryId}/commits?${searchParams}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.statusText}`)
  }

  const data: ApiResponse<CommitsResponse> = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch commits')
  }

  return data.data!
}

// Hook pour récupérer les commits avec pagination
export function useCommits(params: CommitsQueryParams) {
  return useQuery({
    queryKey: ['commits', params],
    queryFn: () => fetchCommits(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!params.repositoryId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Hook pour récupérer les commits avec pagination infinie
export function useInfiniteCommits(params: Omit<CommitsQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['commits', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => fetchCommits({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!params.repositoryId,
    retry: 2,
  })
}

// Hook pour récupérer les statistiques des commits
export function useCommitStats(repositoryId: string, options?: GitOptions) {
  return useQuery({
    queryKey: ['commit-stats', repositoryId, options],
    queryFn: async () => {
      const searchParams = new URLSearchParams(
        Object.fromEntries(
          Object.entries(options || {}).filter(([_, value]) => value !== undefined)
        )
      )

      const response = await fetch(`/api/repositories/${repositoryId}/commits/stats?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commit stats: ${response.statusText}`)
      }

      const data: ApiResponse<{
        totalCommits: number
        totalInsertions: number
        totalDeletions: number
        uniqueAuthors: number
        totalFiles: number
        dateRange: {
          earliest: string
          latest: string
        }
      }> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch commit stats')
      }

      return data.data!
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!repositoryId,
    retry: 2,
  })
}

// Hook pour récupérer les auteurs disponibles
export function useCommitAuthors(repositoryId: string) {
  return useQuery({
    queryKey: ['commit-authors', repositoryId],
    queryFn: async () => {
      const response = await fetch(`/api/repositories/${repositoryId}/commits/authors`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch authors: ${response.statusText}`)
      }

      const data: ApiResponse<string[]> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch authors')
      }

      return data.data!
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!repositoryId,
    retry: 2,
  })
}

// Hook pour récupérer les types de fichiers disponibles
export function useFileTypes(repositoryId: string) {
  return useQuery({
    queryKey: ['file-types', repositoryId],
    queryFn: async () => {
      const response = await fetch(`/api/repositories/${repositoryId}/commits/file-types`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file types: ${response.statusText}`)
      }

      const data: ApiResponse<string[]> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch file types')
      }

      return data.data!
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!repositoryId,
    retry: 2,
  })
}

// Hook pour récupérer un commit spécifique
export function useCommit(repositoryId: string, commitSha: string) {
  return useQuery({
    queryKey: ['commit', repositoryId, commitSha],
    queryFn: async () => {
      const response = await fetch(`/api/repositories/${repositoryId}/commits/${commitSha}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commit: ${response.statusText}`)
      }

      const data: ApiResponse<Commit> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch commit')
      }

      return data.data!
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    enabled: !!repositoryId && !!commitSha,
    retry: 2,
  })
}