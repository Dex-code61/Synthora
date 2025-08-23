"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { LoadingMessage, ErrorMessage } from "@/components/auth/auth-messages"
import { getCurrentUserAction } from "@/lib/actions/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Get parameters from the callback URL
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const redirectTo = searchParams.get("state") || "/dashboard"

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for OAuth errors first
        if (errorParam) {
          setStatus("error")
          setError(getOAuthErrorMessage(errorParam, errorDescription))
          return
        }

        // Verify we have the required parameters
        if (!code) {
          setStatus("error")
          setError("Missing authorization code from GitHub")
          return
        }

        // Wait a moment for better-auth to process the callback
        // The actual OAuth processing is handled by better-auth API routes
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if authentication was successful by getting current user
        const result = await getCurrentUserAction()
        
        if (result.success && result.data?.user) {
          setUser(result.data.user)
          setStatus("success")
          
          // Redirect after a short delay to show success message
          setTimeout(() => {
            router.replace(redirectTo)
          }, 2000)
        } else {
          setStatus("error")
          setError("Authentication failed. Please try signing in again.")
        }
      } catch (error) {
        console.error("Callback handling error:", error)
        setStatus("error")
        setError("An unexpected error occurred during authentication")
      }
    }

    handleCallback()
  }, [code, state, errorParam, errorDescription, redirectTo, router])

  const handleRetry = () => {
    router.push("/auth/signin")
  }

  const handleGoToDashboard = () => {
    router.push(redirectTo)
  }

  if (status === "loading") {
    return (
      <AuthLayout 
        title="Completing Sign In" 
        description="Please wait while we complete your authentication..."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <LoadingMessage message="Processing GitHub authentication..." />
        </div>
      </AuthLayout>
    )
  }

  if (status === "error") {
    return (
      <AuthLayout 
        title="Authentication Error" 
        description="There was a problem signing you in"
      >
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetry} variant="default">
              Try Again
            </Button>
            <Button onClick={() => router.push("/")} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (status === "success") {
    return (
      <AuthLayout 
        title="Welcome!" 
        description="You have been successfully signed in"
      >
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Welcome{user?.name ? `, ${user.name}` : ""}! You have been successfully signed in.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Redirecting you to your dashboard...
            </p>
            <Button onClick={handleGoToDashboard} variant="default" className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return null
}

function getOAuthErrorMessage(error: string, description?: string | null): string {
  switch (error) {
    case "access_denied":
      return "You denied access to GitHub. Please try signing in again if you want to continue."
    case "invalid_request":
      return "Invalid authentication request. Please try signing in again."
    case "unauthorized_client":
      return "The application is not authorized. Please contact support."
    case "unsupported_response_type":
      return "Unsupported authentication method. Please contact support."
    case "invalid_scope":
      return "Invalid permissions requested. Please contact support."
    case "server_error":
      return "GitHub server error. Please try again later."
    case "temporarily_unavailable":
      return "GitHub authentication is temporarily unavailable. Please try again later."
    default:
      return description || `Authentication error: ${error}. Please try again.`
  }
}