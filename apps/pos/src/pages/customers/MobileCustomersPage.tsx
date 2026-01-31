/**
 * Mobile Customers Page
 * PWA-optimized customer management with light blue theme
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Users,
  ShoppingBag,
  TrendingUp,
  Calendar,
  X,
  UserPlus,
  Crown,
  Star,
  ChevronLeft,
  Check,
  Loader2,
  Edit2,
  Trash2,
  User,
  FileText,
  CreditCard,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatPhone } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Customer, CountryCode } from '@warehousepos/types';

// ============================================
// THEME CONFIGURATION - Light Blue
// ============================================
const theme = {
  // Base colors
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceLight: '#f1f5f9',
  surfaceElevated: '#e2e8f0',
  
  // Primary blue palette
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  primaryMid: '#93c5fd',
  primaryDark: '#1d4ed8',
  primaryGlow: '#3b82f620',
  
  // Text colors
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  
  // Border
  border: '#e2e8f0',
};

// Haptic feedback helper
const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  success: () => navigator.vibrate?.([10, 50, 10]),
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
    'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500',
    'bg-lime-500', 'bg-yellow-500', 'bg-amber-500', 'bg-orange-500',
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

// ============================================
// CUSTOMER CARD COMPONENT
// ============================================
interface CustomerCardProps {
  customer: Customer;
  country: CountryCode;
  onSelect: (customer: Customer) => void;
}

function CustomerCard({ customer, country, onSelect }: CustomerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => { haptic.light(); onSelect(customer); }}
      className="rounded-xl p-3 active:scale-98"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(customer.name || '')}`}>
          {getInitials(customer.name || 'C')}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-semibold truncate" style={{ color: theme.textPrimary }}>
              {customer.name || 'Unnamed Customer'}
            </h3>
            {(customer.loyalty_points || 0) > 100 && (
              <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 text-[10px]" style={{ color: theme.textMuted }}>
              <Phone className="w-2.5 h-2.5" />
              {formatPhone(customer.phone || '', country)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-bold" style={{ color: theme.textPrimary }}>
            {formatCurrency(customer.total_spent || 0, country)}
          </p>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>
            {customer.total_orders || 0} orders
          </p>
        </div>

        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: theme.textMuted }} />
      </div>
    </motion.div>
  );
}

// ============================================
// CUSTOMER FORM COMPONENT
// ============================================
interface CustomerFormProps {
  customer?: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function MobileCustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const { tenant, store } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!customer;
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: customer
      ? {
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          notes: customer.notes || '',
        }
      : {
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing && customer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            notes: data.notes || null,
          } as never)
          .eq('id', customer.id);
        if (error) throw error;
      } else {
        if (!store?.id) throw new Error('Store not found');
        const { error } = await supabase.from('customers').insert({
          store_id: store.id,
          tenant_id: store.tenant_id,
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          notes: data.notes || null,
          credit_limit: 0,
          credit_balance: 0,
          loyalty_points: 0,
          total_orders: 0,
          total_spent: 0,
          tags: [],
          is_active: true,
        } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      haptic.success();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEditing ? 'Customer updated!' : 'Customer added!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error saving customer', { description: error.message });
    },
  });

  const onSubmit = (data: any) => {
    if (!data.phone && !data.name) {
      toast.error('Please enter at least a name or phone number');
      return;
    }
    mutation.mutate(data);
  };

  const phonePlaceholder = country === 'NG' ? '0801 234 5678' : '024 123 4567';

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: theme.background }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 safe-area-inset-top"
        style={{ backgroundColor: theme.primary }}
      >
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-white active:opacity-70"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs font-medium">Cancel</span>
        </button>
        <h1 className="text-sm font-bold text-white flex items-center gap-2">
          {isEditing ? (
            <>
              <Edit2 className="w-4 h-4" />
              Edit Customer
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              New Customer
            </>
          )}
        </h1>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={mutation.isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 text-white active:bg-white/30 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span className="text-xs font-bold">Save</span>
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Phone Field */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            <Phone className="w-3 h-3" style={{ color: theme.primary }} />
            Phone Number
          </label>
          <input
            type="tel"
            placeholder={phonePlaceholder}
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.surfaceLight,
              color: theme.textPrimary,
              '--tw-ring-color': theme.primaryMid,
            } as React.CSSProperties}
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-[10px] text-red-500 mt-1">{errors.phone.message as string}</p>
          )}
        </div>

        {/* Name Field */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            <User className="w-3 h-3" style={{ color: theme.primary }} />
            Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.surfaceLight,
              color: theme.textPrimary,
              '--tw-ring-color': theme.primaryMid,
            } as React.CSSProperties}
            {...register('name')}
          />
        </div>

        {/* Email Field */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            <Mail className="w-3 h-3" style={{ color: theme.primary }} />
            Email Address
            <span className="text-[9px] font-normal" style={{ color: theme.textMuted }}>(optional)</span>
          </label>
          <input
            type="email"
            placeholder="john@example.com"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.surfaceLight,
              color: theme.textPrimary,
              '--tw-ring-color': theme.primaryMid,
            } as React.CSSProperties}
            {...register('email')}
          />
        </div>

        {/* Address Field */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            <MapPin className="w-3 h-3" style={{ color: theme.primary }} />
            Address
            <span className="text-[9px] font-normal" style={{ color: theme.textMuted }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="123 Main St, City"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.surfaceLight,
              color: theme.textPrimary,
              '--tw-ring-color': theme.primaryMid,
            } as React.CSSProperties}
            {...register('address')}
          />
        </div>

        {/* Notes Field */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            <FileText className="w-3 h-3" style={{ color: theme.primary }} />
            Notes
            <span className="text-[9px] font-normal" style={{ color: theme.textMuted }}>(optional)</span>
          </label>
          <textarea
            placeholder="Any additional notes about this customer..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
            style={{
              backgroundColor: theme.surfaceLight,
              color: theme.textPrimary,
              '--tw-ring-color': theme.primaryMid,
            } as React.CSSProperties}
            {...register('notes')}
          />
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="px-4 py-4 safe-area-inset-bottom" style={{ backgroundColor: theme.surface, borderTop: `1px solid ${theme.border}` }}>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={mutation.isPending}
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 text-white"
          style={{ backgroundColor: theme.primary }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {isEditing ? 'Update Customer' : 'Add Customer'}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// CUSTOMER DETAIL VIEW
// ============================================
interface CustomerDetailProps {
  customer: Customer;
  country: CountryCode;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onClose: () => void;
}

function CustomerDetailView({ customer, country, onEdit, onDelete, onClose }: CustomerDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: theme.background }}
    >
      {/* Header with Avatar */}
      <div
        className="px-4 pt-3 pb-6 safe-area-inset-top"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-white active:opacity-70"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-xs font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(customer)}
              className="p-2 rounded-lg bg-white/20 text-white active:bg-white/30"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(customer)}
              className="p-2 rounded-lg bg-red-500/80 text-white active:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer Avatar & Name */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(customer.name || '')}`}>
            {getInitials(customer.name || 'C')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">
                {customer.name || 'Unnamed Customer'}
              </h1>
              {(customer.loyalty_points || 0) > 100 && (
                <Crown className="w-5 h-5 text-yellow-300" />
              )}
            </div>
            <p className="text-xs text-white/70">
              Customer since {new Date(customer.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: theme.primaryLight }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: theme.primary }} />
              <span className="text-[10px] uppercase font-bold" style={{ color: theme.textMuted }}>Total Spent</span>
            </div>
            <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>
              {formatCurrency(customer.total_spent || 0, country)}
            </p>
          </div>
          <div className="rounded-xl p-3 bg-emerald-50">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] uppercase font-bold" style={{ color: theme.textMuted }}>Orders</span>
            </div>
            <p className="text-lg font-bold text-emerald-600">
              {customer.total_orders || 0}
            </p>
          </div>
          <div className="rounded-xl p-3 bg-amber-50">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] uppercase font-bold" style={{ color: theme.textMuted }}>Loyalty</span>
            </div>
            <p className="text-lg font-bold text-amber-600">
              {customer.loyalty_points || 0} pts
            </p>
          </div>
          <div className="rounded-xl p-3 bg-sky-50">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span className="text-[10px] uppercase font-bold" style={{ color: theme.textMuted }}>Credit</span>
            </div>
            <p className="text-lg font-bold text-sky-600">
              {formatCurrency(customer.credit_balance || 0, country)}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.surfaceLight }}
              >
                <Phone className="w-4 h-4" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>Phone</p>
                <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                  {formatPhone(customer.phone || '', country)}
                </p>
              </div>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.surfaceLight }}
                >
                  <Mail className="w-4 h-4" style={{ color: theme.primary }} />
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Email</p>
                  <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                    {customer.email}
                  </p>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.surfaceLight }}
                >
                  <MapPin className="w-4 h-4" style={{ color: theme.primary }} />
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Address</p>
                  <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                    {customer.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {customer.notes && (
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
              Notes
            </h3>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              {customer.notes}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-medium active:scale-95"
              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
            >
              <Gift className="w-4 h-4" />
              Add Points
            </button>
            <button
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-medium active:scale-95"
              style={{ backgroundColor: '#d1fae5', color: '#059669' }}
            >
              <CreditCard className="w-4 h-4" />
              Add Credit
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 py-4 safe-area-inset-bottom" style={{ backgroundColor: theme.surface, borderTop: `1px solid ${theme.border}` }}>
        <button
          onClick={() => onEdit(customer)}
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 text-white"
          style={{ backgroundColor: theme.primary }}
        >
          <Edit2 className="w-4 h-4" />
          Edit Customer
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN MOBILE CUSTOMERS PAGE
// ============================================
export function MobileCustomersPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', store?.id, searchQuery],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('customers')
        .select('*')
        .eq('store_id', store.id);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
      setSelectedCustomer(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete', { description: error.message });
    },
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Delete "${customer.name || 'this customer'}"?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  // Stats
  const totalCustomers = customers?.length || 0;
  const activeCustomers = customers?.filter((c: any) => c.total_orders > 0).length || 0;
  const totalRevenue = customers?.reduce((sum: number, c: any) => sum + (c.total_spent || 0), 0) || 0;
  const newThisMonth = customers?.filter((c: any) => {
    const created = new Date(c.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length || 0;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <div
        className="px-4 pt-3 pb-4 safe-area-inset-top"
        style={{ backgroundColor: theme.primary }}
      >
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-white">Customers</h1>
            <p className="text-[10px] text-white/70 font-mono">
              {totalCustomers} customers • {formatCurrency(totalRevenue, country)} revenue
            </p>
          </div>
          <button
            onClick={() => { haptic.light(); setIsFormOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 text-white text-xs font-medium active:bg-white/30"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, email..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-mono bg-white/20 text-white placeholder-white/50 focus:outline-none focus:bg-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Strip */}
      <div
        className="px-3 py-3 overflow-x-auto scrollbar-hide"
        style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-3 min-w-max">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Users className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Total</p>
              <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>{totalCustomers}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Active</p>
              <p className="text-sm font-bold text-emerald-600">{activeCustomers}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-50">
              <TrendingUp className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Revenue</p>
              <p className="text-sm font-bold text-sky-600">{formatCurrency(totalRevenue, country)}</p>
            </div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>New</p>
              <p className="text-sm font-bold text-amber-600">{newThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="p-3 space-y-2">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-3 animate-pulse"
              style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full" style={{ backgroundColor: theme.surfaceLight }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded" style={{ backgroundColor: theme.surfaceLight, width: '50%' }} />
                  <div className="h-2 rounded" style={{ backgroundColor: theme.surfaceLight, width: '30%' }} />
                </div>
              </div>
            </div>
          ))
        ) : customers && customers.length > 0 ? (
          customers.map((customer: Customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              country={country}
              onSelect={setSelectedCustomer}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textMuted }} />
            <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>
              No customers yet
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Add your first customer to get started
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: theme.primary }}
            >
              <UserPlus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {customers && customers.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => { haptic.medium(); setIsFormOpen(true); }}
          className="fixed bottom-6 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 z-30"
          style={{ backgroundColor: theme.primary }}
        >
          <UserPlus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Customer Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <MobileCustomerForm
            customer={editingCustomer}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        )}
      </AnimatePresence>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDetailView
            customer={selectedCustomer}
            country={country}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileCustomersPage;
