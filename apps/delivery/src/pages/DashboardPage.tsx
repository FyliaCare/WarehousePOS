import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  MapPin, 
  ChevronRight, 
  Power, 
  Bell,
  TrendingUp,
  Wallet,
  Star,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

// Premium theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1400',
    flag: '🇬🇭',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B41',
    accent: '#FFFFFF',
    textOnPrimary: '#FFFFFF',
    flag: '🇳🇬',
  },
};

interface DeliveryAssignment {
  id: string;
  status: string;
  delivery_fee: number;
  rider_earnings: number;
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
  const country: CountryCode = (store as any)?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];
  const [newAssignment, setNewAssignment] = useState<DeliveryAssignment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Fetch today's stats
  const { data: stats } = useQuery({
    queryKey: ['rider-stats', rider?.id],
    queryFn: async () => {
      if (!rider?.id) return { completedCount: 0, pendingCount: 0, earnings: 0, avgRating: 5.0 };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: deliveries } = await supabase
        .from('delivery_assignments')
        .select('*, order:orders(total)')
        .eq('rider_id', rider.id)
        .gte('created_at', today.toISOString());

      const completed = (deliveries || []).filter((d: any) => d.status === 'delivered');
      const pending = (deliveries || []).filter((d: any) => ['assigned', 'picked_up', 'in_transit'].includes(d.status));
      const earnings = completed.reduce((sum: number, d: any) => sum + (d.rider_earnings || d.delivery_fee || 0), 0);

      return {
        completedCount: completed.length,
        pendingCount: pending.length,
        earnings,
        avgRating: (rider as any)?.rating || 5.0,
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
        setNewAssignment(assignment as DeliveryAssignment);
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned': 
        return { label: 'New', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: Bell };
      case 'picked_up': 
        return { label: 'Picked Up', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: Package };
      case 'in_transit': 
        return { label: 'In Transit', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: Navigation };
      case 'delivered': 
        return { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle };
      default: 
        return { label: status, color: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500', icon: Package };
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.primaryLight }}>
      {/* Premium Header */}
      <div 
        className="px-5 pt-6 pb-8 relative overflow-hidden"
        style={{ backgroundColor: theme.primary }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full border-4" style={{ borderColor: theme.accent }} />
          <div className="absolute bottom-4 -left-4 w-24 h-24 rounded-full border-4" style={{ borderColor: theme.accent }} />
        </div>

        <div className="relative z-10">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg"
                style={{ backgroundColor: theme.accent, color: theme.primary }}
              >
                {(rider as any)?.full_name?.charAt(0) || 'R'}
              </div>
              <div>
                <p className="text-sm opacity-80" style={{ color: theme.textOnPrimary }}>
                  {greeting()},
                </p>
                <h1 className="text-lg font-bold" style={{ color: theme.textOnPrimary }}>
                  {(rider as any)?.full_name?.split(' ')[0] || 'Rider'}
                </h1>
              </div>
            </div>

            {/* Online Toggle */}
            <button
              onClick={() => toggleOnlineStatus()}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm shadow-lg transition-all ${
                isOnline 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white/90 text-zinc-600'
              }`}
            >
              <Power className="w-4 h-4" />
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div 
              className="p-3 rounded-2xl text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4" style={{ color: theme.textOnPrimary }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: theme.textOnPrimary }}>
                {stats?.completedCount || 0}
              </p>
              <p className="text-xs opacity-80" style={{ color: theme.textOnPrimary }}>
                Completed
              </p>
            </div>
            <div 
              className="p-3 rounded-2xl text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wallet className="w-4 h-4" style={{ color: theme.textOnPrimary }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: theme.textOnPrimary }}>
                {formatCurrency(stats?.earnings || 0, country).replace(/[^\d.,]/g, '')}
              </p>
              <p className="text-xs opacity-80" style={{ color: theme.textOnPrimary }}>
                Earnings
              </p>
            </div>
            <div 
              className="p-3 rounded-2xl text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4" style={{ color: theme.textOnPrimary }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: theme.textOnPrimary }}>
                {stats?.avgRating?.toFixed(1) || '5.0'}
              </p>
              <p className="text-xs opacity-80" style={{ color: theme.textOnPrimary }}>
                Rating
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-4 space-y-5">
        {/* Pending Deliveries Alert */}
        {(stats?.pendingCount || 0) > 0 && (
          <div 
            className="p-4 rounded-2xl flex items-center gap-3 shadow-sm"
            style={{ backgroundColor: theme.primaryMid }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.primary }}
            >
              <Clock className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-zinc-900">
                {stats?.pendingCount} Active Delivery{stats?.pendingCount !== 1 ? 'ies' : ''}
              </p>
              <p className="text-sm text-zinc-600">Tap to view and manage</p>
            </div>
            <Link to="/deliveries">
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </Link>
          </div>
        )}

        {/* Active Deliveries */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Active Deliveries</h2>
            <Link 
              to="/deliveries" 
              className="text-sm font-medium"
              style={{ color: theme.primary }}
            >
              View All
            </Link>
          </div>

          {activeDeliveries && activeDeliveries.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {activeDeliveries.map((delivery) => {
                const statusConfig = getStatusConfig(delivery.status);
                return (
                  <Link
                    key={delivery.id}
                    to={`/deliveries/${delivery.id}`}
                    className="p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: theme.primaryLight }}
                    >
                      <Package className="w-6 h-6" style={{ color: theme.primaryDark }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-zinc-900">
                          #{delivery.order?.order_number?.slice(-6)}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate">
                        {delivery.order?.customer?.address || 'No address'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {delivery.order?.customer?.name} • {timeAgo(delivery.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: theme.primaryDark }}>
                        {formatCurrency(delivery.rider_earnings || delivery.delivery_fee || 0, country)}
                      </p>
                      <ChevronRight className="w-5 h-5 text-zinc-300 mt-1 ml-auto" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: theme.primaryLight }}
              >
                <Package className="w-8 h-8" style={{ color: theme.primaryDark }} />
              </div>
              <p className="font-medium text-zinc-900 mb-1">No Active Deliveries</p>
              <p className="text-sm text-zinc-500">
                {isOnline 
                  ? 'New deliveries will appear here'
                  : 'Go online to receive deliveries'
                }
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/earnings"
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-all"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: theme.primaryDark }} />
            </div>
            <div>
              <p className="font-medium text-zinc-900">Earnings</p>
              <p className="text-xs text-zinc-500">View summary</p>
            </div>
          </Link>
          <Link
            to="/profile"
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-all"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Star className="w-5 h-5" style={{ color: theme.primaryDark }} />
            </div>
            <div>
              <p className="font-medium text-zinc-900">Profile</p>
              <p className="text-xs text-zinc-500">Settings & Info</p>
            </div>
          </Link>
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <div className="bg-zinc-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-zinc-500" />
            <div className="flex-1">
              <p className="text-sm text-zinc-600">
                You're currently offline. Go online to receive new delivery requests.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Assignment Modal */}
      {showAssignmentModal && newAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl w-full max-w-md animate-slide-up">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryLight }}
                >
                  <Bell className="w-7 h-7" style={{ color: theme.primary }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">New Delivery!</h3>
                  <p className="text-sm text-zinc-500">
                    Order #{newAssignment.order?.order_number?.slice(-6)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50">
                  <MapPin className="w-5 h-5 text-zinc-400 mt-0.5" />
                  <p className="text-sm text-zinc-700">
                    {newAssignment.order?.customer?.address || 'Address not available'}
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50">
                  <span className="text-sm text-zinc-500">Delivery Fee</span>
                  <span className="font-semibold" style={{ color: theme.primary }}>
                    {formatCurrency(newAssignment.delivery_fee || 0, country)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="py-3 px-4 rounded-xl font-medium bg-zinc-100 text-zinc-700"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleAcceptAssignment}
                  className="py-3 px-4 rounded-xl font-medium text-white"
                  style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
