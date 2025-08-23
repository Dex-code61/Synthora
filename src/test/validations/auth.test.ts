import { describe, it, expect } from "vitest"
import {
  signInSchema,
  githubSignInSchema,
  userProfileSchema,
  updateUserProfileSchema,
  sessionSchema,
  userSchema,
  oauthCallbackSchema,
  authErrorSchema,
  apiResponseSchema,
} from "@/lib/validations/auth"
import { validateApiInput, zodErrorToFormErrors } from "@/lib/validations/utils"

describe("Authentication Validation Schemas", () => {
  describe("signInSchema", () => {
    it("should validate correct sign-in data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      }
      
      expect(() => signInSchema.parse(validData)).not.toThrow()
    })
    
    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      }
      
      expect(() => signInSchema.parse(invalidData)).toThrow()
    })
    
    it("should reject short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "short",
      }
      
      expect(() => signInSchema.parse(invalidData)).toThrow()
    })
  })
  
  describe("githubSignInSchema", () => {
    it("should validate GitHub sign-in data", () => {
      const validData = {
        provider: "github" as const,
        redirectTo: "https://example.com/dashboard",
      }
      
      expect(() => githubSignInSchema.parse(validData)).not.toThrow()
    })
    
    it("should validate without redirectTo", () => {
      const validData = {
        provider: "github" as const,
      }
      
      expect(() => githubSignInSchema.parse(validData)).not.toThrow()
    })
    
    it("should reject invalid provider", () => {
      const invalidData = {
        provider: "google",
      }
      
      expect(() => githubSignInSchema.parse(invalidData)).toThrow()
    })
  })
  
  describe("userProfileSchema", () => {
    it("should validate complete user profile", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        image: "https://example.com/avatar.jpg",
      }
      
      expect(() => userProfileSchema.parse(validData)).not.toThrow()
    })
    
    it("should validate profile without image", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
      }
      
      expect(() => userProfileSchema.parse(validData)).not.toThrow()
    })
    
    it("should reject empty name", () => {
      const invalidData = {
        name: "",
        email: "john@example.com",
      }
      
      expect(() => userProfileSchema.parse(invalidData)).toThrow()
    })
    
    it("should reject name that's too long", () => {
      const invalidData = {
        name: "a".repeat(101),
        email: "john@example.com",
      }
      
      expect(() => userProfileSchema.parse(invalidData)).toThrow()
    })
  })
  
  describe("updateUserProfileSchema", () => {
    it("should validate partial updates", () => {
      const validData = {
        name: "Updated Name",
      }
      
      expect(() => updateUserProfileSchema.parse(validData)).not.toThrow()
    })
    
    it("should validate empty object", () => {
      const validData = {}
      
      expect(() => updateUserProfileSchema.parse(validData)).not.toThrow()
    })
  })
  
  describe("sessionSchema", () => {
    it("should validate complete session data", () => {
      const validData = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          image: "https://example.com/avatar.jpg",
          githubId: "github123",
          githubUsername: "testuser",
        },
        expires: "2024-12-31T23:59:59.000Z",
        sessionToken: "session123",
      }
      
      expect(() => sessionSchema.parse(validData)).not.toThrow()
    })
    
    it("should validate session with null values", () => {
      const validData = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: null,
          image: null,
          githubId: null,
          githubUsername: null,
        },
        expires: "2024-12-31T23:59:59.000Z",
        sessionToken: "session123",
      }
      
      expect(() => sessionSchema.parse(validData)).not.toThrow()
    })
  })
  
  describe("oauthCallbackSchema", () => {
    it("should validate successful OAuth callback", () => {
      const validData = {
        code: "auth_code_123",
        state: "state_123",
      }
      
      expect(() => oauthCallbackSchema.parse(validData)).not.toThrow()
    })
    
    it("should validate OAuth error callback", () => {
      const validData = {
        code: "auth_code_123",
        state: "state_123",
        error: "access_denied",
        error_description: "User denied access",
      }
      
      expect(() => oauthCallbackSchema.parse(validData)).not.toThrow()
    })
  })
  
  describe("authErrorSchema", () => {
    it("should validate auth error", () => {
      const validData = {
        error: "oauth_error" as const,
        message: "OAuth authentication failed",
        details: { provider: "github" },
      }
      
      expect(() => authErrorSchema.parse(validData)).not.toThrow()
    })
    
    it("should validate error without details", () => {
      const validData = {
        error: "session_expired" as const,
        message: "Your session has expired",
      }
      
      expect(() => authErrorSchema.parse(validData)).not.toThrow()
    })
  })
  
  describe("apiResponseSchema", () => {
    it("should validate successful API response", () => {
      const validData = {
        success: true,
        data: { user: { id: "123" } },
        message: "Operation successful",
      }
      
      expect(() => apiResponseSchema.parse(validData)).not.toThrow()
    })
    
    it("should validate error API response", () => {
      const validData = {
        success: false,
        error: "Validation failed",
      }
      
      expect(() => apiResponseSchema.parse(validData)).not.toThrow()
    })
  })
})

describe("Validation Utils", () => {
  describe("validateApiInput", () => {
    it("should return success for valid input", () => {
      const result = validateApiInput(signInSchema, {
        email: "test@example.com",
        password: "password123",
      })
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.errors).toBeNull()
    })
    
    it("should return errors for invalid input", () => {
      const result = validateApiInput(signInSchema, {
        email: "invalid-email",
        password: "short",
      })
      
      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.errors).toBeDefined()
      expect(result.errors?.email).toContain("Invalid email")
      expect(result.errors?.password).toContain("at least 8 characters")
    })
  })
  
  describe("zodErrorToFormErrors", () => {
    it("should convert zod errors to form errors", () => {
      try {
        signInSchema.parse({
          email: "invalid-email",
          password: "short",
        })
      } catch (error) {
        if (error instanceof Error) {
          const formErrors = zodErrorToFormErrors(error as any)
          expect(formErrors.email).toContain("Invalid email")
          expect(formErrors.password).toContain("at least 8 characters")
        }
      }
    })
  })
})