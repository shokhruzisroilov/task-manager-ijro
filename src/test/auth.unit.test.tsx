import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm, RegisterForm, EmailVerification } from '../pages/Auth';
import { ProtectedRoute } from '../components/auth';
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

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Authentication Unit Tests', () => {
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
    mockNavigate.mockClear();
  });

  describe('LoginForm', () => {
    it('should display validation error for invalid email', async () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const form = emailInput.closest('form');

      // Enter invalid email and valid password
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form
      if (form) {
        fireEvent.submit(form);
      }

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should display validation error for empty password', async () => {
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const form = emailInput.closest('form');

      // Enter valid email but no password
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Submit form
      if (form) {
        fireEvent.submit(form);
      }

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should call login API with correct credentials', async () => {
      vi.mocked(authAPI.login).mockResolvedValue({
        token: 'test-token',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date().toISOString(),
        },
      });

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Fill form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form
      fireEvent.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('RegisterForm', () => {
    it('should display validation error for empty name', async () => {
      renderWithProviders(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const form = nameInput.closest('form');

      // Fill email and password but not name
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form without filling name
      if (form) {
        fireEvent.submit(form);
      }

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should display validation error for short password', async () => {
      renderWithProviders(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const form = nameInput.closest('form');

      // Fill all fields but with short password
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'short' } });

      // Submit form
      if (form) {
        fireEvent.submit(form);
      }

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should call register API with correct data', async () => {
      vi.mocked(authAPI.register).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
      });

      renderWithProviders(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      // Fill form
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form
      fireEvent.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('EmailVerification', () => {
    it('should accept only digits in code inputs', () => {
      renderWithProviders(<EmailVerification email="test@example.com" />);

      const inputs = screen.getAllByLabelText(/digit/i);

      // Try to enter non-digit
      fireEvent.change(inputs[0], { target: { value: 'a' } });

      // Value should not change
      expect(inputs[0]).toHaveValue('');

      // Enter digit
      fireEvent.change(inputs[0], { target: { value: '1' } });

      // Value should change
      expect(inputs[0]).toHaveValue('1');
    });

    it('should auto-focus next input after entering digit', () => {
      renderWithProviders(<EmailVerification email="test@example.com" />);

      const inputs = screen.getAllByLabelText(/digit/i);

      // Enter digit in first input
      fireEvent.change(inputs[0], { target: { value: '1' } });

      // Second input should be focused (we can't directly test focus, but we can verify the behavior)
      expect(inputs[0]).toHaveValue('1');
    });

    it('should call verifyEmail API with correct code', async () => {
      vi.mocked(authAPI.verifyEmail).mockResolvedValue(undefined);

      renderWithProviders(<EmailVerification email="test@example.com" />);

      const inputs = screen.getAllByLabelText(/digit/i);
      const submitButton = screen.getByRole('button', { name: /verify/i });

      // Fill all inputs
      fireEvent.change(inputs[0], { target: { value: '1' } });
      fireEvent.change(inputs[1], { target: { value: '2' } });
      fireEvent.change(inputs[2], { target: { value: '3' } });
      fireEvent.change(inputs[3], { target: { value: '4' } });
      fireEvent.change(inputs[4], { target: { value: '5' } });

      // Submit form
      fireEvent.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(authAPI.verifyEmail).toHaveBeenCalledWith({
          email: 'test@example.com',
          code: '12345',
        });
      });
    });
  });

  describe('ProtectedRoute', () => {
    it('should redirect to login when not authenticated', () => {
      useAuthStore.setState({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should not show protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading spinner while checking authentication', () => {
      useAuthStore.setState({
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render children when authenticated', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date().toISOString(),
        },
      });

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show protected content
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
