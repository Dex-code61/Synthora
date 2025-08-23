# Authentication Server Actions

This directory contains server actions for handling authentication using better-auth and next-safe-action.

## Overview

The authentication server actions provide type-safe, validated server-side functions for:
- GitHub OAuth sign-in
- User sign-out
- Profile updates
- Session management
- Authentication status checks

## Files

- `auth.ts` - Main server actions using next-safe-action
- `errors.ts` - Error handling utilities and standardized responses
- `usage-examples.ts` - Helper functions and usage examples
- `index.ts` - Exports for easy importing

## Server Actions

### `signInWithGitHubAction`
Initiates GitHub OAuth sign-in flow.

**Input Schema:** `githubSignInSchema`
```typescript
{
  provider: "github",
  redirectTo?: string // Optional redirect URL after sign-in
}
```

**Behavior:** Redirects to GitHub OAuth authorization page

### `signOutAction`
Signs out the current user and clears session.

**Input Schema:** `signOutSchema`
```typescript
{
  redirectTo?: string // Optional redirect URL after sign-out
}
```

**Behavior:** Clears session and redirects to specified page

### `updateUserProfileAction`
Updates user profile information.

**Input Schema:** `updateUserProfileSchema`
```typescript
{
  name?: string,     // 1-100 characters
  email?: string,    // Valid email format
  image?: string     // Valid URL or null
}
```

**Returns:** `ServerActionResult` with updated user data

### `getCurrentUserAction`
Retrieves current user session data.

**Input:** None

**Returns:** `ServerActionResult` with user and session information

### `refreshSessionAction`
Refreshes the current user session.

**Input:** None

**Returns:** `ServerActionResult` with refreshed session data

### `checkAuthStatusAction`
Checks if user is currently authenticated.

**Input:** None

**Returns:** `ServerActionResult<{ isAuthenticated: boolean }>`

## Error Handling

All server actions use standardized error handling:

- **Validation errors** - Invalid input data
- **Authentication errors** - Unauthorized access
- **OAuth errors** - GitHub OAuth failures
- **Database errors** - Data persistence issues
- **Session errors** - Session management problems

## Usage Examples

### Basic Sign-in/Sign-out
```typescript
import { signInWithGitHubAction, signOutAction } from '@/lib/actions';

// Sign in with GitHub
await signInWithGitHubAction({
  provider: "github",
  redirectTo: "/dashboard"
});

// Sign out
await signOutAction({
  redirectTo: "/"
});
```

### Profile Management
```typescript
import { updateUserProfileAction, getCurrentUserAction } from '@/lib/actions';

// Update profile
const result = await updateUserProfileAction({
  name: "John Doe",
  image: "https://example.com/avatar.jpg"
});

if (result.success) {
  console.log("Profile updated:", result.data);
} else {
  console.error("Update failed:", result.error);
}

// Get current user
const userResult = await getCurrentUserAction();
if (userResult.success) {
  const { user, session } = userResult.data;
}
```

### Authentication Status
```typescript
import { checkAuthStatusAction } from '@/lib/actions';

const statusResult = await checkAuthStatusAction();
const isAuthenticated = statusResult.data?.isAuthenticated || false;
```

## Helper Functions

The `usage-examples.ts` file provides convenient wrapper functions:

```typescript
import { 
  handleGitHubSignIn,
  handleSignOut,
  handleProfileUpdate,
  getCurrentUser,
  checkIfAuthenticated
} from '@/lib/actions';

// Simplified usage
const isAuth = await checkIfAuthenticated();
const user = await getCurrentUser();
await handleGitHubSignIn('/dashboard');
```

## Testing

- `auth-validation.test.ts` - Tests input validation schemas
- Server actions require Next.js request context, so integration tests should be run in a proper Next.js environment

## Environment Variables

Required environment variables:
- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret
- `NEXT_PUBLIC_APP_URL` - Your application's base URL

## Integration

These server actions integrate with:
- **better-auth** - Authentication provider
- **next-safe-action** - Type-safe server actions
- **Zod** - Input validation
- **Prisma** - Database operations (via better-auth)

## Security Features

- Input validation using Zod schemas
- Type-safe server actions
- Proper error handling without exposing sensitive information
- Session management through better-auth
- CSRF protection via next-safe-action