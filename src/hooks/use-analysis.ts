"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnalysisResult, FileMetrics, RiskScore } from "@/types/analysis";
import { ApiResponse, AnalysisStatus } from "@/types/api";

// Types pour les hotspots
export interface Hotspot {
  filePath: string;
  riskScore: number;
  commitCount: number;
  authorCount: number;
  lastModified: Date;
  reasons: string[];
}

export interface HotspotsResponse {
  repositoryId: number;
  hotspots: Hotspot[];
  summary: {
    totalHotspots: number;
    averageRiskScore: number;
    highRiskFiles: number;
  };
}

// Hook pour démarrer une analyse
export function useStartAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await fetch(
        `/api/repositories/${repositoryId}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to start analysis: ${response.statusText}`);
      }

      const data: ApiResponse<{
        jobId: string;
        repositoryId: number;
        status: string;
      }> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to start analysis");
      }

      return data.data!;
    },
    onSuccess: (data) => {
      // Invalider les requêtes liées à l'analyse
      queryClient.invalidateQueries({
        queryKey: ["analysis-status", data.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: ["analysis-results", data.repositoryId.toString()],
      });
    },
  });
}

// Hook pour suivre le statut d'une analyse
export function useAnalysisStatus(jobId: string) {
  return useQuery({
    queryKey: ["analysis-status", jobId],
    queryFn: async () => {
      const response = await fetch(`/api/analysis/status/${jobId}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch analysis status: ${response.statusText}`
        );
      }

      const data: ApiResponse<AnalysisStatus> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch analysis status");
      }

      return data.data!;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Arrêter le polling si l'analyse est terminée ou échouée
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000; // Poll toutes les 2 secondes
    },
    staleTime: 0, // Toujours considérer comme périmé pour le polling
  });
}

// Hook pour récupérer les résultats d'analyse
export function useAnalysisResults(repositoryId: string) {
  return useQuery({
    queryKey: ["analysis-results", repositoryId],
    queryFn: async () => {
      const response = await fetch(`/api/analysis/results/${repositoryId}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch analysis results: ${response.statusText}`
        );
      }

      const data: ApiResponse<AnalysisResult> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch analysis results");
      }

      return data.data!;
    },
    enabled: !!repositoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

// Hook pour récupérer les hotspots
export function useHotspots(repositoryId: string, threshold: number = 0.7) {
  return useQuery({
    queryKey: ["hotspots", repositoryId, threshold],
    queryFn: async () => {
      const response = await fetch(
        `/api/repositories/${repositoryId}/hotspots?threshold=${threshold}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch hotspots: ${response.statusText}`);
      }

      const data: ApiResponse<HotspotsResponse> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch hotspots");
      }

      return data.data!;
    },
    enabled: !!repositoryId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });
}

// Hook pour récupérer les métriques de fichiers
export function useFileMetrics(repositoryId: string) {
  return useQuery({
    queryKey: ["file-metrics", repositoryId],
    queryFn: async () => {
      const response = await fetch(`/api/repositories/${repositoryId}/metrics`);

      if (!response.ok) {
        throw new Error(`Failed to fetch file metrics: ${response.statusText}`);
      }

      const data: ApiResponse<FileMetrics[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch file metrics");
      }

      return data.data!;
    },
    enabled: !!repositoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

// Hook combiné pour l'analyse complète
export function useRepositoryAnalysis(repositoryId: string) {
  const analysisResults = useAnalysisResults(repositoryId);
  const hotspots = useHotspots(repositoryId);
  const fileMetrics = useFileMetrics(repositoryId);

  const isLoading =
    analysisResults.isLoading || hotspots.isLoading || fileMetrics.isLoading;
  const isError =
    analysisResults.isError || hotspots.isError || fileMetrics.isError;
  const error = analysisResults.error || hotspots.error || fileMetrics.error;

  return {
    // Données
    analysisResults: analysisResults.data,
    hotspots: hotspots.data,
    fileMetrics: fileMetrics.data,

    // États
    isLoading,
    isError,
    error,

    // États individuels
    analysisLoading: analysisResults.isLoading,
    hotspotsLoading: hotspots.isLoading,
    fileMetricsLoading: fileMetrics.isLoading,

    // Fonctions de refetch
    refetchAnalysis: analysisResults.refetch,
    refetchHotspots: hotspots.refetch,
    refetchFileMetrics: fileMetrics.refetch,
  };
}

// Hook pour l'analyse en temps réel avec polling intelligent
export function useAnalysisWithPolling(repositoryId: string, jobId?: string) {
  const analysis = useRepositoryAnalysis(repositoryId);
  const status = useAnalysisStatus(jobId || "");

  // Déterminer si on doit continuer le polling
  const shouldPoll =
    status.data?.status === "running" || status.data?.status === "pending";

  return {
    ...analysis,
    status: status.data,
    statusLoading: status.isLoading,
    shouldPoll,
    isAnalyzing: shouldPoll,
    progress: status.data?.progress || 0,
  };
}
