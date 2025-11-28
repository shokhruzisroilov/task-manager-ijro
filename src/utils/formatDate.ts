import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format date utilities using date-fns
 */

export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'h:mm a')}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'h:mm a')}`;
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatDueDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const isPast = dateObj < now;
  
  if (isToday(dateObj)) {
    return isPast ? 'Overdue' : 'Due today';
  }
  
  if (isYesterday(dateObj)) {
    return 'Overdue';
  }
  
  if (isPast) {
    return `Overdue by ${formatDistanceToNow(dateObj)}`;
  }
  
  return `Due ${formatDistanceToNow(dateObj, { addSuffix: true })}`;
}
