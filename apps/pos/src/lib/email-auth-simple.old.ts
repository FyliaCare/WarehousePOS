// Simplified Email Authentication Service
// Bulletproof registration with minimal dependencies

import { supabase } from './supabase';
import { logger } from './logger';
import type { CountryCode } from '@warehousepos/types';

// ============================================
// Types
// ============================================

export interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export interface SignInResult {
  success: boolean;
  error?: string;
  user?: any;
  needsProfileSetup?: boolean;
}

export interface SetupResult {
  success: boolean;
  error?: string;
  user?: any;
  tenant?: any;
  store?: any;
}

// ============================================
// SIGN UP - Create account
// ============================================

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<SignUpResult> {
  const cleanEmail = email.toLowerCase().trim();
  
  // Validation
  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and password are required' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  try {
    logger.debug('[AUTH] Signing up:', cleanEmail);

    // Step 1: Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      logger.error('[AUTH] Signup error:', error);
      if (error.message.includes('already registered')) {
        return { success: false, error: 'Email already registered. Please sign in.' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account' };
    }

    logger.debug('[AUTH] User created:', data.user.id);

    // Step 2: Immediately sign in to establish session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (signInError) {
      logger.error('[AUTH] Auto sign-in failed:', signInError);
      // User created but session failed - still return success
      // They can sign in manually
    } else {
      logger.debug('[AUTH] Session established');
    }

    return {
      success: true,
      userId: data.user.id,
    };
  } catch (err: any) {
    logger.error('[AUTH] Exception:', err);
    return { success: false, error: err.message || 'Sign up failed' };
  }
}

// ============================================
// SIGN IN - Login
// ============================================

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  try {
    logger.debug('[AUTH] Signing in:', cleanEmail);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      logger.error('[AUTH] Sign in error:', error);
      if (error.message.includes('Invalid login')) {
        return { success: false, error: 'Invalid email or password' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Login failed' };
    }

    logger.debug('[AUTH] Signed in:', data.user.id);

    // Check if user has a profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', data.user.id)
      .maybeSingle();

    const needsProfileSetup = !profile || !profile.tenant_id;
    logger.debug('[AUTH] Needs profile setup:', needsProfileSetup);

    return {
      success: true,
      user: data.user,
      needsProfileSetup,
    };
  } catch (err: any) {
    logger.error('[AUTH] Exception:', err);
    return { success: false, error: err.message || 'Sign in failed' };
  }
}

// ============================================
// SETUP BUSINESS - Create tenant, store, user profile
// ============================================

export async function setupBusinessProfile(params: {
  userId: string;
  businessName: string;
  fullName: string;
  country: CountryCode;
  phone?: string;
}): Promise<SetupResult> {
  const { userId, businessName, fullName, country, phone } = params;

  logger.debug('[SETUP] Starting business setup:', { userId, businessName, country });

  try {
    // Verify we have a session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      logger.error('[SETUP] No session!');
      return { success: false, error: 'Not authenticated. Please sign in again.' };
    }
    logger.debug('[SETUP] Session verified');

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile?.tenant_id) {
      logger.debug('[SETUP] Profile already exists, fetching...');
      const { data: fullProfile } = await supabase
        .from('users')
        .select('*, tenant:tenants(*), store:stores(*)')
        .eq('id', userId)
        .single();
      
      return {
        success: true,
        user: fullProfile,
        tenant: (fullProfile as any)?.tenant,
        store: (fullProfile as any)?.store,
      };
    }

    // Generate unique slug
    const timestamp = Date.now().toString(36);
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + '-' + timestamp;

    // STEP 1: Create tenant
    logger.debug('[SETUP] Creating tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: businessName,
        slug: slug,
      })
      .select()
      .single();

    if (tenantError) {
      logger.error('[SETUP] Tenant error:', tenantError);
      return { success: false, error: 'Failed to create business: ' + tenantError.message };
    }
    logger.debug('[SETUP] Tenant created:', tenant.id);

    // STEP 2: Create store
    logger.debug('[SETUP] Creating store...');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenant.id,
        name: 'Main Store',
      })
      .select()
      .single();

    if (storeError) {
      logger.error('[SETUP] Store error:', storeError);
      // Cleanup tenant
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return { success: false, error: 'Failed to create store: ' + storeError.message };
    }
    logger.debug('[SETUP] Store created:', store.id);

    // STEP 3: Create user profile
    logger.debug('[SETUP] Creating user profile...');
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        tenant_id: tenant.id,
        store_id: store.id,
        full_name: fullName,
        phone: phone || null,
        role: 'owner',
      })
      .select()
      .single();

    if (userError) {
      logger.error('[SETUP] User error:', userError);
      // Cleanup
      await supabase.from('stores').delete().eq('id', store.id);
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return { success: false, error: 'Failed to create profile: ' + userError.message };
    }
    logger.debug('[SETUP] User profile created:', userProfile.id);

    logger.info('[SETUP] ✅ Business setup complete!', { important: true });
    return {
      success: true,
      user: userProfile,
      tenant: tenant,
      store: store,
    };
  } catch (err: any) {
    logger.error('[SETUP] Exception:', err);
    return { success: false, error: err.message || 'Setup failed' };
  }
}

// ============================================
// PASSWORD RESET
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================
// SIGN OUT
// ============================================

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================
// GET CURRENT USER
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
