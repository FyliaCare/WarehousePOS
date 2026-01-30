// Email Authentication Service
// Simple, reliable email-based auth using Supabase

import { supabase } from './supabase';
import type { CountryCode } from '@warehousepos/types';

// ============================================
// Types
// ============================================

export interface EmailSignUpResult {
  success: boolean;
  error?: string;
  user?: any;
  needsEmailVerification?: boolean;
}

export interface EmailSignInResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
  needsProfileSetup?: boolean;
}

export interface ProfileSetupResult {
  success: boolean;
  error?: string;
  user?: any;
  tenant?: any;
  store?: any;
}

// ============================================
// Email Sign Up
// ============================================

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<EmailSignUpResult> {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }
    
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    console.log('Signing up with email:', email);

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('Sign up error:', error);
      if (error.message.includes('already registered')) {
        return { success: false, error: 'This email is already registered. Please sign in.' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account' };
    }

    console.log('Sign up successful:', data.user.id);

    // Check if email confirmation is required
    const needsEmailVerification = !data.session;

    return {
      success: true,
      user: data.user,
      needsEmailVerification,
    };
  } catch (error: any) {
    console.error('Sign up exception:', error);
    return { success: false, error: error.message || 'Sign up failed' };
  }
}

// ============================================
// Email Sign In
// ============================================

export async function signInWithEmail(
  email: string,
  password: string
): Promise<EmailSignInResult> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    console.log('Signing in with email:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      if (error.message.includes('Invalid login')) {
        return { success: false, error: 'Invalid email or password' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'Please check your email and confirm your account' };
      }
      return { success: false, error: error.message };
    }

    if (!data.session) {
      return { success: false, error: 'Failed to create session' };
    }

    console.log('Sign in successful:', data.user?.id);

    // Check if user has a profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      success: true,
      user: data.user,
      session: data.session,
      needsProfileSetup: !profile || !profile.tenant_id,
    };
  } catch (error: any) {
    console.error('Sign in exception:', error);
    return { success: false, error: error.message || 'Sign in failed' };
  }
}

// ============================================
// Profile Setup (After Sign Up)
// ============================================

export async function setupBusinessProfile(params: {
  userId: string;
  businessName: string;
  fullName: string;
  country: CountryCode;
  phone?: string;
}): Promise<ProfileSetupResult> {
  const { userId, businessName, fullName, country, phone } = params;

  console.log('Setting up business profile:', { userId, businessName, fullName, country });

  try {
    // Check if profile already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (existingUser?.tenant_id) {
      // Profile exists - just update names
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({ full_name: fullName, phone })
        .eq('id', userId)
        .select('*, tenant:tenants(*), store:stores(*)')
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      const userData = updated as any;
      return {
        success: true,
        user: userData,
        tenant: userData.tenant,
        store: userData.store,
      };
    }

    // Create new tenant, store, and user profile
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString(36);

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: businessName,
        slug,
        country,
        currency: country === 'GH' ? 'GHS' : 'NGN',
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      } as any)
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant creation error:', tenantError);
      return { success: false, error: 'Failed to create business: ' + (tenantError?.message || 'Unknown error') };
    }

    const tenantData = tenant as any;

    // Create store
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

    if (storeError || !store) {
      console.error('Store creation error:', storeError);
      await supabase.from('tenants').delete().eq('id', tenantData.id);
      return { success: false, error: 'Failed to create store: ' + (storeError?.message || 'Unknown error') };
    }

    const storeData = store as any;

    // Create user profile
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        tenant_id: tenantData.id,
        store_id: storeData.id,
        full_name: fullName,
        phone: phone || null,
        role: 'owner',
        is_active: true,
      } as any)
      .select()
      .single();

    if (userError) {
      console.error('User profile error:', userError);
      await supabase.from('stores').delete().eq('id', storeData.id);
      await supabase.from('tenants').delete().eq('id', tenantData.id);
      return { success: false, error: 'Failed to create profile: ' + userError.message };
    }

    console.log('Profile setup complete!');

    return {
      success: true,
      user: userProfile,
      tenant: tenantData,
      store: storeData,
    };
  } catch (error: any) {
    console.error('Profile setup error:', error);
    return { success: false, error: error.message || 'Profile setup failed' };
  }
}

// ============================================
// Password Reset
// ============================================

export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Sign Out
// ============================================

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

// ============================================
// Get Current User with Profile
// ============================================

export async function getCurrentUserWithProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*, tenant:tenants(*), store:stores(*)')
      .eq('id', user.id)
      .maybeSingle();

    return { user, profile };
  } catch {
    return { user: null, profile: null };
  }
}
