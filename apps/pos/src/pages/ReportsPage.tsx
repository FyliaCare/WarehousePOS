import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@warehousepos/utils';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CountryCode } from '@warehousepos/types';

// Theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1A1A',
    textOnLight: '#1A1A1A',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B40',
    accent: '#1A1A1A',
    textOnPrimary: '#FFFFFF',
    textOnLight: '#1A1A1A',
  },
};

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#0891b2'];

export default function ReportsPage() {
  const { store, tenant } = useAuthStore();
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  const theme = themes[country];
  
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products' | 'inventory'>('overview');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }
    return startDate.toISOString();
  };

  // Sales Report Query - using 'sales' table
  const { data: salesReport } = useQuery({
    queryKey: ['sales-report', store?.id, dateRange],
    queryFn: async () => {
      if (!store?.id) return { totalSales: 0, orderCount: 0, avgOrderValue: 0, byPaymentMethod: {}, dailySales: [], prevTotal: 0 };
      const { data, error } = await supabase
        .from('sales')
        .select('total, payment_method, payment_status, created_at')
        .eq('store_id', store.id)
        .gte('created_at', getDateRange())
        .eq('status', 'completed');
      if (error) throw error;

      const typedData = (data || []) as Array<{ total: number; payment_method: string; payment_status: string; created_at: string }>;
      const totalSales = typedData.reduce((sum, order) => sum + order.total, 0);
      const orderCount = typedData.length;
      const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

      const byPaymentMethod = typedData.reduce((acc: Record<string, number>, order) => {
        acc[order.payment_method] = (acc[order.payment_method] || 0) + order.total;
        return acc;
      }, {});

      // Daily sales for chart
      const dailyMap = typedData.reduce((acc: Record<string, { sales: number; orders: number }>, order) => {
        const date = order.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { sales: 0, orders: 0 };
        }
        acc[date].sales += order.total;
        acc[date].orders += 1;
        return acc;
      }, {});

      const dailySales = Object.entries(dailyMap)
        .map(([date, vals]) => ({ date, ...vals }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

      // Calculate previous period for accurate growth comparison
      // Get data from previous period of same length
      const previousPeriodStart = new Date(getDateRange());
      const now = new Date();
      const periodLength = now.getTime() - previousPeriodStart.getTime();
      const prevStartDate = new Date(previousPeriodStart.getTime() - periodLength);
      
      const { data: prevData } = await supabase
        .from('sales')
        .select('total')
        .eq('store_id', store!.id)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', getDateRange())
        .eq('status', 'completed');
      
      const prevTotal = (prevData || []).reduce((sum, order: any) => sum + order.total, 0);

      return {
        totalSales,
        orderCount,
        avgOrderValue,
        byPaymentMethod,
        dailySales,
        prevTotal,
      };
    },
    enabled: !!store?.id,
  });

  // Product Sales Report - using 'sale_items' table
  const { data: productReport } = useQuery({
    queryKey: ['product-report', store?.id, dateRange],
    queryFn: async () => {
      if (!store?.id) return [];
      
      // First get sales in date range
      const { data: salesInRange } = await supabase
        .from('sales')
        .select('id')
        .eq('store_id', store.id)
        .gte('created_at', getDateRange())
        .eq('status', 'completed');
      
      if (!salesInRange || salesInRange.length === 0) return [];
      
      const saleIds = salesInRange.map(s => s.id);
      
      const { data, error } = await supabase
        .from('sale_items')
        .select('quantity, total, product:products(id, name, sku)')
        .in('sale_id', saleIds);
      if (error) throw error;

      const productSales = (data || []).reduce((acc: Record<string, { name: string; sku: string; quantity: number; revenue: number }>, item: any) => {
        const id = item.product?.id || 'unknown';
        const name = item.product?.name || 'Unknown';
        const sku = item.product?.sku || '';
        if (!acc[id]) {
          acc[id] = { name, sku, quantity: 0, revenue: 0 };
        }
        acc[id].quantity += item.quantity;
        acc[id].revenue += item.total;
        return acc;
      }, {});

      return Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!store?.id,
  });

  // Customer Report - using 'sales' table
  const { data: customerReport } = useQuery({
    queryKey: ['customer-report', store?.id, dateRange],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('sales')
        .select('customer_id, total, customer:customers(name)')
        .eq('store_id', store.id)
        .gte('created_at', getDateRange())
        .eq('status', 'completed')
        .not('customer_id', 'is', null);
      if (error) throw error;

      const customerSales = (data || []).reduce((acc: Record<string, { name: string; orders: number; spent: number }>, sale: any) => {
        const id = sale.customer_id;
        if (!acc[id]) {
          acc[id] = { name: sale.customer?.name || 'Unknown', orders: 0, spent: 0 };
        }
        acc[id].orders += 1;
        acc[id].spent += sale.total;
        return acc;
      }, {});

      return Object.values(customerSales)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 10);
    },
    enabled: !!store?.id,
  });

  // Inventory Report - using stock_levels and products
  const { data: inventoryReport } = useQuery({
    queryKey: ['inventory-report', store?.id],
    queryFn: async () => {
      if (!store?.id) return { totalProducts: 0, lowStock: [], outOfStock: [], totalValue: 0, categories: [] };
      
      // Get products with their stock levels
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sku, price, low_stock_threshold, category:categories(name), stock_levels(quantity)')
        .eq('store_id', store.id)
        .eq('is_active', true);
      if (error) throw error;

      const typedProducts = (products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.stock_levels?.[0]?.quantity || 0,
        price: p.price,
        reorder_level: p.low_stock_threshold || 10,
        category: p.category?.name || 'Uncategorized'
      }));

      const totalProducts = typedProducts.length;
      const lowStock = typedProducts.filter(p => p.quantity > 0 && p.quantity <= p.reorder_level);
      const outOfStock = typedProducts.filter(p => p.quantity <= 0);
      const totalValue = typedProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);

      const categoryMap = typedProducts.reduce((acc: Record<string, { count: number; value: number }>, p) => {
        const cat = p.category || 'Uncategorized';
        if (!acc[cat]) {
          acc[cat] = { count: 0, value: 0 };
        }
        acc[cat].count += 1;
        acc[cat].value += p.quantity * p.price;
        return acc;
      }, {});

      const categories = Object.entries(categoryMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value);

      return { totalProducts, lowStock, outOfStock, totalValue, categories };
    },
    enabled: !!store?.id,
  });

  // Export Functions
  const exportReport = () => {
    if (activeTab === 'sales' || activeTab === 'overview') {
      const headers = ['Date', 'Sales', 'Orders'];
      const rows = (salesReport?.dailySales || []).map(d => [d.date, d.sales.toFixed(2), d.orders]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(csv, `sales-report-${dateRange}.csv`);
      toast.success('Sales report exported');
    } else if (activeTab === 'products') {
      const headers = ['Product', 'SKU', 'Quantity Sold', 'Revenue'];
      const rows = (productReport || []).map(p => [p.name, p.sku, p.quantity, p.revenue.toFixed(2)]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(csv, `product-report-${dateRange}.csv`);
      toast.success('Product report exported');
    } else if (activeTab === 'inventory') {
      const lowStockData = inventoryReport?.lowStock || [];
      const outOfStockData = inventoryReport?.outOfStock || [];
      const headers = ['Product', 'SKU', 'Quantity', 'Reorder Level', 'Status'];
      const rows = [
        ...outOfStockData.map(p => [p.name, p.sku, p.quantity, p.reorder_level, 'Out of Stock']),
        ...lowStockData.map(p => [p.name, p.sku, p.quantity, p.reorder_level, 'Low Stock']),
      ];
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(csv, 'inventory-alert-report.csv');
      toast.success('Inventory report exported');
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paymentMethodData = Object.entries(salesReport?.byPaymentMethod || {}).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value,
  }));

  const growth = salesReport ? ((salesReport.totalSales - salesReport.prevTotal) / salesReport.prevTotal * 100) : 0;
  const GrowthIcon = growth > 0 ? ArrowUpRight : growth < 0 ? ArrowDownRight : Minus;
  const growthColor = growth > 0 ? 'text-emerald-600' : growth < 0 ? 'text-red-600' : 'text-zinc-500';

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Premium Header */}
      <div 
        className="px-6 py-5"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: theme.textOnPrimary }}>
              Reports & Analytics
            </h1>
            <p className="text-sm mt-0.5 opacity-80" style={{ color: theme.textOnPrimary }}>
              Business insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20">
              <Calendar className="w-4 h-4" style={{ color: theme.textOnPrimary }} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                style={{ color: theme.textOnPrimary }}
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
              style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-2">
          {[
            { value: 'overview', label: 'Overview', icon: BarChart3 },
            { value: 'sales', label: 'Sales', icon: DollarSign },
            { value: 'products', label: 'Products', icon: Package },
            { value: 'inventory', label: 'Inventory', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? 'text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
              style={activeTab === tab.value ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
                    <DollarSign className="w-6 h-6" style={{ color: theme.accent }} />
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${growthColor} bg-zinc-100`}>
                    <GrowthIcon className="w-3 h-3" />
                    {Math.abs(growth).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-zinc-900">{formatCurrency(salesReport?.totalSales || 0, country)}</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-zinc-900">{salesReport?.orderCount || 0}</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-zinc-900">{formatCurrency(salesReport?.avgOrderValue || 0, country)}</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Active Customers</p>
                <p className="text-2xl font-bold text-zinc-900">{customerReport?.length || 0}</p>
              </div>
            </div>

            {/* Sales Trend Chart */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Sales Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesReport?.dailySales || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    tickFormatter={(v) => formatCurrency(v, country).replace(/\.\d+/, '')} 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value, country), 'Sales']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={theme.primary} 
                    strokeWidth={3} 
                    name="Sales"
                    dot={{ fill: theme.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Payment Methods</h2>
                {paymentMethodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {paymentMethodData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, country)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-zinc-500">
                    No data available
                  </div>
                )}
              </div>

              {/* Top Customers */}
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Top Customers</h2>
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {customerReport?.map((customer: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-zinc-900">{customer.name}</p>
                          <p className="text-xs text-zinc-500">{customer.orders} orders</p>
                        </div>
                      </div>
                      <span className="font-bold text-sm" style={{ color: theme.accent }}>
                        {formatCurrency(customer.spent, country)}
                      </span>
                    </div>
                  ))}
                  {(!customerReport || customerReport.length === 0) && (
                    <p className="text-zinc-500 text-center py-8">No customer data</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-zinc-900">{formatCurrency(salesReport?.totalSales || 0, country)}</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-zinc-900">{salesReport?.orderCount || 0}</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-zinc-900">{formatCurrency(salesReport?.avgOrderValue || 0, country)}</p>
              </div>
            </div>

            {/* Sales Trend Chart */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Daily Sales Trend</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={salesReport?.dailySales || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                  />
                  <YAxis tickFormatter={(v) => formatCurrency(v, country).replace(/\.\d+/, '')} stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value, country), 'Sales']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={theme.primary} 
                    strokeWidth={3} 
                    name="Sales"
                    dot={{ fill: theme.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Sales by Payment Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentMethodData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value, country)} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col justify-center space-y-3">
                  {paymentMethodData.map((method, index) => (
                    <div key={method.name} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm font-medium text-zinc-700">{method.name}</span>
                      </div>
                      <span className="font-bold text-sm" style={{ color: theme.accent }}>
                        {formatCurrency(method.value, country)}
                      </span>
                    </div>
                  ))}
                  {paymentMethodData.length === 0 && (
                    <p className="text-zinc-500 text-center py-8">No payment data</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Top Products Chart */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Top 10 Products by Revenue</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={(productReport || []).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }} 
                    interval={0} 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    stroke="#6b7280"
                  />
                  <YAxis tickFormatter={(v) => formatCurrency(v, country).replace(/\.\d+/, '')} stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value, country), 'Revenue']}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill={theme.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Product Sales Table */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h2 className="text-lg font-semibold text-zinc-900">All Product Sales</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Qty Sold</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-100">
                    {(productReport || []).map((product, index) => (
                      <tr key={index} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{product.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 text-right font-medium">{product.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right" style={{ color: theme.accent }}>
                          {formatCurrency(product.revenue, country)}
                        </td>
                      </tr>
                    ))}
                    {(!productReport || productReport.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          No product sales data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Inventory Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-zinc-900">{inventoryReport?.totalProducts || 0}</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Inventory Value</p>
                <p className="text-2xl font-bold text-zinc-900">{formatCurrency(inventoryReport?.totalValue || 0, country)}</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-600">{inventoryReport?.lowStock?.length || 0}</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryReport?.outOfStock?.length || 0}</p>
              </div>
            </div>

            {/* Inventory by Category Chart */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Inventory Value by Category</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={inventoryReport?.categories || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v, country).replace(/\.\d+/, '')} stroke="#6b7280" />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value, country), 'Value']}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill={theme.primary} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low Stock Items */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-200" style={{ backgroundColor: theme.primaryLight }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-semibold text-zinc-900">Low Stock Items</h2>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto">
                  {(inventoryReport?.lowStock || []).map((product: any) => (
                    <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50">
                      <div>
                        <p className="font-medium text-zinc-900">{product.name}</p>
                        <p className="text-sm text-zinc-500">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600">{product.quantity} left</p>
                        <p className="text-xs text-zinc-500">Reorder at: {product.reorder_level}</p>
                      </div>
                    </div>
                  ))}
                  {(!inventoryReport?.lowStock || inventoryReport.lowStock.length === 0) && (
                    <div className="px-6 py-12 text-center text-zinc-500">
                      No low stock items
                    </div>
                  )}
                </div>
              </div>

              {/* Out of Stock Items */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-zinc-900">Out of Stock Items</h2>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto">
                  {(inventoryReport?.outOfStock || []).map((product: any) => (
                    <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50">
                      <div>
                        <p className="font-medium text-zinc-900">{product.name}</p>
                        <p className="text-sm text-zinc-500">{product.sku}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  ))}
                  {(!inventoryReport?.outOfStock || inventoryReport.outOfStock.length === 0) && (
                    <div className="px-6 py-12 text-center text-zinc-500">
                      No out of stock items
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
