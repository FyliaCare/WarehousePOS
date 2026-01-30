// Edge Function: Send OTP via SMS (mNotify/Termii)
// v6 - OPTIMIZED: Parallel operations, faster rate limiting
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, generateOTP, hashOTP, isDevelopment } from '../_shared/utils.ts';
import { sendSMS } from '../_shared/sms.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  const startTime = Date.now();
  console.log('phone-otp-send v6 (optimized) - isDev:', isDev);

  try {
    const { phone, country, purpose = 'login' } = await req.json();
    
    if (!phone || !country) {
      return errorResponse('Phone and country are required', 400);
    }

    const formattedPhone = formatPhone(phone, country);
    const otp = generateOTP();
    console.log('OTP request for:', formattedPhone);

    // DEV MODE: Skip database and SMS, return immediately
    if (isDev) {
      console.log(`[DEV] OTP for ${formattedPhone}: ${otp}`);
      return successResponse({ 
        message: `Verification code sent to ${formattedPhone}`,
        devOTP: otp,
      });
    }

    // PRODUCTION: Optimized flow - do operations in parallel where possible
    const supabase = createSupabaseClient();

    // Generate OTP hash while checking rate limit in parallel
    const otpHashPromise = hashOTP(otp);
    const rateLimitPromise = supabase
      .from('phone_otps')
      .select('created_at')
      .eq('phone', formattedPhone)
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .limit(1)
      .maybeSingle();

    const [otpHash, { data: recentOtp }] = await Promise.all([otpHashPromise, rateLimitPromise]);

    if (recentOtp) {
      const waitTime = Math.ceil((60000 - (Date.now() - new Date(recentOtp.created_at).getTime())) / 1000);
      return errorResponse(`Please wait ${waitTime} seconds before requesting a new code`, 429);
    }

    console.log('Rate limit passed, took:', Date.now() - startTime, 'ms');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // UPSERT instead of delete + insert (single operation instead of two)
    const { error: upsertError } = await supabase
      .from('phone_otps')
      .upsert({
        phone: formattedPhone,
        otp_hash: otpHash,
        purpose,
        expires_at: expiresAt,
        verified_at: null, // Reset verification status
        created_at: new Date().toISOString(),
      }, { 
        onConflict: 'phone,purpose',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      // Fallback to delete + insert if upsert fails (constraint might not exist)
      console.log('Upsert failed, falling back to delete+insert:', upsertError.message);
      await supabase.from('phone_otps').delete().eq('phone', formattedPhone);
      const { error: insertError } = await supabase.from('phone_otps').insert({
        phone: formattedPhone,
        otp_hash: otpHash,
        purpose,
        expires_at: expiresAt,
      });
      if (insertError) {
        console.error('OTP insert error:', insertError);
        return errorResponse('Failed to generate OTP', 500);
      }
    }

    console.log('OTP stored, took:', Date.now() - startTime, 'ms');

    // Send SMS - this is the slowest part (external API call)
    const message = `Your WarehousePOS code: ${otp}. Valid 5 mins.`;  // Shorter message = faster delivery
    const smsSent = await sendSMS(formattedPhone, message, country);

    console.log('SMS sent, total time:', Date.now() - startTime, 'ms');

    if (!smsSent) {
      return errorResponse('Failed to send SMS. Please try again.', 500);
    }

    return successResponse({ message: `Verification code sent to ${formattedPhone}` });

  } catch (error) {
    console.error('Send OTP error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
