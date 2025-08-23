/**
 * Email service usage examples
 * 
 * This file demonstrates how to use the email service in different scenarios.
 * These examples can be used as reference for implementing email functionality
 * in authentication flows and other parts of the application.
 */

import { 
  sendWelcomeEmail, 
  sendSecurityNotificationEmail,
  testEmailConfiguration,
  isEmailConfigured,
  getEmailServiceStatus 
} from './service';

/**
 * Example: Send welcome email after user registration
 */
export async function handleUserRegistration(user: { email: string; name?: string | null }) {
  console.log(`Processing registration for ${user.email}`);
  
  // Check if email service is configured before attempting to send
  if (!isEmailConfigured()) {
    console.warn('Email service not configured, skipping welcome email');
    return { success: false, reason: 'Email service not configured' };
  }

  try {
    const result = await sendWelcomeEmail(user.email, user.name);
    
    if (result.success) {
      console.log(`Welcome email sent successfully to ${user.email}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.error(`Failed to send welcome email: ${result.error}`);
      return { success: false, reason: result.error };
    }
  } catch (error) {
    console.error('Unexpected error sending welcome email:', error);
    return { success: false, reason: 'Unexpected error occurred' };
  }
}

/**
 * Example: Send security notification for new device login
 */
export async function handleNewDeviceLogin(
  user: { email: string; name?: string | null },
  loginInfo: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
    timestamp?: Date;
  }
) {
  console.log(`Processing new device login for ${user.email}`);
  
  // Skip if email service is not configured
  if (!isEmailConfigured()) {
    console.warn('Email service not configured, skipping security notification');
    return { success: false, reason: 'Email service not configured' };
  }

  try {
    // Parse device info from user agent if available
    const device = loginInfo.userAgent ? parseUserAgent(loginInfo.userAgent) : undefined;
    
    const result = await sendSecurityNotificationEmail(
      user.email,
      user.name,
      {
        location: loginInfo.location,
        device,
        timestamp: loginInfo.timestamp || new Date()
      }
    );
    
    if (result.success) {
      console.log(`Security notification sent successfully to ${user.email}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.error(`Failed to send security notification: ${result.error}`);
      return { success: false, reason: result.error };
    }
  } catch (error) {
    console.error('Unexpected error sending security notification:', error);
    return { success: false, reason: 'Unexpected error occurred' };
  }
}

/**
 * Example: Test email configuration during application startup
 */
export async function validateEmailConfiguration(adminEmail?: string) {
  console.log('Validating email configuration...');
  
  const status = getEmailServiceStatus();
  console.log('Email service status:', status);
  
  if (!status.configured) {
    console.warn('Email service is not properly configured');
    return {
      configured: false,
      tested: false,
      message: 'RESEND_API_KEY environment variable is missing'
    };
  }
  
  // If admin email is provided, send a test email
  if (adminEmail) {
    console.log(`Sending test email to ${adminEmail}...`);
    
    try {
      const result = await testEmailConfiguration(adminEmail);
      
      if (result.success) {
        console.log(`Test email sent successfully: ${result.messageId}`);
        return {
          configured: true,
          tested: true,
          message: 'Email service is working correctly',
          messageId: result.messageId
        };
      } else {
        console.error(`Test email failed: ${result.error}`);
        return {
          configured: true,
          tested: false,
          message: `Test email failed: ${result.error}`
        };
      }
    } catch (error) {
      console.error('Unexpected error testing email configuration:', error);
      return {
        configured: true,
        tested: false,
        message: 'Unexpected error occurred during test'
      };
    }
  }
  
  return {
    configured: true,
    tested: false,
    message: 'Email service is configured but not tested'
  };
}

/**
 * Example: Batch email operations with error handling
 */
export async function sendBatchWelcomeEmails(
  users: Array<{ email: string; name?: string | null }>
) {
  console.log(`Sending welcome emails to ${users.length} users`);
  
  if (!isEmailConfigured()) {
    console.warn('Email service not configured, skipping batch emails');
    return {
      success: false,
      processed: 0,
      failed: users.length,
      errors: ['Email service not configured']
    };
  }
  
  const results = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  // Process emails with a small delay to avoid rate limiting
  for (const user of users) {
    try {
      const result = await sendWelcomeEmail(user.email, user.name);
      
      if (result.success) {
        results.processed++;
        console.log(`✓ Welcome email sent to ${user.email}`);
      } else {
        results.failed++;
        results.errors.push(`${user.email}: ${result.error}`);
        console.error(`✗ Failed to send welcome email to ${user.email}: ${result.error}`);
      }
      
      // Small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`${user.email}: ${errorMessage}`);
      console.error(`✗ Unexpected error sending email to ${user.email}:`, error);
    }
  }
  
  if (results.failed > 0) {
    results.success = false;
  }
  
  console.log(`Batch email results: ${results.processed} sent, ${results.failed} failed`);
  return results;
}

/**
 * Helper function to parse user agent string into readable device info
 */
function parseUserAgent(userAgent: string): string {
  // Simple user agent parsing - in production, consider using a library like 'ua-parser-js'
  const browsers = [
    { name: 'Chrome', pattern: /Chrome\/[\d.]+/ },
    { name: 'Firefox', pattern: /Firefox\/[\d.]+/ },
    { name: 'Safari', pattern: /Safari\/[\d.]+/ },
    { name: 'Edge', pattern: /Edg\/[\d.]+/ },
  ];
  
  const os = [
    { name: 'Windows', pattern: /Windows NT/ },
    { name: 'macOS', pattern: /Mac OS X/ },
    { name: 'Linux', pattern: /Linux/ },
    { name: 'iOS', pattern: /iPhone|iPad/ },
    { name: 'Android', pattern: /Android/ },
  ];
  
  const browser = browsers.find(b => b.pattern.test(userAgent))?.name || 'Unknown Browser';
  const operatingSystem = os.find(o => o.pattern.test(userAgent))?.name || 'Unknown OS';
  
  return `${browser} on ${operatingSystem}`;
}

/**
 * Example: Email service health check
 */
export async function emailHealthCheck() {
  const status = getEmailServiceStatus();
  
  return {
    timestamp: new Date().toISOString(),
    configured: status.configured,
    apiKeyPresent: status.apiKeyPresent,
    from: status.from,
    replyTo: status.replyTo,
    healthy: status.configured && status.apiKeyPresent
  };
}