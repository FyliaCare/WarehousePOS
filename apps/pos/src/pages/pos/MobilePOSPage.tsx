/**
 * MobilePOSPage - POS Machine Style Interface
 * 
 * A redesigned mobile POS that mimics real POS terminal machines
 * Features:
 * - Dark professional theme like real POS machines (Verifone, Ingenico style)
 * - Compact, efficient layout optimized for mobile
 * - Quick-access numpad with haptic feedback
 * - Receipt-style transaction display
 * - Hardware-inspired buttons
 * - Real-time clock display
 * - Status indicators
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Minus,
  Plus,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
  Package,
  LayoutGrid,
  Trash2,
  CheckCircle,
  X,
  RotateCcw,
  CircleDollarSign,
} from 'lucide-react';
import { formatCurrency, cn } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product, CountryCode, Category } from '@warehousepos/types';

// ============================================
// TYPES
// ============================================

interface CartItem {
  product: Product;
  quantity: number;
  discount?: number;
}

type ViewMode = 'products' | 'cart' | 'checkout' | 'success';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';
type LocalPaymentMethod = 'cash' | 'card' | 'momo';

// ============================================
// POS MACHINE THEME - Clean Light Theme
// Modern, clean design with blue accents
// ============================================

const posTheme = {
  // Main colors - light theme
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceLight: '#f1f5f9',
  surfaceElevated: '#e2e8f0',
  
  // Accent colors - blue
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryGlow: '#2563eb15',
  
  secondary: '#6366f1',
  secondaryGlow: '#6366f115',
  
  // Status colors
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0284c7',
  
  // Text colors
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  
  // Border
  border: '#e2e8f0',
  borderLight: '#cbd5e1',
  
  // Special
  screen: '#f1f5f9',
  screenGlow: '#2563eb08',
};

// ============================================
// HAPTIC FEEDBACK
// ============================================

const haptic = {
  light: () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  },
  medium: () => {
    if ('vibrate' in navigator) navigator.vibrate(25);
  },
  heavy: () => {
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
  },
  success: () => {
    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10, 50, 100]);
  },
  keyPress: () => {
    if ('vibrate' in navigator) navigator.vibrate(5);
  },
};

// ============================================
// POS SCREEN DISPLAY - Receipt Style LCD
// ============================================

function POSDisplay({ 
  total, 
  itemCount, 
  country,
  lastItem 
}: { 
  total: number; 
  itemCount: number; 
  country: CountryCode;
  lastItem?: { name: string; price: number; qty: number } | null;
}) {
  return (
    <div 
      className="mx-3 rounded-lg p-3 relative overflow-hidden"
      style={{ 
        backgroundColor: posTheme.screen,
        boxShadow: `inset 0 0 30px ${posTheme.screenGlow}, 0 0 20px ${posTheme.primaryGlow}`,
        border: `1px solid ${posTheme.border}`,
      }}
    >
      {/* Scan lines effect for retro LCD feel */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,170,0.03) 2px, rgba(0,212,170,0.03) 4px)',
        }}
      />
      
      <div className="relative z-10">
        {/* Last Added Item */}
        {lastItem && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 pb-2"
            style={{ borderBottom: `1px dashed ${posTheme.border}` }}
          >
            <div className="flex justify-between items-center">
              <span 
                className="text-[10px] font-mono truncate flex-1"
                style={{ color: posTheme.primary }}
              >
                + {lastItem.name}
              </span>
              <span 
                className="text-[10px] font-mono ml-2"
                style={{ color: posTheme.textSecondary }}
              >
                x{lastItem.qty}
              </span>
            </div>
            <div 
              className="text-right text-xs font-mono font-bold"
              style={{ color: posTheme.primary }}
            >
              {formatCurrency(lastItem.price * lastItem.qty, country)}
            </div>
          </motion.div>
        )}
        
        {/* Main Total Display */}
        <div className="text-center">
          <p 
            className="text-[10px] font-mono uppercase tracking-widest mb-1"
            style={{ color: posTheme.textMuted }}
          >
            {itemCount > 0 ? `${itemCount} ITEM${itemCount > 1 ? 'S' : ''} IN CART` : 'READY TO SCAN'}
          </p>
          <motion.p 
            key={total}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-2xl font-mono font-bold tracking-tight"
            style={{ 
              color: posTheme.primary,
              textShadow: `0 0 20px ${posTheme.primaryGlow}`,
            }}
          >
            {formatCurrency(total, country)}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// POS PRODUCT BUTTON - Hardware Key Style
