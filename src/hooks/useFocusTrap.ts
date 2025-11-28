import { useEffect, RefObject } from 'react';

/**
 * Hook to trap focus within a container element (e.g., modal)
 * Ensures keyboard navigation stays within the trapped element
 */
export const useFocusTrap = (ref: RefObject<HTMLElement>, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;

    const element = ref.current;
    if (!element) return;

    // Get all focusable elements
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element to restore later
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: Move focus backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Move focus forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    return () => {
      element.removeEventListener('keydown', handleTabKey);
      // Restore focus to previously focused element
      previouslyFocusedElement?.focus();
    };
  }, [ref, isActive]);
};
