import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, MapPin, ChevronRight, Search } from 'lucide-react';
import { Card, Badge, Input, EmptyState, Skeleton } from '@warehousepos/ui';
import { formatCurrency, cn } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { DeliveryStatus, CountryCode } from '@warehousepos/types';

export function DeliveriesPage() {
  const { rider, store } = useAuthStore();
  const country: CountryCode = (store as any)?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries', rider?.id, statusFilter],
    queryFn: async () => {
      if (!rider?.id) return [];
      
      let query = supabase
        .from('delivery_assignments')
        .select('*, order:orders(*, customer:customers(name, phone, address))')
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query.limit(50);
      return data || [];
    },
    enabled: !!rider?.id,
  });

  const filteredDeliveries = deliveries?.filter((d: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      d.order?.order_number?.toLowerCase().includes(search) ||
      d.order?.customer?.name?.toLowerCase().includes(search) ||
      d.order?.customer?.phone?.includes(search)
    );
  });

  const statusTabs: { value: DeliveryStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'assigned', label: 'New' },
    { value: 'picked_up', label: 'Picked' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'warning';
      case 'picked_up': return 'info';
      case 'in_transit': return 'default';
      case 'delivered': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground">Deliveries</h1>

      {/* Search */}
      <Input
        placeholder="Search by order # or customer..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              statusFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-40 mb-1" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>
      ) : filteredDeliveries && filteredDeliveries.length > 0 ? (
        <div className="space-y-3">
          {filteredDeliveries.map((delivery: any) => (
            <Link key={delivery.id} to={`/deliveries/${delivery.id}`}>
              <Card className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        Order #{delivery.order?.order_number?.slice(-6)}
                      </p>
                      <Badge variant={getStatusColor(delivery.status)}>
                        {delivery.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">
                        {delivery.order?.customer?.address || 'No address'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-muted-foreground">
                        {delivery.order?.customer?.name}
                      </p>
                      <p className="font-medium text-foreground">
                        {formatCurrency(delivery.order?.total || 0, country)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No deliveries found"
          description={statusFilter === 'all' ? "You don't have any deliveries yet" : `No ${statusFilter} deliveries`}
          icon={<Package className="w-12 h-12" />}
        />
      )}
    </div>
  );
}
