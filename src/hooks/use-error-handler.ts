'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

export interface ErrorHandlerOptions {
  showToast?: boolean
  toastTitle?: string
  logError?: boolean
  onError?: (error: Error) => void
}

// Hook pour gérer les erreurs de manière cohérente
export function useErrorHandler() {
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      toastTitle = 'Erreur',
      logError = true,
      onError
    } = options

    // Convertir l'erreur en objet Error si nécessaire
    const errorObj = error instanceof Error ? error : new Error(String(error))

    // Logger l'erreur si demandé
    if (logError) {
      console.error('Error handled by useErrorHandler:', errorObj)
    }

    // Afficher un toast si demandé
    if (showToast) {
      toast.error(toastTitle, {
        description: errorObj.message,
        duration: 5000,
      })
    }

    // Appeler le callback personnalisé si fourni
    if (onError) {
      onError(errorObj)
    }

    return errorObj
  }, [])

  const handleSuccess = useCallback((
    message: string,
    description?: string
  ) => {
    toast.success(message, {
      description,
      duration: 3000,
    })
  }, [])

  const handleInfo = useCallback((
    message: string,
    description?: string
  ) => {
    toast.info(message, {
      description,
      duration: 3000,
    })
  }, [])

  const handleWarning = useCallback((
    message: string,
    description?: string
  ) => {
    toast.warning(message, {
      description,
      duration: 4000,
    })
  }, [])

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
  }
}

// Hook pour gérer les erreurs de mutation avec retry automatique
export function useMutationErrorHandler() {
  const { handleError, handleSuccess } = useErrorHandler()

  const handleMutationError = useCallback((
    error: unknown,
    context?: { action?: string; resource?: string }
  ) => {
    const action = context?.action || 'opération'
    const resource = context?.resource || 'ressource'
    
    handleError(error, {
      toastTitle: `Erreur lors de l'${action}`,
      showToast: true,
      logError: true,
    })
  }, [handleError])

  const handleMutationSuccess = useCallback((
    context?: { action?: string; resource?: string }
  ) => {
    const action = context?.action || 'opération'
    const resource = context?.resource || 'ressource'
    
    handleSuccess(
      `${action.charAt(0).toUpperCase() + action.slice(1)} réussie`,
      `La ${resource} a été ${action} avec succès`
    )
  }, [handleSuccess])

  return {
    handleMutationError,
    handleMutationSuccess,
  }
}

// Hook pour gérer les erreurs de requête avec retry
export function useQueryErrorHandler() {
  const { handleError } = useErrorHandler()

  const handleQueryError = useCallback((
    error: unknown,
    context?: { resource?: string; silent?: boolean }
  ) => {
    const resource = context?.resource || 'données'
    const silent = context?.silent || false
    
    if (!silent) {
      handleError(error, {
        toastTitle: `Erreur de chargement`,
        showToast: true,
        logError: true,
      })
    }
  }, [handleError])

  return {
    handleQueryError,
  }
}