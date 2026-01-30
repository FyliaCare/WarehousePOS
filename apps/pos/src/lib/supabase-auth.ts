// Supabase Native Phone Authentication Service
// Uses Supabase Auth with OTP for secure phone-based authentication

import { supabase } from './supabase';
import type { CountryCode } from '@warehousepos/types';

// ============================================
// Types
// ============================================

export interface SendOTPResult {
  success: boolean;
  error?: string;
  message?: string;
  devOTP?: string; // Only in development mode
}

export interface VerifyOTPResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
  isNewUser?: boolean;
  needsProfileSetup?: boolean;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  user?: any;
  tenant?: any;
  store?: any;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: any;
  tenant?: any;
  store?: any;
}

// ============================================
// Helpers
// ============================================

// Format phone number to international format
export function formatPhone(phone: string, country: CountryCode): string {
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
    return '+233' + digits;
  } else {
    // Nigeria: 0801XXXXXXX or 234XXXXXXXXXX -> +234XXXXXXXXXX
    if (digits.startsWith('234')) {
      return '+' + digits;
    }
    if (digits.startsWith('0')) {
      return '+234' + digits.slice(1);
    }
    return '+234' + digits;
  }
}

// Validate phone number format
export function validatePhone(phone: string, country: CountryCode): { valid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, '');
  
  if (country === 'GH') {
    // Ghana: 9-10 digits (with or without leading 0)
    if (digits.length < 9 || digits.length > 12) {
      return { valid: false, error: 'Invalid Ghana phone number' };
    }
  } else {
    // Nigeria: 10-11 digits (with or without leading 0)
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
 * Send OTP to phone number via Edge Function (mNotify/Termii)
 * Uses local SMS providers for cheaper rates while keeping Supabase security
 */
export async function sendOTP(
  phone: string,
  country: CountryCode,
  purpose: 'login' | 'registration' = 'login'
): Promise<SendOTPResult> {
  // Validate phone
  const validation = validatePhone(phone, country);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  try {
    // Production timeout - SMS delivery can take up to 20 seconds
    const timeoutMs = 30000;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Please try again.')), timeoutMs)
    );

    const invokePromise = supabase.functions.invoke('phone-otp-send', {
      body: { phone, country, purpose },
    });

    const { data, error } = await Promise.race([invokePromise, timeout]);
    
    if (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: error.message || 'Failed to send verification code' };
    }
    
    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to send verification code' };
    }
    
    return { 
      success: true, 
      message: data.message,
      // Dev mode: Return OTP for testing
      ...(data.devOTP && { devOTP: data.devOTP }),
    };
  } catch (error: any) {
    console.error('Send OTP exception:', error);
    return { success: false, error: error.message || 'Failed to send verification code' };
  }
}

/**
 * Verify OTP and sign in the user via Edge Function
 * Creates auth.user if new, returns JWT session
 */
export async function verifyOTP(
  phone: string,
  country: CountryCode,
  otp: string,
  purpose: 'login' | 'registration' = 'login'
): Promise<VerifyOTPResult> {
  if (!/^\d{6}$/.test(otp)) {
    return { success: false, error: 'Please enter a valid 6-digit code' };
  }
  
  try {
    console.log('Invoking phone-otp-verify...');
    
    // Add timeout for Edge Function call
    const timeoutMs = 30000;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Verification timed out. Please try again.')), timeoutMs)
    );

    const invokePromise = supabase.functions.invoke('phone-otp-verify', {
      body: { phone, country, otp, purpose },
    });

    const { data, error } = await Promise.race([invokePromise, timeout]);
    
    console.log('phone-otp-verify response:', { data, error });
    
    if (error) {
      console.error('Verify OTP error:', error);
      // Try to extract actual error message from response
      let errorMessage = 'Failed to verify code';
      if (data?.error) {
        errorMessage = data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      // FunctionsHttpError contains the context - try to get detailed message
      if (error.context?.body) {
        try {
          const bodyText = await error.context.text();
          const bodyJson = JSON.parse(bodyText);
          if (bodyJson.error) {
            errorMessage = bodyJson.error;
          }
        } catch {
          // Ignore parsing errors
        }
      }
      return { success: false, error: errorMessage };
    }
    
    if (!data?.success) {
      return { success: false, error: data?.error || 'Invalid verification code' };
    }
    
    // If we got a session, set it in Supabase client
    // Use fire-and-forget to prevent blocking on auth state listeners
    if (data.session) {
      console.log('Setting session...');
      supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }).then(() => {
        console.log('Session set successfully');
      }).catch((sessionError) => {
        console.error('Failed to set session:', sessionError);
      });
      // Don't await - let it complete in background
    }
    
    console.log('Returning success from verifyOTP');
    return {
      success: true,
      user: data.user,
      session: data.session,
      isNewUser: data.isNewUser,
      needsProfileSetup: data.needsProfileSetup,
    };
  } catch (error: any) {
    console.error('Verify OTP exception:', error);
    return { success: false, error: error.message || 'Failed to verify code' };
  }
}

/**
 * Check if a user profile exists in public.users table
 */
