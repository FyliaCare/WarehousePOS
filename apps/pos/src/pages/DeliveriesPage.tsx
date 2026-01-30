import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { formatCurrency, timeAgo } from '@warehousepos/utils';
import {
  Truck,
  Package,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  X,
  Navigation,
  Bike,
  UserCheck,
  PackageCheck,
} from 'lucide-react';
import type { CountryCode } from '@warehousepos/types';

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

export default function DeliveriesPage() {
  const { store, tenant } = useAuthStore();
  const queryClient = useQueryClient();
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  const theme = themes[country];
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries', store?.id, statusFilter],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          order:orders(
            order_number,
            customer_name,
            customer_phone,
            total,
            delivery_address
          ),
          rider:riders(name, phone)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: riders } = useQuery({
    queryKey: ['riders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['pending-delivery-orders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .eq('delivery_type', 'delivery')
        .eq('status', 'ready')
        .is('rider_id', null);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const assignRider = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId, rider_id: riderId }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Rider assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['pending-delivery-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Stats
  const totalDeliveries = deliveries?.length || 0;
  const pendingCount = deliveries?.filter((d: any) => d.status === 'pending').length || 0;
  const inTransitCount = deliveries?.filter((d: any) => ['assigned', 'picked_up', 'in_transit'].includes(d.status)).length || 0;
  const deliveredCount = deliveries?.filter((d: any) => d.status === 'delivered').length || 0;
  const failedCount = deliveries?.filter((d: any) => d.status === 'failed').length || 0;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; dot: string; icon: any }> = {
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: Clock },
      assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: UserCheck },
      picked_up: { label: 'Picked Up', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: PackageCheck },
      in_transit: { label: 'In Transit', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', icon: Truck },
      delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: XCircle },
    };
    return configs[status] || { label: status, color: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500', icon: Package };
  };

  // Filter deliveries by search
  const filteredDeliveries = deliveries?.filter((d: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      d.order?.order_number?.toLowerCase().includes(search) ||
      d.order?.customer_name?.toLowerCase().includes(search) ||
      d.rider?.name?.toLowerCase().includes(search)
    );
  });

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
              Deliveries
            </h1>
            <p className="text-sm mt-0.5 opacity-80" style={{ color: theme.textOnPrimary }}>
              Track and manage order deliveries
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingOrders && pendingOrders.length > 0 && (
              <span 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-white/20"
                style={{ color: theme.textOnPrimary }}
              >
                <AlertTriangle className="w-4 h-4" />
                {pendingOrders.length} awaiting assignment
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
              <Truck className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total</p>
              <p className="text-lg font-bold text-zinc-900">{totalDeliveries}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Pending</p>
              <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <Navigation className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">In Transit</p>
              <p className="text-lg font-bold text-blue-600">{inTransitCount}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Delivered</p>
              <p className="text-lg font-bold text-emerald-600">{deliveredCount}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Failed</p>
              <p className="text-lg font-bold text-red-600">{failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders for Assignment */}
      {pendingOrders && pendingOrders.length > 0 && (
        <div className="px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">
                Orders Ready for Delivery ({pendingOrders.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg p-4 border border-amber-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-zinc-900">{order.order_number}</p>
                      <p className="text-sm text-zinc-600">{order.customer_name}</p>
                    </div>
                    <p className="font-bold text-sm" style={{ color: theme.accent }}>
                      {formatCurrency(order.total, country)}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3 flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{order.delivery_address}</span>
                  </p>
                  <select
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        assignRider.mutate({ orderId: order.id, riderId: e.target.value });
                      }
                    }}
                  >
                    <option value="">Select Rider...</option>
                    {riders?.map((rider: any) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by order, customer, or rider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-zinc-200">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'failed', label: 'Failed' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  statusFilter === option.value
                    ? 'text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
                style={statusFilter === option.value ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deliveries List */}
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
                </div>
              </div>
            ))}
          </div>
        ) : filteredDeliveries && filteredDeliveries.length > 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="col-span-3">Order</div>
              <div className="col-span-3">Customer & Address</div>
              <div className="col-span-2">Rider</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            
            {/* Table Body */}
            {filteredDeliveries.map((delivery: any) => {
              const status = getStatusConfig(delivery.status);
              const StatusIcon = status.icon;
              return (
                <div
                  key={delivery.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-zinc-100 last:border-0 items-center hover:bg-zinc-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  {/* Order Info */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: theme.primaryLight }}
                    >
                      <Package className="w-5 h-5" style={{ color: theme.accent }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-zinc-900">{delivery.order?.order_number}</p>
                      <p className="text-xs text-zinc-500">{timeAgo(delivery.created_at)}</p>
                    </div>
                  </div>
                  
                  {/* Customer & Address */}
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-zinc-900">{delivery.order?.customer_name}</p>
                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                      {delivery.delivery_address || delivery.order?.delivery_address}
                    </p>
                  </div>
                  
                  {/* Rider */}
                  <div className="col-span-2">
                    {delivery.rider ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center">
                          <Bike className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-900">{delivery.rider.name}</p>
                          <p className="text-xs text-zinc-500">{delivery.rider.phone}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400">Not assigned</span>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-2 flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  
                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <p className="font-bold text-sm" style={{ color: theme.accent }}>
                      {formatCurrency(delivery.order?.total || 0, country)}
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
              <Truck className="w-8 h-8" style={{ color: theme.accent }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No deliveries found</h3>
            <p className="text-sm text-zinc-500">
              {statusFilter !== 'all' ? `No ${statusFilter} deliveries` : 'Deliveries will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Delivery Detail Slide Panel */}
      {selectedDelivery && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setSelectedDelivery(null)}
          />
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden"
            style={{ animation: 'slideInFromRight 0.3s ease-out' }}
          >
            {/* Panel Header */}
            <div 
              className="px-6 py-5 border-b"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <button
                onClick={() => setSelectedDelivery(null)}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primary }}
                >
                  <Truck className="w-7 h-7" style={{ color: theme.textOnPrimary }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedDelivery.order?.order_number}</h2>
                  <p className="text-sm text-zinc-500">{timeAgo(selectedDelivery.created_at)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto h-[calc(100%-100px)] space-y-5">
              {/* Status */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
                <p className="text-xs text-zinc-500 mb-2">Delivery Status</p>
                {(() => {
                  const status = getStatusConfig(selectedDelivery.status);
                  const StatusIcon = status.icon;
                  return (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                  );
                })()}
              </div>

              {/* Customer Info */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Customer</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="text-sm text-zinc-700">{selectedDelivery.order?.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="text-sm text-zinc-700">{selectedDelivery.order?.customer_phone}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="text-sm text-zinc-700">
                      {selectedDelivery.delivery_address || selectedDelivery.order?.delivery_address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rider Info */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Delivery Rider</h3>
                {selectedDelivery.rider ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
                      <Bike className="w-6 h-6 text-zinc-600" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{selectedDelivery.rider.name}</p>
                      <p className="text-sm text-zinc-500">{selectedDelivery.rider.phone}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No rider assigned yet</p>
                )}
              </div>

              {/* Order Total */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Order Total</span>
                  <span className="text-xl font-bold" style={{ color: theme.accent }}>
                    {formatCurrency(selectedDelivery.order?.total || 0, country)}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              {selectedDelivery.status !== 'pending' && (
                <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-3">Delivery Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm text-zinc-700">Order created</span>
                      <span className="text-xs text-zinc-400 ml-auto">
                        {new Date(selectedDelivery.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {selectedDelivery.assigned_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-zinc-700">Rider assigned</span>
                        <span className="text-xs text-zinc-400 ml-auto">
                          {new Date(selectedDelivery.assigned_at).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    {selectedDelivery.picked_up_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-sm text-zinc-700">Package picked up</span>
                        <span className="text-xs text-zinc-400 ml-auto">
                          {new Date(selectedDelivery.picked_up_at).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    {selectedDelivery.delivered_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm text-zinc-700">Delivered</span>
                        <span className="text-xs text-zinc-400 ml-auto">
                          {new Date(selectedDelivery.delivered_at).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
