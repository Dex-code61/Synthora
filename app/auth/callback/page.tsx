"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Vérifier les erreurs OAuth dans l'URL
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Si il y a une erreur OAuth
  if (errorParam) {
    return (
      <AuthLayout
        title="Erreur d'authentification"
        description="Un problème est survenu lors de la connexion"
      >
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getOAuthErrorMessage(errorParam, errorDescription)}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={() => router.push("/auth/signin")}
              variant="default"
            >
              Réessayer
            </Button>
            <Button onClick={() => router.push("/")} variant="outline">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Si en cours de chargement
  if (isLoading) {
    return (
      <AuthLayout
        title="Finalisation de la connexion"
        description="Veuillez patienter pendant que nous finalisons votre authentification..."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="text-center text-muted-foreground">
            Traitement de l'authentification GitHub...
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Si authentifié avec succès
  if (isAuthenticated && user) {
    // Vérifier si c'est un nouvel utilisateur (créé récemment)
    const isNewUser = user.createdAt && new Date(user.createdAt) > new Date(Date.now() - 60000) // Créé dans la dernière minute
    
    // Redirection automatique après 2 secondes
    setTimeout(() => {
      router.replace(isNewUser ? "/auth/welcome" : "/dashboard");
    }, 2000);

    return (
      <AuthLayout
        title="Bienvenue !"
        description="Vous êtes connecté avec succès"
      >
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Bienvenue{user.name ? `, ${user.name}` : ""} ! Vous êtes connecté
              avec succès.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Redirection vers votre tableau de bord...
            </p>
            <Button
              onClick={() => {
                const isNewUser = user.createdAt && new Date(user.createdAt) > new Date(Date.now() - 60000)
                router.push(isNewUser ? "/auth/welcome" : "/dashboard")
              }}
              variant="default"
              className="w-full"
            >
              {user.createdAt && new Date(user.createdAt) > new Date(Date.now() - 60000) 
                ? "Get Started" 
                : "Aller au tableau de bord"}
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Si pas authentifié (erreur)
  return (
    <AuthLayout
      title="Erreur d'authentification"
      description="La connexion a échoué"
    >
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            L'authentification a échoué. Veuillez réessayer de vous connecter.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col space-y-2">
          <Button onClick={() => router.push("/auth/signin")} variant="default">
            Réessayer
          </Button>
          <Button onClick={() => router.push("/")} variant="outline">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

function getOAuthErrorMessage(
  error: string,
  description?: string | null
): string {
  switch (error) {
    case "access_denied":
      return "Vous avez refusé l'accès à GitHub. Veuillez réessayer si vous souhaitez continuer.";
    case "invalid_request":
      return "Demande d'authentification invalide. Veuillez réessayer.";
    case "unauthorized_client":
      return "L'application n'est pas autorisée. Veuillez contacter le support.";
    case "server_error":
      return "Erreur du serveur GitHub. Veuillez réessayer plus tard.";
    case "temporarily_unavailable":
      return "L'authentification GitHub est temporairement indisponible. Veuillez réessayer plus tard.";
    default:
      return (
        description ||
        `Erreur d'authentification : ${error}. Veuillez réessayer.`
      );
  }
}
