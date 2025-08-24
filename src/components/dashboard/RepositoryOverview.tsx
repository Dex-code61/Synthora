'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  GitBranch, 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  RefreshCw,
  Play,
  Eye
} from 'lucide-react'
import { useRepositoryWithData, useRepositoryAnalysis, useStartAnalysis } from '@/hooks'
import { useErrorHandler } from '@/hooks/use-error-handler'

interface RepositoryOverviewProps {
  repositoryId: string
}

export function RepositoryOverview({ repositoryId }: RepositoryOverviewProps) {
  const { handleError, handleSuccess } = useErrorHandler()
  
  // Récupérer les données du repository
  const {
    repository,
    stats,
    isLoading: repoLoading,
    isError: repoError,
    error: repoErrorObj,
    refetchRepository,
    refetchStats,
  } = useRepositoryWithData(repositoryId)

  // Récupérer les données d'analyse
  const {
    analysisResults,
    hotspots,
    isLoading: analysisLoading,
    isError: analysisError,
    error: analysisErrorObj,
    refetchAnalysis,
    refetchHotspots,
  } = useRepositoryAnalysis(repositoryId)

  // Hook pour démarrer une nouvelle analyse
  const startAnalysisMutation = useStartAnalysis()

  const handleStartAnalysis = async () => {
    try {
      const result = await startAnalysisMutation.mutateAsync(repositoryId)
      handleSuccess(
        'Analyse démarrée',
        `L'analyse du repository a été démarrée (Job ID: ${result.jobId})`
      )
    } catch (error) {
      handleError(error, {
        toastTitle: 'Erreur lors du démarrage de l\'analyse'
      })
    }
  }

  const handleRefreshAll = () => {
    refetchRepository()
    refetchStats()
    refetchAnalysis()
    refetchHotspots()
  }

  // Gestion des erreurs
  if (repoError) {
    handleError(repoErrorObj, {
      toastTitle: 'Erreur de chargement du repository',
      showToast: false, // Déjà affiché dans l'UI
    })
  }

  if (analysisError) {
    handleError(analysisErrorObj, {
      toastTitle: 'Erreur de chargement de l\'analyse',
      showToast: false,
    })
  }

  if (repoLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">
          Chargement du repository...
        </span>
      </div>
    )
  }

  if (!repository) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Repository non trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header du repository */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{repository.name}</h1>
          {repository.description && (
            <p className="text-muted-foreground mt-1">{repository.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={repository.isPrivate ? 'secondary' : 'outline'}>
              {repository.isPrivate ? 'Privé' : 'Public'}
            </Badge>
            {repository.language && (
              <Badge variant="outline">{repository.language}</Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {repository.defaultBranch}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefreshAll}
            variant="outline"
            size="sm"
            disabled={repoLoading || analysisLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(repoLoading || analysisLoading) ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button
            onClick={handleStartAnalysis}
            disabled={startAnalysisMutation.isPending}
            size="sm"
          >
            {startAnalysisMutation.isPending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Analyser
          </Button>
        </div>
      </div>

      {/* Statistiques du repository */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commits</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.totalCommits.toLocaleString() : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.totalContributors.toLocaleString() : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fichiers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.totalFiles.toLocaleString() : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lignes de Code</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.linesOfCode.toLocaleString() : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse et Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut de l'analyse */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Analyse du Code
              {analysisLoading && <LoadingSpinner size="sm" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Dernière analyse
                  </span>
                  <Badge variant="outline">
                    {new Date(repository.lastAnalyzedAt || repository.updatedAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fichiers analysés</span>
                    <span className="font-medium">{analysisResults.fileMetrics.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Patterns détectés</span>
                    <span className="font-medium">{analysisResults.patterns.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Temps de traitement</span>
                    <span className="font-medium">{analysisResults.processingTime}ms</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  Aucune analyse disponible
                </p>
                <Button
                  onClick={handleStartAnalysis}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={startAnalysisMutation.isPending}
                >
                  Démarrer l'analyse
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hotspots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Hotspots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotspots ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Fichiers à risque
                  </span>
                  <Badge variant="destructive">
                    {hotspots.summary.highRiskFiles}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {hotspots.hotspots.slice(0, 3).map((hotspot, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {hotspot.filePath.split('/').pop()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hotspot.commitCount} commits • {hotspot.authorCount} auteurs
                        </p>
                      </div>
                      <Badge 
                        variant={hotspot.riskScore > 0.8 ? 'destructive' : 'secondary'}
                        className="ml-2"
                      >
                        {Math.round(hotspot.riskScore * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {hotspots.hotspots.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir tous les hotspots ({hotspots.hotspots.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  Aucun hotspot détecté
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}