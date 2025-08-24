'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiResponse } from '@/types/api'

// Types pour les stories
export interface FileStory {
  filePath: string
  story: string
  summary: string
  keyChanges: string[]
  riskFactors: string[]
  recommendations: string[]
  lastUpdated: Date
  confidence: number
}

export interface StoryGenerationOptions {
  includeRiskAnalysis?: boolean
  includeRecommendations?: boolean
  maxLength?: number
  language?: 'en' | 'fr'
}

// Hook pour récupérer toutes les stories d'un repository
export function useRepositoryStories(repositoryId: string) {
  return useQuery({
    queryKey: ['repository-stories', repositoryId],
    queryFn: async () => {
      const response = await fetch(`/api/repositories/${repositoryId}/stories`)

      if (!response.ok) {
        throw new Error(`Failed to fetch repository stories: ${response.statusText}`)
      }

      const data: ApiResponse<FileStory[]> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repository stories')
      }

      return data.data!
    },
    enabled: !!repositoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })
}

// Hook pour récupérer la story d'un fichier spécifique
export function useFileStory(repositoryId: string, filePath: string) {
  return useQuery({
    queryKey: ['file-story', repositoryId, filePath],
    queryFn: async () => {
      // Encoder le chemin du fichier pour l'URL
      const encodedPath = encodeURIComponent(filePath)
      const response = await fetch(`/api/repositories/${repositoryId}/files-story/${encodedPath}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch file story: ${response.statusText}`)
      }

      const data: ApiResponse<FileStory> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch file story')
      }

      return data.data!
    },
    enabled: !!repositoryId && !!filePath,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  })
}

// Hook pour générer une story pour un fichier
export function useGenerateFileStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      repositoryId,
      filePath,
      options = {},
    }: {
      repositoryId: string
      filePath: string
      options?: StoryGenerationOptions
    }) => {
      const encodedPath = encodeURIComponent(filePath)
      const response = await fetch(`/api/repositories/${repositoryId}/files-story/${encodedPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate file story: ${response.statusText}`)
      }

      const data: ApiResponse<FileStory> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate file story')
      }

      return data.data!
    },
    onSuccess: (data, variables) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['file-story', variables.repositoryId, variables.filePath], data)
      queryClient.invalidateQueries({ queryKey: ['repository-stories', variables.repositoryId] })
    },
  })
}

// Hook pour générer toutes les stories d'un repository
export function useGenerateRepositoryStories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      repositoryId,
      options = {},
    }: {
      repositoryId: string
      options?: StoryGenerationOptions
    }) => {
      const response = await fetch(`/api/repositories/${repositoryId}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate repository stories: ${response.statusText}`)
      }

      const data: ApiResponse<{
        jobId: string
        status: string
        totalFiles: number
      }> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate repository stories')
      }

      return data.data!
    },
    onSuccess: (data, variables) => {
      // Invalider les stories existantes
      queryClient.invalidateQueries({ queryKey: ['repository-stories', variables.repositoryId] })
    },
  })
}

// Hook pour supprimer une story
export function useDeleteFileStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      repositoryId,
      filePath,
    }: {
      repositoryId: string
      filePath: string
    }) => {
      const encodedPath = encodeURIComponent(filePath)
      const response = await fetch(`/api/repositories/${repositoryId}/files-story/${encodedPath}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete file story: ${response.statusText}`)
      }

      const data: ApiResponse<void> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete file story')
      }

      return { repositoryId, filePath }
    },
    onSuccess: (data) => {
      // Supprimer du cache
      queryClient.removeQueries({ queryKey: ['file-story', data.repositoryId, data.filePath] })
      queryClient.invalidateQueries({ queryKey: ['repository-stories', data.repositoryId] })
    },
  })
}

// Hook pour rechercher dans les stories
export function useSearchStories(repositoryId: string, query: string) {
  return useQuery({
    queryKey: ['search-stories', repositoryId, query],
    queryFn: async () => {
      const response = await fetch(
        `/api/repositories/${repositoryId}/stories/search?q=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error(`Failed to search stories: ${response.statusText}`)
      }

      const data: ApiResponse<FileStory[]> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to search stories')
      }

      return data.data!
    },
    enabled: !!repositoryId && !!query && query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  })
}

// Hook combiné pour les stories avec recherche et filtrage
export function useStoriesWithSearch(repositoryId: string, searchQuery?: string) {
  const allStories = useRepositoryStories(repositoryId)
  const searchResults = useSearchStories(repositoryId, searchQuery || '')

  // Utiliser les résultats de recherche si une requête est fournie, sinon toutes les stories
  const stories = searchQuery && searchQuery.length > 2 ? searchResults.data : allStories.data
  const isLoading = searchQuery && searchQuery.length > 2 ? searchResults.isLoading : allStories.isLoading
  const isError = searchQuery && searchQuery.length > 2 ? searchResults.isError : allStories.isError
  const error = searchQuery && searchQuery.length > 2 ? searchResults.error : allStories.error

  return {
    stories: stories || [],
    isLoading,
    isError,
    error,
    refetch: allStories.refetch,
    isSearching: !!searchQuery && searchQuery.length > 2,
  }
}

// Hook pour les statistiques des stories
export function useStoriesStats(repositoryId: string) {
  return useQuery({
    queryKey: ['stories-stats', repositoryId],
    queryFn: async () => {
      const response = await fetch(`/api/repositories/${repositoryId}/stories/stats`)

      if (!response.ok) {
        throw new Error(`Failed to fetch stories stats: ${response.statusText}`)
      }

      const data: ApiResponse<{
        totalStories: number
        averageConfidence: number
        highRiskFiles: number
        lastGenerated: Date
        languageDistribution: Record<string, number>
      }> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stories stats')
      }

      return data.data!
    },
    enabled: !!repositoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })
}