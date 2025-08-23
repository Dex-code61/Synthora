// Re-export all type definitions
export * from "./auth"
export * from "./analysis"
export * from "./api"
export * from "./git"

// Convenience type exports for authentication
export type {
  AuthState,
  AuthContextValue,
  SignInOptions,
  SignOutOptions,
  FormState,
  AuthApiResponse,
  AuthError,
  AuthErrorType,
  SessionConfig,
  EmailNotification,
  AuthMiddlewareConfig,
  UseAuthReturn,
  UseFormValidationReturn,
  ServerActionResult,
  BetterAuthUser,
  BetterAuthSession,
  AuthLayoutProps,
  AuthFormProps,
  SignInButtonProps,
  UserWithAccounts,
  OAuthProvider,
  OAuthProviderConfig,
} from "./auth"