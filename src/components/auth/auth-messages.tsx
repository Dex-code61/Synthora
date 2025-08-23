"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AuthMessageProps {
  children: React.ReactNode
  className?: string
}

export function SuccessMessage({ children, className }: AuthMessageProps) {
  return (
    <Alert className={cn("border-green-500  text-green-800", className)}>
      <CheckCircleIcon className="h-4 w-4" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function ErrorMessage({ children, className }: AuthMessageProps) {
  return (
    <Alert className={cn("border-destructive  text-destructive", className)} variant="destructive">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function InfoMessage({ children, className }: AuthMessageProps) {
  return (
    <Alert className={cn("border-blue-500 text-blue-800", className)}>
      <InfoCircleIcon className="h-4 w-4" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function WarningMessage({ children, className }: AuthMessageProps) {
  return (
    <Alert className={cn("border-yellow-200 bg-yellow-50 text-yellow-800", className)}>
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

interface LoadingMessageProps {
  message?: string
  className?: string
  spinnerSize?: "sm" | "md" | "lg"
}

export function LoadingMessage({ 
  message = "Loading...", 
  className,
  spinnerSize = "md" 
}: LoadingMessageProps) {
  return (
    <div className={cn(
      "flex items-center justify-center space-x-2 p-4 text-muted-foreground",
      className
    )}>
      <LoadingSpinner size={spinnerSize} />
      <span className="text-sm">{message}</span>
    </div>
  )
}

// Icon components
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function ExclamationTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  )
}

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}