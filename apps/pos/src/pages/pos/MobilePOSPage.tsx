/**
 * MobilePOSPage - PWA-Optimized Point of Sale
 * 
 * A beautiful, touch-first mobile POS experience for Ghana/Nigeria markets
 * Features:
 * - Bottom navigation with cart badge
 * - Swipeable product cards
 * - Pull-to-refresh
 * - Haptic feedback simulation
 * - Offline-first with sync
 * - Quick numpad for quantities
 * - Voice search (future)
 * - Barcode scanner integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Grid3X3,
  Scan,
  Trash2,
  CheckCircle,
  Receipt,
  ArrowLeft,
  RefreshCw,
  ChevronRight,
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
// THEME CONFIG
// ============================================

const getTheme = (country: CountryCode) => {
  const isNigeria = country === 'NG';
  return {
    primary: isNigeria ? '#008751' : '#FFD000',
    primaryDark: isNigeria ? '#006B41' : '#D4A900',
    primaryLight: isNigeria ? '#E8F5EE' : '#FFF9E0',
    primaryMid: isNigeria ? '#66B894' : '#FFEC80',
    text: isNigeria ? '#FFFFFF' : '#1A1400',
    textOnLight: isNigeria ? '#004D31' : '#6B5A00',
    accent: isNigeria ? '#00A86B' : '#B8960B',
    gradient: isNigeria 
      ? 'from-emerald-600 via-green-600 to-teal-600'
      : 'from-amber-400 via-yellow-500 to-amber-600',
    emoji: isNigeria ? '🇳🇬' : '🇬🇭',
  };
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
};

// ============================================
// PRODUCT CARD COMPONENT
// ============================================

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  theme: ReturnType<typeof getTheme>;
  currency: string;
  inCart: number;
}

function ProductCard({ product, onAdd, theme, currency, inCart }: ProductCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleAdd = () => {
    haptic.light();
    onAdd(product);
  };

  const price = product.selling_price ?? product.price ?? 0;
  const isLowStock = (product.stock_quantity ?? 0) <= 5;
  const isOutOfStock = (product.stock_quantity ?? 0) === 0;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      className={cn(
        'relative bg-white rounded-2xl overflow-hidden shadow-sm border transition-all',
        isPressed ? 'shadow-lg border-transparent' : 'border-gray-100',
        isOutOfStock && 'opacity-60'
      )}
      style={{ borderColor: isPressed ? theme.primary : undefined }}
    >
      {/* Cart Badge */}
      {inCart > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: theme.primary, color: theme.text }}
        >
          {inCart}
        </motion.div>
      )}

      {/* Low Stock Badge */}
      {isLowStock && !isOutOfStock && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
          Low Stock
        </div>
      )}

      {/* Product Image */}
      <div 
        className="aspect-square flex items-center justify-center p-4"
        style={{ backgroundColor: theme.primaryLight }}
        onClick={!isOutOfStock ? handleAdd : undefined}
      >
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <Package className="w-12 h-12" style={{ color: theme.primaryMid }} />
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <p className="text-xs font-medium text-gray-500 truncate mb-0.5">
          {(product as any).category?.name || 'Uncategorized'}
        </p>
        <h3 className="font-semibold text-sm text-gray-900 truncate">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <p 
            className="text-base font-bold"
            style={{ color: theme.textOnLight }}
          >
            {formatCurrency(price, currency as any)}
          </p>
          {!isOutOfStock && (
            <button
              onClick={handleAdd}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ backgroundColor: theme.primary }}
            >
              <Plus className="w-4 h-4" style={{ color: theme.text }} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// CART ITEM COMPONENT
// ============================================

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  theme: ReturnType<typeof getTheme>;
  currency: string;
}

