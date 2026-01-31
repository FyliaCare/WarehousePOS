/**
 * Mobile Stock Page
 * PWA-optimized stock/inventory management with light blue theme
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  ChevronLeft,
  Check,
  Loader2,
  Boxes,
  AlertCircle,
  CheckCircle,
  History,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { StockMovementType } from '@warehousepos/types';

// ============================================
// THEME CONFIGURATION - Light Blue
// ============================================
const theme = {
  // Base colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceLight: '#f1f5f9',
  surfaceElevated: '#e2e8f0',
  
  // Primary blue palette
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  primaryMid: '#93c5fd',
  primaryDark: '#1d4ed8',
  primaryGlow: '#3b82f620',
  
  // Text colors
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  
  // Border
  border: '#e2e8f0',
};

// Haptic feedback helper
const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  success: () => navigator.vibrate?.([10, 50, 10]),
};

// ============================================
// STOCK ITEM CARD COMPONENT
// ============================================
interface StockItemCardProps {
  item: any;
  onAdjust: (item: any, type: 'add' | 'remove') => void;
}

function StockItemCard({ item, onAdjust }: StockItemCardProps) {
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' };
    if (quantity <= 10) return { label: 'Low', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500' };
    return { label: 'Good', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500' };
  };

  const status = getStockStatus(item.quantity);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-3"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-3">
        {/* Product Image */}
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: theme.surfaceLight }}
        >
          {item.product?.image_url ? (
            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-5 h-5" style={{ color: theme.textMuted }} />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold truncate" style={{ color: theme.textPrimary }}>
              {item.product?.name}
            </h3>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dotColor}`} />
          </div>
          <p className="text-[10px] font-mono" style={{ color: theme.textMuted }}>
            {item.product?.sku || 'No SKU'}
          </p>
        </div>

        {/* Quantity & Status */}
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>
            {item.quantity}
          </p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => { haptic.light(); onAdjust(item, 'add'); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium active:scale-95"
          style={{ backgroundColor: '#d1fae5', color: '#059669' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stock
        </button>
        <button
          onClick={() => { haptic.light(); onAdjust(item, 'remove'); }}
          disabled={item.quantity === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
        >
          <Minus className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// STOCK ADJUSTMENT FORM COMPONENT
// ============================================
interface StockAdjustmentFormProps {
  item: any;
  type: 'add' | 'remove';
  onSuccess: () => void;
  onCancel: () => void;
}

function StockAdjustmentForm({ item, type, onSuccess, onCancel }: StockAdjustmentFormProps) {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const quickAmounts = [1, 5, 10, 25, 50, 100];

  // Adjustment mutation
  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error('Store not found');
      
      const qty = parseInt(quantity);
      if (!qty || qty <= 0) throw new Error('Invalid quantity');
      
      if (type === 'remove' && qty > item.quantity) {
        throw new Error('Cannot remove more than current stock');
      }

      const movementType: StockMovementType = 'adjustment';

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          store_id: store.id,
          product_id: item.product_id,
          type: movementType,
          quantity: type === 'add' ? qty : -qty,
          notes: `${type === 'add' ? 'Stock increase' : 'Stock decrease'}: ${reason || 'Manual adjustment'}`,
        } as never);

      if (movementError) throw movementError;

      // Update stock level
      const newQuantity = type === 'add' 
        ? item.quantity + qty 
        : Math.max(0, item.quantity - qty);

      const { error: updateError } = await supabase
        .from('stock_levels')
        .upsert({
          store_id: store.id,
          product_id: item.product_id,
          quantity: newQuantity,
        } as never);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      haptic.success();
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      toast.success(`Stock ${type === 'add' ? 'added' : 'removed'} successfully`);
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Failed to adjust stock', { description: error.message });
    },
  });

  const handleSubmit = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (type === 'remove' && qty > item.quantity) {
      toast.error('Cannot remove more than current stock');
      return;
    }
    adjustMutation.mutate();
  };

  const newTotal = type === 'add' 
    ? item.quantity + (parseInt(quantity) || 0)
    : Math.max(0, item.quantity - (parseInt(quantity) || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: theme.background }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 safe-area-inset-top"
        style={{ backgroundColor: type === 'add' ? '#10b981' : '#ef4444' }}
      >
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-white active:opacity-70"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs font-medium">Cancel</span>
        </button>
        <h1 className="text-sm font-bold text-white flex items-center gap-2">
          {type === 'add' ? (
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
        </h1>
        <button
          onClick={handleSubmit}
          disabled={adjustMutation.isPending || !quantity}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 text-white active:bg-white/30 disabled:opacity-50"
        >
          {adjustMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span className="text-xs font-bold">Done</span>
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Selected Product */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            Selected Product
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: theme.surfaceLight }}
            >
              {item.product?.image_url ? (
                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-6 h-6" style={{ color: theme.textMuted }} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                {item.product?.name}
              </h3>
              <p className="text-xs font-mono" style={{ color: theme.textMuted }}>
                {item.product?.sku || 'No SKU'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                {item.quantity}
              </p>
              <p className="text-[9px] uppercase" style={{ color: theme.textMuted }}>
                current
              </p>
            </div>
          </div>
        </div>

        {/* Quantity Input */}
        <div
          className="rounded-xl p-4"
          style={{ 
            backgroundColor: type === 'add' ? '#d1fae5' : '#fee2e2', 
            border: `2px solid ${type === 'add' ? '#10b981' : '#ef4444'}` 
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: type === 'add' ? '#059669' : '#dc2626' }}>
            Quantity to {type === 'add' ? 'Add' : 'Remove'}
          </p>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full text-4xl font-bold font-mono text-center bg-transparent focus:outline-none"
            style={{ color: type === 'add' ? '#059669' : '#dc2626' }}
          />
          {quantity && (
            <p className="text-center text-xs mt-2" style={{ color: type === 'add' ? '#059669' : '#dc2626' }}>
              New total: <span className="font-bold">{newTotal} units</span>
            </p>
          )}
        </div>

        {/* Quick Amounts */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            Quick Select
          </p>
          <div className="grid grid-cols-6 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => { haptic.light(); setQuantity(amount.toString()); }}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                  quantity === amount.toString() 
                    ? type === 'add' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    : ''
                }`}
                style={quantity !== amount.toString() ? { 
                  backgroundColor: theme.surface, 
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                } : {}}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Input */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            <History className="w-3 h-3 inline mr-1" />
            Reason (Optional)
          </p>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={type === 'add' ? 'e.g., New shipment arrived' : 'e.g., Damaged goods'}
            className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
            }}
          />
        </div>

        {/* Info Card */}
        <div
          className="rounded-xl p-3 flex items-start gap-3"
          style={{ backgroundColor: theme.primaryLight }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: theme.primary }} />
          <div>
            <p className="text-xs font-medium" style={{ color: theme.primary }}>
              Stock Movement Tracking
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: theme.textSecondary }}>
              This adjustment will be recorded in your stock movement history for auditing purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="px-4 py-4 safe-area-inset-bottom" style={{ backgroundColor: theme.surface, borderTop: `1px solid ${theme.border}` }}>
        <button
          onClick={handleSubmit}
          disabled={adjustMutation.isPending || !quantity}
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          style={{ backgroundColor: type === 'add' ? '#10b981' : '#ef4444', color: '#ffffff' }}
        >
          {adjustMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {type === 'add' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {type === 'add' ? 'Add' : 'Remove'} {quantity || '0'} Units
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN MOBILE STOCK PAGE
// ============================================
export function MobileStockPage() {
  const { store } = useAuthStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [adjustingItem, setAdjustingItem] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  // Fetch stock levels
  const { data: stockLevels, isLoading } = useQuery({
    queryKey: ['stock-levels', store?.id, searchQuery, stockFilter],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('stock_levels')
        .select('*, product:products(name, sku, cost_price, price, image_url, track_inventory, low_stock_threshold, category:categories(name, color, icon))')
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

  const handleOpenAdjustment = (item: any, type: 'add' | 'remove') => {
    setAdjustingItem(item);
    setAdjustmentType(type);
  };

  const handleCloseAdjustment = () => {
    setAdjustingItem(null);
  };

  // Stats
  const totalProducts = stockLevels?.length || 0;
  const totalUnits = stockLevels?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
  const lowStockCount = stockLevels?.filter((s: any) => s.quantity > 0 && s.quantity <= 10).length || 0;
  const outOfStockCount = stockLevels?.filter((s: any) => s.quantity === 0).length || 0;
  const healthyStockCount = stockLevels?.filter((s: any) => s.quantity > 10).length || 0;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <div
        className="px-4 pt-3 pb-4 safe-area-inset-top"
        style={{ backgroundColor: theme.primary }}
      >
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-white">Stock Management</h1>
            <p className="text-[10px] text-white/70 font-mono">
              {totalProducts} products • {totalUnits.toLocaleString()} units
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 text-white text-xs font-medium active:bg-white/30"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-mono bg-white/20 text-white placeholder-white/50 focus:outline-none focus:bg-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Strip */}
      <div
        className="px-3 py-3 overflow-x-auto scrollbar-hide"
        style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-3 min-w-max">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Boxes className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Products</p>
              <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>{totalProducts}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Healthy</p>
              <p className="text-sm font-bold text-emerald-600">{healthyStockCount}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Low</p>
              <p className="text-sm font-bold text-amber-600">{lowStockCount}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Out</p>
              <p className="text-sm font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="px-3 py-2 flex gap-2"
        style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}
      >
        {[
          { value: 'all', label: 'All', count: totalProducts },
          { value: 'low', label: 'Low Stock', count: lowStockCount },
          { value: 'out', label: 'Out of Stock', count: outOfStockCount },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => { haptic.light(); setStockFilter(filter.value as any); }}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
            style={{
              backgroundColor: stockFilter === filter.value ? theme.primary : 'transparent',
              color: stockFilter === filter.value ? '#ffffff' : theme.textSecondary,
            }}
          >
            {filter.label}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: stockFilter === filter.value ? 'rgba(255,255,255,0.2)' : theme.surfaceLight,
              }}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Stock List */}
      <div className="p-3 space-y-2">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-3 animate-pulse"
              style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: theme.surfaceLight }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded" style={{ backgroundColor: theme.surfaceLight, width: '60%' }} />
                  <div className="h-2 rounded" style={{ backgroundColor: theme.surfaceLight, width: '40%' }} />
                </div>
                <div className="w-12 h-8 rounded" style={{ backgroundColor: theme.surfaceLight }} />
              </div>
            </div>
          ))
        ) : stockLevels && stockLevels.length > 0 ? (
          stockLevels.map((item: any) => (
            <StockItemCard
              key={item.id}
              item={item}
              onAdjust={handleOpenAdjustment}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textMuted }} />
            <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>
              {stockFilter !== 'all'
                ? `No ${stockFilter === 'low' ? 'low stock' : 'out of stock'} products`
                : 'No products found'}
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Add products to start tracking stock
            </p>
          </div>
        )}
      </div>

      {/* Stock Adjustment Form Modal */}
      <AnimatePresence>
        {adjustingItem && (
          <StockAdjustmentForm
            item={adjustingItem}
            type={adjustmentType}
            onSuccess={handleCloseAdjustment}
            onCancel={handleCloseAdjustment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileStockPage;
