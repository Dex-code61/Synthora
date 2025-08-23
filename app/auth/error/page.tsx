"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, RefreshCw, Home, LogIn } from "lucide-react"

interface AuthError {
  code: string
  title: string
  description: string
  canRetry: boolean
  showSignIn: boolean
}

const AUTH_ERRORS: Record<string, AuthError> = {
  oauth_error: {
    code: "oauth_error",
    title: "OAuth Authentication Failed",
    description: "There was an error connecting to GitHub. This might be a temporary issue.",
    canRetry: true,
    showSignIn: true,
  },
  access_denied: {
    code: "access_denied",
    title: "Access Denied",
    description: "You denied access to GitHub. To use this application, you need to grant permission.",
    canRetry: true,
    showSignIn: true,
  },
  session_error: {
    code: "session_error",
    title: "Session Error",
    description: "There was an error creating your session. Please try signing in again.",
    canRetry: true,
    showSignIn: true,
  },
  callback_error: {
    code: "callback_error",
    title: "Callback Error",
    description: "There was an error processing the authentication response from GitHub.",
    canRetry: true,
    showSignIn: true,
  },
  configuration_error: {
    code: "configuration_error",
    title: "Configuration Error",
    description: "There is a configuration issue with the authentication system. Please contact support.",
    canRetry: false,
    showSignIn: false,
  },
  rate_limit: {
    code: "rate_limit",
    title: "Rate Limit Exceeded",
    description: "Too many authentication attempts. Please wait a few minutes before trying again.",
    canRetry: true,
    showSignIn: false,
  },
  server_error: {
    code: "server_error",
    title: "Server Error",
    description: "An internal server error occurred. Please try again later.",
    canRetry: true,
    showSignIn: true,
  },
  network_error: {
    code: "network_error",
    title: "Network Error",
    description: "Unable to connect to authentication services. Please check your internet connection.",
    canRetry: true,
    showSignIn: true,
  },
  unknown: {
    code: "unknown",
    title: "Authentication Error",
    description: "An unexpected error occurred during authentication. Please try again.",
    canRetry: true,
    showSignIn: true,
  },
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<AuthError>(AUTH_ERRORS.unknown)

  // Get error details from URL parameters
  const errorCode = searchParams.get("error") || "unknown"
  const errorMessage = searchParams.get("message")

  useEffect(() => {
    const authError = AUTH_ERRORS[errorCode] || AUTH_ERRORS.unknown
    
    // If there's a custom error message, use it
    if (errorMessage) {
      authError.description = errorMessage
    }
    
    setError(authError)
  }, [errorCode, errorMessage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-full">
            <AlertCircle className="h-20 w-20 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {error.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            {error.description}
          </p>
        </div>

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-muted/50 p-4 rounded-lg text-left max-w-md mx-auto">
            <p className="text-xs font-mono text-muted-foreground">
              <strong>Debug Info:</strong><br />
              Error Code: {errorCode}<br />
              {errorMessage && (
                <>
                  Message: {errorMessage}<br />
                </>
              )}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-6 pt-8">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {error.canRetry && error.showSignIn && (
              <Link 
                href="/auth/signin" 
                className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4 flex items-center gap-2"
              >
                <LogIn className="h-5 w-5" />
                Try Signing In Again
              </Link>
            )}
            
            {error.canRetry && !error.showSignIn && (
              <Link 
                href="/auth/signin" 
                className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4 flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </Link>
            )}
            
            <span className="text-muted-foreground">or</span>
            
            <Link 
              href="/" 
              className="text-lg text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 flex items-center gap-2"
            >
              <Home className="h-5 w-5" />
              Go Home
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            If this problem persists, please{" "}
            <Link 
              href="mailto:support@synthora.com" 
              className="text-primary hover:text-primary/80 underline underline-offset-4"
            >
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}