import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@warehousepos/utils';
import { Link } from 'react-router-dom';
import {
  Truck,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  ChevronRight,
  Bike,
  Navigation,
  AlertTriangle,
} from 'lucide-react';
import type { CountryCode } from '@warehousepos/types';

// Theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    textOnPrimary: '#1A1A1A',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B40',
    textOnPrimary: '#FFFFFF',
  },
};

interface DeliveryStats {
  pendingCount: number;
  inProgressCount: number;
  completedToday: number;
  failedToday: number;
  totalRevenueToday: number;
  averageDeliveryTime: number;
  availableRiders: number;
  busyRiders: number;
  totalRiders: number;
}

export function DeliveryDashboardWidget() {
  const { store, tenant } = useAuthStore();
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  const theme = themes[country];

  // Fetch delivery stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['delivery-dashboard-stats', store?.id],
    queryFn: async (): Promise<DeliveryStats> => {
      if (!store?.id) {
        return {
          pendingCount: 0,
          inProgressCount: 0,
          completedToday: 0,
          failedToday: 0,
          totalRevenueToday: 0,
          averageDeliveryTime: 0,
          availableRiders: 0,
          busyRiders: 0,
          totalRiders: 0,
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch pending orders needing assignment
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('order_type', 'delivery')
        .in('status', ['pending', 'processing']);

      // Fetch in-progress deliveries through orders
      const { count: inProgressCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('order_type', 'delivery')
        .in('status', ['ready', 'out_for_delivery']);

      // Fetch today's completed deliveries
      const { data: completedData } = await supabase
        .from('orders')
        .select('delivery_fee')
        .eq('store_id', store.id)
        .eq('order_type', 'delivery')
        .eq('status', 'delivered')
        .gte('updated_at', todayISO);

      const completedToday = completedData?.length || 0;
      const totalRevenueToday = completedData?.reduce((sum, d) => sum + (d.delivery_fee || 0), 0) || 0;

      // Fetch today's failed/cancelled deliveries
      const { count: failedToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('order_type', 'delivery')
        .eq('status', 'cancelled')
        .gte('updated_at', todayISO);

      // Fetch rider stats
      const { data: riders } = await supabase
        .from('riders')
        .select('status, is_active')
        .eq('store_id', store.id)
        .eq('is_active', true);

      const totalRiders = riders?.length || 0;
      const availableRiders = riders?.filter(r => r.status === 'available').length || 0;
      const busyRiders = riders?.filter(r => r.status === 'busy').length || 0;

      return {
        pendingCount: pendingCount || 0,
        inProgressCount: inProgressCount || 0,
        completedToday,
        failedToday: failedToday || 0,
        totalRevenueToday,
        averageDeliveryTime: 25, // TODO: Calculate from actual data
        availableRiders,
        busyRiders,
        totalRiders,
      };
    },
    enabled: !!store?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 animate-pulse">
        <div className="h-6 bg-zinc-200 rounded w-40 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const successRate = stats && (stats.completedToday + stats.failedToday) > 0
    ? ((stats.completedToday / (stats.completedToday + stats.failedToday)) * 100).toFixed(0)
    : '100';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div 
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: theme.primaryLight }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.primary }}
          >
            <Truck className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">Delivery Overview</h3>
            <p className="text-sm text-zinc-500">Today's delivery performance</p>
          </div>
        </div>
        <Link
          to="/deliveries/dispatch"
          className="flex items-center gap-1 text-sm font-medium hover:underline"
          style={{ color: theme.primaryDark }}
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Pending Assignment */}
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">Awaiting</span>
            </div>
            <p className="text-2xl font-bold text-amber-800">{stats?.pendingCount || 0}</p>
            {(stats?.pendingCount || 0) > 0 && (
              <Link 
                to="/deliveries/dispatch"
                className="text-xs text-amber-600 hover:underline mt-1 block"
              >
                Assign riders →
              </Link>
            )}
          </div>

          {/* In Progress */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{stats?.inProgressCount || 0}</p>
            <p className="text-xs text-blue-600 mt-1">Currently active</p>
          </div>

          {/* Completed Today */}
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">Completed</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800">{stats?.completedToday || 0}</p>
            <p className="text-xs text-emerald-600 mt-1">{successRate}% success rate</p>
          </div>

          {/* Revenue */}
          <div 
            className="rounded-xl p-4"
            style={{ backgroundColor: theme.primaryLight }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: theme.primaryDark }} />
              <span className="text-sm" style={{ color: theme.primaryDark }}>Revenue</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: theme.primaryDark }}>
              {formatCurrency(stats?.totalRevenueToday || 0, country)}
            </p>
            <p className="text-xs mt-1" style={{ color: theme.primaryDark }}>
              From deliveries
            </p>
          </div>
        </div>

        {/* Rider Status */}
        <div className="border-t border-zinc-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-zinc-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Rider Status
            </h4>
            <Link 
              to="/riders"
              className="text-sm hover:underline"
              style={{ color: theme.primary }}
            >
              Manage
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Available */}
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-700">
                {stats?.availableRiders || 0} Available
              </span>
            </div>
            
            {/* Busy */}
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
              <Bike className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {stats?.busyRiders || 0} Busy
              </span>
            </div>
            
            {/* Total */}
            <div className="flex items-center gap-2 bg-zinc-100 px-3 py-2 rounded-lg">
              <span className="text-sm text-zinc-600">
                {stats?.totalRiders || 0} Total
              </span>
            </div>
          </div>

          {/* Warning if no riders available */}
          {stats && stats.pendingCount > 0 && stats.availableRiders === 0 && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">No riders available. {stats.pendingCount} orders waiting.</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-100">
          <Link
            to="/deliveries/dispatch"
            className="flex-1 py-2.5 rounded-xl font-medium text-center transition-colors"
            style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
          >
            Dispatch Center
          </Link>
          <Link
            to="/deliveries/zones"
            className="flex-1 py-2.5 rounded-xl font-medium text-center bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            Manage Zones
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DeliveryDashboardWidget;
