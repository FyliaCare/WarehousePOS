import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, DollarSign, Download, Search, 
  CheckCircle, XCircle, Clock, RefreshCw
} from 'lucide-react';
import { Card, Badge, Button, Input, Select, Skeleton, Modal } from '@warehousepos/ui';
import { formatDate } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';

interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  status: string;
  paystack_reference: string;
  payment_method: string;
  card_last4: string;
  card_type: string;
  paid_at: string;
  created_at: string;
  tenant: {
    business_name: string;
    country: string;
  };
}

export function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*, tenant:tenants(business_name, country)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data } = await query;
      return data as Payment[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      const [thisMonthPaid, lastMonthPaid, pending, failed] = await Promise.all([
        supabase
          .from('payments')
          .select('amount, currency')
          .eq('status', 'paid')
          .gte('paid_at', thisMonth),
        supabase
          .from('payments')
          .select('amount, currency')
          .eq('status', 'paid')
          .gte('paid_at', lastMonth)
          .lt('paid_at', lastMonthEnd),
        supabase
          .from('payments')
          .select('amount', { count: 'exact' })
          .eq('status', 'pending'),
        supabase
          .from('payments')
          .select('amount', { count: 'exact' })
          .eq('status', 'failed'),
      ]);

      const thisMonthGhs = (thisMonthPaid.data || [])
        .filter((p: any) => p.currency === 'GHS')
        .reduce((sum, p: any) => sum + p.amount, 0);
      const thisMonthNgn = (thisMonthPaid.data || [])
        .filter((p: any) => p.currency === 'NGN')
        .reduce((sum, p: any) => sum + p.amount, 0);
      const lastMonthTotal = (lastMonthPaid.data || [])
        .reduce((sum, p: any) => sum + p.amount, 0);

      return {
        thisMonthGhs,
        thisMonthNgn,
        lastMonthTotal,
        pendingCount: pending.count || 0,
        failedCount: failed.count || 0,
      };
    },
  });

  const filteredPayments = payments?.filter(p =>
    p.tenant?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.paystack_reference?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1" /> Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'subscription':
        return <Badge variant="info">Subscription</Badge>;
      case 'sms_credits':
        return <Badge variant="secondary">SMS Credits</Badge>;
      case 'one_time':
        return <Badge variant="outline">One-time</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const exportPayments = () => {
    if (!filteredPayments) return;
    const csv = [
      ['Date', 'Tenant', 'Type', 'Amount', 'Currency', 'Status', 'Reference'],
      ...filteredPayments.map(p => [
        formatDate(p.created_at, 'full'),
        p.tenant?.business_name,
        p.type,
        p.amount.toString(),
        p.currency,
        p.status,
        p.paystack_reference || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">Payment history and revenue tracking</p>
        </div>
        <Button variant="outline" onClick={exportPayments}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">This Month 🇬🇭</p>
          <p className="text-xl font-bold text-green-600">
            ₵{(stats?.thisMonthGhs || 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">This Month 🇳🇬</p>
          <p className="text-xl font-bold text-green-600">
            ₦{(stats?.thisMonthNgn || 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Last Month</p>
          <p className="text-xl font-bold text-foreground">
            ${(stats?.lastMonthTotal || 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats?.pendingCount || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-xl font-bold text-red-600">{stats?.failedCount || 0}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search payments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
          className="sm:max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'paid', label: 'Paid' },
            { value: 'pending', label: 'Pending' },
            { value: 'failed', label: 'Failed' },
            { value: 'refunded', label: 'Refunded' },
          ]}
        />
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'subscription', label: 'Subscription' },
            { value: 'sms_credits', label: 'SMS Credits' },
            { value: 'one_time', label: 'One-time' },
          ]}
        />
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      ) : filteredPayments && filteredPayments.length > 0 ? (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card 
              key={payment.id} 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedPayment(payment)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    payment.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' :
                    payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <DollarSign className={`w-6 h-6 ${
                      payment.status === 'paid' ? 'text-green-600' :
                      payment.status === 'pending' ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {payment.tenant?.business_name}
                      </h3>
                      {getStatusBadge(payment.status)}
                      {getTypeBadge(payment.type)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {payment.description || payment.type} • {formatDate(payment.created_at, 'full')}
                    </p>
                    {payment.paystack_reference && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {payment.paystack_reference}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">
                    {payment.currency === 'GHS' ? '₵' : '₦'}{payment.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.tenant?.country === 'GH' ? '🇬🇭' : '🇳🇬'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium text-foreground">No payments found</p>
          <p className="text-sm text-muted-foreground">Payments will appear here once tenants subscribe</p>
        </Card>
      )}

      {/* Payment Detail Modal */}
      <Modal
        open={!!selectedPayment}
        onOpenChange={() => setSelectedPayment(null)}
        title="Payment Details"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold">
                {selectedPayment.currency === 'GHS' ? '₵' : '₦'}{selectedPayment.amount.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tenant</p>
                <p className="font-medium">{selectedPayment.tenant?.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">
                  {selectedPayment.tenant?.country === 'GH' ? '🇬🇭 Ghana' : '🇳🇬 Nigeria'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{selectedPayment.type?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(selectedPayment.created_at, 'full')}</p>
              </div>
              {selectedPayment.paid_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="font-medium">{formatDate(selectedPayment.paid_at, 'full')}</p>
                </div>
              )}
            </div>

            {(selectedPayment.payment_method || selectedPayment.card_last4) && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Payment Method</h4>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="capitalize">{selectedPayment.payment_method || 'Card'}</span>
                  {selectedPayment.card_last4 && (
                    <span className="text-muted-foreground">
                      •••• {selectedPayment.card_last4}
                    </span>
                  )}
                  {selectedPayment.card_type && (
                    <Badge variant="outline" className="capitalize">
                      {selectedPayment.card_type}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {selectedPayment.paystack_reference && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Reference</h4>
                <code className="text-sm bg-muted p-2 rounded block">
                  {selectedPayment.paystack_reference}
                </code>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
