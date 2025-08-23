"use client"

import * as React from "react"
import { signInSchema, githubSignInSchema } from "@/lib/validations/auth"
import { AuthForm, EmailField, PasswordField } from "./auth-form"
import { GitHubSignInButton } from "./github-signin-button"
import { ErrorMessage, SuccessMessage } from "./auth-messages"
import { Separator } from "@/components/ui/separator"

interface SignInFormProps {
  onEmailSignIn?: (data: { email: string; password: string }) => void | Promise<void>
  onGitHubSignIn?: () => void | Promise<void>
  isLoading?: boolean
  error?: string
  success?: string
  showEmailSignIn?: boolean
  className?: string
}

export function SignInForm({
  onEmailSignIn,
  onGitHubSignIn,
  isLoading = false,
  error,
  success,
  showEmailSignIn = false,
  className
}: SignInFormProps) {
  return (
    <div className={className}>
      {error && (
        <ErrorMessage className="mb-4">
          {error}
        </ErrorMessage>
      )}
      
      {success && (
        <SuccessMessage className="mb-4">
          {success}
        </SuccessMessage>
      )}

      <div className="space-y-4">
        {/* GitHub Sign In */}
        <GitHubSignInButton
          onSignIn={onGitHubSignIn}
          isLoading={isLoading}
        />

        {showEmailSignIn && onEmailSignIn && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Sign In Form */}
            <AuthForm
              schema={signInSchema}
              onSubmit={onEmailSignIn}
              isLoading={isLoading}
              submitText="Sign in with Email"
              loadingText="Signing in..."
            >
              <EmailField />
              <PasswordField />
            </AuthForm>
          </>
        )}
      </div>
    </div>
  )
}