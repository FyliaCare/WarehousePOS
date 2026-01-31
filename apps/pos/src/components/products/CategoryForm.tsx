import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Layers, Palette, Smile, ToggleLeft, Eye, Sparkles, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Category, CountryCode } from '@warehousepos/types';
import { 
  getBusinessCategory, 
  ALL_BUSINESS_CATEGORIES,
  type DefaultCategory,
  type IndustrySector 
} from '../../../../../packages/shared/src/data/business-categories';

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  businessType: string;
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

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e',
];

const CATEGORY_ICONS = [
  '📦', '🍔', '🥤', '🍞', '🥛', '🧀', '🥩', '🍗', '🐟', '🥬',
  '🍎', '🍊', '🍋', '🫒', '🥚', '🍫', '🍪', '☕', '🧃', '🍺',
  '🧴', '🧹', '💊', '🎁', '👕', '👟', '📱', '💻', '🔧', '🏠',
];

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const { tenant, store } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!category;
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];
  const [showSuggestions, setShowSuggestions] = useState(!isEditing);
  const [showBusinessTypes, setShowBusinessTypes] = useState(false);

  // Get suggested categories based on selected business type (or tenant's default)
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>(
    (category as any)?.business_type || tenant?.business_type || ''
  );
  
  const suggestedCategories = useMemo<DefaultCategory[]>(() => {
    if (!selectedBusinessType) return [];
    const businessCategory = getBusinessCategory(selectedBusinessType);
    return businessCategory?.defaultCategories ?? [];
  }, [selectedBusinessType]);

  // Get selected business category info for display
  const selectedBusinessInfo = useMemo(() => {
    if (!selectedBusinessType) return null;
    return getBusinessCategory(selectedBusinessType);
  }, [selectedBusinessType]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    defaultValues: category
      ? {
          name: category.name,
          description: category.description || '',
          color: category.color || '#6366f1',
          icon: category.icon || '📦',
          isActive: category.is_active,
          businessType: (category as any).business_type || tenant?.business_type || '',
        }
      : {
          name: '',
          description: '',
          color: '#6366f1',
          icon: '📦',
          isActive: true,
          businessType: tenant?.business_type || '',
        },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const isActive = watch('isActive');
  const watchedName = watch('name');

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: data.name,
            description: data.description || null,
            color: data.color,
            icon: data.icon,
            is_active: data.isActive,
            business_type: data.businessType || null,
          } as never)
          .eq('id', category.id);
        if (error) throw error;
      } else {
        const { data: existing } = await supabase
          .from('categories')
          .select('sort_order')
          .eq('store_id', store!.id)
          .order('sort_order', { ascending: false })
          .limit(1);

        const sortOrder = existing && existing.length > 0 ? ((existing[0] as any).sort_order || 0) + 1 : 0;

        const { error } = await supabase.from('categories').insert({
          store_id: store?.id,
          name: data.name,
          description: data.description || null,
          color: data.color,
          icon: data.icon,
          is_active: data.isActive,
          sort_order: sortOrder,
          business_type: data.businessType || null,
        } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEditing ? 'Category updated!' : 'Category created!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error saving category', { description: error.message });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Business Type Selector - For Multi-Industry Support */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <button
          type="button"
          onClick={() => setShowBusinessTypes(!showBusinessTypes)}
          className="w-full flex items-center justify-between"
        >
          <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: theme.textOnLight }}>
            <Building2 className="w-4 h-4" style={{ color: theme.accent }} />
            Business Type
            <span className="text-xs font-normal text-zinc-500">(for custom product fields)</span>
          </label>
          {showBusinessTypes ? (
            <ChevronUp className="w-4 h-4" style={{ color: theme.accent }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: theme.accent }} />
          )}
        </button>
        
        {/* Current Selection */}
        <div className="mt-3 flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: theme.primaryLight }}>
          {selectedBusinessInfo ? (
            <>
              <span className="text-2xl">{selectedBusinessInfo.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-zinc-900 truncate">{selectedBusinessInfo.name}</p>
                <p className="text-xs text-zinc-500">{selectedBusinessInfo.productFields.length} custom product fields</p>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl">📦</span>
              <div className="flex-1">
                <p className="font-medium text-sm text-zinc-900">Default (No custom fields)</p>
                <p className="text-xs text-zinc-500">Select a type for specialized product fields</p>
              </div>
            </>
          )}
        </div>

        {/* Business Types Dropdown */}
        {showBusinessTypes && (
          <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border" style={{ borderColor: theme.primaryMid }}>
            {/* Default option */}
            <button
              type="button"
              onClick={() => {
                setSelectedBusinessType('');
                setValue('businessType', '');
                setShowBusinessTypes(false);
              }}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-50 transition-colors border-b"
              style={{ borderColor: theme.primaryMid }}
            >
              <span className="text-xl">📦</span>
              <div>
                <p className="font-medium text-sm text-zinc-900">Default</p>
                <p className="text-xs text-zinc-500">No specialized product fields</p>
              </div>
            </button>

            {/* Business Categories by Sector */}
            {Object.entries(
              ALL_BUSINESS_CATEGORIES.reduce((acc, cat) => {
                const sector = cat.sector;
                if (!acc[sector]) acc[sector] = [];
                acc[sector].push(cat);
                return acc;
              }, {} as Record<IndustrySector, typeof ALL_BUSINESS_CATEGORIES>)
            ).map(([sector, cats]) => (
              <div key={sector}>
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-500 sticky top-0">
                  {sector.replace(/_/g, ' ')}
                </div>
                {cats.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedBusinessType(cat.id);
                      setValue('businessType', cat.id);
                      setShowBusinessTypes(false);
                      // Also update suggested categories display
                    }}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      selectedBusinessType === cat.id 
                        ? '' 
                        : 'hover:bg-zinc-50'
                    }`}
                    style={selectedBusinessType === cat.id ? { backgroundColor: theme.primaryLight } : {}}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-zinc-900 truncate">{cat.name}</p>
                      <p className="text-xs text-zinc-500">{cat.productFields.length} fields</p>
                    </div>
                    {selectedBusinessType === cat.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}>
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        
        <input type="hidden" {...register('businessType')} />
      </div>

      {/* Suggested Categories (only when creating new) */}
      {!isEditing && suggestedCategories.length > 0 && (
        <div className="p-4 rounded-xl border-2 border-dashed" style={{ borderColor: theme.primaryMid, backgroundColor: theme.primaryLight }}>
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
              <span className="text-sm font-semibold" style={{ color: theme.textOnLight }}>
                Suggested Categories for Your Business
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/80" style={{ color: theme.accent }}>
                {suggestedCategories.length}
              </span>
            </div>
            {showSuggestions ? (
              <ChevronUp className="w-4 h-4" style={{ color: theme.accent }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: theme.accent }} />
            )}
          </button>
          
          {showSuggestions && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {suggestedCategories.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setValue('name', suggestion.name);
                    setValue('icon', suggestion.icon);
                    if (suggestion.description) {
                      setValue('description', suggestion.description);
                    }
                    setShowSuggestions(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-transparent hover:border-current transition-all text-left group"
                  style={{ '--tw-border-color': theme.primary } as React.CSSProperties}
                >
                  <span className="text-xl shrink-0">{suggestion.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">
                    {suggestion.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Name */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <Layers className="w-4 h-4" style={{ color: theme.accent }} />
          Category Name
        </label>
        <input
          type="text"
          placeholder="e.g., Beverages"
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all"
          style={{ borderColor: theme.primaryMid }}
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && <p className="text-xs text-red-500 mt-2">{errors.name.message}</p>}
        
        <label className="block text-xs text-zinc-500 mt-4 mb-1">Description (optional)</label>
        <textarea
          placeholder="Brief description of this category..."
          rows={2}
          className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all resize-none"
          style={{ borderColor: theme.primaryMid }}
          {...register('description')}
        />
      </div>

      {/* Icon Selection */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <Smile className="w-4 h-4" style={{ color: theme.accent }} />
          Icon
        </label>
        <div className="grid grid-cols-10 gap-2 p-3 rounded-lg max-h-32 overflow-y-auto" style={{ backgroundColor: theme.primaryLight }}>
          {CATEGORY_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue('icon', icon)}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                selectedIcon === icon
                  ? 'ring-2 ring-offset-1'
                  : 'bg-white hover:scale-110'
              }`}
              style={selectedIcon === icon ? { 
                backgroundColor: theme.primary, 
                '--tw-ring-color': theme.accent 
              } as React.CSSProperties : {}}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <Palette className="w-4 h-4" style={{ color: theme.accent }} />
          Color
        </label>
        <div className="flex flex-wrap gap-2 p-3 rounded-lg" style={{ backgroundColor: theme.primaryLight }}>
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                selectedColor === color ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{ 
                backgroundColor: color,
                '--tw-ring-color': theme.accent,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <Eye className="w-4 h-4" style={{ color: theme.accent }} />
          Preview
        </label>
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: theme.primaryLight }}>
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: selectedColor }}
          >
            {selectedIcon}
          </div>
          <div>
            <p className="font-semibold text-zinc-900">
              {watchedName || 'Category Name'}
            </p>
            <p className="text-sm text-zinc-500">0 products</p>
          </div>
        </div>
      </div>

      {/* Active Toggle */}
      <div className="p-4 rounded-xl border" style={{ borderColor: theme.primaryMid, backgroundColor: 'white' }}>
        <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: theme.textOnLight }}>
          <ToggleLeft className="w-4 h-4" style={{ color: theme.accent }} />
          Status
        </label>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900">Active Category</p>
            <p className="text-xs text-zinc-500">Category will be visible in the POS</p>
          </div>
          <button
            type="button"
            onClick={() => setValue('isActive', !isActive)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              isActive ? '' : 'bg-zinc-300'
            }`}
            style={isActive ? { backgroundColor: theme.primary } : {}}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
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
          style={{ 
            backgroundColor: theme.primary, 
            color: theme.textOnPrimary 
          }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Update Category'
          ) : (
            'Add Category'
          )}
        </button>
      </div>
    </form>
  );
}
