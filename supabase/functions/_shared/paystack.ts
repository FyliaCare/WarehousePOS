import { getEnv } from './utils.ts';

const PAYSTACK_SECRET_GH = () => getEnv('PAYSTACK_SECRET_KEY_GH', false);
const PAYSTACK_SECRET_NG = () => getEnv('PAYSTACK_SECRET_KEY_NG', false);

function getPaystackKey(country: string): string {
  const key = country === 'GH' ? PAYSTACK_SECRET_GH() : PAYSTACK_SECRET_NG();
  if (!key) throw new Error(`Paystack key not configured for ${country}`);
  return key;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata?: Record<string, any>;
  };
}

// Initialize Paystack transaction
export async function initializePayment(
  amount: number, // in kobo/pesewas
  email: string,
  reference: string,
  country: string,
  metadata?: Record<string, any>,
  callbackUrl?: string
): Promise<PaystackInitResponse> {
  const key = getPaystackKey(country);
  
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      email,
      reference,
      currency: country === 'GH' ? 'GHS' : 'NGN',
      metadata,
      callback_url: callbackUrl,
    }),
  });
  
  return await response.json();
}

// Verify Paystack transaction
export async function verifyPayment(reference: string, country: string): Promise<PaystackVerifyResponse> {
  const key = getPaystackKey(country);
  
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${key}` },
  });
  
  return await response.json();
}

// Verify Paystack webhook signature
export async function verifyWebhookSignature(payload: string, signature: string, country: string): Promise<boolean> {
  const key = getPaystackKey(country);
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const payloadData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return expectedSignature === signature;
}
