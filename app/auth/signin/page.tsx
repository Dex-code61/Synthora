"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { GitHubSignInButton } from "@/components/auth/github-signin-button"
import { ErrorMessage } from "@/components/auth/auth-messages"
import { signInWithGitHubAction, checkAuthStatusAction } from "@/lib/actions/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Get redirect URL from search params
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const errorParam = searchParams.get("error")

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await checkAuthStatusAction()
        if (result.data?.isAuthenticated) {
          router.replace(redirectTo)
          return
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router, redirectTo])

  // Handle error from URL params (e.g., from OAuth callback)
  useEffect(() => {
    if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
  }, [errorParam])

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      await signInWithGitHubAction({ redirectTo })
    } catch (error) {
      console.error("Sign-in error:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <AuthLayout 
        title="Synthora" 
        description="Checking authentication status..."
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout 
      title="Welcome to Synthora" 
      description="Sign in to access your Git repository analysis dashboard"
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <GitHubSignInButton
          onSignIn={handleGitHubSignIn}
          isLoading={isLoading}
        />

        <div className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our terms of service and privacy policy.
        </div>
      </div>
    </AuthLayout>
  )
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "oauth_error":
      return "There was an error with GitHub authentication. Please try again."
    case "access_denied":
      return "GitHub access was denied. Please try signing in again."
    case "callback_error":
      return "There was an error processing the authentication callback."
    case "session_error":
      return "There was an error creating your session. Please try again."
    default:
      return "An authentication error occurred. Please try again."
  }
}