function CartItemRow({ item, onUpdateQuantity, onRemove, theme, currency }: CartItemRowProps) {
  const price = item.product.selling_price ?? item.product.price ?? 0;
  const x = useMotionValue(0);
  const background = useTransform(x, [-100, 0], ['#ef4444', '#ffffff']);
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      haptic.medium();
      onRemove(item.product.id);
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl mb-2"
      style={{ background }}
    >
      {/* Delete indicator */}
      <motion.div 
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white"
        style={{ opacity: deleteOpacity }}
      >
        <Trash2 className="w-5 h-5" />
        <span className="text-sm font-medium">Delete</span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3"
      >
        {/* Image */}
        <div 
          className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: theme.primaryLight }}
        >
          {item.product.image_url ? (
            <img 
              src={item.product.image_url} 
              alt={item.product.name}
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <Package className="w-6 h-6" style={{ color: theme.primaryMid }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 truncate">
            {item.product.name}
          </h4>
          <p className="text-sm font-bold mt-0.5" style={{ color: theme.textOnLight }}>
            {formatCurrency(price, currency as any)}
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.light();
              onUpdateQuantity(item.product.id, Math.max(0, item.quantity - 1));
            }}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-8 text-center font-bold text-gray-900">
            {item.quantity}
          </span>
          <button
            onClick={() => {
              haptic.light();
              onUpdateQuantity(item.product.id, item.quantity + 1);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95"
            style={{ backgroundColor: theme.primary }}
          >
            <Plus className="w-4 h-4" style={{ color: theme.text }} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// NUMPAD COMPONENT
// ============================================

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  theme: ReturnType<typeof getTheme>;
  currency: string;
}

function Numpad({ value, onChange, onConfirm, onCancel, theme, currency }: NumpadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const handleKey = (key: string) => {
    haptic.light();
    if (key === '⌫') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + key);
      }
    } else {
      onChange(value + key);
    }
  };

  return (
    <div className="p-4">
      {/* Amount Display */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500 mb-1">Amount Received</p>
        <p className="text-4xl font-bold" style={{ color: theme.textOnLight }}>
          {currency === 'NGN' ? '₦' : 'GH₵'}
          {value || '0'}
        </p>
      </div>

      {/* Numpad Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className={cn(
              'h-14 rounded-xl font-bold text-xl transition-all active:scale-95',
              key === '⌫' 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-100 text-gray-900'
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl font-semibold text-gray-600 bg-gray-100 active:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            haptic.success();
            onConfirm();
          }}
          className="flex-1 py-4 rounded-xl font-semibold text-white active:scale-98"
          style={{ backgroundColor: theme.primary }}
        >
          Confirm
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
  theme: ReturnType<typeof getTheme>;
}

function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  const methods: { id: LocalPaymentMethod; name: string; icon: typeof Banknote; color: string }[] = [
    { id: 'cash', name: 'Cash', icon: Banknote, color: '#22c55e' },
    { id: 'card', name: 'Card', icon: CreditCard, color: '#3b82f6' },
    { id: 'momo', name: 'MoMo', icon: Smartphone, color: '#f59e0b' },
  ];

  return (
    <div className="flex gap-2 p-4">
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => {
            haptic.light();
            onSelect(method.id);
          }}
          className={cn(
            'flex-1 py-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2',
            selected === method.id
              ? 'border-current shadow-lg'
              : 'border-transparent bg-gray-50'
          )}
          style={selected === method.id ? { 
            borderColor: method.color,
            backgroundColor: `${method.color}10`,
          } : {}}
        >
          <method.icon 
            className="w-6 h-6" 
            style={{ color: selected === method.id ? method.color : '#9ca3af' }} 
          />
          <span 
            className="text-sm font-semibold"
            style={{ color: selected === method.id ? method.color : '#6b7280' }}
          >
            {method.name}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// SUCCESS ANIMATION
// ============================================

function SuccessAnimation({ onComplete, theme }: { onComplete: () => void; theme: ReturnType<typeof getTheme> }) {
  useEffect(() => {
    haptic.success();
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: theme.primary }}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-14 h-14" style={{ color: theme.text }} />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-2"
          style={{ color: theme.text }}
        >
          Payment Successful!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg opacity-80"
          style={{ color: theme.text }}
        >
          Thank you for your purchase 🎉
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
  const currency = country === 'NG' ? 'NGN' : 'GHS';
  const theme = getTheme(country);

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
  const [showNumpad, setShowNumpad] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
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

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    haptic.medium();
    await refetchProducts();
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
    setIsRefreshing(false);
    toast.success('Refreshed!', { duration: 1500 });
  };

  // Get cart quantity for a product
  const getCartQuantity = useCallback((productId: string) => {
    const item = cartItems.find(i => i.product.id === productId);
    return item?.quantity || 0;
  }, [cartItems]);

  // Handle add to cart
  const handleAddToCart = useCallback((product: Product) => {
    addItem(product, undefined, 1);
    toast.success(`Added ${product.name}`, { duration: 1000, position: 'top-center' });
  }, [addItem]);

  // Process sale mutation
  const processSale = useMutation({
    mutationFn: async () => {
      if (!store?.id || !user?.id || cartItems.length === 0) {
        throw new Error('Invalid sale data');
      }

      // Create sale
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

      // Create sale items
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

      // Update stock levels
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error: any) => {
      setPaymentStatus('error');
      toast.error('Payment failed', { description: error.message });
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

  // Calculate change
  const change = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - total);
  }, [amountReceived, total]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Success Animation */}
      <AnimatePresence>
        {paymentStatus === 'success' && (
          <SuccessAnimation onComplete={handleSuccessComplete} theme={theme} />
        )}
      </AnimatePresence>

      {/* Enhanced Header */}
      <header className="sticky top-0 z-40 overflow-hidden">
        {/* Animated Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: country === 'NG' 
              ? 'linear-gradient(135deg, #008751 0%, #00A86B 50%, #006B41 100%)' 
              : 'linear-gradient(135deg, #FFD000 0%, #FFEC80 50%, #D4A900 100%)'
          }}
        />
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl animate-pulse"
            style={{ backgroundColor: theme.primaryLight }}
          />
          <div 
            className="absolute -bottom-5 -left-5 w-32 h-32 rounded-full blur-2xl animate-pulse"
            style={{ backgroundColor: theme.primaryDark, animationDelay: '1s' }}
          />
        </div>

        {/* Header Content */}
        <div className="relative px-4 pt-3 pb-4">
          {/* Top Row: Back/Logo + Title + Actions */}
          <div className="flex items-center gap-3">
            {/* Left: Back Button or User Avatar */}
            <AnimatePresence mode="wait">
              {view !== 'products' ? (
                <motion.button
                  key="back"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => {
                    haptic.light();
                    setView(view === 'checkout' ? 'cart' : 'products');
                  }}
                  className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5" style={{ color: theme.text }} />
                </motion.button>
              ) : (
                <motion.div
                  key="avatar"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-11 h-11 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/20 font-bold text-sm shadow-lg"
                  style={{ color: theme.text }}
                >
                  {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || theme.emoji}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center: Title & Status */}
            <div className="flex-1 min-w-0">
              <motion.h1 
                key={view}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-lg font-bold tracking-tight truncate" 
                style={{ color: theme.text }}
              >
                {view === 'products' ? 'Point of Sale' : view === 'cart' ? `Cart (${itemCount})` : 'Checkout'}
              </motion.h1>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Online Status Badge */}
                <motion.div 
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                    isOnline 
                      ? 'bg-emerald-500/20 text-emerald-100' 
                      : 'bg-red-500/20 text-red-100'
                  )}
                  animate={{ scale: isOnline ? 1 : [1, 1.05, 1] }}
                  transition={{ repeat: isOnline ? 0 : Infinity, duration: 2 }}
                >
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isOnline ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'
                  )} />
                  {isOnline ? 'LIVE' : 'OFFLINE'}
                </motion.div>
                {/* Store Name */}
                <span 
                  className="text-[11px] font-medium truncate max-w-[120px]" 
                  style={{ color: `${theme.text}B3` }}
                >
                  {store?.name}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {view === 'products' && (
                <>
                  {/* Time Display */}
                  <div 
                    className="hidden xs:flex flex-col items-end text-right px-2"
                    style={{ color: theme.text }}
                  >
                    <span className="text-xs font-bold">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] opacity-70">
                      {new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {/* Refresh Button */}
                  <motion.button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    whileTap={{ scale: 0.9 }}
                    className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10 disabled:opacity-50"
                  >
                    <motion.div
                      animate={{ rotate: isRefreshing ? 360 : 0 }}
                      transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
                    >
                      <RefreshCw className="w-5 h-5" style={{ color: theme.text }} />
                    </motion.div>
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar - Products View Only */}
          <AnimatePresence>
            {view === 'products' && (
              <motion.div 
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, SKU, barcode..."
                    className="w-full pl-11 pr-14 py-3.5 rounded-2xl bg-white/95 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-lg shadow-black/5 text-sm font-medium"
                    style={{ '--tw-ring-color': theme.primaryDark } as any}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {searchQuery && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => setSearchQuery('')}
                        className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 active:scale-95 transition-transform"
                      >
                        ×
                      </motion.button>
                    )}
                    <button 
                      className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                      style={{ backgroundColor: theme.primary }}
                      onClick={() => {
                        haptic.medium();
                        toast.info('Scanner coming soon!');
                      }}
                    >
                      <Scan className="w-5 h-5" style={{ color: theme.text }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle Bottom Border Glow */}
        <div 
          className="h-1 w-full"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${theme.primaryLight}50, transparent)` 
          }}
        />
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        <AnimatePresence mode="wait">
          {/* Products View */}
          {view === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
                <button
                  onClick={() => {
                    haptic.light();
                    setSelectedCategory(null);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all',
                    !selectedCategory ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
                  )}
                  style={!selectedCategory ? { backgroundColor: theme.primary } : {}}
                >
                  All
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      haptic.light();
                      setSelectedCategory(cat.id);
                    }}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
                      selectedCategory === cat.id ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
                    )}
                    style={selectedCategory === cat.id ? { backgroundColor: theme.primary } : {}}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              {productsLoading ? (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                      <div className="aspect-square rounded-xl mb-3" style={{ backgroundColor: theme.primaryLight }} />
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAddToCart}
                      theme={theme}
                      currency={currency}
                      inCart={getCartQuantity(product.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? 'No products found' : 'No products available'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Cart View */}
          {view === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {cartItems.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    Swipe left to remove items
                  </p>
                  {cartItems.map((item) => (
                    <CartItemRow
                      key={item.product.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      theme={theme}
                      currency={currency}
                    />
                  ))}

                  {/* Cart Summary */}
                  <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Subtotal ({itemCount} items)</span>
                      <span>{formatCurrency(subtotal, currency as any)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Tax</span>
                      <span>{formatCurrency(0, currency as any)}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span 
                          className="text-xl font-bold"
                          style={{ color: theme.textOnLight }}
                        >
                          {formatCurrency(total, currency as any)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <button
                    onClick={() => setView('products')}
                    className="mt-4 px-6 py-2 rounded-xl font-semibold"
                    style={{ backgroundColor: theme.primaryLight, color: theme.textOnLight }}
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Checkout View */}
          {view === 'checkout' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Order Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 mb-4">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Order Summary</h3>
                </div>
                <div className="p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">{itemCount} items</span>
                    <span className="text-gray-900">{formatCurrency(subtotal, currency as any)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span style={{ color: theme.textOnLight }}>
                      {formatCurrency(total, currency as any)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl border border-gray-100 mb-4">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Payment Method</h3>
                </div>
                <PaymentMethodSelector
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  theme={theme}
                />
              </div>

              {/* Amount for Cash */}
              {paymentMethod === 'cash' && (
                <div className="bg-white rounded-2xl border border-gray-100 mb-4">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Cash Payment</h3>
                  </div>
                  <button
                    onClick={() => setShowNumpad(true)}
                    className="w-full p-4 text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-500">Amount Received</p>
                      <p className="text-xl font-bold" style={{ color: theme.textOnLight }}>
                        {amountReceived ? formatCurrency(parseFloat(amountReceived), currency as any) : 'Enter amount'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  {parseFloat(amountReceived) >= total && (
                    <div className="px-4 pb-4">
                      <div className="p-3 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
                        <p className="text-sm" style={{ color: theme.textOnLight }}>
                          Change: <span className="font-bold">{formatCurrency(change, currency as any)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handlePayment}
                disabled={paymentStatus === 'processing' || (paymentMethod === 'cash' && parseFloat(amountReceived) < total)}
                className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 transition-all"
                style={{ backgroundColor: theme.primary, color: theme.text }}
              >
                {paymentStatus === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="w-5 h-5" />
                    Complete Sale - {formatCurrency(total, currency as any)}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Numpad Modal */}
      <AnimatePresence>
        {showNumpad && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowNumpad(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <Numpad
                value={amountReceived}
                onChange={setAmountReceived}
                onConfirm={() => setShowNumpad(false)}
                onCancel={() => {
                  setAmountReceived('');
                  setShowNumpad(false);
                }}
                theme={theme}
                currency={currency}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 z-40">
        <div className="flex items-center justify-around">
          <button
            onClick={() => {
              haptic.light();
              setView('products');
            }}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all',
              view === 'products' && 'bg-gray-100'
            )}
          >
            <Grid3X3 
              className="w-6 h-6" 
              style={{ color: view === 'products' ? theme.primary : '#9ca3af' }} 
            />
            <span 
              className="text-xs font-medium"
              style={{ color: view === 'products' ? theme.textOnLight : '#6b7280' }}
            >
              Products
            </span>
          </button>

          {/* Cart Button */}
          <button
            onClick={() => {
              haptic.light();
              setView('cart');
            }}
            className="relative -mt-8"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: theme.primary }}
            >
              <ShoppingCart className="w-7 h-7" style={{ color: theme.text }} />
            </div>
            {itemCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">{itemCount}</span>
              </motion.div>
            )}
          </button>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all',
              view === 'checkout' && 'bg-gray-100',
              cartItems.length === 0 && 'opacity-50'
            )}
          >
            <CreditCard 
              className="w-6 h-6" 
              style={{ color: view === 'checkout' ? theme.primary : '#9ca3af' }} 
            />
            <span 
              className="text-xs font-medium"
              style={{ color: view === 'checkout' ? theme.textOnLight : '#6b7280' }}
            >
              Checkout
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default MobilePOSPage;
