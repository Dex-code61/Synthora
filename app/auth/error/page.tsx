"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<AuthError>(AUTH_ERRORS.unknown)
  const [isRetrying, setIsRetrying] = useState(false)

  // Get error details from URL parameters
  const errorCode = searchParams.get("error") || "unknown"
  const errorMessage = searchParams.get("message")
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"

  useEffect(() => {
    const authError = AUTH_ERRORS[errorCode] || AUTH_ERRORS.unknown
    
    // If there's a custom error message, use it
    if (errorMessage) {
      authError.description = errorMessage
    }
    
    setError(authError)
  }, [errorCode, errorMessage])

  const handleRetry = async () => {
    setIsRetrying(true)
    
    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Redirect to sign-in page with the original redirect URL
    const signInUrl = new URL("/auth/signin", window.location.origin)
    if (redirectTo !== "/dashboard") {
      signInUrl.searchParams.set("redirectTo", redirectTo)
    }
    
    router.push(signInUrl.toString())
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleGoToDashboard = () => {
    router.push("/dashboard")
  }

  const handleContactSupport = () => {
    // In a real app, this might open a support chat or email
    window.open("mailto:support@synthora.com?subject=Authentication Error&body=" + 
      encodeURIComponent(`Error Code: ${error.code}\nDescription: ${error.description}`))
  }

  return (
    <AuthLayout 
      title={error.title}
      description="We encountered an issue with authentication"
    >
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm leading-relaxed">
            {error.description}
          </AlertDescription>
        </Alert>

        {/* Error details for debugging */}
        {process.env.NODE_ENV === "development" && (
          <Alert>
            <AlertDescription className="text-xs font-mono">
              <strong>Debug Info:</strong><br />
              Error Code: {errorCode}<br />
              {errorMessage && (
                <>
                  Message: {errorMessage}<br />
                </>
              )}
              Redirect To: {redirectTo}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {error.canRetry && error.showSignIn && (
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Try Signing In Again
                </>
              )}
            </Button>
          )}

          {error.canRetry && !error.showSignIn && (
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleGoHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button onClick={handleGoToDashboard} variant="outline">
              Dashboard
            </Button>
          </div>

          {!error.canRetry && (
            <Button 
              onClick={handleContactSupport} 
              variant="secondary"
              className="w-full"
            >
              Contact Support
            </Button>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            If this problem persists, please contact our support team.
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}