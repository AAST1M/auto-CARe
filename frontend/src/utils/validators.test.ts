import { describe, it, expect } from 'vitest';
import { validateNationalId } from './validators';

describe('validateNationalId', () => {
  it('should pass for exactly 14 digits', () => {
    const result = validateNationalId('12345678901234');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  it('should pass for 14 digits with spaces', () => {
    const result = validateNationalId(' 12345678901234 ');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');

    const resultInnerSpaces = validateNationalId('123 456 7890 1234');
    expect(resultInnerSpaces.valid).toBe(true);
    expect(resultInnerSpaces.message).toBe('');
  });

  it('should fail if empty or only spaces', () => {
    const emptyResult = validateNationalId('');
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.message).toBe('National ID / License ID is required');

    const spacesResult = validateNationalId('   ');
    expect(spacesResult.valid).toBe(false);
    expect(spacesResult.message).toBe('National ID / License ID is required');
  });

  it('should fail for less than 14 digits', () => {
    const result = validateNationalId('1234567890123'); // 13 digits
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Enter your 14-digit National ID number');
  });

  it('should fail for more than 14 digits', () => {
    const result = validateNationalId('123456789012345'); // 15 digits
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Enter your 14-digit National ID number');
  });

  it('should fail if it contains non-digit characters', () => {
    const resultLetters = validateNationalId('1234567890123a');
    expect(resultLetters.valid).toBe(false);
    expect(resultLetters.message).toBe('Enter your 14-digit National ID number');

    const resultSymbols = validateNationalId('1234567890123!');
    expect(resultSymbols.valid).toBe(false);
    expect(resultSymbols.message).toBe('Enter your 14-digit National ID number');
  });
});
