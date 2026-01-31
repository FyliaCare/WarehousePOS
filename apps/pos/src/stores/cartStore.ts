import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductVariant, Customer } from '@warehousepos/types';

// Cart item type
export interface CartItem {
  id: string; // product_id or variant_id
  product: Product;
  variant?: ProductVariant;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface CartState {
  // State
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: 'fixed' | 'percentage';
  taxRate: number;
  notes: string;
  
  // Computed
  subtotal: number;
  totalDiscount: number;
  tax: number;
  total: number;
  itemCount: number;
  
  // Actions
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setItemDiscount: (itemId: string, discount: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (discount: number, type?: 'fixed' | 'percentage') => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  
  // Helpers
  recalculate: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      discount: 0,
      discountType: 'fixed',
      taxRate: 0,
      notes: '',
      subtotal: 0,
      totalDiscount: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
      
      addItem: (product, variant, quantity = 1) => {
        const state = get();
        const itemId = variant?.id || product.id;
        const existingItem = state.items.find((item) => item.id === itemId);
        
        if (existingItem) {
          // Update quantity if item exists
          set((state) => ({
            items: state.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    total: (item.quantity + quantity) * item.unitPrice - item.discount,
                  }
                : item
            ),
          }));
        } else {
          // Add new item - use selling_price (which may be mapped from price) or price directly
          const unitPrice = variant?.selling_price || variant?.price || product.selling_price || (product as any).price || 0;
          const newItem: CartItem = {
            id: itemId,
            product,
            variant,
            name: variant ? `${product.name} - ${variant.name}` : product.name,
            quantity,
            unitPrice,
            discount: 0,
            total: quantity * unitPrice,
          };
          set((state) => ({ items: [...state.items, newItem] }));
        }
        
        get().recalculate();
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  total: quantity * item.unitPrice - item.discount,
                }
              : item
          ),
        }));
        get().recalculate();
      },
      
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
        get().recalculate();
      },
      
      setItemDiscount: (itemId, discount) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  discount,
                  total: item.quantity * item.unitPrice - discount,
                }
              : item
          ),
        }));
        get().recalculate();
      },
      
      setCustomer: (customer) => set({ customer }),
      
      setDiscount: (discount, type = 'fixed') =>
        set({ discount, discountType: type }, false),
      
      setNotes: (notes) => set({ notes }),
      
      clearCart: () =>
        set({
          items: [],
          customer: null,
          discount: 0,
          discountType: 'fixed',
          notes: '',
          subtotal: 0,
          totalDiscount: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
        }),
      
      recalculate: () => {
        const state = get();
        
        // Calculate subtotal (sum of all item totals)
        const subtotal = state.items.reduce((sum, item) => sum + item.total, 0);
        
        // Calculate item-level discounts
        const itemDiscounts = state.items.reduce((sum, item) => sum + item.discount, 0);
        
        // Calculate cart-level discount
        let cartDiscount = 0;
        if (state.discountType === 'percentage') {
          cartDiscount = (subtotal * state.discount) / 100;
        } else {
          cartDiscount = state.discount;
        }
        
        const totalDiscount = itemDiscounts + cartDiscount;
        
        // Calculate tax
        const taxableAmount = subtotal - totalDiscount;
        const tax = (taxableAmount * state.taxRate) / 100;
        
        // Calculate total
        const total = taxableAmount + tax;
        
        // Item count
        const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
        
        set({
          subtotal,
          totalDiscount,
          tax,
          total: Math.max(0, total),
          itemCount,
        });
      },
    }),
    {
      name: 'warehousepos-cart',
      partialize: (state) => ({
        items: state.items,
        customer: state.customer,
        discount: state.discount,
        discountType: state.discountType,
        notes: state.notes,
      }),
    }
  )
);
