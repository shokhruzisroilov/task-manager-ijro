/**
 * Validation utility functions for form inputs
 */

export type ValidationResult = string | null;

/**
 * Validates email format
 * @param value - Email string to validate
 * @returns Error message or null if valid
 */
export const validateEmail = (value: string): ValidationResult => {
  if (!value) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Invalid email format';
  }
  
  return null;
};

/**
 * Validates password meets minimum requirements
 * @param value - Password string to validate
 * @returns Error message or null if valid
 */
export const validatePassword = (value: string): ValidationResult => {
  if (!value) {
    return 'Password is required';
  }
  
  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }
  
  return null;
};

/**
 * Validates required field is not empty
 * @param value - Value to validate
 * @returns Error message or null if valid
 */
export const validateRequired = (value: any): ValidationResult => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return 'This field is required';
  }
  
  return null;
};

/**
 * Creates a max length validator
 * @param max - Maximum allowed length
 * @returns Validator function
 */
export const validateMaxLength = (max: number) => {
  return (value: string): ValidationResult => {
    if (value && value.length > max) {
      return `Maximum length is ${max} characters`;
    }
    
    return null;
  };
};

/**
 * Creates a min length validator
 * @param min - Minimum required length
 * @returns Validator function
 */
export const validateMinLength = (min: number) => {
  return (value: string): ValidationResult => {
    if (value && value.length < min) {
      return `Minimum length is ${min} characters`;
    }
    
    return null;
  };
};

/**
 * Validates a value matches another value (e.g., password confirmation)
 * @param otherValue - Value to match against
 * @param fieldName - Name of the field being matched
 * @returns Validator function
 */
export const validateMatch = (otherValue: any, fieldName: string = 'field') => {
  return (value: any): ValidationResult => {
    if (value !== otherValue) {
      return `Must match ${fieldName}`;
    }
    
    return null;
  };
};

/**
 * Validates a numeric value is within a range
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Validator function
 */
export const validateRange = (min: number, max: number) => {
  return (value: number): ValidationResult => {
    if (value < min || value > max) {
      return `Value must be between ${min} and ${max}`;
    }
    
    return null;
  };
};

/**
 * Combines multiple validators into one
 * @param validators - Array of validator functions
 * @returns Combined validator function
 */
export const combineValidators = (...validators: Array<(value: any) => ValidationResult>) => {
  return (value: any): ValidationResult => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return null;
  };
};

/**
 * Validates an entire form object
 * @param values - Form values object
 * @param rules - Validation rules for each field
 * @returns Object with errors for each field
 */
export const validateForm = <T extends Record<string, any>>(
  values: T,
  rules: Partial<Record<keyof T, (value: any) => ValidationResult>>
): Partial<Record<keyof T, string>> => {
  const errors: Partial<Record<keyof T, string>> = {};
  
  for (const field in rules) {
    const validator = rules[field];
    if (validator) {
      const error = validator(values[field]);
      if (error) {
        errors[field] = error;
      }
    }
  }
  
  return errors;
};
