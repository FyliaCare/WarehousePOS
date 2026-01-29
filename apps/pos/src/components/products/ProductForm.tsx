import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button, Input, Select, Switch } from '@warehousepos/ui';
import { productSchema, type ProductInput } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product, Category, Currency } from '@warehousepos/types';

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  currency: Currency;
  onSuccess: () => void;
}

export function ProductForm({ product, categories, currency, onSuccess }: ProductFormProps) {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          barcode: product.barcode || '',
          description: product.description || '',
          category_id: product.category_id || undefined,
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          unit: product.unit || 'piece',
          track_stock: product.track_stock,
          tax_rate: 0,
          tax_inclusive: false,
          min_stock_level: product.min_stock_level || 0,
          images: [],
          has_variants: false,
          variant_options: [],
          show_online: true,
        }
      : {
          name: '',
          sku: '',
          barcode: '',
          description: '',
          category_id: undefined,
          cost_price: 0,
          selling_price: 0,
          unit: 'piece',
          track_stock: true,
          tax_rate: 0,
          tax_inclusive: false,
          min_stock_level: 0,
          images: [],
          has_variants: false,
          variant_options: [],
          show_online: true,
        },
  });

  const trackStock = watch('track_stock');

  const mutation = useMutation({
    mutationFn: async (data: ProductInput) => {
      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            sku: data.sku,
            barcode: data.barcode || null,
            description: data.description || null,
            category_id: data.category_id || null,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            unit: data.unit,
            track_stock: data.track_stock,
            min_stock_level: data.min_stock_level,
          } as never)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({
          store_id: store?.id,
          name: data.name,
          sku: data.sku,
          barcode: data.barcode || null,
          description: data.description || null,
          category_id: data.category_id || null,
          cost_price: data.cost_price,
          selling_price: data.selling_price,
          unit: data.unit,
          track_stock: data.track_stock,
          min_stock_level: data.min_stock_level,
        } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEditing ? 'Product updated!' : 'Product created!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error saving product', { description: error.message });
    },
  });

  const onSubmit = (data: ProductInput) => {
    mutation.mutate(data);
  };

  const currencySymbol = currency === 'NGN' ? '₦' : '₵';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Product Name"
        placeholder="e.g., Rice (50kg bag)"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="SKU"
          placeholder="e.g., RICE-50KG"
          error={errors.sku?.message}
          {...register('sku')}
        />
        <Input
          label="Barcode (optional)"
          placeholder="Enter barcode"
          error={errors.barcode?.message}
          {...register('barcode')}
        />
      </div>

      <Select
        label="Category"
        value={watch('category_id') || ''}
        onValueChange={(value) => setValue('category_id', value)}
        placeholder="Select category"
        options={categories.map((c) => ({
          value: c.id,
          label: c.name,
        }))}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`Cost Price (${currencySymbol})`}
          type="number"
          step="0.01"
          min="0"
          error={errors.cost_price?.message}
          {...register('cost_price', { valueAsNumber: true })}
        />
        <Input
          label={`Selling Price (${currencySymbol})`}
          type="number"
          step="0.01"
          min="0"
          error={errors.selling_price?.message}
          {...register('selling_price', { valueAsNumber: true })}
        />
      </div>

      <Select
        label="Unit"
        value={watch('unit')}
        onValueChange={(value) => setValue('unit', value)}
        options={[
          { value: 'piece', label: 'Piece' },
          { value: 'kg', label: 'Kilogram (kg)' },
          { value: 'g', label: 'Gram (g)' },
          { value: 'l', label: 'Liter (l)' },
          { value: 'ml', label: 'Milliliter (ml)' },
          { value: 'box', label: 'Box' },
          { value: 'pack', label: 'Pack' },
          { value: 'carton', label: 'Carton' },
          { value: 'bag', label: 'Bag' },
          { value: 'dozen', label: 'Dozen' },
        ]}
      />

      <Input
        label="Description (optional)"
        placeholder="Product description..."
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div>
          <p className="font-medium text-foreground">Track Stock</p>
          <p className="text-sm text-muted-foreground">
            Enable inventory tracking for this product
          </p>
        </div>
        <Switch
          checked={trackStock}
          onCheckedChange={(checked) => setValue('track_stock', checked)}
        />
      </div>

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
            'Update Product'
          ) : (
            'Add Product'
          )}
        </Button>
      </div>
    </form>
  );
}
