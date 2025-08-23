"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, LogIn, Home, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get the page the user was trying to access
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const message = searchParams.get("message")

  const handleSignIn = () => {
    const signInUrl = new URL("/auth/signin", window.location.origin)
    signInUrl.searchParams.set("redirectTo", redirectTo)
    router.push(signInUrl.toString())
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <AuthLayout 
      title="Access Denied"
      description="You need to be signed in to access this page"
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-orange-500/30 p-3">
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {message || "You need to be signed in to access this page. Please sign in with your GitHub account to continue."}
          </AlertDescription>
        </Alert>

        {redirectTo !== "/dashboard" && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You were trying to access: <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{redirectTo}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={handleSignIn} className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In with GitHub
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Don't have a GitHub account? You can{" "}
            <a 
              href="https://github.com/join" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              create one for free
            </a>
            .
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}