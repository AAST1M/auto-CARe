import { describe, it, expect } from 'vitest';
import { validateEmail } from './validators';

describe('validateEmail', () => {
  it('should return valid for a correct email address', () => {
    const result = validateEmail('user@example.com');
    expect(result).toEqual({ valid: true, message: '' });
  });

  it('should return valid for an email with subdomains', () => {
    const result = validateEmail('user.name@sub.example.co.uk');
    expect(result).toEqual({ valid: true, message: '' });
  });

  it('should return invalid when email is empty', () => {
    const result = validateEmail('');
    expect(result).toEqual({ valid: false, message: 'Email is required' });
  });

  it('should return invalid when email is just whitespace', () => {
    const result = validateEmail('   ');
    expect(result).toEqual({ valid: false, message: 'Email is required' });
  });

  it('should return invalid for email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result).toEqual({ valid: false, message: 'Enter a valid email address' });
  });

  it('should return invalid for email without domain', () => {
    const result = validateEmail('user@');
    expect(result).toEqual({ valid: false, message: 'Enter a valid email address' });
  });

  it('should return invalid for email without username', () => {
    const result = validateEmail('@example.com');
    expect(result).toEqual({ valid: false, message: 'Enter a valid email address' });
  });

  it('should return invalid for email with spaces', () => {
    const result = validateEmail('user @example.com');
    expect(result).toEqual({ valid: false, message: 'Enter a valid email address' });
  });

  it('should return invalid for email with multiple @ symbols', () => {
    const result = validateEmail('user@name@example.com');
    expect(result).toEqual({ valid: false, message: 'Enter a valid email address' });
  });
});