export async function checkUserProfile(userId: string): Promise<{
  exists: boolean;
  user?: any;
  tenant?: any;
  store?: any;
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, tenant:tenants(*), store:stores(*)')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return { exists: false };
    }
    
    // Cast to any for relation fields (TypeScript doesn't infer relation aliases)
    const userData = data as any;
    
    return {
      exists: true,
      user: userData,
      tenant: userData.tenant,
      store: userData.store,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Create or update user profile after phone verification
 * Called during registration after OTP is verified
 * 
 * OPTIMIZED: Single check + update/create pattern
 * The database trigger auto-creates a profile when auth.user is created.
 * This function handles both cases efficiently.
 */
export async function createUserProfile(params: {
  userId: string;
  phone: string;
  country: CountryCode;
  businessName: string;
  fullName: string;
  email?: string;
}): Promise<RegisterResult> {
  const { userId, phone, country, businessName, fullName, email } = params;
  const formattedPhone = formatPhone(phone, country);
  
  console.log('createUserProfile (optimized) called with:', { userId, businessName, fullName });
  const startTime = Date.now();
  
  try {
    // Single query to check if profile exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, tenant_id, store_id')
      .eq('id', userId)
      .maybeSingle();
    
    console.log('Profile check result:', { existingUser, checkError, took: Date.now() - startTime + 'ms' });
    
    if (checkError) {
      console.error('Profile check error:', checkError);
    }
    
    if (existingUser && existingUser.tenant_id) {
      // FAST PATH: Profile exists with tenant (created by trigger) - just update names
      const tenantId = existingUser.tenant_id;
      
      console.log('Updating existing profile with tenant:', tenantId);
      
      // Parallel updates for speed
      const [tenantResult, userResult] = await Promise.all([
        // Update tenant name
        supabase.from('tenants').update({ 
          name: businessName,
          country,
          currency: country === 'GH' ? 'GHS' : 'NGN',
        }).eq('id', tenantId),
        
        // Update user profile
        supabase.from('users').update({
          full_name: fullName,
          phone: formattedPhone,
          email: email || `${formattedPhone.replace(/\+/g, '')}@phone.warehousepos.app`,
        }).eq('id', userId).select('*, tenant:tenants(*), store:stores(*)').single(),
      ]);
      
      console.log('Update results:', { tenantResult, userResult });
      
      if (userResult.error) {
        console.error('User update error:', userResult.error);
        return { success: false, error: 'Failed to update profile: ' + userResult.error.message };
      }
      
      const userData = userResult.data as any;
      console.log('Profile updated in:', Date.now() - startTime, 'ms');
      
      return {
        success: true,
        user: userData,
        tenant: userData.tenant,
        store: userData.store,
      };
    }
    
    // SLOW PATH: No existing profile OR profile without tenant - create fresh
    console.log('Creating new profile from scratch (no existing profile or no tenant)...');
    
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString(36);
    const userEmail = email || `${formattedPhone.replace(/\+/g, '')}@phone.warehousepos.app`;
    
    console.log('Creating tenant with slug:', slug);
    
    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: businessName,
        slug,
        country,
        currency: country === 'GH' ? 'GHS' : 'NGN',
        subscription_status: 'trial' as const,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      } as any)
      .select()
      .single();
    
    console.log('Tenant creation result:', { tenant, tenantError });
    
    if (tenantError || !tenant) {
      console.error('Tenant creation error:', tenantError);
      return { success: false, error: 'Failed to create business: ' + (tenantError?.message || 'Unknown error') };
    }
    
    const tenantData = tenant as any;
    console.log('Tenant created:', tenantData.id);
    
    // Create store
    console.log('Creating store...');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenantData.id,
        name: 'Main Store',
        city: country === 'GH' ? 'Accra' : 'Lagos',
        is_active: true,
      } as any)
      .select()
      .single();
    
    console.log('Store creation result:', { store, storeError });
    
    if (storeError || !store) {
      console.error('Store creation error:', storeError);
      await supabase.from('tenants').delete().eq('id', tenantData.id);
      return { success: false, error: 'Failed to create store: ' + (storeError?.message || 'Unknown error') };
    }
    
    const storeData = store as any;
    console.log('Store created:', storeData.id);
    
    // Create user profile
    console.log('Creating user profile...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        tenant_id: tenantData.id,
        store_id: storeData.id,
        phone: formattedPhone,
        full_name: fullName,
        email: userEmail,
        role: 'owner' as const,
        is_active: true,
      } as any)
      .select()
      .single();
    
    console.log('User profile creation result:', { user, userError });
    
    if (userError) {
      console.error('User profile creation error:', userError);
      await supabase.from('stores').delete().eq('id', storeData.id);
      await supabase.from('tenants').delete().eq('id', tenantData.id);
      return { success: false, error: 'Failed to create user profile: ' + userError.message };
    }
    
    console.log('Profile created in:', Date.now() - startTime, 'ms');
    return {
      success: true,
      user,
      tenant: tenantData,
      store: storeData,
    };
  } catch (error: any) {
    console.error('Profile creation error:', error);
    return { success: false, error: error.message || 'Registration failed' };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  return session;
}

/**
 * Get current user with profile data
 */
export async function getCurrentUser(): Promise<LoginResult> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Get user profile with tenant and store
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*, tenant:tenants(*), store:stores(*)')
      .eq('id', authUser.id)
      .single();
    
    if (profileError || !userProfile) {
      return { success: false, error: 'User profile not found' };
    }
    
    // Cast to any for relation fields (TypeScript doesn't infer relation aliases)
    const userData = userProfile as any;
    
    return {
      success: true,
      user: userData,
      tenant: userData.tenant,
      store: userData.store,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
