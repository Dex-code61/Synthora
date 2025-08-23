/**
 * Email service module
 * 
 * This module provides email functionality for authentication-related notifications
 * including welcome emails and security notifications.
 */

export {
  sendWelcomeEmail,
  sendSecurityNotificationEmail,
  testEmailConfiguration,
  isEmailConfigured,
  getEmailServiceStatus,
  type EmailResult
} from './service';

export {
  getWelcomeEmailTemplate,
  getSecurityNotificationTemplate,
  type EmailTemplate,
  type WelcomeEmailData,
  type SecurityNotificationData
} from './templates';