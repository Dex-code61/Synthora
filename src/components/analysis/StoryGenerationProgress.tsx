'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  X,
  Lightbulb,
  Zap,
  Brain
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StoryGenerationProgressProps {
  isGenerating: boolean
  filePath: string
  onCancel?: () => void
  className?: string
  estimatedTime?: number // in seconds
}

export function StoryGenerationProgress({
  isGenerating,
  filePath,
  onCancel,
  className,
  estimatedTime = 15
}: StoryGenerationProgressProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  const steps = [
    { 
      id: 'analyzing', 
      label: 'Analyzing file history', 
      icon: <FileText className="h-4 w-4" />,
      duration: 3
    },
    { 
      id: 'processing', 
      label: 'Processing commit data', 
      icon: <RefreshCw className="h-4 w-4" />,
      duration: 4
    },
    { 
      id: 'generating', 
      label: 'Generating AI story', 
      icon: <Brain className="h-4 w-4" />,
      duration: 6
    },
    { 
      id: 'finalizing', 
      label: 'Finalizing insights', 
      icon: <Lightbulb className="h-4 w-4" />,
      duration: 2
    }
  ]

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0)
      setCurrentStep(0)
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1)
      
      // Calculate progress based on elapsed time and estimated time
      const newProgress = Math.min((elapsedTime / estimatedTime) * 100, 95)
      setProgress(newProgress)
      
      // Update current step based on progress
      let stepIndex = 0
      let cumulativeDuration = 0
      
      for (let i = 0; i < steps.length; i++) {
        cumulativeDuration += steps[i].duration
        if (elapsedTime < cumulativeDuration) {
          stepIndex = i
          break
        }
      }
      
      setCurrentStep(stepIndex)
    }, 100)

    return () => clearInterval(interval)
  }, [isGenerating, elapsedTime, estimatedTime])

  // Complete progress when generation finishes
  useEffect(() => {
    if (!isGenerating && progress > 0) {
      setProgress(100)
      setCurrentStep(steps.length - 1)
    }
  }, [isGenerating, progress])

  if (!isGenerating && progress === 0) {
    return null
  }

  const fileName = filePath.split('/').pop() || filePath
  const currentStepData = steps[currentStep]
  const isComplete = !isGenerating && progress > 0

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            )}
            {isComplete ? 'Story Generated' : 'Generating Story'}
          </CardTitle>
          {onCancel && isGenerating && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="truncate">{fileName}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isComplete ? 'Complete' : `${Math.round(progress)}%`}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {isComplete ? (
                `${elapsedTime.toFixed(1)}s`
              ) : (
                `${elapsedTime.toFixed(1)}s / ~${estimatedTime}s`
              )}
            </div>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
          />
        </div>

        {/* Current Step */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <div className="animate-pulse">
                {currentStepData.icon}
              </div>
            )}
            <span className="text-sm font-medium">
              {isComplete ? 'Story generation complete' : currentStepData.label}
            </span>
          </div>

          {/* Step Progress */}
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors',
                  index < currentStep || isComplete
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : index === currentStep && isGenerating
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <div className={cn(
                  'transition-all duration-200',
                  index === currentStep && isGenerating && 'animate-pulse'
                )}>
                  {step.icon}
                </div>
                <span className="text-center leading-tight">
                  {step.label.split(' ').slice(0, 2).join(' ')}
                </span>
                {(index < currentStep || isComplete) && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {isGenerating && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Zap className="h-4 w-4 text-blue-500" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                AI is analyzing your file...
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs">
                This may take a few moments depending on file complexity
              </p>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div className="text-sm">
              <p className="font-medium text-green-700 dark:text-green-300">
                Story generated successfully!
              </p>
              <p className="text-green-600 dark:text-green-400 text-xs">
                Your file's story is ready to view
              </p>
            </div>
          </div>
        )}

        {/* Performance Info */}
        {isGenerating && elapsedTime > estimatedTime * 1.5 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-300">
                Taking longer than expected
              </p>
              <p className="text-amber-600 dark:text-amber-400 text-xs">
                Large files or complex histories may require additional processing time
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Simplified version for inline use
export function StoryGenerationProgressInline({
  isGenerating,
  progress = 0,
  className
}: {
  isGenerating: boolean
  progress?: number
  className?: string
}) {
  if (!isGenerating) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Generating story...</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
    </div>
  )
}