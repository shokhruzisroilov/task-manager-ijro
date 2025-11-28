/**
 * Error utility functions for handling and displaying errors
 */

import { APIError } from '../types';
import { toast } from '../store/ui.store';
import { APIErrorHandler } from '../api/errorHandler';

/**
 * Displays an API error as a toast notification
 * @param error - The API error to display
 */
export const showAPIError = (error: APIError): void => {
  // Don't show toast for 401 errors (handled by redirect)
  if (error.status === 401) {
    return;
  }

  toast.error(error.message);
};

/**
 * Handles an API error by displaying it and optionally logging
 * @param error - The error to handle
 * @param context - Optional context for logging
 */
export const handleAPIError = (error: any, context?: string): void => {
  // If it's already an APIError, just show it
  if (error && typeof error === 'object' && 'status' in error) {
    showAPIError(error as APIError);
    if (context) {
      console.error(`[${context}]`, error);
    }
    return;
  }

  // Otherwise, show a generic error
  toast.error('An unexpected error occurred');
  if (context) {
    console.error(`[${context}]`, error);
  }
};

/**
 * Extracts field errors from an API error response
 * @param error - The API error
 * @returns Object with field-specific errors
 */
export const extractFieldErrors = (error: APIError): Record<string, string> => {
  if (error.errors) {
    // Convert array of errors to single string per field
    const fieldErrors: Record<string, string> = {};
    for (const [field, messages] of Object.entries(error.errors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[field] = messages[0];
      } else if (typeof messages === 'string') {
        fieldErrors[field] = messages;
      }
    }
    return fieldErrors;
  }
  return {};
};

/**
 * Checks if an error has field-specific validation errors
 * @param error - The API error
 * @returns True if error has field errors
 */
export const hasFieldErrors = (error: APIError): boolean => {
  return !!error.errors && Object.keys(error.errors).length > 0;
};

/**
 * Gets a user-friendly error message for display
 * @param error - The error (can be any type)
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  if (!error) {
    return 'An unexpected error occurred';
  }

  // If it's an APIError
  if (typeof error === 'object' && 'message' in error) {
    return error.message;
  }

  // If it's a standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // If it's a string
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

/**
 * Determines if an error should be retried
 * @param error - The API error
 * @returns True if the error is retryable
 */
export const isRetryableError = (error: APIError): boolean => {
  // Network errors and 5xx errors are retryable
  return APIErrorHandler.isNetworkError(error) || APIErrorHandler.isServerError(error);
};

/**
 * Determines if an error is a validation error
 * @param error - The API error
 * @returns True if the error is a validation error
 */
export const isValidationError = (error: APIError): boolean => {
  return error.status === 400 || error.status === 422;
};
