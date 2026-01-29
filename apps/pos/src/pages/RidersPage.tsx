import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle_type: string;
  vehicle_number?: string;
  is_active: boolean;
  is_online: boolean;
  created_at: string;
}

export default function RidersPage() {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);

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
        .insert({ ...rider, store_id: store.id } as never)
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
    onSuccess: () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Riders</h1>
        <button
          onClick={() => {
            setEditingRider(null);
            setShowForm(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Add Rider
        </button>
      </div>

      {/* Rider Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingRider ? 'Edit Rider' : 'Add New Rider'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingRider?.name}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  defaultValue={editingRider?.phone}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="+233..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingRider?.email}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type *
                </label>
                <select
                  name="vehicle_type"
                  required
                  defaultValue={editingRider?.vehicle_type || 'motorcycle'}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicle_number"
                  defaultValue={editingRider?.vehicle_number}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="e.g., GH-1234-20"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRider(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  {editingRider ? 'Update' : 'Add'} Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Riders Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : riders?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No riders added yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add delivery riders to assign orders for delivery
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders?.map((rider) => (
            <div
              key={rider.id}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                    {rider.vehicle_type === 'motorcycle' && '🏍️'}
                    {rider.vehicle_type === 'bicycle' && '🚴'}
                    {rider.vehicle_type === 'car' && '🚗'}
                    {rider.vehicle_type === 'van' && '🚐'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rider.name}</h3>
                    <p className="text-sm text-gray-500">{rider.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      rider.is_online ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  ></span>
                  <span className="text-xs text-gray-500">
                    {rider.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rider.is_active}
                      onChange={(e) =>
                        toggleRiderStatus.mutate({
                          id: rider.id,
                          is_active: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                  <span className="text-sm text-gray-600">
                    {rider.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingRider(rider);
                    setShowForm(true);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
