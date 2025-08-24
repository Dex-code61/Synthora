'use client'

import React, { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { Commit } from '@/types/git'
import { CommitTooltip } from './CommitTooltip'
import { TimelineControls } from './TimelineControls'

interface TimelineChartProps {
  commits: Commit[]
  selectedDateRange?: [Date, Date]
  selectedAuthors?: string[]
  selectedFileTypes?: string[]
  onCommitClick?: (commit: Commit) => void
  onDateRangeChange?: (range: [Date, Date]) => void
}

interface TimelineDataPoint {
  date: string
  timestamp: number
  commits: Commit[]
  commitCount: number
  insertions: number
  deletions: number
  filesChanged: number
}

export function TimelineChart({
  commits,
  selectedDateRange,
  selectedAuthors,
  selectedFileTypes,
  onCommitClick,
  onDateRangeChange
}: TimelineChartProps) {
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null)
  const [viewMode, setViewMode] = useState<'activity' | 'commits'>('activity')

  // Filter commits based on selected criteria
  const filteredCommits = useMemo(() => {
    return commits.filter(commit => {
      // Date range filter
      if (selectedDateRange) {
        const commitDate = new Date(commit.timestamp)
        if (commitDate < selectedDateRange[0] || commitDate > selectedDateRange[1]) {
          return false
        }
      }

      // Author filter
      if (selectedAuthors && selectedAuthors.length > 0) {
        if (!selectedAuthors.includes(commit.author)) {
          return false
        }
      }

      // File type filter
      if (selectedFileTypes && selectedFileTypes.length > 0) {
        const hasMatchingFileType = commit.files.some(file => {
          const extension = file.filePath.split('.').pop()?.toLowerCase()
          return extension && selectedFileTypes.includes(extension)
        })
        if (!hasMatchingFileType) {
          return false
        }
      }

      return true
    })
  }, [commits, selectedDateRange, selectedAuthors, selectedFileTypes])

  // Group commits by day for timeline visualization
  const timelineData = useMemo(() => {
    const groupedByDay = new Map<string, Commit[]>()

    filteredCommits.forEach(commit => {
      const dayKey = format(new Date(commit.timestamp), 'yyyy-MM-dd')
      if (!groupedByDay.has(dayKey)) {
        groupedByDay.set(dayKey, [])
      }
      groupedByDay.get(dayKey)!.push(commit)
    })

    return Array.from(groupedByDay.entries())
      .map(([date, dayCommits]) => ({
        date,
        timestamp: new Date(date).getTime(),
        commits: dayCommits,
        commitCount: dayCommits.length,
        insertions: dayCommits.reduce((sum, c) => sum + c.insertions, 0),
        deletions: dayCommits.reduce((sum, c) => sum + c.deletions, 0),
        filesChanged: dayCommits.reduce((sum, c) => sum + c.filesChanged, 0)
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [filteredCommits])

  // Individual commits for scatter plot
  const scatterData = useMemo(() => {
    return filteredCommits.map(commit => ({
      timestamp: new Date(commit.timestamp).getTime(),
      activity: commit.insertions + commit.deletions,
      commit,
      size: Math.min(Math.max(commit.filesChanged * 2, 4), 20)
    }))
  }, [filteredCommits])

  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      const startTime = timelineData[brushData.startIndex]?.timestamp
      const endTime = timelineData[brushData.endIndex]?.timestamp
      
      if (startTime && endTime && onDateRangeChange) {
        onDateRangeChange([new Date(startTime), new Date(endTime)])
      }
    }
  }

  const handleZoom = (domain: [number, number] | null) => {
    setZoomDomain(domain)
  }

  const formatXAxisTick = (tickItem: number) => {
    return format(new Date(tickItem), 'MMM dd')
  }

  const formatTooltipLabel = (value: number) => {
    return format(new Date(value), 'PPP')
  }

  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No commits found</p>
          <p className="text-sm">Try adjusting your filters or date range</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TimelineControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onZoom={handleZoom}
        zoomDomain={zoomDomain}
        totalCommits={filteredCommits.length}
        dateRange={selectedDateRange}
      />

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'activity' ? (
            <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={zoomDomain || ['dataMin', 'dataMax']}
                tickFormatter={formatXAxisTick}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                content={<CommitTooltip />}
                labelFormatter={formatTooltipLabel}
              />
              <Line
                type="monotone"
                dataKey="commitCount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                name="Commits"
              />
              <Line
                type="monotone"
                dataKey="insertions"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                name="Insertions"
              />
              <Line
                type="monotone"
                dataKey="deletions"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={false}
                name="Deletions"
              />
              <Brush
                dataKey="timestamp"
                height={30}
                stroke="hsl(var(--primary))"
                onChange={handleBrushChange}
                tickFormatter={formatXAxisTick}
              />
            </LineChart>
          ) : (
            <ScatterChart data={scatterData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={zoomDomain || ['dataMin', 'dataMax']}
                tickFormatter={formatXAxisTick}
                className="text-xs"
              />
              <YAxis
                dataKey="activity"
                name="Activity"
                className="text-xs"
              />
              <Tooltip
                content={<CommitTooltip />}
                labelFormatter={formatTooltipLabel}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter
                dataKey="activity"
                fill="hsl(var(--primary))"
                onClick={(data) => onCommitClick?.(data.commit)}
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}