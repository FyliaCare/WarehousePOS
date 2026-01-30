// Edge Function: Verify Rider OTP
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, hashOTP, isDevelopment } from '../_shared/utils.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('verify-rider-otp - isDev:', isDev);

  try {
    const { phone, otp, country = 'GH' } = await req.json();
    
    if (!phone || !otp) {
      return errorResponse('phone and otp are required', 400);
    }

    if (!/^\d{6}$/.test(otp)) {
      return errorResponse('Invalid OTP format', 400);
    }

    const formattedPhone = formatPhone(phone, country);
    const supabase = createSupabaseClient();

    // DEV MODE: Accept any OTP
    if (!isDev) {
      const otpHash = await hashOTP(otp);
      const { data: otpRecord, error: otpError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('otp_hash', otpHash)
        .eq('purpose', 'rider_login')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (otpError || !otpRecord) {
        return errorResponse('Invalid or expired OTP', 400);
      }

      // Delete used OTP
      await supabase.from('otp_codes').delete().eq('id', otpRecord.id);
    } else {
      console.log('[DEV] Skipping OTP verification');
    }

    // Get rider details
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .select('*, store:stores(id, name)')
      .eq('phone', formattedPhone)
      .eq('is_active', true)
      .single();

    if (riderError || !rider) {
      return errorResponse('Rider not found', 404);
    }

    // Update last login
    await supabase.from('riders')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', rider.id);

    // Get today's assigned deliveries
    const today = new Date().toISOString().split('T')[0];
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('*, order:orders(*)')
      .eq('rider_id', rider.id)
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    return successResponse({
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicleType: rider.vehicle_type,
        store: rider.store,
      },
      todayDeliveries: deliveries || [],
    });

  } catch (error) {
    console.error('Verify rider OTP error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
