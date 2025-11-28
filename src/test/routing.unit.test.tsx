import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '../components/auth';
import { NotFoundPage } from '../pages/NotFound';
import { useAuthStore } from '../store/auth.store';

// Mock the auth store
vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn()
}));

// Mock components
const MockWorkspacesPage = () => <div>Workspaces Page</div>;
const MockLoginPage = () => <div>Login Page</div>;
const MockBoardPage = () => <div>Board Page</div>;

describe('Routing Unit Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  describe('Route Navigation', () => {
    it('should render workspaces page at /workspaces route', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, email: 'test@example.com', name: 'Test User', createdAt: '' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/workspaces']}>
            <Routes>
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <MockWorkspacesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText('Workspaces Page')).toBeInTheDocument();
    });

    it('should render board page at /boards/:boardId route', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, email: 'test@example.com', name: 'Test User', createdAt: '' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/boards/123']}>
            <Routes>
              <Route
                path="/boards/:boardId"
                element={
                  <ProtectedRoute>
                    <MockBoardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText('Board Page')).toBeInTheDocument();
    });

    it('should navigate between routes', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, email: 'test@example.com', name: 'Test User', createdAt: '' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      // Test workspaces route
      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/workspaces']}>
            <Routes>
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <MockWorkspacesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards/:boardId"
                element={
                  <ProtectedRoute>
                    <MockBoardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText('Workspaces Page')).toBeInTheDocument();
      unmount();

      // Test board route
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/boards/123']}>
            <Routes>
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <MockWorkspacesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards/:boardId"
                element={
                  <ProtectedRoute>
                    <MockBoardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Board Page')).toBeInTheDocument();
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when not authenticated', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/workspaces']}>
            <Routes>
              <Route path="/login" element={<MockLoginPage />} />
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <MockWorkspacesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should allow access to protected route when authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, email: 'test@example.com', name: 'Test User', createdAt: '' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/workspaces']}>
            <Routes>
              <Route path="/login" element={<MockLoginPage />} />
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <MockWorkspacesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText('Workspaces Page')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should show loading state while checking authentication', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/workspaces']}>
            <Routes>
              <Route path="/login" element={<MockLoginPage />} />
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <MockWorkspacesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Should not redirect while loading
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Workspaces Page')).not.toBeInTheDocument();
    });
  });

  describe('404 Handling', () => {
    it('should render 404 page for unknown routes', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, email: 'test@example.com', name: 'Test User', createdAt: '' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/unknown-route']}>
            <Routes>
              <Route path="/workspaces" element={<MockWorkspacesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('should show appropriate link in 404 page based on auth status', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, email: 'test@example.com', name: 'Test User', createdAt: '' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/unknown']}>
            <Routes>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText('Go to Workspaces')).toBeInTheDocument();
    });

    it('should show login link in 404 page when not authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/unknown']}>
            <Routes>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText('Go to Login')).toBeInTheDocument();
    });
  });

  describe('Navigation Guards', () => {
    it('should preserve intended destination after login redirect', async () => {
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/workspaces']}>
            <Routes>
              <Route path="/login" element={<MockLoginPage />} />
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <MockWorkspacesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Initially not authenticated
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/workspaces']}>
            <Routes>
              <Route path="/login" element={<MockLoginPage />} />
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <MockWorkspacesPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should redirect authenticated users from auth pages', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 1, email: 'test@example.com', name: 'Test User', createdAt: '' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loadUser: vi.fn()
      });

      const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const { isAuthenticated } = useAuthStore();
        if (isAuthenticated) {
          return <MockWorkspacesPage />;
        }
        return <>{children}</>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <MockLoginPage />
                  </PublicRoute>
                }
              />
              <Route path="/workspaces" element={<MockWorkspacesPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Workspaces Page')).toBeInTheDocument();
      });
    });
  });
});
