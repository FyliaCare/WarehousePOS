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
  auth_id: string;
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
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setStore: (store: Store | null) => void;
  setLoading: (loading: boolean) => void;
  
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      store: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
      
      setUser: (user) => set({ user: user ? processProfile(user) : null, isAuthenticated: !!user }),
      setTenant: (tenant) => set({ tenant: tenant ? processTenant(tenant) : null }),
      setStore: (store) => set({ store }),
      setLoading: (isLoading) => set({ isLoading }),
      
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
        });
      },
      
      refreshUser: async () => {
        try {
          const { profile } = await getCurrentUser();
          
          if (profile) {
            const processedProfile = processProfile(profile);
            const processedTenant = processTenant((profile as any).tenant);
            
            set({
              user: processedProfile,
              tenant: processedTenant,
              store: (profile as any).store as Store,
              isAuthenticated: true,
            });
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
          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Fetch user profile with relations using auth_id
            const { data: profileData, error } = await supabase
              .from('users')
              .select('*, tenant:tenants(*), store:stores(*)')
              .eq('auth_id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Profile fetch error:', error);
            }
            
            if (profileData) {
              const processedProfile = processProfile(profileData);
              const processedTenant = processTenant((profileData as any).tenant);
              
              set({
                user: processedProfile,
                tenant: processedTenant,
                store: (profileData as any).store as Store,
                isAuthenticated: true,
              });
            } else {
              // User exists in auth but no profile - needs business setup
              console.log('User has no profile yet (new user)');
              set({
                isAuthenticated: true, // They are authenticated
              });
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
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
        .eq('auth_id', session.user.id)
        .maybeSingle();
      
      if (profileData) {
        useAuthStore.setState({
          user: profileData as UserProfile,
          tenant: (profileData as any).tenant as Tenant,
          store: (profileData as any).store as Store,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // User exists in auth but no profile yet - that's OK for new users
        console.log('[AuthStore] User signed in but no profile yet (new user)');
        useAuthStore.setState({
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[AuthStore] Error fetching profile on sign in:', error);
      useAuthStore.setState({
        isLoading: false,
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
