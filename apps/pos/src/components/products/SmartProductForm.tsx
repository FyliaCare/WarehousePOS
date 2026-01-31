/**
 * SmartProductForm Component
 * 
 * An intelligent product form that:
 * 1. Auto-detects product type from name and suggests category
 * 2. Shows dynamic fields based on selected category's business_type
 * 3. Has Quick Add (minimal) vs Full mode
 * 4. Auto-generates SKU, suggests pricing based on similar products
 * 5. Works for multi-industry shops via category-based fields
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  Loader2, Package, DollarSign, Hash, Barcode, Archive, 
  ChevronDown, ChevronUp, Image, FileText, Tag, Sparkles,
  Wand2, Zap, Settings2, Lightbulb, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product, Category, Currency } from '@warehousepos/types';
import { cn } from '@warehousepos/utils';
import { 
  getBusinessCategory,
  searchBusinessCategories,
  type ProductFieldConfig,
} from '../../../../../packages/shared/src/data/business-categories';

interface SmartProductFormProps {
  product?: Product | null;
  categories: Category[];
  currency: Currency;
  onSuccess: () => void;
  onCancel: () => void;
  initialMode?: 'quick' | 'full';
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
  custom_fields?: Record<string, any>;
}

// Smart product name patterns for auto-detection
const PRODUCT_PATTERNS: Array<{
  patterns: RegExp[];
  businessType: string;
  suggestedCategory: string;
  emoji: string;
}> = [
  // Food & Beverage
  { patterns: [/rice|jollof|fried rice|waakye|fufu|banku|kenkey/i], businessType: 'restaurant', suggestedCategory: 'Main Dishes', emoji: '🍚' },
  { patterns: [/chicken|beef|goat|fish|tilapia|meat|grilled|kebab|suya/i], businessType: 'restaurant', suggestedCategory: 'Proteins', emoji: '🍗' },
  { patterns: [/coca.?cola|fanta|sprite|pepsi|malt|drink|juice|water|soda/i], businessType: 'restaurant', suggestedCategory: 'Beverages', emoji: '🥤' },
  { patterns: [/beer|star|club|guinness|lager|stout/i], businessType: 'bar_lounge', suggestedCategory: 'Alcoholic Beverages', emoji: '🍺' },
  { patterns: [/bread|cake|pastry|pie|donut|croissant|muffin/i], businessType: 'bakery', suggestedCategory: 'Baked Goods', emoji: '🍞' },
  { patterns: [/coffee|latte|cappuccino|espresso|americano|mocha/i], businessType: 'cafe_coffee_shop', suggestedCategory: 'Hot Drinks', emoji: '☕' },
  
  // Fashion & Retail
  { patterns: [/shirt|blouse|top|t.?shirt|polo/i], businessType: 'clothing_boutique', suggestedCategory: 'Tops', emoji: '👕' },
  { patterns: [/trouser|pants|jeans|shorts|skirt/i], businessType: 'clothing_boutique', suggestedCategory: 'Bottoms', emoji: '👖' },
  { patterns: [/dress|gown|kaftan|agbada|kente/i], businessType: 'clothing_boutique', suggestedCategory: 'Dresses', emoji: '👗' },
  { patterns: [/shoe|sneaker|sandal|heel|boot|slipper/i], businessType: 'shoe_store', suggestedCategory: 'Footwear', emoji: '👟' },
  { patterns: [/bag|handbag|purse|clutch|backpack/i], businessType: 'fashion_accessories', suggestedCategory: 'Bags', emoji: '👜' },
  { patterns: [/watch|necklace|bracelet|earring|ring|jewelry|jewellery/i], businessType: 'jewelry_store', suggestedCategory: 'Jewelry', emoji: '💍' },
  
  // Electronics
  { patterns: [/iphone|samsung|phone|mobile|android|tecno|infinix|itel/i], businessType: 'electronics_store', suggestedCategory: 'Smartphones', emoji: '📱' },
  { patterns: [/laptop|macbook|computer|pc|desktop/i], businessType: 'computer_it_services', suggestedCategory: 'Computers', emoji: '💻' },
  { patterns: [/charger|cable|earphone|headphone|airpod|case|screen protector/i], businessType: 'phone_accessories', suggestedCategory: 'Accessories', emoji: '🔌' },
  { patterns: [/tv|television|smart tv|monitor|screen/i], businessType: 'electronics_store', suggestedCategory: 'TVs & Displays', emoji: '📺' },
  
  // Beauty & Personal Care
  { patterns: [/haircut|trim|fade|barb|shave|beard/i], businessType: 'barber_shop', suggestedCategory: 'Haircuts', emoji: '💈' },
  { patterns: [/hair|weave|wig|braid|extension|relaxer/i], businessType: 'hair_salon', suggestedCategory: 'Hair Services', emoji: '💇' },
  { patterns: [/nail|manicure|pedicure|polish|gel/i], businessType: 'nail_salon', suggestedCategory: 'Nail Services', emoji: '💅' },
  { patterns: [/cream|lotion|soap|perfume|cologne|deodorant/i], businessType: 'cosmetics_beauty_supply', suggestedCategory: 'Skincare', emoji: '🧴' },
  { patterns: [/makeup|lipstick|foundation|mascara|eyeshadow/i], businessType: 'makeup_artist', suggestedCategory: 'Makeup', emoji: '💄' },
  
  // Building & Construction
  { patterns: [/cement|block|sand|gravel|granite|concrete/i], businessType: 'building_materials', suggestedCategory: 'Building Materials', emoji: '🧱' },
  { patterns: [/paint|emulsion|gloss|primer|thinner/i], businessType: 'paint_shop', suggestedCategory: 'Paints', emoji: '🎨' },
  { patterns: [/tile|ceramic|porcelain|marble|floor/i], businessType: 'tiles_flooring', suggestedCategory: 'Tiles', emoji: '🔲' },
  { patterns: [/pipe|pvc|fitting|tap|faucet|valve/i], businessType: 'plumbing_supplies', suggestedCategory: 'Plumbing', emoji: '🔧' },
  
  // Health & Wellness
  { patterns: [/paracetamol|medicine|drug|tablet|syrup|pill|vitamin/i], businessType: 'pharmacy', suggestedCategory: 'Medications', emoji: '💊' },
  { patterns: [/herbal|natural|traditional|bitters/i], businessType: 'herbal_medicine', suggestedCategory: 'Herbal Products', emoji: '🌿' },
  
  // Agriculture
  { patterns: [/fertilizer|seed|pesticide|herbicide/i], businessType: 'agricultural_inputs', suggestedCategory: 'Farm Inputs', emoji: '🌱' },
  { patterns: [/chicken feed|layer|broiler|feed|mash/i], businessType: 'animal_feed', suggestedCategory: 'Poultry Feed', emoji: '🐔' },
];

// Generate smart SKU from product name
function generateSmartSKU(name: string, categoryName?: string): string {
  if (!name) return '';
  
  const words = name.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  let prefix = '';
  if (categoryName) {
    prefix = categoryName.substring(0, 2).toUpperCase() + '-';
  }
  
  const namePart = words.slice(0, 2).map(w => w.substring(0, 3)).join('');
  const randomNum = Math.floor(100 + Math.random() * 900);
  
  return `${prefix}${namePart}-${randomNum}`;
}

// Detect product type from name
function detectProductType(name: string): {
  businessType: string | null;
  suggestedCategory: string | null;
  emoji: string;
  confidence: 'high' | 'medium' | 'low';
} {
  if (!name || name.length < 3) {
    return { businessType: null, suggestedCategory: null, emoji: '📦', confidence: 'low' };
  }

  for (const pattern of PRODUCT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(name)) {
        return {
          businessType: pattern.businessType,
          suggestedCategory: pattern.suggestedCategory,
          emoji: pattern.emoji,
          confidence: 'high',
        };
      }
    }
  }

  // Try semantic search in business categories
  const searchResults = searchBusinessCategories(name);
  if (searchResults.length > 0) {
    return {
      businessType: searchResults[0].id,
      suggestedCategory: searchResults[0].defaultCategories[0]?.name || null,
      emoji: searchResults[0].emoji,
      confidence: 'medium',
    };
  }

  return { businessType: null, suggestedCategory: null, emoji: '📦', confidence: 'low' };
}

export function SmartProductForm({ 
  product, 
  categories, 
  currency, 
  onSuccess, 
  onCancel,
  initialMode = 'quick',
}: SmartProductFormProps) {
  const { store, tenant } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!product;
  
  // Form modes
  const [mode, setMode] = useState<'quick' | 'full'>(initialMode);
  const [showBusinessFields, setShowBusinessFields] = useState(true);
  
  // Smart detection state
  const [detectedType, setDetectedType] = useState<ReturnType<typeof detectProductType> | null>(null);
  const [smartSuggestionApplied, setSmartSuggestionApplied] = useState(false);

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
      custom_fields: (product as any).custom_fields || {},
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
      custom_fields: {},
    },
  });

  const productName = watch('name');
  const selectedCategoryId = watch('category_id');
  const trackInventory = watch('track_inventory');

  // Get selected category for business type
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // Get business-specific fields based on category's business_type
  const businessFields = useMemo<ProductFieldConfig[]>(() => {
    const businessType = selectedCategory?.business_type || tenant?.business_type;
    if (!businessType) return [];
    
    const businessCategory = getBusinessCategory(businessType);
    if (!businessCategory) return [];
    
    return businessCategory.productFields.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [selectedCategory?.business_type, tenant?.business_type]);

  const hasBusinessFields = businessFields.length > 0;

  // Get business category info for display
  const businessCategoryInfo = useMemo(() => {
    const businessType = selectedCategory?.business_type || tenant?.business_type;
    if (!businessType) return null;
    return getBusinessCategory(businessType);
  }, [selectedCategory?.business_type, tenant?.business_type]);

  // Smart detection when product name changes
  useEffect(() => {
    if (!isEditing && productName && productName.length >= 3) {
      const detection = detectProductType(productName);
      setDetectedType(detection);
    } else {
      setDetectedType(null);
    }
  }, [productName, isEditing]);

  // Auto-generate SKU when name changes (for new products)
  const handleNameBlur = useCallback(() => {
    if (!isEditing && productName && !watch('sku')) {
      const categoryName = selectedCategory?.name;
      setValue('sku', generateSmartSKU(productName, categoryName));
    }
  }, [isEditing, productName, selectedCategory, setValue, watch]);

  // Apply smart suggestion
  const applySmartSuggestion = useCallback(() => {
    if (!detectedType?.suggestedCategory) return;
    
    // Find matching category
    const matchingCategory = categories.find(c => 
      c.name.toLowerCase().includes(detectedType.suggestedCategory!.toLowerCase()) ||
      detectedType.suggestedCategory!.toLowerCase().includes(c.name.toLowerCase())
    );
    
    if (matchingCategory) {
      setValue('category_id', matchingCategory.id);
      setSmartSuggestionApplied(true);
      toast.success(`Category set to "${matchingCategory.name}"`, { 
        icon: '✨',
        duration: 2000,
      });
    } else {
      toast.info(`Suggested: Create a "${detectedType.suggestedCategory}" category`, {
        icon: '💡',
        duration: 3000,
      });
    }
  }, [detectedType, categories, setValue]);

  // Fetch similar products for price suggestion
  const { data: similarProducts } = useQuery({
    queryKey: ['similar-products', productName, selectedCategoryId],
    queryFn: async () => {
      if (!store?.id || !productName || productName.length < 3) return [];
      
      const { data } = await supabase
        .from('products')
        .select('name, price, cost_price')
        .eq('store_id', store.id)
        .ilike('name', `%${productName.split(' ')[0]}%`)
        .limit(5);
      
      return data || [];
    },
    enabled: !!store?.id && !!productName && productName.length >= 3 && !isEditing,
  });

  // Calculate suggested price from similar products
  const suggestedPrice = useMemo(() => {
    if (!similarProducts || similarProducts.length === 0) return null;
    const avgPrice = similarProducts.reduce((sum, p) => sum + (p.price || 0), 0) / similarProducts.length;
    return Math.round(avgPrice / 10) * 10; // Round to nearest 10
  }, [similarProducts]);

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!store?.id) throw new Error('No store selected');
      
      const productData = {
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
        custom_fields: data.custom_fields || {},
      };
      
      if (isEditing && product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        
        if (error) throw error;

        if (data.track_inventory) {
          await supabase
            .from('stock_levels')
            .upsert({
              product_id: product.id,
              store_id: store.id,
              quantity: data.quantity,
              reorder_level: data.low_stock_threshold,
            }, { onConflict: 'product_id,store_id' });
        }
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            store_id: store.id,
            ...productData,
            is_active: true,
          })
          .select()
          .single();
        
        if (error) throw error;

        if (data.track_inventory && newProduct) {
          await supabase.from('stock_levels').insert({
            product_id: newProduct.id,
            store_id: store.id,
            quantity: data.quantity,
            reorder_level: data.low_stock_threshold,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEditing ? 'Product updated!' : 'Product added!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error saving product', { description: error.message });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  // Render dynamic field
  const renderDynamicField = (field: ProductFieldConfig) => {
    const fieldName = `custom_fields.${field.name}`;
    const currentValue = watch(fieldName as any);

    const commonStyles = {
      borderColor: brandColorMid,
      backgroundColor: brandColorLight,
    };

    switch (field.type) {
      case 'select':
        return (
          <select
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all appearance-none"
            style={{
              ...commonStyles,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
              backgroundRepeat: 'no-repeat',
            }}
            {...register(fieldName as any)}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2 p-3 rounded-xl border" style={commonStyles}>
            {field.options?.map((option: string) => {
              const values = currentValue || [];
              const isSelected = values.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    const updated = isSelected
                      ? values.filter((v: string) => v !== option)
                      : [...values, option];
                    setValue(fieldName as any, updated);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    isSelected 
                      ? 'text-white border-transparent' 
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                  style={isSelected ? { backgroundColor: brandColor } : {}}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );

      case 'boolean':
        return (
          <button
            type="button"
            onClick={() => setValue(fieldName as any, !currentValue)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              currentValue ? '' : 'bg-zinc-300'
            }`}
            style={currentValue ? { backgroundColor: brandColor } : {}}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                currentValue ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );

      default:
        return (
          <input
            type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={commonStyles}
            {...register(fieldName as any)}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: brandColorLight }}>
        <div className="flex items-center gap-2">
          {mode === 'quick' ? (
            <Zap className="w-4 h-4" style={{ color: brandColor }} />
          ) : (
            <Settings2 className="w-4 h-4" style={{ color: brandColor }} />
          )}
          <span className="text-sm font-medium" style={{ color: brandText }}>
            {mode === 'quick' ? 'Quick Add' : 'Full Details'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMode(mode === 'quick' ? 'full' : 'quick')}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{ 
            backgroundColor: brandColor, 
            color: brandTextBtn,
          }}
        >
          Switch to {mode === 'quick' ? 'Full' : 'Quick'}
        </button>
      </div>

      {/* Product Name with Smart Detection */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
          <Package className="w-4 h-4" style={{ color: brandColor }} />
          Product Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g., Coca-Cola 500ml, iPhone 15 Pro, Jollof Rice..."
            className={cn(
              'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all',
              errors.name ? 'border-red-400' : ''
            )}
            style={{ 
              borderColor: errors.name ? undefined : brandColorMid,
              backgroundColor: brandColorLight,
            }}
            {...register('name', { required: 'Product name is required' })}
            onBlur={handleNameBlur}
          />
          {detectedType && detectedType.confidence !== 'low' && !smartSuggestionApplied && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <span className="text-lg">{detectedType.emoji}</span>
            </div>
          )}
        </div>
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}

        {/* Smart Suggestion Card */}
        {detectedType && detectedType.confidence !== 'low' && !smartSuggestionApplied && (
          <button
            type="button"
            onClick={applySmartSuggestion}
            className="mt-2 w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all hover:shadow-md"
            style={{ 
              borderColor: brandColor, 
              backgroundColor: `${brandColor}10`,
            }}
          >
            <Wand2 className="w-5 h-5" style={{ color: brandColor }} />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium" style={{ color: brandText }}>
                {detectedType.emoji} Looks like a {detectedType.suggestedCategory}
              </p>
              <p className="text-xs text-gray-500">
                Tap to auto-categorize
              </p>
            </div>
            <Sparkles className="w-4 h-4" style={{ color: brandColor }} />
          </button>
        )}
      </div>

      {/* SKU & Category Row */}
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
            <Tag className="w-4 h-4" style={{ color: brandColor }} />
            Category
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
            {...register('category_id')}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing Row with Smart Suggestion */}
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
              style={{ 
                borderColor: errors.price ? undefined : brandColorMid,
                backgroundColor: brandColorLight,
              }}
              {...register('price', { 
                required: 'Price is required',
                valueAsNumber: true,
                min: 0,
              })}
            />
          </div>
          {suggestedPrice && !watch('price') && (
            <button
              type="button"
              onClick={() => setValue('price', suggestedPrice)}
              className="mt-1 flex items-center gap-1 text-xs"
              style={{ color: brandColor }}
            >
              <Lightbulb className="w-3 h-3" />
              Suggested: {currencySymbol}{suggestedPrice.toLocaleString()}
            </button>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
            <TrendingUp className="w-4 h-4" style={{ color: brandColor }} />
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

      {/* Stock Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
            <Archive className="w-4 h-4" style={{ color: brandColor }} />
            Initial Stock
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
            className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
            style={{ backgroundColor: trackInventory ? brandColor : '#D1D5DB' }}
          />
        </label>
      </div>

      {/* Business-Specific Fields (Full Mode Only) */}
      {mode === 'full' && hasBusinessFields && (
        <div className="space-y-3">
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
              {businessCategoryInfo?.emoji} {businessCategoryInfo?.name || 'Custom'} Details
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/80">
                {businessFields.length} fields
              </span>
            </span>
            {showBusinessFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showBusinessFields && (
            <div className="p-4 rounded-xl border space-y-4" style={{ borderColor: brandColorMid, backgroundColor: 'white' }}>
              {businessFields.slice(0, 6).map((field) => (
                <div key={field.name}>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: brandText }}>
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.helpText && (
                    <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
                  )}
                  {renderDynamicField(field)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Additional Fields (Full Mode Only) */}
      {mode === 'full' && (
        <div className="space-y-4 pt-2 border-t" style={{ borderColor: brandColorMid }}>
          {/* Barcode */}
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
              <option value="box">Box</option>
              <option value="pack">Pack</option>
              <option value="dozen">Dozen</option>
              <option value="carton">Carton</option>
              <option value="plate">Plate</option>
              <option value="bowl">Bowl</option>
              <option value="cup">Cup</option>
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
            <>
              {mode === 'quick' ? <Zap className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              {isEditing ? 'Update' : 'Add Product'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default SmartProductForm;
