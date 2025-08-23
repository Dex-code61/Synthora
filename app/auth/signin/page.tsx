"use client"

import {useState } from "react"
import { useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { authClient } from "@/lib/auth-client"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  
  const errorParam = searchParams.get("error")

  const handleGitHubSignIn = () => {
    try {
      setIsLoading(true)
      authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
        errorCallbackURL: `http:localhost:3000/auth/error?error=something went wrong&message=authentification failed&redirectTo=/auth/signin`,
        newUserCallbackURL: "/auth/welcome",
      })
    } catch (error) {
      console.error("Error during GitHub sign-in:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Afficher le loading pendant la vérification de l'auth
  // if (isLoading) {
  //   return (
  //     <AuthLayout 
  //       title="Synthora" 
  //       description="Vérification de l'authentification..."
  //     >
  //       <div className="w-full flex items-center justify-center">
  //       <Loader2 className="animate-spin" />
  //       </div>
  //     </AuthLayout>
  //   )
  // }


  return (
    <AuthLayout 
      title="Bienvenue sur Synthora" 
      description="Connectez-vous pour accéder à votre tableau de bord d'analyse Git"
    >
      <div className="space-y-4">
        {errorParam && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getErrorMessage(errorParam)}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleGitHubSignIn}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="animate-spin"/>
          ) : (
            <FaGithub className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Signin..." : "Signin with GitHub"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </div>
      </div>
    </AuthLayout>
  )
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "oauth_error":
      return "Une erreur s'est produite avec l'authentification GitHub. Veuillez réessayer."
    case "access_denied":
      return "L'accès GitHub a été refusé. Veuillez réessayer de vous connecter."
    case "callback_error":
      return "Une erreur s'est produite lors du traitement du callback d'authentification."
    case "session_error":
      return "Une erreur s'est produite lors de la création de votre session. Veuillez réessayer."
    default:
      return "Une erreur d'authentification s'est produite. Veuillez réessayer."
  }
}