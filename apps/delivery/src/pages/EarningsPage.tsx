import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Card, Select } from '@warehousepos/ui';
import { formatCurrency, formatDate } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { CountryCode } from '@warehousepos/types';

// Type for delivery query result
interface DeliveryEarning {
  id: string;
  delivery_fee: number;
  delivered_at: string;
  order?: { order_number: string };
}

export function EarningsPage() {
  const { rider, store } = useAuthStore();
  const country: CountryCode = (store as any)?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
    }
    
    return start.toISOString();
  };

  const { data: earnings } = useQuery({
    queryKey: ['earnings', rider?.id, period],
    queryFn: async () => {
      if (!rider?.id) return { deliveries: [], total: 0, count: 0 };
      
      const dateStart = getDateRange();
      
      const { data } = await supabase
        .from('delivery_assignments')
        .select('id, delivery_fee, delivered_at, order:orders(order_number)')
        .eq('rider_id', rider.id)
        .eq('status', 'delivered')
        .gte('delivered_at', dateStart)
        .order('delivered_at', { ascending: false });

      const deliveries = (data || []) as unknown as DeliveryEarning[];
      const total = deliveries.reduce((sum, d) => sum + (d.delivery_fee || 0), 0);

      return {
        deliveries,
        total,
        count: deliveries.length,
      };
    },
    enabled: !!rider?.id,
  });

  const periodLabels = {
    today: "Today's",
    week: "This Week's",
    month: "This Month's",
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as any)}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
          ]}
        />
      </div>

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <p className="text-primary-foreground/80">{periodLabels[period]} Earnings</p>
        <p className="text-4xl font-bold mt-1">
          {formatCurrency(earnings?.total || 0, country)}
        </p>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{earnings?.count || 0}</p>
              <p className="text-xs text-primary-foreground/80">Deliveries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  earnings?.count ? earnings.total / earnings.count : 0,
                  country
                ).replace(/[^\d.,]/g, '')}
              </p>
              <p className="text-xs text-primary-foreground/80">Avg/Delivery</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Delivery History */}
      <div>
        <h2 className="font-semibold text-foreground mb-3">Delivery History</h2>
        {earnings?.deliveries && earnings.deliveries.length > 0 ? (
          <div className="space-y-3">
            {earnings.deliveries.map((delivery: DeliveryEarning) => (
              <Card key={delivery.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Order #{delivery.order?.order_number?.slice(-6)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(delivery.delivered_at, 'short')}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">
                    +{formatCurrency(delivery.delivery_fee || 0, country)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground">No earnings yet</p>
            <p className="text-sm text-muted-foreground">
              Complete deliveries to start earning
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
