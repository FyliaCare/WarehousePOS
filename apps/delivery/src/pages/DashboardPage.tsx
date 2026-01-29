import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Clock, CheckCircle, MapPin, ChevronRight, Power, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Badge, Avatar, Button, Modal } from '@warehousepos/ui';
import { formatCurrency, timeAgo } from '@warehousepos/utils';
import type { CountryCode } from '@warehousepos/types';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { 
  subscribeToAssignments, 
  unsubscribeFromAssignments,
  requestNotificationPermission,
} from '@/lib/notifications';
import {
  startLocationTracking,
  stopLocationTracking,
  requestLocationPermission,
} from '@/lib/location';

interface DeliveryAssignment {
  id: string;
  status: string;
  delivery_fee: number;
  created_at: string;
  order?: {
    order_number: string;
    total: number;
    customer?: {
      name: string;
      phone: string;
      address: string;
    };
  };
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { rider, store, isOnline, toggleOnlineStatus } = useAuthStore();
  const country: CountryCode = store?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const [newAssignment, setNewAssignment] = useState<DeliveryAssignment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Fetch today's stats
  const { data: stats } = useQuery({
    queryKey: ['rider-stats', rider?.id],
    queryFn: async () => {
      if (!rider?.id) return { completedCount: 0, pendingCount: 0, earnings: 0 };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: deliveries } = await supabase
        .from('delivery_assignments')
        .select('*, order:orders(total)')
        .eq('rider_id', rider.id)
        .gte('created_at', today.toISOString());

      const completed = (deliveries || []).filter((d: any) => d.status === 'delivered');
      const pending = (deliveries || []).filter((d: any) => ['assigned', 'picked_up', 'in_transit'].includes(d.status));
      const earnings = completed.reduce((sum: number, d: any) => sum + (d.delivery_fee || 0), 0);

      return {
        completedCount: completed.length,
        pendingCount: pending.length,
        earnings,
      };
    },
    enabled: !!rider?.id,
  });

  // Fetch active deliveries
  const { data: activeDeliveries } = useQuery<DeliveryAssignment[]>({
    queryKey: ['active-deliveries', rider?.id],
    queryFn: async () => {
      if (!rider?.id) return [];
      
      const { data } = await supabase
        .from('delivery_assignments')
        .select('*, order:orders(*, customer:customers(name, phone, address))')
        .eq('rider_id', rider.id)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: true })
        .limit(5);

      return (data || []) as DeliveryAssignment[];
    },
    enabled: !!rider?.id,
    refetchInterval: 30000,
  });

  // Subscribe to real-time assignments and location tracking when online
  useEffect(() => {
    if (!rider?.id) return;

    const setupNotifications = async () => {
      await requestNotificationPermission();
    };
    
    setupNotifications();

    if (isOnline) {
      subscribeToAssignments(rider.id, (assignment) => {
        setNewAssignment(assignment);
        setShowAssignmentModal(true);
        queryClient.invalidateQueries({ queryKey: ['active-deliveries'] });
        queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
      });

      requestLocationPermission().then((granted) => {
        if (granted && rider.id) {
          const activeDeliveryId = activeDeliveries?.find(d => d.status === 'in_transit')?.id || null;
          startLocationTracking(rider.id, activeDeliveryId);
        }
      });
    } else {
      unsubscribeFromAssignments();
      stopLocationTracking();
    }

    return () => {
      unsubscribeFromAssignments();
      stopLocationTracking();
    };
  }, [rider?.id, isOnline, queryClient, activeDeliveries]);

  const handleAcceptAssignment = () => {
    setShowAssignmentModal(false);
    if (newAssignment) {
      navigate(`/deliveries/${newAssignment.id}`);
    }
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'default' | 'success' | 'secondary' => {
    switch (status) {
      case 'assigned': return 'warning';
      case 'picked_up': return 'info';
      case 'in_transit': return 'default';
      case 'delivered': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            name={rider?.name || 'Rider'}
            size="lg"
            status={isOnline ? 'online' : 'offline'}
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Hello, {rider?.name?.split(' ')[0]}!
            </h1>
            <p className="text-sm text-muted-foreground">{store?.name}</p>
          </div>
        </div>
        
        <Button
          variant={isOnline ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleOnlineStatus()}
          className="gap-2"
        >
          <Power className="w-4 h-4" />
          {isOnline ? 'Online' : 'Offline'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mx-auto mb-2 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats?.pendingCount || 0}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-2 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats?.completedCount || 0}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-10 h-10 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {country === 'NG' ? '₦' : '₵'}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(stats?.earnings || 0, country).replace(/[^\d.,]/g, '')}
          </p>
          <p className="text-xs text-muted-foreground">Today's Earnings</p>
        </Card>
      </div>

      {/* Active Deliveries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Active Deliveries</h2>
          <Link to="/deliveries" className="text-sm text-primary">
            View All
          </Link>
        </div>

        {!isOnline ? (
          <Card className="p-6 text-center">
            <Power className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground">You're offline</p>
            <p className="text-sm text-muted-foreground mb-4">
              Go online to receive delivery requests
            </p>
            <Button onClick={() => toggleOnlineStatus()}>Go Online</Button>
          </Card>
        ) : activeDeliveries && activeDeliveries.length > 0 ? (
          <div className="space-y-3">
            {activeDeliveries.map((delivery) => (
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {delivery.order?.customer?.name} • {timeAgo(delivery.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-foreground">No active deliveries</p>
            <p className="text-sm text-muted-foreground">
              New orders will appear here
            </p>
          </Card>
        )}
      </div>

      {/* New Assignment Modal */}
      <Modal
        open={showAssignmentModal}
        onOpenChange={setShowAssignmentModal}
        title="🚚 New Delivery!"
      >
        {newAssignment && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
              <Bell className="w-8 h-8 text-primary animate-bounce" />
              <div>
                <p className="font-bold text-lg text-foreground">
                  Order #{newAssignment.order?.order_number?.slice(-6)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {newAssignment.order?.customer?.name || 'Customer'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <p className="text-sm text-foreground">
                  {newAssignment.order?.customer?.address || 'No address'}
                </p>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(newAssignment.order?.total || 0, country)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium text-primary">
                  {formatCurrency(newAssignment.delivery_fee || 0, country)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAssignmentModal(false)}
              >
                Later
              </Button>
              <Button
                className="flex-1"
                onClick={handleAcceptAssignment}
              >
                View Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
