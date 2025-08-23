// Example usage of validation schemas with react-hook-form and next-safe-action
// This file demonstrates how to use the validation schemas in practice

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createSafeActionClient } from "next-safe-action"
import { signInSchema, userProfileSchema, type SignInInput, type UserProfile } from "./auth"
import { createValidatedAction } from "./utils"

// Example 1: Using validation schemas with react-hook-form
export const useSignInForm = () => {
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  })

  return form
}

export const useUserProfileForm = (defaultValues?: Partial<UserProfile>) => {
  const form = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      image: defaultValues?.image || null,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  })

  return form
}

// Example 2: Using validation schemas with next-safe-action
const actionClient = createSafeActionClient()

export const signInAction = actionClient
  .schema(signInSchema)
  .action(async ({ parsedInput: data }) => {
    // Implementation would go here
    console.log("Sign in with:", data)
    
    // Simulate authentication logic
    if (data.email === "test@example.com" && data.password === "password123") {
      return { success: true, message: "Signed in successfully" }
    }
    
    throw new Error("Invalid credentials")
  })

export const updateProfileAction = actionClient
  .schema(userProfileSchema)
  .action(async ({ parsedInput: data }) => {
    // Implementation would go here
    console.log("Update profile with:", data)
    
    // Simulate profile update logic
    return { success: true, message: "Profile updated successfully", data }
  })

// Example 3: Using validation utilities for API routes
export const validateSignInRequest = createValidatedAction(
  signInSchema,
  async (input: SignInInput) => {
    // Your authentication logic here
    console.log("Processing sign in for:", input.email)
    
    // Return the result
    return {
      user: {
        id: "user123",
        email: input.email,
        name: "Test User",
      },
      token: "jwt_token_here",
    }
  }
)

// Example 4: Form validation helpers
export const validateEmailField = (email: string): string | true => {
  try {
    signInSchema.shape.email.parse(email)
    return true
  } catch (error) {
    return "Invalid email address"
  }
}

export const validatePasswordField = (password: string): string | true => {
  try {
    signInSchema.shape.password.parse(password)
    return true
  } catch (error) {
    return "Password must be at least 8 characters"
  }
}

// Example 5: Async validation for unique fields
export const validateUniqueEmail = async (email: string): Promise<string | true> => {
  try {
    signInSchema.shape.email.parse(email)
    
    // Simulate checking if email is unique
    const isUnique = await checkEmailUniqueness(email)
    
    return isUnique ? true : "Email is already taken"
  } catch (error) {
    return "Invalid email address"
  }
}

// Mock function for demonstration
async function checkEmailUniqueness(email: string): Promise<boolean> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  return email !== "taken@example.com"
}

// Example 6: Type-safe API response validation
export const validateApiResponse = <T>(data: unknown, schema: any): T => {
  return schema.parse(data)
}

// Example usage in a component:
/*
import { useSignInForm, signInAction } from "@/lib/validations/examples"

export function SignInForm() {
  const form = useSignInForm()
  
  const onSubmit = async (data: SignInInput) => {
    try {
      const result = await signInAction(data)
      console.log("Success:", result)
    } catch (error) {
      console.error("Error:", error)
    }
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register("email")}
        type="email"
        placeholder="Email"
      />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
      
      <input
        {...form.register("password")}
        type="password"
        placeholder="Password"
      />
      {form.formState.errors.password && (
        <span>{form.formState.errors.password.message}</span>
      )}
      
      <button type="submit" disabled={form.formState.isSubmitting}>
        Sign In
      </button>
    </form>
  )
}
*/