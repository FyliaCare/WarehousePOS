import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  Loader2,
  User,
  Package,
  CheckCircle,
  Clock,
  MessageCircle,
  Copy,
} from 'lucide-react';
import { formatCurrency, formatPhone, formatDate } from '@warehousepos/utils';
import type { CountryCode } from '@warehousepos/types';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Premium theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1400',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B41',
    accent: '#FFFFFF',
    textOnPrimary: '#FFFFFF',
  },
};

type DeliveryStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

interface DeliveryData {
  id: string;
  order_id: string;
  status: string;
  delivery_fee: number;
  rider_earnings: number;
  assigned_at: string;
  picked_up_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  delivery_notes?: string;
  order?: {
    order_number: string;
    total: number;
    notes?: string;
    items?: Array<{
      id: string;
      quantity: number;
      total: number;
      product?: { name: string };
    }>;
    customer?: {
      name: string;
      phone: string;
      address: string;
    };
    store?: {
      name: string;
      address?: string;
      phone?: string;
    };
  };
}

export function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { store } = useAuthStore();
  const country: CountryCode = (store as any)?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<DeliveryStatus | null>(null);

  const { data: delivery, isLoading } = useQuery<DeliveryData | null>({
    queryKey: ['delivery', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase
        .from('delivery_assignments')
        .select('*, order:orders(*, customer:customers(*), store:stores(*), items:order_items(*, product:products(name)))')
        .eq('id', id)
        .single();
      return data as DeliveryData | null;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: DeliveryStatus) => {
      if (!id || !delivery) return;
      
      const updates: Record<string, any> = { status };
      const now = new Date().toISOString();
      
      if (status === 'picked_up') {
        updates.picked_up_at = now;
      } else if (status === 'in_transit') {
        updates.in_transit_at = now;
      } else if (status === 'delivered') {
        updates.delivered_at = now;
      }

      const { error } = await supabase
        .from('delivery_assignments')
        .update(updates as never)
        .eq('id', id);

      if (error) throw error;

      // Also update order status
      if (status === 'delivered' && delivery.order_id) {
        await supabase
          .from('orders')
          .update({ status: 'delivered', delivery_status: 'delivered' } as never)
          .eq('id', delivery.order_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', id] });
      queryClient.invalidateQueries({ queryKey: ['active-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
      toast.success('Status updated!');
      setIsConfirmOpen(false);
      
      if (nextStatus === 'delivered') {
        navigate('/deliveries');
      }
    },
    onError: (error: any) => {
      toast.error('Failed to update status', { description: error.message });
    },
  });

  const handleStatusUpdate = (status: DeliveryStatus) => {
    setNextStatus(status);
    setIsConfirmOpen(true);
  };

  const confirmStatusUpdate = () => {
    if (nextStatus) {
      updateStatusMutation.mutate(nextStatus);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned': 
        return { label: 'Assigned', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', step: 1 };
      case 'picked_up': 
        return { label: 'Picked Up', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', step: 2 };
      case 'in_transit': 
        return { label: 'In Transit', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', step: 3 };
      case 'delivered': 
        return { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', step: 4 };
      case 'failed': 
        return { label: 'Failed', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', step: 0 };
      default: 
        return { label: status, color: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500', step: 0 };
    }
  };

  const getNextAction = () => {
    if (!delivery) return null;
    switch (delivery.status) {
      case 'assigned':
        return { label: 'Mark as Picked Up', status: 'picked_up' as DeliveryStatus, icon: Package };
      case 'picked_up':
        return { label: 'Start Delivery', status: 'in_transit' as DeliveryStatus, icon: Navigation };
      case 'in_transit':
        return { label: 'Complete Delivery', status: 'delivered' as DeliveryStatus, icon: CheckCircle };
      default:
        return null;
    }
  };

  const openMaps = () => {
    const address = delivery?.order?.customer?.address;
    if (address) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const callCustomer = () => {
    const phone = delivery?.order?.customer?.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const whatsappCustomer = () => {
    const phone = delivery?.order?.customer?.phone;
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const copyAddress = () => {
    const address = delivery?.order?.customer?.address;
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
        <p className="text-zinc-600 mb-4">Delivery not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(delivery.status);
  const nextAction = getNextAction();
  const steps = ['Assigned', 'Picked Up', 'In Transit', 'Delivered'];

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: theme.primaryLight }}>
      {/* Header */}
      <div 
        className="sticky top-0 px-5 py-4 z-10"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: theme.textOnPrimary }} />
          </button>
          <div className="flex-1">
            <h1 
              className="font-bold text-lg"
              style={{ color: theme.textOnPrimary }}
            >
              Order #{delivery.order?.order_number?.slice(-6)}
            </h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-5 py-4 bg-white">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNum = index + 1;
            const isCompleted = statusConfig.step >= stepNum;
            const isCurrent = statusConfig.step === stepNum;
            return (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted 
                        ? 'text-white' 
                        : 'bg-zinc-100 text-zinc-400'
                    }`}
                    style={isCompleted ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNum}
                  </div>
                  <p className={`text-xs mt-1 ${isCurrent ? 'font-medium text-zinc-900' : 'text-zinc-400'}`}>
                    {step}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`h-0.5 flex-1 mx-1 rounded ${
                      statusConfig.step > stepNum ? '' : 'bg-zinc-200'
                    }`}
                    style={statusConfig.step > stepNum ? { backgroundColor: theme.primary } : {}}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Customer Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <User className="w-6 h-6" style={{ color: theme.primaryDark }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-zinc-900">
                {delivery.order?.customer?.name || 'Customer'}
              </p>
              <p className="text-sm text-zinc-500">
                {formatPhone(delivery.order?.customer?.phone || '', country)}
              </p>
            </div>
          </div>

          {/* Address */}
          <div 
            className="p-3 rounded-xl mb-4 flex items-start gap-2"
            style={{ backgroundColor: theme.primaryLight }}
          >
            <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.primaryDark }} />
            <p className="text-sm text-zinc-700 flex-1">
              {delivery.order?.customer?.address || 'No address provided'}
            </p>
            <button onClick={copyAddress} className="p-1 hover:bg-white/50 rounded">
              <Copy className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={callCustomer}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <Phone className="w-5 h-5 text-zinc-600" />
              <span className="text-xs text-zinc-600">Call</span>
            </button>
            <button 
              onClick={whatsappCustomer}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-emerald-600">WhatsApp</span>
            </button>
            <button 
              onClick={openMaps}
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Navigation className="w-5 h-5" style={{ color: theme.primaryDark }} />
              <span className="text-xs" style={{ color: theme.primaryDark }}>Navigate</span>
            </button>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: theme.primary }} />
            Order Items
          </h2>
          <div className="space-y-3">
            {delivery.order?.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-700">
                  {item.product?.name} <span className="text-zinc-400">×{item.quantity}</span>
                </span>
                <span className="text-zinc-600 font-medium">
                  {formatCurrency(item.total, country)}
                </span>
              </div>
            ))}
          </div>
          <div 
            className="border-t mt-3 pt-3 flex justify-between"
            style={{ borderColor: theme.primaryMid }}
          >
            <span className="font-medium text-zinc-900">Total</span>
            <span className="font-bold" style={{ color: theme.primary }}>
              {formatCurrency(delivery.order?.total || 0, country)}
            </span>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: theme.primary }} />
            Delivery Info
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Your Earnings</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(delivery.rider_earnings || delivery.delivery_fee || 0, country)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Assigned</span>
              <span className="text-zinc-700">
                {formatDate(delivery.assigned_at, 'short')}
              </span>
            </div>
            {delivery.picked_up_at && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Picked Up</span>
                <span className="text-zinc-700">
                  {formatDate(delivery.picked_up_at, 'short')}
                </span>
              </div>
            )}
            {delivery.in_transit_at && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Started Transit</span>
                <span className="text-zinc-700">
                  {formatDate(delivery.in_transit_at, 'short')}
                </span>
              </div>
            )}
            {delivery.delivered_at && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Delivered</span>
                <span className="text-zinc-700">
                  {formatDate(delivery.delivered_at, 'short')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {delivery.order?.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h2 className="font-semibold text-amber-800 mb-2">📝 Notes</h2>
            <p className="text-sm text-amber-700">{delivery.order.notes}</p>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      {nextAction && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-zinc-100 safe-area-bottom">
          <button
            onClick={() => handleStatusUpdate(nextAction.status)}
            disabled={updateStatusMutation.isPending}
            className="w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ 
              backgroundColor: theme.primary, 
              color: theme.textOnPrimary,
            }}
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <nextAction.icon className="w-5 h-5" />
                {nextAction.label}
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && nextAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Confirm Update</h3>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to mark this delivery as <strong>{nextStatus?.replace('_', ' ')}</strong>?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="py-3 px-4 rounded-xl font-medium bg-zinc-100 text-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={updateStatusMutation.isPending}
                className="py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}