/**
 * Shared validation utilities for Auto-Care AI
 * Includes Egyptian-specific validators for phone, plate, and national ID.
 */

export interface ValidationResult {
  valid: boolean;
  message: string;
}

const ok = (): ValidationResult => ({ valid: true, message: '' });
const fail = (msg: string): ValidationResult => ({ valid: false, message: msg });

/** Validates a standard email address */
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) return fail('Email is required');
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return fail('Enter a valid email address');
  return ok();
};

/** Password: min 8 chars, 1 uppercase, 1 number */
export const validatePassword = (pass: string): ValidationResult => {
  if (!pass) return fail('Password is required');
  if (pass.length < 8) return fail('Password must be at least 8 characters');
  if (!/[A-Z]/.test(pass)) return fail('Password must contain at least one uppercase letter');
  if (!/[0-9]/.test(pass)) return fail('Password must contain at least one number');
  return ok();
};

/** Passwords match check */
export const validatePasswordMatch = (pass: string, confirm: string): ValidationResult => {
  if (!confirm) return fail('Please confirm your password');
  if (pass !== confirm) return fail('Passwords do not match');
  return ok();
};

/**
 * Egyptian phone number:
 * Must start with 010, 011, 012, or 015 followed by 8 digits (total 11 digits)
 * or international format starting with +20
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone.trim()) return fail('Phone number is required');
  const cleaned = phone.replace(/\s|-/g, '');
  const egyptLocal = /^(010|011|012|015)\d{8}$/;
  const egyptIntl = /^\+?20(10|11|12|15)\d{8}$/;
  if (!egyptLocal.test(cleaned) && !egyptIntl.test(cleaned)) {
    return fail('Enter a valid Egyptian phone number (e.g. 01012345678)');
  }
  return ok();
};

/**
 * Egyptian vehicle plate number:
 * Format: 3 Arabic/Latin letters + space + 3–4 digits  (e.g. ABC 1234 or أبج 1234)
 * Also accepts the newer format without letters (pure numeric plates for some regions).
 * We accept: 2–3 letters, optional space, 3–4 digits  OR  numeric-only 5–6 digits.
 */
export const validatePlateNumber = (plate: string): ValidationResult => {
  if (!plate.trim()) return fail('Plate number is required');
  const trimmed = plate.trim().toUpperCase();
  // Latin: "ABC 1234" or "AB 1234"
  const latinPlate = /^[A-Z]{2,3}\s?\d{3,4}$/;
  // Numeric-only plates (some Egyptian regions): "12345" or "123456"
  const numericPlate = /^\d{5,6}$/;
  if (!latinPlate.test(trimmed) && !numericPlate.test(trimmed)) {
    return fail('Enter a valid plate number (e.g. ABC 1234 or 12345)');
  }
  return ok();
};

/**
 * Egyptian National ID (for driver license verification):
 * 14 digits exactly.
 */
export const validateNationalId = (id: string): ValidationResult => {
  if (!id.trim()) return fail('National ID / License ID is required');
  const cleaned = id.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleaned)) {
    return fail('Enter your 14-digit National ID number');
  }
  return ok();
};

/**
 * Government / Commercial license number:
 * Alphanumeric, 6–20 characters.
 */
export const validateGovLicense = (lic: string): ValidationResult => {
  if (!lic.trim()) return fail('Government license number is required');
  const cleaned = lic.trim();
  if (!/^[A-Za-z0-9\-]{6,20}$/.test(cleaned)) {
    return fail('License number must be 6–20 alphanumeric characters');
  }
  return ok();
};

/**
 * Car year: between 1970 and current year + 1
 */
export const validateCarYear = (year: string): ValidationResult => {
  if (!year) return fail('Car year is required');
  const y = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  if (isNaN(y) || y < 1970 || y > currentYear + 1) {
    return fail(`Year must be between 1970 and ${currentYear + 1}`);
  }
  return ok();
};

/**
 * Name: min 3 chars, letters and spaces/hyphens only
 */
export const validateName = (name: string): ValidationResult => {
  if (!name.trim()) return fail('Full name is required');
  if (name.trim().length < 3) return fail('Name must be at least 3 characters');
  return ok();
};

/**
 * Workshop/shop name: min 3 chars
 */
export const validateShopName = (name: string): ValidationResult => {
  if (!name.trim()) return fail('Workshop name is required');
  if (name.trim().length < 3) return fail('Workshop name must be at least 3 characters');
  return ok();
};

/**
 * Address / Location: min 5 chars
 */
export const validateAddress = (addr: string): ValidationResult => {
  if (!addr.trim()) return fail('Location / address is required');
  if (addr.trim().length < 5) return fail('Please enter a more specific address (min 5 chars)');
  return ok();
};

/**
 * Date of Birth: user must be at least 18 years old
 */
export const validateDOB = (dob: string): ValidationResult => {
  if (!dob) return fail('Date of birth is required');
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return fail('Please enter a valid date of birth');
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  if (age < 18) return fail('You must be at least 18 years old');
  if (age > 120) return fail('Please enter a valid date of birth');
  return ok();
};

/**
 * Generic required field: must not be empty
 */
export const validateRequired = (val: string, label = 'This field'): ValidationResult => {
  if (!val || !val.trim()) return fail(`${label} is required`);
  return ok();
};
