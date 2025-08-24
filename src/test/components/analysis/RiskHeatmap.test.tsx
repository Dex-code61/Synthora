import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RiskHeatmap } from "@/components/analysis/RiskHeatmap";
import { Hotspot } from "@/lib/services/risk-analyzer";

const mockHotspots: Hotspot[] = [
  {
    filePath: "src/components/critical-file.tsx",
    riskScore: 0.95,
    riskLevel: "critical",
    reasons: ["Extremely high risk score", "High commit frequency (45 commits)", "Many contributors (8 authors)"],
    metrics: {
      commitCount: 45,
      authorCount: 8,
      totalChanges: 320,
      bugCommits: 12,
    },
  },
  {
    filePath: "src/utils/high-risk-util.ts",
    riskScore: 0.78,
    riskLevel: "high",
    reasons: ["High risk score", "Large change volume (650 changes)"],
    metrics: {
      commitCount: 25,
      authorCount: 5,
      totalChanges: 650,
      bugCommits: 3,
    },
  },
  {
    filePath: "src/services/medium-risk-service.ts",
    riskScore: 0.55,
    riskLevel: "medium",
    reasons: ["Medium risk score", "Bug fixes present (16.0% of commits)"],
    metrics: {
      commitCount: 15,
      authorCount: 3,
      totalChanges: 120,
      bugCommits: 2,
    },
  },
];

describe("RiskHeatmap", () => {
  it("renders loading state correctly", () => {
    render(<RiskHeatmap hotspots={[]} isLoading={true} />);
    
    expect(screen.getByText("Risk Heatmap")).toBeInTheDocument();
    expect(screen.getByText("Loading risk analysis...")).toBeInTheDocument();
    
    // Should show skeleton loaders
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no hotspots", () => {
    render(<RiskHeatmap hotspots={[]} isLoading={false} />);
    
    expect(screen.getByText("Risk Heatmap")).toBeInTheDocument();
    expect(screen.getByText("No high-risk files detected in this repository")).toBeInTheDocument();
    expect(screen.getByText("All files appear to have low risk scores.")).toBeInTheDocument();
    expect(screen.getByText("This indicates a healthy codebase with stable files.")).toBeInTheDocument();
  });

  it("renders hotspots correctly", () => {
    render(<RiskHeatmap hotspots={mockHotspots} isLoading={false} />);
    
    expect(screen.getByText("Risk Heatmap")).toBeInTheDocument();
    expect(screen.getByText("Files with elevated risk scores requiring attention (3 files)")).toBeInTheDocument();
    
    // Check if all hotspots are rendered
    expect(screen.getByText("critical-file.tsx")).toBeInTheDocument();
    expect(screen.getByText("high-risk-util.ts")).toBeInTheDocument();
    expect(screen.getByText("medium-risk-service.ts")).toBeInTheDocument();
    
    // Check risk levels
    expect(screen.getByText("critical")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    
    // Check risk scores
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
  });

  it("displays metrics correctly", () => {
    render(<RiskHeatmap hotspots={mockHotspots} isLoading={false} />);
    
    // Check metrics for first hotspot - look for the parent container
    const criticalFileContainer = screen.getByText("critical-file.tsx").closest("[class*='p-4']");
    expect(criticalFileContainer).toHaveTextContent("45"); // commit count
    expect(criticalFileContainer).toHaveTextContent("8"); // author count
    expect(criticalFileContainer).toHaveTextContent("320"); // total changes
    expect(criticalFileContainer).toHaveTextContent("12"); // bug commits
  });

  it("shows legend correctly", () => {
    render(<RiskHeatmap hotspots={mockHotspots} isLoading={false} />);
    
    expect(screen.getByText("Risk Levels:")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("calls onFileClick when file is clicked", () => {
    const mockOnFileClick = vi.fn();
    render(<RiskHeatmap hotspots={mockHotspots} isLoading={false} onFileClick={mockOnFileClick} />);
    
    const criticalFileContainer = screen.getByText("critical-file.tsx").closest("[class*='p-4']");
    fireEvent.click(criticalFileContainer!);
    
    expect(mockOnFileClick).toHaveBeenCalledWith("src/components/critical-file.tsx");
  });

  it("applies correct risk level colors", () => {
    render(<RiskHeatmap hotspots={mockHotspots} isLoading={false} />);
    
    // Check that risk indicator bars have correct colors
    const riskBars = document.querySelectorAll("[class*='bg-red-500'], [class*='bg-orange-500'], [class*='bg-yellow-500']");
    expect(riskBars.length).toBeGreaterThan(0);
  });

  it("shows tooltips on hover", async () => {
    render(<RiskHeatmap hotspots={mockHotspots} isLoading={false} />);
    
    // Check that tooltip content is rendered (even if not visible)
    expect(screen.getByText("src/components/critical-file.tsx")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("handles file paths correctly", () => {
    const hotspotsWithLongPaths: Hotspot[] = [
      {
        filePath: "src/very/deep/nested/directory/structure/long-filename.tsx",
        riskScore: 0.8,
        riskLevel: "high",
        reasons: ["High risk score"],
        metrics: {
          commitCount: 20,
          authorCount: 4,
          totalChanges: 150,
          bugCommits: 2,
        },
      },
    ];

    render(<RiskHeatmap hotspots={hotspotsWithLongPaths} isLoading={false} />);
    
    // Should show just the filename
    expect(screen.getByText("long-filename.tsx")).toBeInTheDocument();
    // Full path should be in title attribute
    const fileElement = screen.getByText("long-filename.tsx");
    expect(fileElement).toHaveAttribute("title", "src/very/deep/nested/directory/structure/long-filename.tsx");
  });

  it("renders without onFileClick handler", () => {
    render(<RiskHeatmap hotspots={mockHotspots} isLoading={false} />);
    
    // Should render without errors
    expect(screen.getByText("Risk Heatmap")).toBeInTheDocument();
    expect(screen.getByText("critical-file.tsx")).toBeInTheDocument();
  });

  it("handles empty reasons array", () => {
    const hotspotsWithoutReasons: Hotspot[] = [
      {
        filePath: "src/test-file.ts",
        riskScore: 0.6,
        riskLevel: "medium",
        reasons: [],
        metrics: {
          commitCount: 10,
          authorCount: 2,
          totalChanges: 50,
          bugCommits: 1,
        },
      },
    ];

    render(<RiskHeatmap hotspots={hotspotsWithoutReasons} isLoading={false} />);
    
    expect(screen.getByText("test-file.ts")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});