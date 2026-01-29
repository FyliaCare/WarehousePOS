import { getEnv, formatPhone } from './utils.ts';

// SMS Provider: mNotify (Ghana)
export async function sendViaMNotify(phone: string, message: string): Promise<boolean> {
  const apiKey = getEnv('MNOTIFY_API_KEY', false);
  const senderId = getEnv('MNOTIFY_SENDER_ID', false) || 'WarehousePOS';
  
  if (!apiKey) {
    console.error('mNotify API key not configured');
    return false;
  }

  try {
    const phoneNumber = phone.replace('+', '');
    console.log('Sending SMS via mNotify to:', phoneNumber);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for mNotify
    
    const response = await fetch('https://api.mnotify.com/api/sms/quick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        key: apiKey,
        recipient: [phoneNumber],
        sender: senderId,
        message: message,
        is_schedule: false,
        schedule_date: '',
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const result = await response.json();
    console.log('mNotify response:', JSON.stringify(result));
    
    return result.status === 'success' || result.code === '2000';
  } catch (error) {
    console.error('mNotify error:', error);
    return false;
  }
}

// SMS Provider: Termii (Nigeria)
export async function sendViaTermii(phone: string, message: string): Promise<boolean> {
  const apiKey = getEnv('TERMII_API_KEY', false);
  const senderId = getEnv('TERMII_SENDER_ID', false) || 'WarehousePOS';
  
  if (!apiKey) {
    console.error('Termii API key not configured');
    return false;
  }

  try {
    console.log('Sending SMS via Termii to:', phone);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for Termii
    
    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        to: phone,
        from: senderId,
        sms: message,
        type: 'plain',
        channel: 'generic',
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const result = await response.json();
    console.log('Termii response:', result);
    return result.code === 'ok';
  } catch (error) {
    console.error('Termii error:', error);
    return false;
  }
}

// Unified SMS sending
export async function sendSMS(phone: string, message: string, country: string): Promise<boolean> {
  const formattedPhone = formatPhone(phone, country);
  
  if (country === 'GH') {
    return await sendViaMNotify(formattedPhone, message);
  } else if (country === 'NG') {
    return await sendViaTermii(formattedPhone, message);
  }
  
  console.error('Unsupported country for SMS:', country);
  return false;
}
