import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Users, ShoppingCart, Loader2 } from 'lucide-react';
import { Card, Badge, Button } from '@warehousepos/ui';
import { formatDate, formatCurrency } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: store, isLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('stores')
        .select('*, tenant:tenants(*)')
        .eq('id', id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ['store-stats', id],
    queryFn: async () => {
      const [products, customers, orders] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('store_id', id),
        supabase.from('customers').select('id', { count: 'exact' }).eq('store_id', id),
        supabase.from('orders').select('id, total', { count: 'exact' }).eq('store_id', id),
      ]);

      const revenue = orders.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      return {
        products: products.count || 0,
        customers: customers.count || 0,
        orders: orders.count || 0,
        revenue,
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Store not found</p>
        <Link to="/stores">
          <Button>Back to Stores</Button>
        </Link>
      </div>
    );
  }

  const currency = store.tenant?.country === 'NG' ? 'NGN' : 'GHS';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/stores" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{store.name}</h1>
            <Badge variant={store.is_active ? 'success' : 'secondary'}>
              {store.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {store.slug}.warehousepos.com • {store.tenant?.business_name}
          </p>
        </div>
        <Button variant="outline">Edit Store</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="text-xl font-bold text-foreground">{stats?.products || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customers</p>
              <p className="text-xl font-bold text-foreground">{stats?.customers || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-xl font-bold text-foreground">{stats?.orders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold">
                {currency === 'NGN' ? '₦' : '₵'}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(stats?.revenue || 0, currency)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Store Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Store Name</p>
              <p className="text-foreground">{store.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="text-foreground">{store.slug}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-foreground">{store.phone || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="text-foreground">{store.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Portal Enabled</p>
              <Badge variant={store.portal_enabled ? 'success' : 'secondary'}>
                {store.portal_enabled ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-foreground">{formatDate(store.created_at, 'full')}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
