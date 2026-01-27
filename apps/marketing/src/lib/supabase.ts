import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use the same storage key as the main POS app for session sharing
    storageKey: "warehouse-auth-token",
  },
});

// App URLs for navigation between POS and Portal
export const APP_URLS = {
  pos:
    import.meta.env.VITE_POS_APP_URL || "https://warehouse-qofj.onrender.com",
  portal:
    import.meta.env.VITE_PORTAL_URL ||
    "https://warehouse-web-agme.onrender.com/portal",
  marketing:
    import.meta.env.VITE_MARKETING_URL ||
    "https://warehouse-web-agme.onrender.com",
};
