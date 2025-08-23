import { AuthErrorType, type AuthError, type ServerActionResult } from "@/types/auth";

/**
 * Creates a standardized error response for server actions
 */
export function createErrorResponse(
  error: string | Error | AuthError,
  validationErrors?: Record<string, string>
): ServerActionResult {
  if (typeof error === "string") {
    return {
      success: false,
      error,
      validationErrors,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      validationErrors,
    };
  }

  // Handle AuthError type
  return {
    success: false,
    error: error.message,
    validationErrors,
  };
}

/**
 * Creates a standardized success response for server actions
 */
export function createSuccessResponse<T = any>(
  data?: T,
  message?: string
): ServerActionResult<T> {
  return {
    success: true,
    data,
    error: message ? undefined : undefined,
    validationErrors: undefined,
  };
}

/**
 * Handles and categorizes authentication errors
 */
export function handleAuthError(error: unknown): AuthError {
  console.error("Authentication error:", error);

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("oauth")) {
      return {
        type: AuthErrorType.OAUTH_ERROR,
        message: "OAuth authentication failed. Please try again.",
        details: { originalError: error.message },
      };
    }

    if (error.message.includes("session")) {
      return {
        type: AuthErrorType.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again.",
        details: { originalError: error.message },
      };
    }

    if (error.message.includes("unauthorized") || error.message.includes("forbidden")) {
      return {
        type: AuthErrorType.UNAUTHORIZED,
        message: "You are not authorized to perform this action.",
        details: { originalError: error.message },
      };
    }

    if (error.message.includes("validation")) {
      return {
        type: AuthErrorType.VALIDATION_ERROR,
        message: "Invalid data provided. Please check your input.",
        details: { originalError: error.message },
      };
    }

    if (error.message.includes("database") || error.message.includes("prisma")) {
      return {
        type: AuthErrorType.DATABASE_ERROR,
        message: "A database error occurred. Please try again later.",
        details: { originalError: error.message },
      };
    }

    if (error.message.includes("email")) {
      return {
        type: AuthErrorType.EMAIL_SEND_FAILED,
        message: "Failed to send email notification. Authentication was successful.",
        details: { originalError: error.message },
      };
    }
  }

  // Default unknown error
  return {
    type: AuthErrorType.UNKNOWN_ERROR,
    message: "An unexpected error occurred. Please try again.",
    details: { originalError: String(error) },
  };
}

/**
 * Validates that required environment variables are present
 */
export function validateAuthEnvironment(): void {
  const requiredEnvVars = [
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

/**
 * Safely extracts error message from unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  
  return "An unknown error occurred";
}

/**
 * Checks if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("validation") || 
           error.message.includes("invalid") ||
           error.message.includes("required");
  }
  return false;
}

/**
 * Checks if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("unauthorized") ||
           error.message.includes("forbidden") ||
           error.message.includes("authentication") ||
           error.message.includes("session");
  }
  return false;
}