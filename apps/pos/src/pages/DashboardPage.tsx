import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Truck,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { DeliveryDashboardWidget } from '@/components/delivery';

export function DashboardPage() {
  const { user, tenant, store } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Country-based theming with rich color palettes
  const isNigeria = tenant?.country === 'NG';
  const currency = isNigeria ? '₦' : 'GH₵';
  
  // Ghana: Rich Gold palette | Nigeria: Deep Green palette
  const theme = isNigeria ? {
    // Nigeria - Greens
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#B8E0CC',
    primaryDark: '#006B41',
    accent: '#00A86B',
    text: '#FFFFFF',
    textOnLight: '#004D31',
    flag: '🇳🇬',
  } : {
    // Ghana - Golds
    primary: '#FFD000',
    primaryLight: '#FFF9E0',
    primaryMid: '#FFEC80',
    primaryDark: '#C9A400',
    accent: '#B8960B',
    text: '#1A1400',
    textOnLight: '#6B5A00',
    flag: '🇬🇭',
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

      // Today's sales
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', todayISO)
        .in('status', ['completed', 'delivered']);

      const todaySales = (todayOrders || []).reduce((sum, o: any) => sum + o.total, 0);
      const todayOrderCount = (todayOrders || []).length;
      
      // Yesterday's sales for comparison
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', yesterdayISO)
        .lt('created_at', todayISO)
        .in('status', ['completed', 'delivered']);

      const yesterdaySales = (yesterdayOrders || []).reduce((sum, o: any) => sum + o.total, 0);
      const salesGrowth = yesterdaySales > 0 
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
        : 0;

      // Week sales
      const { data: weekOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', weekAgoISO)
        .in('status', ['completed', 'delivered']);

      const weekSales = (weekOrders || []).reduce((sum, o: any) => sum + o.total, 0);
      const weekOrderCount = (weekOrders || []).length;

      // Month sales
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', store.id)
        .gte('created_at', monthAgoISO)
        .in('status', ['completed', 'delivered']);

      const monthSales = (monthOrders || []).reduce((sum, o: any) => sum + o.total, 0);

      // Active customers this month
      const { data: activeCustomers } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('store_id', store.id)
        .gte('created_at', monthAgoISO)
        .not('customer_id', 'is', null)
        .in('status', ['completed', 'delivered']);

      const uniqueCustomers = new Set((activeCustomers || []).map((o: any) => o.customer_id)).size;

      // Low stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .lt('stock_quantity', 10);

      // Pending orders
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', store.id)
        .in('status', ['pending', 'processing']);

      // Top products
      const { data: topProductData } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          product:products(name),
          order:orders!inner(store_id, status, created_at)
        `)
        .eq('order.store_id', store.id)
        .gte('order.created_at', monthAgoISO)
        .in('order.status', ['completed', 'delivered']);

      const productSales = (topProductData || []).reduce((acc: Record<string, { name: string; sold: number; revenue: number }>, item: any) => {
        const name = item.product?.name || 'Unknown';
        if (!acc[name]) {
          acc[name] = { name, sold: 0, revenue: 0 };
        }
        acc[name].sold += item.quantity;
        acc[name].revenue += item.total_price;
        return acc;
      }, {});

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // Monthly target (can be stored in tenant settings, using default for now)
      // Use type assertion since tenant.settings is a JSONB field
      const tenantSettings = (tenant as { settings?: { monthly_target?: number } })?.settings;
      const monthTarget = tenantSettings?.monthly_target || monthSales * 1.2;
      const targetProgress = monthTarget > 0 ? Math.round((monthSales / monthTarget) * 100) : 0;

      return {
        todaySales,
        todayOrders: todayOrderCount,
        avgOrderValue: todayOrderCount > 0 ? todaySales / todayOrderCount : 0,
        salesGrowth: Math.round(salesGrowth * 10) / 10,
        weekSales,
        weekOrders: weekOrderCount,
        monthSales,
        monthTarget,
        targetProgress: Math.min(targetProgress, 100),
        topProducts,
        lowStock: (lowStockProducts || []).length,
        pendingOrders: (pendingOrders || []).length,
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

  const quickLinks = [
    { title: 'Products', icon: Package, href: '/products' },
    { title: 'Customers', icon: Users, href: '/customers' },
    { title: 'Reports', icon: BarChart3, href: '/reports' },
    { title: 'Deliveries', icon: Truck, href: '/deliveries' },
    { title: 'Stock', icon: Boxes, href: '/stock' },
    { title: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.primaryLight }}>
      {/* Premium Header */}
      <header style={{ backgroundColor: theme.primary }}>
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{theme.flag}</span>
              <div>
                <h1 className="text-sm font-semibold" style={{ color: theme.text }}>{tenant?.name || 'WarehousePOS'}</h1>
                <p className="text-xs opacity-70" style={{ color: theme.text }}>{store?.name || 'Main Store'}</p>
              </div>
            </div>
            
            {/* Time & User */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs opacity-70" style={{ color: theme.text }}>
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm font-semibold tabular-nums" style={{ color: theme.text }}>
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: theme.text, backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <span className="text-sm font-semibold" style={{ color: theme.text }}>{firstName.charAt(0)}</span>
              </div>
            </div>
          </div>

          {/* Greeting + POS */}
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-xs opacity-70 mb-1" style={{ color: theme.text }}>{greeting()}</p>
              <h2 className="text-2xl font-bold" style={{ color: theme.text }}>{firstName}</h2>
            </div>
            <Link
              to="/pos"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg transition-transform hover:scale-105"
              style={{ 
                backgroundColor: isNigeria ? '#FFFFFF' : '#1A1400',
                color: isNigeria ? theme.primary : '#FFD000'
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              Open POS
            </Link>
          </div>

          {/* Premium Metrics Strip */}
          <div 
            className="mt-6 -mb-12 rounded-xl p-1 shadow-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
          >
            <div className="grid grid-cols-4 divide-x" style={{ borderColor: theme.primaryMid }}>
              {/* Revenue */}
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: theme.accent }}>
                  Today's Revenue
                </p>
                <p className="text-xl font-bold" style={{ color: theme.textOnLight }}>
                  {formatCurrency(stats.todaySales)}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {stats.salesGrowth >= 0 ? (
                    <>
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                      <span className="text-[11px] font-semibold text-emerald-600">+{stats.salesGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                      <span className="text-[11px] font-semibold text-red-500">{stats.salesGrowth}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Orders */}
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: theme.accent }}>
                  Orders Today
                </p>
                <p className="text-xl font-bold" style={{ color: theme.textOnLight }}>
                  {stats.todayOrders}
                </p>
                <p className="text-[11px] mt-1" style={{ color: theme.primaryDark }}>
                  Avg {formatCurrency(stats.avgOrderValue)}
                </p>
              </div>

              {/* Customers */}
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: theme.accent }}>
                  Active Customers
                </p>
                <p className="text-xl font-bold" style={{ color: theme.textOnLight }}>
                  {stats.activeCustomers}
                </p>
                <p className="text-[11px] mt-1" style={{ color: theme.primaryDark }}>
                  This month
                </p>
              </div>

              {/* Target */}
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: theme.accent }}>
                  Monthly Goal
                </p>
                <p className="text-xl font-bold" style={{ color: theme.textOnLight }}>
                  {stats.targetProgress}%
                </p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.primaryMid }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${stats.targetProgress}%`, backgroundColor: theme.primary }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 pt-16 pb-6">
        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Period Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="rounded-xl p-4"
                style={{ backgroundColor: theme.primaryMid }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: theme.textOnLight }}>This Week</span>
                  <Activity className="w-4 h-4" style={{ color: theme.accent }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: theme.textOnLight }}>{formatCurrency(stats.weekSales)}</p>
                <p className="text-xs mt-1" style={{ color: theme.accent }}>{stats.weekOrders} orders</p>
              </div>
              
              <div 
                className="rounded-xl p-4"
                style={{ backgroundColor: theme.primary }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: theme.text }}>This Month</span>
                  <TrendingUp className="w-4 h-4" style={{ color: theme.text }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: theme.text }}>{formatCurrency(stats.monthSales)}</p>
                <p className="text-xs mt-1 opacity-80" style={{ color: theme.text }}>Target: {formatCurrency(stats.monthTarget)}</p>
              </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: theme.primaryMid }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: theme.textOnLight }}>Sales Trend</h3>
                <select 
                  className="text-xs border rounded-md px-2 py-1.5 font-medium"
                  style={{ borderColor: theme.primaryMid, color: theme.textOnLight }}
                >
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
              <div className="h-28 flex items-end justify-between gap-2">
                {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div 
                      className="w-full rounded-t-md transition-all"
                      style={{ 
                        height: `${height}%`, 
                        backgroundColor: i === 6 ? theme.primary : theme.primaryMid
                      }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: theme.accent }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: theme.primaryMid }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: theme.textOnLight }}>Top Products</h3>
                <Link 
                  to="/reports" 
                  className="text-xs font-medium flex items-center gap-1 hover:underline"
                  style={{ color: theme.primary }}
                >
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {stats.topProducts.map((product, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ backgroundColor: i === 0 ? theme.primaryLight : 'transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center"
                        style={{ backgroundColor: theme.primary, color: theme.text }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: theme.textOnLight }}>{product.name}</p>
                        <p className="text-[11px]" style={{ color: theme.accent }}>{product.sold} units</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold" style={{ color: theme.textOnLight }}>{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Quick Access */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: theme.primaryMid }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>Quick Access</h3>
              <div className="grid grid-cols-3 gap-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg transition-colors hover:shadow-md"
                    style={{ backgroundColor: theme.primaryLight }}
                  >
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: theme.text }} />
                    </div>
                    <span className="text-[10px] font-semibold text-center" style={{ color: theme.textOnLight }}>{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: theme.primaryMid }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>Attention Needed</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-800">Low Stock Alert</p>
                    <p className="text-[11px] text-red-600">{stats.lowStock} products below threshold</p>
                  </div>
                </div>
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{ backgroundColor: theme.primaryLight, borderColor: theme.primaryMid }}
                >
                  <Clock className="w-5 h-5 shrink-0" style={{ color: theme.accent }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: theme.textOnLight }}>Pending Orders</p>
                    <p className="text-[11px]" style={{ color: theme.accent }}>{stats.pendingOrders} awaiting fulfillment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Widget */}
            <DeliveryDashboardWidget />

            {/* Recent Sales */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: theme.primaryMid }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>Recent Sales</h3>
              <div className="space-y-3">
                {[
                  { customer: 'Kwame Asante', amount: isNigeria ? 45000 : 650, time: '2 min' },
                  { customer: 'Ama Serwah', amount: isNigeria ? 28500 : 420, time: '15 min' },
                  { customer: 'Walk-in Customer', amount: isNigeria ? 12000 : 175, time: '32 min' },
                ].map((sale, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <span className="text-[10px] font-bold" style={{ color: theme.text }}>
                          {sale.customer.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: theme.textOnLight }}>{sale.customer}</p>
                        <p className="text-[10px]" style={{ color: theme.accent }}>{sale.time} ago</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold" style={{ color: theme.textOnLight }}>{formatCurrency(sale.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