// ============================================

interface ProductButtonProps {
  product: Product;
  onAdd: (product: Product) => void;
  country: CountryCode;
  inCart: number;
}

function ProductButton({ product, onAdd, country, inCart }: ProductButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleAdd = () => {
    haptic.keyPress();
    onAdd(product);
  };

  const price = product.selling_price ?? product.price ?? 0;
  const isOutOfStock = (product.stock_quantity ?? 0) === 0;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      onClick={!isOutOfStock ? handleAdd : undefined}
      disabled={isOutOfStock}
      className={cn(
        'relative rounded-xl p-2.5 transition-all text-left',
        isOutOfStock && 'opacity-40'
      )}
      style={{ 
        backgroundColor: isPressed ? posTheme.surfaceElevated : posTheme.surfaceLight,
        border: `1px solid ${isPressed ? posTheme.primary : posTheme.border}`,
        boxShadow: isPressed ? `0 0 15px ${posTheme.primaryGlow}` : 'none',
      }}
    >
      {/* Cart Badge */}
      {inCart > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: posTheme.primary }}
        >
          {inCart}
        </motion.div>
      )}

      {/* Product Image/Icon */}
      <div 
        className="w-full aspect-square rounded-lg mb-2 flex items-center justify-center"
        style={{ backgroundColor: posTheme.surface }}
      >
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-contain rounded-lg"
            loading="lazy"
          />
        ) : (
          <Package className="w-8 h-8" style={{ color: posTheme.textMuted }} />
        )}
      </div>

      {/* Product Info */}
      <h3 
        className="text-[10px] font-semibold truncate mb-1"
        style={{ color: posTheme.textPrimary }}
      >
        {product.name}
      </h3>
      <p 
        className="text-xs font-mono font-bold"
        style={{ color: posTheme.primary }}
      >
        {formatCurrency(price, country)}
      </p>
    </motion.button>
  );
}

// ============================================
// CART ITEM ROW - Receipt Line Style
// ============================================

interface CartItemRowProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  country: CountryCode;
}

