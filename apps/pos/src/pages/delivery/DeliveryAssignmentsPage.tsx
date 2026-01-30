import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { formatCurrency, timeAgo, formatPhone } from '@warehousepos/utils';
import {
  Truck,
  Package,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  X,
  Bike,
  Car,
  UserCheck,
  PackageCheck,
  Send,
  Star,
  RefreshCw,
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
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B40',
    accent: '#1A1A1A',
    textOnPrimary: '#FFFFFF',
  },
};

type DeliveryStatus = 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

interface DeliveryAssignment {
  id: string;
  order_id: string;
  rider_id?: string;
  status: DeliveryStatus;
  delivery_fee: number;
  rider_earnings: number;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  failure_reason?: string;
  created_at: string;
  order?: {
    order_number: string;
    total: number;
    customer_name?: string;
    customer_phone?: string;
    delivery_address?: string;
    notes?: string;
    created_at: string;
  };
  rider?: {
    id: string;
    name: string;
    phone: string;
    vehicle_type: string;
    rating: number;
    is_online: boolean;
  };
}

interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  is_active: boolean;
  is_online: boolean;
  status: 'available' | 'busy' | 'offline';
  rating: number;
  total_deliveries: number;
}

interface PendingOrder {
  id: string;
  order_number: string;
  total: number;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_zone_id?: string;
  notes?: string;
  created_at: string;
  delivery_zone?: {
    name: string;
    delivery_fee: number;
  };
}

const statusConfig: Record<DeliveryStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-zinc-600', bgColor: 'bg-zinc-100', icon: Clock },
  assigned: { label: 'Assigned', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: UserCheck },
  accepted: { label: 'Accepted', color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: CheckCircle },
  picked_up: { label: 'Picked Up', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Package },
  in_transit: { label: 'In Transit', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: PackageCheck },
  failed: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-zinc-500', bgColor: 'bg-zinc-100', icon: XCircle },
};

