"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TimelineChart, TimelineFilters } from "@/components/timeline";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GitBranch, Clock, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Commit } from "@/types/git";
import { useTimeline, TimelineFilters as TimelineFiltersType } from "@/hooks/use-timeline";

interface TimelinePageProps {
  params?: {
    repositoryId?: string;
  };
}

export default function TimelinePage({ params }: TimelinePageProps) {
  // Pour la démo, on utilise un ID de repository par défaut
  const repositoryId = params?.repositoryId || "1";

  const [filters, setFilters] = useState<TimelineFiltersType>({});
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  // Utiliser le hook timeline avec TanStack Query
  const {
    commits,
    stats,
    authors,
    fileTypes,
    isLoading,
    isError,
    error,
    commitsLoading,
    statsLoading,
    refetchCommits,
    refetchStats,
  } = useTimeline(repositoryId, filters);

  const handleCommitClick = useCallback((commit: Commit) => {
    setSelectedCommit(commit);
  }, []);

  const handleDateRangeChange = useCallback((range: [Date, Date] | undefined) => {
    setFilters((prev) => ({ ...prev, dateRange: range }));
  }, []);

  const handleAuthorsChange = useCallback((selectedAuthors: string[]) => {
    setFilters((prev) => ({ ...prev, authors: selectedAuthors }));
  }, []);

  const handleFileTypesChange = useCallback((selectedFileTypes: string[]) => {
    setFilters((prev) => ({ ...prev, fileTypes: selectedFileTypes }));
  }, []);

  const handleSearchQueryChange = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleRefresh = useCallback(() => {
    refetchCommits();
    refetchStats();
  }, [refetchCommits, refetchStats]);

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">
          Chargement de la timeline...
        </span>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground">
            {error?.message || "Impossible de charger les données de la timeline"}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repository Timeline</h1>
          <p className="text-muted-foreground">
            Explorez l'évolution de votre repository avec des visualisations interactives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            main
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={commitsLoading || statsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(commitsLoading || statsLoading) ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
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
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                stats.totalCommits
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributeurs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                stats.uniqueAuthors
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fichiers Modifiés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                stats.totalFiles
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insertions</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-sm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                `+${stats.totalInsertions}`
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppressions</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-sm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                `-${stats.totalDeletions}`
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TimelineFilters
        commits={commits}
        selectedDateRange={filters.dateRange}
        selectedAuthors={filters.authors || []}
        selectedFileTypes={filters.fileTypes || []}
        searchQuery={filters.searchQuery || ""}
        onDateRangeChange={handleDateRangeChange}
        onAuthorsChange={handleAuthorsChange}
        onFileTypesChange={handleFileTypesChange}
        onSearchQueryChange={handleSearchQueryChange}
        onClearFilters={handleClearFilters}
      />

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Timeline des Commits
            {commitsLoading && <LoadingSpinner size="sm" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineChart
            commits={commits}
            selectedDateRange={filters.dateRange}
            selectedAuthors={filters.authors}
            selectedFileTypes={filters.fileTypes}
            onCommitClick={handleCommitClick}
            onDateRangeChange={handleDateRangeChange}
          />
        </CardContent>
      </Card>

      {/* Selected Commit Details */}
      {selectedCommit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Détails du Commit</CardTitle>
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
                <h4 className="font-semibold mb-2">Informations du Commit</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">SHA:</span>{" "}
                    <code className="bg-muted px-1 rounded">{selectedCommit.sha}</code>
                  </div>
                  <div>
                    <span className="font-medium">Auteur:</span> {selectedCommit.author}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {selectedCommit.timestamp.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Message:</span> {selectedCommit.message}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Modifications</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Fichiers modifiés:</span>{" "}
                    {selectedCommit.filesChanged}
                  </div>
                  <div className="text-green-600">
                    <span className="font-medium">Insertions:</span> +
                    {selectedCommit.insertions}
                  </div>
                  <div className="text-red-600">
                    <span className="font-medium">Suppressions:</span> -
                    {selectedCommit.deletions}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Fichiers</h4>
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