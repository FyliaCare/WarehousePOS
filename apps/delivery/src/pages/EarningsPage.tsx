import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Wallet, 
  TrendingUp, 
  Package, 
  ChevronRight,
  Loader2,
  Receipt,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { CountryCode } from '@warehousepos/types';

// Premium theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1400',
    flag: '🇬🇭',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B41',
    accent: '#FFFFFF',
    textOnPrimary: '#FFFFFF',
    flag: '🇳🇬',
  },
};

// Type for delivery query result
interface DeliveryEarning {
  id: string;
  rider_earnings: number;
  delivery_fee: number;
  delivered_at: string;
  order?: { order_number: string };
}

type Period = 'today' | 'week' | 'month' | 'all';

export function EarningsPage() {
  const { rider, store } = useAuthStore();
  const country: CountryCode = (store as any)?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];
  const [period, setPeriod] = useState<Period>('today');

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
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

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['earnings', rider?.id, period],
    queryFn: async () => {
      if (!rider?.id) return { deliveries: [], total: 0, count: 0, avgPerDelivery: 0 };
      
      const dateStart = getDateRange();
      
      let query = supabase
        .from('delivery_assignments')
        .select('id, rider_earnings, delivery_fee, delivered_at, order:orders(order_number)')
        .eq('rider_id', rider.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false });

      if (dateStart) {
        query = query.gte('delivered_at', dateStart);
      }

      const { data } = await query;

      const deliveries = (data || []) as unknown as DeliveryEarning[];
      const total = deliveries.reduce((sum, d) => sum + (d.rider_earnings || d.delivery_fee || 0), 0);
      const avgPerDelivery = deliveries.length > 0 ? total / deliveries.length : 0;

      return {
        deliveries,
        total,
        count: deliveries.length,
        avgPerDelivery,
      };
    },
    enabled: !!rider?.id,
  });

  const periodOptions: { value: Period; label: string; icon: string }[] = [
    { value: 'today', label: 'Today', icon: '📅' },
    { value: 'week', label: 'This Week', icon: '📆' },
    { value: 'month', label: 'This Month', icon: '🗓️' },
    { value: 'all', label: 'All Time', icon: '⏰' },
  ];

  const periodLabels: Record<Period, string> = {
    today: "Today's",
    week: "This Week's",
    month: "This Month's",
    all: "Total",
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.primaryLight }}>
      {/* Header */}
      <div 
        className="px-5 py-6"
        style={{ backgroundColor: theme.primary }}
      >
        <h1 
          className="text-2xl font-bold mb-1"
          style={{ color: theme.textOnPrimary }}
        >
          Earnings
        </h1>
        <p 
          className="text-sm opacity-80"
          style={{ color: theme.textOnPrimary }}
        >
          Track your delivery income
        </p>
      </div>

      {/* Period Tabs */}
      <div className="px-5 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                period === opt.value 
                  ? 'shadow-sm' 
                  : 'bg-white/50 text-zinc-600'
              }`}
              style={period === opt.value ? { 
                backgroundColor: theme.primary, 
                color: theme.textOnPrimary 
              } : {}}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primary }} />
        </div>
      ) : (
        <div className="px-5 space-y-4">
          {/* Summary Card */}
          <div 
            className="rounded-2xl p-6 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
            }}
          >
            <p 
              className="text-sm font-medium opacity-80 mb-1"
              style={{ color: theme.textOnPrimary }}
            >
              {periodLabels[period]} Earnings
            </p>
            <p 
              className="text-4xl font-bold mb-6"
              style={{ color: theme.textOnPrimary }}
            >
              {formatCurrency(earnings?.total || 0, country)}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4" style={{ color: theme.textOnPrimary }} />
                  <span 
                    className="text-xs opacity-80"
                    style={{ color: theme.textOnPrimary }}
                  >
                    Deliveries
                  </span>
                </div>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: theme.textOnPrimary }}
                >
                  {earnings?.count || 0}
                </p>
              </div>
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" style={{ color: theme.textOnPrimary }} />
                  <span 
                    className="text-xs opacity-80"
                    style={{ color: theme.textOnPrimary }}
                  >
                    Avg/Delivery
                  </span>
                </div>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: theme.textOnPrimary }}
                >
                  {formatCurrency(earnings?.avgPerDelivery || 0, country)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryLight }}
                >
                  <Wallet className="w-5 h-5" style={{ color: theme.primaryDark }} />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Pending Payout</p>
                  <p className="text-lg font-bold text-zinc-900">
                    {formatCurrency(earnings?.total || 0, country)}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>
          </div>

          {/* Delivery History */}
          <div>
            <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              <Receipt className="w-5 h-5" style={{ color: theme.primary }} />
              Delivery History
            </h2>
            
            {earnings?.deliveries && earnings.deliveries.length > 0 ? (
              <div className="space-y-3">
                {earnings.deliveries.map((delivery: DeliveryEarning) => (
                  <div 
                    key={delivery.id} 
                    className="bg-white rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: theme.primaryLight }}
                        >
                          <Package className="w-5 h-5" style={{ color: theme.primaryDark }} />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">
                            Order #{delivery.order?.order_number?.slice(-6)}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {formatDate(delivery.delivered_at, 'short')}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-emerald-600 text-lg">
                        +{formatCurrency(delivery.rider_earnings || delivery.delivery_fee || 0, country)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: theme.primaryLight }}
                >
                  <Wallet className="w-8 h-8" style={{ color: theme.primaryDark }} />
                </div>
                <p className="font-semibold text-zinc-900 mb-1">No earnings yet</p>
                <p className="text-sm text-zinc-500">
                  Complete deliveries to start earning
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
