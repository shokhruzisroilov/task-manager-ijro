// UI State Models
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  activeModal: string | null;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

// Form State Types
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Button Types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Input Types
export type InputType = 'text' | 'email' | 'password' | 'textarea' | 'number' | 'date';

export interface InputProps {
  type?: InputType;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// Dropdown Types
export interface DropdownOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface DropdownProps<T = any> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

// Avatar Types
export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  user: {
    name: string;
    email?: string;
  };
  size?: AvatarSize;
  className?: string;
}

// Loading Types
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

// Confirm Dialog Types
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

// Error Boundary Types
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Navigation Types
export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

// Sidebar Types
export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  onClick?: () => void;
  active?: boolean;
  children?: SidebarItem[];
}

export interface SidebarProps {
  items: SidebarItem[];
  isOpen: boolean;
  onToggle: () => void;
}

// Card Display Types
export interface CardDisplayProps {
  card: {
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
    labels: Array<{ id: number; name: string; color: string }>;
    members: Array<{ userId: number; name: string }>;
  };
  onClick?: () => void;
  isDragging?: boolean;
}

// Column Display Types
export interface ColumnDisplayProps {
  column: {
    id: number;
    name: string;
    position: number;
  };
  cards: Array<any>;
  onAddCard?: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
}

// Validation Types
export type ValidationRule<T = any> = (value: T) => string | null;

export interface ValidationRules {
  [key: string]: ValidationRule | ValidationRule[];
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Responsive Types
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface ResponsiveValue<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
}
