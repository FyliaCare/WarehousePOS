// Edge Function: Send OTP via SMS (mNotify/Termii)
// v5 - Clean rewrite with shared utilities
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, generateOTP, hashOTP, isDevelopment } from '../_shared/utils.ts';
import { sendSMS } from '../_shared/sms.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('phone-otp-send v5 - isDev:', isDev);

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

    // PRODUCTION: Full flow with database and SMS
    const supabase = createSupabaseClient();

    // Rate limiting (1 OTP per 60 seconds)
    const { data: recentOtp } = await supabase
      .from('phone_otps')
      .select('created_at')
      .eq('phone', formattedPhone)
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const waitTime = Math.ceil((60000 - (Date.now() - new Date(recentOtp.created_at).getTime())) / 1000);
      return errorResponse(`Please wait ${waitTime} seconds before requesting a new code`, 429);
    }

    // Store OTP hash
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

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

    // Send SMS
    const message = `Your WarehousePOS verification code is: ${otp}. Valid for 5 minutes.`;
    const smsSent = await sendSMS(formattedPhone, message, country);

    if (!smsSent) {
      return errorResponse('Failed to send SMS. Please try again.', 500);
    }

    return successResponse({ message: `Verification code sent to ${formattedPhone}` });

  } catch (error) {
    console.error('Send OTP error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
