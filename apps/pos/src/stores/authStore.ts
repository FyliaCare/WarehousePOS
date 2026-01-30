import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant, Store } from '@warehousepos/types';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, signOut as authSignOut, onAuthStateChange } from '@/lib/supabase-auth';

// Type for profile with relations
interface UserProfile extends User {
  tenant: Tenant;
  store: Store;
}

// DEV BYPASS - Master account for development
// Uses fixed UUIDs that match database dev records
const DEV_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEV_STORE_ID = '00000000-0000-0000-0000-000000000002';
const DEV_USER_ID = '00000000-0000-0000-0000-000000000003';

const DEV_MASTER_ACCOUNT = {
  user: {
    id: DEV_USER_ID,
    tenant_id: DEV_TENANT_ID,
    store_id: DEV_STORE_ID,
    phone: '+233000000000',
    full_name: 'Dev Admin',
    email: 'dev@warehousepos.app',
    role: 'owner' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User,
  tenant: {
    id: DEV_TENANT_ID,
    name: 'Dev Business',
    slug: 'dev-business',
    country: 'GH' as const,
    currency: 'GHS' as const,
    subscription_status: 'trial' as const,
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Tenant,
  store: {
    id: DEV_STORE_ID,
    tenant_id: DEV_TENANT_ID,
    name: 'Dev Store',
    city: 'Accra',
    country: 'GH',
    currency: 'GHS',
    is_active: true,
    is_main: true,
    operating_hours: {},
    deleted_at: null,
    settings: {
      location: { lat: 5.6037, lng: -0.1870 }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Store,
};

interface AuthState {
  // State
  user: User | null;
  tenant: Tenant | null;
  store: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setStore: (store: Store | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Auth actions
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // DEV BYPASS
  devLogin: () => void;
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
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTenant: (tenant) => set({ tenant }),
      setStore: (store) => set({ store }),
      setLoading: (isLoading) => set({ isLoading }),
      
      signOut: async () => {
        await authSignOut();
        set({
          user: null,
          tenant: null,
          store: null,
          isAuthenticated: false,
        });
      },
      
      // DEV BYPASS - Quick login for development
      devLogin: () => {
        console.log('🔧 DEV LOGIN ACTIVATED');
        set({
          user: DEV_MASTER_ACCOUNT.user,
          tenant: DEV_MASTER_ACCOUNT.tenant,
          store: DEV_MASTER_ACCOUNT.store,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      },
      
      refreshUser: async () => {
        try {
          const result = await getCurrentUser();
          
          if (result.success && result.user) {
            set({
              user: result.user,
              tenant: result.tenant,
              store: result.store,
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
            // Fetch user profile with relations
            const { data: profileData } = await supabase
              .from('users')
              .select('*, tenant:tenants(*), store:stores(*)')
              .eq('id', session.user.id)
              .single();
            
            if (profileData) {
              const userProfile = profileData as unknown as UserProfile;
              set({
                user: userProfile,
                tenant: userProfile.tenant,
                store: userProfile.store,
                isAuthenticated: true,
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
onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event);
  
  if (event === 'SIGNED_IN' && session?.user) {
    // User signed in - try to refresh profile data
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('*, tenant:tenants(*), store:stores(*)')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) {
        const userProfile = profileData as unknown as UserProfile;
        useAuthStore.setState({
          user: userProfile,
          tenant: userProfile.tenant,
          store: userProfile.store,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // User exists in auth but no profile yet - that's OK for new users
        console.log('User signed in but no profile yet (new user)');
        useAuthStore.setState({
          isLoading: false,
        });
      }
    } catch (error) {
      console.log('Error fetching profile on sign in:', error);
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
    // Session refreshed - update if needed
    console.log('Token refreshed');
  }
});
