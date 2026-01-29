import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Store, Tenant } from '@warehousepos/types';
import { supabase } from '@/lib/supabase';

interface StoreWithTenant extends Store {
  tenant: Tenant;
}

interface StoreContextType {
  store: StoreWithTenant | null;
  isLoading: boolean;
  error: string | null;
  currency: 'GHS' | 'NGN';
  currencySymbol: string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);

  // Extract slug from subdomain or query param
  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Check query param first (for development)
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store');
    
    if (storeParam) {
      setSlug(storeParam);
      return;
    }
    
    // For local development with subdomain simulation
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Default to first available store in dev
      setSlug('__dev__');
      return;
    }
    
    // For production: store-slug.warehousepos.com
    if (parts.length >= 2 && !['www', 'app', 'admin', 'delivery', 'pos'].includes(parts[0])) {
      setSlug(parts[0]);
    }
  }, []);

  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      if (!slug) return null;

      let query = supabase
        .from('stores')
        .select(`
          *,
          tenant:tenants(*)
        `);
      
      // In development mode without specific store, get first store with portal enabled
      if (slug === '__dev__') {
        query = query.eq('portal_enabled', true).limit(1);
      } else {
        query = query.eq('slug', slug).eq('portal_enabled', true);
      }

      const { data, error } = await query.single();

      if (error) {
        // If no portal-enabled store found, try to get any active store for dev
        if (slug === '__dev__') {
          const { data: anyStore, error: anyError } = await supabase
            .from('stores')
            .select('*, tenant:tenants(*)')
            .eq('is_active', true)
            .limit(1)
            .single();
          
          if (anyError) throw anyError;
          return anyStore as StoreWithTenant;
        }
        throw error;
      }
      
      return data as StoreWithTenant;
    },
    enabled: !!slug,
    retry: false,
  });

  const currency = store?.tenant?.currency === 'NGN' ? 'NGN' : 'GHS';
  const currencySymbol = currency === 'NGN' ? '₦' : '₵';

  return (
    <StoreContext.Provider
      value={{
        store: store || null,
        isLoading: isLoading && !!slug,
        error: error?.message || null,
        currency,
        currencySymbol,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
}
