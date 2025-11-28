import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useAuthStore } from '../store/auth.store';
import { authAPI } from '../api/endpoints/auth';

// Mock the API
vi.mock('../api/endpoints/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    verifyEmail: vi.fn(),
  },
}));

// Generators for property-based testing
const emailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{1,20}$/),
    fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com', 'example.com')
  )
  .map(([local, domain]) => `${local}@${domain}`);

const passwordArbitrary = fc.string({ minLength: 8, maxLength: 50 });

const nameArbitrary = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

describe('Authentication Property-Based Tests', () => {
  beforeEach(() => {
    // Reset store
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  /**
   * Feature: trello-clone-frontend, Property 1: Registration creates account and shows verification
   * Validates: Requirements 1.1
   */
  describe('Property 1: Registration creates account and shows verification', () => {
    it('should create account for any valid registration data', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordArbitrary,
          nameArbitrary,
          async (email, password, name) => {
            // Reset for each iteration
            vi.clearAllMocks();
            localStorage.clear();
            useAuthStore.setState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            
            // Mock successful registration
            vi.mocked(authAPI.register).mockResolvedValue({
              id: 1,
              email,
              name,
              createdAt: new Date().toISOString(),
            });

            // Call register from store
            const { register } = useAuthStore.getState();
            await register({ email, password, name });

            // Verify API was called with correct data
            expect(authAPI.register).toHaveBeenCalledWith({
              email,
              password,
              name,
            });

            // Verify no error occurred
            const state = useAuthStore.getState();
            expect(state.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 3: Valid login stores token and redirects
   * Validates: Requirements 1.3
   */
  describe('Property 3: Valid login stores token and redirects', () => {
    it('should store token for any valid login credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordArbitrary,
          fc.uuid(),
          async (email, password, token) => {
            // Reset for each iteration
            vi.clearAllMocks();
            localStorage.clear();
            useAuthStore.setState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            
            // Mock successful login
            vi.mocked(authAPI.login).mockResolvedValue({
              token,
              user: {
                id: 1,
                email,
                name: 'Test User',
                createdAt: new Date().toISOString(),
              },
            });

            // Call login from store
            const { login } = useAuthStore.getState();
            await login(email, password);

            // Verify API was called with correct credentials
            expect(authAPI.login).toHaveBeenCalledWith({
              email,
              password,
            });

            // Verify token is stored in localStorage
            const storedToken = localStorage.getItem('auth_token');
            expect(storedToken).toBe(token);

            // Verify store state is updated
            const state = useAuthStore.getState();
            expect(state.token).toBe(token);
            expect(state.isAuthenticated).toBe(true);
            expect(state.user).not.toBeNull();
            expect(state.user?.email).toBe(email);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 4: Logout clears token and redirects
   * Validates: Requirements 1.5
   */
  describe('Property 4: Logout clears token and redirects', () => {
    it('should clear token from localStorage for any authenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          emailArbitrary,
          nameArbitrary,
          async (token, email, name) => {
            // Reset for each iteration
            vi.clearAllMocks();
            localStorage.clear();
            
            // Mock logout to actually remove the token
            vi.mocked(authAPI.logout).mockImplementation(() => {
              localStorage.removeItem('auth_token');
            });
            
            // Set up authenticated state
            localStorage.setItem('auth_token', token);
            useAuthStore.setState({
              user: {
                id: 1,
                email,
                name,
                createdAt: new Date().toISOString(),
              },
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Call logout
            const { logout } = useAuthStore.getState();
            logout();

            // Verify token is removed from localStorage
            const storedToken = localStorage.getItem('auth_token');
            expect(storedToken).toBeNull();

            // Verify store state is cleared
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.token).toBeNull();
            expect(state.isAuthenticated).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