export default function DeliveryAssignmentsPage() {
  const { store, tenant } = useAuthStore();
  const queryClient = useQueryClient();
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  const theme = themes[country];
  
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');

  // Fetch delivery assignments
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['delivery-assignments', store?.id, statusFilter],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('delivery_assignments')
        .select(`
          *,
          order:orders(
            order_number,
            total,
            customer_name,
            customer_phone,
            delivery_address,
            notes,
            created_at
          ),
          rider:riders(id, name, phone, vehicle_type, rating, is_online)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DeliveryAssignment[];
    },
    enabled: !!store?.id,
  });

  // Fetch pending orders (need assignment)
  const { data: pendingOrders } = useQuery({
    queryKey: ['pending-delivery-orders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          customer_name,
          customer_phone,
          delivery_address,
          delivery_zone_id,
          notes,
          created_at,
          delivery_zone:delivery_zones(name, delivery_fee)
        `)
        .eq('store_id', store.id)
        .eq('fulfillment_type', 'delivery')
        .is('rider_id', null)
        .not('status', 'in', '("cancelled","delivered")')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Transform the data to match PendingOrder type
      return (data || []).map((item: any) => ({
        ...item,
        delivery_zone: item.delivery_zone?.[0] || { name: '', delivery_fee: 0 }
      })) as PendingOrder[];
    },
    enabled: !!store?.id,
  });

  // Fetch available riders
  const { data: riders } = useQuery({
    queryKey: ['available-riders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Rider[];
    },
    enabled: !!store?.id,
  });

  // Assign rider mutation
  const assignRider = useMutation({
    mutationFn: async ({ orderId, riderId, fee }: { orderId: string; riderId: string; fee: number }) => {
      if (!store?.id) throw new Error('Store not found');
      
      const riderEarnings = fee * 0.7; // 70% commission
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .insert({
          store_id: store.id,
          order_id: orderId,
          rider_id: riderId,
          status: 'assigned',
          delivery_fee: fee,
          rider_earnings: riderEarnings,
          assigned_at: new Date().toISOString(),
        } as never)
        .select()
        .single();

      if (error) throw error;

      // Update order with rider
      await supabase
        .from('orders')
        .update({ 
          rider_id: riderId, 
          delivery_status: 'assigned' 
        } as never)
        .eq('id', orderId);

      // Update rider status
      await supabase
        .from('riders')
        .update({ status: 'busy' } as never)
        .eq('id', riderId);

      return data;
    },
    onSuccess: () => {
      toast.success('Rider assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['delivery-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['pending-delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['available-riders'] });
      setShowAssignModal(false);
      setSelectedOrder(null);
      setSelectedRiderId('');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, data = {} }: { id: string; status: DeliveryStatus; data?: any }) => {
      const now = new Date().toISOString();
      const updates: any = { status, ...data };
      
      if (status === 'picked_up') updates.picked_up_at = now;
      if (status === 'in_transit') updates.in_transit_at = now;
      if (status === 'delivered') updates.delivered_at = now;
      if (status === 'failed') updates.failed_at = now;

      const { error } = await supabase
        .from('delivery_assignments')
        .update(updates as never)
        .eq('id', id);

      if (error) throw error;

      // Update order delivery status
      const assignment = assignments?.find(a => a.id === id);
      if (assignment?.order_id) {
        await supabase
          .from('orders')
          .update({ delivery_status: status } as never)
          .eq('id', assignment.order_id);
      }

      // If completed, free up rider
      if (['delivered', 'failed', 'cancelled'].includes(status) && assignment?.rider_id) {
        await supabase
          .from('riders')
          .update({ status: 'available' } as never)
          .eq('id', assignment.rider_id);
      }
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['delivery-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['available-riders'] });
      setSelectedAssignment(null);
    },
  });

  // Stats
  const stats = {
    pending: assignments?.filter(a => a.status === 'pending').length || 0,
    inProgress: assignments?.filter(a => ['assigned', 'accepted', 'picked_up', 'in_transit'].includes(a.status)).length || 0,
    completed: assignments?.filter(a => a.status === 'delivered').length || 0,
    failed: assignments?.filter(a => a.status === 'failed').length || 0,
  };

  const availableRiders = riders?.filter(r => r.status === 'available' || !r.is_online) || [];

  // Filter assignments
  const filteredAssignments = assignments?.filter((assignment) => {
    if (!searchQuery) return true;
    const orderNum = assignment.order?.order_number?.toLowerCase() || '';
    const customerName = assignment.order?.customer_name?.toLowerCase() || '';
    const riderName = assignment.rider?.name?.toLowerCase() || '';
    return (
      orderNum.includes(searchQuery.toLowerCase()) ||
      customerName.includes(searchQuery.toLowerCase()) ||
      riderName.includes(searchQuery.toLowerCase())
    );
  });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motorcycle': return Bike;
      case 'bicycle': return Bike;
      case 'car': return Car;
      default: return Bike;
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
            <h1 
              className="text-2xl font-bold"
              style={{ color: theme.textOnPrimary }}
            >
              Delivery Dispatch
            </h1>
            <p 
              className="text-sm opacity-80 mt-1"
              style={{ color: theme.textOnPrimary }}
            >
              Manage orders and rider assignments
            </p>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['delivery-assignments'] })}
            className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          >
            <RefreshCw className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 -mt-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-zinc-100">
            <p className="text-xs text-zinc-500">Awaiting</p>
            <p className="text-xl font-bold text-amber-600">{pendingOrders?.length || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-zinc-100">
            <p className="text-xs text-zinc-500">In Progress</p>
            <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-zinc-100">
            <p className="text-xs text-zinc-500">Completed</p>
            <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-zinc-100">
            <p className="text-xs text-zinc-500">Riders</p>
            <p className="text-xl font-bold" style={{ color: theme.primary }}>
              {availableRiders.length}/{riders?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Orders Section */}
      {pendingOrders && pendingOrders.length > 0 && (
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Orders Awaiting Assignment ({pendingOrders.length})
          </h2>
          <div className="space-y-2">
            {pendingOrders.slice(0, 5).map((order) => (
              <div 
                key={order.id}
                className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">#{order.order_number}</p>
                    <p className="text-xs text-zinc-500">
                      {order.customer_name} • {order.delivery_zone?.name || 'No zone'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: theme.primary }}>
                      {formatCurrency(order.delivery_zone?.delivery_fee || 0, country)}
                    </p>
                    <p className="text-xs text-zinc-400">{timeAgo(order.created_at)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowAssignModal(true);
                    }}
                    className="px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1"
                    style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
                  >
                    <Send className="w-4 h-4" />
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search orders, riders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': theme.primary } as any}
            />
          </div>
        </div>
        
        {/* Status Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'in_transit', label: 'In Transit' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'failed', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.value ? 'shadow-sm' : 'bg-white text-zinc-600'
              }`}
              style={statusFilter === tab.value ? { 
                backgroundColor: theme.primary, 
                color: theme.textOnPrimary 
              } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments List */}
      <div className="px-6 pb-6">
        {loadingAssignments ? (
          <div className="flex items-center justify-center py-20">
            <div 
              className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.primary }}
            />
          </div>
        ) : filteredAssignments && filteredAssignments.length > 0 ? (
          <div className="space-y-3">
            {filteredAssignments.map((assignment) => {
              const config = statusConfig[assignment.status];
              const StatusIcon = config.icon;
              const VehicleIcon = assignment.rider ? getVehicleIcon(assignment.rider.vehicle_type) : Bike;
              
              return (
                <div 
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(assignment)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: theme.primaryLight }}
                      >
                        <Package className="w-5 h-5" style={{ color: theme.primaryDark }} />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">
                          #{assignment.order?.order_number}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {assignment.order?.customer_name || 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.bgColor} ${config.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {assignment.order?.delivery_address?.slice(0, 30) || 'No address'}...
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {timeAgo(assignment.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    {assignment.rider ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                          <VehicleIcon className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{assignment.rider.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs text-zinc-500">{assignment.rider.rating?.toFixed(1) || '5.0'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400">No rider assigned</span>
                    )}
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: theme.primary }}>
                        {formatCurrency(assignment.delivery_fee, country)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Rider: {formatCurrency(assignment.rider_earnings, country)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Truck className="w-8 h-8" style={{ color: theme.primaryDark }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No Deliveries</h3>
            <p className="text-zinc-500">Delivery assignments will appear here</p>
          </div>
        )}
      </div>

      {/* Assign Rider Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div 
              className="sticky top-0 px-6 py-4 border-b border-zinc-100 flex items-center justify-between"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <div>
                <h2 className="text-lg font-bold" style={{ color: theme.primaryDark }}>
                  Assign Rider
                </h2>
                <p className="text-sm opacity-80" style={{ color: theme.primaryDark }}>
                  Order #{selectedOrder.order_number}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrder(null);
                  setSelectedRiderId('');
                }}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: theme.primaryDark }} />
              </button>
            </div>

            <div className="p-6">
              {/* Order Details */}
              <div className="bg-zinc-50 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-900">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-zinc-500">{selectedOrder.delivery_address}</p>
                    {selectedOrder.customer_phone && (
                      <p className="text-sm text-zinc-400 mt-1">
                        {formatPhone(selectedOrder.customer_phone, country)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200">
                  <span className="text-sm text-zinc-500">Delivery Fee</span>
                  <span className="font-semibold" style={{ color: theme.primary }}>
                    {formatCurrency(selectedOrder.delivery_zone?.delivery_fee || 0, country)}
                  </span>
                </div>
              </div>

              {/* Rider Selection */}
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Select Rider ({availableRiders.length} available)
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {riders?.map((rider) => {
                  const isAvailable = rider.status === 'available';
                  const VehicleIcon = getVehicleIcon(rider.vehicle_type);
                  
                  return (
                    <button
                      key={rider.id}
                      onClick={() => setSelectedRiderId(rider.id)}
                      disabled={!isAvailable}
                      className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                        selectedRiderId === rider.id 
                          ? 'border-2' 
                          : isAvailable 
                            ? 'border-zinc-200 hover:border-zinc-300' 
                            : 'border-zinc-100 opacity-50'
                      }`}
                      style={selectedRiderId === rider.id ? { 
                        borderColor: theme.primary,
                        backgroundColor: theme.primaryLight,
                      } : {}}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          backgroundColor: isAvailable ? theme.primaryLight : '#F4F4F5'
                        }}
                      >
                        <VehicleIcon 
                          className="w-5 h-5" 
                          style={{ color: isAvailable ? theme.primaryDark : '#A1A1AA' }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-zinc-900">{rider.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-zinc-500">{rider.rating?.toFixed(1) || '5.0'}</span>
                          <span className="text-zinc-300">•</span>
                          <span className="text-zinc-500">{rider.total_deliveries} deliveries</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {isAvailable ? 'Available' : rider.status}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedOrder(null);
                    setSelectedRiderId('');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedRiderId && selectedOrder) {
                      assignRider.mutate({
                        orderId: selectedOrder.id,
                        riderId: selectedRiderId,
                        fee: selectedOrder.delivery_zone?.delivery_fee || 0,
                      });
                    }
                  }}
                  disabled={!selectedRiderId || assignRider.isPending}
                  className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
                >
                  {assignRider.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Assign Rider
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div 
              className="sticky top-0 px-6 py-4 border-b border-zinc-100 flex items-center justify-between"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <div>
                <h2 className="text-lg font-bold" style={{ color: theme.primaryDark }}>
                  Delivery Details
                </h2>
                <p className="text-sm opacity-80" style={{ color: theme.primaryDark }}>
                  Order #{selectedAssignment.order?.order_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: theme.primaryDark }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-zinc-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Customer
                </h3>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-900">
                      {selectedAssignment.order?.customer_name || 'Customer'}
                    </p>
                    {selectedAssignment.order?.customer_phone && (
                      <a 
                        href={`tel:${selectedAssignment.order.customer_phone}`}
                        className="text-sm text-zinc-500 flex items-center gap-1 mt-1 hover:text-zinc-700"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {formatPhone(selectedAssignment.order.customer_phone, country)}
                      </a>
                    )}
                  </div>
                </div>
                {selectedAssignment.order?.delivery_address && (
                  <div className="flex items-start gap-3 mt-3 pt-3 border-t border-zinc-200">
                    <MapPin className="w-5 h-5 text-zinc-400 mt-0.5" />
                    <p className="text-sm text-zinc-600">{selectedAssignment.order.delivery_address}</p>
                  </div>
                )}
              </div>

              {/* Rider Info */}
              {selectedAssignment.rider && (
                <div className="bg-zinc-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Rider
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: theme.primaryLight }}
                      >
                        {(() => {
                          const VehicleIcon = getVehicleIcon(selectedAssignment.rider.vehicle_type);
                          return <VehicleIcon className="w-5 h-5" style={{ color: theme.primaryDark }} />;
                        })()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{selectedAssignment.rider.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-sm text-zinc-500">
                            {selectedAssignment.rider.rating?.toFixed(1) || '5.0'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedAssignment.rider.phone}`}
                      className="p-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-zinc-600" />
                    </a>
                  </div>
                </div>
              )}

              {/* Earnings */}
              <div className="bg-zinc-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Delivery Fee</span>
                  <span className="font-semibold" style={{ color: theme.primary }}>
                    {formatCurrency(selectedAssignment.delivery_fee, country)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-zinc-600">Rider Earnings</span>
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(selectedAssignment.rider_earnings, country)}
                  </span>
                </div>
              </div>

              {/* Status Actions */}
              {!['delivered', 'failed', 'cancelled'].includes(selectedAssignment.status) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                    Update Status
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAssignment.status === 'assigned' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: selectedAssignment.id, status: 'accepted' })}
                        className="py-2.5 px-4 rounded-xl font-medium bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                      >
                        Mark Accepted
                      </button>
                    )}
                    {['assigned', 'accepted'].includes(selectedAssignment.status) && (
                      <button
                        onClick={() => updateStatus.mutate({ id: selectedAssignment.id, status: 'picked_up' })}
                        className="py-2.5 px-4 rounded-xl font-medium bg-amber-100 text-amber-700 hover:bg-amber-200"
                      >
                        Mark Picked Up
                      </button>
                    )}
                    {selectedAssignment.status === 'picked_up' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: selectedAssignment.id, status: 'in_transit' })}
                        className="py-2.5 px-4 rounded-xl font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        Start Transit
                      </button>
                    )}
                    {selectedAssignment.status === 'in_transit' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: selectedAssignment.id, status: 'delivered' })}
                        className="py-2.5 px-4 rounded-xl font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      >
                        Mark Delivered
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for failure?');
                        if (reason) {
                          updateStatus.mutate({ 
                            id: selectedAssignment.id, 
                            status: 'failed',
                            data: { failure_reason: reason }
                          });
                        }
                      }}
                      className="py-2.5 px-4 rounded-xl font-medium bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Mark Failed
                    </button>
                  </div>
                </div>
              )}

              {/* Failure Reason */}
              {selectedAssignment.failure_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-red-700">Failure Reason:</p>
                  <p className="text-sm text-red-600 mt-1">{selectedAssignment.failure_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
