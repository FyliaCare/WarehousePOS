import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rider, Store } from '@warehousepos/types';
import { supabase } from '@/lib/supabase';

// Type for the rider query result
interface RiderQueryResult {
  id: string;
  name: string;
  phone: string;
  email?: string;
  is_active: boolean;
  store?: Store;
  [key: string]: unknown;
}

interface AuthState {
  rider: Rider | null;
  store: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  
  setRider: (rider: Rider | null) => void;
  setStore: (store: Store | null) => void;
  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  login: (phone: string, otp: string) => Promise<void>;
  requestOTP: (phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  toggleOnlineStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      rider: null,
      store: null,
      isAuthenticated: false,
      isLoading: true,
      isOnline: false,
      
      setRider: (rider) => set({ rider, isAuthenticated: !!rider }),
      setStore: (store) => set({ store }),
      setOnline: (isOnline) => set({ isOnline }),
      setLoading: (isLoading) => set({ isLoading }),
      
      requestOTP: async (phone: string) => {
        // Call Edge Function to send OTP
        const { error } = await supabase.functions.invoke('send-rider-otp', {
          body: { phone },
        });
        
        if (error) throw error;
      },
      
      login: async (phone: string, otp: string) => {
        set({ isLoading: true });
        try {
          // Verify OTP via Edge Function
          const { error } = await supabase.functions.invoke('verify-rider-otp', {
            body: { phone, otp },
          });
          
          if (error) throw error;
          
          // Fetch rider profile
          const { data: rider, error: riderError } = await supabase
            .from('riders')
            .select('*, store:stores(*)')
            .eq('phone', phone)
            .single();
          
          if (riderError) throw riderError;
          
          const riderData = rider as unknown as RiderQueryResult;
          
          set({
            rider: riderData as unknown as Rider,
            store: riderData.store as Store,
            isAuthenticated: true,
            isOnline: riderData.is_active,
          });
        } finally {
          set({ isLoading: false });
        }
      },
      
      signOut: async () => {
        await supabase.auth.signOut();
        set({
          rider: null,
          store: null,
          isAuthenticated: false,
          isOnline: false,
        });
      },
      
      initialize: async () => {
        set({ isLoading: true });
        try {
          const state = get();
          if (state.rider) {
            // Refresh rider data
            const { data: rider } = await supabase
              .from('riders')
              .select('*, store:stores(*)')
              .eq('id', state.rider.id)
              .single();
            
            if (rider) {
              const riderData = rider as unknown as RiderQueryResult;
              set({
                rider: riderData as unknown as Rider,
                store: riderData.store as Store,
                isOnline: riderData.is_active,
              });
            }
          }
        } finally {
          set({ isLoading: false });
        }
      },
      
      toggleOnlineStatus: async () => {
        const { rider, isOnline } = get();
        if (!rider) return;
        
        const newStatus = !isOnline;
        
        const { error } = await supabase
          .from('riders')
          .update({ is_active: newStatus } as never)
          .eq('id', rider.id);
        
        if (!error) {
          set({ isOnline: newStatus });
        }
      },
    }),
    {
      name: 'delivery-auth',
      partialize: (state) => ({
        rider: state.rider,
        store: state.store,
        isAuthenticated: state.isAuthenticated,
        isOnline: state.isOnline,
      }),
    }
  )
);
