/**
 * Framer Motion animation presets
 * Consistent animations across the app
 */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
};

export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

export const slideDown = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.15, ease: 'easeOut' }
};

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { scale: 0.95, opacity: 0, y: 20 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.95, opacity: 0, y: 20 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
};

export const listItem = {
  initial: { x: -10, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -10, opacity: 0 },
  transition: { duration: 0.15 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const cardHover = {
  scale: 1.02,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  transition: { duration: 0.15, ease: 'easeOut' }
};

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 }
};
