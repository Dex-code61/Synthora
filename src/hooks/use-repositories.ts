"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface Repository {
  id: number
  name: string
  path: string
  lastAnalyzed: string | null
  createdAt: string
  _count: {
    commits: number
    fileMetrics: number
  }
}

interface CreateRepositoryData {
  name: string
  path: string
}

// Fonction pour récupérer les repositories
const fetchRepositories = async (): Promise<Repository[]> => {
  const response = await fetch('/api/repositories')
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch repositories')
  }
  
  return result.data
}

// Fonction pour créer un repository
const createRepository = async (data: CreateRepositoryData): Promise<Repository> => {
  const response = await fetch('/api/repositories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create repository')
  }
  
  return result.data
}

export function useRepositories(enabled: boolean = true) {
  const queryClient = useQueryClient()

  // Query pour récupérer les repositories
  const {
    data: repositories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['repositories'],
    queryFn: fetchRepositories,
    enabled, // Contrôle si la query doit être exécutée
    retry: 1,
  })

  // Mutation pour créer un repository
  const createMutation = useMutation({
    mutationFn: createRepository,
    onSuccess: () => {
      // Invalider et refetch les repositories
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })

  return {
    repositories,
    isLoading,
    error,
    refetch,
    createRepository: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  }
}