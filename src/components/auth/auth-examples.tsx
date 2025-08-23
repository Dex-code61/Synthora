"use client"

import * as React from "react"
import { AuthLayout } from "./auth-layout"
import { SignInForm } from "./signin-form"
import { ProfileForm } from "./profile-form"
import { GitHubSignInButton } from "./github-signin-button"
import { LoadingMessage, ErrorMessage, SuccessMessage } from "./auth-messages"

// Example: Complete Sign In Page
export function SignInPageExample() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const [success, setSuccess] = React.useState<string>("")

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    setError("")
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess("Successfully signed in with GitHub!")
    } catch (err) {
      setError("Failed to sign in with GitHub. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (data: { email: string; password: string }) => {
    setIsLoading(true)
    setError("")
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess(`Successfully signed in as ${data.email}!`)
    } catch (err) {
      setError("Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your account to continue"
    >
      <SignInForm
        onGitHubSignIn={handleGitHubSignIn}
        onEmailSignIn={handleEmailSignIn}
        isLoading={isLoading}
        error={error}
        success={success}
        showEmailSignIn={true}
      />
    </AuthLayout>
  )
}

// Example: Profile Settings Page
export function ProfilePageExample() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const [success, setSuccess] = React.useState<string>("")

  const mockUser = {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    image: "https://github.com/shadcn.png"
  }

  const handleUpdateProfile = async (data: { name?: string; email?: string; image?: string | null }) => {
    setIsLoading(true)
    setError("")
    setSuccess("")
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess("Profile updated successfully!")
    } catch (err) {
      setError("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <ProfileForm
        user={mockUser}
        onUpdateProfile={handleUpdateProfile}
        isLoading={isLoading}
        error={error}
        success={success}
      />
    </div>
  )
}

// Example: Standalone GitHub Button
export function GitHubButtonExample() {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log("GitHub sign-in successful!")
    } catch (err) {
      console.error("GitHub sign-in failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <GitHubSignInButton
        onSignIn={handleSignIn}
        isLoading={isLoading}
      />
    </div>
  )
}

// Example: Loading States
export function LoadingStatesExample() {
  return (
    <div className="space-y-4 p-4">
      <LoadingMessage message="Signing you in..." />
      <LoadingMessage message="Loading profile..." spinnerSize="lg" />
      <LoadingMessage message="Updating settings..." spinnerSize="sm" />
    </div>
  )
}

// Example: Message States
export function MessageStatesExample() {
  return (
    <div className="space-y-4 p-4 max-w-md">
      <SuccessMessage>
        Your account has been created successfully!
      </SuccessMessage>
      
      <ErrorMessage>
        Invalid credentials. Please check your email and password.
      </ErrorMessage>
      
      <LoadingMessage message="Processing your request..." />
    </div>
  )
}