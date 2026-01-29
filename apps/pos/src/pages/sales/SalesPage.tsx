import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Receipt,
  Download,
  Eye,
  Printer,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Select,
  EmptyState,
  Skeleton,
} from '@warehousepos/ui';
import { formatCurrency, timeAgo, formatDate } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { Sale, PaymentMethod, PaymentStatus, CountryCode } from '@warehousepos/types';

export function SalesPage() {
  const { tenant, store } = useAuthStore();
  const currency: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        return null;
    }
    
    return start.toISOString();
  };

  // Fetch sales
  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales', store?.id, searchQuery, statusFilter, dateRange],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('sales')
        .select('*, customer:customers(name, phone), items:sale_items(*, product:products(name))')
        .eq('store_id', store.id);

      if (searchQuery) {
        query = query.ilike('sale_number', `%${searchQuery}%`);
      }

      if (statusFilter) {
        query = query.eq('payment_status', statusFilter);
      }

      const dateStart = getDateRange();
      if (dateStart) {
        query = query.gte('created_at', dateStart);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Calculate totals
  const totals = sales?.reduce(
    (acc, sale: any) => ({
      count: acc.count + 1,
      total: acc.total + sale.total,
      paid: acc.paid + (sale.payment_status === 'paid' ? sale.total : 0),
    }),
    { count: 0, total: 0, paid: 0 }
  ) || { count: 0, total: 0, paid: 0 };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'momo':
        return '📱';
      case 'transfer':
        return '🏦';
      default:
        return '💰';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground">
            View and manage your sales history
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Sales</p>
          <p className="text-2xl font-bold text-foreground">{totals.count}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totals.total, currency)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Collected</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.paid, currency)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by receipt number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v as any)}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
              { value: 'all', label: 'All Time' },
            ]}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PaymentStatus | '')}
            placeholder="All Status"
            options={[
              { value: '', label: 'All Status' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'refunded', label: 'Refunded' },
            ]}
          />
        </div>
      </Card>

      {/* Sales List */}
      {isLoading ? (
        <Card>
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </Card>
      ) : sales && sales.length > 0 ? (
        <Card>
          <div className="divide-y divide-border">
            {sales.map((sale: any) => (
              <div
                key={sale.id}
                className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setViewingSale(sale)}
              >
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{sale.sale_number}</h3>
                    <Badge
                      variant={
                        sale.payment_status === 'paid'
                          ? 'success'
                          : sale.payment_status === 'pending'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {sale.payment_status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sale.customer?.name || 'Walk-in Customer'} •{' '}
                    {sale.items?.length || 0} items •{' '}
                    {timeAgo(sale.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(sale.total, currency)}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                    <span>{getPaymentMethodIcon(sale.payment_method)}</span>
                    {sale.payment_method.replace('_', ' ')}
                  </p>
                </div>
                <Button variant="ghost" size="icon">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No sales found"
          description="Your sales will appear here"
          icon={<Receipt className="w-12 h-12" />}
        />
      )}

      {/* Sale Detail Modal */}
      <Modal
        open={!!viewingSale}
        onOpenChange={() => setViewingSale(null)}
        title={`Receipt ${viewingSale?.sale_number}`}
      >
        {viewingSale && (
          <div className="space-y-4">
            {/* Header Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">
                  {formatDate(viewingSale.created_at, 'full')}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Customer</span>
                <span className="text-foreground">
                  {(viewingSale as any).customer?.name || 'Walk-in Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="text-foreground capitalize">
                  {viewingSale.payment_method.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Items</h4>
              {(viewingSale as any).items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.product?.name} × {item.quantity}
                  </span>
                  <span className="text-foreground">
                    {formatCurrency(item.total, currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(viewingSale.subtotal, currency)}
                </span>
              </div>
              {viewingSale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">
                    -{formatCurrency(viewingSale.discount, currency)}
                  </span>
                </div>
              )}
              {viewingSale.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground">
                    {formatCurrency(viewingSale.tax, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(viewingSale.total, currency)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
              <Button className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
