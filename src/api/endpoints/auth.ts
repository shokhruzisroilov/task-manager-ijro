import { apiClient } from '../client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
  VerifyEmailRequest
} from '../../types';

/**
 * Authentication API endpoints
 * Implements Requirements 1.1, 1.2, 1.3, 1.5
 */
export const authAPI = {
  /**
   * Register a new user
   * @param data - Registration data (email, password, name)
   * @returns User response
   */
  register: (data: RegisterRequest) =>
    apiClient.post<UserResponse>('/auth/register', data),

  /**
   * Login with email and password
   * @param data - Login credentials
   * @returns Login response with token and user data
   */
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  /**
   * Verify email with verification code
   * @param data - Email and verification code
   * @returns void
   */
  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post<void>('/auth/verify-email', data),

  /**
   * Get current authenticated user
   * @returns Current user data
   */
  getCurrentUser: () =>
    apiClient.get<UserResponse>('/auth/me'),

  /**
   * Logout current user
   * Clears the auth token from localStorage
   */
  logout: () => {
    localStorage.removeItem('auth_token');
  }
};
