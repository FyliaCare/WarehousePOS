import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, TrendingUp, TrendingDown, Building2, 
  ShoppingCart, DollarSign, Download
} from 'lucide-react';
import { Card, Select, Button, Skeleton } from '@warehousepos/ui';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30');

  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(dateRange);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-analytics', dateRange],
    queryFn: async () => {
      const startDate = getDateRange();

      // Get tenant stats
      const [tenantCount, newTenants, activeStores] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact' }),
        supabase.from('tenants').select('id', { count: 'exact' }).gte('created_at', startDate),
        supabase.from('stores').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      // Get order stats with tenant info
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total, created_at, status, payment_status, store:stores(name, tenant:tenants(country))')
        .gte('created_at', startDate);

      const paidOrders = orders?.filter(o => o.payment_status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      const ghOrders = paidOrders.filter((o: any) => o.store?.tenant?.country === 'GH');
      const ngOrders = paidOrders.filter((o: any) => o.store?.tenant?.country === 'NG');
      
      const ghRevenue = ghOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const ngRevenue = ngOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Group orders by day for chart
      const ordersByDay: Record<string, { date: string; orders: number; revenue: number; ghRevenue: number; ngRevenue: number }> = {};
      paidOrders.forEach(order => {
        const date = (order.created_at as string).split('T')[0];
        if (!ordersByDay[date]) {
          ordersByDay[date] = { date, orders: 0, revenue: 0, ghRevenue: 0, ngRevenue: 0 };
        }
        ordersByDay[date].orders += 1;
        ordersByDay[date].revenue += order.total || 0;
        const country = (order as any).store?.tenant?.country;
        if (country === 'GH') {
          ordersByDay[date].ghRevenue += order.total || 0;
        } else {
          ordersByDay[date].ngRevenue += order.total || 0;
        }
      });

      // Sort by date
      const dailyData = Object.values(ordersByDay).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Get top stores by revenue
      const storeRevenue: Record<string, { name: string; revenue: number; orders: number }> = {};
      paidOrders.forEach(order => {
        const storeName = (order as any).store?.name || 'Unknown';
        if (!storeRevenue[storeName]) {
          storeRevenue[storeName] = { name: storeName, revenue: 0, orders: 0 };
        }
        storeRevenue[storeName].revenue += order.total || 0;
        storeRevenue[storeName].orders += 1;
      });

      const topStores = Object.values(storeRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Country distribution for pie chart
      const countryData = [
        { name: 'Ghana', value: ghRevenue, orders: ghOrders.length },
        { name: 'Nigeria', value: ngRevenue, orders: ngOrders.length },
      ];

      return {
        totalTenants: tenantCount.count || 0,
        newTenants: newTenants.count || 0,
        activeStores: activeStores.count || 0,
        totalOrders: paidOrders.length,
        totalRevenue,
        ghRevenue,
        ngRevenue,
        avgOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
        dailyData,
        topStores,
        countryData,
      };
    },
  });

  // Calculate growth
  const { data: previousStats } = useQuery({
    queryKey: ['platform-analytics-previous', dateRange],
    queryFn: async () => {
      const days = parseInt(dateRange);
      const now = new Date();
      const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000).toISOString();
      const previousEnd = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd)
        .eq('payment_status', 'paid');

      return {
        totalRevenue: orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0,
        totalOrders: orders?.length || 0,
      };
    },
  });

  const revenueGrowth = previousStats?.totalRevenue && previousStats.totalRevenue > 0
    ? ((stats?.totalRevenue || 0) - previousStats.totalRevenue) / previousStats.totalRevenue * 100
    : 0;

  const ordersGrowth = previousStats?.totalOrders && previousStats.totalOrders > 0
    ? ((stats?.totalOrders || 0) - previousStats.totalOrders) / previousStats.totalOrders * 100
    : 0;

  const exportReport = () => {
    if (!stats) return;
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      summary: {
        totalTenants: stats.totalTenants,
        newTenants: stats.newTenants,
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        ghRevenue: stats.ghRevenue,
        ngRevenue: stats.ngRevenue,
        avgOrderValue: stats.avgOrderValue,
      },
      topStores: stats.topStores,
      dailyData: stats.dailyData,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Platform-wide analytics and metrics</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={dateRange}
            onValueChange={setDateRange}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' },
            ]}
          />
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              {isLoading ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    ${Math.round((stats?.totalRevenue || 0) / 100).toLocaleString()}
                  </p>
                  <div className={`flex items-center text-sm ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </div>
                </>
              )}
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalOrders.toLocaleString()}</p>
                  <div className={`flex items-center text-sm ${ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ordersGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {Math.abs(ordersGrowth).toFixed(1)}%
                  </div>
                </>
              )}
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tenants</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalTenants}</p>
                  <p className="text-sm text-muted-foreground">
                    +{stats?.newTenants} new
                  </p>
                </>
              )}
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    ${Math.round((stats?.avgOrderValue || 0) / 100).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats?.activeStores} active stores
                  </p>
                </>
              )}
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue by Country Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇬🇭</span>
            <div>
              <p className="text-sm text-muted-foreground">Ghana Revenue</p>
              <p className="text-xl font-bold text-foreground">₵{(stats?.ghRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇳🇬</span>
            <div>
              <p className="text-sm text-muted-foreground">Nigeria Revenue</p>
              <p className="text-xl font-bold text-foreground">₦{(stats?.ngRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Revenue Trend</h3>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats?.dailyData && stats.dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#7c3aed" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </Card>

        {/* Orders by Day */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Orders by Day</h3>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats?.dailyData && stats.dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </Card>

        {/* Revenue by Country Pie */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Revenue by Country</h3>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats?.countryData && (stats.countryData[0].value > 0 || stats.countryData[1].value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.countryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {stats.countryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </Card>

        {/* Top Stores */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Top Performing Stores</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats?.topStores && stats.topStores.length > 0 ? (
            <div className="space-y-3">
              {stats.topStores.map((store, index) => (
                <div key={store.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">
                    ${Math.round(store.revenue / 100).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No stores data available
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
