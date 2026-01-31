// Change Password Edge Function
// Handles secure password changes with validation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, errorResponse, successResponse } from '../_shared/cors.ts';
import { getEnv, createSupabaseClient } from '../_shared/utils.ts';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Password validation rules
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, undefined, req);
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401, undefined, req);
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Parse request body
    let body: ChangePasswordRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid request body', 400, undefined, req);
    }

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400, undefined, req);
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return errorResponse('Password does not meet requirements', 400, { 
        code: 'INVALID_PASSWORD',
        details: validation.errors 
      }, req);
    }

    // Create a client with the user's token
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return errorResponse('Unauthorized - invalid token', 401, undefined, req);
    }

    // Check if user has email (password auth) vs phone-only auth
    if (!user.email) {
      return errorResponse(
        'Password change is only available for email-based accounts',
        400,
        { code: 'NO_EMAIL_AUTH' },
        req
      );
    }

    console.log(`Processing password change for user: ${user.id}`);

    // Verify current password by attempting to sign in
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      console.log('Current password verification failed:', signInError.message);
      return errorResponse('Current password is incorrect', 400, { 
        code: 'INVALID_CURRENT_PASSWORD' 
      }, req);
    }

    // Update the password using admin client
    const adminClient = createSupabaseClient();
    
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return errorResponse('Failed to update password', 500, { 
        code: 'UPDATE_FAILED' 
      }, req);
    }

    // Log the password change in audit log
    try {
      const { data: userData } = await adminClient
        .from('users')
        .select('business_id')
        .eq('id', user.id)
        .single();

      if (userData?.business_id) {
        await adminClient.from('audit_logs').insert({
          business_id: userData.business_id,
          user_id: user.id,
          action: 'password_changed',
          entity_type: 'user',
          entity_id: user.id,
          details: { 
            changed_at: new Date().toISOString(),
            ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
          }
        });
      }
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Don't fail the request if audit logging fails
    }

    console.log(`Successfully changed password for user: ${user.id}`);

    return successResponse({
      message: 'Password changed successfully',
      changedAt: new Date().toISOString(),
    }, req);

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(
      'An unexpected error occurred',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' },
      req
    );
  }
});
