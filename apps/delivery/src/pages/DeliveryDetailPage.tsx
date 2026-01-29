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
} from 'lucide-react';
import { Card, Badge, Button, Modal } from '@warehousepos/ui';
import { formatCurrency, formatPhone, formatDate } from '@warehousepos/utils';
import type { CountryCode, DeliveryStatus } from '@warehousepos/types';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DeliveryData {
  id: string;
  order_id: string;
  status: string;
  delivery_fee: number;
  assigned_at: string;
  picked_up_at?: string;
  delivered_at?: string;
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
  };
}

export function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { store } = useAuthStore();
  const country: CountryCode = store?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<DeliveryStatus | null>(null);

  const { data: delivery, isLoading } = useQuery<DeliveryData | null>({
    queryKey: ['delivery', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase
        .from('delivery_assignments')
        .select('*, order:orders(*, customer:customers(*), items:order_items(*, product:products(name)))')
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
      
      if (status === 'picked_up') {
        updates.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
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

  const getStatusColor = (status: string): 'warning' | 'info' | 'default' | 'success' | 'secondary' => {
    switch (status) {
      case 'assigned': return 'warning';
      case 'picked_up': return 'info';
      case 'in_transit': return 'default';
      case 'delivered': return 'success';
      default: return 'secondary';
    }
  };

  const getNextAction = () => {
    if (!delivery) return null;
    switch (delivery.status) {
      case 'assigned':
        return { label: 'Mark as Picked Up', status: 'picked_up' as DeliveryStatus };
      case 'picked_up':
        return { label: 'Start Delivery', status: 'in_transit' as DeliveryStatus };
      case 'in_transit':
        return { label: 'Complete Delivery', status: 'delivered' as DeliveryStatus };
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

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-4 text-center">
        <p>Delivery not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const nextAction = getNextAction();

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border p-4 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">
              Order #{delivery.order?.order_number?.slice(-6)}
            </h1>
            <Badge variant={getStatusColor(delivery.status)}>
              {delivery.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <Card className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {delivery.order?.customer?.name || 'Customer'}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatPhone(delivery.order?.customer?.phone || '', country)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg mb-3">
            <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              {delivery.order?.customer?.address || 'No address provided'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={callCustomer}>
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" className="flex-1" onClick={openMaps}>
              <Navigation className="w-4 h-4 mr-2" />
              Navigate
            </Button>
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-3">Order Items</h2>
          <div className="space-y-3">
            {delivery.order?.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.product?.name} × {item.quantity}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(item.total, country)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="text-primary">
                {formatCurrency(delivery.order?.total || 0, country)}
              </span>
            </div>
          </div>
        </Card>

        {/* Delivery Info */}
        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-3">Delivery Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="text-foreground">
                {formatCurrency(delivery.delivery_fee || 0, country)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assigned At</span>
              <span className="text-foreground">
                {formatDate(delivery.assigned_at, 'short')}
              </span>
            </div>
            {delivery.picked_up_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Picked Up At</span>
                <span className="text-foreground">
                  {formatDate(delivery.picked_up_at, 'short')}
                </span>
              </div>
            )}
            {delivery.delivered_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivered At</span>
                <span className="text-foreground">
                  {formatDate(delivery.delivered_at, 'short')}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Notes */}
        {delivery.order?.notes && (
          <Card className="p-4">
            <h2 className="font-semibold text-foreground mb-2">Notes</h2>
            <p className="text-sm text-muted-foreground">{delivery.order.notes}</p>
          </Card>
        )}
      </div>

      {/* Action Button */}
      {nextAction && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            className="w-full h-14 text-lg"
            onClick={() => handleStatusUpdate(nextAction.status)}
          >
            {nextAction.label}
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Confirm Action"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to{' '}
            {nextStatus === 'picked_up'
              ? 'mark this order as picked up'
              : nextStatus === 'in_transit'
              ? 'start the delivery'
              : 'complete this delivery'}
            ?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={confirmStatusUpdate}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirm'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
