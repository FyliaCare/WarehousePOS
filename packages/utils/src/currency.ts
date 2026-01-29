import type { CountryCode } from '@warehousepos/types';

// ============================================
// CURRENCY UTILITIES
// Ghana (GHS) & Nigeria (NGN) focused
// ============================================

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  decimals: number;
}

export const CURRENCY_CONFIG: Record<CountryCode, CurrencyConfig> = {
  GH: {
    code: 'GHS',
    symbol: '₵',
    locale: 'en-GH',
    decimals: 2,
  },
  NG: {
    code: 'NGN',
    symbol: '₦',
    locale: 'en-NG',
    decimals: 2,
  },
};

/**
 * Format amount as currency based on country
 * @example formatCurrency(1000, 'GH') → "₵1,000.00"
 * @example formatCurrency(1000, 'NG') → "₦1,000.00"
 */
export function formatCurrency(
  amount: number,
  country: CountryCode = 'GH'
): string {
  const config = CURRENCY_CONFIG[country];

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

/**
 * Get currency symbol for country
 */
export function getCurrencySymbol(country: CountryCode = 'GH'): string {
  return CURRENCY_CONFIG[country].symbol;
}

/**
 * Get currency code for country
 */
export function getCurrencyCode(country: CountryCode = 'GH'): string {
  return CURRENCY_CONFIG[country].code;
}

/**
 * Format amount as compact currency (for large numbers)
 * @example formatCompactCurrency(1500000, 'GH') → "₵1.5M"
 */
export function formatCompactCurrency(
  amount: number,
  country: CountryCode = 'GH'
): string {
  const config = CURRENCY_CONFIG[country];

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Parse currency string to number
 * @example parseCurrency("₵1,000.00") → 1000
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and thousand separators
  const cleaned = value.replace(/[₵₦$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(
  value: number,
  total: number
): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  amount: number,
  discount: number,
  type: 'percentage' | 'fixed'
): number {
  if (type === 'percentage') {
    return (amount * discount) / 100;
  }
  return Math.min(discount, amount);
}

/**
 * Calculate tax amount
 */
export function calculateTax(
  amount: number,
  taxRate: number,
  inclusive: boolean = false
): number {
  if (inclusive) {
    // Tax is already included in amount
    return amount - (amount / (1 + taxRate / 100));
  }
  // Tax needs to be added
  return (amount * taxRate) / 100;
}

/**
 * Round to currency decimals
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
