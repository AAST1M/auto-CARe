import { describe, it, expect } from 'vitest';
import { validatePassword } from './validators';

describe('validatePassword', () => {
  it('should fail if password is empty', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password is required');
  });

  it('should fail if password is less than 8 characters', () => {
    const result = validatePassword('Pass1');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must be at least 8 characters');
  });

  it('should fail if password contains no uppercase letter', () => {
    const result = validatePassword('password123');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one uppercase letter');
  });

  it('should fail if password contains no number', () => {
    const result = validatePassword('Password!');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one number');
  });

  it('should pass if password is valid', () => {
    const result = validatePassword('ValidPass123!');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });
});
