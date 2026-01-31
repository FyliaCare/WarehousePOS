/**
 * Mobile Sales Page
 * PWA-optimized sales history with light blue theme
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Receipt,
  Download,
  TrendingUp,
  ShoppingCart,
  CheckCircle,
  Clock,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Printer,
  Share,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, timeAgo, formatDate } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { PaymentMethod, SaleStatus, CountryCode } from '@warehousepos/types';

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
// HELPER FUNCTIONS
// ============================================
const getPaymentMethodIcon = (method: PaymentMethod) => {
  switch (method) {
    case 'cash':
      return <Banknote className="w-3.5 h-3.5" />;
    case 'card':
      return <CreditCard className="w-3.5 h-3.5" />;
    case 'momo':
      return <Smartphone className="w-3.5 h-3.5" />;
    case 'transfer':
      return <Building className="w-3.5 h-3.5" />;
    default:
      return <DollarSign className="w-3.5 h-3.5" />;
  }
};

const getStatusConfig = (status: SaleStatus) => {
  switch (status) {
    case 'completed':
      return { 
        label: 'Completed', 
        color: 'bg-emerald-100 text-emerald-700', 
        dot: 'bg-emerald-500',
        icon: CheckCircle,
      };
    case 'pending':
      return { 
        label: 'Pending', 
        color: 'bg-amber-100 text-amber-700', 
        dot: 'bg-amber-500',
        icon: Clock,
      };
    case 'voided':
      return { 
        label: 'Voided', 
        color: 'bg-zinc-100 text-zinc-700', 
        dot: 'bg-zinc-500',
        icon: XCircle,
      };
    case 'refunded':
      return { 
        label: 'Refunded', 
        color: 'bg-red-100 text-red-700', 
        dot: 'bg-red-500',
        icon: RotateCcw,
      };
    default:
      return { 
        label: status, 
        color: 'bg-zinc-100 text-zinc-700', 
        dot: 'bg-zinc-500',
        icon: Receipt,
      };
  }
};

// ============================================
// SALE CARD COMPONENT
// ============================================
interface SaleCardProps {
  sale: any;
  country: CountryCode;
  onSelect: (sale: any) => void;
}

function SaleCard({ sale, country, onSelect }: SaleCardProps) {
  const status = getStatusConfig(sale.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => { haptic.light(); onSelect(sale); }}
      className="rounded-xl p-3 active:scale-98"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-3">
        {/* Receipt Icon */}
        <div
          className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: theme.primaryLight }}
        >
          <Receipt className="w-5 h-5" style={{ color: theme.primary }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold font-mono" style={{ color: theme.textPrimary }}>
              {sale.sale_number}
            </h3>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px]" style={{ color: theme.textMuted }}>
              {sale.items?.length || 0} items
            </span>
            <span className="text-[10px]" style={{ color: theme.textMuted }}>•</span>
            <span className="text-[10px]" style={{ color: theme.textMuted }}>
              {timeAgo(sale.created_at)}
            </span>
          </div>
        </div>

        {/* Amount & Payment */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>
            {formatCurrency(sale.total, country)}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] capitalize" style={{ color: theme.textMuted }}>
            {getPaymentMethodIcon(sale.payment_method)}
            {sale.payment_method}
          </span>
        </div>

        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: theme.textMuted }} />
      </div>
    </motion.div>
  );
}

// ============================================
// SALE DETAIL VIEW
// ============================================
interface SaleDetailProps {
  sale: any;
  country: CountryCode;
  onClose: () => void;
}

