import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateDOB } from './validators';

describe('validateDOB', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed date for reliable testing: 2024-05-15
    vi.setSystemTime(new Date('2024-05-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return error for empty string', () => {
    const result = validateDOB('');
    expect(result).toEqual({ valid: false, message: 'Date of birth is required' });
  });

  it('should return error for users under 18', () => {
    // Exactly 17 years and 364 days old
    const result = validateDOB('2006-05-16');
    expect(result).toEqual({ valid: false, message: 'You must be at least 18 years old' });

    // 10 years old
    const result2 = validateDOB('2014-01-01');
    expect(result2).toEqual({ valid: false, message: 'You must be at least 18 years old' });
  });

  it('should pass for users exactly 18 years old today', () => {
    const result = validateDOB('2006-05-15');
    expect(result).toEqual({ valid: true, message: '' });
  });

  it('should pass for users over 18 but under 120', () => {
    // 30 years old
    const result = validateDOB('1994-01-01');
    expect(result).toEqual({ valid: true, message: '' });
  });

  it('should fail for users over 120 years old', () => {
    const result = validateDOB('1903-05-14');
    expect(result).toEqual({ valid: false, message: 'Please enter a valid date of birth' });
  });

  it('should handle leap year birthdays correctly', () => {
    vi.setSystemTime(new Date('2024-02-28T12:00:00Z'));
    // Born on leap day 2004, turning 20 in 2024.
    // On Feb 28, they are still 19
    const resultBefore = validateDOB('2004-02-29');
    expect(resultBefore).toEqual({ valid: true, message: '' });
  });

  it('should fail for invalid date strings', () => {
    const result = validateDOB('invalid-date');
    expect(result).toEqual({ valid: false, message: 'Please enter a valid date of birth' });
  });
});
