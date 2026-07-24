import { describe, it, expect } from 'vitest';
import { validateNationalId } from './validators';

describe('validateNationalId', () => {
  it('should return valid for a 14-digit ID', () => {
    const result = validateNationalId('12345678901234');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  it('should return valid for a 14-digit ID with spaces', () => {
    const result = validateNationalId('123 4567 890 1234');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  it('should return invalid for an empty string', () => {
    const result = validateNationalId('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('National ID / License ID is required');
  });

  it('should return invalid for a string with only whitespace', () => {
    const result = validateNationalId('   ');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('National ID / License ID is required');
  });

  it('should return invalid for less than 14 digits', () => {
    const result = validateNationalId('1234567890123');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Enter your 14-digit National ID number');
  });

  it('should return invalid for more than 14 digits', () => {
    const result = validateNationalId('123456789012345');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Enter your 14-digit National ID number');
  });

  it('should return invalid for an ID with non-digit characters', () => {
    const result = validateNationalId('1234567890123a');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Enter your 14-digit National ID number');
  });
});
