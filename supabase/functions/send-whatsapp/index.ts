// Edge Function: Send WhatsApp messages via Meta Business API
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, getEnv, isDevelopment } from '../_shared/utils.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('send-whatsapp - isDev:', isDev);

  try {
    const { to, templateName, templateParams, country, metadata } = await req.json();
    
    if (!to || !templateName || !country) {
      return errorResponse('to, templateName, and country are required', 400);
    }

    const formattedPhone = formatPhone(to, country);
    console.log('Sending WhatsApp to:', formattedPhone);

    // DEV MODE: Log and skip actual message
    if (isDev) {
      console.log(`[DEV] WhatsApp to ${formattedPhone}: ${templateName}`, templateParams);
      return successResponse({ 
        message: 'WhatsApp sent (dev mode)',
        to: formattedPhone,
      });
    }

    // Get Meta API credentials
    const accessToken = getEnv('WHATSAPP_ACCESS_TOKEN', false);
    const phoneNumberId = country === 'GH' 
      ? getEnv('WHATSAPP_PHONE_ID_GH', false)
      : getEnv('WHATSAPP_PHONE_ID_NG', false);

    if (!accessToken || !phoneNumberId) {
      console.error('WhatsApp credentials not configured');
      return errorResponse('WhatsApp not configured', 500);
    }

    // Build template components
    const components = templateParams?.length ? [{
      type: 'body',
      parameters: templateParams.map((p: string) => ({ type: 'text', text: p })),
    }] : [];

    // Send via Meta Graph API
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone.replace('+', ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components,
        },
      }),
    });

    const result = await response.json();
    console.log('WhatsApp API response:', result);

    if (result.error) {
      console.error('WhatsApp error:', result.error);
      return errorResponse(result.error.message || 'Failed to send WhatsApp', 500);
    }

    // Log to database
    const supabase = createSupabaseClient();
    await supabase.from('whatsapp_logs').insert({
      phone: formattedPhone,
      template_name: templateName,
      template_params: templateParams,
      country,
      metadata,
      message_id: result.messages?.[0]?.id,
      status: 'sent',
    });

    return successResponse({ 
      message: 'WhatsApp sent successfully',
      to: formattedPhone,
      messageId: result.messages?.[0]?.id,
    });

  } catch (error) {
    console.error('Send WhatsApp error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
