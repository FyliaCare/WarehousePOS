import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Loader2,
  Grid3X3,
  LayoutList,
  Percent,
  ChevronRight,
  Check,
  Printer,
  ArrowLeft,
  Pause,
  Play,
  Receipt,
  Building2,
} from 'lucide-react';
import { Modal, Avatar } from '@warehousepos/ui';
import { formatCurrency, cn } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import type { Product, Customer, PaymentMethod, CountryCode, Sale } from '@warehousepos/types';

// Types
interface HeldSale {
  id: string;
  items: CartItem[];
  customer: Customer | null;
  timestamp: Date;
  note?: string;
}

// Product Card Component
function ProductCard({ 
  product, 
  onAdd, 
  country,
  viewMode 
}: { 
  product: Product; 
  onAdd: () => void;
  country: CountryCode;
  viewMode: 'grid' | 'list';
}) {
  if (viewMode === 'list') {
    return (
      <button
        onClick={onAdd}
        className="w-full flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs font-medium">IMG</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.sku}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatCurrency(product.selling_price || product.price || 0, country)}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onAdd}
      className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="aspect-square bg-gray-50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-300 text-xs font-medium">No Image</span>
        )}
      </div>
      <h3 className="font-medium text-gray-900 text-sm truncate mb-0.5">{product.name}</h3>
      <p className="text-xs text-gray-500 mb-1">{product.sku}</p>
      <p className="font-semibold text-gray-900">
        {formatCurrency(product.selling_price || product.price || 0, country)}
      </p>
    </button>
  );
}

