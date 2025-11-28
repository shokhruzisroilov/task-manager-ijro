import { create } from 'zustand';

/**
 * Toast notification type
 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

/**
 * UI store
 * Manages UI state including sidebar, theme, modals, and toasts
 * Implements Requirements 1.1, 1.2, 1.3, 1.5
 */
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  activeModal: string | null;
  toasts: Toast[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

/**
 * Generate unique ID for toasts
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get initial theme from localStorage or default to 'light'
 */
const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('theme');
  return (stored === 'dark' ? 'dark' : 'light');
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: getInitialTheme(),
  activeModal: null,
  toasts: [],

  /**
   * Toggle sidebar open/closed
   */
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  /**
   * Set sidebar open state
   */
  setSidebarOpen: (open: boolean) =>
    set({ sidebarOpen: open }),

  /**
   * Set theme and persist to localStorage
   */
  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('theme', theme);
    set({ theme });
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  },

  /**
   * Open a modal by ID
   */
  openModal: (modalId: string) =>
    set({ activeModal: modalId }),

  /**
   * Close the active modal
   */
  closeModal: () =>
    set({ activeModal: null }),

  /**
   * Add a toast notification
   * Auto-generates ID and sets default duration if not provided
   */
  addToast: (toast: Omit<Toast, 'id'>) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: generateId(),
          duration: toast.duration || 5000
        }
      ]
    })),

  /**
   * Remove a toast notification by ID
   */
  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}));

/**
 * Helper functions for common toast operations
 */
export const toast = {
  success: (message: string, duration?: number) => {
    useUIStore.getState().addToast({
      message,
      type: 'success',
      duration: duration || 5000
    });
  },
  error: (message: string, duration?: number) => {
    useUIStore.getState().addToast({
      message,
      type: 'error',
      duration: duration || 5000
    });
  },
  warning: (message: string, duration?: number) => {
    useUIStore.getState().addToast({
      message,
      type: 'warning',
      duration: duration || 5000
    });
  },
  info: (message: string, duration?: number) => {
    useUIStore.getState().addToast({
      message,
      type: 'info',
      duration: duration || 5000
    });
  }
};
