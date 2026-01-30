// Debug Edge Function - Check OTP records
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, hashOTP, isDevelopment, getEnv } from '../_shared/utils.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { phone, country, otp } = await req.json();
    const formattedPhone = formatPhone(phone || '0551234567', country || 'GH');
    const supabase = createSupabaseClient();
    
    // Check environment
    const isDev = isDevelopment();
    const environment = getEnv('ENVIRONMENT', false);
    
    // Check if phone_users table exists and has data
    const { data: phoneUsers, error: phoneUsersError } = await supabase
      .from('phone_users')
      .select('*')
      .limit(5);
    
    // Check phone_otps table
    const { data: otps, error: otpsError } = await supabase
      .from('phone_otps')
      .select('id, phone, purpose, expires_at, verified_at, created_at')
      .limit(10);
    
    // If OTP provided, check hash
    let hashCheck = null;
    if (otp) {
      const otpHash = await hashOTP(otp);
      const { data: matchingOtp, error: matchError } = await supabase
        .from('phone_otps')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('otp_hash', otpHash)
        .maybeSingle();
      
      hashCheck = {
        otpHash: otpHash.substring(0, 10) + '...',
        found: !!matchingOtp,
        matchError: matchError?.message,
        record: matchingOtp ? {
          id: matchingOtp.id,
          phone: matchingOtp.phone,
          purpose: matchingOtp.purpose,
          expires_at: matchingOtp.expires_at,
          verified_at: matchingOtp.verified_at,
        } : null,
      };
    }
    
    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 10,
    });
    
    return successResponse({
      environment: environment || 'not set',
      isDev,
      formattedPhone,
      phoneUsersTable: {
        error: phoneUsersError?.message,
        count: phoneUsers?.length || 0,
        sample: phoneUsers?.slice(0, 3),
      },
      phoneOtpsTable: {
        error: otpsError?.message,
        count: otps?.length || 0,
        records: otps,
      },
      hashCheck,
      authUsers: {
        error: authError?.message,
        count: authUsers?.users?.length || 0,
        users: authUsers?.users?.map(u => ({
          id: u.id,
          phone: u.phone,
          email: u.email,
          created_at: u.created_at,
        })),
      },
    }, req);

  } catch (error) {
    console.error('Debug error:', error);
    return errorResponse('Debug error: ' + String(error), 500, undefined, req);
  }
});
