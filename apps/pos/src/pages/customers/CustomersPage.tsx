import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Users,
  ShoppingBag,
  MapPin,
  Star,
  TrendingUp,
  Calendar,
  X,
  UserPlus,
  Crown,
} from 'lucide-react';
import { formatCurrency, formatPhone } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Customer, CountryCode } from '@warehousepos/types';
import { CustomerForm } from '@/components/customers/CustomerForm';

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

export function CustomersPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];
  const queryClient = useQueryClient();

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
      toast.success('Customer deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete customer', { description: error.message });
    },
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (confirm(`Are you sure you want to delete "${customer.name}"?`)) {
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
              Customers
            </h1>
            <p className="text-sm mt-0.5 opacity-80" style={{ color: theme.textOnPrimary }}>
              Manage your customer database
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90"
            style={{ 
              backgroundColor: theme.accent,
              color: country === 'GH' ? '#FFD000' : '#FFFFFF'
            }}
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
              <Users className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Customers</p>
              <p className="text-lg font-bold text-zinc-900">{totalCustomers}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Active Buyers</p>
              <p className="text-lg font-bold text-emerald-600">{activeCustomers}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Revenue</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totalRevenue, country)}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">New This Month</p>
              <p className="text-lg font-bold text-amber-600">{newThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 bg-white"
            style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border-b border-zinc-100 last:border-0 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-zinc-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : customers && customers.length > 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {customers.map((customer: Customer, index: number) => (
              <div
                key={customer.id}
                className={`flex items-center gap-4 px-4 py-4 hover:bg-zinc-50 transition-colors cursor-pointer ${
                  index !== customers.length - 1 ? 'border-b border-zinc-100' : ''
                }`}
                onClick={() => setSelectedCustomer(customer)}
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(customer.name || '')}`}>
                  {getInitials(customer.name || 'C')}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-zinc-900">
                      {customer.name || 'Unnamed Customer'}
                    </h3>
                    {(customer.loyalty_points || 0) > 100 && (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Phone className="w-3 h-3" />
                      {formatPhone(customer.phone || '', tenant?.country || 'GH')}
                    </span>
                    {customer.email && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="text-right">
                  <p className="font-semibold text-sm text-zinc-900">
                    {formatCurrency(customer.total_spent || 0, country)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {customer.total_orders || 0} orders
                  </p>
                </div>
                
                {/* Loyalty Points Badge */}
                {(customer.loyalty_points || 0) > 0 && (
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: theme.primaryLight, color: theme.accent }}
                  >
                    <Star className="w-3 h-3 inline mr-1" />
                    {customer.loyalty_points}
                  </span>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer)}
                    className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-zinc-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Users className="w-8 h-8" style={{ color: theme.accent }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No customers yet</h3>
            <p className="text-sm text-zinc-500 mb-4">Add your first customer to get started</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
            >
              <UserPlus className="w-4 h-4" />
              Add First Customer
            </button>
          </div>
        )}
      </div>

      {/* Customer Form Slide Panel */}
      {isFormOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={handleFormClose}
          />
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden"
            style={{ animation: 'slideInFromRight 0.3s ease-out' }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {editingCustomer ? 'Update customer details' : 'Add a new customer to your database'}
                </p>
              </div>
              <button
                onClick={handleFormClose}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-80px)] p-6">
              <CustomerForm
                customer={editingCustomer}
                onSuccess={handleFormClose}
              />
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

      {/* Customer Detail Slide Panel */}
      {selectedCustomer && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden"
            style={{ animation: 'slideInFromRight 0.3s ease-out' }}
          >
            <div 
              className="px-6 py-6 border-b"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(selectedCustomer.name || '')}`}>
                  {getInitials(selectedCustomer.name || 'C')}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    {selectedCustomer.name || 'Unnamed Customer'}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="text-sm text-zinc-700">
                      {formatPhone(selectedCustomer.phone || '', tenant?.country || 'GH')}
                    </span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-zinc-600" />
                      </div>
                      <span className="text-sm text-zinc-700">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-zinc-600" />
                      </div>
                      <span className="text-sm text-zinc-700">{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
                  <p className="text-xs text-zinc-500 mb-1">Total Spent</p>
                  <p className="text-xl font-bold" style={{ color: theme.accent }}>
                    {formatCurrency(selectedCustomer.total_spent || 0, country)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50">
                  <p className="text-xs text-zinc-500 mb-1">Total Orders</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {selectedCustomer.total_orders || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50">
                  <p className="text-xs text-zinc-500 mb-1">Loyalty Points</p>
                  <p className="text-xl font-bold text-amber-600">
                    {selectedCustomer.loyalty_points || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50">
                  <p className="text-xs text-zinc-500 mb-1">Credit Balance</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(selectedCustomer.credit_balance || 0, country)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid }}>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2">Notes</h3>
                  <p className="text-sm text-zinc-600">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    handleEdit(selectedCustomer);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Customer
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    handleDelete(selectedCustomer);
                  }}
                  className="px-4 py-3 rounded-lg font-medium text-sm border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
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
