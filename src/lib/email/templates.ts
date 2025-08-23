/**
 * Email templates for authentication-related notifications
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface SecurityNotificationData {
  name: string;
  email: string;
  location?: string;
  device?: string;
  timestamp: Date;
}

/**
 * Welcome email template for new users
 */
export function getWelcomeEmailTemplate(data: WelcomeEmailData): EmailTemplate {
  const { name, email } = data;
  const displayName = name || email.split('@')[0];

  return {
    subject: 'Welcome to Synthora!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Synthora</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container"></div>       <div class="header">
              <div class="logo">Synthora</div>
            </div>
            <div class="content">
              <h1>Welcome to Synthora, ${displayName}! 🎉</h1>
              <p>Thank you for signing up with your GitHub account. We're excited to have you on board!</p>
              <p>You can now access all the features of Synthora and start exploring what we have to offer.</p>
              <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard" class="button">
                Get Started
              </a>
              <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>This email was sent to ${email}</p>
              <p>© 2025 Synthora. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to Synthora, ${displayName}!

Thank you for signing up with your GitHub account. We're excited to have you on board!

You can now access all the features of Synthora and start exploring what we have to offer.

Get started: ${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard

If you have any questions or need help getting started, don't hesitate to reach out to our support team.

This email was sent to ${email}
© 2025 Synthora. All rights reserved.
    `.trim()
  };
}

/**
 * Security notification email template for new device/location logins
 */
export function getSecurityNotificationTemplate(data: SecurityNotificationData): EmailTemplate {
  const { name, email, location, device, timestamp } = data;
  const displayName = name || email.split('@')[0];
  const formattedDate = timestamp.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return {
    subject: 'New sign-in to your Synthora account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Notification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .content { background: #fef3c7; border: 1px solid #f59e0b; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .alert-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: 600; color: #374151; }
            .detail-value { color: #6b7280; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Synthora</div>
            </div>
            <div class="content">
              <div class="alert-icon">🔐</div>
              <h1>New sign-in detected</h1>
              <p>Hi ${displayName},</p>
              <p>We detected a new sign-in to your Synthora account. If this was you, you can safely ignore this email.</p>
              
              <div class="details">
                <h3>Sign-in details:</h3>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                ${location ? `
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${location}</span>
                </div>
                ` : ''}
                ${device ? `
                <div class="detail-row">
                  <span class="detail-label">Device:</span>
                  <span class="detail-value">${device}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Account:</span>
                  <span class="detail-value">${email}</span>
                </div>
              </div>

              <p><strong>If this wasn't you:</strong></p>
              <ul>
                <li>Someone else may have access to your account</li>
                <li>Change your GitHub password immediately</li>
                <li>Review your GitHub account security settings</li>
              </ul>

              <a href="https://github.com/settings/security" class="button">
                Secure My Account
              </a>
            </div>
            <div class="footer">
              <p>This email was sent to ${email}</p>
              <p>© 2025 Synthora. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Security Alert - New sign-in detected

Hi ${displayName},

We detected a new sign-in to your Synthora account. If this was you, you can safely ignore this email.

Sign-in details:
- Time: ${formattedDate}
${location ? `- Location: ${location}` : ''}
${device ? `- Device: ${device}` : ''}
- Account: ${email}

If this wasn't you:
- Someone else may have access to your account
- Change your GitHub password immediately
- Review your GitHub account security settings

Secure your account: https://github.com/settings/security

This email was sent to ${email}
© 2025 Synthora. All rights reserved.
    `.trim()
  };
}