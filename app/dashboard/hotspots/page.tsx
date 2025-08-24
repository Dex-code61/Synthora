"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, BarChart3, TrendingUp, Settings, RefreshCw } from "lucide-react";
import { RiskHeatmap, MetricsTable } from "@/components/analysis";
import { useHotspots } from "@/hooks";

export default function HotspotsPage() {
  const searchParams = useSearchParams();
  const repositoryId = searchParams.get("repository") ? parseInt(searchParams.get("repository")!) : null;
  
  const [threshold, setThreshold] = useState(0.5);
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical" | undefined>();
  const [limit, setLimit] = useState(50);

  const {
    data: hotspotsData,
    isLoading,
    error,
    refetch,
  } = useHotspots(repositoryId, {
    threshold,
    limit,
    riskLevel,
  });

  const handleFileClick = (filePath: string) => {
    // TODO: Navigate to file details or open file story
    console.log("File clicked:", filePath);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!repositoryId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Analysis
            </CardTitle>
            <CardDescription>
              Please select a repository to view risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use the repository selector to choose a repository for analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Failed to load risk analysis"}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hotspots = hotspotsData?.data?.hotspots || [];
  const summary = hotspotsData?.data?.summary;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Risk Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Identify high-risk files and code hotspots requiring attention
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Hotspots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalHotspots}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Critical Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.criticalFiles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Risk Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.highRiskFiles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Medium Risk Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.mediumRiskFiles}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Analysis Settings
          </CardTitle>
          <CardDescription>
            Adjust the risk analysis parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Threshold</label>
              <div className="px-3">
                <Slider
                  value={[threshold]}
                  onValueChange={(value) => setThreshold(value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="font-medium">{(threshold * 100).toFixed(0)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Level Filter</label>
              <Select value={riskLevel || "all"} onValueChange={(value) => setRiskLevel(value === "all" ? undefined : value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Results</label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 files</SelectItem>
                  <SelectItem value="50">50 files</SelectItem>
                  <SelectItem value="100">100 files</SelectItem>
                  <SelectItem value="200">200 files</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Risk Heatmap
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Detailed Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          <RiskHeatmap
            hotspots={hotspots}
            isLoading={isLoading}
            onFileClick={handleFileClick}
          />
        </TabsContent>

        <TabsContent value="table">
          <MetricsTable
            hotspots={hotspots}
            isLoading={isLoading}
            onFileClick={handleFileClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}