import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with TailwindCSS support.
 * Resolves conflicting Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date using the specified locale and options.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  },
  locale = 'en-US'
) {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    ...options,
  }).format(d);
}

/**
 * Formats a number as a currency.
 */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {},
  locale = 'en-US'
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    ...options,
  }).format(amount);
}

/**
 * Formats a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats a duration in seconds to a human-readable string.
 */
export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hDisplay = h > 0 ? `${h}:` : '';
  const mDisplay = `${m.toString().padStart(h > 0 ? 2 : 1, '0')}:`;
  const sDisplay = `${s.toString().padStart(2, '0')}`;

  return hDisplay + mDisplay + sDisplay;
}

/**
 * Debounces a function call.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Truncates a string to a specified length with an ellipsis.
 */
export function truncate(str: string, length: number) {
  return str.length > length ? str.substring(0, length) + '...' : str;
} 