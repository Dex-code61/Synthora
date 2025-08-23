# Authentication UI Components

This directory contains reusable authentication UI components built with React Hook Form, Zod validation, and Radix UI components.

## Components Overview

### Layout Components

#### `AuthLayout`
A responsive layout wrapper for authentication pages with centered card design.

```tsx
import { AuthLayout } from "@/components/auth"

<AuthLayout
  title="Welcome back"
  description="Sign in to your account"
>
  {/* Your auth form content */}
</AuthLayout>
```

### Form Components

#### `AuthForm`
Generic form component with Zod validation and React Hook Form integration.

```tsx
import { AuthForm } from "@/components/auth"
import { signInSchema } from "@/lib/validations/auth"

<AuthForm
  schema={signInSchema}
  onSubmit={handleSubmit}
  isLoading={isLoading}
  submitText="Sign In"
>
  <EmailField />
  <PasswordField />
</AuthForm>
```

#### `SignInForm`
Complete sign-in form with GitHub OAuth and optional email/password.

```tsx
import { SignInForm } from "@/components/auth"

<SignInForm
  onGitHubSignIn={handleGitHubSignIn}
  onEmailSignIn={handleEmailSignIn}
  isLoading={isLoading}
  error={error}
  success={success}
  showEmailSignIn={true}
/>
```

#### `ProfileForm`
User profile management form with avatar display.

```tsx
import { ProfileForm } from "@/components/auth"

<ProfileForm
  user={currentUser}
  onUpdateProfile={handleUpdateProfile}
  isLoading={isLoading}
  error={error}
  success={success}
/>
```

### Button Components

#### `GitHubSignInButton`
GitHub OAuth sign-in button with loading states.

```tsx
import { GitHubSignInButton } from "@/components/auth"

<GitHubSignInButton
  onSignIn={handleGitHubSignIn}
  isLoading={isLoading}
/>
```

### Message Components

#### Message Types
- `SuccessMessage` - Green success alerts
- `ErrorMessage` - Red error alerts  
- `InfoMessage` - Blue informational alerts
- `WarningMessage` - Yellow warning alerts
- `LoadingMessage` - Loading spinner with text

```tsx
import { SuccessMessage, ErrorMessage, LoadingMessage } from "@/components/auth"

<SuccessMessage>Account created successfully!</SuccessMessage>
<ErrorMessage>Invalid credentials provided.</ErrorMessage>
<LoadingMessage message="Signing you in..." spinnerSize="md" />
```

### Field Components

Pre-built form fields with validation:
- `EmailField` - Email input with validation
- `PasswordField` - Password input with validation  
- `NameField` - Name input with validation
- `AuthFormField` - Generic form field component

```tsx
import { EmailField, PasswordField, NameField } from "@/components/auth"

<EmailField />
<PasswordField />
<NameField />
```

## Features

### Responsive Design
- Mobile-first responsive layouts
- Touch-friendly interactions
- Optimized for various screen sizes

### Loading States
- Built-in loading spinners
- Disabled states during async operations
- Loading text customization

### Form Validation
- Zod schema validation
- Real-time field validation
- Server error display
- Type-safe form handling

### Accessibility
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Error Handling
- Field-level error messages
- Form-level error display
- Network error handling
- Graceful error recovery

## Usage Examples

### Complete Sign-In Page

```tsx
"use client"

import { useState } from "react"
import { AuthLayout, SignInForm } from "@/components/auth"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    try {
      // Your GitHub OAuth logic
      await signInWithGitHub()
    } catch (err) {
      setError("Failed to sign in with GitHub")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your account"
    >
      <SignInForm
        onGitHubSignIn={handleGitHubSignIn}
        isLoading={isLoading}
        error={error}
      />
    </AuthLayout>
  )
}
```

### Profile Settings Page

```tsx
"use client"

import { useState } from "react"
import { ProfileForm } from "@/components/auth"

export default function ProfilePage({ user }) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const handleUpdateProfile = async (data) => {
    setIsLoading(true)
    try {
      await updateUserProfile(data)
      setSuccess("Profile updated successfully!")
    } catch (err) {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <ProfileForm
        user={user}
        onUpdateProfile={handleUpdateProfile}
        isLoading={isLoading}
        success={success}
      />
    </div>
  )
}
```

## Integration with Better Auth

These components are designed to work seamlessly with better-auth:

```tsx
import { signIn } from "@/lib/auth-client"

const handleGitHubSignIn = async () => {
  await signIn.social({
    provider: "github",
    callbackURL: "/dashboard"
  })
}
```

## Styling

Components use Tailwind CSS classes and follow the design system established by shadcn/ui. All components support className props for customization.

## Testing

Components are designed to be easily testable with React Testing Library:

```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { SignInForm } from "@/components/auth"

test("renders sign in form", () => {
  render(<SignInForm onGitHubSignIn={jest.fn()} />)
  expect(screen.getByText("Continue with GitHub")).toBeInTheDocument()
})
```