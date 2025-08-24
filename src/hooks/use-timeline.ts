'use client'

import { useMemo } from 'react'
import { useCommits, useCommitStats, useCommitAuthors, useFileTypes } from './use-commits'
import { GitOptions } from '@/types/git'

// Types pour les filtres de timeline
export interface TimelineFilters {
  dateRange?: [Date, Date]
  authors?: string[]
  fileTypes?: string[]
  searchQuery?: string
}

// Hook principal pour la timeline
export function useTimeline(repositoryId: string, filters: TimelineFilters = {}) {
  // Convertir les filtres en options Git
  const gitOptions = useMemo((): GitOptions => {
    const options: GitOptions = {}
    
    if (filters.dateRange) {
      options.since = filters.dateRange[0].toISOString()
      options.until = filters.dateRange[1].toISOString()
    }
    
    if (filters.authors && filters.authors.length > 0) {
      // Pour simplifier, on prend le premier auteur
      // Dans une vraie implémentation, l'API devrait supporter plusieurs auteurs
      options.author = filters.authors[0]
    }
    
    return options
  }, [filters])

  // Récupérer les données
  const commitsQuery = useCommits({
    repositoryId,
    limit: 1000, // Récupérer plus de commits pour la timeline
    ...gitOptions,
  })

  const statsQuery = useCommitStats(repositoryId, gitOptions)
  const authorsQuery = useCommitAuthors(repositoryId)
  const fileTypesQuery = useFileTypes(repositoryId)

  // Filtrer les commits côté client pour les filtres non supportés par l'API
  const filteredCommits = useMemo(() => {
    if (!commitsQuery.data?.commits) return []
    
    let commits = commitsQuery.data.commits
    
    // Filtrer par types de fichiers
    if (filters.fileTypes && filters.fileTypes.length > 0) {
      commits = commits.filter(commit =>
        commit.files.some(file => {
          const extension = file.filePath.split('.').pop()?.toLowerCase()
          return extension && filters.fileTypes!.includes(extension)
        })
      )
    }
    
    // Filtrer par recherche textuelle
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      commits = commits.filter(commit =>
        commit.message.toLowerCase().includes(query) ||
        commit.author.toLowerCase().includes(query)
      )
    }
    
    // Filtrer par auteurs multiples (côté client)
    if (filters.authors && filters.authors.length > 1) {
      commits = commits.filter(commit =>
        filters.authors!.includes(commit.author)
      )
    }
    
    return commits
  }, [commitsQuery.data?.commits, filters])

  // Calculer les statistiques filtrées
  const filteredStats = useMemo(() => {
    if (!filteredCommits.length) {
      return {
        totalCommits: 0,
        totalInsertions: 0,
        totalDeletions: 0,
        uniqueAuthors: 0,
        totalFiles: 0,
        netChanges: 0,
      }
    }

    const totalCommits = filteredCommits.length
    const totalInsertions = filteredCommits.reduce((sum, c) => sum + c.insertions, 0)
    const totalDeletions = filteredCommits.reduce((sum, c) => sum + c.deletions, 0)
    const uniqueAuthors = new Set(filteredCommits.map(c => c.author)).size
    const totalFiles = filteredCommits.reduce((sum, c) => sum + c.filesChanged, 0)

    return {
      totalCommits,
      totalInsertions,
      totalDeletions,
      uniqueAuthors,
      totalFiles,
      netChanges: totalInsertions - totalDeletions,
    }
  }, [filteredCommits])

  // État de chargement global
  const isLoading = commitsQuery.isLoading || statsQuery.isLoading
  const isError = commitsQuery.isError || statsQuery.isError
  const error = commitsQuery.error || statsQuery.error

  return {
    // Données
    commits: filteredCommits,
    stats: filteredStats,
    originalStats: statsQuery.data,
    authors: authorsQuery.data || [],
    fileTypes: fileTypesQuery.data || [],
    
    // États
    isLoading,
    isError,
    error,
    
    // États individuels pour un contrôle plus fin
    commitsLoading: commitsQuery.isLoading,
    statsLoading: statsQuery.isLoading,
    authorsLoading: authorsQuery.isLoading,
    fileTypesLoading: fileTypesQuery.isLoading,
    
    // Fonctions de refetch
    refetchCommits: commitsQuery.refetch,
    refetchStats: statsQuery.refetch,
    refetchAuthors: authorsQuery.refetch,
    refetchFileTypes: fileTypesQuery.refetch,
    
    // Pagination info
    pagination: commitsQuery.data?.pagination,
  }
}

// Hook pour les données de timeline en temps réel
export function useTimelineRealtime(repositoryId: string, filters: TimelineFilters = {}) {
  const timeline = useTimeline(repositoryId, filters)
  
  // Ici on pourrait ajouter une logique de polling ou WebSocket
  // pour des mises à jour en temps réel
  
  return timeline
}

// Hook pour précharger les données de timeline
export function useTimelinePreload(repositoryId: string) {
  const authorsQuery = useCommitAuthors(repositoryId)
  const fileTypesQuery = useFileTypes(repositoryId)
  const statsQuery = useCommitStats(repositoryId)
  
  return {
    isPreloading: authorsQuery.isLoading || fileTypesQuery.isLoading || statsQuery.isLoading,
    preloadComplete: !authorsQuery.isLoading && !fileTypesQuery.isLoading && !statsQuery.isLoading,
  }
}