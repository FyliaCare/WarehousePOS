import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { formatCurrency } from '@warehousepos/utils';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  Package,
  Power,
  Map,
  List,
  ChevronRight,
  Layers,
  Gift,
  AlertTriangle,
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { DeliveryZoneMap, type ZoneBoundary } from '@/components/maps';
import { ZoneEditorModal, type DeliveryZone } from '@/components/delivery';
import type { CountryCode } from '@warehousepos/types';

// Theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1A1A',
    textOnLight: '#1A1A1A',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B40',
    accent: '#1A1A1A',
    textOnPrimary: '#FFFFFF',
    textOnLight: '#1A1A1A',
  },
};

export default function DeliveryZonesPage() {
  const { store, tenant } = useAuthStore();
  const queryClient = useQueryClient();
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  const theme = themes[country];
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [zoneMenuOpen, setZoneMenuOpen] = useState<string | null>(null);

  // Fetch zones
  const { data: zones, isLoading, refetch } = useQuery({
    queryKey: ['delivery-zones', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('store_id', store.id)
        .order('name');
      if (error) throw error;
      return data as DeliveryZone[];
    },
    enabled: !!store?.id,
  });

  // Fetch store location (from settings.location or use Accra default)
  const { data: storeLocation } = useQuery({
    queryKey: ['store-location', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      const { data } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', store.id)
        .single();
      
      // Check if location is stored in settings
      if (data?.settings?.location?.lat && data?.settings?.location?.lng) {
        return { 
          lat: data.settings.location.lat, 
          lng: data.settings.location.lng 
        };
      }
      
      // Default to Accra, Ghana for dev/testing
      return { lat: 5.6037, lng: -0.1870 };
    },
    enabled: !!store?.id,
  });

  // Toggle zone status
  const toggleZoneStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('delivery_zones')
        .update({ is_active, updated_at: new Date().toISOString() } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Zone ${variables.is_active ? 'activated' : 'deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete zone
  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Delivery zone deleted');
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      setShowDeleteConfirm(null);
      setSelectedZoneId(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Duplicate zone
  const duplicateZone = useMutation({
    mutationFn: async (zone: DeliveryZone) => {
      if (!store?.id) throw new Error('Store not found');
      
      const { data, error } = await supabase
        .from('delivery_zones')
        .insert({
          store_id: store.id,
          name: `${zone.name} (Copy)`,
          description: zone.description,
          delivery_fee: zone.delivery_fee,
          min_order_amount: zone.min_order_amount,
          free_delivery_threshold: zone.free_delivery_threshold,
          estimated_time_minutes: zone.estimated_time_minutes,
          boundary: zone.boundary,
          color: zone.color,
          is_active: false,
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Zone duplicated');
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Update zone boundary from map
  const updateBoundary = useMutation({
    mutationFn: async ({ id, boundary }: { id: string; boundary: ZoneBoundary }) => {
      const { error } = await supabase
        .from('delivery_zones')
        .update({ boundary, updated_at: new Date().toISOString() } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Zone boundary updated');
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const handleEdit = useCallback((zone: DeliveryZone) => {
    setEditingZone(zone);
    setShowEditor(true);
    setZoneMenuOpen(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setShowDeleteConfirm(id);
    setZoneMenuOpen(null);
  }, []);

  const handleDuplicate = useCallback((zone: DeliveryZone) => {
    duplicateZone.mutate(zone);
    setZoneMenuOpen(null);
  }, [duplicateZone]);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setEditingZone(null);
  }, []);

  // Stats
  const totalZones = zones?.length || 0;
  const activeZones = zones?.filter(z => z.is_active).length || 0;
  const zonesWithBoundary = zones?.filter(z => z.boundary).length || 0;
  const avgDeliveryFee = zones?.length 
    ? zones.reduce((sum, z) => sum + z.delivery_fee, 0) / zones.length 
    : 0;
  const avgDeliveryTime = zones?.length 
    ? Math.round(zones.reduce((sum, z) => sum + (z.estimated_time_minutes || 45), 0) / zones.length)
    : 0;

  // Filter zones
  const filteredZones = zones?.filter((zone) => {
    const matchesSearch = !searchQuery || 
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && zone.is_active) ||
      (statusFilter === 'inactive' && !zone.is_active);
    return matchesSearch && matchesStatus;
  });

  // Prepare zones for map
  const mapZones = (filteredZones || []).map(z => ({
    id: z.id,
    name: z.name,
    description: z.description,
    delivery_fee: z.delivery_fee,
    is_active: z.is_active,
    boundary: z.boundary,
    color: z.color,
  }));

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div 
        className="px-6 py-5"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-2xl font-bold"
              style={{ color: theme.textOnPrimary }}
            >
              Delivery Zones
            </h1>
            <p 
              className="text-sm opacity-80 mt-1"
              style={{ color: theme.textOnPrimary }}
            >
              Configure delivery areas, fees, and boundaries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="w-5 h-5" style={{ color: theme.textOnPrimary }} />
            </button>
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
              style={{ 
                backgroundColor: theme.accent, 
                color: country === 'GH' ? '#FFFFFF' : theme.primary 
              }}
            >
              <Plus className="w-5 h-5" />
              Add Zone
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme.primaryLight }}
              >
                <Layers className="w-5 h-5" style={{ color: theme.primaryDark }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{totalZones}</p>
                <p className="text-xs text-zinc-500">Total Zones</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
                <Power className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{activeZones}</p>
                <p className="text-xs text-zinc-500">Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
                <Map className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{zonesWithBoundary}</p>
                <p className="text-xs text-zinc-500">Mapped</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme.primaryLight }}
              >
                <DollarSign className="w-5 h-5" style={{ color: theme.primaryDark }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: theme.primaryDark }}>
                  {formatCurrency(avgDeliveryFee, country)}
                </p>
                <p className="text-xs text-zinc-500">Avg. Fee</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{avgDeliveryTime}</p>
                <p className="text-xs text-zinc-500">Avg. Mins</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search zones by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': theme.primary } as any}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2 p-1 bg-white border border-zinc-200 rounded-xl">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as 'all' | 'active' | 'inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === option.value
                    ? ''
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
                style={statusFilter === option.value ? { 
                  backgroundColor: theme.primary, 
                  color: theme.textOnPrimary 
                } : {}}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? '' : 'text-zinc-400 hover:text-zinc-600'
              }`}
              style={viewMode === 'list' ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'map' ? '' : 'text-zinc-400 hover:text-zinc-600'
              }`}
              style={viewMode === 'map' ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
            >
              <Map className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div 
              className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.primary }}
            />
          </div>
        ) : viewMode === 'map' ? (
          /* Map View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Map */}
            <div className="lg:col-span-2">
              <DeliveryZoneMap
                zones={mapZones}
                country={country}
                selectedZoneId={selectedZoneId}
                onZoneSelect={setSelectedZoneId}
                onBoundaryChange={(zoneId, boundary) => updateBoundary.mutate({ id: zoneId, boundary })}
                storeLocation={storeLocation}
                height="600px"
              />
            </div>
            
            {/* Zone List Sidebar */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 sticky top-0 bg-white z-10">
                <h3 className="font-semibold text-zinc-900">
                  Zones ({filteredZones?.length || 0})
                </h3>
              </div>
              <div className="divide-y divide-zinc-100 max-h-[540px] overflow-y-auto">
                {filteredZones?.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id)}
                    className={`w-full p-4 text-left transition-colors hover:bg-zinc-50 ${
                      selectedZoneId === zone.id ? 'bg-zinc-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-4 h-4 rounded mt-0.5"
                        style={{ backgroundColor: zone.color || theme.primary }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${zone.is_active ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {zone.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <span style={{ color: theme.primary }}>
                            {formatCurrency(zone.delivery_fee, country)}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="text-zinc-500">{zone.estimated_time_minutes || 45} min</span>
                        </div>
                        {!zone.boundary && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            No boundary
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${
                        selectedZoneId === zone.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                    
                    {selectedZoneId === zone.id && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(zone);
                          }}
                          className="flex-1 py-2 px-3 bg-zinc-100 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleZoneStatus.mutate({ id: zone.id, is_active: !zone.is_active });
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            zone.is_active 
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {zone.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </button>
                ))}
                
                {filteredZones?.length === 0 && (
                  <div className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500">No zones found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          filteredZones && filteredZones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                    zone.is_active ? 'border-zinc-200' : 'border-zinc-100 opacity-75'
                  }`}
                >
                  {/* Zone Color Bar */}
                  <div 
                    className="h-2"
                    style={{ backgroundColor: zone.color || theme.primary, opacity: zone.is_active ? 1 : 0.5 }}
                  />
                  
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: zone.is_active ? theme.primaryLight : '#F4F4F5' }}
                        >
                          <MapPin 
                            className="w-5 h-5" 
                            style={{ color: zone.is_active ? theme.primaryDark : '#A1A1AA' }}
                          />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${zone.is_active ? 'text-zinc-900' : 'text-zinc-500'}`}>
                            {zone.name}
                          </h3>
                          {zone.description && (
                            <p className="text-sm text-zinc-500 truncate max-w-[180px]">
                              {zone.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setZoneMenuOpen(zoneMenuOpen === zone.id ? null : zone.id)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>
                        
                        {zoneMenuOpen === zone.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setZoneMenuOpen(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 z-20 min-w-[150px]">
                              <button
                                onClick={() => handleEdit(zone)}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Zone
                              </button>
                              <button
                                onClick={() => handleDuplicate(zone)}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  toggleZoneStatus.mutate({ id: zone.id, is_active: !zone.is_active });
                                  setZoneMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                              >
                                {zone.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {zone.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <hr className="my-1 border-zinc-100" />
                              <button
                                onClick={() => handleDelete(zone.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-zinc-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                          <DollarSign className="w-3 h-3" />
                          Delivery Fee
                        </div>
                        <p className="font-bold" style={{ color: theme.primary }}>
                          {formatCurrency(zone.delivery_fee, country)}
                        </p>
                      </div>
                      <div className="bg-zinc-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                          <Clock className="w-3 h-3" />
                          Est. Time
                        </div>
                        <p className="font-bold text-zinc-900">
                          {zone.estimated_time_minutes || 45} mins
                        </p>
                      </div>
                      <div className="bg-zinc-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                          <Package className="w-3 h-3" />
                          Min Order
                        </div>
                        <p className="font-bold text-zinc-900">
                          {zone.min_order_amount ? formatCurrency(zone.min_order_amount, country) : 'None'}
                        </p>
                      </div>
                      <div className="bg-zinc-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                          <Gift className="w-3 h-3" />
                          Free Above
                        </div>
                        <p className="font-bold text-emerald-600">
                          {zone.free_delivery_threshold 
                            ? formatCurrency(zone.free_delivery_threshold, country) 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Boundary Status */}
                    {zone.boundary ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span>Boundary mapped ({zone.boundary.coordinates[0].length - 1} points)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-amber-600 mb-4">
                        <AlertTriangle className="w-4 h-4" />
                        <span>No boundary - zone won't appear on map</span>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleZoneStatus.mutate({ id: zone.id, is_active: !zone.is_active })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            zone.is_active ? '' : 'bg-zinc-200'
                          }`}
                          style={zone.is_active ? { backgroundColor: theme.primary } : {}}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              zone.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-sm text-zinc-600">
                          {zone.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleEdit(zone)}
                        className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-zinc-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl p-12 text-center">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: theme.primaryLight }}
              >
                <MapPin className="w-8 h-8" style={{ color: theme.primaryDark }} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">No Delivery Zones</h3>
              <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                Create delivery zones to define where you deliver and set fees for each area.
              </p>
              <button
                onClick={() => setShowEditor(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
                style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
              >
                <Plus className="w-5 h-5" />
                Create Your First Zone
              </button>
            </div>
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 text-center mb-2">
              Delete Zone?
            </h3>
            <p className="text-zinc-500 text-center mb-6">
              This action cannot be undone. All orders using this zone will no longer have delivery zone information.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteZone.mutate(showDeleteConfirm)}
                disabled={deleteZone.isPending}
                className="flex-1 py-3 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteZone.isPending ? 'Deleting...' : 'Delete Zone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Editor Modal */}
      <ZoneEditorModal
        isOpen={showEditor}
        onClose={handleCloseEditor}
        zone={editingZone}
        allZones={zones || []}
        storeLocation={storeLocation}
      />
    </div>
  );
}
