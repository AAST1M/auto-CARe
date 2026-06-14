import { describe, it, expect } from 'vitest';
import { validatePhone } from './validators';

describe('validatePhone', () => {
  it('should validate local Egyptian numbers (010, 011, 012, 015)', () => {
    expect(validatePhone('01012345678').valid).toBe(true);
    expect(validatePhone('01112345678').valid).toBe(true);
    expect(validatePhone('01212345678').valid).toBe(true);
    expect(validatePhone('01512345678').valid).toBe(true);
  });

  it('should validate international Egyptian numbers (+20 or 20)', () => {
    expect(validatePhone('+201012345678').valid).toBe(true);
    expect(validatePhone('201112345678').valid).toBe(true);
    expect(validatePhone('+201212345678').valid).toBe(true);
    expect(validatePhone('201512345678').valid).toBe(true);
  });

  it('should handle spaces and dashes in valid numbers', () => {
    expect(validatePhone('010 1234 5678').valid).toBe(true);
    expect(validatePhone('011-1234-5678').valid).toBe(true);
    expect(validatePhone('+20 12 1234 5678').valid).toBe(true);
    expect(validatePhone('20-15-1234-5678').valid).toBe(true);
  });

  it('should fail for empty or whitespace-only strings', () => {
    expect(validatePhone('').valid).toBe(false);
    expect(validatePhone('   ').valid).toBe(false);
    expect(validatePhone('').message).toBe('Phone number is required');
  });

  it('should fail for invalid prefixes', () => {
    expect(validatePhone('01312345678').valid).toBe(false); // 013 is not valid
    expect(validatePhone('01912345678').valid).toBe(false);
    expect(validatePhone('+201312345678').valid).toBe(false);
  });

  it('should fail for incorrect lengths', () => {
    expect(validatePhone('0101234567').valid).toBe(false); // 10 digits
    expect(validatePhone('010123456789').valid).toBe(false); // 12 digits
    expect(validatePhone('+20101234567').valid).toBe(false); // 12 digits total
  });

  it('should fail for non-numeric characters', () => {
    expect(validatePhone('0101234abcd').valid).toBe(false);
    expect(validatePhone('+20101234xyz').valid).toBe(false);
  });
});
