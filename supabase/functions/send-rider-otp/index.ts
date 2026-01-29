// Edge Function: Send Rider OTP
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, generateOTP, hashOTP, isDevelopment } from '../_shared/utils.ts';
import { sendSMS } from '../_shared/sms.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('send-rider-otp - isDev:', isDev);

  try {
    const { phone, country = 'GH' } = await req.json();
    
    if (!phone) {
      return errorResponse('phone is required', 400);
    }

    const formattedPhone = formatPhone(phone, country);
    const supabase = createSupabaseClient();

    // Verify rider exists
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .select('id, name')
      .eq('phone', formattedPhone)
      .eq('is_active', true)
      .maybeSingle();

    if (riderError || !rider) {
      return errorResponse('Rider not found or inactive', 404);
    }

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store OTP
    await supabase.from('phone_otps').delete().eq('phone', formattedPhone);
    await supabase.from('phone_otps').insert({
      phone: formattedPhone,
      otp_hash: otpHash,
      purpose: 'rider_login',
      expires_at: expiresAt,
    });

    // DEV MODE: Return OTP without sending SMS
    if (isDev) {
      console.log(`[DEV] Rider OTP for ${formattedPhone}: ${otp}`);
      return successResponse({
        message: `OTP sent to ${formattedPhone}`,
        devOTP: otp,
        riderName: rider.name,
      });
    }

    // Send SMS
    const message = `Your WarehousePOS rider login code is: ${otp}. Valid for 10 minutes.`;
    const sent = await sendSMS(formattedPhone, message, country);

    if (!sent) {
      return errorResponse('Failed to send SMS', 500);
    }

    return successResponse({
      message: `OTP sent to ${formattedPhone}`,
      riderName: rider.name,
    });

  } catch (error) {
    console.error('Send rider OTP error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
