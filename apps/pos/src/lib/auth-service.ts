/**
 * ============================================
 * WAREHOUSEPOS AUTHENTICATION SERVICE
 * ============================================
 * 
 * A robust, production-ready authentication system
 * using Supabase Auth with proper error handling.
 * 
 * Features:
 * - Email/Password authentication
 * - Email verification flow
 * - Password reset flow
 * - Business profile setup during registration
 * - Session management
 * - Proper error handling with user-friendly messages
 */

import { supabase } from './supabase';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Get the base URL for redirects.
 * Uses VITE_APP_URL env var in production, falls back to window.location.origin
 */
function getBaseUrl(): string {
  // Check for environment variable first (production)
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  // Fall back to current origin (works in development)
  return window.location.origin;
}

// Auth callback URL for email verification and password reset
const AUTH_CALLBACK_URL = `${getBaseUrl()}/auth/callback`;
const RESET_PASSWORD_URL = `${getBaseUrl()}/reset-password`;

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface UserProfile {
  id: string;
  auth_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'manager' | 'cashier';
  tenant_id?: string;
  store_id?: string;
  tenant?: Tenant;
  store?: Store;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  country: 'GH' | 'NG';
  currency: string;
  subscription_status: string;
  business_type?: string;
}

export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  is_main: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
}

export interface SignUpResult extends AuthResult {
  userId?: string;
  needsBusinessSetup?: boolean;
  needsEmailVerification?: boolean;
}

export interface SignInResult extends AuthResult {
  user?: AuthUser;
  profile?: UserProfile;
  needsBusinessSetup?: boolean;
  needsEmailVerification?: boolean;
}

export interface ProfileResult extends AuthResult {
  profile?: UserProfile;
  tenant?: Tenant;
  store?: Store;
}

// ============================================
// ERROR MESSAGES (User-friendly)
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'Email not confirmed': 'Please verify your email before signing in.',
  'User already registered': 'An account with this email already exists. Try signing in.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'invalid_credentials': 'Incorrect email or password.',
  'email_not_confirmed': 'Please check your email and click the verification link.',
  'user_already_exists': 'This email is already registered.',
  'weak_password': 'Password is too weak. Use at least 6 characters.',
  'rate_limit': 'Too many attempts. Please wait a moment and try again.',
};

function getErrorMessage(error: any): string {
  const message = error?.message || error?.error_description || String(error);
  return ERROR_MESSAGES[message] || message || 'An unexpected error occurred.';
}

// ============================================
// SIGN UP
// ============================================

/**
 * Create a new user account with email and password.
 * Supabase will send a verification email.
 * After email verification and login, user needs to complete business setup.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<SignUpResult> {
  // Validation
  const cleanEmail = email.toLowerCase().trim();
  
  if (!cleanEmail) {
    return { success: false, error: 'Email is required', code: 'missing_email' };
  }
  if (!password) {
    return { success: false, error: 'Password is required', code: 'missing_password' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters', code: 'weak_password' };
  }
  if (!fullName.trim()) {
    return { success: false, error: 'Full name is required', code: 'missing_name' };
  }

  try {
    console.log('[Auth] Starting signup for:', cleanEmail);

    // Create auth user - Supabase will send verification email automatically
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        // Redirect after email verification (uses env var in production)
        emailRedirectTo: `${AUTH_CALLBACK_URL}?type=signup`,
      },
    });

    if (error) {
      console.error('[Auth] Signup error:', error);
      return { success: false, error: getErrorMessage(error), code: 'signup_failed' };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account', code: 'no_user' };
    }

    console.log('[Auth] User created:', data.user.id);
    
    // Check if email confirmation is required
    // If session is null but user exists, email confirmation is enabled
    const needsEmailVerification = !data.session;
    
    if (needsEmailVerification) {
      console.log('[Auth] Email verification required');
      return {
        success: true,
        userId: data.user.id,
        needsEmailVerification: true,
        needsBusinessSetup: true,
      };
    }

    // If we have a session immediately (email confirmation disabled in Supabase)
    console.log('[Auth] Session established (email confirmation disabled)');
    return {
      success: true,
      userId: data.user.id,
      needsEmailVerification: false,
      needsBusinessSetup: true,
    };
  } catch (err: any) {
    console.error('[Auth] Signup exception:', err);
    return { success: false, error: getErrorMessage(err), code: 'exception' };
  }
}

// ============================================
// SIGN IN
// ============================================

/**
 * Sign in with email and password.
 * Returns user profile if exists, or indicates business setup is needed.
 */
