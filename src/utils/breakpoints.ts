/**
 * Responsive Breakpoint Constants
 * Mobile-first approach
 * Implements Requirements 14.1, 14.2, 14.3, 14.4
 */

export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export const MEDIA_QUERIES = {
  mobile: `(min-width: ${BREAKPOINTS.mobile}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  wide: `(min-width: ${BREAKPOINTS.wide}px)`,
  
  // Max-width queries for mobile-first
  maxMobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  maxTablet: `(max-width: ${BREAKPOINTS.desktop - 1}px)`,
  maxDesktop: `(max-width: ${BREAKPOINTS.wide - 1}px)`,
  
  // Touch device detection
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
export type MediaQuery = keyof typeof MEDIA_QUERIES;
