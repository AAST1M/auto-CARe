import { describe, it, expect } from 'vitest';
import { validatePassword } from './validators';

describe('validatePassword', () => {
  it('should return failure if password is empty', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password is required');
  });

  it('should return failure if password is less than 8 characters', () => {
    const result = validatePassword('Aa12345');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must be at least 8 characters');
  });

  it('should return failure if password does not contain an uppercase letter', () => {
    const result = validatePassword('abcdef12345');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one uppercase letter');
  });

  it('should return failure if password does not contain a number', () => {
    const result = validatePassword('Abcdefghij');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one number');
  });

  it('should return success for a valid password', () => {
    const result = validatePassword('Abcdef12345');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });
});
