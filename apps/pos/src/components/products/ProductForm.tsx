import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, Package, DollarSign, Layers, FileText, ToggleLeft } from 'lucide-react';
import { productSchema, type ProductInput } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product, Category, Currency } from '@warehousepos/types';
import { useEffect } from 'react';

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  currency: Currency;
  onSuccess: () => void;
}

// Generate smart SKU from product name
function generateSKU(name: string, categoryName?: string): string {
  if (!name) return '';
  
  // Get first letters of each word (up to 3 words)
  const words = name.toUpperCase().split(/\s+/).filter(w => w.length > 0);
  const prefix = words.slice(0, 3).map(w => w.substring(0, 2)).join('');
  
  // Add category initial if available
  const catInitial = categoryName ? categoryName.charAt(0).toUpperCase() : '';
  
  // Add random 3-digit number
  const randomNum = Math.floor(100 + Math.random() * 900);
  
  return `${catInitial}${prefix}-${randomNum}`;
}

export function ProductForm({ product, categories, currency, onSuccess }: ProductFormProps) {
  const { store, tenant } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!product;

  // Theme
  const isNigeria = tenant?.country === 'NG';
  const theme = isNigeria ? {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#B8E0CC',
    accent: '#00A86B',
    text: '#FFFFFF',
    textOnLight: '#004D31',
  } : {
    primary: '#FFD000',
    primaryLight: '#FFF9E0',
    primaryMid: '#FFEC80',
    accent: '#B8960B',
    text: '#1A1400',
    textOnLight: '#6B5A00',
  };

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
  const productName = watch('name');
  const categoryId = watch('category_id');
  const currentSku = watch('sku');

  // Auto-generate SKU when name changes (only for new products)
  useEffect(() => {
    if (!isEditing && productName && !currentSku) {
      const category = categories.find(c => c.id === categoryId);
      const newSku = generateSKU(productName, category?.name);
      setValue('sku', newSku);
    }
  }, [productName, categoryId, isEditing, setValue, categories, currentSku]);

  const regenerateSKU = () => {
    const category = categories.find(c => c.id === categoryId);
    const newSku = generateSKU(productName, category?.name);
    setValue('sku', newSku);
  };

  const mutation = useMutation({
    mutationFn: async (data: ProductInput) => {
      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            sku: data.sku,
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

  const currencySymbol = currency === 'NGN' ? '₦' : 'GH₵';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Product Name */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: theme.textOnLight }}>
          <Package className="w-4 h-4" style={{ color: theme.accent }} />
          Product Name
        </label>
        <input
          type="text"
          placeholder="e.g., Premium Rice 50kg"
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
          style={{ 
            borderColor: errors.name ? '#EF4444' : theme.primaryMid,
            backgroundColor: theme.primaryLight,
          }}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      {/* SKU - Auto Generated */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: theme.textOnLight }}>
          <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
          SKU
          <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primaryMid, color: theme.textOnLight }}>
            Auto-generated
          </span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Auto-generated"
            className="flex-1 px-4 py-3 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 transition-all"
            style={{ 
              borderColor: errors.sku ? '#EF4444' : theme.primaryMid,
              backgroundColor: theme.primaryLight,
            }}
            {...register('sku')}
          />
          <button
            type="button"
            onClick={regenerateSKU}
            className="px-4 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: theme.primary, color: theme.text }}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
        {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: theme.textOnLight }}>
          <Layers className="w-4 h-4" style={{ color: theme.accent }} />
          Category
        </label>
        <select
          value={watch('category_id') || ''}
          onChange={(e) => setValue('category_id', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all appearance-none"
          style={{ 
            borderColor: theme.primaryMid,
            backgroundColor: theme.primaryLight,
            color: theme.textOnLight
          }}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Pricing */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <DollarSign className="w-4 h-4" style={{ color: theme.accent }} />
          Pricing
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Cost Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: theme.accent }}>{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: theme.primaryMid }}
                {...register('cost_price', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Selling Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: theme.accent }}>{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: theme.primaryMid }}
                {...register('selling_price', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>
        {(errors.cost_price || errors.selling_price) && (
          <p className="text-xs text-red-500 mt-2">{errors.cost_price?.message || errors.selling_price?.message}</p>
        )}
      </div>

      {/* Unit */}
      <div>
        <label className="text-sm font-semibold mb-2 block" style={{ color: theme.textOnLight }}>
          Unit of Measure
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { value: 'piece', label: 'Piece' },
            { value: 'kg', label: 'Kg' },
            { value: 'bag', label: 'Bag' },
            { value: 'box', label: 'Box' },
            { value: 'carton', label: 'Carton' },
          ].map((unit) => (
            <button
              key={unit.value}
              type="button"
              onClick={() => setValue('unit', unit.value)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all border"
              style={{
                backgroundColor: watch('unit') === unit.value ? theme.primary : 'white',
                color: watch('unit') === unit.value ? theme.text : theme.textOnLight,
                borderColor: watch('unit') === unit.value ? theme.primary : theme.primaryMid,
              }}
            >
              {unit.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: theme.textOnLight }}>
          <FileText className="w-4 h-4" style={{ color: theme.accent }} />
          Description
          <span className="text-xs font-normal text-zinc-400">(Optional)</span>
        </label>
        <textarea
          placeholder="Brief product description..."
          rows={2}
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all resize-none"
          style={{ borderColor: theme.primaryMid }}
          {...register('description')}
        />
      </div>

      {/* Track Stock Toggle */}
      <div 
        className="flex items-center justify-between p-4 rounded-xl border cursor-pointer"
        style={{ borderColor: theme.primaryMid, backgroundColor: trackStock ? theme.primaryLight : 'white' }}
        onClick={() => setValue('track_stock', !trackStock)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: trackStock ? theme.primary : theme.primaryMid }}
          >
            <ToggleLeft className="w-5 h-5" style={{ color: trackStock ? theme.text : theme.textOnLight }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: theme.textOnLight }}>Track Inventory</p>
            <p className="text-xs text-zinc-500">Monitor stock levels for this product</p>
          </div>
        </div>
        <div 
          className={`w-12 h-7 rounded-full p-1 transition-all ${trackStock ? '' : 'bg-zinc-200'}`}
          style={{ backgroundColor: trackStock ? theme.primary : undefined }}
        >
          <div 
            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${trackStock ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold border transition-all hover:bg-zinc-50"
          style={{ borderColor: theme.primaryMid, color: theme.textOnLight }}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={mutation.isPending}
          className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.primary, color: theme.text }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Update Product'
          ) : (
            'Add Product'
          )}
        </button>
      </div>
    </form>
  );
}
