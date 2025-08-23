import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a simple mock for the resend module
vi.mock("../../lib/resend", () => {
  const mockSend = vi.fn();
  return {
    resend: {
      emails: {
        send: mockSend,
      },
    },
  };
});

import {
  sendWelcomeEmail,
  sendSecurityNotificationEmail,
  testEmailConfiguration,
  isEmailConfigured,
  getEmailServiceStatus,
} from "../../lib/email/service";

// Get the mocked function
import { resend } from "../../lib/resend";
const mockSend = vi.mocked(resend.emails.send);

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default environment variables
    vi.stubEnv("RESEND_API_KEY", "test-api-key");
    vi.stubEnv("EMAIL_FROM", "test@example.com");
    vi.stubEnv("EMAIL_REPLY_TO", "support@example.com");
  });

  describe("sendWelcomeEmail", () => {
    it("should send welcome email successfully", async () => {
      mockSend.mockResolvedValue({
        data: { id: "email-123" },
        error: null,
      });

      const result = await sendWelcomeEmail("test@example.com", "John Doe");

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("email-123");
      expect(mockSend).toHaveBeenCalledWith({
        from: "Synthora <noreply@synthora.app>",
        to: ["test@example.com"],
        subject: "Welcome to Synthora!",
        html: expect.stringContaining("Welcome to Synthora, John Doe!"),
        text: expect.stringContaining("Welcome to Synthora, John Doe!"),
        replyTo: "support@synthora.app",
      });
    });

    it("should handle missing name gracefully", async () => {
      mockSend.mockResolvedValue({
        data: { id: "email-123" },
        error: null,
      });

      const result = await sendWelcomeEmail("test@example.com");

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Welcome to Synthora, test!"),
          text: expect.stringContaining("Welcome to Synthora, test!"),
        })
      );
    });

    it("should handle Resend API errors", async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: {
          message: "API rate limit exceeded",
          name: "validation_error",
        },
      });

      const result = await sendWelcomeEmail("test@example.com", "John Doe");

      expect(result.success).toBe(false);
      expect(result.error).toBe("API rate limit exceeded");
    });

    it("should handle invalid email addresses", async () => {
      const result = await sendWelcomeEmail("invalid-email", "John Doe");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid email address");
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle missing API key", async () => {
      vi.stubEnv("RESEND_API_KEY", "");

      const result = await sendWelcomeEmail("test@example.com", "John Doe");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email service not configured");
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("sendSecurityNotificationEmail", () => {
    it("should send security notification email successfully", async () => {
      mockSend.mockResolvedValue({
        data: { id: "email-456" },
        error: null,
      });

      const timestamp = new Date("2025-01-01T12:00:00Z");
      const result = await sendSecurityNotificationEmail(
        "test@example.com",
        "John Doe",
        {
          location: "San Francisco, CA",
          device: "Chrome on macOS",
          timestamp,
        }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("email-456");
      expect(mockSend).toHaveBeenCalledWith({
        from: "Synthora <noreply@synthora.app>",
        to: ["test@example.com"],
        subject: "New sign-in to your Synthora account",
        html: expect.stringContaining("Hi John Doe,"),
        text: expect.stringContaining("Hi John Doe,"),
        replyTo: "support@synthora.app",
      });
    });

    it("should handle missing optional parameters", async () => {
      mockSend.mockResolvedValue({
        data: { id: "email-456" },
        error: null,
      });

      const result = await sendSecurityNotificationEmail("test@example.com");

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Hi test,"),
          text: expect.stringContaining("Hi test,"),
        })
      );
    });

    it("should include location and device info when provided", async () => {
      mockSend.mockResolvedValue({
        data: { id: "email-456" },
        error: null,
      });

      const result = await sendSecurityNotificationEmail(
        "test@example.com",
        "John Doe",
        {
          location: "New York, NY",
          device: "Firefox on Windows",
        }
      );

      expect(result.success).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("New York, NY");
      expect(call.html).toContain("Firefox on Windows");
      expect(call.text).toContain("New York, NY");
      expect(call.text).toContain("Firefox on Windows");
    });
  });

  describe("testEmailConfiguration", () => {
    it("should send test email successfully", async () => {
      mockSend.mockResolvedValue({
        data: { id: "test-email-789" },
        error: null,
      });

      const result = await testEmailConfiguration("admin@example.com");

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("test-email-789");
      expect(mockSend).toHaveBeenCalledWith({
        from: "Synthora <noreply@synthora.app>",
        to: ["admin@example.com"],
        subject: "Synthora Email Configuration Test",
        html: expect.stringContaining("Email Configuration Test"),
        text: expect.stringContaining("Email Configuration Test"),
        replyTo: "support@synthora.app",
      });
    });
  });

  describe("isEmailConfigured", () => {
    it("should return true when API key is present", () => {
      vi.stubEnv("RESEND_API_KEY", "test-key");
      expect(isEmailConfigured()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      vi.stubEnv("RESEND_API_KEY", "");
      expect(isEmailConfigured()).toBe(false);
    });
  });

  describe("getEmailServiceStatus", () => {
    it("should return correct status information", () => {
      vi.stubEnv("RESEND_API_KEY", "test-key");
      vi.stubEnv("EMAIL_FROM", "custom@example.com");
      vi.stubEnv("EMAIL_REPLY_TO", "help@example.com");

      const status = getEmailServiceStatus();

      expect(status).toEqual({
        configured: true,
        from: "Synthora <noreply@synthora.app>",
        replyTo: "support@synthora.app",
        apiKeyPresent: true,
      });
    });

    it("should use default values when env vars are not set", () => {
      vi.stubEnv("RESEND_API_KEY", "test-key");
      vi.stubEnv("EMAIL_FROM", "");
      vi.stubEnv("EMAIL_REPLY_TO", "");

      const status = getEmailServiceStatus();

      expect(status.from).toBe("Synthora <noreply@synthora.app>");
      expect(status.replyTo).toBe("support@synthora.app");
    });
  });

  describe("error handling", () => {
    it("should handle network errors gracefully", async () => {
      mockSend.mockRejectedValue(new Error("Network error"));

      const result = await sendWelcomeEmail("test@example.com", "John Doe");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should handle unknown errors gracefully", async () => {
      mockSend.mockRejectedValue("Unknown error");

      const result = await sendWelcomeEmail("test@example.com", "John Doe");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error occurred");
    });
  });
});