// Cart Item Component
function CartItemRow({ 
  item, 
  country, 
  onUpdateQuantity, 
  onRemove,
}: { 
  item: CartItem; 
  country: CountryCode;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
        <p className="text-xs text-gray-500">
          {formatCurrency(item.unitPrice, country)} × {item.quantity}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(item.quantity - 1)}
          className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <Minus className="w-3 h-3 text-gray-600" />
        </button>
        <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <Plus className="w-3 h-3 text-gray-600" />
        </button>
      </div>

      <div className="w-20 text-right">
        <p className="font-medium text-gray-900 text-sm">
          {formatCurrency(item.total, country)}
        </p>
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Main POS Layout
export function POSLayout() {
  const queryClient = useQueryClient();
  const { tenant, store, user } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  
  // Country-based theming - Ghana (Gold) vs Nigeria (Green)
  const isNigeria = country === 'NG';
  const brandBg = isNigeria ? 'bg-[#008751]' : 'bg-[#FFD000]';
  const brandBgHover = isNigeria ? 'hover:bg-[#006b41]' : 'hover:bg-[#E6BB00]';
  const brandText = isNigeria ? 'text-white' : 'text-black';
  const brandAccent = isNigeria ? '#008751' : '#FFD000';
  
  // Cart state
  const {
    items: cartItems,
    customer: selectedCustomer,
    subtotal,
    totalDiscount,
    tax,
    total,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    setCustomer,
    setDiscount,
    clearCart,
  } = useCartStore();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === 'Enter' && cartItems.length > 0) {
        e.preventDefault();
        setIsPaymentModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
        setIsCustomerModalOpen(false);
        setIsDiscountModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length]);

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
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', store?.id, selectedCategory, searchQuery],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('products')
        .select('*, category:categories(name), variants:product_variants(*), stock_levels(quantity)')
        .eq('store_id', store.id)
        .eq('is_active', true);
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%`);
      }
      
      const { data } = await query.order('name').limit(100);
      // Map price to selling_price and stock_levels to stock_quantity for compatibility
      return ((data || []) as any[]).map(p => ({
        ...p,
        selling_price: p.price,
        stock_quantity: p.stock_levels?.[0]?.quantity || 0,
      })) as unknown as Product[];
    },
    enabled: !!store?.id,
  });

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers', store?.id, customerSearch],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('customers')
        .select('*')
        .eq('store_id', store.id);
      
      if (customerSearch) {
        query = query.or(`name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`);
      }
      
      const { data } = await query.order('name').limit(20);
      return (data as unknown as Customer[]) || [];
    },
    enabled: !!store?.id,
  });

  // Handle product add
  const handleProductAdd = useCallback((product: Product) => {
    addItem(product);
  }, [addItem]);

  // Hold current sale
  const holdSale = () => {
    if (cartItems.length === 0) return;
    
    const held: HeldSale = {
      id: Date.now().toString(),
      items: [...cartItems],
      customer: selectedCustomer,
      timestamp: new Date(),
    };
    
    setHeldSales([...heldSales, held]);
    clearCart();
    toast.success('Sale held');
  };

  // Resume held sale
  const resumeSale = (held: HeldSale) => {
    if (cartItems.length > 0) {
      holdSale();
    }
    
    held.items.forEach(item => {
      addItem(item.product, item.variant, item.quantity);
    });
    
    if (held.customer) {
      setCustomer(held.customer);
    }
    
    setHeldSales(heldSales.filter(h => h.id !== held.id));
    toast.success('Sale resumed');
  };

  // Apply cart discount
  const applyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value < 0) {
      toast.error('Invalid discount value');
      return;
    }
    
    setDiscount(value, discountType);
    setIsDiscountModalOpen(false);
    setDiscountValue('');
    toast.success('Discount applied');
  };

  // Handle checkout
  const handleCheckout = async (paymentMethod: PaymentMethod) => {
    if (cartItems.length === 0 || !store?.id) return;
    
    setIsProcessing(true);
    
    try {
      const { data: saleData, error } = await supabase
        .from('sales')
        .insert({
          store_id: store.id,
          customer_id: selectedCustomer?.id || null,
          cashier_id: user?.id || null,
          subtotal,
          tax,
          discount: totalDiscount,
          total,
          payment_method: paymentMethod,
          payment_status: 'paid',
          status: 'completed',
          items_count: itemCount,
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      const sale = saleData as unknown as Sale;
      
      const saleItems = cartItems.map((item) => ({
        sale_id: sale.id,
        product_id: item.product.id,
        variant_id: item.variant?.id || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        total: item.total,
      }));
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems as never);
      
      if (itemsError) throw itemsError;
      
      setCurrentSale(sale);
      clearCart();
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
      
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
      
    } catch (error: any) {
      logger.error('Checkout error:', error);
      toast.error('Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Brand Color Top Bar */}
      <div className={cn('h-1', brandBg)} />
      
      {/* Top Header */}
      <header className="h-14 bg-black text-white px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Exit POS</span>
          </Link>
          
          <div className="h-6 w-px bg-white/20" />
          
          <div className="flex items-center gap-2">
            <div className={cn('w-6 h-6 rounded flex items-center justify-center', brandBg)}>
              <Building2 className={cn('w-3.5 h-3.5', brandText)} />
            </div>
            <span className="text-sm font-medium text-white">{store?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {heldSales.length > 0 && (
            <button
              onClick={() => resumeSale(heldSales[0])}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                brandBg, brandBgHover, brandText
              )}
            >
              <Play className="w-3.5 h-3.5" />
              {heldSales.length} Held
            </button>
          )}

          <div className="text-right">
            <p className="text-sm font-medium text-white">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-white/60">
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>

          <div className="h-6 w-px bg-white/20" />

          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', brandBg)}>
              <span className={cn('text-xs font-medium', brandText)}>
                {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <span className="text-sm font-medium text-white">{user?.full_name?.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search & Filters */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products or scan barcode..."
                  className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': brandAccent } as React.CSSProperties}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2.5 transition-colors',
                    viewMode === 'grid' ? cn(brandBg, brandText) : 'bg-white text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2.5 transition-colors',
                    viewMode === 'list' ? cn(brandBg, brandText) : 'bg-white text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                  selectedCategory === null
                    ? cn(brandBg, brandText)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                All Items
              </button>
              {categories?.map((category: any) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                    selectedCategory === category.id
                      ? cn(brandBg, brandText)
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid/List */}
          <div className="flex-1 overflow-y-auto p-4">
            {productsLoading ? (
              <div className={cn(
                'gap-3',
                viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' : 'flex flex-col bg-white rounded-lg overflow-hidden'
              )}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={cn(
                    'animate-pulse',
                    viewMode === 'grid' ? 'bg-white rounded-lg p-3' : 'p-4 border-b border-gray-100'
                  )}>
                    <div className={cn(
                      'bg-gray-200 rounded',
                      viewMode === 'grid' ? 'aspect-square mb-2' : 'w-12 h-12'
                    )} />
                    {viewMode === 'grid' && (
                      <>
                        <div className="h-4 bg-gray-200 rounded mb-1" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3' 
                  : 'bg-white rounded-lg overflow-hidden border border-gray-200'
              )}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => handleProductAdd(product)}
                    country={country}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {searchQuery ? 'No products found' : 'No products'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'Try a different search' : 'Add products to start selling'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 flex flex-col bg-white border-l border-gray-200">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Current Order</h2>
              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <>
                    <button
                      onClick={holdSale}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title="Hold order"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearCart}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Clear order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Customer Selection */}
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="w-full flex items-center gap-3 p-2.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">
                  {selectedCustomer?.name || 'Walk-in Customer'}
                </p>
                {selectedCustomer?.phone && (
                  <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No items in order</p>
                </div>
              </div>
            ) : (
              <div className="py-2">
                {cartItems.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    country={country}
                    onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Cart Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {/* Totals */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(subtotal, country)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(totalDiscount, country)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">{formatCurrency(tax, country)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(total, country)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsDiscountModalOpen(true)}
                disabled={cartItems.length === 0}
                className="flex-1 h-11 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Percent className="w-4 h-4" />
                Discount
              </button>
              
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={cartItems.length === 0}
                className={cn(
                  'flex-[2] h-11 px-4 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2',
                  brandBg, brandBgHover, brandText
                )}
              >
                <CreditCard className="w-4 h-4" />
                Pay {formatCurrency(total, country)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      <Modal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        title="Select Customer"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => {
              setCustomer(null);
              setIsCustomerModalOpen(false);
            }}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Walk-in Customer</p>
              <p className="text-sm text-gray-500">No customer record</p>
            </div>
          </button>
          
          <div className="max-h-64 overflow-y-auto space-y-1">
            {customers?.map((customer: Customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  setCustomer(customer);
                  setIsCustomerModalOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-md transition-colors',
                  selectedCustomer?.id === customer.id
                    ? cn(brandBg, brandText)
                    : 'hover:bg-gray-50'
                )}
              >
                <Avatar name={customer.name || ''} size="sm" />
                <div className="text-left flex-1">
                  <p className={cn('font-medium', selectedCustomer?.id === customer.id ? (isNigeria ? 'text-white' : 'text-black') : 'text-gray-900')}>
                    {customer.name}
                  </p>
                  <p className={cn('text-sm', selectedCustomer?.id === customer.id ? (isNigeria ? 'text-white/70' : 'text-black/70') : 'text-gray-500')}>
                    {customer.phone}
                  </p>
                </div>
                {selectedCustomer?.id === customer.id && (
                  <Check className="w-5 h-5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        title="Complete Payment"
      >
        <div className="space-y-6">
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Amount Due</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(total, country)}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCheckout('cash')}
                disabled={isProcessing}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Cash</span>
              </button>
              
              <button
                onClick={() => handleCheckout('card')}
                disabled={isProcessing}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Card</span>
              </button>
              
              <button
                onClick={() => handleCheckout('momo')}
                disabled={isProcessing}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-900">Mobile Money</span>
              </button>
              
              <button
                onClick={() => handleCheckout('transfer')}
                disabled={isProcessing}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">Bank Transfer</span>
              </button>
            </div>
          </div>
          
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Processing...</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Discount Modal */}
      <Modal
        open={isDiscountModalOpen}
        onOpenChange={setIsDiscountModalOpen}
        title="Apply Discount"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDiscountType('fixed')}
              className={cn(
                'flex-1 py-2.5 rounded-md text-sm font-medium transition-colors',
                discountType === 'fixed'
                  ? cn(brandBg, brandText)
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Fixed Amount
            </button>
            <button
              onClick={() => setDiscountType('percentage')}
              className={cn(
                'flex-1 py-2.5 rounded-md text-sm font-medium transition-colors',
                discountType === 'percentage'
                  ? cn(brandBg, brandText)
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Percentage
            </button>
          </div>
          
          <div className="relative">
            <input
              type="number"
              placeholder="0"
              className="w-full h-14 px-4 text-2xl font-semibold text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              {discountType === 'fixed' ? (country === 'GH' ? 'GHS' : 'NGN') : '%'}
            </span>
          </div>
          
          <button
            onClick={applyDiscount}
            className={cn('w-full h-11 rounded-md font-medium transition-colors', brandBg, brandBgHover, brandText)}
          >
            Apply Discount
          </button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
        title=""
      >
        <div className="text-center py-4">
          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', brandBg)}>
            <Check className={cn('w-8 h-8', brandText)} />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Payment Complete</h2>
          <p className="text-gray-500 mb-6">
            Order #{currentSale?.sale_number || currentSale?.id?.slice(-6)}
          </p>
          
          <div className={cn('p-4 rounded-lg mb-6', isNigeria ? 'bg-[#008751]/10' : 'bg-[#FFD000]/10')}>
            <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
            <p className="text-2xl font-bold text-gray-900">
              {currentSale && formatCurrency(currentSale.total, country)}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => toast.info('Printing receipt...')}
              className="flex-1 h-11 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={() => {
                setIsSuccessModalOpen(false);
                setCurrentSale(null);
              }}
              className={cn('flex-1 h-11 px-4 rounded-md text-sm font-medium transition-colors', brandBg, brandBgHover, brandText)}
            >
              New Order
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default POSLayout;
