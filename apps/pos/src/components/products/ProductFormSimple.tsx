import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, Package, DollarSign, Hash, Barcode, Archive, 
  ChevronDown, ChevronUp, Image, FileText, Tag, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product, Category, Currency } from '@warehousepos/types';
import { cn } from '@warehousepos/utils';
import { DynamicProductFields, useBusinessProductFields } from './DynamicProductFields';
import { getBusinessCategory } from '../../../../../packages/shared/src/data/business-categories';

interface ProductFormSimpleProps {
  product?: Product | null;
  categories: Category[];
  currency: Currency;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ProductFormData {
  name: string;
  sku: string;
  barcode?: string;
  category_id?: string;
  price: number;
  cost_price: number;
  quantity: number;
  low_stock_threshold: number;
  unit: string;
  description?: string;
  image_url?: string;
  track_inventory: boolean;
}

// Generate SKU from name
function generateSKU(name: string): string {
  if (!name) return '';
  const words = name.toUpperCase().split(/\s+/).filter(w => w.length > 0);
  const prefix = words.slice(0, 3).map(w => w.substring(0, 2)).join('');
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randomNum}`;
}

export function ProductFormSimple({ product, categories, currency, onSuccess, onCancel }: ProductFormSimpleProps) {
  const { store, tenant } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!product;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBusinessFields, setShowBusinessFields] = useState(true);

  // Get business-specific fields
  const businessFields = useBusinessProductFields();
  const hasBusinessFields = businessFields.length > 0;
  
  // Get business category info
  const businessCategory = useMemo(() => {
    if (!tenant?.business_type) return null;
    return getBusinessCategory(tenant.business_type);
  }, [tenant?.business_type]);

  // Theme based on country
  const isNigeria = tenant?.country === 'NG';
  const brandColor = isNigeria ? '#008751' : '#FFD000';
  const brandColorLight = isNigeria ? '#E8F5EE' : '#FFF9E0';
  const brandColorMid = isNigeria ? '#B8E0CC' : '#FFEC80';
  const brandText = isNigeria ? '#004D31' : '#6B5A00';
  const brandTextBtn = isNigeria ? '#FFFFFF' : '#1A1400';
  const currencySymbol = currency === 'NGN' ? '₦' : 'GH₵';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    defaultValues: product ? {
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category_id: product.category_id || undefined,
      price: product.selling_price || (product as any).price || 0,
      cost_price: product.cost_price || 0,
      quantity: product.stock_quantity || 0,
      low_stock_threshold: (product as any).low_stock_threshold || 10,
      unit: product.unit || 'piece',
      description: product.description || '',
      image_url: product.image_url || '',
      track_inventory: product.track_stock ?? true,
    } : {
      name: '',
      sku: '',
      barcode: '',
      category_id: undefined,
      price: 0,
      cost_price: 0,
      quantity: 0,
      low_stock_threshold: 10,
      unit: 'piece',
      description: '',
      image_url: '',
      track_inventory: true,
    },
  });

  const productName = watch('name');
  const trackInventory = watch('track_inventory');

  // Auto-generate SKU for new products
  const handleNameBlur = () => {
    if (!isEditing && productName && !watch('sku')) {
      setValue('sku', generateSKU(productName));
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!store?.id) throw new Error('No store selected');
      
      if (isEditing && product) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            sku: data.sku,
            barcode: data.barcode || null,
            category_id: data.category_id || null,
            price: data.price,
            cost_price: data.cost_price,
            unit: data.unit,
            description: data.description || null,
            image_url: data.image_url || null,
            track_inventory: data.track_inventory,
            low_stock_threshold: data.low_stock_threshold,
          })
          .eq('id', product.id);
        
        if (error) throw error;

        // Update stock level if tracking inventory
        if (data.track_inventory) {
          const { error: stockError } = await supabase
            .from('stock_levels')
            .upsert({
              product_id: product.id,
              store_id: store.id,
              quantity: data.quantity,
              reorder_level: data.low_stock_threshold,
            }, { onConflict: 'product_id,store_id' });
          
          if (stockError) console.warn('Stock update warning:', stockError.message);
        }
      } else {
        // Create product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            store_id: store.id,
            name: data.name,
            sku: data.sku,
            barcode: data.barcode || null,
            category_id: data.category_id || null,
            price: data.price,
            cost_price: data.cost_price,
            unit: data.unit,
            description: data.description || null,
            image_url: data.image_url || null,
            track_inventory: data.track_inventory,
            low_stock_threshold: data.low_stock_threshold,
            is_active: true,
          })
          .select()
          .single();
        
        if (error) throw error;

        // Create initial stock level
        if (data.track_inventory && newProduct) {
          const { error: stockError } = await supabase
            .from('stock_levels')
            .insert({
              product_id: newProduct.id,
              store_id: store.id,
              quantity: data.quantity,
              reorder_level: data.low_stock_threshold,
            });
          
          if (stockError) console.warn('Stock creation warning:', stockError.message);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      toast.success(isEditing ? 'Product updated!' : 'Product created!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error saving product', { description: error.message });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Product Name */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
          <Package className="w-4 h-4" style={{ color: brandColor }} />
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Coca-Cola 500ml"
          className={cn(
            'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all',
            errors.name ? 'border-red-400 focus:ring-red-200' : 'focus:ring-opacity-50'
          )}
          style={{ 
            borderColor: errors.name ? undefined : brandColorMid,
            backgroundColor: brandColorLight,
            '--tw-ring-color': brandColor,
          } as any}
          {...register('name', { required: 'Product name is required' })}
          onBlur={handleNameBlur}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      {/* SKU & Barcode Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
            <Hash className="w-4 h-4" style={{ color: brandColor }} />
            SKU
          </label>
          <input
            type="text"
            placeholder="Auto-generated"
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: brandColorMid, backgroundColor: brandColorLight }}
            {...register('sku')}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
            <Barcode className="w-4 h-4" style={{ color: brandColor }} />
            Barcode
          </label>
          <input
            type="text"
            placeholder="Optional"
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: brandColorMid, backgroundColor: brandColorLight }}
            {...register('barcode')}
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
          <Tag className="w-4 h-4" style={{ color: brandColor }} />
          Category
        </label>
        <select
          className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all appearance-none bg-no-repeat"
          style={{ 
            borderColor: brandColorMid, 
            backgroundColor: brandColorLight,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundPosition: 'right 12px center',
            backgroundSize: '20px',
          }}
          {...register('category_id')}
        >
          <option value="">No Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Pricing Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
            <DollarSign className="w-4 h-4" style={{ color: brandColor }} />
            Selling Price <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all',
                errors.price ? 'border-red-400' : ''
              )}
              style={{ borderColor: errors.price ? undefined : brandColorMid, backgroundColor: brandColorLight }}
              {...register('price', { 
                required: 'Price is required',
                valueAsNumber: true,
                min: { value: 0, message: 'Price must be positive' }
              })}
            />
          </div>
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
            <DollarSign className="w-4 h-4" style={{ color: brandColor }} />
            Cost Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: brandColorMid, backgroundColor: brandColorLight }}
              {...register('cost_price', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* Inventory Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
            <Archive className="w-4 h-4" style={{ color: brandColor }} />
            Quantity in Stock
          </label>
          <input
            type="number"
            min="0"
            placeholder="0"
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: brandColorMid, backgroundColor: brandColorLight }}
            disabled={!trackInventory}
            {...register('quantity', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
            <Archive className="w-4 h-4" style={{ color: brandColor }} />
            Low Stock Alert
          </label>
          <input
            type="number"
            min="0"
            placeholder="10"
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ borderColor: brandColorMid, backgroundColor: brandColorLight }}
            disabled={!trackInventory}
            {...register('low_stock_threshold', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Track Inventory Toggle */}
      <div className="flex items-center justify-between py-2 px-4 rounded-xl" style={{ backgroundColor: brandColorLight }}>
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: brandText }}>
          <Archive className="w-4 h-4" style={{ color: brandColor }} />
          Track Inventory
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            {...register('track_inventory')}
          />
          <div 
            className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
            style={{ backgroundColor: trackInventory ? brandColor : '#D1D5DB' }}
          />
        </label>
      </div>

      {/* Business-Specific Fields */}
      {hasBusinessFields && (
        <>
          <button
            type="button"
            onClick={() => setShowBusinessFields(!showBusinessFields)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl border-2 border-dashed text-sm font-medium transition-colors"
            style={{ 
              borderColor: brandColorMid, 
              backgroundColor: brandColorLight,
              color: brandText 
            }}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: brandColor }} />
              {businessCategory?.name} Details
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/80">
                {businessFields.length} fields
              </span>
            </span>
            {showBusinessFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showBusinessFields && (
            <div className="p-4 rounded-xl border" style={{ borderColor: brandColorMid, backgroundColor: 'white' }}>
              <p className="text-xs text-gray-500 mb-4">
                These fields are specific to your {businessCategory?.name?.toLowerCase()} business
              </p>
              <DynamicProductFields
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors as any}
              />
            </div>
          )}
        </>
      )}

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between py-3 px-4 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
        style={{ borderColor: brandColorMid, color: brandText }}
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Advanced Options
        </span>
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Advanced Options Section */}
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t" style={{ borderColor: brandColorMid }}>
          {/* Unit */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
              Unit of Measure
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all appearance-none"
              style={{ 
                borderColor: brandColorMid, 
                backgroundColor: brandColorLight,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px',
                backgroundRepeat: 'no-repeat',
              }}
              {...register('unit')}
            >
              <option value="piece">Piece</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="l">Liter (L)</option>
              <option value="ml">Milliliter (ml)</option>
              <option value="m">Meter (m)</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
              <option value="dozen">Dozen</option>
              <option value="carton">Carton</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
              <FileText className="w-4 h-4" style={{ color: brandColor }} />
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Product description (optional)"
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all resize-none"
              style={{ borderColor: brandColorMid, backgroundColor: brandColorLight }}
              {...register('description')}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
              <Image className="w-4 h-4" style={{ color: brandColor }} />
              Image URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: brandColorMid, backgroundColor: brandColorLight }}
              {...register('image_url')}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
          style={{ borderColor: brandColorMid, color: brandText }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: brandColor, color: brandTextBtn }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            isEditing ? 'Update Product' : 'Add Product'
          )}
        </button>
      </div>
    </form>
  );
}

export default ProductFormSimple;
