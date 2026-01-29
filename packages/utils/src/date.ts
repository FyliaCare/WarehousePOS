import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

import type { CountryCode } from '@warehousepos/types';

// ============================================
// DATE/TIME UTILITIES
// ============================================

export const TIMEZONE_CONFIG: Record<CountryCode, string> = {
  GH: 'Africa/Accra',
  NG: 'Africa/Lagos',
};

/**
 * Format date for display
 * @example formatDate('2026-01-27') → "Jan 27, 2026"
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'MMM d, yyyy'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Format date and time
 * @example formatDateTime('2026-01-27T14:30:00') → "Jan 27, 2026 at 2:30 PM"
 */
export function formatDateTime(
  date: string | Date,
  formatStr: string = "MMM d, yyyy 'at' h:mm a"
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Format time only
 * @example formatTime('2026-01-27T14:30:00') → "2:30 PM"
 */
export function formatTime(
  date: string | Date,
  formatStr: string = 'h:mm a'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Get relative time (time ago)
 * @example timeAgo('2026-01-27T14:30:00') → "5 minutes ago"
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Smart date formatting based on how recent
 * @example smartDate() → "Today at 2:30 PM", "Yesterday at 10:00 AM", "Mon at 9:00 AM", "Jan 20"
 */
export function smartDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) {
    return `Today at ${format(d, 'h:mm a')}`;
  }

  if (isYesterday(d)) {
    return `Yesterday at ${format(d, 'h:mm a')}`;
  }

  if (isThisWeek(d)) {
    return format(d, "EEE 'at' h:mm a");
  }

  if (isThisYear(d)) {
    return format(d, 'MMM d');
  }

  return format(d, 'MMM d, yyyy');
}

/**
 * Format duration in minutes to human readable
 * @example formatDuration(90) → "1h 30m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Get date range presets
 */
export function getDateRangePresets() {
  const now = new Date();

  return {
    today: {
      label: 'Today',
      start: startOfDay(now),
      end: endOfDay(now),
    },
    yesterday: {
      label: 'Yesterday',
      start: startOfDay(subDays(now, 1)),
      end: endOfDay(subDays(now, 1)),
    },
    last7Days: {
      label: 'Last 7 Days',
      start: startOfDay(subDays(now, 6)),
      end: endOfDay(now),
    },
    last30Days: {
      label: 'Last 30 Days',
      start: startOfDay(subDays(now, 29)),
      end: endOfDay(now),
    },
    thisWeek: {
      label: 'This Week',
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    },
    lastWeek: {
      label: 'Last Week',
      start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
      end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
    },
    thisMonth: {
      label: 'This Month',
      start: startOfMonth(now),
      end: endOfMonth(now),
    },
    lastMonth: {
      label: 'Last Month',
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(subMonths(now, 1)),
    },
    thisYear: {
      label: 'This Year',
      start: startOfYear(now),
      end: endOfYear(now),
    },
  };
}

/**
 * Get ETA string
 * @example getETA(new Date(), 30) → "3:00 PM"
 */
export function getETA(start: Date, minutes: number): string {
  const eta = addDays(start, 0);
  eta.setMinutes(eta.getMinutes() + minutes);
  return format(eta, 'h:mm a');
}

/**
 * Check if time is within operating hours
 */
export function isWithinOperatingHours(
  hours: { open: string; close: string } | undefined,
  time: Date = new Date()
): boolean {
  if (!hours) return false;

  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);

  const currentMinutes = time.getHours() * 60 + time.getMinutes();
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

// Re-export commonly used date-fns functions
export {
  parseISO,
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  addDays,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
};
