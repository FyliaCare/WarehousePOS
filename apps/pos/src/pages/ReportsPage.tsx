import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Download, TrendingUp, Package, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#0891b2'];

export default function ReportsPage() {
  const { store } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'inventory'>('sales');
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

  // Sales Report Query with daily breakdown
  const { data: salesReport } = useQuery({
    queryKey: ['sales-report', store?.id, dateRange],
    queryFn: async () => {
      if (!store?.id) return { totalSales: 0, orderCount: 0, avgOrderValue: 0, byPaymentMethod: {}, dailySales: [] };
      const { data, error } = await supabase
        .from('orders')
        .select('total, payment_method, payment_status, created_at')
        .eq('store_id', store.id)
        .gte('created_at', getDateRange())
        .in('status', ['completed', 'delivered']);
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

      return {
        totalSales,
        orderCount,
        avgOrderValue,
        byPaymentMethod,
        dailySales,
      };
    },
    enabled: !!store?.id,
  });

  // Product Sales Report
  const { data: productReport } = useQuery({
    queryKey: ['product-report', store?.id, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          product:products(id, name, sku),
          order:orders!inner(store_id, status, created_at)
        `)
        .eq('order.store_id', store!.id)
        .gte('order.created_at', getDateRange())
        .in('order.status', ['completed', 'delivered']);
      if (error) throw error;

      // Aggregate by product
      const productSales = data.reduce((acc: Record<string, { name: string; sku: string; quantity: number; revenue: number }>, item: any) => {
        const id = item.product?.id || 'unknown';
        const name = item.product?.name || 'Unknown';
        const sku = item.product?.sku || '';
        if (!acc[id]) {
          acc[id] = { name, sku, quantity: 0, revenue: 0 };
        }
        acc[id].quantity += item.quantity;
        acc[id].revenue += item.total_price;
        return acc;
      }, {});

      return Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!store?.id,
  });

  // Customer Report
  const { data: customerReport } = useQuery({
    queryKey: ['customer-report', store?.id, dateRange],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('customer_id, customer_name, total')
        .eq('store_id', store.id)
        .gte('created_at', getDateRange())
        .in('status', ['completed', 'delivered'])
        .not('customer_id', 'is', null);
      if (error) throw error;

      const customerSales = data.reduce((acc: Record<string, { name: string; orders: number; spent: number }>, order: any) => {
        const id = order.customer_id;
        if (!acc[id]) {
          acc[id] = { name: order.customer_name || 'Unknown', orders: 0, spent: 0 };
        }
        acc[id].orders += 1;
        acc[id].spent += order.total;
        return acc;
      }, {});

      return Object.values(customerSales)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 10);
    },
    enabled: !!store?.id,
  });

  // Inventory Report
  const { data: inventoryReport } = useQuery({
    queryKey: ['inventory-report', store?.id],
    queryFn: async () => {
      if (!store?.id) return { totalProducts: 0, lowStock: [], outOfStock: [], totalValue: 0, categories: [] };
      
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sku, quantity, price, reorder_level, category')
        .eq('store_id', store.id)
        .eq('is_active', true);
      if (error) throw error;

      const typedProducts = products as Array<{ 
        id: string; name: string; sku: string; quantity: number; 
        price: number; reorder_level: number; category: string 
      }>;

      const totalProducts = typedProducts.length;
      const lowStock = typedProducts.filter(p => p.quantity > 0 && p.quantity <= (p.reorder_level || 10));
      const outOfStock = typedProducts.filter(p => p.quantity <= 0);
      const totalValue = typedProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);

      // Category breakdown
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

  const formatCurrency = (amount: number) => {
    const currency = store?.tenant?.country === 'NG' ? '₦' : '₵';
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // Export Functions
  const exportSalesReport = () => {
    const headers = ['Date', 'Sales', 'Orders'];
    const rows = (salesReport?.dailySales || []).map(d => [d.date, d.sales.toFixed(2), d.orders]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `sales-report-${dateRange}.csv`);
    toast.success('Sales report exported');
  };

  const exportProductReport = () => {
    const headers = ['Product', 'SKU', 'Quantity Sold', 'Revenue'];
    const rows = (productReport || []).map(p => [p.name, p.sku, p.quantity, p.revenue.toFixed(2)]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `product-report-${dateRange}.csv`);
    toast.success('Product report exported');
  };

  const exportInventoryReport = () => {
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

  // Payment method data for pie chart
  const paymentMethodData = Object.entries(salesReport?.byPaymentMethod || {}).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={() => {
              if (activeTab === 'sales') exportSalesReport();
              else if (activeTab === 'products') exportProductReport();
              else exportInventoryReport();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'sales' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('sales')}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Sales
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'products' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('products')}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Products
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'inventory' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('inventory')}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Inventory
        </button>
      </div>

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <>
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(salesReport?.totalSales || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesReport?.orderCount || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Avg Order Value</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(salesReport?.avgOrderValue || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Top Customers</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {customerReport?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesReport?.dailySales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Pie Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Payment Method</h2>
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
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {paymentMethodData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h2>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {customerReport?.map((customer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.orders} orders</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(customer.spent)}
                    </span>
                  </div>
                ))}
                {(!customerReport || customerReport.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          {/* Product Sales Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(productReport || []).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Product Sales</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(productReport || []).map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{product.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                  {(!productReport || productReport.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No product sales data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          {/* Inventory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {inventoryReport?.totalProducts || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Inventory Value</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(inventoryReport?.totalValue || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {inventoryReport?.lowStock?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {inventoryReport?.outOfStock?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory by Category Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Value by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryReport?.categories || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Value']} />
                <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Items */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Low Stock Items</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                {(inventoryReport?.lowStock || []).map((product: any) => (
                  <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-600">{product.quantity} left</p>
                      <p className="text-sm text-gray-500">Reorder: {product.reorder_level}</p>
                    </div>
                  </div>
                ))}
                {(!inventoryReport?.lowStock || inventoryReport.lowStock.length === 0) && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No low stock items
                  </div>
                )}
              </div>
            </div>

            {/* Out of Stock Items */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Out of Stock Items</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                {(inventoryReport?.outOfStock || []).map((product: any) => (
                  <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                      Out of Stock
                    </span>
                  </div>
                ))}
                {(!inventoryReport?.outOfStock || inventoryReport.outOfStock.length === 0) && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No out of stock items
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
