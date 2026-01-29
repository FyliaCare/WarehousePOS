import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface CustomerState {
  customer: CustomerInfo | null;
  setCustomer: (customer: CustomerInfo) => void;
  clearCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customer: null,
      setCustomer: (customer) => set({ customer }),
      clearCustomer: () => set({ customer: null }),
    }),
    {
      name: 'portal-customer',
    }
  )
);
