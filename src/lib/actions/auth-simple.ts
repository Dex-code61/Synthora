"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Simple server action to initiate GitHub OAuth sign-in
 */
export const signInWithGitHub = async () => {
  try {
    // Generate the GitHub OAuth URL using better-auth
    const authUrl = await auth.api.signInSocial({
      body: {
        provider: "github",
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    // Redirect to GitHub OAuth
    revalidatePath(authUrl.url || "/dashboard");
  } catch (error) {
    console.error("GitHub sign-in error:", error);
    revalidatePath("/auth/error?error=oauth_error");
  }
};

/**
 * Simple server action to sign out user
 */
export const signOut = async () => {
  try {
    // Sign out using better-auth
    await auth.api.signOut({
      headers: await headers(),
    });

    // Revalidate paths to clear cached data
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    
    // Redirect to home page
    redirect("/");
  } catch (error) {
    console.error("Sign-out error:", error);
    redirect("/");
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return {
      user: session?.user || null,
      session: session?.session || null,
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return {
      user: null,
      session: null,
    };
  }
};