// ============================================
// SIMPLIFIED PHONE AUTH - Using Supabase Native
// ============================================
// This uses Supabase's built-in signInWithOtp + verifyOtp
// Combined with our SMS Hook for mNotify/Termii delivery
//
// Flow:
// 1. User enters phone → signInWithOtp() → SMS Hook sends OTP
// 2. User enters OTP → verifyOtp() → User authenticated!
// ============================================

import { supabase } from './supabase';
import type { CountryCode } from '@warehousepos/types';

// ============================================
// Types
// ============================================

export interface SendOTPResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
  isNewUser?: boolean;
  needsProfileSetup?: boolean;
}

// ============================================
// Helpers
// ============================================

export function formatPhone(phone: string, country: CountryCode): string {
  const digits = phone.replace(/\D/g, '');
  
  if (country === 'GH') {
    if (digits.startsWith('233')) return '+' + digits;
    if (digits.startsWith('0')) return '+233' + digits.slice(1);
    return '+233' + digits;
  } else {
    if (digits.startsWith('234')) return '+' + digits;
    if (digits.startsWith('0')) return '+234' + digits.slice(1);
    return '+234' + digits;
  }
}

export function validatePhone(phone: string, country: CountryCode): { valid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, '');
  
  if (country === 'GH') {
    if (digits.length < 9 || digits.length > 12) {
      return { valid: false, error: 'Invalid Ghana phone number' };
    }
  } else {
    if (digits.length < 10 || digits.length > 13) {
      return { valid: false, error: 'Invalid Nigeria phone number' };
    }
  }
  
  return { valid: true };
}

// ============================================
// Authentication Functions
// ============================================

/**
 * Send OTP using Supabase's native phone auth
 * The SMS is sent via our SMS Hook (mNotify/Termii)
 */
export async function sendOTP(
  phone: string,
  country: CountryCode
): Promise<SendOTPResult> {
  const validation = validatePhone(phone, country);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  const formattedPhone = formatPhone(phone, country);
  console.log('Sending OTP to:', formattedPhone);
  
  try {
    // Use Supabase's built-in signInWithOtp
    // This triggers our SMS Hook which sends via mNotify/Termii
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        // If user doesn't exist, create them
        shouldCreateUser: true,
        // Store country for later use
        data: { country },
      },
    });
    
    if (error) {
      console.error('signInWithOtp error:', error);
      
      // Handle specific errors
      if (error.message.includes('rate limit')) {
        return { success: false, error: 'Too many requests. Please wait 60 seconds.' };
      }
      if (error.message.includes('Phone signups are disabled')) {
        return { success: false, error: 'Phone login is not enabled. Please contact support.' };
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('OTP sent successfully');
    return { 
      success: true, 
      message: `Verification code sent to ${formattedPhone}` 
    };
  } catch (error: any) {
    console.error('sendOTP exception:', error);
    return { success: false, error: error.message || 'Failed to send verification code' };
  }
}

/**
 * Verify OTP using Supabase's native phone auth
 * Returns authenticated user and session
 */
export async function verifyOTP(
  phone: string,
  country: CountryCode,
  otp: string
): Promise<VerifyOTPResult> {
  if (!/^\d{6}$/.test(otp)) {
    return { success: false, error: 'Please enter a valid 6-digit code' };
  }
  
  const formattedPhone = formatPhone(phone, country);
  console.log('Verifying OTP for:', formattedPhone);
  
  try {
    // Use Supabase's built-in verifyOtp
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });
    
    if (error) {
      console.error('verifyOtp error:', error);
      
      if (error.message.includes('expired')) {
        return { success: false, error: 'Code expired. Please request a new one.' };
      }
      if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        return { success: false, error: 'Invalid code. Please try again.' };
      }
      
      return { success: false, error: error.message };
    }
    
    if (!data.session || !data.user) {
      return { success: false, error: 'Verification failed. Please try again.' };
    }
    
    console.log('OTP verified, user:', data.user.id);
    
    // Check if user has a profile
    const { data: profile } = await supabase
      .from('users')
      .select('*, tenant:tenants(*), store:stores(*)')
      .eq('id', data.user.id)
      .maybeSingle();
    
    return {
      success: true,
      user: data.user,
      session: data.session,
      isNewUser: data.user.created_at === data.user.last_sign_in_at,
      needsProfileSetup: !profile,
    };
  } catch (error: any) {
    console.error('verifyOTP exception:', error);
    return { success: false, error: error.message || 'Failed to verify code' };
  }
}

/**
 * Create user profile after first login
 */
export async function createUserProfile(
  userId: string,
  data: {
    fullName: string;
    businessName: string;
    country: CountryCode;
  }
): Promise<{ success: boolean; error?: string; tenant?: any; store?: any; user?: any }> {
  try {
    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.businessName,
        country: data.country,
        settings: {
          currency: data.country === 'GH' ? 'GHS' : 'NGN',
          dateFormat: 'DD/MM/YYYY',
          timezone: data.country === 'GH' ? 'Africa/Accra' : 'Africa/Lagos',
        },
      })
      .select()
      .single();
    
    if (tenantError) {
      console.error('Create tenant error:', tenantError);
      return { success: false, error: 'Failed to create business' };
    }
    
    // Create store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenant.id,
        name: 'Main Store',
        address: '',
        is_active: true,
      })
      .select()
      .single();
    
    if (storeError) {
      console.error('Create store error:', storeError);
      // Cleanup tenant
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return { success: false, error: 'Failed to create store' };
    }
    
    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        tenant_id: tenant.id,
        store_id: store.id,
        full_name: data.fullName,
        role: 'owner',
        permissions: ['all'],
        is_active: true,
      })
      .select()
      .single();
    
    if (userError) {
      console.error('Create user error:', userError);
      // Cleanup
      await supabase.from('stores').delete().eq('id', store.id);
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return { success: false, error: 'Failed to create user profile' };
    }
    
    return { success: true, tenant, store, user };
  } catch (error: any) {
    console.error('createUserProfile exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current user profile
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, tenant:tenants(*), store:stores(*)')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Get profile error:', error);
    return null;
  }
  
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
  }
  return !error;
}
