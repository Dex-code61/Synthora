'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Filter,
  Calendar as CalendarIcon,
  User,
  FileType,
  Search,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Commit } from '@/types/git'

interface TimelineFiltersProps {
  commits: Commit[]
  selectedDateRange?: [Date, Date]
  selectedAuthors?: string[]
  selectedFileTypes?: string[]
  searchQuery?: string
  onDateRangeChange?: (range: [Date, Date] | undefined) => void
  onAuthorsChange?: (authors: string[]) => void
  onFileTypesChange?: (fileTypes: string[]) => void
  onSearchQueryChange?: (query: string) => void
  onClearFilters?: () => void
}

export function TimelineFilters({
  commits,
  selectedDateRange,
  selectedAuthors = [],
  selectedFileTypes = [],
  searchQuery = '',
  onDateRangeChange,
  onAuthorsChange,
  onFileTypesChange,
  onSearchQueryChange,
  onClearFilters
}: TimelineFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    selectedDateRange ? {
      from: selectedDateRange[0],
      to: selectedDateRange[1]
    } : undefined
  )

  // Extract unique authors from commits
  const availableAuthors = useMemo(() => {
    const authors = new Set<string>()
    commits.forEach(commit => authors.add(commit.author))
    return Array.from(authors).sort()
  }, [commits])

  // Extract unique file types from commits
  const availableFileTypes = useMemo(() => {
    const fileTypes = new Set<string>()
    commits.forEach(commit => {
      commit.files.forEach(file => {
        const extension = file.filePath.split('.').pop()?.toLowerCase()
        if (extension) {
          fileTypes.add(extension)
        }
      })
    })
    return Array.from(fileTypes).sort()
  }, [commits])

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      onDateRangeChange?.([range.from, range.to])
    } else {
      onDateRangeChange?.(undefined)
    }
  }

  const handleAuthorToggle = (author: string, checked: boolean) => {
    const newAuthors = checked
      ? [...selectedAuthors, author]
      : selectedAuthors.filter(a => a !== author)
    onAuthorsChange?.(newAuthors)
  }

  const handleFileTypeToggle = (fileType: string, checked: boolean) => {
    const newFileTypes = checked
      ? [...selectedFileTypes, fileType]
      : selectedFileTypes.filter(ft => ft !== fileType)
    onFileTypesChange?.(newFileTypes)
  }

  const handleClearAuthors = () => {
    onAuthorsChange?.([])
  }

  const handleClearFileTypes = () => {
    onFileTypesChange?.([])
  }

  const hasActiveFilters = selectedDateRange || selectedAuthors.length > 0 || 
                          selectedFileTypes.length > 0 || searchQuery.length > 0

  return (
    <div className="space-y-4">
      {/* Filter Toggle and Active Filters Summary */}
      <div className="flex items-center justify-between">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {[
                    selectedDateRange ? 1 : 0,
                    selectedAuthors.length,
                    selectedFileTypes.length,
                    searchQuery ? 1 : 0
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
              {/* Search */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search commits
                </Label>
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange?.(e.target.value)}
                  className="h-8"
                />
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date range
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 justify-start text-left font-normal"
                    >
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span className="text-muted-foreground">Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Authors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Authors ({selectedAuthors.length})
                  </Label>
                  {selectedAuthors.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAuthors}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                  {availableAuthors.map(author => (
                    <div key={author} className="flex items-center space-x-2">
                      <Checkbox
                        id={`author-${author}`}
                        checked={selectedAuthors.includes(author)}
                        onCheckedChange={(checked) => 
                          handleAuthorToggle(author, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`author-${author}`}
                        className="text-xs cursor-pointer truncate"
                      >
                        {author}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Types */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <FileType className="h-4 w-4" />
                    File types ({selectedFileTypes.length})
                  </Label>
                  {selectedFileTypes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFileTypes}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                  {availableFileTypes.map(fileType => (
                    <div key={fileType} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filetype-${fileType}`}
                        checked={selectedFileTypes.includes(fileType)}
                        onCheckedChange={(checked) => 
                          handleFileTypeToggle(fileType, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`filetype-${fileType}`}
                        className="text-xs cursor-pointer"
                      >
                        .{fileType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedDateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(selectedDateRange[0], 'MMM dd')} - {format(selectedDateRange[1], 'MMM dd')}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateRangeChange?.(undefined)}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {selectedAuthors.map(author => (
            <Badge key={author} variant="secondary" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {author}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAuthorToggle(author, false)}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {selectedFileTypes.map(fileType => (
            <Badge key={fileType} variant="secondary" className="flex items-center gap-1">
              <FileType className="h-3 w-3" />
              .{fileType}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileTypeToggle(fileType, false)}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              "{searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchQueryChange?.('')}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}