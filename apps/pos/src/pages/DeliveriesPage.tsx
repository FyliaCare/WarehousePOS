import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function DeliveriesPage() {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries', store?.id, statusFilter],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          order:orders(
            order_number,
            customer_name,
            customer_phone,
            total,
            delivery_address
          ),
          rider:riders(name, phone)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: riders } = useQuery({
    queryKey: ['riders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['pending-delivery-orders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .eq('delivery_type', 'delivery')
        .eq('status', 'ready')
        .is('rider_id', null);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const assignRider = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId, rider_id: riderId }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Rider assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['pending-delivery-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    const currency = store?.tenant?.country === 'NG' ? '₦' : '₵';
    return `${currency}${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
      </div>

      {/* Pending Orders for Assignment */}
      {pendingOrders && pendingOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-3">
            Orders Ready for Delivery ({pendingOrders.length})
          </h3>
          <div className="space-y-2">
            {pendingOrders.map((order: any) => (
              <div
                key={order.id}
                className="bg-white rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-sm text-gray-600">
                    {order.customer_name} - {formatCurrency(order.total)}
                  </p>
                  <p className="text-xs text-gray-500">{order.delivery_address}</p>
                </div>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      assignRider.mutate({ orderId: order.id, riderId: e.target.value });
                    }
                  }}
                >
                  <option value="">Assign Rider</option>
                  {riders?.map((rider: any) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="picked_up">Picked Up</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Deliveries List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : deliveries?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No deliveries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveries?.map((delivery: any) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {delivery.order?.order_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(delivery.order?.total || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {delivery.order?.customer_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {delivery.order?.customer_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {delivery.delivery_address || delivery.order?.delivery_address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {delivery.rider?.name || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {delivery.rider?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(delivery.status)}`}>
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(delivery.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
