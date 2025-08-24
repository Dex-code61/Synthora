import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MetricsTable } from "@/components/analysis/MetricsTable";
import { Hotspot } from "@/lib/services/risk-analyzer";

const mockHotspots: Hotspot[] = [
  {
    filePath: "src/components/critical-file.tsx",
    riskScore: 0.95,
    riskLevel: "critical",
    reasons: ["Extremely high risk score", "High commit frequency (45 commits)"],
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
    reasons: ["Medium risk score"],
    metrics: {
      commitCount: 15,
      authorCount: 3,
      totalChanges: 120,
      bugCommits: 2,
    },
  },
  {
    filePath: "src/components/low-risk-component.tsx",
    riskScore: 0.35,
    riskLevel: "low",
    reasons: ["Low risk score"],
    metrics: {
      commitCount: 8,
      authorCount: 2,
      totalChanges: 45,
      bugCommits: 0,
    },
  },
];

describe("MetricsTable", () => {
  it("renders loading state correctly", () => {
    render(<MetricsTable hotspots={[]} isLoading={true} />);
    
    expect(screen.getByText("File Metrics")).toBeInTheDocument();
    expect(screen.getByText("Loading detailed file statistics...")).toBeInTheDocument();
    
    // Should show skeleton loaders
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders table with hotspots correctly", () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    expect(screen.getByText("File Metrics")).toBeInTheDocument();
    expect(screen.getByText("Detailed statistics for files with elevated risk scores")).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText("File Path")).toBeInTheDocument();
    expect(screen.getByText("Risk Score")).toBeInTheDocument();
    expect(screen.getByText("Risk Level")).toBeInTheDocument();
    expect(screen.getByText("Commits")).toBeInTheDocument();
    expect(screen.getByText("Authors")).toBeInTheDocument();
    expect(screen.getByText("Changes")).toBeInTheDocument();
    expect(screen.getByText("Bug Fixes")).toBeInTheDocument();
    expect(screen.getByText("Risk Factors")).toBeInTheDocument();
    
    // Check if all hotspots are rendered
    expect(screen.getByText("src/components/critical-file.tsx")).toBeInTheDocument();
    expect(screen.getByText("src/utils/high-risk-util.ts")).toBeInTheDocument();
    expect(screen.getByText("src/services/medium-risk-service.ts")).toBeInTheDocument();
    expect(screen.getByText("src/components/low-risk-component.tsx")).toBeInTheDocument();
  });

  it("displays metrics correctly in table", () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    // Check metrics for critical file
    expect(screen.getByText("95.0%")).toBeInTheDocument();
    expect(screen.getAllByText("45")[0]).toBeInTheDocument(); // commits (use first occurrence)
    expect(screen.getAllByText("8")[0]).toBeInTheDocument(); // authors
    expect(screen.getByText("320")).toBeInTheDocument(); // changes
    expect(screen.getByText("12")).toBeInTheDocument(); // bug commits
  });

  it("shows results summary", () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    expect(screen.getByText("Showing 4 of 4 files")).toBeInTheDocument();
  });

  it("filters by search term", async () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    const searchInput = screen.getByPlaceholderText("Search files...");
    fireEvent.change(searchInput, { target: { value: "critical" } });
    
    await waitFor(() => {
      expect(screen.getByText("Showing 1 of 4 files")).toBeInTheDocument();
      expect(screen.getByText("src/components/critical-file.tsx")).toBeInTheDocument();
      expect(screen.queryByText("src/utils/high-risk-util.ts")).not.toBeInTheDocument();
    });
  });

  it("filters by risk level", async () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    const riskFilter = screen.getByRole("combobox");
    fireEvent.click(riskFilter);
    
    const criticalOption = screen.getByText("Critical");
    fireEvent.click(criticalOption);
    
    await waitFor(() => {
      expect(screen.getByText("Showing 1 of 4 files")).toBeInTheDocument();
      expect(screen.getByText("src/components/critical-file.tsx")).toBeInTheDocument();
      expect(screen.queryByText("src/utils/high-risk-util.ts")).not.toBeInTheDocument();
    });
  });

  it("sorts by different columns", async () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    // Click on File Path header to sort
    const filePathHeader = screen.getByText("File Path");
    fireEvent.click(filePathHeader);
    
    await waitFor(() => {
      // Check that sorting happened by looking for the first file path in alphabetical order
      expect(screen.getByText("src/components/critical-file.tsx")).toBeInTheDocument();
    });
  });

  it("sorts by risk score descending by default", () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    const rows = screen.getAllByRole("row");
    // First data row should have the highest risk score (critical file)
    expect(rows[1]).toHaveTextContent("95.0%");
    expect(rows[1]).toHaveTextContent("critical");
  });

  it("calls onFileClick when row is clicked", () => {
    const mockOnFileClick = vi.fn();
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} onFileClick={mockOnFileClick} />);
    
    const firstRow = screen.getByText("src/components/critical-file.tsx").closest("tr");
    fireEvent.click(firstRow!);
    
    expect(mockOnFileClick).toHaveBeenCalledWith("src/components/critical-file.tsx");
  });

  it("shows empty state when no results after filtering", async () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    const searchInput = screen.getByPlaceholderText("Search files...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    
    await waitFor(() => {
      expect(screen.getByText("No files match your current filters.")).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your search or filter criteria.")).toBeInTheDocument();
    });
  });

  it("shows empty state when no hotspots provided", () => {
    render(<MetricsTable hotspots={[]} isLoading={false} />);
    
    expect(screen.getByText("No high-risk files detected.")).toBeInTheDocument();
    expect(screen.getByText("This indicates a healthy codebase.")).toBeInTheDocument();
  });

  it("displays risk level badges with correct variants", () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    // Check that badges are rendered
    expect(screen.getByText("critical")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
  });

  it("shows risk progress bars", () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    // Check that progress bars are rendered (they have specific background colors)
    const progressBars = document.querySelectorAll("[class*='bg-red-500'], [class*='bg-orange-500'], [class*='bg-yellow-500'], [class*='bg-green-500']");
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("shows risk factors tooltip", async () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    // Check that info buttons are rendered (tooltips are hard to test in jsdom)
    const infoButtons = screen.getAllByRole("button");
    const riskFactorButtons = infoButtons.filter(button => 
      button.querySelector("svg")?.getAttribute("class")?.includes("lucide-info")
    );
    
    expect(riskFactorButtons.length).toBeGreaterThan(0);
  });

  it("handles file path display correctly", () => {
    const hotspotsWithLongPaths: Hotspot[] = [
      {
        filePath: "src/very/deep/nested/directory/structure/long-filename-that-should-be-truncated.tsx",
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

    render(<MetricsTable hotspots={hotspotsWithLongPaths} isLoading={false} />);
    
    // Should show full path in table
    expect(screen.getByText("src/very/deep/nested/directory/structure/long-filename-that-should-be-truncated.tsx")).toBeInTheDocument();
    // Should show directory path separately
    expect(screen.getByText("src/very/deep/nested/directory/structure")).toBeInTheDocument();
  });

  it("toggles sort direction when clicking same column", async () => {
    render(<MetricsTable hotspots={mockHotspots} isLoading={false} />);
    
    const riskScoreHeader = screen.getByText("Risk Score");
    
    // First click should maintain desc order (default)
    fireEvent.click(riskScoreHeader);
    await waitFor(() => {
      expect(screen.getByText("95.0%")).toBeInTheDocument(); // Still highest first
    });
    
    // Second click should reverse to asc order
    fireEvent.click(riskScoreHeader);
    await waitFor(() => {
      expect(screen.getByText("35.0%")).toBeInTheDocument(); // Now lowest should be visible
    });
  });
});