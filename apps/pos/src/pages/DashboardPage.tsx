import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Card, StatCard, Badge, Button, Skeleton, SkeletonCard } from '@warehousepos/ui';
import { formatCurrency, timeAgo } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import type { CountryCode, Sale } from '@warehousepos/types';

export function DashboardPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch today's sales
      const { data: todaySales } = await supabase
        .from('sales')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      // Fetch total products
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('is_active', true);

      // Fetch total customers
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id);

      // Fetch low stock products
      const { count: lowStockCount } = await supabase
        .from('stock_levels')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .lte('quantity', 10);

      const salesData = todaySales as unknown as { total: number }[] | null;
      const todayTotal = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;
      const todayCount = salesData?.length || 0;

      return {
        todaySales: todayTotal,
        todayTransactions: todayCount,
        productCount: productCount || 0,
        customerCount: customerCount || 0,
        lowStockCount: lowStockCount || 0,
      };
    },
    enabled: !!store?.id,
  });

  // Fetch recent sales
  const { data: recentSales, isLoading: salesLoading } = useQuery({
    queryKey: ['recent-sales', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      const { data } = await supabase
        .from('sales')
        .select('*, customer:customers(name, phone)')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(5);

      return (data as unknown as Sale[]) || [];
    },
    enabled: !!store?.id,
  });

  // Fetch low stock products
  const { data: lowStockProducts, isLoading: stockLoading } = useQuery({
    queryKey: ['low-stock', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      const { data } = await supabase
        .from('stock_levels')
        .select('*, product:products(name, sku)')
        .eq('store_id', store.id)
        .lte('quantity', 10)
        .order('quantity', { ascending: true })
        .limit(5);

      return data || [];
    },
    enabled: !!store?.id,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(stats?.todaySales || 0, country)}
            icon={<DollarSign className="w-5 h-5" />}
            description={`${stats?.todayTransactions || 0} transactions`}
          />
          <StatCard
            title="Total Products"
            value={stats?.productCount || 0}
            icon={<Package className="w-5 h-5" />}
            description={`${stats?.lowStockCount || 0} low stock`}
          />
          <StatCard
            title="Total Customers"
            value={stats?.customerCount || 0}
            icon={<Users className="w-5 h-5" />}
            description="Registered customers"
          />
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockCount || 0}
            icon={<ShoppingCart className="w-5 h-5" />}
            description="Need restocking"
          />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Sales</h2>
            <Link to="/sales">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {salesLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            ) : recentSales && recentSales.length > 0 ? (
              recentSales.map((sale: any) => (
                <div key={sale.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {sale.sale_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sale.customer?.name || 'Walk-in Customer'} •{' '}
                      {timeAgo(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {formatCurrency(sale.total, country)}
                    </p>
                    <Badge variant="success">
                      {sale.payment_status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No sales yet today</p>
                <Link to="/pos">
                  <Button variant="outline" size="sm" className="mt-3">
                    Make a Sale
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Low Stock Alert</h2>
            <Link to="/stock">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stockLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            ) : lowStockProducts && lowStockProducts.length > 0 ? (
              lowStockProducts.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {item.product?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.product?.sku}
                    </p>
                  </div>
                  <Badge
                    variant={item.quantity <= 5 ? 'destructive' : 'warning'}
                  >
                    {item.quantity} left
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All products are well stocked!</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/pos">
            <Button>
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline">
              <Package className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
          <Link to="/customers">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </Link>
          <Link to="/stock">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Update Stock
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
