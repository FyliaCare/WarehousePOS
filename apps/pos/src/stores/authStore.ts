/**
 * Auth Store
 * Central state management for authentication
 * Works with the new auth-service
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, signOut as authSignOut, onAuthStateChange } from '@/lib/auth-service';

// Types
interface UserProfile {
  id: string;
  auth_id?: string;
  full_name: string;
  first_name?: string; // Computed from full_name for backwards compatibility
  last_name?: string;  // Computed from full_name for backwards compatibility
  email?: string;
  phone?: string;
  role: 'owner' | 'manager' | 'cashier';
  tenant_id?: string;
  store_id?: string;
  is_active?: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  country: 'GH' | 'NG';
  currency: string;
  subscription_status: string;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  business_type?: string;
}

interface Store {
  id: string;
  tenant_id: string;
  name: string;
  is_main: boolean;
  address?: string;
  phone?: string;
  email?: string;
}

interface AuthState {
  // State
  user: UserProfile | null;
  tenant: Tenant | null;
  store: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  needsProfileSetup: boolean;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setStore: (store: Store | null) => void;
  setLoading: (loading: boolean) => void;
  setNeedsProfileSetup: (needs: boolean) => void;
  
  // Auth actions
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Helper function to process profile and add computed fields
function processProfile(profile: any): UserProfile | null {
  if (!profile) return null;
  
  // Split full_name into first_name and last_name
  const fullName = profile.full_name || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return {
    ...profile,
    first_name: firstName,
    last_name: lastName,
  };
}

// Helper function to process tenant and add computed fields
function processTenant(tenant: any): Tenant | null {
  if (!tenant) return null;
  
  return {
    ...tenant,
    subscription_ends_at: tenant.subscription_ends_at || null,
  };
}

// Request deduplication for getSession - prevents multiple simultaneous calls
let sessionPromiseCache: Promise<any> | null = null;
let sessionCacheExpiry = 0;
const SESSION_CACHE_TTL = 1000; // 1 second cache

function getDedupedSession() {
  const now = Date.now();
  
  // Return cached promise if still valid
  if (sessionPromiseCache && now < sessionCacheExpiry) {
    console.log('[AuthStore] Using cached session promise');
    return sessionPromiseCache;
  }
  
  // Create new request
  console.log('[AuthStore] Creating new session request');
  sessionPromiseCache = supabase.auth.getSession();
  sessionCacheExpiry = now + SESSION_CACHE_TTL;
  
  // Clear cache after completion
  sessionPromiseCache.finally(() => {
    setTimeout(() => {
      if (sessionPromiseCache && Date.now() >= sessionCacheExpiry) {
        sessionPromiseCache = null;
      }
    }, SESSION_CACHE_TTL);
  });
  
  return sessionPromiseCache;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      store: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
      needsProfileSetup: false,
      
      setUser: (user) => set({ user: user ? processProfile(user) : null, isAuthenticated: !!user }),
      setTenant: (tenant) => set({ tenant: tenant ? processTenant(tenant) : null }),
      setStore: (store) => set({ store }),
      setLoading: (isLoading) => set({ isLoading }),
      setNeedsProfileSetup: (needs) => set({ needsProfileSetup: needs }),
      
      signOut: async () => {
        try {
          await authSignOut();
        } catch (err) {
          console.error('Sign out error:', err);
        }
        set({
          user: null,
          tenant: null,
          store: null,
          isAuthenticated: false,
          needsProfileSetup: false,
        });
      },
      
      refreshUser: async () => {
        try {
          const { profile } = await getCurrentUser();
          
          if (profile) {
            const processedProfile = processProfile(profile);
            const processedTenant = processTenant((profile as any).tenant);
            const needsProfileSetup = !processedProfile?.tenant_id;
            
            set({
              user: processedProfile,
              tenant: processedTenant,
              store: (profile as any).store as Store,
              isAuthenticated: true,
              needsProfileSetup,
            });
          } else {
            set({ needsProfileSetup: false });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
      
      initialize: async () => {
        // Prevent multiple initializations
        if (get().isInitialized) {
          return;
        }
        
        set({ isLoading: true });
        
        try {
          // Add timeout to prevent infinite loading
          const SESSION_TIMEOUT = 10000; // 10 seconds
          const sessionPromise = getDedupedSession(); // Use deduped version
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), SESSION_TIMEOUT)
          );
          
          let session;
          try {
            const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
            session = data?.session;
          } catch (error: any) {
            if (error.message === 'Session timeout') {
              console.error('[AuthStore] Session fetch timed out, using cached state');
              // Try to use cached auth from persisted state
              const cachedState = get();
              if (cachedState.user && cachedState.isAuthenticated) {
                set({ isLoading: false, isInitialized: true });
                return;
              }
            }
            throw error;
          }
          
          if (session?.user) {
            // Add timeout for profile fetch too
            const PROFILE_TIMEOUT = 8000; // 8 seconds
            const profilePromise = supabase
              .from('users')
              .select('*, tenant:tenants(*), store:stores(*)')
              .eq('id', session.user.id)
              .maybeSingle();
            
            const profileTimeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Profile timeout')), PROFILE_TIMEOUT)
            );
            
            let profileData;
            let error;
            try {
              const result = await Promise.race([profilePromise, profileTimeoutPromise]) as any;
              profileData = result.data;
              error = result.error;
            } catch (profileError: any) {
              if (profileError.message === 'Profile timeout') {
                console.error('[AuthStore] Profile fetch timed out');
                // Set authenticated but flag as needing setup
                set({
                  isAuthenticated: true,
                  needsProfileSetup: true,
                  isLoading: false,
                  isInitialized: true,
                });
                return;
              }
              throw profileError;
            }
            
            if (error) {
              console.error('Profile fetch error:', error);
            }
            
            if (profileData) {
              const processedProfile = processProfile(profileData);
              const processedTenant = processTenant((profileData as any).tenant);
              const needsProfileSetup = !processedProfile?.tenant_id;
              
              set({
                user: processedProfile,
                tenant: processedTenant,
                store: (profileData as any).store as Store,
                isAuthenticated: true,
                needsProfileSetup,
              });
            } else {
              // User exists in auth but no profile - needs business setup
              console.log('User has no profile yet (new user)');
              set({
                isAuthenticated: true, // They are authenticated
                needsProfileSetup: true,
              });
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // On error, mark as initialized anyway to prevent infinite loading
          set({ isAuthenticated: false, needsProfileSetup: false });
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },
    }),
    {
      name: 'warehousepos-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        store: state.store,
        isAuthenticated: state.isAuthenticated,
        needsProfileSetup: state.needsProfileSetup,
      }),
    }
  )
);

// Listen to auth state changes
const { data: { subscription } } = onAuthStateChange(async (event, session) => {
  console.log('[AuthStore] Auth state changed:', event);
  
  if (event === 'SIGNED_IN' && session?.user) {
    // User signed in - try to refresh profile data
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('*, tenant:tenants(*), store:stores(*)')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileData) {
        useAuthStore.setState({
          user: profileData as UserProfile,
          tenant: (profileData as any).tenant as Tenant,
          store: (profileData as any).store as Store,
          isAuthenticated: true,
          isLoading: false,
          needsProfileSetup: !(profileData as any).tenant_id,
        });
      } else {
        // User exists in auth but no profile yet - that's OK for new users
        console.log('[AuthStore] User signed in but no profile yet (new user)');
        useAuthStore.setState({
          isAuthenticated: true,
          isLoading: false,
          needsProfileSetup: true,
        });
      }
    } catch (error) {
      console.error('[AuthStore] Error fetching profile on sign in:', error);
      useAuthStore.setState({
        isLoading: false,
        needsProfileSetup: false,
      });
    }
  } else if (event === 'SIGNED_OUT') {
    // User signed out
    useAuthStore.setState({
      user: null,
      tenant: null,
      store: null,
      isAuthenticated: false,
      isLoading: false,
      needsProfileSetup: false,
    });
  } else if (event === 'TOKEN_REFRESHED') {
    // Session refreshed
    console.log('[AuthStore] Token refreshed');
  } else if (event === 'PASSWORD_RECOVERY') {
    // User clicked password recovery link
    console.log('[AuthStore] Password recovery event');
  }
});

// Export cleanup function
export const cleanupAuthListener = () => {
  subscription?.unsubscribe();
};
