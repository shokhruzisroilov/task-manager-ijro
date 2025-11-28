/**
 * Property-based tests for error handling
 * Tests Requirements 15.1, 15.2, 15.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { APIErrorHandler } from '../api/errorHandler';
import { validateEmail, validatePassword, validateRequired, validateMaxLength } from '../utils/validation';
import { extractFieldErrors, getErrorMessage, isValidationError } from '../utils/errorUtils';
import { FieldError } from '../components/common/FieldError';

/**
 * Feature: trello-clone-frontend, Property 62: Invalid form data shows field errors
 * Validates: Requirements 15.1
 */
describe('Property 62: Invalid form data shows field errors', () => {
  it('should display error for any invalid email', () => {
    fc.assert(
      fc.property(
        // Generate invalid emails (strings without @ or .)
        fc.string().filter(s => !s.includes('@') || !s.includes('.')),
        (invalidEmail) => {
          const error = validateEmail(invalidEmail);
          
          // Should return an error message
          expect(error).not.toBeNull();
          expect(typeof error).toBe('string');
          
          // Render FieldError component
          const { container } = render(<FieldError error={error || undefined} />);
          
          // Should display the error
          if (error) {
            expect(container.textContent).toContain(error);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display error for any password shorter than 8 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 7 }),
        (shortPassword) => {
          const error = validatePassword(shortPassword);
          
          // Should return an error message
          expect(error).not.toBeNull();
          expect(typeof error).toBe('string');
          
          // Render FieldError component
          const { container } = render(<FieldError error={error || undefined} />);
          
          // Should display the error
          if (error) {
            expect(container.textContent).toContain(error);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display error for any empty required field', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\n'),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (emptyValue) => {
          const error = validateRequired(emptyValue);
          
          // Should return an error message
          expect(error).not.toBeNull();
          expect(typeof error).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display error for any string exceeding max length', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1 }),
        (maxLength, baseString) => {
          // Create a string that exceeds maxLength
          const longString = baseString.repeat(Math.ceil((maxLength + 10) / baseString.length));
          
          const validator = validateMaxLength(maxLength);
          const error = validator(longString);
          
          if (longString.length > maxLength) {
            // Should return an error message
            expect(error).not.toBeNull();
            expect(error).toContain(`${maxLength}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: trello-clone-frontend, Property 63: 4xx errors show user-friendly messages
 * Validates: Requirements 15.2
 */
describe('Property 63: 4xx errors show user-friendly messages', () => {
  it('should return user-friendly message for any 4xx status code', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 499 }),
        fc.string(),
        (statusCode, errorMessage) => {
          // Create a mock Axios error
          const axiosError = {
            response: {
              status: statusCode,
              data: { message: errorMessage }
            },
            request: {},
            config: {}
          } as AxiosError;

          const apiError = APIErrorHandler.handle(axiosError);

          // Should have the status code
          expect(apiError.status).toBe(statusCode);
          
          // Should have a message (either custom or default)
          expect(apiError.message).toBeTruthy();
          expect(typeof apiError.message).toBe('string');
          expect(apiError.message.length).toBeGreaterThan(0);
          
          // Should be a client error
          expect(APIErrorHandler.isClientError(apiError)).toBe(true);
          expect(APIErrorHandler.isServerError(apiError)).toBe(false);
          
          // Should be a validation error for 400 and 422
          if (statusCode === 400 || statusCode === 422) {
            expect(isValidationError(apiError)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract field errors from 400 responses with validation errors', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 })
        ),
        (fieldErrors) => {
          // Create a mock Axios error with field errors
          const axiosError = {
            response: {
              status: 400,
              data: {
                message: 'Validation failed',
                errors: fieldErrors
              }
            },
            request: {},
            config: {}
          } as AxiosError;

          const apiError = APIErrorHandler.handle(axiosError);
          const extracted = extractFieldErrors(apiError);

          // Should extract field errors
          expect(typeof extracted).toBe('object');
          
          // Each field should have an error message
          for (const field in fieldErrors) {
            expect(extracted[field]).toBeTruthy();
            expect(typeof extracted[field]).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: trello-clone-frontend, Property 64: 5xx errors show generic message
 * Validates: Requirements 15.3
 */
describe('Property 64: 5xx errors show generic message', () => {
  it('should return generic message for any 5xx status code', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500, max: 599 }),
        fc.string(),
        (statusCode, errorMessage) => {
          // Create a mock Axios error
          const axiosError = {
            response: {
              status: statusCode,
              data: { message: errorMessage }
            },
            request: {},
            config: {}
          } as AxiosError;

          const apiError = APIErrorHandler.handle(axiosError);

          // Should have the status code
          expect(apiError.status).toBe(statusCode);
          
          // Should have a generic message (not the server's detailed message)
          expect(apiError.message).toBeTruthy();
          expect(typeof apiError.message).toBe('string');
          
          // Should contain generic terms like "server" or "try again"
          const message = apiError.message.toLowerCase();
          const hasGenericTerms = 
            message.includes('server') || 
            message.includes('try again') ||
            message.includes('unavailable') ||
            message.includes('timeout');
          expect(hasGenericTerms).toBe(true);
          
          // Should be a server error
          expect(APIErrorHandler.isServerError(apiError)).toBe(true);
          expect(APIErrorHandler.isClientError(apiError)).toBe(false);
          
          // Should not expose internal error details
          expect(apiError.message).not.toBe(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return generic message for network errors', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // Create a mock Axios error with no response (network error)
          const axiosError = {
            request: {},
            config: {}
          } as AxiosError;

          const apiError = APIErrorHandler.handle(axiosError);

          // Should have status 0 for network errors
          expect(apiError.status).toBe(0);
          
          // Should have a generic network error message
          expect(apiError.message).toBeTruthy();
          expect(typeof apiError.message).toBe('string');
          
          const message = apiError.message.toLowerCase();
          expect(message.includes('network') || message.includes('connection')).toBe(true);
          
          // Should be identified as network error
          expect(APIErrorHandler.isNetworkError(apiError)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract error message from any error type', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ message: fc.string({ minLength: 1 }) }),
          fc.string({ minLength: 1 }),
          fc.constant(new Error('Test error')),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (error) => {
          const message = getErrorMessage(error);
          
          // Should always return a string
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
