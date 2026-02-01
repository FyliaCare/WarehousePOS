// @ts-nocheck
// Edge Function: Securely set or change PIN
// Validates the authenticated user and stores a bcrypt-hashed PIN with lockout reset
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, errorResponse, successResponse } from '../_shared/cors.ts';
import { createSupabaseClient, getEnv, hashPIN } from '../_shared/utils.ts';

interface SetPinRequest {
  pin?: string;
}

function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!/^(\d{4,6})$/.test(pin)) {
    return { valid: false, error: 'PIN must be 4-6 digits' };
  }
  const sequential = ['0123', '1234', '2345', '3456', '4567', '5678', '6789'];
  if (sequential.some(seq => pin.startsWith(seq))) {
    return { valid: false, error: 'PIN cannot be sequential numbers' };
  }
  if (/^(\d)\1+$/.test(pin)) {
    return { valid: false, error: 'PIN cannot be the same digit repeated' };
  }
  return { valid: true };
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, undefined, req);
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Unauthorized - missing bearer token', 401, undefined, req);
  }
  const accessToken = authHeader.replace('Bearer ', '');

  let body: SetPinRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid request body', 400, undefined, req);
  }

  const pin = (body.pin || '').toString();
  const validation = validatePin(pin);
  if (!validation.valid) {
    return errorResponse(validation.error || 'Invalid PIN', 400, { code: 'INVALID_PIN' }, req);
  }

  const supabaseUrl = getEnv('SUPABASE_URL');
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    console.error('Auth error:', userError);
    return errorResponse('Unauthorized - invalid token', 401, undefined, req);
  }

  const serviceClient = createSupabaseClient();
  const nowIso = new Date().toISOString();
  const hashedPin = hashPIN(pin);

  const { error: updateError } = await serviceClient
    .from('users')
    .update({
      pin_hash: hashedPin,
      pin_failed_attempts: 0,
      pin_locked_until: null,
      pin_updated_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', userData.user.id);

  if (updateError) {
    console.error('PIN update error:', updateError);
    return errorResponse('Failed to save PIN', 500, undefined, req);
  }

  return successResponse({
    message: 'PIN set successfully',
    updatedAt: nowIso,
  }, req);
});
