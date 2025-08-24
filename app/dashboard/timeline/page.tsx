"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TimelineChart, TimelineFilters } from "@/components/timeline";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GitBranch, Clock, TrendingUp } from "lucide-react";
import { Commit } from "@/types/git";

// Mock data for demonstration - in real app this would come from API
const mockCommits: Commit[] = [
  {
    sha: "a1b2c3d4e5f6",
    author: "John Doe",
    email: "john@example.com",
    message: "Add user authentication system",
    timestamp: new Date("2024-01-15T10:30:00Z"),
    filesChanged: 8,
    insertions: 245,
    deletions: 12,
    files: [
      {
        filePath: "src/auth/login.ts",
        changeType: "added",
        insertions: 45,
        deletions: 0,
      },
      {
        filePath: "src/auth/register.ts",
        changeType: "added",
        insertions: 52,
        deletions: 0,
      },
      {
        filePath: "src/components/LoginForm.tsx",
        changeType: "added",
        insertions: 89,
        deletions: 0,
      },
      {
        filePath: "src/types/user.ts",
        changeType: "modified",
        insertions: 23,
        deletions: 5,
      },
    ],
  },
  {
    sha: "b2c3d4e5f6g7",
    author: "Jane Smith",
    email: "jane@example.com",
    message: "Fix authentication bug in login flow",
    timestamp: new Date("2024-01-16T14:20:00Z"),
    filesChanged: 3,
    insertions: 15,
    deletions: 8,
    files: [
      {
        filePath: "src/auth/login.ts",
        changeType: "modified",
        insertions: 10,
        deletions: 5,
      },
      {
        filePath: "src/components/LoginForm.tsx",
        changeType: "modified",
        insertions: 5,
        deletions: 3,
      },
    ],
  },
  {
    sha: "c3d4e5f6g7h8",
    author: "Bob Wilson",
    email: "bob@example.com",
    message: "Implement dashboard layout and navigation",
    timestamp: new Date("2024-01-17T09:15:00Z"),
    filesChanged: 12,
    insertions: 387,
    deletions: 23,
    files: [
      {
        filePath: "src/components/Dashboard.tsx",
        changeType: "added",
        insertions: 156,
        deletions: 0,
      },
      {
        filePath: "src/components/Sidebar.tsx",
        changeType: "added",
        insertions: 98,
        deletions: 0,
      },
      {
        filePath: "src/styles/dashboard.css",
        changeType: "added",
        insertions: 67,
        deletions: 0,
      },
    ],
  },
  {
    sha: "d4e5f6g7h8i9",
    author: "Alice Johnson",
    email: "alice@example.com",
    message: "Add responsive design for mobile devices",
    timestamp: new Date("2024-01-18T16:45:00Z"),
    filesChanged: 6,
    insertions: 123,
    deletions: 34,
    files: [
      {
        filePath: "src/styles/responsive.css",
        changeType: "added",
        insertions: 89,
        deletions: 0,
      },
      {
        filePath: "src/components/Dashboard.tsx",
        changeType: "modified",
        insertions: 34,
        deletions: 34,
      },
    ],
  },
  {
    sha: "e5f6g7h8i9j0",
    author: "John Doe",
    email: "john@example.com",
    message: "Refactor authentication service",
    timestamp: new Date("2024-01-19T11:30:00Z"),
    filesChanged: 4,
    insertions: 67,
    deletions: 89,
    files: [
      {
        filePath: "src/services/auth.ts",
        changeType: "modified",
        insertions: 45,
        deletions: 67,
      },
      {
        filePath: "src/auth/login.ts",
        changeType: "modified",
        insertions: 22,
        deletions: 22,
      },
    ],
  },
];

export default function TimelinePage() {
  const [selectedDateRange, setSelectedDateRange] = useState<
    [Date, Date] | undefined
  >();
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [isLoading] = useState(false);

  const handleCommitClick = useCallback((commit: Commit) => {
    setSelectedCommit(commit);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedDateRange(undefined);
    setSelectedAuthors([]);
    setSelectedFileTypes([]);
    setSearchQuery("");
  }, []);

  // Filter commits based on search query
  const filteredCommits = React.useMemo(() => {
    if (!searchQuery) return mockCommits;

    return mockCommits.filter(
      (commit) =>
        commit.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commit.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalCommits = filteredCommits.length;
    const totalInsertions = filteredCommits.reduce(
      (sum, c) => sum + c.insertions,
      0
    );
    const totalDeletions = filteredCommits.reduce(
      (sum, c) => sum + c.deletions,
      0
    );
    const uniqueAuthors = new Set(filteredCommits.map((c) => c.author)).size;
    const totalFiles = filteredCommits.reduce(
      (sum, c) => sum + c.filesChanged,
      0
    );

    return {
      totalCommits,
      totalInsertions,
      totalDeletions,
      uniqueAuthors,
      totalFiles,
      netChanges: totalInsertions - totalDeletions,
    };
  }, [filteredCommits]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Repository Timeline
          </h1>
          <p className="text-muted-foreground">
            Explore your repository's evolution through interactive
            visualizations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            main
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueAuthors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Changed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insertions</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-sm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{stats.totalInsertions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deletions</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-sm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{stats.totalDeletions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TimelineFilters
        commits={mockCommits}
        selectedDateRange={selectedDateRange}
        selectedAuthors={selectedAuthors}
        selectedFileTypes={selectedFileTypes}
        searchQuery={searchQuery}
        onDateRangeChange={setSelectedDateRange}
        onAuthorsChange={setSelectedAuthors}
        onFileTypesChange={setSelectedFileTypes}
        onSearchQueryChange={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Commit Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineChart
            commits={filteredCommits}
            selectedDateRange={selectedDateRange}
            selectedAuthors={selectedAuthors}
            selectedFileTypes={selectedFileTypes}
            onCommitClick={handleCommitClick}
            onDateRangeChange={setSelectedDateRange}
          />
        </CardContent>
      </Card>

      {/* Selected Commit Details */}
      {selectedCommit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Commit Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCommit(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Commit Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">SHA:</span>{" "}
                    <code className="bg-muted px-1 rounded">
                      {selectedCommit.sha}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Author:</span>{" "}
                    {selectedCommit.author}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {selectedCommit.timestamp.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Message:</span>{" "}
                    {selectedCommit.message}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Changes</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Files changed:</span>{" "}
                    {selectedCommit.filesChanged}
                  </div>
                  <div className="text-green-600">
                    <span className="font-medium">Insertions:</span> +
                    {selectedCommit.insertions}
                  </div>
                  <div className="text-red-600">
                    <span className="font-medium">Deletions:</span> -
                    {selectedCommit.deletions}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Files</h4>
              <div className="space-y-1">
                {selectedCommit.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge
                      variant={
                        file.changeType === "added"
                          ? "default"
                          : file.changeType === "modified"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {file.changeType}
                    </Badge>
                    <code className="bg-muted px-1 rounded flex-1">
                      {file.filePath}
                    </code>
                    <span className="text-green-600">+{file.insertions}</span>
                    <span className="text-red-600">-{file.deletions}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
