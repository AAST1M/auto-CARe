import { describe, it, expect } from 'vitest';
import { validateEmail } from './validators';

describe('validateEmail', () => {
  it('should validate standard email addresses', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user_name@example.com',
      'user+tag@example.com',
      'user@subdomain.example.com',
      '123user@example.com'
    ];

    validEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });
  });

  it('should fail when email is empty or only whitespace', () => {
    const emptyEmails = ['', '   ', '\t', '\n'];

    emptyEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Email is required');
    });
  });

  it('should fail when email format is invalid', () => {
    // The current regex is: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // It requires:
    // 1. One or more characters that are not space or @
    // 2. An @ symbol
    // 3. One or more characters that are not space or @
    // 4. A dot
    // 5. One or more characters that are not space or @
    const invalidEmails = [
      'userexample.com',        // missing @
      'user@',                  // missing domain
      '@example.com',           // missing local part
      'user@example',           // missing dot (TLD separator)
      'user @example.com',      // space in local part
      'user@ example.com',      // space in domain
      'user@example. com',      // space after dot
      'user@@example.com',      // double @
    ];

    invalidEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Enter a valid email address');
    });
  });
});
