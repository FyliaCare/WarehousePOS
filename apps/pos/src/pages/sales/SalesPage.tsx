import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Receipt,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
} from 'lucide-react';
import { formatCurrency, timeAgo, formatDate } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { Sale, PaymentMethod, SaleStatus, CountryCode } from '@warehousepos/types';

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

export function SalesPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

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
    (acc, sale: any) => ({
      count: acc.count + 1,
      total: acc.total + sale.total,
      paid: acc.paid + (sale.status === 'completed' ? sale.total : 0),
      pending: acc.pending + (sale.status === 'pending' ? sale.total : 0),
    }),
    { count: 0, total: 0, paid: 0, pending: 0 }
  ) || { count: 0, total: 0, paid: 0, pending: 0 };

  const paidCount = sales?.filter((s: any) => s.status === 'completed').length || 0;
  const pendingCount = sales?.filter((s: any) => s.status === 'pending').length || 0;

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'momo':
        return <Smartphone className="w-4 h-4" />;
      case 'transfer':
        return <Building className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusConfig = (status: SaleStatus) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
      case 'pending':
        return { label: 'Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
      case 'voided':
        return { label: 'Voided', color: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500' };
      case 'refunded':
        return { label: 'Refunded', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
      default:
        return { label: status, color: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500' };
    }
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
              Sales History
            </h1>
            <p className="text-sm mt-0.5 opacity-80" style={{ color: theme.textOnPrimary }}>
              View and manage your sales transactions
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90"
            style={{ 
              backgroundColor: theme.accent,
              color: country === 'GH' ? '#FFD000' : '#FFFFFF'
            }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
              <ShoppingCart className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Sales</p>
              <p className="text-lg font-bold text-zinc-900">{totals.count}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Revenue</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totals.total, country)}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Collected</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.paid, country)}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Pending</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(totals.pending, country)}</p>
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
              placeholder="Search by receipt number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
            />
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-zinc-200">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: '7 Days' },
              { value: 'month', label: '30 Days' },
              { value: 'all', label: 'All' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as any)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  dateRange === option.value
                    ? 'text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
                style={dateRange === option.value ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-zinc-200">
            {[
              { value: '', label: 'All', count: totals.count },
              { value: 'completed', label: 'Completed', count: paidCount },
              { value: 'pending', label: 'Pending', count: pendingCount },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as SaleStatus | '')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === option.value
                    ? 'text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
                style={statusFilter === option.value ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
              >
                {option.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === option.value 
                    ? 'bg-black/10' 
                    : 'bg-zinc-100'
                }`}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border-b border-zinc-100 last:border-0 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-zinc-200 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-zinc-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : sales && sales.length > 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="col-span-4">Receipt</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Payment</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            
            {/* Table Body */}
            {sales.map((sale: any) => {
              const status = getStatusConfig(sale.status);
              return (
                <div
                  key={sale.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-zinc-100 last:border-0 items-center hover:bg-zinc-50 cursor-pointer transition-colors"
                  onClick={() => setViewingSale(sale)}
                >
                  {/* Receipt Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: theme.primaryLight }}
                    >
                      <Receipt className="w-5 h-5" style={{ color: theme.accent }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-zinc-900">{sale.sale_number}</p>
                      <p className="text-xs text-zinc-500">
                        {sale.items?.length || 0} items • {timeAgo(sale.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Customer */}
                  <div className="col-span-2">
                    <p className="text-sm text-zinc-700 truncate">
                      {sale.customer?.name || 'Walk-in'}
                    </p>
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-2 flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  
                  {/* Payment Method */}
                  <div className="col-span-2 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 capitalize">
                      {getPaymentMethodIcon(sale.payment_method)}
                      {sale.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <p className="font-bold text-sm" style={{ color: theme.accent }}>
                      {formatCurrency(sale.total, country)}
                    </p>
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
              <Receipt className="w-8 h-8" style={{ color: theme.accent }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No sales found</h3>
            <p className="text-sm text-zinc-500">
              {dateRange === 'today' ? 'No sales recorded today' : 'Your sales will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Sale Detail Slide Panel */}
      {viewingSale && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setViewingSale(null)}
          />
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden"
            style={{ animation: 'slideInFromRight 0.3s ease-out' }}
          >
            {/* Panel Header */}
            <div 
              className="px-6 py-5 border-b"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <button
                onClick={() => setViewingSale(null)}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primary }}
                >
                  <Receipt className="w-7 h-7" style={{ color: theme.textOnPrimary }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{viewingSale.sale_number}</h2>
                  <p className="text-sm text-zinc-500">
                    {formatDate(viewingSale.created_at, 'full')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto h-[calc(100%-180px)] space-y-5">
              {/* Status & Payment */}
              <div className="flex gap-3">
                <div className="flex-1 p-4 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
                  <p className="text-xs text-zinc-500 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusConfig(viewingSale.status).color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(viewingSale.status).dot}`} />
                    {getStatusConfig(viewingSale.status).label}
                  </span>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-zinc-100">
                  <p className="text-xs text-zinc-500 mb-1">Payment Method</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 capitalize">
                    {getPaymentMethodIcon(viewingSale.payment_method)}
                    {viewingSale.payment_method.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                <h3 className="text-sm font-semibold text-zinc-900 mb-2">Customer</h3>
                <p className="text-sm text-zinc-700">
                  {(viewingSale as any).customer?.name || 'Walk-in Customer'}
                </p>
                {(viewingSale as any).customer?.phone && (
                  <p className="text-xs text-zinc-500 mt-1">{(viewingSale as any).customer.phone}</p>
                )}
              </div>

              {/* Items */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Items ({(viewingSale as any).items?.length || 0})</h3>
                <div className="space-y-3">
                  {(viewingSale as any).items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{item.product?.name}</p>
                        <p className="text-xs text-zinc-500">
                          {formatCurrency(item.unit_price, country)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-zinc-900">
                        {formatCurrency(item.total, country)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Subtotal</span>
                    <span className="text-zinc-900">{formatCurrency(viewingSale.subtotal, country)}</span>
                  </div>
                  {viewingSale.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Discount</span>
                      <span className="text-red-600">-{formatCurrency(viewingSale.discount, country)}</span>
                    </div>
                  )}
                  {viewingSale.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Tax</span>
                      <span className="text-zinc-900">{formatCurrency(viewingSale.tax, country)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-zinc-900">Total</span>
                      <span className="text-lg font-bold" style={{ color: theme.accent }}>
                        {formatCurrency(viewingSale.total, country)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors">
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all"
                  style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
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
