"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, FileText, Users, GitCommit, Bug } from "lucide-react";
import { Hotspot } from "@/lib/services/risk-analyzer";

interface RiskHeatmapProps {
  hotspots: Hotspot[];
  isLoading?: boolean;
  onFileClick?: (filePath: string) => void;
}

const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

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

export function RiskHeatmap({ hotspots, isLoading = false, onFileClick }: RiskHeatmapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Heatmap
          </CardTitle>
          <CardDescription>
            Loading risk analysis...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hotspots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Heatmap
          </CardTitle>
          <CardDescription>
            No high-risk files detected in this repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All files appear to have low risk scores.</p>
            <p className="text-sm mt-2">This indicates a healthy codebase with stable files.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risk Heatmap
        </CardTitle>
        <CardDescription>
          Files with elevated risk scores requiring attention ({hotspots.length} files)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotspots.map((hotspot) => (
            <TooltipProvider key={hotspot.filePath}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      relative p-4 rounded-lg border cursor-pointer transition-all duration-200
                      hover:shadow-md hover:scale-105 hover:border-primary
                      ${onFileClick ? "hover:bg-accent" : ""}
                    `}
                    onClick={() => onFileClick?.(hotspot.filePath)}
                  >
                    {/* Risk indicator bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg">
                      <div
                        className={`h-full rounded-t-lg ${getRiskColor(hotspot.riskLevel)}`}
                        style={{ width: `${hotspot.riskScore * 100}%` }}
                      />
                    </div>

                    {/* File info */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate" title={hotspot.filePath}>
                            {hotspot.filePath.split('/').pop()}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {hotspot.filePath}
                          </p>
                        </div>
                        <Badge variant={getRiskBadgeVariant(hotspot.riskLevel)} className="text-xs">
                          {hotspot.riskLevel}
                        </Badge>
                      </div>

                      {/* Risk score */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Risk Score</span>
                        <span className="font-mono text-sm font-medium">
                          {(hotspot.riskScore * 100).toFixed(0)}%
                        </span>
                      </div>

                      {/* Quick metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <GitCommit className="h-3 w-3" />
                          <span>{hotspot.metrics.commitCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{hotspot.metrics.authorCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{hotspot.metrics.totalChanges}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bug className="h-3 w-3" />
                          <span>{hotspot.metrics.bugCommits}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-medium">{hotspot.filePath}</p>
                    <div className="space-y-1 text-xs">
                      <p><strong>Risk Score:</strong> {(hotspot.riskScore * 100).toFixed(1)}%</p>
                      <p><strong>Risk Level:</strong> {hotspot.riskLevel}</p>
                      <div>
                        <strong>Risk Factors:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          {hotspot.reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Risk Levels:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded-sm" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                <span>Critical</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}