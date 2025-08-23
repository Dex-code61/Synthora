# Email Service Module

This module provides comprehensive email functionality for the Synthora application, specifically designed for authentication-related notifications including welcome emails and security notifications.

## Features

- ✅ **Welcome Emails**: Beautiful HTML emails for new user registrations
- ✅ **Security Notifications**: Alerts for new device/location logins
- ✅ **Email Templates**: Professional, responsive email templates
- ✅ **Error Handling**: Graceful error handling with detailed logging
- ✅ **Configuration Validation**: Built-in configuration checking
- ✅ **Test Utilities**: Email configuration testing functionality
- ✅ **Type Safety**: Full TypeScript support with proper types

## Quick Start

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Required
RESEND_API_KEY="your-resend-api-key"

# Optional (will use defaults if not provided)
EMAIL_FROM="Your App <noreply@yourapp.com>"
EMAIL_REPLY_TO="support@yourapp.com"
```

### 2. Basic Usage

```typescript
import { sendWelcomeEmail, sendSecurityNotificationEmail } from '@/lib/email';

// Send welcome email to new user
const result = await sendWelcomeEmail('user@example.com', 'John Doe');
if (result.success) {
  console.log('Welcome email sent:', result.messageId);
} else {
  console.error('Failed to send email:', result.error);
}

// Send security notification
await sendSecurityNotificationEmail(
  'user@example.com',
  'John Doe',
  {
    location: 'San Francisco, CA',
    device: 'Chrome on macOS',
    timestamp: new Date()
  }
);
```

## API Reference

### Core Functions

#### `sendWelcomeEmail(email: string, name?: string | null): Promise<EmailResult>`

Sends a welcome email to a new user.

**Parameters:**
- `email`: User's email address
- `name`: User's display name (optional)

**Returns:** `EmailResult` with success status and message ID or error

#### `sendSecurityNotificationEmail(email: string, name?: string | null, options?: SecurityOptions): Promise<EmailResult>`

Sends a security notification email for new device/location logins.

**Parameters:**
- `email`: User's email address
- `name`: User's display name (optional)
- `options`: Security notification options
  - `location`: Login location (optional)
  - `device`: Device information (optional)
  - `timestamp`: Login timestamp (optional, defaults to now)

**Returns:** `EmailResult` with success status and message ID or error

#### `testEmailConfiguration(testEmail: string): Promise<EmailResult>`

Tests the email configuration by sending a test email.

**Parameters:**
- `testEmail`: Email address to send test email to

**Returns:** `EmailResult` with success status and message ID or error

### Utility Functions

#### `isEmailConfigured(): boolean`

Checks if the email service is properly configured.

**Returns:** `true` if RESEND_API_KEY is set, `false` otherwise

#### `getEmailServiceStatus(): EmailServiceStatus`

Gets detailed information about the email service configuration.

**Returns:** Object with configuration details:
```typescript
{
  configured: boolean;
  apiKeyPresent: boolean;
  from: string;
  replyTo: string;
}
```

## Types

### `EmailResult`

```typescript
interface EmailResult {
  success: boolean;
  messageId?: string;  // Present when success is true
  error?: string;      // Present when success is false
}
```

### `SecurityNotificationData`

```typescript
interface SecurityNotificationData {
  name: string;
  email: string;
  location?: string;
  device?: string;
  timestamp: Date;
}
```

## Email Templates

The module includes two professionally designed email templates:

### Welcome Email Template
- Modern, responsive design
- Branded with Synthora styling
- Includes call-to-action button
- Personalized greeting
- Mobile-friendly layout

### Security Notification Template
- Security-focused design with warning colors
- Detailed login information display
- Clear security advice
- Links to GitHub security settings
- Professional layout with proper branding

## Error Handling

The email service includes comprehensive error handling:

- **Configuration Errors**: Gracefully handles missing API keys
- **Validation Errors**: Validates email addresses before sending
- **API Errors**: Handles Resend API errors with detailed messages
- **Network Errors**: Catches and reports network-related issues
- **Logging**: Comprehensive logging for debugging and monitoring

## Testing

The module includes comprehensive test coverage:

```bash
# Run email service tests
npm run test -- src/test/email --run

# Run with coverage
npm run test -- src/test/email --coverage
```

## Examples

See `src/lib/email/examples.ts` for detailed usage examples including:

- User registration flow
- New device login handling
- Configuration validation
- Batch email operations
- Health checks

## Configuration

### Default Values

If environment variables are not set, the service uses these defaults:

- `EMAIL_FROM`: `"Synthora <noreply@synthora.app>"`
- `EMAIL_REPLY_TO`: `"support@synthora.app"`

### Resend Configuration

The service uses the Resend email API. To get started:

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add the API key to your environment variables
4. Verify your domain (for production use)

## Security Considerations

- **API Key Protection**: Never expose your Resend API key in client-side code
- **Email Validation**: All email addresses are validated before sending
- **Rate Limiting**: Consider implementing rate limiting for batch operations
- **Content Security**: Email templates are designed to be safe and professional
- **Privacy**: Only necessary user information is included in emails

## Troubleshooting

### Common Issues

1. **"Email service not configured"**
   - Check that `RESEND_API_KEY` is set in your environment
   - Verify the API key is valid

2. **"Invalid email address"**
   - Ensure email addresses are properly formatted
   - Check for typos in email addresses

3. **API rate limiting**
   - Implement delays between batch email sends
   - Consider using a queue for high-volume operations

4. **Template rendering issues**
   - Check that all required data is provided to templates
   - Verify environment variables for URLs are set

### Debug Mode

Enable debug logging by setting the log level:

```bash
NODE_ENV=development
```

This will provide detailed logging for email operations and error diagnosis.

## Contributing

When contributing to the email service:

1. Add tests for new functionality
2. Update this README for new features
3. Follow the existing error handling patterns
4. Ensure templates are mobile-responsive
5. Test with real email addresses in development

## License

This email service module is part of the Synthora application and follows the same license terms.