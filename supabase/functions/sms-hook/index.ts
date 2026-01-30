// Edge Function: SMS Hook for Supabase Auth
// This is called by Supabase Auth when sending SMS OTPs
// It replaces the built-in SMS provider with mNotify (Ghana) / Termii (Nigeria)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const MNOTIFY_API_KEY = Deno.env.get('MNOTIFY_API_KEY');
const TERMII_API_KEY = Deno.env.get('TERMII_API_KEY');
const MNOTIFY_SENDER_ID = Deno.env.get('MNOTIFY_SENDER_ID') || 'WarePOS';
const TERMII_SENDER_ID = Deno.env.get('TERMII_SENDER_ID') || 'WarePOS';

interface HookEvent {
  user: {
    id: string;
    phone: string;
    email?: string;
  };
  sms: {
    otp: string;
  };
}

serve(async (req: Request) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  const startTime = Date.now();
  
  try {
    const event: HookEvent = await req.json();
    const phone = event.user?.phone;
    const otp = event.sms?.otp;
    
    console.log('SMS Hook called for phone:', phone);
    
    if (!phone || !otp) {
      console.error('Missing phone or OTP');
      return new Response(JSON.stringify({
        error: { http_code: 400, message: 'Missing phone or OTP' }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Determine country from phone prefix
    const isNigeria = phone.startsWith('+234');
    const isGhana = phone.startsWith('+233');
    const country = isNigeria ? 'NG' : 'GH';
    
    console.log('Detected country:', country);
    
    const message = `Your WarehousePOS code is ${otp}. Valid for 5 minutes. Do not share this code.`;
    
    let success = false;
    let errorMsg = '';
    
    if (isGhana || (!isNigeria)) {
      // Send via mNotify (Ghana)
      success = await sendViaMNotify(phone, message);
      if (!success) errorMsg = 'mNotify SMS failed';
    } else {
      // Send via Termii (Nigeria)
      success = await sendViaTermii(phone, message);
      if (!success) errorMsg = 'Termii SMS failed';
    }
    
    console.log('SMS send result:', success, 'Time:', Date.now() - startTime, 'ms');
    
    if (success) {
      // Return empty object for success (Supabase Auth expects this)
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Return error in the expected format
      return new Response(JSON.stringify({
        error: { http_code: 500, message: errorMsg }
      }), {
        status: 200, // Auth hooks should return 200 even for errors
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('SMS Hook error:', error);
    return new Response(JSON.stringify({
      error: { http_code: 500, message: error instanceof Error ? error.message : 'Unknown error' }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// mNotify API (Ghana)
async function sendViaMNotify(phone: string, message: string): Promise<boolean> {
  if (!MNOTIFY_API_KEY) {
    console.error('MNOTIFY_API_KEY not set');
    return false;
  }
  
  try {
    const response = await fetch('https://apps.mnotify.net/smsapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        key: MNOTIFY_API_KEY,
        to: phone.replace('+', ''),
        msg: message,
        sender_id: MNOTIFY_SENDER_ID,
      }),
    });
    
    const text = await response.text();
    console.log('mNotify response:', text);
    
    // mNotify returns "1000" for success
    return text.trim() === '1000' || text.includes('"code":"1000"');
  } catch (error) {
    console.error('mNotify error:', error);
    return false;
  }
}

// Termii API (Nigeria)
async function sendViaTermii(phone: string, message: string): Promise<boolean> {
  if (!TERMII_API_KEY) {
    console.error('TERMII_API_KEY not set');
    return false;
  }
  
  try {
    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: phone.replace('+', ''),
        from: TERMII_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'generic',
      }),
    });
    
    const data = await response.json();
    console.log('Termii response:', data);
    
    return data.code === 'ok' || response.ok;
  } catch (error) {
    console.error('Termii error:', error);
    return false;
  }
}