function CartItemRow({ item, index, onUpdateQuantity, onRemove, country }: CartItemRowProps) {
  const price = item.product.selling_price ?? item.product.price ?? 0;
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -40, 0], [1, 0.5, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80) {
      haptic.medium();
      onRemove(item.product.id);
    }
  };

  return (
    <motion.div className="relative overflow-hidden">
      {/* Delete indicator */}
      <motion.div 
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1"
        style={{ opacity: deleteOpacity, color: posTheme.danger }}
      >
        <Trash2 className="w-4 h-4" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="py-2.5 px-3 flex items-center gap-3"
      >
        {/* Line Number */}
        <span 
          className="text-[10px] font-mono w-4"
          style={{ color: posTheme.textMuted }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <h4 
            className="text-xs font-medium truncate"
            style={{ color: posTheme.textPrimary }}
          >
            {item.product.name}
          </h4>
          <p className="text-[10px] font-mono" style={{ color: posTheme.textMuted }}>
            {formatCurrency(price, country)} × {item.quantity}
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              haptic.keyPress();
              onUpdateQuantity(item.product.id, Math.max(0, item.quantity - 1));
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-95"
            style={{ backgroundColor: posTheme.surface, border: `1px solid ${posTheme.border}` }}
          >
            <Minus className="w-3 h-3" style={{ color: posTheme.textSecondary }} />
          </button>
          <span 
            className="w-6 text-center font-mono font-bold text-xs"
            style={{ color: posTheme.primary }}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => {
              haptic.keyPress();
              onUpdateQuantity(item.product.id, item.quantity + 1);
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-95"
            style={{ backgroundColor: posTheme.primary }}
          >
            <Plus className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* Line Total */}
        <span 
          className="text-xs font-mono font-bold min-w-[60px] text-right"
          style={{ color: posTheme.primary }}
        >
          {formatCurrency(price * item.quantity, country)}
        </span>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// POS NUMPAD - Hardware Calculator Style
// ============================================

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  country: CountryCode;
  total: number;
}

function POSNumpad({ value, onChange, onConfirm, onCancel, country, total }: NumpadProps) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'];
  const received = parseFloat(value) || 0;
  const change = Math.max(0, received - total);

  const handleKey = (key: string) => {
    haptic.keyPress();
    if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + key);
      }
    } else {
      onChange(value + key);
    }
  };

  return (
    <div className="p-4" style={{ backgroundColor: posTheme.surface }}>
      {/* Amount Display - LCD Screen */}
      <div 
        className="rounded-xl p-4 mb-4"
        style={{ 
          backgroundColor: posTheme.screen,
          border: `1px solid ${posTheme.border}`,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono" style={{ color: posTheme.textMuted }}>TOTAL DUE</span>
          <span className="text-base font-mono font-bold" style={{ color: posTheme.warning }}>
            {formatCurrency(total, country)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono" style={{ color: posTheme.textMuted }}>RECEIVED</span>
          <span 
            className="text-xl font-mono font-bold"
            style={{ color: posTheme.primary, textShadow: `0 0 10px ${posTheme.primaryGlow}` }}
          >
            {country === 'NG' ? '₦' : 'GH₵'}{value || '0'}
          </span>
        </div>
        {received >= total && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center pt-2"
            style={{ borderTop: `1px dashed ${posTheme.border}` }}
          >
            <span className="text-[10px] font-mono" style={{ color: posTheme.textMuted }}>CHANGE</span>
            <span className="text-base font-mono font-bold" style={{ color: posTheme.success }}>
              {formatCurrency(change, country)}
            </span>
          </motion.div>
        )}
      </div>

      {/* Numpad Grid - Calculator Keys */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className="h-12 rounded-xl font-mono font-bold text-lg transition-all active:scale-95"
            style={{ 
              backgroundColor: posTheme.surfaceLight,
              border: `1px solid ${posTheme.border}`,
              color: posTheme.textPrimary,
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex gap-2 mb-4">
        {[100, 200, 500, 1000].map((amount) => (
          <button
            key={amount}
            onClick={() => {
              haptic.keyPress();
              onChange(String(amount));
            }}
            className="flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all active:scale-95"
            style={{ 
              backgroundColor: posTheme.surfaceElevated,
              border: `1px solid ${posTheme.border}`,
              color: posTheme.textSecondary,
            }}
          >
            {amount}
          </button>
        ))}
      </div>

      {/* Action Buttons - Function Keys */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            haptic.keyPress();
            onChange(value.slice(0, -1));
          }}
          className="h-12 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95"
          style={{ 
            backgroundColor: posTheme.warning + '20',
            border: `1px solid ${posTheme.warning}40`,
            color: posTheme.warning,
          }}
        >
          <RotateCcw className="w-4 h-4" />
          DEL
        </button>
        <button
          onClick={onCancel}
          className="h-12 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95"
          style={{ 
            backgroundColor: posTheme.danger + '20',
            border: `1px solid ${posTheme.danger}40`,
            color: posTheme.danger,
          }}
        >
          <X className="w-4 h-4" />
          CLR
        </button>
        <button
          onClick={() => {
            haptic.success();
            onConfirm();
          }}
          disabled={received < total}
          className="h-12 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 disabled:opacity-40 text-white"
          style={{ 
            backgroundColor: posTheme.success,
          }}
        >
          <CheckCircle className="w-4 h-4" />
          OK
        </button>
      </div>
    </div>
  );
}

// ============================================
// PAYMENT METHOD SELECTOR
// ============================================

interface PaymentMethodSelectorProps {
  selected: LocalPaymentMethod;
  onSelect: (method: LocalPaymentMethod) => void;
}

function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  const methods: { id: LocalPaymentMethod; name: string; icon: typeof Banknote; color: string }[] = [
    { id: 'cash', name: 'CASH', icon: Banknote, color: posTheme.success },
    { id: 'card', name: 'CARD', icon: CreditCard, color: posTheme.info },
    { id: 'momo', name: 'MOMO', icon: Smartphone, color: posTheme.warning },
  ];

  return (
    <div className="flex gap-2 p-3">
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => {
            haptic.keyPress();
            onSelect(method.id);
          }}
          className="flex-1 py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all border-2 active:scale-95"
          style={{ 
            borderColor: selected === method.id ? method.color : posTheme.border,
            backgroundColor: selected === method.id ? method.color + '15' : posTheme.surfaceLight,
          }}
        >
          <method.icon 
            className="w-5 h-5" 
            style={{ color: selected === method.id ? method.color : posTheme.textMuted }} 
          />
          <span 
            className="text-[10px] font-mono font-bold tracking-wide"
            style={{ color: selected === method.id ? method.color : posTheme.textMuted }}
          >
            {method.name}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// SUCCESS ANIMATION - Transaction Complete
// ============================================

function SuccessAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    haptic.success();
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: posTheme.background }}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ 
            backgroundColor: posTheme.success + '20',
            border: `3px solid ${posTheme.success}`,
            boxShadow: `0 0 30px ${posTheme.success}40`,
          }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: posTheme.success }} />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-bold font-mono mb-2"
          style={{ color: posTheme.success }}
        >
          TRANSACTION COMPLETE
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs font-mono"
          style={{ color: posTheme.textMuted }}
        >
          Thank you! 🎉
        </motion.p>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MobilePOSPage() {
  const { tenant, store, user } = useAuthStore();
  const queryClient = useQueryClient();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';

  // Cart store
  const {
    items: cartItems,
    customer: selectedCustomer,
    subtotal,
    total,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartStore();

  // UI State
  const [view, setView] = useState<ViewMode>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<LocalPaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [amountReceived, setAmountReceived] = useState('');
  const [lastAddedItem, setLastAddedItem] = useState<{ name: string; price: number; qty: number } | null>(null);

  // Clear last added item after delay
  useEffect(() => {
    if (lastAddedItem) {
      const timer = setTimeout(() => setLastAddedItem(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      return (data || []) as Category[];
    },
    enabled: !!store?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', store?.id, selectedCategory, searchQuery],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('products')
        .select('*, category:categories(name), stock_levels(quantity)')
        .eq('store_id', store.id)
        .eq('is_active', true);
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%`);
      }
      
      const { data } = await query.order('name').limit(100);
      return ((data || []) as any[]).map(p => ({
        ...p,
        selling_price: p.price,
        stock_quantity: p.stock_levels?.[0]?.quantity || 0,
      })) as unknown as Product[];
    },
    enabled: !!store?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Get cart quantity for a product
  const getCartQuantity = useCallback((productId: string) => {
    const item = cartItems.find(i => i.product.id === productId);
    return item?.quantity || 0;
  }, [cartItems]);

  // Handle add to cart
  const handleAddToCart = useCallback((product: Product) => {
    addItem(product, undefined, 1);
    const existingQty = cartItems.find(i => i.product.id === product.id)?.quantity || 0;
    setLastAddedItem({
      name: product.name,
      price: product.selling_price ?? product.price ?? 0,
      qty: existingQty + 1,
    });
  }, [addItem, cartItems]);

  // Process sale mutation
  const processSale = useMutation({
    mutationFn: async () => {
      if (!store?.id || !user?.id || cartItems.length === 0) {
        throw new Error('Invalid sale data');
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          store_id: store.id,
          user_id: user.id,
          customer_id: selectedCustomer?.id || null,
          subtotal,
          tax_amount: 0,
          discount_amount: 0,
          total,
          payment_method: paymentMethod,
          payment_status: 'completed',
          status: 'completed',
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.selling_price || item.product.price || 0,
        discount: item.discount || 0,
        total: (item.product.selling_price || item.product.price || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      for (const item of cartItems) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product.id,
          p_store_id: store.id,
          p_quantity: item.quantity,
        });
      }

      return sale;
    },
    onSuccess: () => {
      setPaymentStatus('success');
      clearCart();
      setLastAddedItem(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error: any) => {
      setPaymentStatus('error');
      toast.error('Transaction failed', { description: error.message });
    },
  });

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setView('checkout');
  };

  // Handle payment
  const handlePayment = () => {
    setPaymentStatus('processing');
    haptic.medium();
    processSale.mutate();
  };

  // Handle success complete
  const handleSuccessComplete = () => {
    setPaymentStatus('idle');
    setView('products');
    setAmountReceived('');
  };

  return (
    <div 
      className="min-h-screen flex flex-col safe-area-inset-top"
      style={{ backgroundColor: posTheme.background }}
    >
      {/* Success Animation */}
      <AnimatePresence>
        {paymentStatus === 'success' && (
          <SuccessAnimation onComplete={handleSuccessComplete} />
        )}
      </AnimatePresence>

      {/* Main Display Screen - LCD */}
      <div className="pt-2 pb-3">
        <POSDisplay 
          total={total} 
          itemCount={itemCount} 
          country={country}
          lastItem={lastAddedItem}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Products View */}
          {view === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Search Bar */}
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: posTheme.textMuted }} 
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-mono focus:outline-none focus:ring-1"
                    style={{ 
                      backgroundColor: posTheme.surfaceLight,
                      border: `1px solid ${posTheme.border}`,
                      color: posTheme.textPrimary,
                      // @ts-ignore
                      '--tw-ring-color': posTheme.primary,
                    }}
                  />
                  {searchQuery && (
                    <button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center active:scale-95"
                      style={{ backgroundColor: posTheme.surfaceElevated }}
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="w-3 h-3" style={{ color: posTheme.textMuted }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories - Quick Filter */}
              <div className="flex gap-2 overflow-x-auto px-3 pb-3 scrollbar-hide">
                <button
                  onClick={() => {
                    haptic.keyPress();
                    setSelectedCategory(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all active:scale-95"
                  style={{ 
                    backgroundColor: !selectedCategory ? posTheme.primary : posTheme.surfaceLight,
                    color: !selectedCategory ? '#ffffff' : posTheme.textSecondary,
                    border: `1px solid ${!selectedCategory ? posTheme.primary : posTheme.border}`,
                  }}
                >
                  ALL
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      haptic.keyPress();
                      setSelectedCategory(cat.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1 active:scale-95"
                    style={{ 
                      backgroundColor: selectedCategory === cat.id ? posTheme.primary : posTheme.surfaceLight,
                      color: selectedCategory === cat.id ? '#ffffff' : posTheme.textSecondary,
                      border: `1px solid ${selectedCategory === cat.id ? posTheme.primary : posTheme.border}`,
                    }}
                  >
                    {cat.icon && <span className="text-xs">{cat.icon}</span>}
                    {cat.name.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Products Grid - 3 columns for compact mobile view */}
              <div className="flex-1 overflow-y-auto px-3 pb-24">
                {productsLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(9)].map((_, i) => (
                      <div 
                        key={i} 
                        className="rounded-xl p-2.5 animate-pulse"
                        style={{ backgroundColor: posTheme.surfaceLight }}
                      >
                        <div 
                          className="aspect-square rounded-lg mb-2"
                          style={{ backgroundColor: posTheme.surface }} 
                        />
                        <div 
                          className="h-3 rounded w-3/4 mb-1"
                          style={{ backgroundColor: posTheme.surface }} 
                        />
                        <div 
                          className="h-4 rounded w-1/2"
                          style={{ backgroundColor: posTheme.surface }} 
                        />
                      </div>
                    ))}
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {products.map((product) => (
                      <ProductButton
                        key={product.id}
                        product={product}
                        onAdd={handleAddToCart}
                        country={country}
                        inCart={getCartQuantity(product.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package 
                      className="w-12 h-12 mx-auto mb-3"
                      style={{ color: posTheme.textMuted }} 
                    />
                    <p 
                      className="text-xs font-mono"
                      style={{ color: posTheme.textMuted }}
                    >
                      {searchQuery ? 'NO RESULTS' : 'NO PRODUCTS'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Cart View - Receipt Style */}
          {view === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col pb-24"
            >
              {cartItems.length > 0 ? (
                <>
                  {/* Receipt Header */}
                  <div 
                    className="px-3 py-2 text-center"
                    style={{ borderBottom: `1px dashed ${posTheme.border}` }}
                  >
                    <p 
                      className="text-[10px] font-mono"
                      style={{ color: posTheme.textMuted }}
                    >
                      ══════ TRANSACTION ══════
                    </p>
                    <p 
                      className="text-xs font-mono mt-1"
                      style={{ color: posTheme.textSecondary }}
                    >
                      {new Date().toLocaleDateString()} • {cartItems.length} items
                    </p>
                  </div>

                  {/* Cart Items - Receipt Lines */}
                  <div 
                    className="flex-1 overflow-y-auto"
                    style={{ borderBottom: `1px dashed ${posTheme.border}` }}
                  >
                    {cartItems.map((item, index) => (
                      <CartItemRow
                        key={item.product.id}
                        item={item}
                        index={index}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                        country={country}
                      />
                    ))}
                  </div>

                  {/* Cart Summary - Receipt Footer */}
                  <div className="px-3 py-3">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span style={{ color: posTheme.textMuted }}>SUBTOTAL</span>
                      <span style={{ color: posTheme.textSecondary }}>
                        {formatCurrency(subtotal, country)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span style={{ color: posTheme.textMuted }}>TAX</span>
                      <span style={{ color: posTheme.textSecondary }}>
                        {formatCurrency(0, country)}
                      </span>
                    </div>
                    <div 
                      className="flex justify-between pt-2"
                      style={{ borderTop: `2px solid ${posTheme.primary}` }}
                    >
                      <span 
                        className="text-base font-mono font-bold"
                        style={{ color: posTheme.textPrimary }}
                      >
                        TOTAL
                      </span>
                      <span 
                        className="text-lg font-mono font-bold"
                        style={{ color: posTheme.primary }}
                      >
                        {formatCurrency(total, country)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingCart 
                      className="w-12 h-12 mx-auto mb-3"
                      style={{ color: posTheme.textMuted }} 
                    />
                    <p 
                      className="text-xs font-mono mb-4"
                      style={{ color: posTheme.textMuted }}
                    >
                      CART EMPTY
                    </p>
                    <button
                      onClick={() => setView('products')}
                      className="px-4 py-2 rounded-lg font-mono text-xs font-bold active:scale-95"
                      style={{ backgroundColor: posTheme.primary, color: '#ffffff' }}
                    >
                      ADD ITEMS
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Checkout View - Payment Terminal */}
          {view === 'checkout' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col pb-24"
            >
              {/* Order Summary Header */}
              <div 
                className="px-3 py-3"
                style={{ borderBottom: `1px solid ${posTheme.border}` }}
              >
                <div className="flex justify-between items-center">
                  <span 
                    className="text-xs font-mono"
                    style={{ color: posTheme.textMuted }}
                  >
                    {itemCount} ITEMS
                  </span>
                  <span 
                    className="text-lg font-mono font-bold"
                    style={{ color: posTheme.primary }}
                  >
                    {formatCurrency(total, country)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div style={{ borderBottom: `1px solid ${posTheme.border}` }}>
                <p 
                  className="px-3 pt-3 text-xs font-mono"
                  style={{ color: posTheme.textMuted }}
                >
                  SELECT PAYMENT
                </p>
                <PaymentMethodSelector
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                />
              </div>

              {/* Cash Amount Entry - Numpad */}
              {paymentMethod === 'cash' && (
                <div className="flex-1 overflow-y-auto">
                  <POSNumpad
                    value={amountReceived}
                    onChange={setAmountReceived}
                    onConfirm={handlePayment}
                    onCancel={() => setAmountReceived('')}
                    country={country}
                    total={total}
                  />
                </div>
              )}

              {/* Card/MoMo Payment - Simple Button */}
              {paymentMethod !== 'cash' && (
                <div className="flex-1 flex items-center justify-center p-6">
                  <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'processing'}
                    className="w-full py-3 rounded-xl font-mono font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                    style={{ backgroundColor: posTheme.primary, color: posTheme.background }}
                  >
                    {paymentStatus === 'processing' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'card' ? (
                          <CreditCard className="w-5 h-5" />
                        ) : (
                          <Smartphone className="w-5 h-5" />
                        )}
                        COMPLETE {formatCurrency(total, country)}
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - POS Function Keys */}
      <nav 
        className="fixed bottom-0 left-0 right-0 px-4 py-2 z-40 safe-area-inset-bottom"
        style={{ 
          backgroundColor: posTheme.surface,
          borderTop: `1px solid ${posTheme.border}`,
        }}
      >
        <div className="flex items-center justify-around gap-2">
          {/* Products/Items Button */}
          <button
            onClick={() => {
              haptic.keyPress();
              setView('products');
            }}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95"
            style={{ 
              backgroundColor: view === 'products' ? posTheme.primary + '20' : 'transparent',
              border: `1px solid ${view === 'products' ? posTheme.primary : 'transparent'}`,
            }}
          >
            <LayoutGrid 
              className="w-5 h-5" 
              style={{ color: view === 'products' ? posTheme.primary : posTheme.textMuted }} 
            />
            <span 
              className="text-[10px] font-mono font-bold"
              style={{ color: view === 'products' ? posTheme.primary : posTheme.textMuted }}
            >
              ITEMS
            </span>
          </button>

          {/* Cart Button - Elevated Center */}
          <button
            onClick={() => {
              haptic.keyPress();
              setView('cart');
            }}
            className="relative -mt-5"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ 
                backgroundColor: posTheme.primary,
                boxShadow: `0 4px 15px ${posTheme.primaryGlow}`,
              }}
            >
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            {itemCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: posTheme.danger }}
              >
                <span 
                  className="text-[10px] font-mono font-bold text-white"
                >
                  {itemCount}
                </span>
              </motion.div>
            )}
          </button>

          {/* Checkout/Pay Button */}
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95',
              cartItems.length === 0 && 'opacity-40'
            )}
            style={{ 
              backgroundColor: view === 'checkout' ? posTheme.success + '20' : 'transparent',
              border: `1px solid ${view === 'checkout' ? posTheme.success : 'transparent'}`,
            }}
          >
            <CircleDollarSign 
              className="w-5 h-5" 
              style={{ color: view === 'checkout' ? posTheme.success : posTheme.textMuted }} 
            />
            <span 
              className="text-[10px] font-mono font-bold"
              style={{ color: view === 'checkout' ? posTheme.success : posTheme.textMuted }}
            >
              PAY
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default MobilePOSPage;
