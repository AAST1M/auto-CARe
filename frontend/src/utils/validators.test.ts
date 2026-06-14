import { describe, it, expect } from 'vitest';
import { validatePassword } from './validators';

describe('validatePassword', () => {
  it('should return fail when password is empty', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password is required');
  });

  it('should return fail when password is less than 8 characters', () => {
    const result = validatePassword('Pass1');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must be at least 8 characters');
  });

  it('should return fail when password does not contain an uppercase letter', () => {
    const result = validatePassword('password123');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one uppercase letter');
  });

  it('should return fail when password does not contain a number', () => {
    const result = validatePassword('Password!');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one number');
  });

  it('should return ok when password meets all criteria', () => {
    const result = validatePassword('Password123!');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });
});
