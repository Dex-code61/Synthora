import { resend } from '../resend';
import { 
  getWelcomeEmailTemplate, 
  getSecurityNotificationTemplate,
  type WelcomeEmailData,
  type SecurityNotificationData 
} from './templates';

/**
 * Email service configuration
 */
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Synthora <noreply@synthora.app>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@synthora.app',
} as const;

/**
 * Email sending result interface
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Base email sending function with error handling
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
  from = EMAIL_CONFIG.from,
  replyTo = EMAIL_CONFIG.replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  try {
    // Validate environment
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return {
        success: false,
        error: 'Invalid email address'
      };
    }

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
      replyTo,
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }

    if (data?.id) {
      console.log(`Email sent successfully: ${data.id}`);
      return {
        success: true,
        messageId: data.id
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred'
    };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string, 
  name?: string | null
): Promise<EmailResult> {
  try {
    const emailData: WelcomeEmailData = {
      email,
      name: name || ''
    };

    const template = getWelcomeEmailTemplate(emailData);
    
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log(`Welcome email sent to ${email}`);
    } else {
      console.error(`Failed to send welcome email to ${email}:`, result.error);
    }

    return result;

  } catch (error) {
    console.error('Welcome email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email'
    };
  }
}

/**
 * Send security notification email for new device/location logins
 */
export async function sendSecurityNotificationEmail(
  email: string,
  name?: string | null,
  options?: {
    location?: string;
    device?: string;
    timestamp?: Date;
  }
): Promise<EmailResult> {
  try {
    const emailData: SecurityNotificationData = {
      email,
      name: name || '',
      location: options?.location,
      device: options?.device,
      timestamp: options?.timestamp || new Date()
    };

    const template = getSecurityNotificationTemplate(emailData);
    
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log(`Security notification sent to ${email}`);
    } else {
      console.error(`Failed to send security notification to ${email}:`, result.error);
    }

    return result;

  } catch (error) {
    console.error('Security notification email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send security notification'
    };
  }
}

/**
 * Test email configuration by sending a test email
 */
export async function testEmailConfiguration(testEmail: string): Promise<EmailResult> {
  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'Synthora Email Configuration Test',
      html: `
        <h1>Email Configuration Test</h1>
        <p>This is a test email to verify that your Synthora email configuration is working correctly.</p>
        <p>If you received this email, your email service is properly configured!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: `
Email Configuration Test

This is a test email to verify that your Synthora email configuration is working correctly.

If you received this email, your email service is properly configured!

Timestamp: ${new Date().toISOString()}
      `.trim()
    });

    return result;

  } catch (error) {
    console.error('Email configuration test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email configuration test failed'
    };
  }
}

/**
 * Utility function to check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Get email service status and configuration info
 */
export function getEmailServiceStatus() {
  return {
    configured: isEmailConfigured(),
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    apiKeyPresent: Boolean(process.env.RESEND_API_KEY),
  };
}