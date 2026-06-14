import { describe, it, expect } from 'vitest';
import { validatePlateNumber } from './validators';

describe('validatePlateNumber', () => {
  it('should fail if plate number is empty', () => {
    expect(validatePlateNumber('')).toEqual({ valid: false, message: 'Plate number is required' });
    expect(validatePlateNumber('   ')).toEqual({ valid: false, message: 'Plate number is required' });
  });

  describe('Latin plate numbers', () => {
    it('should pass for valid 3 letters and 4 digits format', () => {
      expect(validatePlateNumber('ABC 1234')).toEqual({ valid: true, message: '' });
      expect(validatePlateNumber('XYZ 9876')).toEqual({ valid: true, message: '' });
    });

    it('should pass for valid 2 letters and 4 digits format', () => {
      expect(validatePlateNumber('AB 1234')).toEqual({ valid: true, message: '' });
    });

    it('should pass for valid 3 letters and 3 digits format', () => {
      expect(validatePlateNumber('ABC 123')).toEqual({ valid: true, message: '' });
    });

    it('should pass for valid 2 letters and 3 digits format', () => {
      expect(validatePlateNumber('AB 123')).toEqual({ valid: true, message: '' });
    });

    it('should pass without space between letters and digits', () => {
      expect(validatePlateNumber('ABC1234')).toEqual({ valid: true, message: '' });
      expect(validatePlateNumber('AB123')).toEqual({ valid: true, message: '' });
    });

    it('should handle lowercases properly', () => {
      // The validator normalizes uppercase internally but validates the regex against trimmed value which is casted to uppercase.
      expect(validatePlateNumber('abc 1234')).toEqual({ valid: true, message: '' });
      expect(validatePlateNumber('ab 123')).toEqual({ valid: true, message: '' });
    });
  });

  describe('Numeric plate numbers', () => {
    it('should pass for valid 5 digits format', () => {
      expect(validatePlateNumber('12345')).toEqual({ valid: true, message: '' });
    });

    it('should pass for valid 6 digits format', () => {
      expect(validatePlateNumber('123456')).toEqual({ valid: true, message: '' });
    });
  });

  describe('Invalid plate numbers', () => {
    it('should fail for too few letters', () => {
      expect(validatePlateNumber('A 1234')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
    });

    it('should fail for too many letters', () => {
      expect(validatePlateNumber('ABCD 1234')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
    });

    it('should fail for too few digits in Latin format', () => {
      expect(validatePlateNumber('ABC 12')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
    });

    it('should fail for too many digits in Latin format', () => {
      expect(validatePlateNumber('ABC 12345')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
    });

    it('should fail for numeric format with too few digits', () => {
      expect(validatePlateNumber('1234')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
    });

    it('should fail for numeric format with too many digits', () => {
      expect(validatePlateNumber('1234567')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
    });

    it('should fail for completely invalid formats', () => {
      expect(validatePlateNumber('invalid')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
      expect(validatePlateNumber('!@#$')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
      expect(validatePlateNumber('123 ABC')).toEqual({
        valid: false,
        message: 'Enter a valid plate number (e.g. ABC 1234 or 12345)',
      });
    });
  });
});
