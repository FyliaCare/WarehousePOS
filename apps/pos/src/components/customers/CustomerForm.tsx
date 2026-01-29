import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button, Input } from '@warehousepos/ui';
import { customerSchema, type CustomerInput } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Customer } from '@warehousepos/types';

interface CustomerFormProps {
  customer?: Customer | null;
  onSuccess: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { tenant, store } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!customer;

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Phone Number"
        type="tel"
        placeholder={phonePlaceholder}
        error={errors.phone?.message}
        {...register('phone')}
      />

      <Input
        label="Full Name (optional)"
        placeholder="John Doe"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Email (optional)"
        type="email"
        placeholder="john@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Address (optional)"
        placeholder="123 Main Street"
        error={errors.address?.message}
        {...register('address')}
      />

      <Input
        label="Notes (optional)"
        placeholder="Additional notes about this customer..."
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Update Customer'
          ) : (
            'Add Customer'
          )}
        </Button>
      </div>
    </form>
  );
}
