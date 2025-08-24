'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi,
  Clock,
  Shield,
  HelpCircle,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StoryError {
  type: 'ai_service' | 'network' | 'rate_limit' | 'validation' | 'unknown'
  message: string
  originalError?: Error
  retryable: boolean
  retryAfter?: number // seconds
}

interface StoryErrorDisplayProps {
  error: StoryError | Error | string
  filePath: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  showDetails?: boolean
}

export function StoryErrorDisplay({
  error,
  filePath,
  onRetry,
  onDismiss,
  className,
  showDetails = false
}: StoryErrorDisplayProps) {
  // Normalize error to StoryError format
  const storyError = normalizeError(error)
  const fileName = filePath.split('/').pop() || filePath

  const getErrorIcon = () => {
    switch (storyError.type) {
      case 'network':
        return <Wifi className="h-5 w-5" />
      case 'rate_limit':
        return <Clock className="h-5 w-5" />
      case 'ai_service':
        return <Shield className="h-5 w-5" />
      case 'validation':
        return <HelpCircle className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getErrorColor = () => {
    switch (storyError.type) {
      case 'network':
        return 'text-orange-500'
      case 'rate_limit':
        return 'text-yellow-500'
      case 'ai_service':
        return 'text-blue-500'
      case 'validation':
        return 'text-purple-500'
      default:
        return 'text-red-500'
    }
  }

  const getErrorTitle = () => {
    switch (storyError.type) {
      case 'network':
        return 'Connection Issue'
      case 'rate_limit':
        return 'Service Busy'
      case 'ai_service':
        return 'AI Service Error'
      case 'validation':
        return 'Invalid Request'
      default:
        return 'Generation Failed'
    }
  }

  const getUserFriendlyMessage = () => {
    switch (storyError.type) {
      case 'rate_limit':
        return `AI service is temporarily busy. ${storyError.retryAfter ? `Please try again in ${storyError.retryAfter} seconds.` : 'Please try again in a few minutes.'}`
      case 'ai_service':
        return 'AI service is currently unavailable. This might be temporary - please try again later.'
      case 'network':
        return 'Network connection issue. Please check your internet connection and try again.'
      case 'validation':
        return 'There was an issue with the request. Please check the file path and try again.'
      default:
        return storyError.message || 'An unexpected error occurred while generating the story.'
    }
  }

  const getSuggestions = () => {
    switch (storyError.type) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact your network administrator if the issue persists'
        ]
      case 'rate_limit':
        return [
          'Wait a few minutes before trying again',
          'Try generating stories for fewer files at once',
          'Consider upgrading your AI service plan if this happens frequently'
        ]
      case 'ai_service':
        return [
          'Try again in a few minutes',
          'Check the AI service status page',
          'Contact support if the issue persists'
        ]
      case 'validation':
        return [
          'Verify the file path is correct',
          'Ensure the file exists in the repository',
          'Try with a different file'
        ]
      default:
        return [
          'Try refreshing the page',
          'Try again in a few minutes',
          'Contact support if the issue persists'
        ]
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className={cn(getErrorColor())}>
              {getErrorIcon()}
            </div>
            {getErrorTitle()}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {storyError.type.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="text-sm text-muted-foreground">
          Failed to generate story for: <span className="font-medium">{fileName}</span>
        </div>

        {/* Error Message */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getUserFriendlyMessage()}
          </AlertDescription>
        </Alert>

        {/* Retry Information */}
        {storyError.retryable && storyError.retryAfter && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Clock className="h-4 w-4 text-yellow-500" />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-300">
                Retry available in {storyError.retryAfter} seconds
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                The service will be ready to try again shortly
              </p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Suggestions:</h4>
          <ul className="space-y-1">
            {getSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Technical Details */}
        {showDetails && storyError.originalError && (
          <details className="space-y-2">
            <summary className="text-sm font-medium cursor-pointer hover:text-foreground">
              Technical Details
            </summary>
            <div className="p-3 bg-muted rounded-lg">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                {storyError.originalError.message}
                {storyError.originalError.stack && (
                  <>
                    {'\n\nStack trace:\n'}
                    {storyError.originalError.stack}
                  </>
                )}
              </pre>
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {storyError.retryable && onRetry && (
            <Button 
              onClick={onRetry} 
              size="sm"
              disabled={storyError.retryAfter ? storyError.retryAfter > 0 : false}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {storyError.retryAfter && storyError.retryAfter > 0 
                ? `Retry in ${storyError.retryAfter}s` 
                : 'Retry'
              }
            </Button>
          )}
          
          {onDismiss && (
            <Button variant="outline" onClick={onDismiss} size="sm">
              Dismiss
            </Button>
          )}

          {/* Help Link */}
          <Button variant="ghost" size="sm" asChild>
            <a 
              href="/docs/troubleshooting#story-generation" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              Help
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact error display for inline use
export function StoryErrorInline({
  error,
  onRetry,
  className
}: {
  error: StoryError | Error | string
  onRetry?: () => void
  className?: string
}) {
  const storyError = normalizeError(error)

  return (
    <Alert variant="destructive" className={cn('', className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          {storyError.type === 'rate_limit' 
            ? 'Service busy, try again later'
            : 'Failed to generate story'
          }
        </span>
        {storyError.retryable && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Helper function to normalize different error types
function normalizeError(error: StoryError | Error | string): StoryError {
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      retryable: true
    }
  }

  if (error instanceof Error) {
    // Try to classify common error patterns
    const message = error.message.toLowerCase()
    
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        type: 'rate_limit',
        message: error.message,
        originalError: error,
        retryable: true,
        retryAfter: 60
      }
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'network',
        message: error.message,
        originalError: error,
        retryable: true
      }
    }
    
    if (message.includes('invalid') || message.includes('400')) {
      return {
        type: 'validation',
        message: error.message,
        originalError: error,
        retryable: false
      }
    }
    
    return {
      type: 'unknown',
      message: error.message,
      originalError: error,
      retryable: true
    }
  }

  // Already a StoryError
  return error
}