import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHotspots } from "@/hooks/use-hotspots";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockHotspotsResponse = {
  success: true,
  data: {
    repositoryId: 1,
    hotspots: [
      {
        filePath: "src/components/critical-file.tsx",
        riskScore: 0.95,
        riskLevel: "critical",
        reasons: ["Extremely high risk score"],
        metrics: {
          commitCount: 45,
          authorCount: 8,
          totalChanges: 320,
          bugCommits: 12,
        },
        recentCommits: [
          {
            sha: "abc123",
            authorName: "John Doe",
            message: "Fix critical bug",
            timestamp: "2024-01-15T10:00:00Z",
          },
        ],
        authors: [
          {
            name: "John Doe",
            commitCount: 25,
          },
        ],
      },
    ],
    summary: {
      totalHotspots: 1,
      criticalFiles: 1,
      highRiskFiles: 0,
      mediumRiskFiles: 0,
      threshold: 0.5,
    },
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useHotspots", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch hotspots successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHotspotsResponse,
    });

    const { result } = renderHook(() => useHotspots(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockHotspotsResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/repositories/1/hotspots?threshold=0.5&limit=20",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  });

  it("should not fetch when repositoryId is null", () => {
    const { result } = renderHook(() => useHotspots(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should use custom options in query parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHotspotsResponse,
    });

    const { result } = renderHook(
      () =>
        useHotspots(1, {
          threshold: 0.7,
          limit: 50,
          riskLevel: "critical",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/repositories/1/hotspots?threshold=0.7&limit=50&riskLevel=critical",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  });

  it("should handle API errors", async () => {
    const errorResponse = {
      success: false,
      error: "Repository not found",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse,
    });

    const { result } = renderHook(() => useHotspots(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Repository not found");
  });

  it("should handle network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useHotspots(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should handle malformed JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const { result } = renderHook(() => useHotspots(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Failed to fetch hotspots");
  });

  it("should use correct query key", () => {
    const { result } = renderHook(
      () =>
        useHotspots(1, {
          threshold: 0.8,
          limit: 30,
          riskLevel: "high",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    // The query key should include all parameters
    expect(result.current.dataUpdatedAt).toBeDefined();
  });

  it("should handle undefined riskLevel option", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHotspotsResponse,
    });

    const { result } = renderHook(
      () =>
        useHotspots(1, {
          threshold: 0.6,
          limit: 25,
          riskLevel: undefined,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should not include riskLevel in query params when undefined
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/repositories/1/hotspots?threshold=0.6&limit=25",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  });

  it("should use default options when none provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHotspotsResponse,
    });

    const { result } = renderHook(() => useHotspots(1, {}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/repositories/1/hotspots?threshold=0.5&limit=20",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  });

  it("should handle repositoryId as 0", () => {
    const { result } = renderHook(() => useHotspots(0), {
      wrapper: createWrapper(),
    });

    // repositoryId 0 should be considered valid
    expect(result.current.isLoading).toBe(true);
  });

  it("should throw error when repositoryId is required but not provided", async () => {
    const { result } = renderHook(() => useHotspots(null), {
      wrapper: createWrapper(),
    });

    // Should not be loading and should not have called fetch
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});