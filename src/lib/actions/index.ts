// Authentication server actions
export {
  signInWithGitHubAction,
  signOutAction,
  updateUserProfileAction,
  getCurrentUserAction,
  refreshSessionAction,
  checkAuthStatusAction,
} from "./auth";

// Error handling utilities
export {
  createErrorResponse,
  createSuccessResponse,
  handleAuthError,
  validateAuthEnvironment,
  getErrorMessage,
  isValidationError,
  isAuthError,
} from "./errors";

// Usage examples and helper functions
export {
  handleGitHubSignIn,
  handleSignOut,
  handleProfileUpdate,
  getCurrentUser,
  checkIfAuthenticated,
  refreshUserSession,
} from "./usage-examples";

// Re-export types for convenience
export type { ServerActionResult } from "@/types/auth";