function SaleDetailView({ sale, country, onClose }: SaleDetailProps) {
  const status = getStatusConfig(sale.status);
  const StatusIcon = status.icon;

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
        className="px-4 pt-3 pb-5 safe-area-inset-top"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-white active:opacity-70"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-xs font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white/20 text-white active:bg-white/30">
              <Share className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg bg-white/20 text-white active:bg-white/30">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/20">
            <Receipt className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white font-mono">
              {sale.sale_number}
            </h1>
            <p className="text-xs text-white/70">
              {formatDate(sale.created_at, 'full')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Status & Payment Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <p className="text-[10px] uppercase font-bold mb-2" style={{ color: theme.textMuted }}>
              Status
            </p>
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <p className="text-[10px] uppercase font-bold mb-2" style={{ color: theme.textMuted }}>
              Payment
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize" style={{ color: theme.textPrimary }}>
              {getPaymentMethodIcon(sale.payment_method)}
              {sale.payment_method.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3.5 h-3.5" style={{ color: theme.primary }} />
            <p className="text-[10px] uppercase font-bold" style={{ color: theme.textMuted }}>
              Customer
            </p>
          </div>
          <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>
            {sale.customer?.name || 'Walk-in Customer'}
          </p>
          {sale.customer?.phone && (
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              {sale.customer.phone}
            </p>
          )}
        </div>

        {/* Items List */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-3.5 h-3.5" style={{ color: theme.primary }} />
            <p className="text-[10px] uppercase font-bold" style={{ color: theme.textMuted }}>
              Items ({sale.items?.length || 0})
            </p>
          </div>
          <div className="space-y-3">
            {sale.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-xs font-medium" style={{ color: theme.textPrimary }}>
                    {item.product?.name}
                  </p>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>
                    {formatCurrency(item.unit_price, country)} × {item.quantity}
                  </p>
                </div>
                <p className="text-xs font-bold" style={{ color: theme.textPrimary }}>
                  {formatCurrency(item.total, country)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.primaryLight }}
        >
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: theme.textSecondary }}>Subtotal</span>
              <span style={{ color: theme.textPrimary }}>{formatCurrency(sale.subtotal, country)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.textSecondary }}>Discount</span>
                <span className="text-red-600">-{formatCurrency(sale.discount, country)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.textSecondary }}>Tax</span>
                <span style={{ color: theme.textPrimary }}>{formatCurrency(sale.tax, country)}</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t" style={{ borderColor: theme.primaryMid }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>Total</span>
                <span className="text-xl font-bold" style={{ color: theme.primary }}>
                  {formatCurrency(sale.total, country)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 py-4 safe-area-inset-bottom" style={{ backgroundColor: theme.surface, borderTop: `1px solid ${theme.border}` }}>
        <div className="flex gap-3">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold active:scale-95"
            style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white active:scale-95"
            style={{ backgroundColor: theme.primary }}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN MOBILE SALES PAGE
// ============================================
export function MobileSalesPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [viewingSale, setViewingSale] = useState<any>(null);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        return null;
    }
    
    return start.toISOString();
  };

  // Fetch sales
  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales', store?.id, searchQuery, statusFilter, dateRange],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('sales')
        .select('*, customer:customers(name, phone), items:sale_items(*, product:products(name))')
        .eq('store_id', store.id);

      if (searchQuery) {
        query = query.ilike('sale_number', `%${searchQuery}%`);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const dateStart = getDateRange();
      if (dateStart) {
        query = query.gte('created_at', dateStart);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Calculate totals
  const totals = sales?.reduce(
    (acc: any, sale: any) => ({
      count: acc.count + 1,
      total: acc.total + sale.total,
      paid: acc.paid + (sale.status === 'completed' ? sale.total : 0),
      pending: acc.pending + (sale.status === 'pending' ? sale.total : 0),
    }),
    { count: 0, total: 0, paid: 0, pending: 0 }
  ) || { count: 0, total: 0, paid: 0, pending: 0 };

  const paidCount = sales?.filter((s: any) => s.status === 'completed').length || 0;
  const pendingCount = sales?.filter((s: any) => s.status === 'pending').length || 0;

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
            <h1 className="text-lg font-bold text-white">Sales History</h1>
            <p className="text-[10px] text-white/70 font-mono">
              {totals.count} sales • {formatCurrency(totals.total, country)}
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 text-white text-xs font-medium active:bg-white/30"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt number..."
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
              <ShoppingCart className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Sales</p>
              <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>{totals.count}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-50">
              <TrendingUp className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Revenue</p>
              <p className="text-sm font-bold text-sky-600">{formatCurrency(totals.total, country)}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Collected</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(totals.paid, country)}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Pending</p>
              <p className="text-sm font-bold text-amber-600">{formatCurrency(totals.pending, country)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div
        className="px-3 py-2 flex gap-1.5"
        style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}
      >
        {[
          { value: 'today', label: 'Today' },
          { value: 'week', label: '7 Days' },
          { value: 'month', label: '30 Days' },
          { value: 'all', label: 'All' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => { haptic.light(); setDateRange(option.value as any); }}
            className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95"
            style={{
              backgroundColor: dateRange === option.value ? theme.primary : 'transparent',
              color: dateRange === option.value ? '#ffffff' : theme.textSecondary,
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div
        className="px-3 py-2 flex gap-1.5"
        style={{ backgroundColor: theme.surfaceLight }}
      >
        {[
          { value: '', label: 'All', count: totals.count },
          { value: 'completed', label: 'Completed', count: paidCount },
          { value: 'pending', label: 'Pending', count: pendingCount },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => { haptic.light(); setStatusFilter(option.value as SaleStatus | ''); }}
            className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
            style={{
              backgroundColor: statusFilter === option.value ? theme.surface : 'transparent',
              color: statusFilter === option.value ? theme.textPrimary : theme.textMuted,
              boxShadow: statusFilter === option.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {option.label}
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: statusFilter === option.value ? theme.primaryLight : theme.surfaceElevated,
              }}
            >
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sales List */}
      <div className="p-3 space-y-2">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-3 animate-pulse"
              style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg" style={{ backgroundColor: theme.surfaceLight }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded" style={{ backgroundColor: theme.surfaceLight, width: '40%' }} />
                  <div className="h-2 rounded" style={{ backgroundColor: theme.surfaceLight, width: '60%' }} />
                </div>
                <div className="w-16 h-6 rounded" style={{ backgroundColor: theme.surfaceLight }} />
              </div>
            </div>
          ))
        ) : sales && sales.length > 0 ? (
          sales.map((sale: any) => (
            <SaleCard
              key={sale.id}
              sale={sale}
              country={country}
              onSelect={setViewingSale}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textMuted }} />
            <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>
              No sales found
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              {dateRange === 'today' ? 'No sales recorded today' : 'Your sales will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      <AnimatePresence>
        {viewingSale && (
          <SaleDetailView
            sale={viewingSale}
            country={country}
            onClose={() => setViewingSale(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileSalesPage;
