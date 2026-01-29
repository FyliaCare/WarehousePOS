import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Store,
  Users,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Badge, Skeleton } from '@warehousepos/ui';
import { formatCurrency, formatDate } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';

export function DashboardPage() {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get counts
      const [tenants, stores, users] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact' }),
        supabase.from('stores').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
      ]);

      // Get recent revenue (30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentOrders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('payment_status', 'paid');

      const revenue = recentOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      return {
        totalTenants: tenants.count || 0,
        totalStores: stores.count || 0,
        totalUsers: users.count || 0,
        monthlyRevenue: revenue,
      };
    },
  });

  // Fetch recent tenants
  const { data: recentTenants } = useQuery({
    queryKey: ['recent-tenants'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Fetch recent activity
  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders-admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, store:stores(name)')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.totalTenants || 0,
      icon: Building2,
      color: 'bg-blue-500',
      link: '/tenants',
    },
    {
      title: 'Total Stores',
      value: stats?.totalStores || 0,
      icon: Store,
      color: 'bg-green-500',
      link: '/stores',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-500',
      link: '/users',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0, 'NGN'),
      icon: DollarSign,
      color: 'bg-orange-500',
      link: '/analytics',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and statistics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Tenants</h2>
            <Link to="/tenants" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentTenants?.map((tenant: any) => (
              <Link
                key={tenant.id}
                to={`/tenants/${tenant.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tenant.business_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.country} • {formatDate(tenant.created_at, 'short')}
                    </p>
                  </div>
                </div>
                <Badge variant={tenant.is_active ? 'success' : 'secondary'}>
                  {tenant.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
            <Link to="/analytics" className="text-sm text-primary hover:underline">
              View Analytics
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders?.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-foreground">#{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.store?.name} • {formatDate(order.created_at, 'short')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {formatCurrency(order.total, 'NGN')}
                  </p>
                  <Badge
                    variant={order.payment_status === 'paid' ? 'success' : 'warning'}
                  >
                    {order.payment_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
