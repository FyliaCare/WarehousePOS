import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, MapPin, ChevronRight, Search, CheckCircle, Navigation, AlertCircle } from 'lucide-react';
import { formatCurrency, timeAgo } from '@warehousepos/utils';
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

type DeliveryStatus = 'all' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export function DeliveriesPage() {
  const { rider, store } = useAuthStore();
  const country: CountryCode = (store as any)?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries', rider?.id, statusFilter],
    queryFn: async () => {
      if (!rider?.id) return [];
      
      let query = supabase
        .from('delivery_assignments')
        .select('*, order:orders(*, customer:customers(name, phone, address))')
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query.limit(50);
      return data || [];
    },
    enabled: !!rider?.id,
  });

  const filteredDeliveries = deliveries?.filter((d: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      d.order?.order_number?.toLowerCase().includes(search) ||
      d.order?.customer?.name?.toLowerCase().includes(search) ||
      d.order?.customer?.phone?.includes(search)
    );
  });

  const statusTabs: { value: DeliveryStatus; label: string; icon: any }[] = [
    { value: 'all', label: 'All', icon: Package },
    { value: 'assigned', label: 'New', icon: AlertCircle },
    { value: 'picked_up', label: 'Picked', icon: Package },
    { value: 'in_transit', label: 'Transit', icon: Navigation },
    { value: 'delivered', label: 'Done', icon: CheckCircle },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned': 
        return { label: 'New', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
      case 'picked_up': 
        return { label: 'Picked Up', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
      case 'in_transit': 
        return { label: 'In Transit', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' };
      case 'delivered': 
        return { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
      case 'failed': 
        return { label: 'Failed', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
      case 'cancelled': 
        return { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500' };
      default: 
        return { label: status, color: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500' };
    }
  };

  // Count by status
  const counts = {
    all: deliveries?.length || 0,
    assigned: deliveries?.filter((d: any) => d.status === 'assigned').length || 0,
    picked_up: deliveries?.filter((d: any) => d.status === 'picked_up').length || 0,
    in_transit: deliveries?.filter((d: any) => d.status === 'in_transit').length || 0,
    delivered: deliveries?.filter((d: any) => d.status === 'delivered').length || 0,
    failed: deliveries?.filter((d: any) => d.status === 'failed').length || 0,
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.primaryLight }}>
      {/* Header */}
      <div 
        className="px-5 pt-6 pb-4"
        style={{ backgroundColor: theme.primary }}
      >
        <h1 
          className="text-2xl font-bold mb-4"
          style={{ color: theme.textOnPrimary }}
        >
          Deliveries
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white shadow-sm text-sm outline-none"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="px-5 py-3 -mt-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count = counts[tab.value];
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'shadow-sm'
                    : 'bg-white/60 text-zinc-600 hover:bg-white'
                }`}
                style={isActive ? { 
                  backgroundColor: theme.primary, 
                  color: theme.textOnPrimary 
                } : {}}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span 
                    className={`px-1.5 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-white/30' : 'bg-zinc-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 space-y-3">
        {isLoading ? (
          // Skeleton Loading
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 rounded w-24" />
                    <div className="h-3 bg-zinc-100 rounded w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDeliveries && filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery: any) => {
            const statusConfig = getStatusConfig(delivery.status);
            return (
              <Link 
                key={delivery.id} 
                to={`/deliveries/${delivery.id}`}
                className="block"
              >
                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: theme.primaryLight }}
                    >
                      <Package className="w-6 h-6" style={{ color: theme.primaryDark }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-zinc-900">
                          #{delivery.order?.order_number?.slice(-6)}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-zinc-500 mb-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {delivery.order?.customer?.address || 'No address'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-400">
                          {delivery.order?.customer?.name} • {timeAgo(delivery.created_at)}
                        </p>
                        <p className="font-semibold" style={{ color: theme.primaryDark }}>
                          {formatCurrency(delivery.order?.total || 0, country)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 flex-shrink-0 mt-4" />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Package className="w-8 h-8" style={{ color: theme.primaryDark }} />
            </div>
            <p className="font-medium text-zinc-900 mb-1">No deliveries found</p>
            <p className="text-sm text-zinc-500">
              {statusFilter === 'all' 
                ? "You don't have any deliveries yet" 
                : `No ${statusFilter.replace('_', ' ')} deliveries`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
