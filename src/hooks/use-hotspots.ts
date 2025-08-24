import { useQuery } from "@tanstack/react-query";
import { Hotspot } from "@/lib/services/risk-analyzer";

interface HotspotsResponse {
  success: boolean;
  data: {
    repositoryId: number;
    hotspots: (Hotspot & {
      recentCommits: Array<{
        sha: string;
        authorName: string;
        message: string;
        timestamp: string;
      }>;
      authors: Array<{
        name: string;
        commitCount: number;
      }>;
    })[];
    summary: {
      totalHotspots: number;
      criticalFiles: number;
      highRiskFiles: number;
      mediumRiskFiles: number;
      threshold: number;
    };
  };
  error?: string;
}

interface UseHotspotsOptions {
  threshold?: number;
  limit?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
}

export function useHotspots(
  repositoryId: number | null,
  options: UseHotspotsOptions = {}
) {
  const { threshold = 0.5, limit = 20, riskLevel } = options;

  return useQuery({
    queryKey: ["hotspots", repositoryId, threshold, limit, riskLevel],
    queryFn: async (): Promise<HotspotsResponse> => {
      if (!repositoryId) {
        throw new Error("Repository ID is required");
      }

      const params = new URLSearchParams({
        threshold: threshold.toString(),
        limit: limit.toString(),
      });

      if (riskLevel) {
        params.append("riskLevel", riskLevel);
      }

      const response = await fetch(
        `/api/repositories/${repositoryId}/hotspots?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch hotspots");
      }

      return response.json();
    },
    enabled: repositoryId !== null && repositoryId !== undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export type { HotspotsResponse, UseHotspotsOptions };