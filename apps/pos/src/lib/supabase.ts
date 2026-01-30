import { createClient } from '@supabase/supabase-js';
import { env, isValidEnv, envErrors } from './env';

// Validate environment before creating client
if (!isValidEnv) {
  throw new Error(`Supabase configuration error: ${envErrors.join(', ')}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper to get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Helper to get current user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Sign out helper
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
