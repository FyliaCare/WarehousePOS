import type { CountryCode } from '@warehousepos/types';

// ============================================
// PHONE NUMBER UTILITIES
// Ghana & Nigeria focused
// ============================================

export interface PhoneConfig {
  countryCode: string;
  dialCode: string;
  format: string;
  length: number;
  example: string;
}

export const PHONE_CONFIG: Record<CountryCode, PhoneConfig> = {
  GH: {
    countryCode: 'GH',
    dialCode: '+233',
    format: 'XXX XXX XXXX',
    length: 10, // Without country code
    example: '024 123 4567',
  },
  NG: {
    countryCode: 'NG',
    dialCode: '+234',
    format: 'XXX XXX XXXX',
    length: 10, // Without country code
    example: '080 123 4567',
  },
};

/**
 * Format phone number for display
 * @example formatPhone('0241234567', 'GH') → "024 123 4567"
 */
export function formatPhone(phone: string, _country: CountryCode = 'GH'): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Remove country code if present
  let local = digits;
  if (digits.startsWith('233')) {
    local = digits.slice(3);
  } else if (digits.startsWith('234')) {
    local = digits.slice(3);
  } else if (digits.startsWith('0')) {
    local = digits;
  }

  // Format as XXX XXX XXXX
  if (local.length >= 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 10)}`;
  }

  return local;
}

/**
 * Format phone with country code
 * @example formatPhoneInternational('0241234567', 'GH') → "+233 24 123 4567"
 */
export function formatPhoneInternational(
  phone: string,
  country: CountryCode = 'GH'
): string {
  const config = PHONE_CONFIG[country];
  const digits = phone.replace(/\D/g, '');
  
  // Get local number
  let local = digits;
  if (digits.startsWith('233') || digits.startsWith('234')) {
    local = digits.slice(3);
  } else if (digits.startsWith('0')) {
    local = digits.slice(1);
  }

  // Format with country code
  if (local.length >= 9) {
    return `${config.dialCode} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 9)}`;
  }

  return `${config.dialCode} ${local}`;
}

/**
 * Normalize phone number for storage (E.164 format)
 * @example normalizePhone('024 123 4567', 'GH') → "+233241234567"
 */
export function normalizePhone(
  phone: string,
  country: CountryCode = 'GH'
): string {
  const config = PHONE_CONFIG[country];
  const digits = phone.replace(/\D/g, '');
  
  // Already has country code
  if (digits.startsWith('233') || digits.startsWith('234')) {
    return `+${digits}`;
  }
  
  // Local format starting with 0
  if (digits.startsWith('0')) {
    return `${config.dialCode}${digits.slice(1)}`;
  }
  
  // Assume local without leading 0
  return `${config.dialCode}${digits}`;
}

/**
 * Validate phone number
 */
export function validatePhone(
  phone: string,
  country: CountryCode = 'GH'
): { valid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Check minimum length
  if (digits.length < 10) {
    return { valid: false, error: 'Phone number is too short' };
  }

  // Check maximum length (with country code)
  if (digits.length > 13) {
    return { valid: false, error: 'Phone number is too long' };
  }

  // Ghana-specific validation
  if (country === 'GH') {
    const local = digits.startsWith('233') ? digits.slice(3) : 
                  digits.startsWith('0') ? digits.slice(1) : digits;
    
    // Ghana mobile prefixes: 20, 23, 24, 25, 26, 27, 28, 50, 54, 55, 59
    const validPrefixes = ['20', '23', '24', '25', '26', '27', '28', '50', '54', '55', '59'];
    const prefix = local.slice(0, 2);
    
    if (!validPrefixes.includes(prefix)) {
      return { valid: false, error: 'Invalid Ghana phone number' };
    }
  }

  // Nigeria-specific validation
  if (country === 'NG') {
    const local = digits.startsWith('234') ? digits.slice(3) : 
                  digits.startsWith('0') ? digits.slice(1) : digits;
    
    // Nigeria mobile prefixes: 70, 80, 81, 90, 91
    const validPrefixes = ['70', '80', '81', '90', '91'];
    const prefix = local.slice(0, 2);
    
    if (!validPrefixes.includes(prefix)) {
      return { valid: false, error: 'Invalid Nigeria phone number' };
    }
  }

  return { valid: true };
}

/**
 * Get phone placeholder for input
 */
export function getPhonePlaceholder(country: CountryCode = 'GH'): string {
  return PHONE_CONFIG[country].example;
}

/**
 * Mask phone number for privacy
 * @example maskPhone('+233241234567') → "+233 *** *** 4567"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 4) {
    return phone;
  }

  const visible = digits.slice(-4);
  const prefix = digits.startsWith('233') ? '+233' : 
                 digits.startsWith('234') ? '+234' : '';

  return `${prefix} *** *** ${visible}`;
}
