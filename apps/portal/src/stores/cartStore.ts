import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@warehousepos/types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  storeId: string | null;
  
  addItem: (product: Product, storeId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      
      addItem: (product, storeId) => {
        const { items, storeId: currentStoreId } = get();
        
        // Clear cart if different store
        if (currentStoreId && currentStoreId !== storeId) {
          set({ items: [{ product, quantity: 1 }], storeId });
          return;
        }
        
        const existingItem = items.find((item) => item.product.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
            storeId,
          });
        } else {
          set({
            items: [...items, { product, quantity: 1 }],
            storeId,
          });
        }
      },
      
      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      
      clearCart: () => set({ items: [], storeId: null }),
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.product.selling_price || 0) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'portal-cart',
    }
  )
);
