import { describe, it, expect, vi } from 'vitest';
import { 
  getWelcomeEmailTemplate, 
  getSecurityNotificationTemplate,
  type WelcomeEmailData,
  type SecurityNotificationData
} from '../../lib/email/templates';

// Mock environment variables
vi.stubEnv('BETTER_AUTH_URL', 'https://example.com');

describe('Email Templates', () => {
  describe('getWelcomeEmailTemplate', () => {
    it('should generate welcome email template with name', () => {
      const data: WelcomeEmailData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const template = getWelcomeEmailTemplate(data);

      expect(template.subject).toBe('Welcome to Synthora!');
      expect(template.html).toContain('Welcome to Synthora, John Doe!');
      expect(template.html).toContain('john@example.com');
      expect(template.html).toContain('https://example.com/dashboard');
      expect(template.text).toContain('Welcome to Synthora, John Doe!');
      expect(template.text).toContain('john@example.com');
      expect(template.text).toContain('https://example.com/dashboard');
    });

    it('should generate welcome email template without name', () => {
      const data: WelcomeEmailData = {
        name: '',
        email: 'test@example.com'
      };

      const template = getWelcomeEmailTemplate(data);

      expect(template.subject).toBe('Welcome to Synthora!');
      expect(template.html).toContain('Welcome to Synthora, test!');
      expect(template.text).toContain('Welcome to Synthora, test!');
    });

    it('should use fallback URL when BETTER_AUTH_URL is not set', () => {
      vi.stubEnv('BETTER_AUTH_URL', '');
      
      const data: WelcomeEmailData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const template = getWelcomeEmailTemplate(data);

      expect(template.html).toContain('http://localhost:3000/dashboard');
      expect(template.text).toContain('http://localhost:3000/dashboard');
    });

    it('should contain required HTML structure', () => {
      const data: WelcomeEmailData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const template = getWelcomeEmailTemplate(data);

      // Check for essential HTML elements
      expect(template.html).toContain('<!DOCTYPE html>');
      expect(template.html).toContain('<html>');
      expect(template.html).toContain('<head>');
      expect(template.html).toContain('<body>');
      expect(template.html).toContain('<style>');
      expect(template.html).toContain('class="container"');
      expect(template.html).toContain('class="button"');
    });

    it('should have proper text fallback', () => {
      const data: WelcomeEmailData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const template = getWelcomeEmailTemplate(data);

      // Text version should not contain HTML tags
      expect(template.text).not.toContain('<');
      expect(template.text).not.toContain('>');
      expect(template.text).toContain('Welcome to Synthora, John Doe!');
      expect(template.text).toContain('© 2025 Synthora');
    });
  });

  describe('getSecurityNotificationTemplate', () => {
    it('should generate security notification with all details', () => {
      const timestamp = new Date('2025-01-15T14:30:00Z');
      const data: SecurityNotificationData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        location: 'San Francisco, CA',
        device: 'Chrome on macOS',
        timestamp
      };

      const template = getSecurityNotificationTemplate(data);

      expect(template.subject).toBe('New sign-in to your Synthora account');
      expect(template.html).toContain('Hi Jane Smith,');
      expect(template.html).toContain('San Francisco, CA');
      expect(template.html).toContain('Chrome on macOS');
      expect(template.html).toContain('jane@example.com');
      expect(template.text).toContain('Hi Jane Smith,');
      expect(template.text).toContain('San Francisco, CA');
      expect(template.text).toContain('Chrome on macOS');
    });

    it('should generate security notification without optional details', () => {
      const timestamp = new Date('2025-01-15T14:30:00Z');
      const data: SecurityNotificationData = {
        name: '',
        email: 'user@example.com',
        timestamp
      };

      const template = getSecurityNotificationTemplate(data);

      expect(template.subject).toBe('New sign-in to your Synthora account');
      expect(template.html).toContain('Hi user,');
      expect(template.html).not.toContain('Location:');
      expect(template.html).not.toContain('Device:');
      expect(template.text).toContain('Hi user,');
      expect(template.text).not.toContain('Location:');
      expect(template.text).not.toContain('Device:');
    });

    it('should format timestamp correctly', () => {
      const timestamp = new Date('2025-01-15T14:30:00Z');
      const data: SecurityNotificationData = {
        name: 'John Doe',
        email: 'john@example.com',
        timestamp
      };

      const template = getSecurityNotificationTemplate(data);

      // Check that timestamp is formatted in a readable way
      const expectedFormat = timestamp.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      expect(template.html).toContain(expectedFormat);
      expect(template.text).toContain(expectedFormat);
    });

    it('should contain security-related styling and content', () => {
      const data: SecurityNotificationData = {
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: new Date()
      };

      const template = getSecurityNotificationTemplate(data);

      // Check for security alert styling
      expect(template.html).toContain('background: #fef3c7'); // Warning background
      expect(template.html).toContain('border: 1px solid #f59e0b'); // Warning border
      expect(template.html).toContain('🔐'); // Security icon
      expect(template.html).toContain('New sign-in detected');
      expect(template.html).toContain('If this wasn\'t you');
      expect(template.html).toContain('https://github.com/settings/security');
    });

    it('should include proper security advice', () => {
      const data: SecurityNotificationData = {
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: new Date()
      };

      const template = getSecurityNotificationTemplate(data);

      const securityAdvice = [
        'Change your GitHub password immediately',
        'Review your GitHub account security settings',
        'Someone else may have access to your account'
      ];

      securityAdvice.forEach(advice => {
        expect(template.html).toContain(advice);
        expect(template.text).toContain(advice);
      });
    });

    it('should have proper text fallback for security notification', () => {
      const data: SecurityNotificationData = {
        name: 'John Doe',
        email: 'john@example.com',
        location: 'New York, NY',
        device: 'Firefox on Windows',
        timestamp: new Date()
      };

      const template = getSecurityNotificationTemplate(data);

      // Text version should not contain HTML tags
      expect(template.text).not.toContain('<');
      expect(template.text).not.toContain('>');
      expect(template.text).toContain('Security Alert - New sign-in detected');
      expect(template.text).toContain('New York, NY');
      expect(template.text).toContain('Firefox on Windows');
      expect(template.text).toContain('https://github.com/settings/security');
    });
  });

  describe('template consistency', () => {
    it('should have consistent branding across templates', () => {
      const welcomeTemplate = getWelcomeEmailTemplate({
        name: 'Test User',
        email: 'test@example.com'
      });

      const securityTemplate = getSecurityNotificationTemplate({
        name: 'Test User',
        email: 'test@example.com',
        timestamp: new Date()
      });

      // Both should contain Synthora branding
      expect(welcomeTemplate.html).toContain('Synthora');
      expect(securityTemplate.html).toContain('Synthora');
      expect(welcomeTemplate.text).toContain('© 2025 Synthora');
      expect(securityTemplate.text).toContain('© 2025 Synthora');
    });

    it('should have consistent footer information', () => {
      const email = 'test@example.com';
      
      const welcomeTemplate = getWelcomeEmailTemplate({
        name: 'Test User',
        email
      });

      const securityTemplate = getSecurityNotificationTemplate({
        name: 'Test User',
        email,
        timestamp: new Date()
      });

      // Both should contain email in footer
      expect(welcomeTemplate.html).toContain(`This email was sent to ${email}`);
      expect(securityTemplate.html).toContain(`This email was sent to ${email}`);
      expect(welcomeTemplate.text).toContain(`This email was sent to ${email}`);
      expect(securityTemplate.text).toContain(`This email was sent to ${email}`);
    });
  });
});