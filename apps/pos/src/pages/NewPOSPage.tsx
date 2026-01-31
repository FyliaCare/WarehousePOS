import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, ShoppingCart, Minus, Plus, Trash2, User, CreditCard, Banknote,
  Smartphone, X, Loader2, Grid3X3, LayoutList, Percent, ChevronRight,
  ChevronUp, Check, Printer, ArrowLeft, Pause, Play, Receipt, Building2,
  Scan, Home, Package, Tag, Gift, Clock, Store, Truck, UtensilsCrossed, MessageSquare,
} from 'lucide-react';
import { Modal, Avatar } from '@warehousepos/ui';
import { formatCurrency, cn } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import type { Product, Customer, PaymentMethod, CountryCode, Sale, Category } from '@warehousepos/types';

// Types
interface HeldSale {
  id: string;
  items: CartItem[];
  customer: Customer | null;
  timestamp: Date;
  note?: string;
  fulfillmentType: FulfillmentType;
}

type FulfillmentType = 'pickup' | 'delivery' | 'dine-in';

// Constants
const FULFILLMENT_OPTIONS: { type: FulfillmentType; icon: React.ReactNode; label: string }[] = [
  { type: 'pickup', icon: <Store className="w-4 h-4" />, label: 'Pickup' },
  { type: 'delivery', icon: <Truck className="w-4 h-4" />, label: 'Delivery' },
  { type: 'dine-in', icon: <UtensilsCrossed className="w-4 h-4" />, label: 'Dine-In' },
];

const PAYMENT_METHODS: { method: PaymentMethod; icon: React.ReactNode; label: string; color: string }[] = [
  { method: 'cash', icon: <Banknote className="w-5 h-5" />, label: 'Cash', color: 'bg-green-100 text-green-600' },
  { method: 'card', icon: <CreditCard className="w-5 h-5" />, label: 'Card', color: 'bg-blue-100 text-blue-600' },
  { method: 'momo', icon: <Smartphone className="w-5 h-5" />, label: 'Mobile Money', color: 'bg-yellow-100 text-yellow-600' },
  { method: 'transfer', icon: <Building2 className="w-5 h-5" />, label: 'Bank Transfer', color: 'bg-purple-100 text-purple-600' },
];

