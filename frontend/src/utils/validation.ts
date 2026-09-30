/**
 * Central Validation Utilities for Clinic Management System
 * Enforces strict phone, email, date of birth, age, and numeric validations.
 */

/**
 * Validates Indian 10-digit mobile phone numbers.
 * Allows digits only, exactly 10 digits, starting with 6, 7, 8, or 9.
 */
export const isValidIndianMobile = (phone: string): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits);
};

/**
 * Sanitizes input to digits only with maximum 10 digits.
 * Useful for onChange handlers to prevent typing non-numeric characters or exceeding 10 digits.
 */
export const sanitizeMobileInput = (val: string): string => {
  return val.replace(/\D/g, '').slice(0, 10);
};

/**
 * Validates email format according to standard email conventions.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || !email.trim()) return false;
  // Strict regex: requires non-empty local part, @, domain, and TLD of at least 2 chars
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

export interface CalculatedAge {
  years: number;
  months: number;
  days: number;
  displayText: string;
}

/**
 * Calculates exact age from Date of Birth string (YYYY-MM-DD or parseable date).
 * Considers year, month, and day.
 * Returns null if invalid or date is in the future.
 */
export const calculateAgeFromDOB = (dobString: string): CalculatedAge | null => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  // Reset hours to compare dates only
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const birthOnly = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  if (birthOnly > todayDate) {
    return null; // Future date
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let displayText = '';
  if (years === 0) {
    if (months === 0) {
      displayText = `${days} day${days === 1 ? '' : 's'}`;
    } else {
      displayText = `${months} month${months === 1 ? '' : 's'}${days > 0 ? ` ${days} d` : ''}`;
    }
  } else {
    displayText = `${years} yr${years === 1 ? '' : 's'}${months > 0 && years < 5 ? ` ${months} mo` : ''}`;
  }

  return {
    years,
    months,
    days,
    displayText,
  };
};

/**
 * Checks whether a given date string is in the future.
 */
export const isFutureDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const targetDate = new Date(dateString);
  if (isNaN(targetDate.getTime())) return false;
  
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const checkDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  return checkDate > todayDate;
};

/**
 * Returns today's date formatted as YYYY-MM-DD for date input max attributes.
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Validates patient full name:
 * Must not be empty, must contain valid characters (letters, spaces, hyphens, apostrophes, dots).
 */
export const isValidPatientName = (name: string): boolean => {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) return false;
  // Allows international characters, letters, spaces, hyphens, periods
  return /^[\p{L}\s.'\-]+$/u.test(trimmed);
};

/**
 * Sanitizes numeric input (allows digits and optional single decimal point).
 */
export const sanitizeDecimalInput = (val: string): string => {
  // Allow digits and only one decimal point
  const clean = val.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  return clean;
};

/**
 * Sanitizes integer input (allows digits only).
 */
export const sanitizeIntegerInput = (val: string): string => {
  return val.replace(/\D/g, '');
};

/**
 * Validates a positive numeric value (e.g. price, fee, vitals).
 */
export const isPositiveNumber = (val: number | string): boolean => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return !isNaN(num) && num > 0;
};

/**
 * Returns a formatted age display string based on patient DOB if available, or stored age.
 * Ensures DOB remains source of truth and represents infants/children accurately.
 */
export const getPatientAgeDisplay = (patient: { age?: number; dob?: string }): string => {
  if (patient.dob) {
    const calculated = calculateAgeFromDOB(patient.dob);
    if (calculated) {
      return calculated.displayText;
    }
  }
  if (patient.age !== undefined && patient.age !== null) {
    return `${patient.age} yrs`;
  }
  return '--';
};

