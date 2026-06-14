import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateDOB } from './validators';

describe('validateDOB', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fails if dob is empty', () => {
    expect(validateDOB('')).toEqual({ valid: false, message: 'Date of birth is required' });
  });

  it('fails if date is invalid', () => {
    expect(validateDOB('invalid-date')).toEqual({ valid: false, message: 'Please enter a valid date of birth' });
  });

  it('fails if user is under 18', () => {
    // Exactly 17 years old
    expect(validateDOB('2007-05-15')).toEqual({ valid: false, message: 'You must be at least 18 years old' });
    // Almost 18 (tomorrow is their 18th birthday)
    expect(validateDOB('2006-05-16')).toEqual({ valid: false, message: 'You must be at least 18 years old' });
  });

  it('fails if age is > 120', () => {
    expect(validateDOB('1900-01-01')).toEqual({ valid: false, message: 'Please enter a valid date of birth' });
  });

  it('passes if user is exactly 18', () => {
    expect(validateDOB('2006-05-15')).toEqual({ valid: true, message: '' });
  });

  it('passes if user is > 18 and <= 120', () => {
    expect(validateDOB('1990-01-01')).toEqual({ valid: true, message: '' });
    expect(validateDOB('1904-05-15')).toEqual({ valid: true, message: '' });
  });
});
