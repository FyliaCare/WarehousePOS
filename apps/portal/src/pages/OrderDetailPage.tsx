import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin, Clock, CreditCard, Loader2 } from 'lucide-react';
import { Card, Badge, Button } from '@warehousepos/ui';
import { formatCurrency, formatDate } from '@warehousepos/utils';
import { useStoreContext } from '@/contexts/StoreContext';
import { supabase } from '@/lib/supabase';

// Type for order response
interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  delivery_type: string;
  delivery_address?: string;
  items?: OrderItemRow[];
  customer?: CustomerRow;
}

interface OrderItemRow {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  product?: { name: string; image_url?: string };
}

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { store } = useStoreContext();
  const currency = store?.tenant?.country === 'NG' ? 'NGN' : 'GHS';

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*, product:products(name, image_url)), customer:customers(*)')
        .eq('id', id || '')
        .single();
      return data as OrderRow | null;
    },
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning' as const;
      case 'confirmed': return 'info' as const;
      case 'processing': return 'default' as const;
      case 'ready': return 'info' as const;
      case 'delivered': return 'success' as const;
      case 'completed': return 'success' as const;
      case 'cancelled': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'ready', label: 'Ready' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getCurrentStep = () => {
    const stepOrder = ['pending', 'confirmed', 'processing', 'ready', 'delivered', 'completed'];
    return stepOrder.indexOf(order?.status || 'pending');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-lg text-muted-foreground mb-4">Order not found</p>
        <Link to="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Order #{order.order_number}
          </h1>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.created_at, 'full')}
          </p>
        </div>
        <Badge variant={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </div>

      {/* Progress Tracker */}
      {order.status !== 'cancelled' && (
        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Order Status</h2>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const currentStep = getCurrentStep();
              const isComplete = index <= currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {index > 0 && (
                    <div
                      className={`absolute top-3 -left-1/2 w-full h-0.5 ${
                        isComplete ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                      isComplete
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isComplete ? '✓' : index + 1}
                  </div>
                  <span
                    className={`text-xs mt-1 text-center ${
                      isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-foreground mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.unit_price, currency)} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-foreground">
                  {formatCurrency(item.total, currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="border-t border-border mt-6 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(order.subtotal, currency)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-foreground">{formatCurrency(order.delivery_fee, currency)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">-{formatCurrency(order.discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total, currency)}</span>
            </div>
          </div>
        </Card>

        {/* Order Details */}
        <div className="space-y-6">
          {/* Delivery Info */}
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Delivery Details</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {order.delivery_type === 'delivery' ? 'Delivery Address' : 'Pickup'}
                  </p>
                  <p className="text-foreground">
                    {order.delivery_address || store?.address || 'Store Pickup'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time</p>
                  <p className="text-foreground">
                    {order.delivery_type === 'delivery' ? '30-45 mins' : 'Ready when confirmed'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Info */}
          <Card className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Payment</h2>
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="text-foreground capitalize">{order.payment_method}</p>
                <Badge
                  variant={order.payment_status === 'paid' ? 'success' : 'warning'}
                  className="mt-1"
                >
                  {order.payment_status}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Customer Info */}
          {order.customer && (
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Contact</h2>
              <p className="text-foreground">{order.customer.name}</p>
              <p className="text-muted-foreground">{order.customer.phone}</p>
              {order.customer.email && (
                <p className="text-muted-foreground">{order.customer.email}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
