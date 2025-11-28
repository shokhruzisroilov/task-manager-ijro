import { useEffect } from 'react';
import { useUIStore } from '../store/ui.store';

interface KeyboardShortcutHandlers {
  onSearch?: () => void;
  onEscape?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers = {}) => {
  const { closeModal, activeModal } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Quick search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
      }

      // Escape: Close modal or execute custom handler
      if (e.key === 'Escape') {
        if (activeModal) {
          closeModal();
        }
        handlers.onEscape?.();
      }

      // Arrow keys: Navigate cards (only if not in input/textarea)
      const target = e.target as HTMLElement;
      const isInputElement = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      if (!isInputElement) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            handlers.onNavigateUp?.();
            break;
          case 'ArrowDown':
            e.preventDefault();
            handlers.onNavigateDown?.();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            handlers.onNavigateLeft?.();
            break;
          case 'ArrowRight':
            e.preventDefault();
            handlers.onNavigateRight?.();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, activeModal, closeModal]);
};
