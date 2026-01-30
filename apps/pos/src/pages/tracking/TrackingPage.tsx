import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatPhone } from '@warehousepos/utils';
import {
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Truck,
  User,
  Store,
  MessageCircle,
  Share2,
  Star,
  Navigation,
  Loader2,
  ChefHat,
  PackageCheck,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import type { CountryCode } from '@warehousepos/types';

// Theme configuration based on store country
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1A1A',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B40',
    accent: '#1A1A1A',
    textOnPrimary: '#FFFFFF',
  },
};

interface OrderEvent {
  id: string;
  event_type: string;
  title: string;
  description?: string;
  created_at: string;
}

interface TrackingData {
  id: string;
  order_number: string;
  tracking_code: string;
  status: string;
  delivery_status: string;
  total: number;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  estimated_delivery_time?: string;
  store: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    logo_url?: string;
    tenant: {
      country: CountryCode;
    };
  };
  rider?: {
    id: string;
    name: string;
    phone: string;
    photo_url?: string;
    vehicle_type: string;
    rating: number;
    current_latitude?: number;
    current_longitude?: number;
  };
  assignment?: {
    id: string;
    status: string;
    assigned_at?: string;
    picked_up_at?: string;
    in_transit_at?: string;
    delivered_at?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    total: number;
    product: { name: string };
  }>;
  events: OrderEvent[];
}

const statusSteps = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: PackageCheck },
  { key: 'picked_up', label: 'Picked Up', icon: Package },
  { key: 'in_transit', label: 'On the Way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const getStatusIndex = (status: string, deliveryStatus: string): number => {
  if (deliveryStatus === 'delivered' || status === 'delivered') return 5;
  if (deliveryStatus === 'in_transit') return 4;
  if (deliveryStatus === 'picked_up') return 3;
  if (deliveryStatus === 'ready' || status === 'ready') return 2;
  if (status === 'preparing' || status === 'processing') return 1;
  return 0;
};

