import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@warehousepos/utils';
import {
  Truck,
  Store,
  MapPin,
  Clock,
  ChevronDown,
  Check,
  AlertCircle,
  Navigation,
  Package,
} from 'lucide-react';
import type { CountryCode } from '@warehousepos/types';

// Theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    textOnPrimary: '#1A1A1A',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B40',
    textOnPrimary: '#FFFFFF',
  },
};

interface DeliveryZone {
  id: string;
  name: string;
  delivery_fee: number;
  min_order_amount: number;
  free_delivery_threshold?: number;
  estimated_time: string;
  is_active: boolean;
}

interface DeliveryOptionsProps {
  orderTotal: number;
  onFulfillmentChange: (type: 'pickup' | 'delivery', data?: DeliveryData) => void;
  initialFulfillment?: 'pickup' | 'delivery';
  initialZoneId?: string;
}

export interface DeliveryData {
  zoneId: string;
  zoneName: string;
  fee: number;
  estimatedTime: string;
  address: string;
  instructions?: string;
}

export function DeliveryOptions({
  orderTotal,
  onFulfillmentChange,
  initialFulfillment = 'pickup',
  initialZoneId,
}: DeliveryOptionsProps) {
  const { store, tenant } = useAuthStore();
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  const theme = themes[country];

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>(initialFulfillment);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZoneId || '');
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Fetch delivery zones
  const { data: zones, isLoading } = useQuery({
    queryKey: ['delivery-zones', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as DeliveryZone[];
    },
    enabled: !!store?.id,
  });

  const selectedZone = zones?.find((z) => z.id === selectedZoneId);

  // Calculate delivery fee
  const getDeliveryFee = (zone: DeliveryZone | undefined): number => {
    if (!zone) return 0;
    
    // Check if order qualifies for free delivery
    if (zone.free_delivery_threshold && orderTotal >= zone.free_delivery_threshold) {
      return 0;
    }
    
    return zone.delivery_fee;
  };

  const deliveryFee = getDeliveryFee(selectedZone);
  const isFreeDelivery = selectedZone && selectedZone.free_delivery_threshold && orderTotal >= selectedZone.free_delivery_threshold;
  const amountToFreeDelivery = selectedZone?.free_delivery_threshold 
    ? selectedZone.free_delivery_threshold - orderTotal 
    : 0;

  // Check minimum order
  const meetsMinimumOrder = !selectedZone || orderTotal >= selectedZone.min_order_amount;

  // Notify parent of changes
  useEffect(() => {
    if (fulfillmentType === 'pickup') {
      onFulfillmentChange('pickup');
    } else if (selectedZone && deliveryAddress && meetsMinimumOrder) {
      onFulfillmentChange('delivery', {
        zoneId: selectedZone.id,
        zoneName: selectedZone.name,
        fee: deliveryFee,
        estimatedTime: selectedZone.estimated_time,
        address: deliveryAddress,
        instructions: deliveryInstructions,
      });
    }
  }, [fulfillmentType, selectedZoneId, deliveryAddress, deliveryInstructions, deliveryFee]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Fulfillment Type Toggle */}
      <div className="flex border-b border-zinc-100">
        <button
          onClick={() => setFulfillmentType('pickup')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
            fulfillmentType === 'pickup' ? 'text-white' : 'text-zinc-600 hover:bg-zinc-50'
          }`}
          style={fulfillmentType === 'pickup' ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
        >
          <Store className="w-5 h-5" />
          Pickup
        </button>
        <button
          onClick={() => setFulfillmentType('delivery')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
            fulfillmentType === 'delivery' ? 'text-white' : 'text-zinc-600 hover:bg-zinc-50'
          }`}
          style={fulfillmentType === 'delivery' ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
        >
          <Truck className="w-5 h-5" />
          Delivery
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {fulfillmentType === 'pickup' ? (
          <div className="flex items-center gap-3 text-zinc-600">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Package className="w-5 h-5" style={{ color: theme.primaryDark }} />
            </div>
            <div>
              <p className="font-medium text-zinc-900">Store Pickup</p>
              <p className="text-sm text-zinc-500">Customer will pick up at store</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Zone Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Delivery Zone
              </label>
              <button
                onClick={() => setShowZoneDropdown(!showZoneDropdown)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-left hover:border-zinc-300 transition-colors"
              >
                {selectedZone ? (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="font-medium text-zinc-900">{selectedZone.name}</p>
                      <p className="text-sm text-zinc-500">
                        {formatCurrency(selectedZone.delivery_fee, country)} • {selectedZone.estimated_time}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-zinc-400 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Select delivery zone
                  </span>
                )}
                <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${showZoneDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Zone Dropdown */}
              {showZoneDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-zinc-400">Loading zones...</div>
                  ) : zones && zones.length > 0 ? (
                    zones.map((zone) => {
                      const isSelected = selectedZoneId === zone.id;
                      const isEligible = orderTotal >= zone.min_order_amount;
                      const isFree = zone.free_delivery_threshold && orderTotal >= zone.free_delivery_threshold;

                      return (
                        <button
                          key={zone.id}
                          onClick={() => {
                            if (isEligible) {
                              setSelectedZoneId(zone.id);
                              setShowZoneDropdown(false);
                            }
                          }}
                          disabled={!isEligible}
                          className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                            isSelected ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                          } ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isSelected ? '' : 'bg-zinc-100'
                              }`}
                              style={isSelected ? { backgroundColor: theme.primaryLight } : {}}
                            >
                              <Navigation 
                                className="w-4 h-4" 
                                style={{ color: isSelected ? theme.primaryDark : '#71717A' }}
                              />
                            </div>
                            <div>
                              <p className={`font-medium ${isSelected ? '' : 'text-zinc-900'}`}
                                style={isSelected ? { color: theme.primaryDark } : {}}
                              >
                                {zone.name}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-zinc-500">
                                <Clock className="w-3.5 h-3.5" />
                                {zone.estimated_time}
                                {!isEligible && (
                                  <span className="text-amber-600">
                                    • Min: {formatCurrency(zone.min_order_amount, country)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {isFree ? (
                              <span className="text-emerald-600 font-medium text-sm">FREE</span>
                            ) : (
                              <span className="font-semibold" style={{ color: theme.primary }}>
                                {formatCurrency(zone.delivery_fee, country)}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 ml-2 inline" style={{ color: theme.primaryDark }} />
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-zinc-400">
                      No delivery zones available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Minimum Order Warning */}
            {selectedZone && !meetsMinimumOrder && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Minimum order not met</p>
                  <p>Add {formatCurrency(selectedZone.min_order_amount - orderTotal, country)} more to deliver to {selectedZone.name}</p>
                </div>
              </div>
            )}

            {/* Free Delivery Progress */}
            {selectedZone?.free_delivery_threshold && !isFreeDelivery && meetsMinimumOrder && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: theme.primaryDark }}>
                    Free delivery progress
                  </span>
                  <span className="text-sm" style={{ color: theme.primaryDark }}>
                    {formatCurrency(amountToFreeDelivery, country)} away
                  </span>
                </div>
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((orderTotal / selectedZone.free_delivery_threshold) * 100, 100)}%`,
                      backgroundColor: theme.primary,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Free Delivery Badge */}
            {isFreeDelivery && (
              <div 
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">
                  Free delivery unlocked! 🎉
                </span>
              </div>
            )}

            {/* Delivery Address */}
            {selectedZone && meetsMinimumOrder && (
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery address..."
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 transition-all resize-none"
                    style={{ '--tw-ring-color': theme.primary } as any}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Delivery Instructions (optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="Gate code, landmarks, etc."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': theme.primary } as any}
                  />
                </div>

                {/* Summary */}
                <div className="pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Delivery Fee</span>
                    {isFreeDelivery ? (
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-400 line-through">
                          {formatCurrency(selectedZone.delivery_fee, country)}
                        </span>
                        <span className="font-semibold text-emerald-600">FREE</span>
                      </span>
                    ) : (
                      <span className="font-semibold" style={{ color: theme.primary }}>
                        {formatCurrency(deliveryFee, country)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-zinc-600">Estimated Time</span>
                    <span className="text-zinc-900">{selectedZone.estimated_time}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryOptions;
