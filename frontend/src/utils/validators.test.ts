import { describe, it, expect } from 'vitest';
import { validatePhone } from './validators';

describe('validatePhone', () => {
  it('returns false for empty phone numbers', () => {
    expect(validatePhone('')).toEqual({ valid: false, message: 'Phone number is required' });
    expect(validatePhone('   ')).toEqual({ valid: false, message: 'Phone number is required' });
  });

  it('validates correct local Egyptian phone numbers', () => {
    expect(validatePhone('01012345678').valid).toBe(true);
    expect(validatePhone('01112345678').valid).toBe(true);
    expect(validatePhone('01212345678').valid).toBe(true);
    expect(validatePhone('01512345678').valid).toBe(true);
  });

  it('validates correct international Egyptian phone numbers', () => {
    expect(validatePhone('+201012345678').valid).toBe(true);
    expect(validatePhone('+201112345678').valid).toBe(true);
    expect(validatePhone('+201212345678').valid).toBe(true);
    expect(validatePhone('+201512345678').valid).toBe(true);
    expect(validatePhone('201012345678').valid).toBe(true);
  });

  it('ignores spaces and dashes', () => {
    expect(validatePhone('010 1234 5678').valid).toBe(true);
    expect(validatePhone('010-1234-5678').valid).toBe(true);
    expect(validatePhone('+20 10-1234-5678').valid).toBe(true);
  });

  it('fails for invalid prefixes', () => {
    expect(validatePhone('01312345678').valid).toBe(false);
    expect(validatePhone('01412345678').valid).toBe(false);
    expect(validatePhone('01912345678').valid).toBe(false);
  });

  it('fails for incorrect length', () => {
    expect(validatePhone('0101234567').valid).toBe(false);
    expect(validatePhone('010123456789').valid).toBe(false);
    expect(validatePhone('+20101234567').valid).toBe(false);
  });

  it('fails for non-numeric characters (other than spaces/dashes)', () => {
    expect(validatePhone('0101234567a').valid).toBe(false);
    expect(validatePhone('0101234567#').valid).toBe(false);
  });

  it('returns correct error message for invalid formats', () => {
    expect(validatePhone('123')).toEqual({
      valid: false,
      message: 'Enter a valid Egyptian phone number (e.g. 01012345678)'
    });
  });
});
