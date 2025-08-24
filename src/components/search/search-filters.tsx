'use client';

import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { SearchFilters as SearchFiltersType } from '@/hooks/use-semantic-search';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: Partial<SearchFiltersType>) => void;
  onReset: () => void;
  repositoryId: number;
}

const contentTypeOptions = [
  { value: 'commit', label: 'Commits', description: 'Git commit messages' },
  { value: 'comment', label: 'Comments', description: 'Code comments and discussions' },
  { value: 'pr', label: 'Pull Requests', description: 'PR descriptions and discussions' },
] as const;

export function SearchFilters({
  filters,
  onFiltersChange,
  onReset,
  repositoryId,
}: SearchFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filters.dateRange ? {
      from: filters.dateRange.from,
      to: filters.dateRange.to,
    } : undefined
  );
  const [authorInput, setAuthorInput] = useState('');
  const [filePathInput, setFilePathInput] = useState('');

  // Handle content type changes
  const handleContentTypeChange = (contentType: 'commit' | 'comment' | 'pr', checked: boolean) => {
    const currentTypes = filters.contentTypes || [];
    const newTypes = checked
      ? [...currentTypes, contentType]
      : currentTypes.filter(type => type !== contentType);
    
    onFiltersChange({
      contentTypes: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  // Handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFiltersChange({
        dateRange: {
          from: range.from,
          to: range.to,
        },
      });
    } else {
      onFiltersChange({ dateRange: undefined });
    }
  };

  // Handle similarity threshold changes
  const handleSimilarityChange = (value: number[]) => {
    onFiltersChange({ minSimilarity: value[0] });
  };

  // Add author filter
  const handleAddAuthor = () => {
    if (!authorInput.trim()) return;
    
    const currentAuthors = filters.authors || [];
    if (!currentAuthors.includes(authorInput.trim())) {
      onFiltersChange({
        authors: [...currentAuthors, authorInput.trim()],
      });
    }
    setAuthorInput('');
  };

  // Remove author filter
  const handleRemoveAuthor = (author: string) => {
    const currentAuthors = filters.authors || [];
    const newAuthors = currentAuthors.filter(a => a !== author);
    onFiltersChange({
      authors: newAuthors.length > 0 ? newAuthors : undefined,
    });
  };

  // Add file path filter
  const handleAddFilePath = () => {
    if (!filePathInput.trim()) return;
    
    const currentPaths = filters.filePaths || [];
    if (!currentPaths.includes(filePathInput.trim())) {
      onFiltersChange({
        filePaths: [...currentPaths, filePathInput.trim()],
      });
    }
    setFilePathInput('');
  };

  // Remove file path filter
  const handleRemoveFilePath = (filePath: string) => {
    const currentPaths = filters.filePaths || [];
    const newPaths = currentPaths.filter(p => p !== filePath);
    onFiltersChange({
      filePaths: newPaths.length > 0 ? newPaths : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Search Filters</h4>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>

      {/* Content Types */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Content Types</Label>
        <div className="space-y-2">
          {contentTypeOptions.map((option) => (
            <div key={option.value} className="flex items-start space-x-2">
              <Checkbox
                id={option.value}
                checked={filters.contentTypes?.includes(option.value) || false}
                onCheckedChange={(checked) =>
                  handleContentTypeChange(option.value, checked as boolean)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor={option.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Date Range</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                'Pick a date range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {dateRange?.from && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDateRangeChange(undefined)}
            className="h-6 px-2 text-xs"
          >
            Clear date range
          </Button>
        )}
      </div>

      <Separator />

      {/* Authors */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Authors</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter author name"
            value={authorInput}
            onChange={(e) => setAuthorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAuthor();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleAddAuthor}
            disabled={!authorInput.trim()}
            size="sm"
          >
            Add
          </Button>
        </div>
        {filters.authors && filters.authors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filters.authors.map((author) => (
              <Badge key={author} variant="secondary" className="text-xs">
                {author}
                <button
                  onClick={() => handleRemoveAuthor(author)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* File Paths */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">File Paths</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter file path or pattern"
            value={filePathInput}
            onChange={(e) => setFilePathInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFilePath();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleAddFilePath}
            disabled={!filePathInput.trim()}
            size="sm"
          >
            Add
          </Button>
        </div>
        {filters.filePaths && filters.filePaths.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filters.filePaths.map((filePath) => (
              <Badge key={filePath} variant="secondary" className="text-xs">
                {filePath}
                <button
                  onClick={() => handleRemoveFilePath(filePath)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Similarity Threshold */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Similarity Threshold</Label>
          <span className="text-xs text-muted-foreground">
            {Math.round((filters.minSimilarity || 0.7) * 100)}%
          </span>
        </div>
        <Slider
          value={[filters.minSimilarity || 0.7]}
          onValueChange={handleSimilarityChange}
          max={1}
          min={0.1}
          step={0.05}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Higher values return more precise matches, lower values return more results
        </p>
      </div>
    </div>
  );
}