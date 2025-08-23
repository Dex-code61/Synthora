import { z } from "zod"

// Validation configuration constants
export const VALIDATION_LIMITS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 8,
  MESSAGE_MIN_LENGTH: 10,
  MESSAGE_MAX_LENGTH: 1000,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
} as const

// Common error messages
export const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_EMAIL: "Invalid email address",
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} characters`,
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_LIMITS.NAME_MIN_LENGTH} character`,
  NAME_TOO_LONG: `Name must be less than ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters`,
  INVALID_URL: "Invalid URL format",
  MESSAGE_TOO_SHORT: `Message must be at least ${VALIDATION_LIMITS.MESSAGE_MIN_LENGTH} characters`,
  MESSAGE_TOO_LONG: `Message must be less than ${VALIDATION_LIMITS.MESSAGE_MAX_LENGTH} characters`,
  INVALID_USERNAME: `Username must be ${VALIDATION_LIMITS.USERNAME_MIN_LENGTH}-${VALIDATION_LIMITS.USERNAME_MAX_LENGTH} characters and contain only letters, numbers, hyphens, and underscores`,
  PASSWORDS_DONT_MATCH: "Passwords don't match",
  INVALID_DATE: "Invalid date format",
  INVALID_TIMESTAMP: "Invalid timestamp format",
} as const

// Base field schemas with consistent error messages
export const baseFields = {
  email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
  password: z.string().min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT),
  name: z.string()
    .min(VALIDATION_LIMITS.NAME_MIN_LENGTH, ERROR_MESSAGES.NAME_TOO_SHORT)
    .max(VALIDATION_LIMITS.NAME_MAX_LENGTH, ERROR_MESSAGES.NAME_TOO_LONG),
  url: z.string().url(ERROR_MESSAGES.INVALID_URL),
  optionalUrl: z.string().url(ERROR_MESSAGES.INVALID_URL).nullable().optional(),
  id: z.string().min(1, ERROR_MESSAGES.REQUIRED),
  timestamp: z.string().datetime(ERROR_MESSAGES.INVALID_TIMESTAMP),
  date: z.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }),
  boolean: z.boolean(),
  username: z.string()
    .min(VALIDATION_LIMITS.USERNAME_MIN_LENGTH)
    .max(VALIDATION_LIMITS.USERNAME_MAX_LENGTH)
    .regex(/^[a-zA-Z0-9_-]+$/, ERROR_MESSAGES.INVALID_USERNAME),
  message: z.string()
    .min(VALIDATION_LIMITS.MESSAGE_MIN_LENGTH, ERROR_MESSAGES.MESSAGE_TOO_SHORT)
    .max(VALIDATION_LIMITS.MESSAGE_MAX_LENGTH, ERROR_MESSAGES.MESSAGE_TOO_LONG),
} as const

// Validation presets for common use cases
export const validationPresets = {
  // User registration/profile
  userProfile: {
    name: baseFields.name,
    email: baseFields.email,
    image: baseFields.optionalUrl,
  },
  
  // Authentication
  signIn: {
    email: baseFields.email,
    password: baseFields.password,
  },
  
  // OAuth
  oauthCallback: {
    code: z.string().min(1, ERROR_MESSAGES.REQUIRED),
    state: z.string().min(1, ERROR_MESSAGES.REQUIRED),
    error: z.string().optional(),
    error_description: z.string().optional(),
  },
  
  // Session
  session: {
    sessionToken: z.string().min(1, ERROR_MESSAGES.REQUIRED),
    userId: baseFields.id,
    expires: baseFields.timestamp,
  },
  
  // API responses
  apiResponse: {
    success: baseFields.boolean,
    message: z.string().optional(),
    error: z.string().optional(),
  },
} as const

// Environment variable validation
export const envSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1, "GitHub Client ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GitHub Client Secret is required"),
  RESEND_API_KEY: z.string().min(1, "Resend API key is required"),
  DATABASE_URL: z.string().url("Invalid database URL"),
  NEXTAUTH_SECRET: z.string().min(1, "NextAuth secret is required"),
  NEXTAUTH_URL: z.string().url("Invalid NextAuth URL").optional(),
})

// Validation schemas for different environments
export const createEnvironmentValidation = (env: "development" | "production" | "test") => {
  const baseSchema = envSchema
  
  if (env === "production") {
    return baseSchema.extend({
      NEXTAUTH_URL: z.string().url("NextAuth URL is required in production"),
    })
  }
  
  return baseSchema
}

// Form validation configuration
export const formConfig = {
  // Default validation modes
  mode: "onBlur" as const,
  reValidateMode: "onChange" as const,
  
  // Default form options
  defaultOptions: {
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false,
  },
  
  // Debounce settings for async validation
  debounceMs: 300,
} as const

// API validation configuration
export const apiConfig = {
  // Maximum request body size (in bytes)
  maxBodySize: 1024 * 1024, // 1MB
  
  // Request timeout (in ms)
  timeout: 30000, // 30 seconds
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
} as const