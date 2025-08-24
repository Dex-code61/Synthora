'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BarChart3,
  ScatterChart,
  Calendar,
  GitCommit
} from 'lucide-react'
import { format } from 'date-fns'

interface TimelineControlsProps {
  viewMode: 'activity' | 'commits'
  onViewModeChange: (mode: 'activity' | 'commits') => void
  onZoom: (domain: [number, number] | null) => void
  zoomDomain: [number, number] | null
  totalCommits: number
  dateRange?: [Date, Date]
}

export function TimelineControls({
  viewMode,
  onViewModeChange,
  onZoom,
  zoomDomain,
  totalCommits,
  dateRange
}: TimelineControlsProps) {
  const handleZoomIn = () => {
    if (zoomDomain) {
      const [start, end] = zoomDomain
      const range = end - start
      const newRange = range * 0.7 // Zoom in by 30%
      const center = start + range / 2
      const newStart = center - newRange / 2
      const newEnd = center + newRange / 2
      onZoom([newStart, newEnd])
    }
  }

  const handleZoomOut = () => {
    if (zoomDomain) {
      const [start, end] = zoomDomain
      const range = end - start
      const newRange = range * 1.4 // Zoom out by 40%
      const center = start + range / 2
      const newStart = center - newRange / 2
      const newEnd = center + newRange / 2
      onZoom([newStart, newEnd])
    }
  }

  const handleResetZoom = () => {
    onZoom(null)
  }

  const handleTimeRangeSelect = (range: string) => {
    const now = new Date()
    let startDate: Date

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        return
    }

    onZoom([startDate.getTime(), now.getTime()])
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'activity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('activity')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Activity
          </Button>
          <Button
            variant={viewMode === 'commits' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('commits')}
            className="flex items-center gap-2"
          >
            <ScatterChart className="h-4 w-4" />
            Commits
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={!zoomDomain}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={!zoomDomain}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            disabled={!zoomDomain}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Quick Time Range Selection */}
        <Select onValueChange={handleTimeRangeSelect}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Quick range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats and Current Range */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <GitCommit className="h-4 w-4" />
          <Badge variant="secondary" className="text-xs">
            {totalCommits} commits
          </Badge>
        </div>

        {dateRange && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">
              {format(dateRange[0], 'MMM dd')} - {format(dateRange[1], 'MMM dd, yyyy')}
            </span>
          </div>
        )}

        {zoomDomain && (
          <Badge variant="outline" className="text-xs">
            Zoomed
          </Badge>
        )}
      </div>
    </div>
  )
}