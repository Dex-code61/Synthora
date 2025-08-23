import { Resend } from 'resend';

// Validate Resend API key on initialization
if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY environment variable is not set. Email functionality will be disabled.');
}

// Initialize Resend client with API key
export const resend = new Resend(process.env.RESEND_API_KEY);

// Export configuration for use in other modules
export const RESEND_CONFIG = {
  apiKey: process.env.RESEND_API_KEY,
  isConfigured: Boolean(process.env.RESEND_API_KEY),
} as const;
