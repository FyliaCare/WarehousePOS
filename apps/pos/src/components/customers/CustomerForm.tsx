import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { customerSchema, type CustomerInput } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Customer, CountryCode } from '@warehousepos/types';

interface CustomerFormProps {
  customer?: Customer | null;
  onSuccess: () => void;
}

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

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { tenant, store } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!customer;
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: customer
      ? {
          name: customer.name || '',
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || '',
          notes: customer.notes || '',
          credit_limit: customer.credit_limit || 0,
          tags: customer.tags || [],
        }
      : {
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
          credit_limit: 0,
          tags: [],
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerInput) => {
      if (isEditing) {
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
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEditing ? 'Customer updated!' : 'Customer added!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error saving customer', { description: error.message });
    },
  });

  const onSubmit = (data: CustomerInput) => {
    mutation.mutate(data);
  };

  const phonePlaceholder = tenant?.country === 'NG' ? '0801 234 5678' : '024 123 4567';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Phone Number - Primary */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <Phone className="w-4 h-4" style={{ color: theme.accent }} />
          Phone Number
          <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          placeholder={phonePlaceholder}
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
          style={{ borderColor: theme.primaryMid }}
          {...register('phone')}
        />
        {errors.phone && <p className="text-xs text-red-500 mt-2">{errors.phone.message}</p>}
      </div>

      {/* Name */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <User className="w-4 h-4" style={{ color: theme.accent }} />
          Full Name
          <span className="text-xs text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="John Doe"
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
          style={{ borderColor: theme.primaryMid }}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-500 mt-2">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <Mail className="w-4 h-4" style={{ color: theme.accent }} />
          Email Address
          <span className="text-xs text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          type="email"
          placeholder="john@example.com"
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
          style={{ borderColor: theme.primaryMid }}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-red-500 mt-2">{errors.email.message}</p>}
      </div>

      {/* Address */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <MapPin className="w-4 h-4" style={{ color: theme.accent }} />
          Address
          <span className="text-xs text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="123 Main Street, City"
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
          style={{ borderColor: theme.primaryMid }}
          {...register('address')}
        />
        {errors.address && <p className="text-xs text-red-500 mt-2">{errors.address.message}</p>}
      </div>

      {/* Notes */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <FileText className="w-4 h-4" style={{ color: theme.accent }} />
          Notes
          <span className="text-xs text-zinc-400 font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="Additional notes about this customer..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all resize-none"
          style={{ borderColor: theme.primaryMid }}
          {...register('notes')}
        />
        {errors.notes && <p className="text-xs text-red-500 mt-2">{errors.notes.message}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 px-4 py-3 rounded-lg font-medium text-sm border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
          style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Update Customer'
          ) : (
            'Add Customer'
          )}
        </button>
      </div>
    </form>
  );
}
