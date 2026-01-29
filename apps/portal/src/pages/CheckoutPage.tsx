import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { User, Phone, Mail, MapPin, Truck, Loader2 } from 'lucide-react';
import { Card, Button, Input } from '@warehousepos/ui';
import { formatCurrency, cn } from '@warehousepos/utils';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCartStore } from '@/stores/cartStore';
import { useCustomerStore } from '@/stores/customerStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Types for Supabase responses
interface CustomerRow { id: string; }
interface OrderRow { id: string; }

export function CheckoutPage() {
  const navigate = useNavigate();
  const { store } = useStoreContext();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { customer, setCustomer } = useCustomerStore();
  const currency = store?.tenant?.country === 'NG' ? 'NGN' : 'GHS';
  const subtotal = getSubtotal();

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
  });
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');

  const deliveryFee = deliveryOption === 'delivery' ? (store?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // Create or find customer
      let customerId: string | null = null;
      
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('store_id', store?.id || '')
        .eq('phone', formData.phone)
        .single();

      if (existingCustomer) {
        customerId = (existingCustomer as CustomerRow).id;
        // Update customer details
        await supabase
          .from('customers')
          .update({
            name: formData.name,
            email: formData.email || null,
            address: formData.address || null,
          } as Record<string, unknown>)
          .eq('id', customerId);
      } else {
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({
            store_id: store?.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            address: formData.address || null,
          } as Record<string, unknown>)
          .select()
          .single();

        if (error) throw error;
        customerId = (newCustomer as CustomerRow).id;
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: store?.id,
          customer_id: customerId,
          order_number: orderNumber,
          source: 'portal',
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
          subtotal,
          tax: 0,
          discount: 0,
          delivery_fee: deliveryFee,
          total,
          delivery_type: deliveryOption,
          delivery_address: deliveryOption === 'delivery' ? formData.address : null,
          notes: null,
        } as Record<string, unknown>)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderId = (order as OrderRow).id;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderId,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        discount: 0,
        total: item.product.selling_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems as Record<string, unknown>[]);

      if (itemsError) throw itemsError;

      return { id: orderId };
    },
    onSuccess: (order) => {
      // Save customer info
      setCustomer({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
      });

      // Clear cart
      clearCart();

      toast.success('Order placed successfully!');
      navigate(`/orders/${order.id}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to place order', { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in required fields');
      return;
    }

    if (deliveryOption === 'delivery' && !formData.address) {
      toast.error('Please enter delivery address');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    createOrderMutation.mutate();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  leftIcon={<User className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Phone Number *"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  leftIcon={<Phone className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Email (Optional)"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail className="w-5 h-5" />}
                  className="md:col-span-2"
                />
              </div>
            </Card>

            {/* Delivery Options */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Method</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryOption('delivery')}
                  className={cn(
                    'p-4 border rounded-lg text-left transition-colors',
                    deliveryOption === 'delivery'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Truck className="w-6 h-6 mb-2" />
                  <p className="font-medium text-foreground">Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    {store?.delivery_fee ? formatCurrency(store.delivery_fee, currency) : 'Free'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryOption('pickup')}
                  className={cn(
                    'p-4 border rounded-lg text-left transition-colors',
                    deliveryOption === 'pickup'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <MapPin className="w-6 h-6 mb-2" />
                  <p className="font-medium text-foreground">Pick Up</p>
                  <p className="text-sm text-muted-foreground">Free</p>
                </button>
              </div>

              {deliveryOption === 'delivery' && (
                <div className="mt-4">
                  <Input
                    label="Delivery Address *"
                    placeholder="Enter full delivery address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    leftIcon={<MapPin className="w-5 h-5" />}
                    required
                  />
                </div>
              )}

              {deliveryOption === 'pickup' && store?.address && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Pickup Location:</p>
                  <p className="text-foreground">{store.address}</p>
                </div>
              )}
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Payment Method</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    'w-full p-4 border rounded-lg text-left transition-colors flex items-center gap-3',
                    paymentMethod === 'cash'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <span className="text-lg">💵</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Cash on Delivery</p>
                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={cn(
                    'w-full p-4 border rounded-lg text-left transition-colors flex items-center gap-3',
                    paymentMethod === 'transfer'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-lg">🏦</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">Transfer to our bank account</p>
                  </div>
                </button>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="text-foreground">
                      {formatCurrency(item.product.selling_price * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-foreground">
                    {deliveryFee > 0 ? formatCurrency(deliveryFee, currency) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total, currency)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
