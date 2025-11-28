import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useMediaQuery,
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice
} from '../hooks/useMediaQuery';

/**
 * Unit Tests for Responsive Design
 * Tests useMediaQuery hook and breakpoint utilities
 * Implements Requirements 14.1, 14.2, 14.3
 */

describe('Responsive Design - useMediaQuery Hook', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    // Mock window.matchMedia
    matchMediaMock = vi.fn();
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when media query matches', () => {
    const listeners: Array<(e: any) => void> = [];
    
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn((event: string, listener: any) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(true);
  });

  it('should return false when media query does not match', () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(false);
  });

  it('should update when media query changes', () => {
    const listeners: Array<(e: any) => void> = [];
    
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn((event: string, listener: any) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      listeners.forEach(listener => listener({ matches: true }));
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListener = vi.fn();
    
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener
    });

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    unmount();
    
    expect(removeEventListener).toHaveBeenCalled();
  });
});

describe('Responsive Design - useBreakpoint Hook', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    matchMediaMock = vi.fn();
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return "mobile" for small screens', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false, // All breakpoints return false
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useBreakpoint());
    
    expect(result.current).toBe('mobile');
  });

  it('should return "tablet" for medium screens', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('768px'), // Only tablet breakpoint matches
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useBreakpoint());
    
    expect(result.current).toBe('tablet');
  });

  it('should return "desktop" for large screens', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('768px') || query.includes('1024px'), // Tablet and desktop match
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useBreakpoint());
    
    expect(result.current).toBe('desktop');
  });

  it('should return "wide" for extra large screens', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: true, // All breakpoints match
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    const { result } = renderHook(() => useBreakpoint());
    
    expect(result.current).toBe('wide');
  });
});

describe('Responsive Design - Convenience Hooks', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    matchMediaMock = vi.fn();
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('useIsMobile should return true for mobile screens', () => {
    matchMediaMock.mockReturnValue({
      matches: true, // max-width: 767px matches
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });

  it('useIsTablet should return true for tablet screens', () => {
    matchMediaMock.mockReturnValue({
      matches: true, // min-width: 768px and max-width: 1023px matches
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsTablet());
    
    expect(result.current).toBe(true);
  });

  it('useIsDesktop should return true for desktop screens', () => {
    matchMediaMock.mockReturnValue({
      matches: true, // min-width: 1024px matches
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsDesktop());
    
    expect(result.current).toBe(true);
  });

  it('useIsTouchDevice should return true for touch devices', () => {
    matchMediaMock.mockReturnValue({
      matches: true, // hover: none and pointer: coarse matches
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsTouchDevice());
    
    expect(result.current).toBe(true);
  });
});

describe('Responsive Design - Layout Switching', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    matchMediaMock = vi.fn();
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should switch from mobile to tablet layout', () => {
    const listeners: Array<(e: any) => void> = [];
    
    matchMediaMock.mockReturnValue({
      matches: true, // Start as mobile
      addEventListener: vi.fn((event: string, listener: any) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);

    // Simulate viewport resize to tablet
    matchMediaMock.mockReturnValue({
      matches: false, // No longer mobile
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    act(() => {
      listeners.forEach(listener => listener({ matches: false }));
    });

    expect(result.current).toBe(false);
  });

  it('should switch from tablet to desktop layout', () => {
    const listeners: Array<(e: any) => void> = [];
    
    matchMediaMock.mockReturnValue({
      matches: true, // Start as tablet
      addEventListener: vi.fn((event: string, listener: any) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsTablet());
    
    expect(result.current).toBe(true);

    // Simulate viewport resize to desktop
    matchMediaMock.mockReturnValue({
      matches: false, // No longer tablet
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    act(() => {
      listeners.forEach(listener => listener({ matches: false }));
    });

    expect(result.current).toBe(false);
  });
});

describe('Responsive Design - Touch Interactions', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    matchMediaMock = vi.fn();
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect touch device correctly', () => {
    matchMediaMock.mockReturnValue({
      matches: true, // Touch device
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsTouchDevice());
    
    expect(result.current).toBe(true);
  });

  it('should detect non-touch device correctly', () => {
    matchMediaMock.mockReturnValue({
      matches: false, // Non-touch device
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsTouchDevice());
    
    expect(result.current).toBe(false);
  });

  it('should handle device switching from touch to non-touch', () => {
    const listeners: Array<(e: any) => void> = [];
    
    matchMediaMock.mockReturnValue({
      matches: true, // Start as touch device
      addEventListener: vi.fn((event: string, listener: any) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useIsTouchDevice());
    
    expect(result.current).toBe(true);

    // Simulate switching to non-touch device
    act(() => {
      listeners.forEach(listener => listener({ matches: false }));
    });

    expect(result.current).toBe(false);
  });
});
