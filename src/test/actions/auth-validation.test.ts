import { describe, it, expect } from "vitest";
import { 
  githubSignInSchema, 
  signOutSchema, 
  updateUserProfileSchema 
} from "@/lib/validations/auth";

describe("Authentication Action Validation", () => {
  describe("githubSignInSchema", () => {
    it("should validate correct GitHub sign-in data", () => {
      const validData = {
        provider: "github" as const,
        redirectTo: "https://example.com/dashboard",
      };

      const result = githubSignInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate GitHub sign-in without redirectTo", () => {
      const validData = {
        provider: "github" as const,
      };

      const result = githubSignInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid provider", () => {
      const invalidData = {
        provider: "google",
        redirectTo: "https://example.com/dashboard",
      };

      const result = githubSignInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid redirectTo URL", () => {
      const invalidData = {
        provider: "github" as const,
        redirectTo: "not-a-url",
      };

      const result = githubSignInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("signOutSchema", () => {
    it("should validate correct sign-out data", () => {
      const validData = {
        redirectTo: "https://example.com/",
      };

      const result = signOutSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate sign-out without redirectTo", () => {
      const validData = {};

      const result = signOutSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid redirectTo URL", () => {
      const invalidData = {
        redirectTo: "not-a-url",
      };

      const result = signOutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserProfileSchema", () => {
    it("should validate correct profile update data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        image: "https://example.com/avatar.jpg",
      };

      const result = updateUserProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate partial profile update data", () => {
      const validData = {
        name: "John Doe",
      };

      const result = updateUserProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate empty profile update data", () => {
      const validData = {};

      const result = updateUserProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        name: "John Doe",
        email: "not-an-email",
      };

      const result = updateUserProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid image URL", () => {
      const invalidData = {
        name: "John Doe",
        image: "not-a-url",
      };

      const result = updateUserProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const invalidData = {
        name: "",
      };

      const result = updateUserProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject name that's too long", () => {
      const invalidData = {
        name: "a".repeat(101), // 101 characters
      };

      const result = updateUserProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});