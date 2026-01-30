// Edge Function: Send SMS via mNotify (Ghana) or Termii (Nigeria)
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, isDevelopment } from '../_shared/utils.ts';
import { sendSMS } from '../_shared/sms.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('send-sms - isDev:', isDev);

  try {
    const { to, message, country, metadata } = await req.json();
    
    if (!to || !message || !country) {
      return errorResponse('to, message, and country are required', 400);
    }

    const formattedPhone = formatPhone(to, country);
    console.log('Sending SMS to:', formattedPhone);

    // DEV MODE: Log and skip actual SMS
    if (isDev) {
      console.log(`[DEV] SMS to ${formattedPhone}: ${message}`);
      return successResponse({ 
        message: 'SMS sent (dev mode)',
        to: formattedPhone,
      });
    }

    // Send SMS
    const sent = await sendSMS(formattedPhone, message, country);

    if (!sent) {
      return errorResponse('Failed to send SMS', 500);
    }

    // Log to database
    const supabase = createSupabaseClient();
    await supabase.from('sms_logs').insert({
      phone: formattedPhone,
      message,
      country,
      metadata,
      status: 'sent',
    });

    return successResponse({ 
      message: 'SMS sent successfully',
      to: formattedPhone,
    });

  } catch (error) {
    console.error('Send SMS error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
