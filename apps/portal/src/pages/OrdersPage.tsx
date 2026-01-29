import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Search, ChevronRight } from 'lucide-react';
import { Card, Input, Badge, EmptyState, Skeleton } from '@warehousepos/ui';
import { formatCurrency, formatDate } from '@warehousepos/utils';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCustomerStore } from '@/stores/customerStore';
import { supabase } from '@/lib/supabase';

// Type for customer response
interface CustomerRow { id: string; }

export function OrdersPage() {
  const { store } = useStoreContext();
  const { customer } = useCustomerStore();
  const currency = store?.tenant?.country === 'NG' ? 'NGN' : 'GHS';
  const [phoneSearch, setPhoneSearch] = useState(customer?.phone || '');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders', store?.id, phoneSearch],
    queryFn: async () => {
      if (!phoneSearch) return [];

      // First find the customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('store_id', store?.id || '')
        .eq('phone', phoneSearch)
        .single();

      if (!customerData) return [];

      // Then fetch orders
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', (customerData as CustomerRow).id)
        .order('created_at', { ascending: false });

      return data || [];
    },
    enabled: !!store?.id && !!phoneSearch,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'default';
      case 'ready': return 'info';
      case 'delivered': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
      <p className="text-muted-foreground mb-6">Track your order history</p>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3 max-w-md">
          <Input
            placeholder="Enter your phone number"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
      </form>

      {/* Orders List */}
      {!phoneSearch ? (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium text-foreground">Enter your phone number</p>
          <p className="text-sm text-muted-foreground">
            to see your order history
          </p>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-40" />
            </Card>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link key={order.id} to={`/orders/${order.id}`}>
              <Card className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        Order #{order.order_number}
                      </p>
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.created_at, 'full')}
                    </p>
                    <p className="text-lg font-bold text-primary mt-1">
                      {formatCurrency(order.total, currency)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No orders found"
          description="No orders found for this phone number"
          icon={<Package className="w-12 h-12" />}
        />
      )}
    </div>
  );
}
