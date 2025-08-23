"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/safe-action";
import { 
  githubSignInSchema, 
  signOutSchema, 
  updateUserProfileSchema
} from "@/lib/validations/auth";
import { type ServerActionResult } from "@/types/auth";
import { 
  createErrorResponse, 
  createSuccessResponse, 
  handleAuthError,
  validateAuthEnvironment
} from "./errors";
import { headers } from "next/headers";

/**
 * Server action to initiate GitHub OAuth sign-in
 * Redirects user to GitHub OAuth authorization page
 */
export const signInWithGitHubAction = actionClient
  .inputSchema(githubSignInSchema)
  .action(async ({ parsedInput: data }) => {
    try {
      // Validate environment variables
      validateAuthEnvironment();

      // Generate the GitHub OAuth URL using better-auth
      const authUrl = await auth.api.signInSocial({
        body: {
          provider: "github",
          callbackURL: data.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
        },
      });

      console.log("GitHub OAuth URL:", authUrl.url);
      // Redirect to GitHub OAuth
      redirect(authUrl.url || "/");

    } catch (error) {
      console.error("GitHub sign-in error:", error);
      
      // If it's not a redirect, handle the error
      if (!error || typeof error !== "object" || !("digest" in error)) {
        const authError = handleAuthError(error);
        throw new Error(authError.message);
      }
      
      // Re-throw redirect errors
      throw error;
    }
  });

/**
 * Server action to sign out user
 * Clears session and redirects to specified page
 */
export const signOutAction = actionClient
  .inputSchema(signOutSchema)
  .action(async ({ parsedInput: data }) => {
    try {
      // Sign out using better-auth
      await auth.api.signOut({
        headers: {
          // Headers will be automatically handled by better-auth from request context
        },
      });

      // Revalidate paths to clear cached data
      revalidatePath("/");
      revalidatePath("/dashboard");
      revalidatePath("/profile");
      
      // Redirect to specified page or home
      redirect(data.redirectTo || "/");
    } catch (error) {
      console.error("Sign-out error:", error);
      
      // If it's not a redirect, handle the error
      if (!error || typeof error !== "object" || !("digest" in error)) {
        const authError = handleAuthError(error);
        throw new Error(authError.message);
      }
      
      // Re-throw redirect errors
      throw error;
    }
  });

/**
 * Server action to update user profile
 * Updates user information with validation
 */
export const updateUserProfileAction = actionClient
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput: data }): Promise<ServerActionResult> => {
    try {
      // Get current session to verify user is authenticated
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return createErrorResponse("You must be signed in to update your profile.");
      }

      // Update user profile using better-auth
      const updatedUser = await auth.api.updateUser({
        body: {
          name: data.name,
          image: data.image as string | undefined,
          // Note: Email updates might require additional verification
          // depending on better-auth configuration
        },
        headers: {
          // Headers will be automatically handled
        },
      });

      // Revalidate paths that display user information
      revalidatePath("/dashboard");
      revalidatePath("/profile");

      return createSuccessResponse(updatedUser, "Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error);
      const authError = handleAuthError(error);
      return createErrorResponse(authError.message);
    }
  });

/**
 * Server action to get current user session
 * Returns current authenticated user data
 */
export const getCurrentUserAction = actionClient
  .action(async (): Promise<ServerActionResult> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return createErrorResponse("No active session found.");
      }

      return createSuccessResponse({
        user: session.user,
        session: {
          expires: session?.session?.expiresAt,
          sessionToken: session?.session?.token,
        },
      });
    } catch (error) {
      console.error("Get current user error:", error);
      const authError = handleAuthError(error);
      return createErrorResponse(authError.message);
    }
  });

/**
 * Server action to refresh user session
 * Extends session expiration time
 */
export const refreshSessionAction = actionClient
  .action(async (): Promise<ServerActionResult> => {
    try {
      // Get current session
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return createErrorResponse("No active session to refresh.");
      }

      // Session refresh is typically handled automatically by better-auth
      // This action can be used to manually trigger a refresh if needed
      const refreshedSession = await auth.api.getSession({
        headers: await headers(),
      });

      return createSuccessResponse({
        user: refreshedSession?.user,
        session: {
          expires: refreshedSession?.session?.expiresAt,
          sessionToken: refreshedSession?.session?.token,
        },
      });
    } catch (error) {
      console.error("Session refresh error:", error);
      const authError = handleAuthError(error);
      return createErrorResponse(authError.message);
    }
  });

/**
 * Server action to check authentication status
 * Returns whether user is authenticated without full session data
 */
export const checkAuthStatusAction = actionClient
  .action(async (): Promise<ServerActionResult<{ isAuthenticated: boolean }>> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      return createSuccessResponse({
        isAuthenticated: !!session?.user,
      });
    } catch (error) {
      console.error("Auth status check error:", error);
      // For auth status check, we don't want to throw errors
      // Just return not authenticated
      return createSuccessResponse({
        isAuthenticated: false,
      });
    }
  });