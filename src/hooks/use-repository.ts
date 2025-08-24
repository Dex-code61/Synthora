'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse, PaginatedResponse } from '@/types/api'

// Types pour les repositories
export interface Repository {
  id: number
  name: string
  url: string
  description?: string
  isPrivate: boolean
  defaultBranch: string
  language?: string
  stars: number
  forks: number
  size: number
  createdAt: Date
  updatedAt: Date
  lastAnalyzedAt?: Date
  analysisStatus?: 'pending' | 'running' | 'completed' | 'failed'
}

export interface CreateRepositoryData {
  name: string
  url: string
  description?: string
  isPrivate?: boolean
}

export interface UpdateRepositoryData {
  name?: string
  description?: string
  isPrivate?: boolean
}

// Hook pour récupérer tous les repositories
export function useRepositories(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['repositories', page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/repositories?page=${page}&limit=${limit}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.statusText}`)
      }

      const data: PaginatedResponse<Repository> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repositories')
      }

      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })
}

// Hook pour récupérer un repository spécifique
export function useRepository(repositoryId: string) {
  return useQuery({
    queryKey: ['repository', repositoryId],
    queryFn: async () => {
      const response = await fetch(`/api/repositories/${repositoryId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch repository: ${response.statusText}`)
      }

      const data: ApiResponse<Repository> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repository')
      }

      return data.data!
    },
    enabled: !!repositoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })
}

// Hook pour créer un repository
export function useCreateRepository() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRepositoryData) => {
      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to create repository: ${response.statusText}`)
      }

      const result: ApiResponse<Repository> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create repository')
      }

      return result.data!
    },
    onSuccess: () => {
      // Invalider la liste des repositories
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

// Hook pour mettre à jour un repository
export function useUpdateRepository() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRepositoryData }) => {
      const response = await fetch(`/api/repositories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to update repository: ${response.statusText}`)
      }

      const result: ApiResponse<Repository> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update repository')
      }

      return result.data!
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['repository', data.id.toString()], data)
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

// Hook pour supprimer un repository
export function useDeleteRepository() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await fetch(`/api/repositories/${repositoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete repository: ${response.statusText}`)
      }

      const result: ApiResponse<void> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete repository')
      }

      return repositoryId
    },
    onSuccess: (repositoryId) => {
      // Supprimer du cache
      queryClient.removeQueries({ queryKey: ['repository', repositoryId] })
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

// Hook pour synchroniser un repository
export function useSyncRepository() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await fetch(`/api/repositories/${repositoryId}/sync`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to sync repository: ${response.statusText}`)
      }

      const result: ApiResponse<Repository> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync repository')
      }

      return result.data!
    },
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['repository', data.id.toString()], data)
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

// Hook pour récupérer les statistiques d'un repository
export function useRepositoryStats(repositoryId: string) {
  return useQuery({
    queryKey: ['repository-stats', repositoryId],
    queryFn: async () => {
      const response = await fetch(`/api/repositories/${repositoryId}/stats`)

      if (!response.ok) {
        throw new Error(`Failed to fetch repository stats: ${response.statusText}`)
      }

      const data: ApiResponse<{
        totalCommits: number
        totalContributors: number
        totalFiles: number
        linesOfCode: number
        languages: Record<string, number>
        lastActivity: Date
      }> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repository stats')
      }

      return data.data!
    },
    enabled: !!repositoryId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  })
}

// Hook combiné pour un repository avec toutes ses données
export function useRepositoryWithData(repositoryId: string) {
  const repository = useRepository(repositoryId)
  const stats = useRepositoryStats(repositoryId)

  const isLoading = repository.isLoading || stats.isLoading
  const isError = repository.isError || stats.isError
  const error = repository.error || stats.error

  return {
    // Données
    repository: repository.data,
    stats: stats.data,

    // États
    isLoading,
    isError,
    error,

    // États individuels
    repositoryLoading: repository.isLoading,
    statsLoading: stats.isLoading,

    // Fonctions de refetch
    refetchRepository: repository.refetch,
    refetchStats: stats.refetch,
  }
}