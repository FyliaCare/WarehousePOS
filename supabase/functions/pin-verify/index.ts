// @ts-nocheck
// Edge Function: Verify PIN and create session
// Uses server-side bcrypt verification with lockout enforcement
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, verifyPIN } from '../_shared/utils.ts';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface VerifyPinRequest {
  phone?: string;
  country?: string;
  pin?: string;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, undefined, req);
  }

  let body: VerifyPinRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid request body', 400, undefined, req);
  }

  const { phone, country, pin } = body;
  if (!phone || !country || !pin) {
    return errorResponse('Phone, country, and PIN are required', 400, undefined, req);
  }
  if (!/^(\d{4,6})$/.test(pin)) {
    return errorResponse('PIN must be 4-6 digits', 400, { code: 'INVALID_PIN' }, req);
  }

  const formattedPhone = formatPhone(phone, country);
  const supabase = createSupabaseClient();

  // Look up user by phone mapping
  const { data: mapping, error: mappingError } = await supabase
    .from('phone_users')
    .select('user_id')
    .eq('phone', formattedPhone)
    .maybeSingle();

  if (mappingError) {
    console.error('Phone mapping error:', mappingError);
    return errorResponse('Database error', 500, undefined, req);
  }
  if (!mapping?.user_id) {
    return errorResponse('Account not found for this phone', 404, { code: 'NOT_FOUND' }, req);
  }

  const userId = mapping.user_id;

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, phone, pin_hash, pin_failed_attempts, pin_locked_until')
    .eq('id', userId)
    .maybeSingle();

  if (userError) {
    console.error('User lookup error:', userError);
    return errorResponse('Database error', 500, undefined, req);
  }
  if (!user?.pin_hash) {
    return errorResponse('PIN not set for this account', 400, { code: 'PIN_NOT_SET' }, req);
  }

  if (user.pin_locked_until) {
    const lockedUntilDate = new Date(user.pin_locked_until);
    if (lockedUntilDate > new Date()) {
      return errorResponse('PIN locked due to failed attempts', 423, {
        code: 'PIN_LOCKED',
        lockedUntil: lockedUntilDate.toISOString(),
      }, req);
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const isValid = verifyPIN(pin, user.pin_hash);

  if (!isValid) {
    const failedAttempts = (user.pin_failed_attempts ?? 0) + 1;
    const updates: Record<string, unknown> = {
      pin_failed_attempts: failedAttempts,
      updated_at: nowIso,
    };

    let lockedUntil: string | null = null;
    if (failedAttempts >= MAX_ATTEMPTS) {
      lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      updates.pin_locked_until = lockedUntil;
    }

    const { error: incrementError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (incrementError) {
      console.error('Failed to update attempts:', incrementError);
    }

    return errorResponse('Incorrect PIN', 401, {
      code: 'INVALID_PIN',
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - failedAttempts),
      lockedUntil,
    }, req);
  }

  // Success: reset counters and create session
  await supabase
    .from('users')
    .update({
      pin_failed_attempts: 0,
      pin_locked_until: null,
      last_login_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', userId);

  // Prepare credentials for session (same pattern as phone-otp-verify)
  const phoneDigits = formattedPhone.replace(/\D/g, '');
  const email = `${phoneDigits}@phone.warehousepos.app`;
  const password = crypto.randomUUID();

  const { error: updateCredsError } = await supabase.auth.admin.updateUserById(userId, {
    email,
    password,
    email_confirm: true,
  });

  if (updateCredsError) {
    console.error('Auth credential update error:', updateCredsError);
    return errorResponse('Failed to create session', 500, { code: 'SESSION_CREATE_FAILED' }, req);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData?.session) {
    console.error('PIN sign-in error:', signInError);
    return errorResponse('Failed to sign in', 500, { code: 'SESSION_CREATE_FAILED' }, req);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenant:tenants(*), store:stores(*)')
    .eq('id', userId)
    .maybeSingle();

  return successResponse({
    user: signInData.user,
    session: signInData.session,
    profile: profile || null,
    needsProfileSetup: !profile,
  }, req);
});
