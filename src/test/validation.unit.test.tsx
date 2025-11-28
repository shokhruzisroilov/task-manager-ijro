/**
 * Unit tests for validation utilities
 * Tests Requirements 15.1
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateMaxLength,
  validateMinLength,
  validateMatch,
  validateRange,
  combineValidators,
  validateForm
} from '../utils/validation';

describe('Email Validation', () => {
  it('should return error for empty email', () => {
    expect(validateEmail('')).toBe('Email is required');
  });

  it('should return error for email without @', () => {
    const error = validateEmail('testexample.com');
    expect(error).toBe('Invalid email format');
  });

  it('should return error for email without domain', () => {
    const error = validateEmail('test@');
    expect(error).toBe('Invalid email format');
  });

  it('should return error for email without TLD', () => {
    const error = validateEmail('test@example');
    expect(error).toBe('Invalid email format');
  });

  it('should return null for valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('user.name+tag@example.co.uk')).toBeNull();
  });
});

describe('Password Validation', () => {
  it('should return error for empty password', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('should return error for password with 7 characters', () => {
    expect(validatePassword('1234567')).toBe('Password must be at least 8 characters');
  });

  it('should return error for password with 1 character', () => {
    expect(validatePassword('a')).toBe('Password must be at least 8 characters');
  });

  it('should return null for password with exactly 8 characters', () => {
    expect(validatePassword('12345678')).toBeNull();
  });

  it('should return null for password with more than 8 characters', () => {
    expect(validatePassword('123456789')).toBeNull();
    expect(validatePassword('verylongpassword123')).toBeNull();
  });
});

describe('Required Field Validation', () => {
  it('should return error for empty string', () => {
    expect(validateRequired('')).toBe('This field is required');
  });

  it('should return error for whitespace-only string', () => {
    expect(validateRequired('   ')).toBe('This field is required');
    expect(validateRequired('\t\n')).toBe('This field is required');
  });

  it('should return error for null', () => {
    expect(validateRequired(null)).toBe('This field is required');
  });

  it('should return error for undefined', () => {
    expect(validateRequired(undefined)).toBe('This field is required');
  });

  it('should return null for non-empty string', () => {
    expect(validateRequired('test')).toBeNull();
    expect(validateRequired('  test  ')).toBeNull();
  });

  it('should return error for number 0 (falsy value)', () => {
    // 0 is treated as "not provided" in form validation
    expect(validateRequired(0)).toBe('This field is required');
  });

  it('should return error for boolean false (falsy value)', () => {
    // false is treated as "not provided" in form validation
    expect(validateRequired(false)).toBe('This field is required');
  });
});

describe('Max Length Validation', () => {
  it('should return error for string exceeding max length', () => {
    const validator = validateMaxLength(5);
    expect(validator('123456')).toBe('Maximum length is 5 characters');
    expect(validator('verylongstring')).toBe('Maximum length is 5 characters');
  });

  it('should return null for string at max length', () => {
    const validator = validateMaxLength(5);
    expect(validator('12345')).toBeNull();
  });

  it('should return null for string below max length', () => {
    const validator = validateMaxLength(5);
    expect(validator('1234')).toBeNull();
    expect(validator('a')).toBeNull();
  });

  it('should return null for empty string', () => {
    const validator = validateMaxLength(5);
    expect(validator('')).toBeNull();
  });

  it('should work with different max lengths', () => {
    expect(validateMaxLength(10)('12345678901')).toBe('Maximum length is 10 characters');
    expect(validateMaxLength(100)('a'.repeat(101))).toBe('Maximum length is 100 characters');
  });
});

describe('Min Length Validation', () => {
  it('should return error for string below min length', () => {
    const validator = validateMinLength(5);
    expect(validator('1234')).toBe('Minimum length is 5 characters');
    expect(validator('a')).toBe('Minimum length is 5 characters');
  });

  it('should return null for string at min length', () => {
    const validator = validateMinLength(5);
    expect(validator('12345')).toBeNull();
  });

  it('should return null for string above min length', () => {
    const validator = validateMinLength(5);
    expect(validator('123456')).toBeNull();
    expect(validator('verylongstring')).toBeNull();
  });

  it('should return null for empty string', () => {
    const validator = validateMinLength(5);
    expect(validator('')).toBeNull();
  });
});

describe('Match Validation', () => {
  it('should return error when values do not match', () => {
    const validator = validateMatch('password123', 'password');
    expect(validator('password456')).toBe('Must match password');
  });

  it('should return null when values match', () => {
    const validator = validateMatch('password123', 'password');
    expect(validator('password123')).toBeNull();
  });

  it('should use custom field name in error message', () => {
    const validator = validateMatch('test@example.com', 'email');
    expect(validator('other@example.com')).toBe('Must match email');
  });

  it('should work with non-string values', () => {
    const validator = validateMatch(123);
    expect(validator(123)).toBeNull();
    expect(validator(456)).toBe('Must match field');
  });
});

describe('Range Validation', () => {
  it('should return error for value below min', () => {
    const validator = validateRange(1, 10);
    expect(validator(0)).toBe('Value must be between 1 and 10');
    expect(validator(-5)).toBe('Value must be between 1 and 10');
  });

  it('should return error for value above max', () => {
    const validator = validateRange(1, 10);
    expect(validator(11)).toBe('Value must be between 1 and 10');
    expect(validator(100)).toBe('Value must be between 1 and 10');
  });

  it('should return null for value at min', () => {
    const validator = validateRange(1, 10);
    expect(validator(1)).toBeNull();
  });

  it('should return null for value at max', () => {
    const validator = validateRange(1, 10);
    expect(validator(10)).toBeNull();
  });

  it('should return null for value in range', () => {
    const validator = validateRange(1, 10);
    expect(validator(5)).toBeNull();
  });
});

describe('Combine Validators', () => {
  it('should return first error when multiple validators fail', () => {
    const validator = combineValidators(
      validateRequired,
      validateEmail
    );
    
    expect(validator('')).toBe('This field is required');
  });

  it('should return second error when first passes', () => {
    const validator = combineValidators(
      validateRequired,
      validateEmail
    );
    
    expect(validator('invalid')).toBe('Invalid email format');
  });

  it('should return null when all validators pass', () => {
    const validator = combineValidators(
      validateRequired,
      validateEmail
    );
    
    expect(validator('test@example.com')).toBeNull();
  });

  it('should work with multiple validators', () => {
    const validator = combineValidators(
      validateRequired,
      validateMinLength(8),
      validateMaxLength(20)
    );
    
    expect(validator('')).toBe('This field is required');
    expect(validator('short')).toBe('Minimum length is 8 characters');
    expect(validator('a'.repeat(21))).toBe('Maximum length is 20 characters');
    expect(validator('validpassword')).toBeNull();
  });
});

describe('Form Validation', () => {
  it('should validate all fields in form', () => {
    const values = {
      email: 'invalid',
      password: '123',
      name: ''
    };

    const rules = {
      email: validateEmail,
      password: validatePassword,
      name: validateRequired
    };

    const errors = validateForm(values, rules);

    expect(errors.email).toBe('Invalid email format');
    expect(errors.password).toBe('Password must be at least 8 characters');
    expect(errors.name).toBe('This field is required');
  });

  it('should return empty object when all fields are valid', () => {
    const values = {
      email: 'test@example.com',
      password: '12345678',
      name: 'John Doe'
    };

    const rules = {
      email: validateEmail,
      password: validatePassword,
      name: validateRequired
    };

    const errors = validateForm(values, rules);

    expect(Object.keys(errors).length).toBe(0);
  });

  it('should only validate fields with rules', () => {
    const values = {
      email: 'test@example.com',
      password: '12345678',
      name: 'John Doe',
      extra: 'field'
    };

    const rules = {
      email: validateEmail,
      password: validatePassword
    };

    const errors = validateForm(values, rules);

    expect(Object.keys(errors).length).toBe(0);
    expect(errors.extra).toBeUndefined();
  });

  it('should handle partial validation', () => {
    const values = {
      email: 'invalid',
      password: '12345678',
      name: 'John Doe'
    };

    const rules = {
      email: validateEmail
    };

    const errors = validateForm(values, rules);

    expect(errors.email).toBe('Invalid email format');
    expect(errors.password).toBeUndefined();
    expect(errors.name).toBeUndefined();
  });
});
