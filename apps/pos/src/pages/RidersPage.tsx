import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { formatPhone, timeAgo } from '@warehousepos/utils';
import {
  Bike,
  Car,
  Truck as Van,
  Plus,
  Search,
  X,
  User,
  Phone,
  Mail,
  Hash,
  Power,
  Edit2,
  Clock,
  CheckCircle,
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

interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle_type: string;
  vehicle_number?: string;
  is_active: boolean;
  is_online: boolean;
  current_latitude?: number;
  current_longitude?: number;
  last_seen_at?: string;
  created_at: string;
}

export default function RidersPage() {
  const { store, tenant } = useAuthStore();
  const queryClient = useQueryClient();
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  const theme = themes[country];
  
  const [showForm, setShowForm] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: riders, isLoading } = useQuery({
    queryKey: ['riders', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Rider[];
    },
    enabled: !!store?.id,
  });

  const createRider = useMutation({
    mutationFn: async (rider: Partial<Rider>) => {
      if (!store?.id) throw new Error('Store not found');
      const { data, error } = await supabase
        .from('riders')
        .insert({ ...rider, store_id: store.id, is_active: true, is_online: false } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Rider added successfully');
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateRider = useMutation({
    mutationFn: async ({ id, ...rider }: Partial<Rider>) => {
      if (!id) throw new Error('Rider ID is required');
      const { data, error } = await supabase
        .from('riders')
        .update(rider as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Rider updated successfully');
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      setEditingRider(null);
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleRiderStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('riders')
        .update({ is_active } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Rider ${variables.is_active ? 'activated' : 'deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rider = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || undefined,
      vehicle_type: formData.get('vehicle_type') as string,
      vehicle_number: formData.get('vehicle_number') as string || undefined,
    };

    if (editingRider) {
      updateRider.mutate({ id: editingRider.id, ...rider });
    } else {
      createRider.mutate(rider);
    }
  };

  // Stats
  const totalRiders = riders?.length || 0;
  const activeRiders = riders?.filter(r => r.is_active).length || 0;
  const onlineRiders = riders?.filter(r => r.is_online).length || 0;
  const inactiveRiders = riders?.filter(r => !r.is_active).length || 0;

  // Filter riders
  const filteredRiders = riders?.filter((rider) => {
    const matchesSearch = !searchQuery || 
      rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && rider.is_active) ||
      (statusFilter === 'inactive' && !rider.is_active);
    return matchesSearch && matchesStatus;
  });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motorcycle': return Bike;
      case 'bicycle': return Bike;
      case 'car': return Car;
      case 'van': return Van;
      default: return Bike;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Premium Header */}
      <div 
        className="px-6 py-5"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: theme.textOnPrimary }}>
              Delivery Riders
            </h1>
            <p className="text-sm mt-0.5 opacity-80" style={{ color: theme.textOnPrimary }}>
              Manage your delivery team
            </p>
          </div>
          <button
            onClick={() => {
              setEditingRider(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
            style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
          >
            <Plus className="w-4 h-4" />
            Add Rider
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
              <Bike className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Riders</p>
              <p className="text-lg font-bold text-zinc-900">{totalRiders}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <Power className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Online Now</p>
              <p className="text-lg font-bold text-emerald-600">{onlineRiders}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Active</p>
              <p className="text-lg font-bold text-blue-600">{activeRiders}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100">
              <X className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Inactive</p>
              <p className="text-lg font-bold text-zinc-500">{inactiveRiders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search riders by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-zinc-200">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as 'all' | 'active' | 'inactive')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  statusFilter === option.value
                    ? 'text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
                style={statusFilter === option.value ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Riders Grid */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-zinc-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-zinc-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRiders && filteredRiders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRiders.map((rider) => {
              const VehicleIcon = getVehicleIcon(rider.vehicle_type);
              return (
                <div
                  key={rider.id}
                  className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedRider(rider)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: rider.is_active ? theme.primaryLight : '#F4F4F5' }}
                      >
                        <VehicleIcon 
                          className="w-7 h-7" 
                          style={{ color: rider.is_active ? theme.accent : '#A1A1AA' }} 
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900">{rider.name}</h3>
                        <p className="text-sm text-zinc-500">{formatPhone(rider.phone, country)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        rider.is_online 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${rider.is_online ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        {rider.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                    <span className="flex items-center gap-1 capitalize">
                      <VehicleIcon className="w-4 h-4" />
                      {rider.vehicle_type}
                    </span>
                    {rider.vehicle_number && (
                      <span className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        {rider.vehicle_number}
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRiderStatus.mutate({ id: rider.id, is_active: !rider.is_active });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          rider.is_active ? '' : 'bg-zinc-200'
                        }`}
                        style={rider.is_active ? { backgroundColor: theme.primary } : {}}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                            rider.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm text-zinc-600">
                        {rider.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRider(rider);
                        setShowForm(true);
                      }}
                      className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
                      style={{ color: theme.primaryDark }}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Bike className="w-8 h-8" style={{ color: theme.accent }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No riders found</h3>
            <p className="text-sm text-zinc-500 mb-4">
              {searchQuery ? 'Try a different search' : 'Add your first delivery rider'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingRider(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
              >
                Add Rider
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Rider Slide Panel */}
      {showForm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => {
              setShowForm(false);
              setEditingRider(null);
            }}
          />
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-hidden"
            style={{ animation: 'slideInFromRight 0.3s ease-out' }}
          >
            {/* Panel Header */}
            <div 
              className="px-6 py-5 border-b"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingRider(null);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primary }}
                >
                  <Bike className="w-7 h-7" style={{ color: theme.textOnPrimary }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    {editingRider ? 'Edit Rider' : 'Add New Rider'}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {editingRider ? 'Update rider information' : 'Add a delivery team member'}
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto h-[calc(100%-120px)] space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingRider?.name}
                    placeholder="Enter rider's full name"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={editingRider?.phone}
                    placeholder={country === 'GH' ? '+233 XX XXX XXXX' : '+234 XXX XXX XXXX'}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Rider will use this number to log into the delivery app
                </p>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingRider?.email}
                    placeholder="rider@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
                  />
                </div>
              </div>
              
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Vehicle Type *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'motorcycle', label: 'Motor', icon: Bike },
                    { value: 'bicycle', label: 'Bicycle', icon: Bike },
                    { value: 'car', label: 'Car', icon: Car },
                    { value: 'van', label: 'Van', icon: Van },
                  ].map((vehicle) => (
                    <label
                      key={vehicle.value}
                      className="relative cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="vehicle_type"
                        value={vehicle.value}
                        defaultChecked={editingRider?.vehicle_type === vehicle.value || (!editingRider && vehicle.value === 'motorcycle')}
                        className="peer sr-only"
                      />
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-zinc-200 peer-checked:border-2 transition-all"
                           style={{ '--tw-border-opacity': 1 } as React.CSSProperties}>
                        <vehicle.icon className="w-6 h-6 text-zinc-600 peer-checked:text-zinc-900" />
                        <span className="text-xs font-medium text-zinc-600">{vehicle.label}</span>
                      </div>
                      <style>{`
                        input[name="vehicle_type"]:checked + div {
                          border-color: ${theme.primary};
                          background-color: ${theme.primaryLight};
                        }
                      `}</style>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Vehicle Number (Optional)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    name="vehicle_number"
                    defaultValue={editingRider?.vehicle_number}
                    placeholder={country === 'GH' ? 'GH-1234-20' : 'ABC-123-XY'}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
                  />
                </div>
              </div>
              
              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRider(null);
                  }}
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-lg text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRider.isPending || updateRider.isPending}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
                >
                  {createRider.isPending || updateRider.isPending ? 'Saving...' : editingRider ? 'Update Rider' : 'Add Rider'}
                </button>
              </div>
            </form>
          </div>
          <style>{`
            @keyframes slideInFromRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}

      {/* Rider Detail Slide Panel */}
      {selectedRider && !showForm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setSelectedRider(null)}
          />
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-hidden"
            style={{ animation: 'slideInFromRight 0.3s ease-out' }}
          >
            {/* Panel Header */}
            <div 
              className="px-6 py-5 border-b"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <button
                onClick={() => setSelectedRider(null)}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primary }}
                >
                  {(() => {
                    const VIcon = getVehicleIcon(selectedRider.vehicle_type);
                    return <VIcon className="w-7 h-7" style={{ color: theme.textOnPrimary }} />;
                  })()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedRider.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedRider.is_online 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedRider.is_online ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      {selectedRider.is_online ? 'Online' : 'Offline'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedRider.is_active 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedRider.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto h-[calc(100%-120px)] space-y-5">
              {/* Contact Info */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Phone</p>
                      <p className="text-sm text-zinc-900">{formatPhone(selectedRider.phone, country)}</p>
                    </div>
                  </div>
                  {selectedRider.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Email</p>
                        <p className="text-sm text-zinc-900">{selectedRider.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Vehicle Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                      {(() => {
                        const VIcon = getVehicleIcon(selectedRider.vehicle_type);
                        return <VIcon className="w-4 h-4 text-zinc-600" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Vehicle Type</p>
                      <p className="text-sm text-zinc-900 capitalize">{selectedRider.vehicle_type}</p>
                    </div>
                  </div>
                  {selectedRider.vehicle_number && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Vehicle Number</p>
                        <p className="text-sm text-zinc-900">{selectedRider.vehicle_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Info */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                      <Clock className="w-4 h-4 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Last Seen</p>
                      <p className="text-sm text-zinc-900">
                        {selectedRider.last_seen_at ? timeAgo(selectedRider.last_seen_at) : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                      <Package className="w-4 h-4 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Member Since</p>
                      <p className="text-sm text-zinc-900">
                        {new Date(selectedRider.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedRider(null);
                    setEditingRider(selectedRider);
                    setShowForm(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 rounded-lg text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Rider
                </button>
                <button
                  onClick={() => {
                    toggleRiderStatus.mutate({ 
                      id: selectedRider.id, 
                      is_active: !selectedRider.is_active 
                    });
                    setSelectedRider(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedRider.is_active 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {selectedRider.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes slideInFromRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
