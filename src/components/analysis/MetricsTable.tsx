"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  BarChart3, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  FileText,
  Users,
  GitCommit,
  Bug,
  TrendingUp,
  Info
} from "lucide-react";
import { Hotspot } from "@/lib/services/risk-analyzer";

interface MetricsTableProps {
  hotspots: Hotspot[];
  isLoading?: boolean;
  onFileClick?: (filePath: string) => void;
}

type SortField = "filePath" | "riskScore" | "commitCount" | "authorCount" | "totalChanges" | "bugCommits";
type SortDirection = "asc" | "desc";

const getRiskBadgeVariant = (riskLevel: string) => {
  switch (riskLevel) {
    case "critical":
      return "destructive";
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
};

const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case "critical":
      return "text-red-600";
    case "high":
      return "text-orange-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

export function MetricsTable({ hotspots, isLoading = false, onFileClick }: MetricsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filteredAndSortedHotspots = useMemo(() => {
    let filtered = hotspots;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(hotspot =>
        hotspot.filePath.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply risk level filter
    if (riskFilter !== "all") {
      filtered = filtered.filter(hotspot => hotspot.riskLevel === riskFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "filePath":
          aValue = a.filePath;
          bValue = b.filePath;
          break;
        case "riskScore":
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        case "commitCount":
          aValue = a.metrics.commitCount;
          bValue = b.metrics.commitCount;
          break;
        case "authorCount":
          aValue = a.metrics.authorCount;
          bValue = b.metrics.authorCount;
          break;
        case "totalChanges":
          aValue = a.metrics.totalChanges;
          bValue = b.metrics.totalChanges;
          break;
        case "bugCommits":
          aValue = a.metrics.bugCommits;
          bValue = b.metrics.bugCommits;
          break;
        default:
          aValue = a.riskScore;
          bValue = b.riskScore;
      }

      if (typeof aValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [hotspots, searchTerm, riskFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            File Metrics
          </CardTitle>
          <CardDescription>
            Loading detailed file statistics...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 animate-pulse rounded flex-1" />
              <div className="h-10 bg-gray-200 animate-pulse rounded w-32" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          File Metrics
        </CardTitle>
        <CardDescription>
          Detailed statistics for files with elevated risk scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredAndSortedHotspots.length} of {hotspots.length} files
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("filePath")}
                  >
                    File Path
                    {getSortIcon("filePath")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("riskScore")}
                  >
                    Risk Score
                    {getSortIcon("riskScore")}
                  </Button>
                </TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("commitCount")}
                  >
                    <GitCommit className="h-4 w-4 mr-1" />
                    Commits
                    {getSortIcon("commitCount")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("authorCount")}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Authors
                    {getSortIcon("authorCount")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("totalChanges")}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Changes
                    {getSortIcon("totalChanges")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("bugCommits")}
                  >
                    <Bug className="h-4 w-4 mr-1" />
                    Bug Fixes
                    {getSortIcon("bugCommits")}
                  </Button>
                </TableHead>
                <TableHead>Risk Factors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedHotspots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm || riskFilter !== "all" ? (
                      <>
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No files match your current filters.</p>
                        <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No high-risk files detected.</p>
                        <p className="text-sm mt-1">This indicates a healthy codebase.</p>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedHotspots.map((hotspot) => (
                  <TableRow 
                    key={hotspot.filePath}
                    className={`${onFileClick ? "cursor-pointer hover:bg-accent" : ""}`}
                    onClick={() => onFileClick?.(hotspot.filePath)}
                  >
                    <TableCell className="font-medium">
                      <div className="max-w-xs">
                        <p className="truncate" title={hotspot.filePath}>
                          {hotspot.filePath}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {hotspot.filePath.split('/').slice(0, -1).join('/')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-medium ${getRiskColor(hotspot.riskLevel)}`}>
                          {(hotspot.riskScore * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              hotspot.riskLevel === "critical" ? "bg-red-500" :
                              hotspot.riskLevel === "high" ? "bg-orange-500" :
                              hotspot.riskLevel === "medium" ? "bg-yellow-500" :
                              "bg-green-500"
                            }`}
                            style={{ width: `${hotspot.riskScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadgeVariant(hotspot.riskLevel)}>
                        {hotspot.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {hotspot.metrics.commitCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {hotspot.metrics.authorCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {hotspot.metrics.totalChanges}
                    </TableCell>
                    <TableCell className="text-center">
                      {hotspot.metrics.bugCommits}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-sm">
                            <div className="space-y-2">
                              <p className="font-medium">Risk Factors:</p>
                              <ul className="list-disc list-inside text-xs space-y-1">
                                {hotspot.reasons.map((reason, index) => (
                                  <li key={index}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}