export default function TrackingPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const { data: order, isLoading, error } = useQuery<TrackingData | null>({
    queryKey: ['tracking', trackingCode],
    queryFn: async () => {
      if (!trackingCode) return null;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          tracking_code,
          status,
          delivery_status,
          total,
          customer_name,
          customer_phone,
          delivery_address,
          notes,
          created_at,
          estimated_delivery_time,
          store:stores(
            id,
            name,
            phone,
            address,
            logo_url,
            tenant:tenants(country)
          ),
          rider:riders(
            id,
            name,
            phone,
            photo_url,
            vehicle_type,
            rating,
            current_latitude,
            current_longitude
          ),
          items:order_items(
            id,
            quantity,
            total,
            product:products(name)
          )
        `)
        .or(`tracking_code.eq.${trackingCode},order_number.eq.${trackingCode}`)
        .single();
      
      if (error) throw error;
      
      // Fetch order events
      const { data: events } = await supabase
        .from('order_events')
        .select('*')
        .eq('order_id', data.id)
        .order('created_at', { ascending: false });
      
      // Fetch delivery assignment
      const { data: assignment } = await supabase
        .from('delivery_assignments')
        .select('*')
        .eq('order_id', data.id)
        .single();
      
      const storeData = Array.isArray(data.store) ? data.store[0] : data.store;
      const riderData = Array.isArray(data.rider) ? data.rider[0] : data.rider;
      
      // Transform items to fix product array-to-object conversion
      const transformedItems = (data.items || []).map((item: any) => ({
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product || { name: '' }
      }));
      
      return {
        ...data,
        store: storeData ? {
          ...storeData,
          tenant: Array.isArray(storeData.tenant) ? storeData.tenant[0] : storeData.tenant || { country: 'GH' as const }
        } : { id: '', name: '', tenant: { country: 'GH' as const } },
        rider: riderData || undefined,
        items: transformedItems,
        events: events || [],
        assignment: assignment || undefined,
      } as TrackingData;
    },
    enabled: !!trackingCode,
    refetchInterval: refreshInterval,
  });

  // Auto-refresh handling
  useEffect(() => {
    if (order?.delivery_status === 'delivered' || order?.status === 'delivered') {
      setRefreshInterval(0); // Stop refreshing when delivered
    }
  }, [order?.delivery_status, order?.status]);

  const country = order?.store?.tenant?.country || 'GH';
  const theme = themes[country];
  const currentStep = order ? getStatusIndex(order.status, order.delivery_status || 'pending') : 0;

  const callRider = () => {
    if (order?.rider?.phone) {
      window.open(`tel:${order.rider.phone}`, '_self');
    }
  };

  const whatsappRider = () => {
    if (order?.rider?.phone) {
      const cleanPhone = order.rider.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const shareTracking = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Track Order #${order?.order_number}`,
        text: `Track your delivery from ${order?.store?.name}`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Tracking link copied to clipboard!');
    }
  };

  const openNavigation = () => {
    if (order?.rider?.current_latitude && order?.rider?.current_longitude) {
      window.open(
        `https://maps.google.com/?q=${order.rider.current_latitude},${order.rider.current_longitude}`,
        '_blank'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Order Not Found</h1>
          <p className="text-zinc-600 mb-6">
            We couldn't find an order with tracking code "{trackingCode}". 
            Please check the code and try again.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isFailed = order.delivery_status === 'failed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-zinc-50 pb-8">
      {/* Header with Store Branding */}
      <div 
        className="px-5 py-6"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {order.store?.logo_url ? (
              <img 
                src={order.store.logo_url} 
                alt={order.store.name} 
                className="w-12 h-12 rounded-xl object-cover bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Store className="w-6 h-6" style={{ color: theme.textOnPrimary }} />
              </div>
            )}
            <div>
              <p 
                className="font-bold text-lg"
                style={{ color: theme.textOnPrimary }}
              >
                {order.store?.name}
              </p>
              <p 
                className="text-sm opacity-80"
                style={{ color: theme.textOnPrimary }}
              >
                Order #{order.order_number}
              </p>
            </div>
          </div>
          <button
            onClick={shareTracking}
            className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Share2 className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
          </button>
        </div>

        {/* Status Badge */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          {isCancelled ? (
            <XCircle className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
          ) : isFailed ? (
            <AlertCircle className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
          ) : currentStep === 5 ? (
            <CheckCircle className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
          ) : (
            <Truck className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
          )}
          <span 
            className="font-semibold"
            style={{ color: theme.textOnPrimary }}
          >
            {isCancelled 
              ? 'Order Cancelled' 
              : isFailed 
                ? 'Delivery Failed' 
                : statusSteps[currentStep]?.label || 'Processing'
            }
          </span>
        </div>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && !isFailed && (
        <div className="px-5 py-6 bg-white border-b border-zinc-100">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 right-0 h-1 bg-zinc-200 rounded-full">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  backgroundColor: theme.primary,
                  width: `${(currentStep / (statusSteps.length - 1)) * 100}%` 
                }}
              />
            </div>

            {statusSteps.map((step, index) => {
              const isComplete = index <= currentStep;
              const isCurrent = index === currentStep;
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isComplete ? '' : 'bg-zinc-200'
                    }`}
                    style={isComplete ? { backgroundColor: theme.primary } : {}}
                  >
                    <Icon 
                      className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`}
                      style={{ color: isComplete ? theme.textOnPrimary : '#A1A1AA' }}
                    />
                  </div>
                  <p className={`text-xs mt-2 font-medium ${
                    isComplete ? 'text-zinc-900' : 'text-zinc-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-5 py-4 space-y-4">
        {/* Rider Info (if assigned) */}
        {order.rider && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Your Rider
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {order.rider.photo_url ? (
                  <img 
                    src={order.rider.photo_url}
                    alt={order.rider.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                ) : (
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.primaryLight }}
                  >
                    <User className="w-7 h-7" style={{ color: theme.primaryDark }} />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-zinc-900">{order.rider.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm text-zinc-600">
                      {order.rider.rating?.toFixed(1) || '5.0'}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-sm text-zinc-500 capitalize">
                      {order.rider.vehicle_type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={callRider}
                  className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
                >
                  <Phone className="w-5 h-5 text-zinc-600" />
                </button>
                <button
                  onClick={whatsappRider}
                  className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </button>
                {order.rider.current_latitude && (
                  <button
                    onClick={openNavigation}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: theme.primaryLight }}
                  >
                    <Navigation className="w-5 h-5" style={{ color: theme.primaryDark }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Address */}
        {order.delivery_address && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Delivery Address
            </h3>
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.primaryLight }}
              >
                <MapPin className="w-5 h-5" style={{ color: theme.primaryDark }} />
              </div>
              <div>
                <p className="font-medium text-zinc-900">{order.customer_name}</p>
                <p className="text-sm text-zinc-600 mt-0.5">{order.delivery_address}</p>
                {order.customer_phone && (
                  <p className="text-sm text-zinc-500 mt-1">
                    {formatPhone(order.customer_phone, country)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Order Summary
          </h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-700">
                  {item.product?.name} <span className="text-zinc-400">×{item.quantity}</span>
                </span>
                <span className="font-medium text-zinc-900">
                  {formatCurrency(item.total, country)}
                </span>
              </div>
            ))}
          </div>
          <div 
            className="border-t mt-3 pt-3 flex justify-between"
            style={{ borderColor: theme.primaryMid }}
          >
            <span className="font-semibold text-zinc-900">Total</span>
            <span className="font-bold" style={{ color: theme.primary }}>
              {formatCurrency(order.total, country)}
            </span>
          </div>
        </div>

        {/* Order Activity Timeline */}
        {order.events && order.events.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Order Activity
            </h3>
            <div className="space-y-4">
              {order.events.map((event, index) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-3 h-3 rounded-full ${index === 0 ? '' : 'bg-zinc-200'}`}
                      style={index === 0 ? { backgroundColor: theme.primary } : {}}
                    />
                    {index < order.events.length - 1 && (
                      <div className="w-0.5 h-full bg-zinc-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-zinc-900 text-sm">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{event.description}</p>
                    )}
                    <p className="text-xs text-zinc-400 mt-1">
                      {formatDate(event.created_at, 'short')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Delivery */}
        {order.estimated_delivery_time && currentStep < 5 && (
          <div 
            className="rounded-2xl p-4"
            style={{ backgroundColor: theme.primaryLight }}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" style={{ color: theme.primaryDark }} />
              <div>
                <p className="text-sm font-medium" style={{ color: theme.primaryDark }}>
                  Estimated Delivery
                </p>
                <p className="text-lg font-bold text-zinc-900">
                  {formatDate(order.estimated_delivery_time, 'short')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Store */}
        {order.store?.phone && (
          <div className="text-center py-4">
            <p className="text-sm text-zinc-500 mb-2">Need help with your order?</p>
            <a
              href={`tel:${order.store.phone}`}
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: theme.primary }}
            >
              <Phone className="w-4 h-4" />
              Contact {order.store.name}
            </a>
          </div>
        )}
      </div>

      {/* Powered By Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-zinc-400">
          Powered by <span className="font-semibold">WarehousePOS</span>
        </p>
      </div>
    </div>
  );
}
