/**
 * Usage examples for authentication server actions
 * These examples show how to use the server actions in your components and pages
 */

import { 
  signInWithGitHubAction,
  signOutAction,
  updateUserProfileAction,
  getCurrentUserAction,
  refreshSessionAction,
  checkAuthStatusAction
} from "./auth";

/**
 * Example: Sign in with GitHub from a client component
 */
export async function handleGitHubSignIn(redirectTo?: string) {
  try {
    await signInWithGitHubAction({
      provider: "github",
      redirectTo: redirectTo || "/dashboard",
    });
    // This will redirect, so code after this won't execute
  } catch (error) {
    console.error("Sign-in failed:", error);
    // Handle error in your UI
  }
}

/**
 * Example: Sign out from a client component
 */
export async function handleSignOut(redirectTo?: string) {
  try {
    await signOutAction({
      redirectTo: redirectTo || "/",
    });
    // This will redirect, so code after this won't execute
  } catch (error) {
    console.error("Sign-out failed:", error);
    // Handle error in your UI
  }
}

/**
 * Example: Update user profile from a form
 */
export async function handleProfileUpdate(formData: {
  name?: string;
  image?: string;
}) {
  try {
    const result = await updateUserProfileAction(formData);
    
    if (result.success) {
      console.log("Profile updated successfully:", result.data);
      return { success: true, user: result.data };
    } else {
      console.error("Profile update failed:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Example: Get current user session
 */
export async function getCurrentUser() {
  try {
    const result = await getCurrentUserAction();
    
    if (result.success) {
      return {
        success: true,
        user: result.data?.user,
        session: result.data?.session,
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Get current user error:", error);
    return { success: false, error: "Failed to get user session" };
  }
}

/**
 * Example: Check if user is authenticated
 */
export async function checkIfAuthenticated() {
  try {
    const result = await checkAuthStatusAction();
    
    if (result.success) {
      return result.data?.isAuthenticated || false;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
}

/**
 * Example: Refresh user session
 */
export async function refreshUserSession() {
  try {
    const result = await refreshSessionAction();
    
    if (result.success) {
      return {
        success: true,
        user: result.data?.user,
        session: result.data?.session,
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Session refresh error:", error);
    return { success: false, error: "Failed to refresh session" };
  }
}

/**
 * Example: React component using the actions
 */
/*
'use client';

import { useState } from 'react';
import { handleGitHubSignIn, handleSignOut, handleProfileUpdate } from '@/lib/actions/usage-examples';

export function AuthExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await handleGitHubSignIn('/dashboard');
    } catch (err) {
      setError('Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogOut = async () => {
    setIsLoading(true);
    
    try {
      await handleSignOut('/');
    } catch (err) {
      setError('Sign-out failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await handleProfileUpdate({ name });
      
      if (!result.success) {
        setError(result.error || 'Profile update failed');
      }
    } catch (err) {
      setError('Profile update failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      
      <button 
        onClick={handleSignIn} 
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
      </button>
      
      <button 
        onClick={handleLogOut} 
        disabled={isLoading}
      >
        {isLoading ? 'Signing out...' : 'Sign out'}
      </button>
      
      <button 
        onClick={() => updateProfile('New Name')} 
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
}
*/