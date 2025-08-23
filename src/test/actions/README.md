# Testing Authentication Server Actions

## Overview

The authentication server actions are built using `next-safe-action` and `better-auth`, which require a Next.js request context to function properly. This makes unit testing challenging in isolation.

## Testing Strategy

### 1. Validation Testing ✅
- **File**: `auth-validation.test.ts`
- **Purpose**: Tests input validation schemas used by server actions
- **Coverage**: All Zod schemas for authentication inputs
- **Status**: ✅ Passing

### 2. Integration Testing (Recommended)
For testing server actions, we recommend:

#### Option A: Next.js Test Environment
```typescript
// Use @next/test-utils or similar to create proper request context
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Create mock request/response
const { req, res } = createMocks({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
});

// Test server actions with proper context
```

#### Option B: End-to-End Testing
```typescript
// Use Playwright or Cypress to test authentication flows
// This tests the complete user journey including server actions
```

#### Option C: API Route Testing
```typescript
// Create API routes that use the server actions
// Test the API routes instead of server actions directly
```

### 3. Manual Testing
The server actions can be tested manually by:

1. **GitHub OAuth Flow**:
   - Navigate to sign-in page
   - Click "Sign in with GitHub"
   - Verify redirect to GitHub
   - Complete OAuth flow
   - Verify successful sign-in

2. **Profile Updates**:
   - Sign in as authenticated user
   - Update profile information
   - Verify changes are saved
   - Check error handling for invalid data

3. **Session Management**:
   - Verify session persistence across page reloads
   - Test session expiration
   - Test sign-out functionality

## Current Test Coverage

### ✅ Covered
- Input validation schemas
- Error handling utilities
- Type definitions

### ⚠️ Requires Integration Testing
- Server action execution
- Better-auth integration
- Session management
- OAuth flows
- Database operations

## Usage Examples

The server actions are designed to be used in:

1. **React Server Components**:
```typescript
import { getCurrentUserAction } from '@/lib/actions';

export default async function ProfilePage() {
  const result = await getCurrentUserAction();
  
  if (result.data?.success) {
    const { user } = result.data.data;
    return <div>Welcome, {user.name}!</div>;
  }
  
  return <div>Please sign in</div>;
}
```

2. **Form Actions**:
```typescript
import { updateUserProfileAction } from '@/lib/actions';

export default function ProfileForm() {
  return (
    <form action={updateUserProfileAction}>
      <input name="name" placeholder="Your name" />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

3. **Client Components** (with helper functions):
```typescript
import { handleGitHubSignIn } from '@/lib/actions';

export default function SignInButton() {
  return (
    <button onClick={() => handleGitHubSignIn('/dashboard')}>
      Sign in with GitHub
    </button>
  );
}
```

## Testing Recommendations

1. **Focus on validation**: Ensure input schemas catch invalid data
2. **Test error boundaries**: Verify error handling in UI components
3. **Integration tests**: Test complete authentication flows
4. **Manual testing**: Verify OAuth flows work end-to-end
5. **Type safety**: Leverage TypeScript for compile-time checks

## Notes

- Server actions require Next.js 13+ App Router
- Better-auth handles session management automatically
- All actions include proper error handling and validation
- Type safety is enforced through Zod schemas and TypeScript