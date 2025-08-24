'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Lightbulb,
  History,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'
import { useFileStory, useGenerateFileStory, useDeleteFileStory } from '@/hooks/use-stories'
import { FileStory } from '@/lib/services/story-generator'
import { cn } from '@/lib/utils'

interface FileStoryPanelProps {
  repositoryId: string
  filePath: string
  className?: string
  onClose?: () => void
}

export function FileStoryPanel({ 
  repositoryId, 
  filePath, 
  className,
  onClose 
}: FileStoryPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    data: story, 
    isLoading, 
    error: fetchError, 
    refetch 
  } = useFileStory(repositoryId, filePath)
  
  const generateStoryMutation = useGenerateFileStory()
  const deleteStoryMutation = useDeleteFileStory()

  const handleGenerateStory = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      await generateStoryMutation.mutateAsync({
        repositoryId,
        filePath,
        options: {
          includeRecommendations: true,
          maxLength: 'medium',
          focusArea: 'technical'
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefreshStory = async () => {
    setError(null)
    try {
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh story')
    }
  }

  const handleDeleteStory = async () => {
    try {
      await deleteStoryMutation.mutateAsync({
        repositoryId,
        filePath
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete story')
    }
  }

  const fileName = filePath.split('/').pop() || filePath
  const isError = fetchError || error
  const showLoading = isLoading || isGenerating

  return (
    <Card className={cn('w-full max-w-4xl', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Story: {fileName}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {filePath}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {story && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(story.generatedAt).toLocaleDateString()}
              </Badge>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Display */}
        {isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {fetchError?.message || error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {showLoading && (
          <FileStoryLoadingSkeleton />
        )}

        {/* No Story State */}
        {!story && !showLoading && !isError && (
          <div className="text-center py-8 space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No story available</h3>
              <p className="text-sm text-muted-foreground">
                Generate an AI-powered story to understand this file's evolution and insights.
              </p>
            </div>
            <Button onClick={handleGenerateStory} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Story...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate Story
                </>
              )}
            </Button>
          </div>
        )}

        {/* Story Content */}
        {story && !showLoading && (
          <div className="space-y-6">
            {/* Story Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Story Generated
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshStory}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteStory}
                  disabled={deleteStoryMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Story Sections */}
            <div className="space-y-6">
              {/* Creation Section */}
              {story.sections.creation && (
                <StorySection
                  title="The Beginning"
                  icon={<Calendar className="h-4 w-4" />}
                  content={story.sections.creation}
                />
              )}

              {/* Evolution Section */}
              {story.sections.evolution && (
                <StorySection
                  title="Evolution"
                  icon={<History className="h-4 w-4" />}
                  content={story.sections.evolution}
                />
              )}

              {/* Key Changes Section */}
              {story.sections.keyChanges.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold">Key Changes</h3>
                  </div>
                  <div className="space-y-2">
                    {story.sections.keyChanges.map((change, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{change}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current State Section */}
              {story.sections.currentState && (
                <StorySection
                  title="Current State"
                  icon={<Users className="h-4 w-4" />}
                  content={story.sections.currentState}
                />
              )}

              {/* Recommendations Section */}
              {story.sections.recommendations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold">Recommendations</h3>
                  </div>
                  <div className="space-y-2">
                    {story.sections.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Full Story Text */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Complete Story
              </h3>
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {story.story}
                  </pre>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StorySectionProps {
  title: string
  icon: React.ReactNode
  content: string
}

function StorySection({ title, icon, content }: StorySectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

function FileStoryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-16 w-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}