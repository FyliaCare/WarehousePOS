import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  ChevronRight,
  DollarSign,
  Target,
  Wallet,
  CreditCard,
  TrendingUp,
  BarChart2,
  Zap,
  Receipt,
  Store,
  Truck,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user, tenant, store } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'alerts'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Premium Design System - Vegetation Green & Gold
  const isNigeria = tenant?.country === 'NG';
  const currency = isNigeria ? '₦' : 'GH₵';

  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch real dashboard stats from database
  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();
      
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoISO = monthAgo.toISOString();
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayISO = yesterday.toISOString();

      // Today's sales - using 'sales' table instead of 'orders'
      const { data: todaySalesData } = await supabase
        .from('sales')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', todayISO)
        .eq('status', 'completed');

      const todaySales = (todaySalesData || []).reduce((sum, o: any) => sum + o.total, 0);
      const todaySaleCount = (todaySalesData || []).length;
      
      // Yesterday's sales for comparison
      const { data: yesterdaySalesData } = await supabase
        .from('sales')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', yesterdayISO)
        .lt('created_at', todayISO)
        .eq('status', 'completed');

      const yesterdaySalesTotal = (yesterdaySalesData || []).reduce((sum, o: any) => sum + o.total, 0);
      const salesGrowth = yesterdaySalesTotal > 0 
        ? ((todaySales - yesterdaySalesTotal) / yesterdaySalesTotal) * 100 
        : 0;

      // Week sales
      const { data: weekSalesData } = await supabase
        .from('sales')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', weekAgoISO)
        .eq('status', 'completed');

      const weekSales = (weekSalesData || []).reduce((sum, o: any) => sum + o.total, 0);
      const weekSaleCount = (weekSalesData || []).length;

      // Month sales
      const { data: monthSalesData } = await supabase
        .from('sales')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', monthAgoISO)
        .eq('status', 'completed');

      const monthSales = (monthSalesData || []).reduce((sum, o: any) => sum + o.total, 0);

      // Active customers this month - from sales table
      const { data: activeCustomersData } = await supabase
        .from('sales')
        .select('customer_id')
        .eq('store_id', store.id)
        .gte('created_at', monthAgoISO)
        .not('customer_id', 'is', null)
        .eq('status', 'completed');

      const uniqueCustomers = new Set((activeCustomersData || []).map((o: any) => o.customer_id)).size;

      // Low stock products - query stock_levels table joined with products
      const { data: lowStockProducts } = await supabase
        .from('stock_levels')
        .select('id, quantity, product:products!inner(id, is_active, low_stock_threshold)')
        .eq('store_id', store.id);
      
      // Filter low stock in JS since we can't easily compare quantity < low_stock_threshold in Supabase
      const lowStockCount = (lowStockProducts || []).filter((item: any) => 
        item.product?.is_active && item.quantity < (item.product?.low_stock_threshold || 10)
      ).length;

      // Pending sales
      const { data: pendingSales } = await supabase
        .from('sales')
        .select('id')
        .eq('store_id', store.id)
        .eq('status', 'pending');

      // Top products - fetch through sales and sale_items
      const { data: recentSalesData } = await supabase
        .from('sales')
        .select('id')
        .eq('store_id', store.id)
        .gte('created_at', monthAgoISO)
        .eq('status', 'completed');

      let topProducts: { name: string; sold: number; revenue: number }[] = [];
      
      if (recentSalesData && recentSalesData.length > 0) {
        const saleIds = recentSalesData.map(s => s.id);
        
        const { data: topProductData } = await supabase
          .from('sale_items')
          .select('quantity, total, product:products(name)')
          .in('sale_id', saleIds);

        const productSalesMap = (topProductData || []).reduce((acc: Record<string, { name: string; sold: number; revenue: number }>, item: any) => {
          const name = item.product?.name || 'Unknown';
          if (!acc[name]) {
            acc[name] = { name, sold: 0, revenue: 0 };
          }
          acc[name].sold += item.quantity;
          acc[name].revenue += item.total;
          return acc;
        }, {});

        topProducts = Object.values(productSalesMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);
      }

      // Monthly target (can be stored in tenant settings, using default for now)
      // Use type assertion since tenant.settings is a JSONB field
      const tenantSettings = (tenant as { settings?: { monthly_target?: number } })?.settings;
      const monthTarget = tenantSettings?.monthly_target || monthSales * 1.2;
      const targetProgress = monthTarget > 0 ? Math.round((monthSales / monthTarget) * 100) : 0;

      return {
        todaySales,
        todayOrders: todaySaleCount,
        avgOrderValue: todaySaleCount > 0 ? todaySales / todaySaleCount : 0,
        salesGrowth: Math.round(salesGrowth * 10) / 10,
        weekSales,
        weekOrders: weekSaleCount,
        monthSales,
        monthTarget,
        targetProgress: Math.min(targetProgress, 100),
        topProducts,
        lowStock: lowStockCount,
        pendingOrders: (pendingSales || []).length,
        activeCustomers: uniqueCustomers,
      };
    },
    enabled: !!store?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Use real data or show loading state
  const stats = dashboardStats || {
    todaySales: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    salesGrowth: 0,
    weekSales: 0,
    weekOrders: 0,
    monthSales: 0,
    monthTarget: 0,
    targetProgress: 0,
    topProducts: [],
    lowStock: 0,
    pendingOrders: 0,
    activeCustomers: 0,
  };

  const formatCurrency = (amount: number) => `${currency}${amount.toLocaleString()}`;

  // Sample data for charts (would be real data in production)
  const salesByChannel = [
    { name: 'Walk-in', value: 45, color: '#06B6D4' },
    { name: 'Online', value: 25, color: '#3B82F6' },
    { name: 'Delivery', value: 20, color: '#10B981' },
    { name: 'Wholesale', value: 10, color: '#8B5CF6' },
  ];

  const monthlyData = [
    { month: 'Jan', value: 65 },
    { month: 'Feb', value: 85 },
    { month: 'Mar', value: 55 },
    { month: 'Apr', value: 95 },
    { month: 'May', value: 75 },
    { month: 'Jun', value: 110 },
    { month: 'Jul', value: 90 },
  ];

  const recentSales = [
    { customer: 'Kwame Asante', product: 'Rice (50kg)', type: 'Walk-in', amount: isNigeria ? 45000 : 650, status: 'completed' },
    { customer: 'Ama Serwah', product: 'Sugar (25kg)', type: 'Delivery', amount: isNigeria ? 28500 : 420, status: 'pending' },
    { customer: 'Kofi Mensah', product: 'Flour (25kg)', type: 'Walk-in', amount: isNigeria ? 32000 : 475, status: 'completed' },
    { customer: 'Akua Boateng', product: 'Palm Oil (25L)', type: 'Online', amount: isNigeria ? 18500 : 280, status: 'pending' },
  ];

  // Simulate refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Quick actions for mobile
  const quickActions = [
    { name: 'New Sale', icon: Plus, href: '/pos', gradient: 'from-green-500 to-emerald-600' },
    { name: 'Products', icon: Package, href: '/products', gradient: 'from-blue-500 to-cyan-600' },
    { name: 'Customers', icon: Users, href: '/customers', gradient: 'from-purple-500 to-pink-600' },
    { name: 'Reports', icon: BarChart2, href: '/reports', gradient: 'from-orange-500 to-red-600' },
  ];

  return (
    <>
      {/* ============================================= */}
      {/* MOBILE PWA VIEW (Hidden on lg screens) */}
      {/* ============================================= */}
      <div className="lg:hidden -m-4 min-h-screen bg-background">
        {/* Mobile Header with Pull-to-Refresh Feel */}
        <div 
          className="relative overflow-hidden"
          style={{ background: isNigeria 
            ? 'linear-gradient(135deg, #166534 0%, #22c55e 50%, #4ade80 100%)' 
            : 'linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #2DD4BF 100%)' 
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute right-16 top-16 w-16 h-16 bg-white/10 rounded-full" />
          <div className="absolute -left-4 bottom-4 w-24 h-24 bg-white/5 rounded-full" />
          
          <div className="relative px-5 pt-6 pb-8">
            {/* Top Row: Greeting + Refresh */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/70 text-xs font-medium">{greeting()}</p>
                <h1 className="text-white text-xl font-bold">Hi, {firstName} 👋</h1>
              </div>
              <button 
                onClick={handleRefresh}
                className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform active:scale-95 ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Today's Revenue Card */}
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium mb-1">Today's Revenue</p>
                  <p className="text-white text-3xl font-black">{formatCurrency(stats.todaySales)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stats.salesGrowth >= 0 ? (
                      <>
                        <ArrowUpRight className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-semibold">+{stats.salesGrowth}% from yesterday</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-3 h-3 text-white/80" />
                        <span className="text-white/80 text-xs font-semibold">{stats.salesGrowth}% from yesterday</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="px-5 -mt-4 relative z-10">
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-4">
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex flex-col items-center gap-2 py-2 active:scale-95 transition-transform"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 mt-6">
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            {(['overview', 'sales', 'alerts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'overview' ? 'Overview' : tab === 'sales' ? 'Sales' : 'Alerts'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 pb-28 mt-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Mini Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Orders</span>
                  </div>
                  <p className="text-2xl font-black text-foreground">{stats.todayOrders}</p>
                  <p className="text-xs text-muted-foreground mt-1">today</p>
                </div>

                <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Customers</span>
                  </div>
                  <p className="text-2xl font-black text-foreground">{stats.activeCustomers}</p>
                  <p className="text-xs text-muted-foreground mt-1">this month</p>
                </div>

                <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Avg. Order</span>
                  </div>
                  <p className="text-xl font-black text-foreground">{formatCurrency(stats.avgOrderValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">per sale</p>
                </div>

                <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Target</span>
                  </div>
                  <p className="text-2xl font-black text-foreground">{stats.targetProgress}%</p>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.targetProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Weekly Performance */}
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground">This Week</h3>
                  <span className="text-xs text-muted-foreground">{stats.weekOrders} orders</span>
                </div>
                <div className="flex items-end justify-between gap-2" style={{ height: '100px' }}>
                  {monthlyData.slice(0, 7).map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full rounded-lg transition-all duration-300"
                        style={{ 
                          height: `${(item.value / 120) * 100}%`,
                          background: i === 6 
                            ? `linear-gradient(180deg, ${isNigeria ? '#22c55e' : '#14B8A6'} 0%, ${isNigeria ? '#166534' : '#0D9488'} 100%)`
                            : 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%)'
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">Week Total</span>
                  <span className="text-lg font-black text-foreground">{formatCurrency(stats.weekSales)}</span>
                </div>
              </div>

              {/* Sales by Channel */}
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                <h3 className="text-sm font-bold text-foreground mb-4">Sales by Channel</h3>
                <div className="space-y-3">
                  {salesByChannel.map((channel) => (
                    <div key={channel.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: channel.color }} 
                      />
                      <span className="text-sm text-muted-foreground font-medium flex-1">{channel.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${channel.value}%`, backgroundColor: channel.color }}
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground w-12 text-right">{channel.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-foreground">Recent Sales</h3>
                <Link to="/sales" className="text-xs font-semibold text-primary">View All</Link>
              </div>
              {recentSales.map((sale, i) => (
                <div 
                  key={i} 
                  className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {sale.customer.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground truncate">{sale.customer}</p>
                        <p className="text-sm font-black text-foreground">{formatCurrency(sale.amount)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground truncate">{sale.product}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.status === 'completed' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' 
                            : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                        }`}>
                          {sale.status === 'completed' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Today's Summary Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-4 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium">Today's Summary</p>
                    <p className="text-white text-lg font-bold">{stats.todayOrders} Sales</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-white/60 text-xs">Revenue</p>
                    <p className="text-white text-sm font-bold">{formatCurrency(stats.todaySales)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Completed</p>
                    <p className="text-green-400 text-sm font-bold">{Math.round(stats.todayOrders * 0.75)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Pending</p>
                    <p className="text-orange-400 text-sm font-bold">{Math.round(stats.todayOrders * 0.25)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Critical Alerts */}
              {stats.lowStock > 0 && (
                <Link to="/stock" className="block">
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Low Stock Alert</p>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                          {stats.lowStock} products need restocking
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-red-400" />
                    </div>
                  </div>
                </Link>
              )}

              {stats.pendingOrders > 0 && (
                <Link to="/sales" className="block">
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Pending Orders</p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                          {stats.pendingOrders} orders awaiting processing
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Quick Links */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link to="/stock" className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 active:scale-[0.98] transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-sm font-semibold text-foreground flex-1">Manage Stock</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link to="/deliveries" className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 active:scale-[0.98] transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-sm font-semibold text-foreground flex-1">View Deliveries</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 active:scale-[0.98] transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                      <Store className="w-5 h-5 text-purple-500" />
                    </div>
                    <span className="text-sm font-semibold text-foreground flex-1">Store Settings</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>

              {/* No Alerts State */}
              {stats.lowStock === 0 && stats.pendingOrders === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-foreground">All Clear!</p>
                  <p className="text-sm text-muted-foreground mt-1">No alerts at the moment</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 px-2 py-2 safe-area-pb z-50">
          <div className="flex items-center justify-around">
            <Link to="/dashboard" className="flex flex-col items-center py-2 px-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isNigeria ? 'bg-nigeria-green-500' : 'bg-ghana-gold-500'}`}>
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <span className={`text-[10px] font-semibold mt-1 ${isNigeria ? 'text-nigeria-green-600 dark:text-nigeria-green-400' : 'text-ghana-gold-600 dark:text-ghana-gold-400'}`}>Home</span>
            </Link>
            <Link to="/pos" className="flex flex-col items-center py-2 px-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">POS</span>
            </Link>
            <Link 
              to="/pos" 
              className={`-mt-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform bg-gradient-to-br ${isNigeria ? 'from-nigeria-green-500 to-nigeria-green-600' : 'from-ghana-gold-400 to-ghana-gold-600'}`}
            >
              <Plus className="w-7 h-7 text-white" />
            </Link>
            <Link to="/products" className="flex flex-col items-center py-2 px-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">Products</span>
            </Link>
            <Link to="/sales" className="flex flex-col items-center py-2 px-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1">Sales</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* DESKTOP VIEW (Hidden on mobile) */}
      {/* ============================================= */}
      <div className="hidden lg:block space-y-6">
      {/* Hero Banner */}
      <div 
        className="rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
        style={{ background: isNigeria 
          ? 'linear-gradient(135deg, #166534 0%, #22c55e 50%, #4ade80 100%)' 
          : 'linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #2DD4BF 100%)' 
        }}
      >
        <div className="relative z-10 max-w-xl">
          <p className="text-white/80 text-sm font-semibold mb-1">{greeting()}</p>
          <h2 className="text-2xl lg:text-3xl font-black mb-3">
            Welcome back, {firstName}! 👋
          </h2>
          <p className="text-white/90 mb-6">
            Track your sales, manage inventory, and grow your business with real-time analytics.
          </p>
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-colors border border-white/30"
          >
            <ShoppingCart className="w-5 h-5" />
            Open POS
          </Link>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 hidden md:block">
          <div className="w-32 lg:w-40 h-32 lg:h-40 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center rotate-12">
            <Package className="w-16 lg:w-20 h-16 lg:h-20 text-white/80" />
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute right-20 -top-10 w-20 h-20 bg-white/10 rounded-full" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Income */}
        <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Total Income</p>
              <p className="text-2xl lg:text-3xl font-black text-foreground">{formatCurrency(stats.monthSales)}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-500">+8.2%</span>
              </div>
            </div>
            <div 
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}
            >
              <Wallet className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Total Expenses</p>
              <p className="text-2xl lg:text-3xl font-black text-foreground">{formatCurrency(stats.monthSales * 0.65)}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-500">-5.2%</span>
              </div>
            </div>
            <div 
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)' }}
            >
              <CreditCard className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Total Profit</p>
              <p className="text-2xl lg:text-3xl font-black text-foreground">{formatCurrency(stats.monthSales * 0.35)}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-500">+2.2%</span>
              </div>
            </div>
            <div 
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)' }}
            >
              <Target className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Sales Analytics - Donut Chart */}
        <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Sales Analytics</h3>
            <select className="text-sm bg-muted border border-border rounded-lg px-3 py-2 font-medium text-foreground">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-8">
            {/* Donut Chart */}
            <div className="relative w-40 h-40 lg:w-48 lg:h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" className="text-muted" />
                
                {/* Segments */}
                {(() => {
                  let offset = 0;
                  return salesByChannel.map((segment, i) => {
                    const circumference = 2 * Math.PI * 40;
                    const segmentLength = (segment.value / 100) * circumference;
                    const dashArray = `${segmentLength} ${circumference - segmentLength}`;
                    const dashOffset = -offset;
                    offset += segmentLength;
                    
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <p className="text-lg lg:text-xl font-black text-foreground">{formatCurrency(stats.monthSales)}</p>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 flex-1 w-full sm:w-auto">
              {salesByChannel.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(stats.monthSales * item.value / 100)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Income Statistics - Bar Chart */}
        <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Income Statistics</h3>
            <select className="text-sm bg-muted border border-border rounded-lg px-3 py-2 font-medium text-foreground">
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
          </div>

          {/* Y-axis labels */}
          <div className="flex gap-3 lg:gap-4">
            <div className="flex flex-col justify-between text-right text-xs text-muted-foreground font-medium py-2" style={{ height: '160px' }}>
              <span>200K</span>
              <span>150K</span>
              <span>100K</span>
              <span>50K</span>
              <span>0</span>
            </div>
            
            {/* Bars */}
            <div className="flex-1 flex items-end justify-between gap-2 lg:gap-4" style={{ height: '160px' }}>
              {monthlyData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer"
                    style={{ 
                      height: `${(item.value / 120) * 100}%`,
                      background: i === monthlyData.length - 1 
                        ? 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)'
                        : 'linear-gradient(180deg, #93C5FD 0%, #60A5FA 100%)'
                    }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Sales Report Table */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Sales Report</h3>
            <Link to="/sales" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                  <th className="pb-4 font-semibold">Customer</th>
                  <th className="pb-4 font-semibold">Product</th>
                  <th className="pb-4 font-semibold hidden sm:table-cell">Type</th>
                  <th className="pb-4 font-semibold">Price</th>
                  <th className="pb-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {sale.customer.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground text-sm">{sale.customer}</span>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground font-medium text-sm">{sale.product}</td>
                    <td className="py-4 text-muted-foreground font-medium text-sm hidden sm:table-cell">{sale.type}</td>
                    <td className="py-4 font-semibold text-foreground text-sm">{formatCurrency(sale.amount)}</td>
                    <td className="py-4">
                      <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'completed' 
                          ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' 
                          : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                      }`}>
                        {sale.status === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4 lg:space-y-6">
          {/* Today's Stats */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border/50">
            <h3 className="text-lg font-bold text-foreground mb-4">Today's Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 lg:p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Revenue</p>
                    <p className="text-base lg:text-lg font-bold text-foreground">{formatCurrency(stats.todaySales)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {stats.salesGrowth >= 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-xs lg:text-sm font-semibold text-green-500">+{stats.salesGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                      <span className="text-xs lg:text-sm font-semibold text-red-500">{stats.salesGrowth}%</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 lg:p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Orders</p>
                    <p className="text-base lg:text-lg font-bold text-foreground">{stats.todayOrders}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 lg:p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Users className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Customers</p>
                    <p className="text-base lg:text-lg font-bold text-foreground">{stats.activeCustomers}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-sm border border-border/50">
            <h3 className="text-lg font-bold text-foreground mb-4">Alerts</h3>
            <div className="space-y-3">
              <Link to="/stock" className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{stats.lowStock} Low Stock Items</p>
                </div>
                <ChevronRight className="w-4 h-4 text-red-500" />
              </Link>
              <Link to="/sales" className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{stats.pendingOrders} Pending Orders</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
