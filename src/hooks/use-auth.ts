"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { getCurrentUser, signInWithGitHub, signOut } from "@/lib/actions/auth-simple"

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  // Query pour récupérer l'utilisateur actuel
  const {
    data: authData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  const user = authData?.user
  const session = authData?.session
  const isAuthenticated = !!user

  // Mutation pour la connexion GitHub
  const signInMutation = useMutation({
    mutationFn: signInWithGitHub,
    onSuccess: () => {
      // Invalider le cache d'authentification
      queryClient.invalidateQueries({ queryKey: ["auth"] })
      // La redirection sera gérée par l'action server
    },
    onError: (error) => {
      console.error("Sign in error:", error)
      router.push("/auth/error?error=oauth_error")
    },
  })

  // Mutation pour la déconnexion
  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // Invalider tout le cache d'authentification
      queryClient.invalidateQueries({ queryKey: ["auth"] })
      // La redirection sera gérée par l'action server
    },
    onError: (error) => {
      console.error("Sign out error:", error)
    },
  })

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    refetch,
    signIn: signInMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  }
}