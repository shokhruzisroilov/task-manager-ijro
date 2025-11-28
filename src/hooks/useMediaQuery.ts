import { useState, useEffect } from 'react';

/**
 * useMediaQuery Hook
 * Custom hook for responsive media queries
 * Implements Requirements 14.1, 14.2, 14.3, 14.4
 * 
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Check if window is available
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Update state if initial value is different
    if (mediaQuery.matches !== matches) {
      setMatches(mediaQuery.matches);
    }

    // Event handler for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query, matches]);

  return matches;
};

/**
 * useBreakpoint Hook
 * Returns the current breakpoint
 * 
 * @returns 'mobile' | 'tablet' | 'desktop' | 'wide'
 */
export const useBreakpoint = (): 'mobile' | 'tablet' | 'desktop' | 'wide' => {
  const isWide = useMediaQuery('(min-width: 1440px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  if (isWide) return 'wide';
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
};

/**
 * useIsMobile Hook
 * Convenience hook to check if viewport is mobile
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 767px)');
};

/**
 * useIsTablet Hook
 * Convenience hook to check if viewport is tablet
 */
export const useIsTablet = (): boolean => {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
};

/**
 * useIsDesktop Hook
 * Convenience hook to check if viewport is desktop or larger
 */
export const useIsDesktop = (): boolean => {
  return useMediaQuery('(min-width: 1024px)');
};

/**
 * useIsTouchDevice Hook
 * Detects if the device supports touch
 */
export const useIsTouchDevice = (): boolean => {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
};
