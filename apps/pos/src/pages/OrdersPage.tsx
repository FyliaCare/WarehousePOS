import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, Phone, MapPin, 
  ChevronRight, Bell, RefreshCw, User
} from 'lucide-react';
import { Card, Button, Badge, Modal, Select, EmptyState, Skeleton } from '@warehousepos/ui';
import { formatCurrency, cn } from '@warehousepos/utils';
import type { CountryCode } from '@warehousepos/types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { sendOrderNotification, playNotificationSound } from '@/lib/notifications';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  source: string;
  order_type: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes: string;
  tracking_code: string;
  created_at: string;
  customer?: { name: string; phone: string };
  items?: any[];
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { store, tenant } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [dateRange, setDateRange] = useState<string>('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRiderModal, setShowRiderModal] = useState(false);
  
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';

  // Fetch orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders', store?.id, statusFilter, dateRange],
    queryFn: async () => {
      if (!store?.id) return [];
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:customers(name, phone),
          items:order_items(
            id,
            quantity,
            unit_price,
            product_name,
            total
          )
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Date filter
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      
      if (dateRange !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!store?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch riders for assignment
  const { data: riders } = useQuery({
    queryKey: ['riders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data } = await supabase
        .from('riders')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!store?.id && showRiderModal,
  });

  // Real-time subscription for new orders
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${store.id}`,
        },
        (payload) => {
          // Play notification sound
          playNotificationSound();
          
          toast.success('🔔 New Order!', {
            description: `Order #${(payload.new as any).order_number} received`,
            duration: 10000,
          });
          
          // Refetch orders
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${store.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id, queryClient]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, order }: { orderId: string; status: string; order?: Order }) => {
      const updates: any = { status };
      
      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (status === 'ready') {
        updates.ready_at = new Date().toISOString();
      } else if (status === 'delivered' || status === 'completed') {
        updates.delivered_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updates as never)
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Send SMS notification
      if (order) {
        const phone = order.customer_phone || order.customer?.phone;
        if (phone) {
          sendOrderNotification({
            orderId,
            orderNumber: order.order_number,
            status,
            customerPhone: phone,
            customerName: order.customer_name || order.customer?.name,
            storeName: store?.name,
            total: order.total,
            trackingCode: order.tracking_code,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error('Failed to update order', { description: error.message });
    },
  });

  // Assign rider mutation
  const assignRiderMutation = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      // Create delivery assignment
      const { error: assignError } = await supabase
        .from('delivery_assignments')
        .insert({
          order_id: orderId,
          rider_id: riderId,
          status: 'assigned',
        } as never);
      
      if (assignError) throw assignError;
      
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'out_for_delivery',
          delivery_status: 'assigned',
        } as never)
        .eq('id', orderId);
      
      if (orderError) throw orderError;
    },
    onSuccess: () => {
      toast.success('Rider assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowRiderModal(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error('Failed to assign rider', { description: error.message });
    },
  });

  const getStatusColor = (status: string): 'warning' | 'info' | 'default' | 'success' | 'destructive' | 'secondary' => {
    const colors: Record<string, 'warning' | 'info' | 'default' | 'success' | 'destructive' | 'secondary'> = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'default',
      ready: 'info',
      out_for_delivery: 'warning',
      delivered: 'success',
      completed: 'success',
      cancelled: 'destructive',
    };
    return colors[status] || 'secondary';
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    return flow[currentStatus] || null;
  };

  const getActionLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Confirm Order',
      confirmed: 'Start Preparing',
      preparing: 'Mark Ready',
      ready: 'Assign Rider',
      out_for_delivery: 'Mark Delivered',
    };
    return labels[status] || 'Update';
  };

  const handleStatusAction = (order: Order) => {
    if (order.status === 'ready' && order.order_type === 'delivery') {
      setSelectedOrder(order);
      setShowRiderModal(true);
    } else {
      const nextStatus = getNextStatus(order.status);
      if (nextStatus) {
        updateStatusMutation.mutate({ orderId: order.id, status: nextStatus, order });
      }
    }
  };

  const orderCounts = {
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    confirmed: orders?.filter(o => o.status === 'confirmed').length || 0,
    preparing: orders?.filter(o => o.status === 'preparing').length || 0,
    ready: orders?.filter(o => o.status === 'ready').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage incoming and ongoing orders</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={cn(
            "p-4 cursor-pointer transition-all",
            statusFilter === 'pending' && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter('pending')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{orderCounts.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        
        <Card 
          className={cn(
            "p-4 cursor-pointer transition-all",
            statusFilter === 'confirmed' && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter('confirmed')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{orderCounts.confirmed}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </div>
          </div>
        </Card>
        
        <Card 
          className={cn(
            "p-4 cursor-pointer transition-all",
            statusFilter === 'preparing' && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter('preparing')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{orderCounts.preparing}</p>
              <p className="text-sm text-muted-foreground">Preparing</p>
            </div>
          </div>
        </Card>
        
        <Card 
          className={cn(
            "p-4 cursor-pointer transition-all",
            statusFilter === 'ready' && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter('ready')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{orderCounts.ready}</p>
              <p className="text-sm text-muted-foreground">Ready</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'preparing', label: 'Preparing' },
            { value: 'ready', label: 'Ready' },
            { value: 'out_for_delivery', label: 'Out for Delivery' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />

        <Select
          value={dateRange}
          onValueChange={setDateRange}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Last 7 Days' },
            { value: 'month', label: 'Last 30 Days' },
            { value: 'all', label: 'All Time' },
          ]}
        />
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="w-24 h-9" />
              </div>
            </Card>
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={statusFilter !== 'all' ? `No ${statusFilter} orders` : 'Orders will appear here'}
          icon={<Package className="w-12 h-12" />}
        />
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <Card 
              key={order.id} 
              className={cn(
                "p-4 cursor-pointer hover:shadow-md transition-all",
                order.status === 'pending' && "border-l-4 border-l-yellow-500"
              )}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start gap-4">
                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground">#{order.order_number}</span>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                    {order.source === 'portal' && (
                      <Badge variant="secondary">🌐 Online</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {order.customer_name || order.customer?.name || 'Walk-in'}
                    </span>
                    {(order.customer_phone || order.customer?.phone) && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {order.customer_phone || order.customer?.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {order.items?.length || 0} items
                    </span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(order.total, country)}
                    </span>
                    {order.order_type === 'delivery' && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        Delivery
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {order.status !== 'delivered' && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusAction(order);
                      }}
                      disabled={updateStatusMutation.isPending}
                    >
                      {getActionLabel(order.status)}
                    </Button>
                  )}
                  {order.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ orderId: order.id, status: 'cancelled', order });
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        open={!!selectedOrder && !showRiderModal}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        title={`Order #${selectedOrder?.order_number}`}
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status & Info */}
            <div className="flex items-center justify-between">
              <Badge variant={getStatusColor(selectedOrder.status)} className="text-base px-3 py-1">
                {selectedOrder.status.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(selectedOrder.created_at).toLocaleString()}
              </span>
            </div>

            {/* Customer Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Customer</h3>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {selectedOrder.customer_name || selectedOrder.customer?.name || 'Walk-in'}
                </p>
                {(selectedOrder.customer_phone || selectedOrder.customer?.phone) && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`tel:${selectedOrder.customer_phone || selectedOrder.customer?.phone}`}
                      className="text-primary hover:underline"
                    >
                      {selectedOrder.customer_phone || selectedOrder.customer?.phone}
                    </a>
                  </p>
                )}
                {selectedOrder.delivery_address && (
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    {selectedOrder.delivery_address}
                  </p>
                )}
              </div>
            </Card>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.total, country)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal, country)}</span>
              </div>
              {selectedOrder.delivery_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{formatCurrency(selectedOrder.delivery_fee, country)}</span>
                </div>
              )}
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatCurrency(selectedOrder.discount, country)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(selectedOrder.total, country)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <>
                  <Button 
                    className="flex-1"
                    onClick={() => handleStatusAction(selectedOrder)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {getActionLabel(selectedOrder.status)}
                  </Button>
                  {selectedOrder.status === 'pending' && (
                    <Button 
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'cancelled', order: selectedOrder })}
                    >
                      Cancel Order
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Rider Modal */}
      <Modal
        open={showRiderModal}
        onOpenChange={(open) => !open && setShowRiderModal(false)}
        title="Assign Rider"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">Select a rider for delivery</p>
          
          {riders?.length === 0 ? (
            <EmptyState
              title="No riders available"
              description="Add riders in the Riders page to assign deliveries"
              icon={<Truck className="w-12 h-12" />}
            />
          ) : (
            <div className="space-y-2">
              {riders?.map((rider: any) => (
                <Card 
                  key={rider.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    if (selectedOrder) {
                      assignRiderMutation.mutate({ orderId: selectedOrder.id, riderId: rider.id });
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{rider.name}</p>
                      <p className="text-sm text-muted-foreground">{rider.phone}</p>
                    </div>
                    <Badge variant={rider.status === 'online' ? 'success' : 'secondary'}>
                      {rider.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
