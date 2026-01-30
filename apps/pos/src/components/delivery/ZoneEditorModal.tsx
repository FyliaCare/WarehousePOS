import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { formatCurrency } from '@warehousepos/utils';
import {
  X,
  MapPin,
  Clock,
  Save,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Map,
  Edit3,
  Gift,
} from 'lucide-react';
import { DeliveryZoneMap, type ZoneBoundary } from '@/components/maps';
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

export interface DeliveryZone {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  delivery_fee: number;
  min_order_amount: number;
  free_delivery_threshold?: number;
  estimated_time_minutes: number;
  boundary?: ZoneBoundary;
  radius_km?: number;
  is_active: boolean;
  color?: string;
  created_at: string;
  updated_at: string;
}

interface ZoneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone?: DeliveryZone | null;
  allZones: DeliveryZone[];
  storeLocation?: { lat: number; lng: number } | null;
}

type EditorStep = 'details' | 'boundary' | 'review';

const ZONE_COLORS = [
  '#FFD000', '#FF9500', '#34C759', '#007AFF', '#AF52DE', '#FF3B30',
  '#5856D6', '#FF2D55', '#00C7BE', '#FF6482', '#64D2FF', '#BF5AF2',
];

export function ZoneEditorModal({
  isOpen,
  onClose,
  zone,
  allZones,
  storeLocation,
}: ZoneEditorModalProps) {
  const { store, tenant } = useAuthStore();
  const queryClient = useQueryClient();
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  const theme = themes[country];
  const currencySymbol = country === 'NG' ? '₦' : 'GH₵';

  const isEditing = !!zone;
  const [currentStep, setCurrentStep] = useState<EditorStep>('details');
  const [_isDrawingMode, setIsDrawingMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    delivery_fee: '',
    min_order_amount: '',
    free_delivery_threshold: '',
    estimated_time_minutes: '45',
    color: ZONE_COLORS[0],
  });

  const [boundary, setBoundary] = useState<ZoneBoundary | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with zone data
  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name,
        description: zone.description || '',
        delivery_fee: zone.delivery_fee.toString(),
        min_order_amount: zone.min_order_amount?.toString() || '0',
        free_delivery_threshold: zone.free_delivery_threshold?.toString() || '',
        estimated_time_minutes: zone.estimated_time_minutes?.toString() || '45',
        color: zone.color || ZONE_COLORS[0],
      });
      setBoundary(zone.boundary || null);
    } else {
      // Pick a unique color for new zone
      const usedColors = allZones.map(z => z.color).filter(Boolean);
      const availableColor = ZONE_COLORS.find(c => !usedColors.includes(c)) || ZONE_COLORS[0];
      setFormData(prev => ({ ...prev, color: availableColor }));
    }
  }, [zone, allZones]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('details');
      setIsDrawingMode(false);
      setErrors({});
    }
  }, [isOpen]);

  // Validation
  const validateDetails = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Zone name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.delivery_fee || parseFloat(formData.delivery_fee) < 0) {
      newErrors.delivery_fee = 'Valid delivery fee is required';
    }

    if (formData.min_order_amount && parseFloat(formData.min_order_amount) < 0) {
      newErrors.min_order_amount = 'Minimum order cannot be negative';
    }

    if (formData.free_delivery_threshold) {
      const threshold = parseFloat(formData.free_delivery_threshold);
      const minOrder = parseFloat(formData.min_order_amount) || 0;
      if (threshold <= minOrder) {
        newErrors.free_delivery_threshold = 'Must be greater than minimum order';
      }
    }

    if (!formData.estimated_time_minutes || parseInt(formData.estimated_time_minutes) < 1) {
      newErrors.estimated_time_minutes = 'Valid estimated time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Create/Update mutation
  const saveZone = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error('Store not found');
      if (!tenant?.id) throw new Error('Tenant not found');

      const zoneData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        free_delivery_threshold: formData.free_delivery_threshold 
          ? parseFloat(formData.free_delivery_threshold) 
          : null,
        estimated_time_minutes: parseInt(formData.estimated_time_minutes) || 45,
        boundary: boundary || null,
        color: formData.color,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && zone) {
        const { data, error } = await supabase
          .from('delivery_zones')
          .update(zoneData as never)
          .eq('id', zone.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('delivery_zones')
          .insert({
            ...zoneData,
            tenant_id: tenant.id,
            store_id: store.id,
            is_active: true,
          } as never)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Zone updated successfully' : 'Zone created successfully');
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save zone');
    },
  });

  // Handle step navigation
  const handleNext = () => {
    if (currentStep === 'details') {
      if (validateDetails()) {
        setCurrentStep('boundary');
      }
    } else if (currentStep === 'boundary') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'boundary') {
      setCurrentStep('details');
    } else if (currentStep === 'review') {
      setCurrentStep('boundary');
    }
  };

  // Handle boundary change from map
  const handleBoundaryChange = useCallback((newBoundary: ZoneBoundary) => {
    setBoundary(newBoundary);
    setIsDrawingMode(false);
  }, []);

  // Handle form input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  // Prepare zones for map (exclude current zone when editing)
  const otherZones = allZones
    .filter(z => z.id !== zone?.id)
    .map(z => ({
      id: z.id,
      name: z.name,
      description: z.description,
      delivery_fee: z.delivery_fee,
      is_active: z.is_active,
      boundary: z.boundary,
      color: z.color,
    }));

  // Include current zone boundary in preview
  const previewZones = boundary ? [
    ...otherZones,
    {
      id: zone?.id || 'new-zone',
      name: formData.name || 'New Zone',
      description: formData.description,
      delivery_fee: parseFloat(formData.delivery_fee) || 0,
      is_active: true,
      boundary,
      color: formData.color,
    },
  ] : otherZones;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: theme.primaryLight }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: theme.primaryDark }}>
              {isEditing ? 'Edit Delivery Zone' : 'Create Delivery Zone'}
            </h2>
            <p className="text-sm opacity-80" style={{ color: theme.primaryDark }}>
              Step {currentStep === 'details' ? 1 : currentStep === 'boundary' ? 2 : 3} of 3
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="w-5 h-5" style={{ color: theme.primaryDark }} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {[
              { key: 'details', label: 'Zone Details', icon: MapPin },
              { key: 'boundary', label: 'Draw Boundary', icon: Map },
              { key: 'review', label: 'Review & Save', icon: Save },
            ].map((step, index) => {
              const isActive = currentStep === step.key;
              const isPast = 
                (currentStep === 'boundary' && step.key === 'details') ||
                (currentStep === 'review' && (step.key === 'details' || step.key === 'boundary'));

              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isActive 
                      ? '' 
                      : isPast 
                        ? 'bg-emerald-50' 
                        : 'bg-zinc-100'
                  }`}
                  style={isActive ? { backgroundColor: theme.primaryLight } : {}}
                  >
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive 
                          ? '' 
                          : isPast 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-zinc-300 text-zinc-500'
                      }`}
                      style={isActive ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
                    >
                      {isPast ? '✓' : index + 1}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${
                      isActive ? '' : isPast ? 'text-emerald-700' : 'text-zinc-500'
                    }`}
                    style={isActive ? { color: theme.primaryDark } : {}}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <ChevronRight className="w-4 h-4 text-zinc-300 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Details */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zone Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., East Legon, Lekki, Tema"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50'
                    }`}
                    style={{ '--tw-ring-color': theme.primary } as any}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of this delivery zone..."
                    rows={2}
                    className="w-full px-4 py-3 border border-zinc-200 bg-zinc-50 rounded-xl focus:outline-none focus:ring-2 resize-none"
                    style={{ '--tw-ring-color': theme.primary } as any}
                  />
                </div>

                {/* Delivery Fee */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Delivery Fee *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={formData.delivery_fee}
                      onChange={(e) => handleInputChange('delivery_fee', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.delivery_fee ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50'
                      }`}
                      style={{ '--tw-ring-color': theme.primary } as any}
                    />
                  </div>
                  {errors.delivery_fee && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.delivery_fee}
                    </p>
                  )}
                </div>

                {/* Minimum Order */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Minimum Order Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={formData.min_order_amount}
                      onChange={(e) => handleInputChange('min_order_amount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.min_order_amount ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50'
                      }`}
                      style={{ '--tw-ring-color': theme.primary } as any}
                    />
                  </div>
                  {errors.min_order_amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.min_order_amount}</p>
                  )}
                </div>

                {/* Free Delivery Threshold */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-500" />
                      Free Delivery Above (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={formData.free_delivery_threshold}
                      onChange={(e) => handleInputChange('free_delivery_threshold', e.target.value)}
                      placeholder="Leave empty to disable"
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.free_delivery_threshold ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50'
                      }`}
                      style={{ '--tw-ring-color': theme.primary } as any}
                    />
                  </div>
                  {errors.free_delivery_threshold && (
                    <p className="text-red-500 text-sm mt-1">{errors.free_delivery_threshold}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">
                    Orders above this amount get free delivery
                  </p>
                </div>

                {/* Estimated Time */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Estimated Delivery Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="number"
                      value={formData.estimated_time_minutes}
                      onChange={(e) => handleInputChange('estimated_time_minutes', e.target.value)}
                      placeholder="45"
                      min="1"
                      className={`w-full pl-10 pr-16 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.estimated_time_minutes ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50'
                      }`}
                      style={{ '--tw-ring-color': theme.primary } as any}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                      mins
                    </span>
                  </div>
                  {errors.estimated_time_minutes && (
                    <p className="text-red-500 text-sm mt-1">{errors.estimated_time_minutes}</p>
                  )}
                </div>

                {/* Zone Color */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Zone Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ZONE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleInputChange('color', color)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          formData.color === color 
                            ? 'ring-2 ring-offset-2 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ 
                          backgroundColor: color,
                          '--tw-ring-color': color,
                        } as any}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Boundary Drawing */}
          {currentStep === 'boundary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900">Draw Zone Boundary</h3>
                  <p className="text-sm text-zinc-500">
                    Click on the map to draw the delivery zone boundary
                  </p>
                </div>
                {boundary && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      Boundary set ({boundary.coordinates[0].length - 1} points)
                    </span>
                    <button
                      onClick={() => {
                        setBoundary(null);
                        setIsDrawingMode(true);
                      }}
                      className="text-sm text-zinc-500 hover:text-zinc-700 underline"
                    >
                      Redraw
                    </button>
                  </div>
                )}
              </div>

              {/* Drawing Instructions */}
              {!boundary && (
                <div 
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{ backgroundColor: theme.primaryLight }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <Edit3 className="w-4 h-4" style={{ color: theme.textOnPrimary }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.primaryDark }}>
                      How to draw a zone boundary:
                    </p>
                    <ol className="text-sm mt-2 space-y-1" style={{ color: theme.primaryDark }}>
                      <li>1. <strong>Click on the map</strong> to place your first point</li>
                      <li>2. Continue clicking to add more points around your zone</li>
                      <li>3. Click the <strong>first point</strong> again to close the shape</li>
                      <li className="text-xs opacity-75">Tip: You can also use the polygon tool in the top-right toolbar</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Map */}
              <DeliveryZoneMap
                zones={previewZones}
                country={country}
                selectedZoneId={zone?.id || 'new-zone'}
                isDrawingMode={!boundary}
                onNewZoneBoundary={handleBoundaryChange}
                storeLocation={storeLocation}
                height="400px"
              />

              {/* Skip boundary notice */}
              <p className="text-xs text-zinc-400 text-center">
                Drawing a boundary is optional but recommended for accurate zone mapping
              </p>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-zinc-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: formData.color }}
                  >
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-zinc-900">{formData.name}</h3>
                    {formData.description && (
                      <p className="text-zinc-500 mt-1">{formData.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Delivery Fee</p>
                    <p className="text-lg font-bold" style={{ color: theme.primary }}>
                      {formatCurrency(parseFloat(formData.delivery_fee) || 0, country)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Minimum Order</p>
                    <p className="text-lg font-bold text-zinc-900">
                      {formatCurrency(parseFloat(formData.min_order_amount) || 0, country)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Free Delivery</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formData.free_delivery_threshold 
                        ? `Above ${formatCurrency(parseFloat(formData.free_delivery_threshold), country)}`
                        : 'Not set'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Est. Time</p>
                    <p className="text-lg font-bold text-zinc-900">
                      {formData.estimated_time_minutes} mins
                    </p>
                  </div>
                </div>

                {/* Boundary Status */}
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-200">
                  <div className={`w-3 h-3 rounded-full ${boundary ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-sm">
                    {boundary 
                      ? `Zone boundary set (${boundary.coordinates[0].length - 1} points)`
                      : 'No boundary drawn (zone will not appear on map)'
                    }
                  </span>
                </div>
              </div>

              {/* Preview Map */}
              {boundary && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-700 mb-2">Zone Preview</h4>
                  <DeliveryZoneMap
                    zones={previewZones}
                    country={country}
                    selectedZoneId={zone?.id || 'new-zone'}
                    isDrawingMode={false}
                    storeLocation={storeLocation}
                    height="250px"
                    showControls={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between flex-shrink-0">
          <button
            onClick={currentStep === 'details' ? onClose : handleBack}
            className="px-4 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 'details' ? 'Cancel' : 'Back'}
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={() => saveZone.mutate()}
              disabled={saveZone.isPending}
              className="px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
            >
              {saveZone.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update Zone' : 'Create Zone'}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
              style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ZoneEditorModal;
