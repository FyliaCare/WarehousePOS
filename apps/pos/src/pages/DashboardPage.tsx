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

  // Premium Design System - Vegetation Green & Gold
  const isNigeria = tenant?.country === 'NG';
  const currency = isNigeria ? '₦' : 'GH₵';
  
  // Premium color palette: Vegetation Green primary, Gold accents, White bg, Black text
  const theme = {
    // Vegetation Green - Primary brand
    primary: '#2D5016',        // Deep forest green
    primaryLight: '#F4F7F0',   // Soft green tint for backgrounds
    primaryMid: '#6B8E4E',     // Mid vegetation green
    primaryHover: '#3D6B1F',   // Hover state
    
    // Gold - Premium accents
    gold: '#D4AF37',           // Classic gold
    goldLight: '#FFF8E7',      // Gold tint
    goldDark: '#B8941F',       // Deep gold for emphasis
    
    // Foundation
    white: '#FFFFFF',
    black: '#0A0A0A',          // True black for typography
    
    // Neutrals
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#E5E5E5',
    gray300: '#D4D4D4',
    gray400: '#A3A3A3',
    gray500: '#737373',
    gray600: '#525252',
    gray700: '#404040',
    gray800: '#262626',
    gray900: '#171717',
    
    // Semantic
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#2563EB',
    
    flag: isNigeria ? '🇳🇬' : '🇬🇭',
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

      // Low stock products - query stock_levels table joined with products
      const { data: lowStockProducts } = await supabase
        .from('stock_levels')
        .select('id, quantity, product:products!inner(id, is_active)')
        .eq('store_id', store.id)
        .eq('product.is_active', true)
        .lt('quantity', 10);

      // Pending orders
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', store.id)
        .in('status', ['pending', 'processing']);

      // Top products - fetch through orders first then order_items
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', store.id)
        .gte('created_at', monthAgoISO)
        .in('status', ['completed', 'delivered']);

      let topProducts: { name: string; sold: number; revenue: number }[] = [];
      
      if (recentOrders && recentOrders.length > 0) {
        const orderIds = recentOrders.map(o => o.id);
        
        const { data: topProductData } = await supabase
          .from('order_items')
          .select('quantity, total, product_name')
          .in('order_id', orderIds);

        const productSales = (topProductData || []).reduce((acc: Record<string, { name: string; sold: number; revenue: number }>, item: any) => {
          const name = item.product_name || 'Unknown';
          if (!acc[name]) {
            acc[name] = { name, sold: 0, revenue: 0 };
          }
          acc[name].sold += item.quantity;
          acc[name].revenue += item.total;
          return acc;
        }, {});

        topProducts = Object.values(productSales)
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
    <div className="min-h-screen" style={{ backgroundColor: theme.white }}>
      {/* Premium Header with Vegetation Green */}
      <header style={{ backgroundColor: theme.primary }} className="relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>
        
        <div className="max-w-7xl mx-auto px-6 py-5 relative">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.gold }}>
                <span className="text-xl">{theme.flag}</span>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">{tenant?.name || 'WarehousePOS'}</h1>
                <p className="text-xs text-white/70">{store?.name || 'Main Store'}</p>
              </div>
            </div>
            
            {/* Time & User */}
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wide font-medium">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-base font-bold tabular-nums text-white">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-white/30 shadow-lg"
                style={{ backgroundColor: theme.gold }}
              >
                <span className="text-sm font-bold" style={{ color: theme.black }}>{firstName.charAt(0)}</span>
              </div>
            </div>
          </div>

          {/* Greeting + POS Button */}
          <div className="mt-8 flex items-end justify-between">
            <div>
              <p className="text-sm text-white/70 mb-1 uppercase tracking-wider font-medium">{greeting()}</p>
              <h2 className="text-3xl font-bold text-white">{firstName}</h2>
            </div>
            <Link
              to="/pos"
              className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm shadow-2xl transition-all hover:scale-105 hover:shadow-gold/50 border"
              style={{ 
                backgroundColor: theme.gold,
                color: theme.black,
                borderColor: theme.goldDark,
              }}
            >
              <ShoppingCart className="w-5 h-5 transition-transform group-hover:rotate-12" />
              Open POS
            </Link>
          </div>

          {/* Premium Metrics Strip - Gold Accent */}
          <div 
            className="mt-8 -mb-16 rounded-2xl p-1.5 shadow-2xl backdrop-blur-sm border"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.98)',
              borderColor: theme.gray200
            }}
          >
            <div className="grid grid-cols-4 divide-x divide-gray-100">
              {/* Revenue */}
              <div className="p-5 text-center">
                <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: theme.gray500 }}>
                  Today's Revenue
                </p>
                <p className="text-2xl font-black" style={{ color: theme.black }}>
                  {formatCurrency(stats.todaySales)}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {stats.salesGrowth >= 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4" style={{ color: theme.success }} />
                      <span className="text-xs font-bold" style={{ color: theme.success }}>+{stats.salesGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4" style={{ color: theme.error }} />
                      <span className="text-xs font-bold" style={{ color: theme.error }}>{stats.salesGrowth}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Orders */}
              <div className="p-5 text-center">
                <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: theme.gray500 }}>
                  Orders Today
                </p>
                <p className="text-2xl font-black" style={{ color: theme.black }}>
                  {stats.todayOrders}
                </p>
                <p className="text-xs mt-2 font-semibold" style={{ color: theme.gold }}>
                  Avg {formatCurrency(stats.avgOrderValue)}
                </p>
              </div>

              {/* Customers */}
              <div className="p-5 text-center">
                <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: theme.gray500 }}>
                  Active Customers
                </p>
                <p className="text-2xl font-black" style={{ color: theme.black }}>
                  {stats.activeCustomers}
                </p>
                <p className="text-xs mt-2 font-semibold" style={{ color: theme.gray600 }}>
                  This month
                </p>
              </div>

              {/* Target with gold accent */}
              <div className="p-5 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundColor: theme.gold }}></div>
                <p className="text-xs uppercase tracking-widest font-bold mb-2 relative z-10" style={{ color: theme.goldDark }}>
                  Monthly Goal
                </p>
                <p className="text-2xl font-black relative z-10" style={{ color: theme.black }}>
                  {stats.targetProgress}%
                </p>
                <div className="mt-3 h-2 rounded-full overflow-hidden relative z-10" style={{ backgroundColor: theme.gray200 }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.targetProgress}%`, backgroundColor: theme.gold }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-8">
        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Period Summary - Clean white cards */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="rounded-2xl p-6 border-2 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: theme.white, borderColor: theme.gray200 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest font-bold" style={{ color: theme.gray500 }}>This Week</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
                    <Activity className="w-5 h-5" style={{ color: theme.primary }} />
                  </div>
                </div>
                <p className="text-3xl font-black mb-1" style={{ color: theme.black }}>{formatCurrency(stats.weekSales)}</p>
                <p className="text-sm font-semibold" style={{ color: theme.gold }}>{stats.weekOrders} orders</p>
              </div>
              
              <div 
                className="rounded-2xl p-6 border-2 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: theme.goldLight, borderColor: theme.gold }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest font-bold" style={{ color: theme.goldDark }}>This Month</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.gold }}>
                    <TrendingUp className="w-5 h-5" style={{ color: theme.black }} />
                  </div>
                </div>
                <p className="text-3xl font-black mb-1" style={{ color: theme.black }}>{formatCurrency(stats.monthSales)}</p>
                <p className="text-sm font-semibold" style={{ color: theme.goldDark }}>Target: {formatCurrency(stats.monthTarget)}</p>
              </div>
            </div>

            {/* Sales Chart - Premium card */}
            <div className="bg-white rounded-2xl border-2 p-6 shadow-sm" style={{ borderColor: theme.gray200 }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black uppercase tracking-wide" style={{ color: theme.black }}>Sales Trend</h3>
                <select 
                  className="text-sm border-2 rounded-lg px-3 py-2 font-bold cursor-pointer hover:border-gold transition-colors"
                  style={{ borderColor: theme.gray300, color: theme.black }}
                >
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
              <div className="h-40 flex items-end justify-between gap-3">
                {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer shadow-sm"
                      style={{ 
                        height: `${height}%`, 
                        backgroundColor: i === 6 ? theme.gold : theme.primaryMid
                      }}
                    />
                    <span className="text-xs font-bold" style={{ color: theme.gray500 }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products - Premium card with gold accents */}
            <div className="bg-white rounded-2xl border-2 p-6 shadow-sm" style={{ borderColor: theme.gray200 }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-black uppercase tracking-wide" style={{ color: theme.black }}>Top Products</h3>
                <Link 
                  to="/reports" 
                  className="text-sm font-bold flex items-center gap-1 hover:scale-105 transition-transform"
                  style={{ color: theme.gold }}
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {stats.topProducts.map((product, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-4 rounded-xl hover:shadow-sm transition-all"
                    style={{ backgroundColor: i === 0 ? theme.goldLight : theme.gray50, border: i === 0 ? `2px solid ${theme.gold}` : 'none' }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg text-sm font-black flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: i === 0 ? theme.gold : theme.primary, color: i === 0 ? theme.black : 'white' }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: theme.black }}>{product.name}</p>
                        <p className="text-xs font-semibold" style={{ color: theme.gray600 }}>{product.sold} units sold</p>
                      </div>
                    </div>
                    <p className="text-sm font-black" style={{ color: i === 0 ? theme.gold : theme.black }}>{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Premium sidebar */}
          <div className="space-y-6">
            {/* Quick Access - Gold accented */}
            <div className="bg-white rounded-2xl border-2 p-6 shadow-sm" style={{ borderColor: theme.gray200 }}>
              <h3 className="text-sm font-black uppercase tracking-wide mb-4" style={{ color: theme.black }}>Quick Access</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="group flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                    style={{ backgroundColor: theme.gray50 }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-center" style={{ color: theme.black }}>{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Alerts - Gold border for high priority */}
            <div className="bg-white rounded-2xl border-2 p-6 shadow-sm" style={{ borderColor: theme.gray200 }}>
              <h3 className="text-sm font-black uppercase tracking-wide mb-4" style={{ color: theme.black }}>Attention Needed</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl border-2" style={{ backgroundColor: theme.goldLight, borderColor: theme.gold }}>
                  <AlertCircle className="w-5 h-5 shrink-0" style={{ color: theme.goldDark }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: theme.goldDark }}>Low Stock Alert</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: theme.gray600 }}>{stats.lowStock} products below threshold</p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: theme.goldDark }} />
                </div>
                <div 
                  className="flex items-start gap-3 p-4 rounded-xl border-2"
                  style={{ backgroundColor: theme.primaryLight, borderColor: theme.primaryMid }}
                >
                  <Clock className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: theme.primary }}>Pending Orders</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: theme.gray600 }}>{stats.pendingOrders} awaiting fulfillment</p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: theme.primary }} />
                </div>
              </div>
            </div>

            {/* Delivery Widget */}
            <DeliveryDashboardWidget />

            {/* Recent Sales - Premium list */}
            <div className="bg-white rounded-2xl border-2 p-6 shadow-sm" style={{ borderColor: theme.gray200 }}>
              <h3 className="text-sm font-black uppercase tracking-wide mb-4" style={{ color: theme.black }}>Recent Sales</h3>
              <div className="space-y-3">
                {[
                  { customer: 'Kwame Asante', amount: isNigeria ? 45000 : 650, time: '2 min' },
                  { customer: 'Ama Serwah', amount: isNigeria ? 28500 : 420, time: '15 min' },
                  { customer: 'Walk-in Customer', amount: isNigeria ? 12000 : 175, time: '32 min' },
                ].map((sale, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:shadow-sm transition-shadow" style={{ backgroundColor: theme.gray50 }}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: theme.gold }}
                      >
                        <span className="text-xs font-black" style={{ color: theme.black }}>
                          {sale.customer.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: theme.textOnLight }}>{sale.customer}</p>
                        <p className="text-[10px]" style={{ color: theme.accent }}>{sale.time} ago</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: theme.black }}>{sale.customer}</p>
                        <p className="text-xs font-semibold" style={{ color: theme.gray500 }}>{sale.time} ago</p>
                      </div>
                    </div>
                    <p className="text-sm font-black" style={{ color: theme.gold }}>{formatCurrency(sale.amount)}</p>
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
