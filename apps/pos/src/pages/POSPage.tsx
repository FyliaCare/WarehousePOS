import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShoppingCart,
  Minus,
  Plus,
  User,
  CreditCard,
  Banknote,
  X,
  Loader2,
  ChevronUp,
  Bookmark,
  Filter,
  QrCode,
} from 'lucide-react';
import { Modal, Avatar } from '@warehousepos/ui';
import { formatCurrency, cn } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product, Customer, PaymentMethod, CountryCode, Sale } from '@warehousepos/types';

// ============================================
// MAIN COMPONENT
// ============================================

export function POSPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  
  // Cart store
  const {
    items: cartItems,
    customer: selectedCustomer,
    subtotal,
    totalDiscount,
    total,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    setCustomer,
    clearCart,
  } = useCartStore();
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  
  // Mobile-specific state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

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
    queryKey: ['products', store?.id, selectedCategory, searchQuery],
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
      
      const { data } = await query.order('name').limit(50);
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

  // Handle product click
  const handleProductClick = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    if (!store?.id) {
      toast.error('Store not found');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { data: saleData, error } = await supabase
        .from('sales')
        .insert({
          store_id: store.id,
          customer_id: selectedCustomer?.id || null,
          subtotal,
          tax: calculatedTax,
          discount: totalDiscount,
          total: total + calculatedTax,
          payment_method: selectedPaymentMethod,
          payment_status: 'paid',
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
      
      clearCart();
      setMobileCartOpen(false);
      
      toast.success('Sale completed successfully!', {
        description: `Receipt #${sale.sale_number || sale.id.slice(-6)}`,
      });
      
    } catch (error: any) {
      toast.error('Failed to complete sale', {
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate discount percentage
  const getDiscountBadge = (product: any) => {
    if (product.compare_at_price && product.compare_at_price > product.selling_price) {
      const discount = Math.round((1 - product.selling_price / product.compare_at_price) * 100);
      return discount > 0 ? `${discount}% Off` : null;
    }
    return null;
  };

  // Tax rate (10%)
  const TAX_RATE = 0.10;
  const calculatedTax = subtotal * TAX_RATE;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-6">
      {/* ============================================= */}
      {/* LEFT SIDE - Categories & Products */}
      {/* ============================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Category</h2>
            <button className="text-sm text-violet-600 font-medium hover:text-violet-700">See All</button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {/* All Category */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'flex flex-col items-center gap-2 px-5 py-3 rounded-2xl min-w-[90px] transition-all border-2',
                selectedCategory === null
                  ? 'bg-violet-100 border-violet-500'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-xl',
                selectedCategory === null ? 'bg-violet-200' : 'bg-slate-100'
              )}>
                🍽️
              </div>
              <span className={cn(
                'text-xs font-semibold',
                selectedCategory === null ? 'text-violet-700' : 'text-slate-600'
              )}>All</span>
            </button>
            
            {categories?.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex flex-col items-center gap-2 px-5 py-3 rounded-2xl min-w-[90px] transition-all border-2',
                  selectedCategory === category.id
                    ? 'bg-violet-100 border-violet-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-xl',
                  selectedCategory === category.id ? 'bg-violet-200' : 'bg-slate-100'
                )}>
                  {category.icon || '🍴'}
                </div>
                <span className={cn(
                  'text-xs font-semibold',
                  selectedCategory === category.id ? 'text-violet-700' : 'text-slate-600'
                )}>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Select Menu Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Select Menu</h2>
          <button className="flex items-center gap-2 text-sm text-slate-500 font-medium hover:text-slate-700">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        
        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-24 lg:pb-4">
          {productsLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse shadow-sm border border-slate-100">
                  <div className="aspect-[4/3] bg-slate-100 rounded-xl mb-3" />
                  <div className="h-4 bg-slate-100 rounded mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3 mb-3" />
                  <div className="h-6 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map((product: any) => {
                const inCart = cartItems.find(item => item.product.id === product.id);
                const discountBadge = getDiscountBadge(product);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative group hover:shadow-md transition-all hover:border-slate-200"
                  >
                    {/* Discount Badge */}
                    {discountBadge && (
                      <div className="absolute top-5 left-5 z-10 bg-slate-800 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                        {discountBadge}
                      </div>
                    )}
                    
                    {/* Bookmark Button */}
                    <button className="absolute top-5 right-5 z-10 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Bookmark className="w-4 h-4 text-slate-400 hover:text-violet-500" />
                    </button>
                    
                    {/* Product Image */}
                    <div className="aspect-[4/3] bg-slate-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">🍽️</span>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <h3 className="font-semibold text-slate-800 text-sm mb-1 truncate">{product.name}</h3>
                    <p className="text-xs text-slate-400 mb-2">
                      {product.stock_quantity || 0} Available
                    </p>
                    
                    {/* Price & Cart Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-violet-600 font-bold">
                          {formatCurrency(product.selling_price, country)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.selling_price && (
                          <span className="text-slate-400 text-xs line-through">
                            {formatCurrency(product.compare_at_price, country)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleProductClick(product)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs transition-all',
                          inCart 
                            ? 'bg-violet-500 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-600'
                        )}
                      >
                        {inCart ? (
                          <>
                            <span>Added</span>
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                              {inCart.quantity}
                            </span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No products found</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery ? 'Try a different search' : 'Add products to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Cart Bottom Bar */}
        {cartItems.length > 0 && (
          <div 
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur-xl border-t border-slate-200"
            onClick={() => setMobileCartOpen(true)}
          >
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 cursor-pointer">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-white" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-violet-600 flex items-center justify-center text-xs font-bold">
                  {itemCount}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/80">
                  {itemCount} item{itemCount > 1 ? 's' : ''} in cart
                </p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(total + calculatedTax, country)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ChevronUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================= */}
      {/* RIGHT SIDE - Cart (Desktop) */}
      {/* ============================================= */}
      <div className="hidden lg:flex w-96 flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Cart Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Order Details</h2>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-500 font-medium hover:text-red-600"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Customer Selection */}
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="w-full mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Avatar name={selectedCustomer?.name || 'Walk-in'} size="sm" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-slate-800">
                {selectedCustomer?.name || 'Walk-in Customer'}
              </p>
              <p className="text-xs text-slate-500">
                {selectedCustomer?.phone || 'Tap to select customer'}
              </p>
            </div>
            <User className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-400 text-sm">Cart is empty</p>
                <p className="text-xs text-slate-300 mt-1">Add items to get started</p>
              </div>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-14 h-14 rounded-lg bg-white flex-shrink-0 overflow-hidden border border-slate-100">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-slate-400">{(item.product as any).category?.name || 'Item'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-medium text-slate-600 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-violet-600 font-bold text-sm">{formatCurrency(item.total, country)}</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-400 hover:text-red-500 mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Cart Summary & Payment */}
        <div className="p-5 border-t border-slate-100 bg-slate-50">
          {/* Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Items ({itemCount})</span>
              <span className="font-medium text-slate-700">{formatCurrency(subtotal, country)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium text-red-500">-{formatCurrency(totalDiscount, country)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax (10%)</span>
              <span className="font-medium text-slate-700">{formatCurrency(calculatedTax, country)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-800">Total</span>
              <span className="text-slate-800">{formatCurrency(total + calculatedTax, country)}</span>
            </div>
          </div>
          
          {/* Payment Method Selection */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Payment Method</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedPaymentMethod('cash')}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                  selectedPaymentMethod === 'cash'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  selectedPaymentMethod === 'cash' ? 'bg-violet-100' : 'bg-slate-100'
                )}>
                  <Banknote className={cn(
                    'w-5 h-5',
                    selectedPaymentMethod === 'cash' ? 'text-violet-600' : 'text-slate-500'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  selectedPaymentMethod === 'cash' ? 'text-violet-700' : 'text-slate-600'
                )}>Cash</span>
              </button>
              <button
                onClick={() => setSelectedPaymentMethod('card')}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                  selectedPaymentMethod === 'card'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  selectedPaymentMethod === 'card' ? 'bg-violet-100' : 'bg-slate-100'
                )}>
                  <CreditCard className={cn(
                    'w-5 h-5',
                    selectedPaymentMethod === 'card' ? 'text-violet-600' : 'text-slate-500'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  selectedPaymentMethod === 'card' ? 'text-violet-700' : 'text-slate-600'
                )}>Card</span>
              </button>
              <button
                onClick={() => setSelectedPaymentMethod('momo')}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                  selectedPaymentMethod === 'momo'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  selectedPaymentMethod === 'momo' ? 'bg-violet-100' : 'bg-slate-100'
                )}>
                  <QrCode className={cn(
                    'w-5 h-5',
                    selectedPaymentMethod === 'momo' ? 'text-violet-600' : 'text-slate-500'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  selectedPaymentMethod === 'momo' ? 'text-violet-700' : 'text-slate-600'
                )}>Mobile</span>
              </button>
            </div>
          </div>
          
          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isProcessing}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2',
              cartItems.length === 0 || isProcessing
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Payment • {formatCurrency(total + calculatedTax, country)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============================================= */}
      {/* MOBILE CART SHEET */}
      {/* ============================================= */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileCartOpen(false)}
          />
          
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 rounded-full bg-slate-300" />
            </div>
            
            <div className="px-5 pb-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Order Details</h2>
                <p className="text-sm text-slate-400">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <button 
                    onClick={clearCart}
                    className="text-sm text-red-500 font-medium"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setMobileCartOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-14 h-14 rounded-lg bg-white flex-shrink-0 overflow-hidden border border-slate-100">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{(item.product as any).category?.name || 'Item'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-medium text-slate-600 w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-violet-600 font-bold text-sm">{formatCurrency(item.total, country)}</p>
                </div>
              ))}
            </div>
            
            {/* Cart Summary */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Items ({itemCount})</span>
                  <span className="font-medium text-slate-700">{formatCurrency(subtotal, country)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Discount</span>
                    <span className="font-medium text-red-500">-{formatCurrency(totalDiscount, country)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax (10%)</span>
                  <span className="font-medium text-slate-700">{formatCurrency(calculatedTax, country)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-800">Total</span>
                  <span className="text-slate-800">{formatCurrency(total + calculatedTax, country)}</span>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedPaymentMethod('cash')}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all',
                      selectedPaymentMethod === 'cash'
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 bg-white'
                    )}
                  >
                    <Banknote className={cn('w-5 h-5', selectedPaymentMethod === 'cash' ? 'text-violet-600' : 'text-slate-500')} />
                    <span className="text-xs font-medium text-slate-600">Cash</span>
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all',
                      selectedPaymentMethod === 'card'
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 bg-white'
                    )}
                  >
                    <CreditCard className={cn('w-5 h-5', selectedPaymentMethod === 'card' ? 'text-violet-600' : 'text-slate-500')} />
                    <span className="text-xs font-medium text-slate-600">Card</span>
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMethod('momo')}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all',
                      selectedPaymentMethod === 'momo'
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 bg-white'
                    )}
                  >
                    <QrCode className={cn('w-5 h-5', selectedPaymentMethod === 'momo' ? 'text-violet-600' : 'text-slate-500')} />
                    <span className="text-xs font-medium text-slate-600">Mobile</span>
                  </button>
                </div>
              </div>
              
              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || isProcessing}
                className={cn(
                  'w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2',
                  cartItems.length === 0 || isProcessing
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-500 to-violet-600 shadow-lg shadow-violet-500/25'
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Payment • {formatCurrency(total + calculatedTax, country)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      <Modal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        title="Select Customer"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => {
              setCustomer(null);
              setIsCustomerModalOpen(false);
            }}
            className="w-full flex items-center gap-3 p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">Walk-in Customer</p>
              <p className="text-sm text-slate-500">No customer record</p>
            </div>
          </button>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {customers?.map((customer: Customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  setCustomer(customer);
                  setIsCustomerModalOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-colors',
                  selectedCustomer?.id === customer.id
                    ? 'bg-violet-100 border-2 border-violet-500'
                    : 'bg-slate-100 hover:bg-slate-200'
                )}
              >
                <Avatar name={customer.name || ''} size="sm" />
                <div className="text-left">
                  <p className="font-medium text-slate-800">{customer.name}</p>
                  <p className="text-sm text-slate-500">{customer.phone}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
