import { AxiosError } from 'axios';
import { APIError } from '../types';

/**
 * APIErrorHandler class for handling and transforming API errors
 * Implements error handling strategy from Requirements 15.2, 15.3
 */
export class APIErrorHandler {
  /**
   * Maps HTTP status codes to user-friendly error messages
   */
  private static readonly ERROR_MESSAGES: Record<number, string> = {
    400: 'Invalid request data',
    401: 'Session expired. Please login again.',
    403: 'You do not have permission to perform this action',
    404: 'Resource not found',
    409: 'Conflict detected',
    422: 'Validation failed',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Server error. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
    504: 'Request timeout. Please try again.',
  };

  /**
   * Handles Axios errors and transforms them into APIError format
   * @param error - The Axios error to handle
   * @returns Formatted APIError object
   */
  static handle(error: AxiosError): APIError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      // Get user-friendly message for 4xx errors
      if (status >= 400 && status < 500) {
        return {
          status,
          message: data.message || this.ERROR_MESSAGES[status] || 'Client error occurred',
          errors: data.errors
        };
      }

      // Get generic message for 5xx errors
      if (status >= 500) {
        return {
          status,
          message: this.ERROR_MESSAGES[status] || 'Server error. Please try again later.'
        };
      }

      // Fallback for other status codes
      return {
        status,
        message: data.message || 'An unexpected error occurred'
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        status: 0,
        message: 'Network error. Please check your connection.'
      };
    } else {
      // Something else happened
      return {
        status: -1,
        message: error.message || 'An unexpected error occurred'
      };
    }
  }

  /**
   * Checks if an error is a 4xx client error
   * @param error - The API error to check
   * @returns True if error is a 4xx error
   */
  static isClientError(error: APIError): boolean {
    return error.status >= 400 && error.status < 500;
  }

  /**
   * Checks if an error is a 5xx server error
   * @param error - The API error to check
   * @returns True if error is a 5xx error
   */
  static isServerError(error: APIError): boolean {
    return error.status >= 500 && error.status < 600;
  }

  /**
   * Checks if an error is a network error
   * @param error - The API error to check
   * @returns True if error is a network error
   */
  static isNetworkError(error: APIError): boolean {
    return error.status === 0;
  }
}
