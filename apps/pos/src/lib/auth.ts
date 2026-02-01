// ============================================
// PHONE AUTHENTICATION SERVICE (SECURE)
// All SMS operations go through Edge Functions
// ============================================
import { supabase } from './supabase';
import { 
  validateOTPSendResponse, 
  validateOTPVerifyResponse,
  validatePINSetResponse,
  validatePINVerifyResponse,
} from './auth-schemas';

// Validate PIN strength
export function validatePIN(pin: string): { valid: boolean; error?: string } {
  if (!/^\d{4,6}$/.test(pin)) {
    return { valid: false, error: 'PIN must be 4-6 digits' };
  }
  
  // Check for sequential numbers (improved - checks anywhere in PIN)
  const sequential = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
  for (let i = 0; i <= pin.length - 4; i++) {
    const segment = pin.slice(i, i + 4);
    if (sequential.includes(segment)) {
      return { valid: false, error: 'PIN cannot contain sequential numbers' };
    }
  }
  
  // Check for repeated digits (3 or more consecutive)
  if (/(\d)\1{2,}/.test(pin)) {
    return { valid: false, error: 'PIN cannot have 3+ consecutive same digits' };
  }
  
  // Check for alternating patterns (1212, 121212)
  if (/(.)(.)\1\2/.test(pin)) {
    return { valid: false, error: 'PIN pattern is too simple (alternating)' };
  }
  
  // Check for repeating triplets (123123)
  if (pin.length === 6) {
    const first3 = pin.slice(0, 3);
    const second3 = pin.slice(3, 6);
    if (first3 === second3) {
      return { valid: false, error: 'PIN pattern is too simple (repeating)' };
    }
  }
  
  // Check for common PINs
  const common = ['0000', '1111', '1234', '1212', '1122', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '000000', '111111', '123123', '121212', '112233'];
  if (common.includes(pin)) {
    return { valid: false, error: 'PIN is too common, choose a different one' };
  }
  
  return { valid: true };
}

// Format phone number for display
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  // +233XXXXXXXXX -> 0XX XXX XXXX
  if (phone.startsWith('+233')) {
    const local = '0' + phone.slice(4);
    return `${local.slice(0,3)} ${local.slice(3,6)} ${local.slice(6)}`;
  }
  return phone;
}

// Format phone number for storage
export function formatPhone(phone: string, country: 'GH' | 'NG'): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (country === 'GH') {
    // Ghana: 024XXXXXXX or 233XXXXXXXXX -> +233XXXXXXXXX
    if (digits.startsWith('233')) {
      return '+' + digits;
    }
    if (digits.startsWith('0')) {
      return '+233' + digits.slice(1);
    }
    if (digits.length === 9) {
      return '+233' + digits;
    }
  }
  
  if (country === 'NG') {
    // Nigeria: 0801XXXXXXX or 234XXXXXXXXXX -> +234XXXXXXXXXX
    if (digits.startsWith('234')) {
      return '+' + digits;
    }
    if (digits.startsWith('0')) {
      return '+234' + digits.slice(1);
    }
    if (digits.length === 10) {
      return '+234' + digits;
    }
  }
  
  return phone;
}

// Phone validation
export function isValidPhone(phone: string, country: 'GH' | 'NG'): boolean {
  const digits = phone.replace(/\D/g, '');
  
  if (country === 'GH') {
    // Ghana numbers: 10 digits starting with 0, or 12 starting with 233
    if (digits.startsWith('0') && digits.length === 10) return true;
    if (digits.startsWith('233') && digits.length === 12) return true;
    if (digits.length === 9) return true; // Without prefix
  }
  
  if (country === 'NG') {
    // Nigeria numbers: 11 digits starting with 0, or 13 starting with 234
    if (digits.startsWith('0') && digits.length === 11) return true;
    if (digits.startsWith('234') && digits.length === 13) return true;
    if (digits.length === 10) return true; // Without prefix
  }
  
  return false;
}

// Send OTP via Edge Function (SECURE - no API keys exposed)
export async function sendOTP(phone: string, country: 'GH' | 'NG' = 'GH'): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const { data, error } = await supabase.functions.invoke('phone-otp-send', {
      body: { phone, country },
    });
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('Send OTP error:', error);
      return { success: false, message: error.message || 'Failed to send OTP' };
    }
    
    // Validate response with Zod
    const validated = validateOTPSendResponse(data);
    return validated;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Request timed out. Please try again.' };
    }
    console.error('Send OTP exception:', err);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

// Verify OTP via Edge Function
export async function verifyOTP(phone: string, otp: string, country: 'GH' | 'NG' = 'GH'): Promise<{
  success: boolean;
  message: string;
  user?: any;
  session?: any;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const { data, error } = await supabase.functions.invoke('phone-otp-verify', {
      body: { phone, otp, country },
    });
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('Verify OTP error:', error);
      return { success: false, message: error.message || 'Verification failed' };
    }
    
    // Validate response with Zod
    const validated = validateOTPVerifyResponse(data);
    
    // If session returned, set it in Supabase client
    if (validated.session) {
      await supabase.auth.setSession({
        access_token: validated.session.access_token,
        refresh_token: validated.session.refresh_token,
      });
    }
    
    return {
      success: validated.success,
      message: validated.message,
      user: validated.user,
      session: validated.session,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Request timed out. Please try again.' };
    }
    console.error('Verify OTP exception:', err);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

// Set user PIN (for quick login)
export async function setPIN(pin: string): Promise<{
  success: boolean;
  message: string;
}> {
  const validation = validatePIN(pin);
  if (!validation.valid) {
    return { success: false, message: validation.error! };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const { data, error } = await supabase.functions.invoke('pin-set', {
      body: { pin },
    });
    
    clearTimeout(timeoutId);

    if (error) {
      console.error('Set PIN error:', error);
      return { success: false, message: error.message || 'Failed to set PIN' };
    }

    // Validate response with Zod
    const validated = validatePINSetResponse(data);
    return validated;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Request timed out. Please try again.' };
    }
    console.error('Set PIN exception:', err);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

// Verify PIN for quick login (server-side verification + lockout)
export async function verifyPIN(phone: string, country: 'GH' | 'NG', pin: string): Promise<{
  success: boolean;
  message: string;
  session?: any;
  user?: any;
  profile?: any;
  needsProfileSetup?: boolean;
  lockedUntil?: string | null;
  attemptsRemaining?: number;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const { data, error } = await supabase.functions.invoke('pin-verify', {
      body: { phone, country, pin },
    });
    
    clearTimeout(timeoutId);

    if (error) {
      console.error('Verify PIN error:', error);
      return {
        success: false,
        message: error.message || 'PIN verification failed',
        lockedUntil: (error as any)?.lockedUntil,
      };
    }

    // Validate response with Zod
    const validated = validatePINVerifyResponse(data);

    if (validated.session) {
      await supabase.auth.setSession({
        access_token: validated.session.access_token,
        refresh_token: validated.session.refresh_token,
      });
    }

    return {
      success: validated.success,
      message: validated.message,
      session: validated.session,
      user: validated.user,
      profile: validated.profile,
      needsProfileSetup: validated.needsProfileSetup,
      lockedUntil: validated.lockedUntil,
      attemptsRemaining: validated.attemptsRemaining,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Request timed out. Please try again.' };
    }
    console.error('Verify PIN exception:', err);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// Get current session
export async function getSession() {
  return supabase.auth.getSession();
}

// Get current user
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
