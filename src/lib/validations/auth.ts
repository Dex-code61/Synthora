import { z } from "zod"

// User authentication schemas
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const githubSignInSchema = z.object({
  provider: z.literal("github"),
  redirectTo: z.string().url().optional(),
})

export const signOutSchema = z.object({
  redirectTo: z.string().url().optional(),
})

// User profile schemas
export const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  image: z.string().url("Invalid image URL").nullable().optional(),
})

export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  image: z.string().url("Invalid image URL").nullable().optional(),
})

// Session validation schemas
export const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    image: z.string().url().nullable(),
    githubId: z.string().nullable(),
    githubUsername: z.string().nullable(),
  }),
  expires: z.string().datetime(),
  sessionToken: z.string(),
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable(),
  githubId: z.string().nullable(),
  githubUsername: z.string().nullable(),
  emailVerified: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// OAuth callback schemas
export const oauthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
})

// Error handling schemas
export const authErrorSchema = z.object({
  error: z.enum([
    "oauth_error",
    "session_expired", 
    "unauthorized",
    "email_send_failed",
    "database_error",
    "validation_error",
    "unknown_error"
  ]),
  message: z.string(),
  details: z.record(z.any()).optional(),
})

// Form validation schemas for client-side forms
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
})

// API route validation schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

// Type exports for TypeScript
export type SignInInput = z.infer<typeof signInSchema>
export type GitHubSignInInput = z.infer<typeof githubSignInSchema>
export type SignOutInput = z.infer<typeof signOutSchema>
export type UserProfile = z.infer<typeof userProfileSchema>
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>
export type SessionData = z.infer<typeof sessionSchema>
export type User = z.infer<typeof userSchema>
export type OAuthCallback = z.infer<typeof oauthCallbackSchema>
export type AuthError = z.infer<typeof authErrorSchema>
export type ContactForm = z.infer<typeof contactFormSchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>