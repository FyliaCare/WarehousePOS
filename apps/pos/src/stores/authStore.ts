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
