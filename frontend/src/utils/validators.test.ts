import { describe, it, expect } from 'vitest';
import { validateEmail } from './validators';

describe('validateEmail', () => {
  it('should return error for empty or whitespace-only email', () => {
    const emptyResult = validateEmail('');
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.message).toBe('Email is required');

    const whitespaceResult = validateEmail('   ');
    expect(whitespaceResult.valid).toBe(false);
    expect(whitespaceResult.message).toBe('Email is required');
  });

  it('should return ok for valid email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@sub.domain.co.uk',
      'a@b.c', // Although minimal, it matches the simple regex [^\s@]+@[^\s@]+\.[^\s@]+
      '123@123.com',
    ];

    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });
  });

  it('should return error for invalid email formats', () => {
    const invalidEmails = [
      'test', // missing @ and domain
      'test@', // missing domain
      'test@domain', // missing . extension
      '@domain.com', // missing local part
      'test @example.com', // contains space
      'test@example .com', // contains space
      'test@example.com ', // trailing space (should be trimmed by user, but validateEmail doesn't trim before checking regex, though the empty check trims)
    ];

    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Enter a valid email address');
    });
  });
});
