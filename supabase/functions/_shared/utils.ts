// @ts-nocheck
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import bcrypt from 'npm:bcryptjs@2.4.3';

// Environment helpers
export function getEnv(key: string, required = true): string {
  const value = Deno.env.get(key) || '';
  if (required && !value) {
    console.error(`Missing env var: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function isDevelopment(): boolean {
  const env = getEnv('ENVIRONMENT', false);
  console.log('ENVIRONMENT value:', env);
  return env !== 'production';
}

// Supabase client factory
export function createSupabaseClient(): SupabaseClient {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  console.log('Creating Supabase client with URL:', url);
  console.log('Service role key exists:', !!key, 'length:', key?.length);
  
  return createClient(url, key, { 
    auth: { autoRefreshToken: false, persistSession: false } 
  });
}

// Phone formatting
export function formatPhone(phone: string, country: string): string {
  const digits = phone.replace(/\D/g, '');
  if (country === 'GH') {
    if (digits.startsWith('233')) return '+' + digits;
    if (digits.startsWith('0')) return '+233' + digits.slice(1);
    return '+233' + digits;
  } else {
    if (digits.startsWith('234')) return '+' + digits;
    if (digits.startsWith('0')) return '+234' + digits.slice(1);
    return '+234' + digits;
  }
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP for secure storage
export async function hashOTP(otp: string): Promise<string> {
  const secret = getEnv('OTP_SECRET', false) || 'default-secret';
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Secure PIN hashing helpers (bcrypt)
export function hashPIN(pin: string): string {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(pin, salt);
}

export function verifyPIN(pin: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(pin, hash);
  } catch (err) {
    console.error('PIN verify error:', err);
    return false;
  }
}
