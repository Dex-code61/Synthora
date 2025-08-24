'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react'
import { useFileStory, useGenerateFileStory } from '@/hooks/use-stories'
import { cn } from '@/lib/utils'

interface FileStoryCompactProps {
  repositoryId: string
  filePath: string
  className?: string
  onExpand?: () => void
  maxHeight?: number
}

export function FileStoryCompact({ 
  repositoryId, 
  filePath, 
  className,
  onExpand,
  maxHeight = 300
}: FileStoryCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    data: story, 
    isLoading, 
    error: fetchError 
  } = useFileStory(repositoryId, filePath)
  
  const generateStoryMutation = useGenerateFileStory()

  const handleGenerateStory = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      await generateStoryMutation.mutateAsync({
        repositoryId,
        filePath,
        options: {
          includeRecommendations: true,
          maxLength: 'short',
          focusArea: 'technical'
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story')
    } finally {
      setIsGenerating(false)
    }
  }

  const fileName = filePath.split('/').pop() || filePath
  const isError = fetchError || error
  const showLoading = isLoading || isGenerating

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {fileName}
          </CardTitle>
          <div className="flex items-center gap-1">
            {story && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(story.generatedAt).toLocaleDateString()}
              </Badge>
            )}
            {onExpand && (
              <Button variant="ghost" size="sm" onClick={onExpand}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Error Display */}
        {isError && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {fetchError?.message || error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {showLoading && (
          <CompactLoadingSkeleton />
        )}

        {/* No Story State */}
        {!story && !showLoading && !isError && (
          <div className="text-center py-4 space-y-2">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No story available
            </p>
            <Button size="sm" onClick={handleGenerateStory} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Generate
                </>
              )}
            </Button>
          </div>
        )}

        {/* Story Content */}
        {story && !showLoading && (
          <div className="space-y-3">
            {/* Story Summary */}
            <div className="space-y-2">
              {story.sections.creation && (
                <div className="p-2 bg-muted/50 rounded text-xs">
                  <p className="font-medium mb-1">Creation</p>
                  <p className="text-muted-foreground line-clamp-2">
                    {story.sections.creation}
                  </p>
                </div>
              )}

              {story.sections.currentState && (
                <div className="p-2 bg-muted/50 rounded text-xs">
                  <p className="font-medium mb-1">Current State</p>
                  <p className="text-muted-foreground line-clamp-2">
                    {story.sections.currentState}
                  </p>
                </div>
              )}
            </div>

            {/* Key Changes - Collapsible */}
            {story.sections.keyChanges.length > 0 && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs font-medium"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  Key Changes ({story.sections.keyChanges.length})
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
                
                {isExpanded && (
                  <div 
                    className="space-y-1 max-h-32 overflow-y-auto"
                    style={{ maxHeight: `${maxHeight - 200}px` }}
                  >
                    {story.sections.keyChanges.map((change, index) => (
                      <div key={index} className="flex items-start gap-1 p-2 bg-muted/30 rounded text-xs">
                        <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{change}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations - Compact */}
            {story.sections.recommendations.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                  Recommendations ({story.sections.recommendations.length})
                </p>
                <div className="space-y-1">
                  {story.sections.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-xs border border-amber-200 dark:border-amber-800">
                      <p className="text-muted-foreground line-clamp-2">{rec}</p>
                    </div>
                  ))}
                  {story.sections.recommendations.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{story.sections.recommendations.length - 2} more recommendations
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Expand Button */}
            {onExpand && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={onExpand}
              >
                View Full Story
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CompactLoadingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}