export async function signIn(
  email: string,
  password: string
): Promise<SignInResult> {
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and password are required', code: 'missing_credentials' };
  }

  try {
    console.log('[Auth] Signing in:', cleanEmail);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      console.error('[Auth] Sign in error:', error);
      return { success: false, error: getErrorMessage(error), code: 'signin_failed' };
    }

    if (!data.user) {
      return { success: false, error: 'Sign in failed', code: 'no_user' };
    }

    console.log('[Auth] Signed in:', data.user.id);

    // Check for user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        *,
        tenant:tenants(*),
        store:stores(*)
      `)
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Auth] Profile fetch error:', profileError);
    }

    const needsBusinessSetup = !profile || !profile.tenant_id;
    console.log('[Auth] Has profile:', !!profile, 'Needs setup:', needsBusinessSetup);

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email!,
        fullName: data.user.user_metadata?.full_name,
      },
      profile: profile as UserProfile | undefined,
      needsBusinessSetup,
    };
  } catch (err: any) {
    console.error('[Auth] Sign in exception:', err);
    return { success: false, error: getErrorMessage(err), code: 'exception' };
  }
}

// ============================================
// SIGN OUT
// ============================================

export async function signOut(): Promise<AuthResult> {
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
// PASSWORD RESET
// ============================================

/**
 * Send password reset email to user.
 */
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const cleanEmail = email.toLowerCase().trim();
  
  if (!cleanEmail) {
    return { success: false, error: 'Email is required' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: RESET_PASSWORD_URL,
    });

    if (error) {
      // Don't reveal if email exists or not for security
      console.error('[Auth] Password reset error:', error);
    }

    // Always return success to prevent email enumeration
    return { success: true };
  } catch (err: any) {
    console.error('[Auth] Password reset exception:', err);
    // Still return success for security
    return { success: true };
  }
}

/**
 * Update password (used after clicking reset link).
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
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
// EMAIL VERIFICATION
// ============================================

/**
 * Resend verification email to user.
 */
export async function resendVerificationEmail(email: string): Promise<AuthResult> {
  const cleanEmail = email.toLowerCase().trim();
  
  if (!cleanEmail) {
    return { success: false, error: 'Email is required' };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: `${AUTH_CALLBACK_URL}?type=signup`,
      },
    });

    if (error) {
      console.error('[Auth] Resend verification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Auth] Resend verification exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Handle the auth callback from Supabase (email verification, password reset, etc.)
 * Call this on the /auth/callback page to process the URL tokens.
 */
export async function handleAuthCallback(): Promise<{
  success: boolean;
  type?: 'signup' | 'recovery' | 'invite' | 'magiclink';
  error?: string;
}> {
  try {
    // Get the hash fragment from URL (Supabase puts tokens there)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type') as 'signup' | 'recovery' | 'invite' | 'magiclink' | null;
    
    // Also check query params (some Supabase configs use these)
    const queryParams = new URLSearchParams(window.location.search);
    const queryType = queryParams.get('type') as 'signup' | 'recovery' | null;
    
    console.log('[Auth] Callback received, type:', type || queryType);

    if (accessToken && refreshToken) {
      // Set the session from the tokens
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('[Auth] Session set error:', error);
        return { success: false, error: error.message };
      }

      console.log('[Auth] Session established from callback');
      return { success: true, type: type || queryType || 'signup' };
    }

    // Try to get existing session (might already be set by Supabase)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('[Auth] Existing session found');
      return { success: true, type: type || queryType || 'signup' };
    }

    return { success: false, error: 'No valid tokens found' };
  } catch (err: any) {
    console.error('[Auth] Callback exception:', err);
    return { success: false, error: err.message };
  }
}

// ============================================
// BUSINESS SETUP
// ============================================

export interface BusinessSetupParams {
  businessName: string;
  fullName: string;
  country: 'GH' | 'NG';
  phone?: string;
}

/**
 * Complete business setup for new users.
 * Creates tenant, store, and updates user profile.
 */
export async function setupBusiness(params: BusinessSetupParams): Promise<ProfileResult> {
  const { businessName, fullName, country, phone } = params;

  if (!businessName.trim()) {
    return { success: false, error: 'Business name is required' };
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated. Please sign in again.', code: 'no_session' };
    }

    console.log('[Auth] Setting up business for:', user.id);

    // Check if user already has a profile with tenant
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*, tenant:tenants(*), store:stores(*)')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile?.tenant_id) {
      console.log('[Auth] Profile already exists with tenant');
      return {
        success: true,
        profile: existingProfile as UserProfile,
        tenant: existingProfile.tenant as Tenant,
        store: existingProfile.store as Store,
      };
    }

    // Generate unique slug
    const timestamp = Date.now().toString(36);
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) + '-' + timestamp;

    // Currency based on country
    const currency = country === 'GH' ? 'GHS' : 'NGN';

    // STEP 1: Create tenant
    console.log('[Auth] Creating tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: businessName.trim(),
        slug,
        country,
        currency,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('[Auth] Tenant creation failed:', tenantError);
      return { success: false, error: 'Failed to create business: ' + tenantError.message };
    }

    console.log('[Auth] Tenant created:', tenant.id);

    // STEP 2: Create main store
    console.log('[Auth] Creating store...');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenant.id,
        name: 'Main Store',
        is_main: true,
      })
      .select()
      .single();

    if (storeError) {
      console.error('[Auth] Store creation failed:', storeError);
      // Rollback tenant
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return { success: false, error: 'Failed to create store: ' + storeError.message };
    }

    console.log('[Auth] Store created:', store.id);

    // STEP 3: Create or update user profile
    console.log('[Auth] Creating/updating user profile...');
    
    // Format phone
    const formattedPhone = phone ? formatPhoneNumber(phone, country) : null;

    if (existingProfile) {
      // Update existing profile
      const { data: profile, error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          phone: formattedPhone,
          tenant_id: tenant.id,
          store_id: store.id,
          role: 'owner',
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[Auth] Profile update failed:', updateError);
        await supabase.from('stores').delete().eq('id', store.id);
        await supabase.from('tenants').delete().eq('id', tenant.id);
        return { success: false, error: 'Failed to update profile: ' + updateError.message };
      }

      console.log('[Auth] Profile updated:', profile.id);
      return { success: true, profile: profile as UserProfile, tenant, store };
    } else {
      // Create new profile
      const { data: profile, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          auth_id: user.id, // mirror for backward compatibility
          full_name: fullName.trim(),
          email: user.email,
          phone: formattedPhone,
          tenant_id: tenant.id,
          store_id: store.id,
          role: 'owner',
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Auth] Profile creation failed:', insertError);
        await supabase.from('stores').delete().eq('id', store.id);
        await supabase.from('tenants').delete().eq('id', tenant.id);
        return { success: false, error: 'Failed to create profile: ' + insertError.message };
      }

      console.log('[Auth] Profile created:', profile.id);
      return { success: true, profile: profile as UserProfile, tenant, store };
    }
  } catch (err: any) {
    console.error('[Auth] Business setup exception:', err);
    return { success: false, error: err.message || 'Setup failed' };
  }
}

// ============================================
// GET CURRENT USER & PROFILE
// ============================================

/**
 * Get the current authenticated user and their profile.
 */
export async function getCurrentUser(): Promise<{
  user: AuthUser | null;
  profile: UserProfile | null;
  needsBusinessSetup: boolean;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, profile: null, needsBusinessSetup: false };
    }

    const { data: profile } = await supabase
      .from('users')
      .select(`
        *,
        tenant:tenants(*),
        store:stores(*)
      `)
      .eq('id', user.id)
      .maybeSingle();

    return {
      user: {
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name,
      },
      profile: profile as UserProfile | null,
      needsBusinessSetup: !profile?.tenant_id,
    };
  } catch (err) {
    console.error('[Auth] Get current user error:', err);
    return { user: null, profile: null, needsBusinessSetup: false };
  }
}

/**
 * Get the current session.
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Listen to auth state changes.
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

// ============================================
// HELPERS
// ============================================

function formatPhoneNumber(phone: string, country: 'GH' | 'NG'): string {
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

/**
 * Check if a session exists (for protected routes).
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Refresh the current session.
 */
export async function refreshSession(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
