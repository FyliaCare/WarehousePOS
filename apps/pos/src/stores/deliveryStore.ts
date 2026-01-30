import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

// ==========================================
// TYPES
// ==========================================

export interface DeliveryZone {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  delivery_fee: number;
  min_order_amount: number;
  estimated_time_minutes: number;
  boundary?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  radius_km?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rider {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car' | 'foot';
  vehicle_number?: string;
  status: 'available' | 'busy' | 'offline';
  current_latitude?: number;
  current_longitude?: number;
  is_active: boolean;
  is_online: boolean;
  employment_type?: 'full_time' | 'part_time' | 'freelance';
  commission_rate?: number;
  fixed_rate?: number;
  id_number?: string;
  id_type?: string;
  id_verified: boolean;
  total_deliveries: number;
  rating: number;
  total_ratings: number;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export type DeliveryAssignmentStatus = 
  | 'pending'
  | 'assigned' 
  | 'accepted' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled';

export interface DeliveryAssignment {
  id: string;
  store_id: string;
  order_id: string;
  rider_id?: string;
  status: DeliveryAssignmentStatus;
  assigned_at?: string;
  accepted_at?: string;
  picked_up_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  failed_at?: string;
  route?: Array<{ lat: number; lng: number; timestamp: string }>;
  delivery_photo_url?: string;
  recipient_name?: string;
  signature_url?: string;
  delivery_notes?: string;
  delivery_fee: number;
  rider_earnings: number;
  tip_amount: number;
  customer_rating?: number;
  customer_feedback?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
  // Relations
  order?: {
    order_number: string;
    total: number;
    customer_name?: string;
    customer_phone?: string;
    delivery_address?: string;
    notes?: string;
    items?: Array<{
      id: string;
      quantity: number;
      total: number;
      product?: { name: string };
    }>;
  };
  rider?: Rider;
}

export interface DeliveryStats {
  total_deliveries: number;
  delivered_today: number;
  in_transit: number;
  pending_assignments: number;
  failed_today: number;
  average_delivery_time: number;
  total_riders: number;
  available_riders: number;
  busy_riders: number;
  offline_riders: number;
  total_earnings_today: number;
  average_rating: number;
}

// ==========================================
// DELIVERY ZONE STORE
// ==========================================

interface DeliveryZoneState {
  zones: DeliveryZone[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchZones: (storeId: string) => Promise<void>;
  addZone: (zone: Partial<DeliveryZone>) => Promise<DeliveryZone>;
  updateZone: (id: string, updates: Partial<DeliveryZone>) => Promise<void>;
  deleteZone: (id: string) => Promise<void>;
  toggleZoneStatus: (id: string, isActive: boolean) => Promise<void>;
  
  // Selectors
  getZoneById: (id: string) => DeliveryZone | undefined;
  getActiveZones: () => DeliveryZone[];
  getZoneByName: (name: string) => DeliveryZone | undefined;
}

export const useDeliveryZoneStore = create<DeliveryZoneState>()(
  persist(
    (set, get) => ({
      zones: [],
      isLoading: false,
      error: null,

      fetchZones: async (storeId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('delivery_zones')
            .select('*')
            .eq('store_id', storeId)
            .order('name');
          
          if (error) throw error;
          set({ zones: data || [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      addZone: async (zone) => {
        const { data, error } = await supabase
          .from('delivery_zones')
          .insert(zone as never)
          .select()
          .single();
        
        if (error) throw error;
        set((state) => ({ zones: [...state.zones, data] }));
        return data;
      },

      updateZone: async (id, updates) => {
        const { error } = await supabase
          .from('delivery_zones')
          .update({ ...updates, updated_at: new Date().toISOString() } as never)
          .eq('id', id);
        
        if (error) throw error;
        set((state) => ({
          zones: state.zones.map((z) => (z.id === id ? { ...z, ...updates } : z)),
        }));
      },

      deleteZone: async (id) => {
        const { error } = await supabase
          .from('delivery_zones')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        set((state) => ({ zones: state.zones.filter((z) => z.id !== id) }));
      },

      toggleZoneStatus: async (id, isActive) => {
        await get().updateZone(id, { is_active: isActive });
      },

      getZoneById: (id) => get().zones.find((z) => z.id === id),
      getActiveZones: () => get().zones.filter((z) => z.is_active),
      getZoneByName: (name) => get().zones.find((z) => z.name.toLowerCase() === name.toLowerCase()),
    }),
    {
      name: 'delivery-zones-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ zones: state.zones }),
    }
  )
);

// ==========================================
// RIDER STORE
// ==========================================

interface RiderState {
  riders: Rider[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRiders: (storeId: string) => Promise<void>;
  addRider: (rider: Partial<Rider>) => Promise<Rider>;
  updateRider: (id: string, updates: Partial<Rider>) => Promise<void>;
  deleteRider: (id: string) => Promise<void>;
  updateRiderStatus: (id: string, status: Rider['status']) => Promise<void>;
  updateRiderLocation: (id: string, lat: number, lng: number) => Promise<void>;
  
  // Selectors
  getRiderById: (id: string) => Rider | undefined;
  getActiveRiders: () => Rider[];
  getAvailableRiders: () => Rider[];
  getRidersByStatus: (status: Rider['status']) => Rider[];
}

export const useRiderStore = create<RiderState>()(
  persist(
    (set, get) => ({
      riders: [],
      isLoading: false,
      error: null,

      fetchRiders: async (storeId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('riders')
            .select('*')
            .eq('store_id', storeId)
            .order('name');
          
          if (error) throw error;
          set({ riders: data || [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      addRider: async (rider) => {
        const { data, error } = await supabase
          .from('riders')
          .insert({
            ...rider,
            status: 'offline',
            is_active: true,
            is_online: false,
            total_deliveries: 0,
            rating: 5.0,
            total_ratings: 0,
            id_verified: false,
          } as never)
          .select()
          .single();
        
        if (error) throw error;
        set((state) => ({ riders: [...state.riders, data] }));
        return data;
      },

      updateRider: async (id, updates) => {
        const { error } = await supabase
          .from('riders')
          .update({ ...updates, updated_at: new Date().toISOString() } as never)
          .eq('id', id);
        
        if (error) throw error;
        set((state) => ({
          riders: state.riders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },

      deleteRider: async (id) => {
        const { error } = await supabase
          .from('riders')
          .update({ is_active: false } as never)
          .eq('id', id);
        
        if (error) throw error;
        set((state) => ({
          riders: state.riders.map((r) => (r.id === id ? { ...r, is_active: false } : r)),
        }));
      },

      updateRiderStatus: async (id, status) => {
        await get().updateRider(id, { 
          status, 
          is_online: status !== 'offline',
          last_seen_at: new Date().toISOString(),
        });
      },

      updateRiderLocation: async (id, lat, lng) => {
        await get().updateRider(id, {
          current_latitude: lat,
          current_longitude: lng,
          last_seen_at: new Date().toISOString(),
        });
      },

      getRiderById: (id) => get().riders.find((r) => r.id === id),
      getActiveRiders: () => get().riders.filter((r) => r.is_active),
      getAvailableRiders: () => get().riders.filter((r) => r.is_active && r.status === 'available'),
      getRidersByStatus: (status) => get().riders.filter((r) => r.status === status),
    }),
    {
      name: 'riders-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ riders: state.riders }),
    }
  )
);

// ==========================================
// DELIVERY ASSIGNMENT STORE
// ==========================================

interface DeliveryAssignmentState {
  assignments: DeliveryAssignment[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAssignments: (storeId: string) => Promise<void>;
  assignRider: (orderId: string, riderId: string, fee: number, storeId: string) => Promise<DeliveryAssignment>;
  updateAssignmentStatus: (id: string, status: DeliveryAssignmentStatus, data?: Partial<DeliveryAssignment>) => Promise<void>;
  addDeliveryProof: (id: string, photoUrl: string, recipientName: string, notes?: string) => Promise<void>;
  rateDelivery: (id: string, rating: number, feedback?: string) => Promise<void>;
  cancelAssignment: (id: string, reason: string) => Promise<void>;
  
  // Selectors
  getAssignmentById: (id: string) => DeliveryAssignment | undefined;
  getAssignmentByOrderId: (orderId: string) => DeliveryAssignment | undefined;
  getAssignmentsByRiderId: (riderId: string) => DeliveryAssignment[];
  getAssignmentsByStatus: (status: DeliveryAssignmentStatus) => DeliveryAssignment[];
  getPendingAssignments: () => DeliveryAssignment[];
  getActiveDeliveries: () => DeliveryAssignment[];
  getDeliveryStats: () => DeliveryStats;
}

export const useDeliveryAssignmentStore = create<DeliveryAssignmentState>()(
  persist(
    (set, get) => ({
      assignments: [],
      isLoading: false,
      error: null,

      fetchAssignments: async (storeId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('delivery_assignments')
            .select(`
              *,
              order:orders(
                order_number,
                total,
                customer_name,
                customer_phone,
                delivery_address,
                notes,
                items:order_items(id, quantity, total, product:products(name))
              ),
              rider:riders(*)
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          set({ assignments: data || [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      assignRider: async (orderId, riderId, fee, storeId) => {
        // Calculate rider earnings (70% default commission)
        const riderEarnings = fee * 0.7;
        
        const { data, error } = await supabase
          .from('delivery_assignments')
          .insert({
            order_id: orderId,
            rider_id: riderId,
            store_id: storeId,
            status: 'assigned',
            delivery_fee: fee,
            rider_earnings: riderEarnings,
            tip_amount: 0,
            assigned_at: new Date().toISOString(),
          } as never)
          .select(`
            *,
            order:orders(order_number, total, customer_name, customer_phone, delivery_address),
            rider:riders(*)
          `)
          .single();
        
        if (error) throw error;
        
        // Update rider status to busy
        await supabase
          .from('riders')
          .update({ status: 'busy' } as never)
          .eq('id', riderId);
        
        // Update order delivery status
        await supabase
          .from('orders')
          .update({ delivery_status: 'assigned', rider_id: riderId } as never)
          .eq('id', orderId);
        
        set((state) => ({ assignments: [data, ...state.assignments] }));
        return data;
      },

      updateAssignmentStatus: async (id, status, data = {}) => {
        const now = new Date().toISOString();
        const timestampField: Record<string, string> = {
          accepted: 'accepted_at',
          picked_up: 'picked_up_at',
          in_transit: 'in_transit_at',
          delivered: 'delivered_at',
          failed: 'failed_at',
        };
        
        const updates: any = { status, ...data };
        if (timestampField[status]) {
          updates[timestampField[status]] = now;
        }
        
        const { error } = await supabase
          .from('delivery_assignments')
          .update(updates as never)
          .eq('id', id);
        
        if (error) throw error;
        
        // Update order delivery status
        const assignment = get().getAssignmentById(id);
        if (assignment?.order_id) {
          await supabase
            .from('orders')
            .update({ delivery_status: status } as never)
            .eq('id', assignment.order_id);
        }
        
        // If delivered or failed, set rider back to available
        if (['delivered', 'failed', 'cancelled'].includes(status) && assignment?.rider_id) {
          await supabase
            .from('riders')
            .update({ status: 'available' } as never)
            .eq('id', assignment.rider_id);
          
          // Update rider stats if delivered
          if (status === 'delivered') {
            await supabase.rpc('increment_rider_deliveries', { rider_id: assignment.rider_id });
          }
        }
        
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, status, ...updates } : a
          ),
        }));
      },

      addDeliveryProof: async (id, photoUrl, recipientName, notes) => {
        await get().updateAssignmentStatus(id, 'delivered', {
          delivery_photo_url: photoUrl,
          recipient_name: recipientName,
          delivery_notes: notes,
        });
      },

      rateDelivery: async (id, rating, feedback) => {
        const { error } = await supabase
          .from('delivery_assignments')
          .update({
            customer_rating: rating,
            customer_feedback: feedback,
          } as never)
          .eq('id', id);
        
        if (error) throw error;
        
        // Update rider rating
        const assignment = get().getAssignmentById(id);
        if (assignment?.rider_id) {
          // This would ideally be done via a database function
          const { data: rider } = await supabase
            .from('riders')
            .select('rating, total_ratings')
            .eq('id', assignment.rider_id)
            .single();
          
          if (rider) {
            const newTotalRatings = (rider.total_ratings || 0) + 1;
            const newRating = ((rider.rating || 5) * (rider.total_ratings || 0) + rating) / newTotalRatings;
            
            await supabase
              .from('riders')
              .update({ rating: newRating, total_ratings: newTotalRatings } as never)
              .eq('id', assignment.rider_id);
          }
        }
        
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, customer_rating: rating, customer_feedback: feedback } : a
          ),
        }));
      },

      cancelAssignment: async (id, reason) => {
        await get().updateAssignmentStatus(id, 'cancelled', { failure_reason: reason });
      },

      getAssignmentById: (id) => get().assignments.find((a) => a.id === id),
      getAssignmentByOrderId: (orderId) => get().assignments.find((a) => a.order_id === orderId),
      getAssignmentsByRiderId: (riderId) => get().assignments.filter((a) => a.rider_id === riderId),
      getAssignmentsByStatus: (status) => get().assignments.filter((a) => a.status === status),
      getPendingAssignments: () => get().assignments.filter((a) => a.status === 'pending'),
      getActiveDeliveries: () => 
        get().assignments.filter((a) => 
          ['assigned', 'accepted', 'picked_up', 'in_transit'].includes(a.status)
        ),

      getDeliveryStats: () => {
        const assignments = get().assignments;
        const today = new Date().toDateString();
        const todayAssignments = assignments.filter(
          (a) => new Date(a.created_at).toDateString() === today
        );
        
        return {
          total_deliveries: assignments.filter((a) => a.status === 'delivered').length,
          delivered_today: todayAssignments.filter((a) => a.status === 'delivered').length,
          in_transit: assignments.filter((a) => a.status === 'in_transit').length,
          pending_assignments: assignments.filter((a) => a.status === 'pending').length,
          failed_today: todayAssignments.filter((a) => a.status === 'failed').length,
          average_delivery_time: 0, // Would need calculation from timestamps
          total_riders: 0, // Would come from rider store
          available_riders: 0,
          busy_riders: 0,
          offline_riders: 0,
          total_earnings_today: todayAssignments
            .filter((a) => a.status === 'delivered')
            .reduce((sum, a) => sum + (a.delivery_fee || 0), 0),
          average_rating: 
            assignments.filter((a) => a.customer_rating).length > 0
              ? assignments.reduce((sum, a) => sum + (a.customer_rating || 0), 0) /
                assignments.filter((a) => a.customer_rating).length
              : 5,
        };
      },
    }),
    {
      name: 'delivery-assignments-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ assignments: state.assignments }),
    }
  )
);
