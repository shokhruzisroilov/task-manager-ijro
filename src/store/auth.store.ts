import { create } from 'zustand';
import { authAPI } from '../api/endpoints/auth';
import { User, RegisterRequest } from '../types';

/**
 * Authentication store
 * Manages user authentication state and actions
 * Implements Requirements 1.1, 1.2, 1.3, 1.5
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /**
   * Login user with email and password
   * Stores JWT token and user data
   * Requirement 1.3: Valid login stores token and redirects
   */
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login({ email, password });
      localStorage.setItem('auth_token', response.token);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  /**
   * Register new user
   * Requirement 1.1: Registration creates account
   */
  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });
      await authAPI.register(data);
      set({ isLoading: false, error: null });
    } catch (error: any) {
      set({
        error: error.message || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },

  /**
   * Logout current user
   * Clears token and user data
   * Requirement 1.5: Logout clears token and redirects
   */
  logout: () => {
    authAPI.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  /**
   * Load current user from token
   * Called on app initialization
   */
  loadUser: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true });
      const user = await authAPI.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  /**
   * Clear error message
   */
  clearError: () => set({ error: null })
}));
