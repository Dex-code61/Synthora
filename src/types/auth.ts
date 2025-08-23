// Authentication-related type definitions
import type { User, Session, Account } from "@prisma/client";

// Extended user type with relations
export interface UserWithAccounts extends User {
  accounts: Account[];
  sessions: Session[];
}

// Authentication state types
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// OAuth provider types
export type OAuthProvider = "github";

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  scope?: string[];
  redirectUri?: string;
}

// Authentication context types
export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (provider: OAuthProvider, options?: SignInOptions) => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Sign in/out options
export interface SignInOptions {
  redirectTo?: string;
  callbackUrl?: string;
}

export interface SignOutOptions {
  redirectTo?: string;
  callbackUrl?: string;
}

// Form state types
export interface FormState<T = any> {
  data: T | null;
  errors: Record<string, string> | null;
  isSubmitting: boolean;
  isValid: boolean;
}

// API response types
export interface AuthApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export enum AuthErrorType {
  OAUTH_ERROR = "oauth_error",
  SESSION_EXPIRED = "session_expired",
  UNAUTHORIZED = "unauthorized",
  EMAIL_SEND_FAILED = "email_send_failed",
  DATABASE_ERROR = "database_error",
  VALIDATION_ERROR = "validation_error",
  UNKNOWN_ERROR = "unknown_error",
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

// Session management types
export interface SessionConfig {
  expiresIn: number; // seconds
  updateAge: number; // seconds
  secure: boolean;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none";
}

// Email notification types
export interface EmailNotification {
  type: "welcome" | "security_alert" | "password_reset";
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Middleware types
export interface AuthMiddlewareConfig {
  publicRoutes: string[];
  protectedRoutes: string[];
  authRoutes: string[];
  defaultRedirect: string;
  publicRedirect: string;
}

// Hook types for React components
export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (provider: OAuthProvider, options?: SignInOptions) => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface UseFormValidationReturn<T> {
  errors: Record<keyof T, string> | null;
  isValid: boolean;
  validate: (data: T) => boolean;
  clearErrors: () => void;
}

// Server action types
export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>;
}

// Better-auth specific types
export interface BetterAuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  githubId?: string | null;
  githubUsername?: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetterAuthSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  user: BetterAuthUser;
}

// Component prop types
export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export interface AuthFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export interface SignInButtonProps {
  provider: OAuthProvider;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}
