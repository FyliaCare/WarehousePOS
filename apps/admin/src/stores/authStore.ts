import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@warehousepos/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          // Check if user is a super admin
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .eq('role', 'super_admin')
            .single();
          
          if (userError || !userData) {
            await supabase.auth.signOut();
            throw new Error('Access denied. Super admin privileges required.');
          }
          
          set({
            user: userData as User,
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
        });
      },
      
      initialize: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .eq('role', 'super_admin')
              .single();
            
            if (userData) {
              set({
                user: userData as User,
                isAuthenticated: true,
              });
            }
          }
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize on app load
useAuthStore.getState().initialize();
