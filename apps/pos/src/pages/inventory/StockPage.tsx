import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Minus,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  History,
  Boxes,
  AlertCircle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { StockMovementType, CountryCode } from '@warehousepos/types';

// Theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1A1A',
    textOnLight: '#1A1A1A',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B40',
    accent: '#1A1A1A',
    textOnPrimary: '#FFFFFF',
    textOnLight: '#1A1A1A',
  },
};

export function StockPage() {
  const { tenant, store } = useAuthStore();
  const queryClient = useQueryClient();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Fetch stock levels
  const { data: stockLevels, isLoading } = useQuery({
    queryKey: ['stock-levels', store?.id, searchQuery, stockFilter],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('stock_levels')
        .select('*, product:products(name, sku, cost_price, selling_price, image_url, category:categories(name, color, icon))')
        .eq('store_id', store.id);

      if (stockFilter === 'low') {
        query = query.lte('quantity', 10).gt('quantity', 0);
      } else if (stockFilter === 'out') {
        query = query.eq('quantity', 0);
      }

      const { data } = await query.order('quantity', { ascending: true });

      if (searchQuery && data) {
        return data.filter(
          (item: any) =>
            item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return data || [];
    },
    enabled: !!store?.id,
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      type,
      reason,
    }: {
      productId: string;
      quantity: number;
      type: 'add' | 'remove';
      reason: string;
    }) => {
      if (!store?.id) throw new Error('Store not found');
      
      const movementType: StockMovementType = 'adjustment';

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          store_id: store.id,
          product_id: productId,
          type: movementType,
          quantity: type === 'add' ? quantity : -quantity,
          notes: `${type === 'add' ? 'Stock increase' : 'Stock decrease'}: ${reason}`,
        } as never);

      if (movementError) throw movementError;

      const { data: currentStock } = await supabase
        .from('stock_levels')
        .select('quantity')
        .eq('store_id', store.id)
        .eq('product_id', productId)
        .single();

      const currentQty = ((currentStock as any)?.quantity ?? 0) as number;
      const newQuantity =
        type === 'add'
          ? currentQty + quantity
          : currentQty - quantity;

      const { error: updateError } = await supabase
        .from('stock_levels')
        .upsert({
          store_id: store.id,
          product_id: productId,
          quantity: Math.max(0, newQuantity),
        } as never);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      toast.success('Stock adjusted successfully');
      handleCloseAdjustModal();
    },
    onError: (error: any) => {
      toast.error('Failed to adjust stock', { description: error.message });
    },
  });

  const handleOpenAdjustModal = (product: any, type: 'add' | 'remove') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setIsAdjustModalOpen(true);
  };

  const handleCloseAdjustModal = () => {
    setIsAdjustModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAdjustStock = () => {
    const quantity = parseInt(adjustmentQuantity);
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (adjustmentType === 'remove' && quantity > selectedProduct.quantity) {
      toast.error('Cannot remove more than current stock');
      return;
    }

    adjustStockMutation.mutate({
      productId: selectedProduct.product_id,
      quantity,
      type: adjustmentType,
      reason: adjustmentReason,
    });
  };

  // Stats
  const totalProducts = stockLevels?.length || 0;
  const totalUnits = stockLevels?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
  const lowStockCount = stockLevels?.filter((s: any) => s.quantity > 0 && s.quantity <= 10).length || 0;
  const outOfStockCount = stockLevels?.filter((s: any) => s.quantity === 0).length || 0;
  const healthyStockCount = stockLevels?.filter((s: any) => s.quantity > 10).length || 0;

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
    if (quantity <= 10) return { label: 'Low', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
    return { label: 'Good', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Premium Header */}
      <div 
        className="px-6 py-5"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: theme.textOnPrimary }}>
              Stock Management
            </h1>
            <p className="text-sm mt-0.5 opacity-80" style={{ color: theme.textOnPrimary }}>
              Track and manage your inventory levels
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90"
            style={{ 
              backgroundColor: theme.accent,
              color: country === 'GH' ? '#FFD000' : '#FFFFFF'
            }}
          >
            <History className="w-4 h-4" />
            View History
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
              <Boxes className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Products</p>
              <p className="text-lg font-bold text-zinc-900">{totalProducts}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Units</p>
              <p className="text-lg font-bold text-zinc-900">{totalUnits.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Healthy Stock</p>
              <p className="text-lg font-bold text-emerald-600">{healthyStockCount}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Low Stock</p>
              <p className="text-lg font-bold text-amber-600">{lowStockCount}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Out of Stock</p>
              <p className="text-lg font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-zinc-200">
            {[
              { value: 'all', label: 'All', count: totalProducts },
              { value: 'low', label: 'Low', count: lowStockCount },
              { value: 'out', label: 'Out', count: outOfStockCount },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStockFilter(filter.value as any)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  stockFilter === filter.value
                    ? 'text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
                style={stockFilter === filter.value ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
              >
                {filter.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  stockFilter === filter.value 
                    ? 'bg-black/10' 
                    : 'bg-zinc-100'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stock List */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border-b border-zinc-100 last:border-0 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-zinc-200 rounded w-1/4" />
                  </div>
                  <div className="h-8 bg-zinc-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : stockLevels && stockLevels.length > 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            
            {/* Table Body */}
            {stockLevels.map((item: any) => {
              const status = getStockStatus(item.quantity);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-zinc-100 last:border-0 items-center hover:bg-zinc-50 transition-colors"
                >
                  {/* Product Info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 flex items-center justify-center">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-zinc-900 truncate">
                        {item.product?.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500 font-mono">
                          {item.product?.sku}
                        </span>
                        {item.product?.category && (
                          <>
                            <span className="text-zinc-300">•</span>
                            <span 
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: item.product.category.color + '20', color: item.product.category.color }}
                            >
                              {item.product.category.icon} {item.product.category.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-2 flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  
                  {/* Quantity */}
                  <div className="col-span-2 text-center">
                    <p className="text-xl font-bold text-zinc-900">{item.quantity}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">units</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenAdjustModal(item, 'add')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                    <button
                      onClick={() => handleOpenAdjustModal(item, 'remove')}
                      disabled={item.quantity === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Package className="w-8 h-8" style={{ color: theme.accent }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No products found</h3>
            <p className="text-sm text-zinc-500 mb-4">
              {stockFilter !== 'all' 
                ? `No ${stockFilter === 'low' ? 'low stock' : 'out of stock'} products`
                : 'Add products to start tracking stock'}
            </p>
          </div>
        )}
      </div>

      {/* Stock Adjustment Slide Panel */}
      {isAdjustModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={handleCloseAdjustModal}
          />
          
          {/* Slide Panel */}
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden"
            style={{ animation: 'slideInFromRight 0.3s ease-out' }}
          >
            {/* Panel Header */}
            <div 
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ backgroundColor: adjustmentType === 'add' ? '#E6F5EE' : '#FEF2F2' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    adjustmentType === 'add' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  {adjustmentType === 'add' ? (
                    <TrendingUp className="w-5 h-5 text-white" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {adjustmentType === 'add' ? 'Increase inventory quantity' : 'Decrease inventory quantity'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAdjustModal}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            
            {/* Panel Content */}
            <div className="p-6 space-y-6">
              {/* Selected Product */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: theme.primaryLight }}>
                <p className="text-xs text-zinc-500 mb-2">Selected Product</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    {selectedProduct?.product?.image_url ? (
                      <img
                        src={selectedProduct.product.image_url}
                        alt={selectedProduct.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{selectedProduct?.product?.name}</p>
                    <p className="text-sm text-zinc-500">Current: {selectedProduct?.quantity} units</p>
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
                  <Package className="w-4 h-4" style={{ color: theme.accent }} />
                  Quantity to {adjustmentType === 'add' ? 'Add' : 'Remove'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all text-center text-2xl font-bold"
                  style={{ borderColor: theme.primaryMid }}
                />
                {adjustmentQuantity && (
                  <p className="text-center text-sm text-zinc-500 mt-2">
                    New total: <span className="font-semibold text-zinc-900">
                      {adjustmentType === 'add' 
                        ? selectedProduct?.quantity + parseInt(adjustmentQuantity || '0')
                        : Math.max(0, selectedProduct?.quantity - parseInt(adjustmentQuantity || '0'))
                      } units
                    </span>
                  </p>
                )}
              </div>

              {/* Reason Input */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
                  <History className="w-4 h-4" style={{ color: theme.accent }} />
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder={adjustmentType === 'add' ? 'e.g., New shipment arrived' : 'e.g., Damaged goods'}
                  className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: theme.primaryMid }}
                />
              </div>

              {/* Quick Amounts */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Quick select</p>
                <div className="flex gap-2">
                  {[1, 5, 10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setAdjustmentQuantity(amount.toString())}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border border-zinc-200 hover:border-zinc-300 transition-colors"
                      style={adjustmentQuantity === amount.toString() ? { 
                        backgroundColor: theme.primaryLight, 
                        borderColor: theme.primary,
                        color: theme.accent
                      } : {}}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAdjustModal}
                  className="flex-1 px-4 py-3 rounded-lg font-medium text-sm border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustStock}
                  disabled={adjustStockMutation.isPending || !adjustmentQuantity}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${
                    adjustmentType === 'add'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {adjustStockMutation.isPending ? (
                    'Processing...'
                  ) : adjustmentType === 'add' ? (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Add Stock
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      Remove Stock
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Keyframe Animation */}
          <style>{`
            @keyframes slideInFromRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