export function POSPage() {
  const queryClient = useQueryClient();
  const { tenant, store, user } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  
  const isNigeria = country === 'NG';
  const brandBg = isNigeria ? 'bg-[#008751]' : 'bg-[#FFD000]';
  const brandBgHover = isNigeria ? 'hover:bg-[#006b41]' : 'hover:bg-[#E6BB00]';
  const brandText = isNigeria ? 'text-white' : 'text-black';
  const brandRing = isNigeria ? 'ring-[#008751]' : 'ring-[#FFD000]';
  
  const {
    items: cartItems, customer: selectedCustomer, subtotal, totalDiscount, tax, total, itemCount,
    addItem, updateQuantity, removeItem, setItemDiscount, setCustomer, setDiscount, setNotes, clearCart, notes: cartNotes,
  } = useCartStore();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isItemDiscountModalOpen, setIsItemDiscountModalOpen] = useState(false);
  const [isHeldSalesModalOpen, setIsHeldSalesModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPromoCodeModalOpen, setIsPromoCodeModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
  const [itemDiscountValue, setItemDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [noteText, setNoteText] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') (document.activeElement as HTMLElement).blur();
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k': e.preventDefault(); searchInputRef.current?.focus(); break;
          case 'p': e.preventDefault(); if (cartItems.length > 0) setIsPaymentModalOpen(true); break;
          case 'h': e.preventDefault(); if (cartItems.length > 0) holdSale(); break;
          case 'c': e.preventDefault(); setIsCustomerModalOpen(true); break;
        }
      }
      if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
        setIsCustomerModalOpen(false);
        setIsDiscountModalOpen(false);
        setMobileCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length]);
  
  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['pos-categories', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase.from('categories').select('*').eq('store_id', store.id).eq('is_active', true).order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as Category[];
    },
    enabled: !!store?.id,
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', store?.id, selectedCategory, searchQuery],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase.from('products').select('*, category:categories(id, name, color), stock_levels(quantity)').eq('store_id', store.id).eq('is_active', true);
      if (selectedCategory) query = query.eq('category_id', selectedCategory);
      if (searchQuery.trim()) query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%`);
      const { data, error } = await query.order('name').limit(100);
      if (error) throw error;
      // Map stock_levels to stock_quantity and price to selling_price for backward compatibility
      return (data || []).map((p: any) => ({
        ...p,
        stock_quantity: p.stock_levels?.[0]?.quantity || 0,
        selling_price: p.price, // Map price to selling_price for cart store compatibility
      })) as Product[];
    },
    enabled: !!store?.id,
  });
  
  const { data: customers = [] } = useQuery({
    queryKey: ['pos-customers', store?.id, customerSearch],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase.from('customers').select('*').eq('store_id', store.id);
      if (customerSearch.trim()) query = query.or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`);
      const { data, error } = await query.order('name').limit(20);
      if (error) throw error;
      return (data || []) as Customer[];
    },
    enabled: !!store?.id,
  });
  
  // Handlers
  const handleProductAdd = useCallback((product: Product) => {
    addItem(product);
    if (navigator.vibrate) navigator.vibrate(10);
  }, [addItem]);
  
  const holdSale = useCallback(() => {
    if (cartItems.length === 0) return;
    const held: HeldSale = { id: Date.now().toString(), items: [...cartItems], customer: selectedCustomer, timestamp: new Date(), fulfillmentType };
    setHeldSales(prev => [...prev, held]);
    clearCart();
    toast.success('Sale held', { description: 'You can resume it later' });
  }, [cartItems, selectedCustomer, fulfillmentType, clearCart]);
  
  const resumeSale = useCallback((held: HeldSale) => {
    if (cartItems.length > 0) holdSale();
    held.items.forEach(item => addItem(item.product, item.variant, item.quantity));
    if (held.customer) setCustomer(held.customer);
    setFulfillmentType(held.fulfillmentType);
    setHeldSales(prev => prev.filter(h => h.id !== held.id));
    setIsHeldSalesModalOpen(false);
    toast.success('Sale resumed');
  }, [cartItems.length, holdSale, addItem, setCustomer]);
  
  const applyCartDiscount = useCallback(() => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value < 0) { toast.error('Invalid discount value'); return; }
    if (discountType === 'percentage' && value > 100) { toast.error('Percentage cannot exceed 100%'); return; }
    setDiscount(value, discountType);
    setIsDiscountModalOpen(false);
    setDiscountValue('');
    toast.success('Discount applied');
  }, [discountValue, discountType, setDiscount]);
  
  const applyItemDiscount = useCallback(() => {
    if (!selectedItemForDiscount) return;
    const value = parseFloat(itemDiscountValue);
    if (isNaN(value) || value < 0) { toast.error('Invalid discount value'); return; }
    setItemDiscount(selectedItemForDiscount.id, value);
    setIsItemDiscountModalOpen(false);
    setSelectedItemForDiscount(null);
    setItemDiscountValue('');
    toast.success('Item discount applied');
  }, [selectedItemForDiscount, itemDiscountValue, setItemDiscount]);
  
  const openItemDiscount = useCallback((item: CartItem) => {
    setSelectedItemForDiscount(item);
    setItemDiscountValue(item.discount > 0 ? item.discount.toString() : '');
    setIsItemDiscountModalOpen(true);
  }, []);
  
  const saveNotes = useCallback(() => {
    setNotes(noteText);
    setIsNotesModalOpen(false);
    toast.success('Notes saved');
  }, [noteText, setNotes]);
  
  const handleCheckout = useCallback(async (paymentMethod: PaymentMethod) => {
    if (cartItems.length === 0 || !store?.id) return;
    setIsProcessing(true);
    try {
      const { data: saleData, error } = await supabase.from('sales').insert({
        store_id: store.id, customer_id: selectedCustomer?.id || null, cashier_id: user?.id || null,
        subtotal, tax, discount: totalDiscount, total, payment_method: paymentMethod,
        payment_status: 'paid', status: 'completed', items_count: itemCount,
        notes: cartNotes || null, fulfillment_type: fulfillmentType,
      } as never).select().single();
      if (error) throw error;
      const sale = saleData as unknown as Sale;
      
      const saleItems = cartItems.map(item => ({
        sale_id: sale.id, product_id: item.product.id, variant_id: item.variant?.id || null,
        quantity: item.quantity, unit_price: item.unitPrice, discount: item.discount, total: item.total,
      }));
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems as never);
      if (itemsError) throw itemsError;
      
      for (const item of cartItems) {
        if (item.product.track_inventory) {
          await supabase.rpc('decrement_stock', { p_product_id: item.product.id, p_quantity: item.quantity });
        }
      }
      
      setCurrentSale(sale);
      clearCart();
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    } catch (error: any) {
      logger.error('Checkout error:', error);
      toast.error('Failed to complete sale', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  }, [cartItems, store?.id, user?.id, selectedCustomer, subtotal, tax, totalDiscount, total, itemCount, cartNotes, fulfillmentType, clearCart, queryClient]);
  
  const handlePrintReceipt = useCallback(() => {
    if (!currentSale) return;
    toast.info('Receipt printing coming soon');
  }, [currentSale]);
  
  const handleSendWhatsApp = useCallback(() => {
    if (!currentSale || !selectedCustomer?.phone) {
      toast.error('No phone number available');
      return;
    }
    toast.info('WhatsApp receipt coming soon');
  }, [currentSale, selectedCustomer]);
  
  const getCartItemQuantity = useCallback((productId: string) => {
    const item = cartItems.find(i => i.product.id === productId);
    return item?.quantity || 0;
  }, [cartItems]);

  return (
    <>
      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex h-screen flex-col bg-gray-100 overflow-hidden">
        <div className={cn('h-1', brandBg)} />
        
        {/* Header */}
        <header className="h-14 bg-gray-900 text-white px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Exit POS</span>
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', brandBg)}>
                <Store className={cn('w-4 h-4', brandText)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{store?.name}</p>
                <p className="text-xs text-white/60">{user?.full_name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {heldSales.length > 0 && (
              <button onClick={() => setIsHeldSalesModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600">
                <Pause className="w-4 h-4" />
                {heldSales.length} Held
              </button>
            )}
            <div className="flex items-center bg-white/10 rounded-lg p-1">
              {FULFILLMENT_OPTIONS.map(opt => (
                <button key={opt.type} onClick={() => setFulfillmentType(opt.type)}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    fulfillmentType === opt.type ? cn(brandBg, brandText) : 'text-white/70 hover:text-white hover:bg-white/10')}>
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-white/60">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Products Panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Search & Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input ref={searchInputRef} type="text" placeholder="Search products... Ctrl+K"
                    className={cn('w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent', brandRing)}
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button className="h-11 w-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <Scan className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={cn('p-2.5 transition-colors', viewMode === 'grid' ? cn(brandBg, brandText) : 'bg-white text-gray-500 hover:bg-gray-50')}>
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={cn('p-2.5 transition-colors', viewMode === 'list' ? cn(brandBg, brandText) : 'bg-white text-gray-500 hover:bg-gray-50')}>
                    <LayoutList className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button onClick={() => setSelectedCategory(null)}
                  className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all', selectedCategory === null ? cn(brandBg, brandText) : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  All Items
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                    className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all', selectedCategory === cat.id ? cn(brandBg, brandText) : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {productsLoading ? (
                <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3' : 'space-y-2')}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={cn('animate-pulse', viewMode === 'grid' ? 'bg-gray-100 rounded-xl p-3' : 'bg-gray-100 rounded-xl p-4 flex gap-3')}>
                      <div className={viewMode === 'grid' ? 'aspect-square bg-gray-200 rounded-lg mb-3' : 'w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0'} />
                      <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {products.map(product => {
                      const qty = getCartItemQuantity(product.id);
                      const outOfStock = product.track_inventory && (product.stock_quantity || 0) <= 0;
                      return (
                        <button key={product.id} onClick={() => !outOfStock && handleProductAdd(product)} disabled={outOfStock}
                          className={cn('relative bg-white border rounded-xl p-3 text-left transition-all hover:shadow-md hover:border-gray-300', qty > 0 && `ring-2 ${brandRing}`, outOfStock && 'opacity-50 cursor-not-allowed')}>
                          {qty > 0 && <div className={cn('absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10', brandBg, brandText)}>{qty}</div>}
                          {outOfStock && <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">Out</div>}
                          <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-10 h-10 text-gray-300" />}
                          </div>
                          <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                          <p className="text-xs text-gray-500 truncate mb-1">{product.sku}</p>
                          <p className={cn('text-base font-bold', isNigeria ? 'text-green-700' : 'text-yellow-700')}>{formatCurrency(product.selling_price, country)}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map(product => {
                      const qty = getCartItemQuantity(product.id);
                      const outOfStock = product.track_inventory && (product.stock_quantity || 0) <= 0;
                      return (
                        <button key={product.id} onClick={() => !outOfStock && handleProductAdd(product)} disabled={outOfStock}
                          className={cn('w-full flex items-center gap-4 p-3 bg-white border rounded-xl text-left transition-all hover:shadow-sm hover:border-gray-300', qty > 0 && `ring-2 ${brandRing}`, outOfStock && 'opacity-50 cursor-not-allowed')}>
                          <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className={cn('font-bold', isNigeria ? 'text-green-700' : 'text-yellow-700')}>{formatCurrency(product.selling_price, country)}</p>
                            {qty > 0 && <p className="text-xs font-medium text-gray-500">×{qty} in cart</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{searchQuery ? 'No products found' : 'No products'}</h3>
                    <p className="text-sm text-gray-500">{searchQuery ? 'Try a different search term' : 'Add products in the Products section'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Cart Panel */}
          <div className="w-[420px] flex flex-col bg-white border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Current Order</h2>
                <div className="flex items-center gap-2">
                  {cartItems.length > 0 && (
                    <>
                      <button onClick={holdSale} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Hold sale (Ctrl+H)">
                        <Pause className="w-5 h-5" />
                      </button>
                      <button onClick={clearCart} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Clear cart">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Customer Selection */}
              <button onClick={() => setIsCustomerModalOpen(true)} className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', selectedCustomer ? brandBg : 'bg-gray-200')}>
                  {selectedCustomer ? <span className={cn('text-sm font-bold', brandText)}>{selectedCustomer.name?.charAt(0).toUpperCase()}</span> : <User className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{selectedCustomer?.name || 'Walk-in Customer'}</p>
                  <p className="text-xs text-gray-500">{selectedCustomer?.phone || 'Tap to select customer (Ctrl+C)'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-8">
                    <Receipt className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Cart is empty</p>
                    <p className="text-sm text-gray-400">Tap products to add them</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                        {item.product.image_url ? <img src={item.product.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice, country)} each</p>
                        {item.discount > 0 && <p className="text-xs text-green-600 font-medium">-{formatCurrency(item.discount, country)} discount</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openItemDiscount(item)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors" title="Apply discount">
                            <Tag className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-bold text-gray-900">{formatCurrency(item.total, country)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cart Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setIsDiscountModalOpen(true)} disabled={cartItems.length === 0} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <Percent className="w-4 h-4" />
                  Discount
                </button>
                <button onClick={() => { setNoteText(cartNotes); setIsNotesModalOpen(true); }} disabled={cartItems.length === 0} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Notes
                </button>
                <button onClick={() => setIsPromoCodeModalOpen(true)} disabled={cartItems.length === 0} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <Gift className="w-4 h-4" />
                  Promo
                </button>
              </div>
              
              {/* Totals */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal, country)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(totalDiscount, country)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{formatCurrency(tax, country)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className={isNigeria ? 'text-green-700' : 'text-yellow-700'}>{formatCurrency(total, country)}</span>
                </div>
              </div>
              
              {/* Checkout Button */}
              <button onClick={() => setIsPaymentModalOpen(true)} disabled={cartItems.length === 0}
                className={cn('w-full h-14 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed', brandBg, brandBgHover, brandText)}>
                <CreditCard className="w-6 h-6" />
                Pay {formatCurrency(total, country)}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Press Ctrl+P for quick payment</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* MOBILE LAYOUT */}
      <div className="lg:hidden min-h-screen flex flex-col bg-gray-50">
        {/* Mobile Header */}
        <header className={cn('sticky top-0 z-40 px-4 pt-safe pb-3', brandBg)}>
          <div className="flex items-center justify-between mb-3 pt-2">
            <Link to="/dashboard" className={cn('p-2 rounded-xl bg-black/10 active:scale-95 transition-transform', brandText)}>
              <Home className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-1.5">
              <Store className={cn('w-4 h-4', brandText)} />
              <span className={cn('text-sm font-semibold truncate max-w-[140px]', brandText)}>{store?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {heldSales.length > 0 && (
                <button onClick={() => setIsHeldSalesModalOpen(true)} className="relative p-2 rounded-xl bg-amber-500 text-white active:scale-95 transition-transform">
                  <Pause className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{heldSales.length}</span>
                </button>
              )}
              <button className={cn('p-2 rounded-xl bg-black/10 active:scale-95 transition-transform', brandText)}>
                <Scan className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-60', brandText)} />
            <input type="text" placeholder="Search products..."
              className={cn('w-full h-11 pl-11 pr-4 rounded-xl text-sm font-medium bg-white/20 placeholder:text-current placeholder:opacity-60 focus:outline-none focus:bg-white/30', brandText)}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={cn('absolute right-3 top-1/2 -translate-y-1/2 opacity-60', brandText)}>
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>
        
        {/* Fulfillment Toggle */}
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {FULFILLMENT_OPTIONS.map(opt => (
              <button key={opt.type} onClick={() => setFulfillmentType(opt.type)}
                className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                  fulfillmentType === opt.type ? cn(brandBg, brandText, 'shadow-sm') : 'text-gray-500')}>
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Categories */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            <button onClick={() => setSelectedCategory(null)}
              className={cn('px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95',
                selectedCategory === null ? cn(brandBg, brandText, 'shadow-lg') : 'bg-gray-100 text-gray-600')}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={cn('px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95',
                  selectedCategory === cat.id ? cn(brandBg, brandText, 'shadow-lg') : 'bg-gray-100 text-gray-600')}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Products */}
        <div className="flex-1 overflow-y-auto p-3 pb-28">
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 animate-pulse shadow-sm">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => {
                const qty = getCartItemQuantity(product.id);
                const outOfStock = product.track_inventory && (product.stock_quantity || 0) <= 0;
                return (
                  <button key={product.id} onClick={() => !outOfStock && handleProductAdd(product)} disabled={outOfStock}
                    className={cn('relative bg-white rounded-2xl p-3 text-left shadow-sm transition-all active:scale-[0.97]', qty > 0 && `ring-2 ${brandRing}`, outOfStock && 'opacity-50')}>
                    {qty > 0 && <div className={cn('absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 shadow-lg', brandBg, brandText)}>{qty}</div>}
                    <div className={cn('aspect-square rounded-xl mb-3 flex items-center justify-center overflow-hidden', isNigeria ? 'bg-green-50' : 'bg-yellow-50')}>
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" /> : <Package className={cn('w-10 h-10', isNigeria ? 'text-green-200' : 'text-yellow-300')} />}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className={cn('font-bold', isNigeria ? 'text-green-700' : 'text-yellow-700')}>{formatCurrency(product.selling_price, country)}</span>
                      {product.track_inventory && (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', (product.stock_quantity || 0) <= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500')}>
                          {product.stock_quantity || 0}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-12">
                <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4', isNigeria ? 'bg-green-100' : 'bg-yellow-100')}>
                  <ShoppingCart className={cn('w-10 h-10', isNigeria ? 'text-green-300' : 'text-yellow-400')} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-lg">{searchQuery ? 'No products found' : 'No products'}</h3>
                <p className="text-sm text-gray-500">{searchQuery ? 'Try a different search' : 'Add products to get started'}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile Cart Bar */}
        {cartItems.length > 0 && !mobileCartOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-safe bg-white/95 backdrop-blur-xl border-t border-gray-200">
            <button onClick={() => setMobileCartOpen(true)}
              className={cn('w-full flex items-center gap-4 p-4 rounded-2xl shadow-lg active:scale-[0.98] transition-transform bg-gradient-to-r',
                isNigeria ? 'from-green-600 via-green-700 to-green-800' : 'from-yellow-500 via-yellow-600 to-yellow-700')}>
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-white" />
                <span className={cn('absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold', isNigeria ? 'bg-white text-green-700' : 'bg-black text-yellow-500')}>
                  {itemCount}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white/70 text-xs font-medium">View Cart</p>
                <p className="text-white font-semibold">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xl font-bold">{formatCurrency(total, country)}</span>
                <ChevronUp className="w-5 h-5 text-white" />
              </div>
            </button>
          </div>
        )}
        
        {/* Mobile Cart Sheet */}
        {mobileCartOpen && (
          <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileCartOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slideUp">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
              
              <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Current Order</h2>
                  <p className="text-sm text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {cartItems.length > 0 && (
                    <>
                      <button onClick={holdSale} className="p-2.5 text-amber-600 bg-amber-50 rounded-xl active:scale-95 transition-transform">
                        <Pause className="w-5 h-5" />
                      </button>
                      <button onClick={clearCart} className="p-2.5 text-red-600 bg-red-50 rounded-xl active:scale-95 transition-transform">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setMobileCartOpen(false)} className="p-2.5 text-gray-500 bg-gray-100 rounded-xl active:scale-95 transition-transform">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Customer */}
              <button onClick={() => { setMobileCartOpen(false); setIsCustomerModalOpen(true); }}
                className="mx-4 mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', selectedCustomer ? brandBg : 'bg-gray-200')}>
                  {selectedCustomer ? <span className={cn('text-sm font-bold', brandText)}>{selectedCustomer.name?.charAt(0).toUpperCase()}</span> : <User className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">{selectedCustomer?.name || 'Walk-in Customer'}</p>
                  {selectedCustomer?.phone && <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              
              {/* Items */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden', isNigeria ? 'bg-green-50' : 'bg-yellow-50')}>
                      {item.product.image_url ? <img src={item.product.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" /> : <Package className={cn('w-6 h-6', isNigeria ? 'text-green-200' : 'text-yellow-300')} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                      <p className={cn('text-sm font-bold', isNigeria ? 'text-green-700' : 'text-yellow-700')}>{formatCurrency(item.total, country)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center active:scale-95">
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className={cn('w-8 h-8 rounded-lg flex items-center justify-center active:scale-95', brandBg)}>
                        <Plus className={cn('w-4 h-4', brandText)} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              <div className="px-4 pt-3 pb-safe border-t border-gray-200 bg-gray-50/80">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(subtotal, country)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(totalDiscount, country)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className={cn('text-xl font-bold', isNigeria ? 'text-green-700' : 'text-yellow-700')}>{formatCurrency(total, country)}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={() => { setMobileCartOpen(false); setIsDiscountModalOpen(true); }}
                    className="flex-1 h-12 px-4 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <Percent className="w-4 h-4" />
                    Discount
                  </button>
                  <button onClick={() => { setMobileCartOpen(false); setIsPaymentModalOpen(true); }}
                    className={cn('flex-[2] h-12 px-4 rounded-xl text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg', brandBg, brandText)}>
                    <CreditCard className="w-5 h-5" />
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* MODALS */}
      
      {/* Customer Modal */}
      <Modal open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen} title="Select Customer">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or phone..."
              className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
          </div>
          
          <button onClick={() => { setCustomer(null); setIsCustomerModalOpen(false); }}
            className={cn('w-full flex items-center gap-3 p-3 rounded-xl transition-colors', !selectedCustomer ? cn(brandBg, brandText) : 'bg-gray-50 hover:bg-gray-100')}>
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', !selectedCustomer ? 'bg-white/20' : 'bg-gray-200')}>
              <User className={cn('w-5 h-5', !selectedCustomer ? brandText : 'text-gray-400')} />
            </div>
            <div className="text-left">
              <p className="font-medium">Walk-in Customer</p>
              <p className={cn('text-sm', !selectedCustomer ? 'opacity-70' : 'text-gray-500')}>No customer record</p>
            </div>
            {!selectedCustomer && <Check className="w-5 h-5 ml-auto" />}
          </button>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {customers.map(customer => (
              <button key={customer.id} onClick={() => { setCustomer(customer); setIsCustomerModalOpen(false); }}
                className={cn('w-full flex items-center gap-3 p-3 rounded-xl transition-colors', selectedCustomer?.id === customer.id ? cn(brandBg, brandText) : 'bg-gray-50 hover:bg-gray-100')}>
                <Avatar name={customer.name || ''} size="sm" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{customer.name}</p>
                  <p className={cn('text-sm', selectedCustomer?.id === customer.id ? 'opacity-70' : 'text-gray-500')}>{customer.phone}</p>
                </div>
                {selectedCustomer?.id === customer.id && <Check className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </div>
      </Modal>
      
      {/* Payment Modal */}
      <Modal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} title="Complete Payment">
        <div className="space-y-6">
          <div className={cn('p-4 rounded-xl text-center', isNigeria ? 'bg-green-50' : 'bg-yellow-50')}>
            <p className="text-sm text-gray-500 mb-1">Amount Due</p>
            <p className={cn('text-3xl font-bold', isNigeria ? 'text-green-700' : 'text-yellow-700')}>{formatCurrency(total, country)}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Pay</p>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.method} onClick={() => handleCheckout(pm.method)} disabled={isProcessing}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', pm.color)}>{pm.icon}</div>
                  <span className="font-medium text-gray-900">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Processing payment...</span>
            </div>
          )}
        </div>
      </Modal>
      
      {/* Discount Modal */}
      <Modal open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen} title="Apply Discount">
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button onClick={() => setDiscountType('fixed')}
              className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium transition-all', discountType === 'fixed' ? cn(brandBg, brandText) : 'text-gray-600')}>
              Fixed Amount
            </button>
            <button onClick={() => setDiscountType('percentage')}
              className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium transition-all', discountType === 'percentage' ? cn(brandBg, brandText) : 'text-gray-600')}>
              Percentage
            </button>
          </div>
          
          <div className="relative">
            <input type="number" placeholder="0"
              className="w-full h-16 px-4 text-3xl font-bold text-center border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
              value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-medium text-gray-400">
              {discountType === 'fixed' ? (country === 'GH' ? 'GHS' : '₦') : '%'}
            </span>
          </div>
          
          <button onClick={applyCartDiscount} className={cn('w-full h-12 rounded-xl font-semibold transition-all', brandBg, brandBgHover, brandText)}>
            Apply Discount
          </button>
        </div>
      </Modal>
      
      {/* Item Discount Modal */}
      <Modal open={isItemDiscountModalOpen} onOpenChange={setIsItemDiscountModalOpen} title={`Discount for ${selectedItemForDiscount?.name || 'Item'}`}>
        <div className="space-y-4">
          <div className="relative">
            <input type="number" placeholder="0"
              className="w-full h-14 px-4 text-2xl font-bold text-center border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
              value={itemDiscountValue} onChange={e => setItemDiscountValue(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-400">
              {country === 'GH' ? 'GHS' : '₦'}
            </span>
          </div>
          <button onClick={applyItemDiscount} className={cn('w-full h-12 rounded-xl font-semibold transition-all', brandBg, brandBgHover, brandText)}>
            Apply Item Discount
          </button>
        </div>
      </Modal>
      
      {/* Held Sales Modal */}
      <Modal open={isHeldSalesModalOpen} onOpenChange={setIsHeldSalesModalOpen} title="Held Sales">
        <div className="space-y-3">
          {heldSales.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No held sales</p>
            </div>
          ) : (
            heldSales.map(held => (
              <button key={held.id} onClick={() => resumeSale(held)}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{held.customer?.name || 'Walk-in'} - {held.items.length} items</p>
                  <p className="text-sm text-gray-500">{new Date(held.timestamp).toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(held.items.reduce((sum, i) => sum + i.total, 0), country)}</p>
                  <Play className="w-4 h-4 text-green-600 ml-auto" />
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
      
      {/* Promo Code Modal */}
      <Modal open={isPromoCodeModalOpen} onOpenChange={setIsPromoCodeModalOpen} title="Apply Promo Code">
        <div className="space-y-4">
          <input type="text" placeholder="Enter promo code"
            className="w-full h-12 px-4 border border-gray-200 rounded-xl text-center text-lg font-medium uppercase focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} />
          <button onClick={() => { toast.info('Promo code validation coming soon'); setIsPromoCodeModalOpen(false); }}
            className={cn('w-full h-12 rounded-xl font-semibold transition-all', brandBg, brandBgHover, brandText)}>
            Apply Code
          </button>
        </div>
      </Modal>
      
      {/* Notes Modal */}
      <Modal open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen} title="Order Notes">
        <div className="space-y-4">
          <textarea placeholder="Add notes for this order..."
            className="w-full h-32 p-4 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={noteText} onChange={e => setNoteText(e.target.value)} />
          <button onClick={saveNotes} className={cn('w-full h-12 rounded-xl font-semibold transition-all', brandBg, brandBgHover, brandText)}>
            Save Notes
          </button>
        </div>
      </Modal>
      
      {/* Success Modal */}
      <Modal open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen} title="">
        <div className="text-center py-4">
          <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4', brandBg)}>
            <Check className={cn('w-10 h-10', brandText)} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Complete!</h2>
          <p className="text-gray-500 mb-6">Order #{currentSale?.sale_number || currentSale?.id?.slice(-8)}</p>
          
          <div className={cn('p-4 rounded-xl mb-6', isNigeria ? 'bg-green-50' : 'bg-yellow-50')}>
            <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
            <p className={cn('text-3xl font-bold', isNigeria ? 'text-green-700' : 'text-yellow-700')}>
              {currentSale && formatCurrency(currentSale.total, country)}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handlePrintReceipt}
              className="flex-1 h-12 px-4 border border-gray-200 rounded-xl font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" />
              Print
            </button>
            <button onClick={handleSendWhatsApp}
              className="flex-1 h-12 px-4 border border-gray-200 rounded-xl font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5" />
              WhatsApp
            </button>
          </div>
          
          <button onClick={() => { setIsSuccessModalOpen(false); setCurrentSale(null); }}
            className={cn('w-full h-12 mt-3 rounded-xl font-semibold transition-all', brandBg, brandBgHover, brandText)}>
            New Sale
          </button>
        </div>
      </Modal>
      
      {/* Styles */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
        .pt-safe { padding-top: env(safe-area-inset-top); }
      `}</style>
    </>
  );
}

export default POSPage;
