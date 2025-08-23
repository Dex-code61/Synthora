// Re-export all validation schemas and utilities
export * from "./auth"
export * from "./utils"
export * from "./config"

// Convenience exports for commonly used schemas
export {
  signInSchema,
  githubSignInSchema,
  userProfileSchema,
  updateUserProfileSchema,
  sessionSchema,
  userSchema,
  oauthCallbackSchema,
  authErrorSchema,
  apiResponseSchema,
} from "./auth"

export {
  validateApiInput,
  zodErrorToFormErrors,
  createValidatedAction,
  createFieldValidator,
  createAsyncFieldValidator,
  getFieldError,
  hasFieldError,
} from "./utils"

export {
  baseFields,
  validationPresets,
  envSchema,
  formConfig,
  apiConfig,
  ERROR_MESSAGES,
  VALIDATION_LIMITS,
} from "./config"

// Type exports for convenience
export type {
  SignInInput,
  GitHubSignInInput,
  SignOutInput,
  UserProfile,
  UpdateUserProfile,
  SessionData,
  User,
  OAuthCallback,
  AuthError,
  ContactForm,
  ApiResponse,
} from "./auth"