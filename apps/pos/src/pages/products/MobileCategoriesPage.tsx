/**
 * Mobile Categories Page
 * PWA-optimized categories management with light blue theme
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  Package,
  X,
  ChevronLeft,
  Check,
  Loader2,
  LayoutGrid,
  List,
  Palette,
  ToggleLeft,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

// Available colors for categories
const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e',
];

// Available icons for categories
const CATEGORY_ICONS = [
  '📦', '🍔', '🥤', '🍞', '🥛', '🧀', '🥩', '🍗', '🐟', '🥬',
  '🍎', '🍊', '🍋', '🫒', '🥚', '🍫', '🍪', '☕', '🧃', '🍺',
  '🧴', '🧹', '💊', '🎁', '👕', '👟', '📱', '💻', '🔧', '🏠',
  '🛒', '💰', '🎨', '📚', '🎮', '🏋️', '💄', '👜', '⌚', '🔌',
];

// ============================================
// CATEGORY CARD COMPONENT
// ============================================
interface CategoryCardProps {
  category: any;
  viewMode: 'grid' | 'list';
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
}

function CategoryCard({ category, viewMode, onEdit, onDelete }: CategoryCardProps) {
  const productCount = category._count?.[0]?.count || 0;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: category.color || theme.primaryLight }}
        >
          {category.icon || '📦'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate" style={{ color: theme.textPrimary }}>
              {category.name}
            </h3>
            <span 
              className={`w-2 h-2 rounded-full flex-shrink-0 ${category.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
            />
          </div>
          <p className="text-[10px] font-mono" style={{ color: theme.textMuted }}>
            {productCount} products
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { haptic.light(); onEdit(category); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-95"
            style={{ backgroundColor: theme.primaryLight }}
          >
            <Edit2 className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          </button>
          <button
            onClick={() => { haptic.medium(); onDelete(category); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl p-3 relative"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      {/* Status indicator */}
      <div 
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${category.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
      />

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2"
        style={{ backgroundColor: category.color || theme.primaryLight }}
      >
        {category.icon || '📦'}
      </div>

      {/* Name */}
      <h3 className="text-[11px] font-semibold text-center truncate mb-1" style={{ color: theme.textPrimary }}>
        {category.name}
      </h3>

      {/* Product count */}
      <p className="text-[10px] text-center font-mono mb-2" style={{ color: theme.textMuted }}>
        {productCount} items
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => { haptic.light(); onEdit(category); }}
          className="flex-1 py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 active:scale-95"
          style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={() => { haptic.medium(); onDelete(category); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 bg-red-50"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// MOBILE CATEGORY FORM COMPONENT
// ============================================
interface MobileCategoryFormProps {
  category?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

function MobileCategoryForm({ category, onSuccess, onCancel }: MobileCategoryFormProps) {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#3b82f6',
    icon: category?.icon || '📦',
    is_active: category?.is_active ?? true,
  });

  const [showColors, setShowColors] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error('Store not found');

      if (isEditing) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            icon: formData.icon,
            is_active: formData.is_active,
          } as never)
          .eq('id', category.id);
        if (error) throw error;
      } else {
        // Get next sort order
        const { data: existing } = await supabase
          .from('categories')
          .select('sort_order')
          .eq('store_id', store.id)
          .order('sort_order', { ascending: false })
          .limit(1);

        const sortOrder = existing && existing.length > 0 ? ((existing[0] as any).sort_order || 0) + 1 : 0;

        const { error } = await supabase
          .from('categories')
          .insert({
            store_id: store.id,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color: formData.color,
            icon: formData.icon,
            is_active: formData.is_active,
            sort_order: sortOrder,
          } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      haptic.success();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEditing ? 'Category updated' : 'Category created');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Failed to save category', { description: error.message });
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    saveMutation.mutate();
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
        <h1 className="text-sm font-bold text-white">
          {isEditing ? 'Edit Category' : 'New Category'}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 text-white active:bg-white/30 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span className="text-xs font-bold">Save</span>
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Preview Card */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
            Preview
          </p>
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mx-auto mb-2"
            style={{ backgroundColor: formData.color }}
          >
            {formData.icon}
          </div>
          <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
            {formData.name || 'Category Name'}
          </p>
        </div>

        {/* Category Name */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
            Category Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter category name"
            className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Optional description..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-xs resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
            }}
          />
        </div>

        {/* Icon Selector */}
        <div>
          <button
            type="button"
            onClick={() => { setShowIcons(!showIcons); setShowColors(false); }}
            className="w-full flex items-center justify-between p-4 rounded-xl"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{formData.icon}</span>
              <div>
                <p className="text-sm font-medium text-left" style={{ color: theme.textPrimary }}>Icon</p>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>Tap to change</p>
              </div>
            </div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Palette className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
          </button>

          <AnimatePresence>
            {showIcons && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="mt-2 p-3 rounded-xl grid grid-cols-10 gap-2"
                  style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  {CATEGORY_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => { haptic.light(); updateField('icon', icon); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg active:scale-95 ${
                        formData.icon === icon ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: formData.icon === icon ? theme.primaryLight : theme.surfaceLight }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Color Selector */}
        <div>
          <button
            type="button"
            onClick={() => { setShowColors(!showColors); setShowIcons(false); }}
            className="w-full flex items-center justify-between p-4 rounded-xl"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg"
                style={{ backgroundColor: formData.color }}
              />
              <div>
                <p className="text-sm font-medium text-left" style={{ color: theme.textPrimary }}>Color</p>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>Tap to change</p>
              </div>
            </div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Palette className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
          </button>

          <AnimatePresence>
            {showColors && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="mt-2 p-3 rounded-xl grid grid-cols-9 gap-2"
                  style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => { haptic.light(); updateField('color', color); }}
                      className={`w-8 h-8 rounded-lg active:scale-95 ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Toggle */}
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-3">
            <ToggleLeft className="w-5 h-5" style={{ color: theme.textMuted }} />
            <div>
              <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>Active</p>
              <p className="text-[10px]" style={{ color: theme.textMuted }}>Show in product list</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateField('is_active', !formData.is_active)}
            className={`w-12 h-7 rounded-full transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <motion.div
              animate={{ x: formData.is_active ? 22 : 2 }}
              className="w-5 h-5 rounded-full bg-white shadow"
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN MOBILE CATEGORIES PAGE
// ============================================
export function MobileCategoriesPage() {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch categories with product count
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', store?.id, searchQuery],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('categories')
        .select('*, _count:products(count)')
        .eq('store_id', store.id);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data } = await query.order('sort_order');
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (count && count > 0) {
        throw new Error(`Cannot delete - ${count} products use this category`);
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (error: any) => {
      toast.error('Delete failed', { description: error.message });
    },
  });

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: any) => {
    if (confirm(`Delete "${category.name}"?`)) {
      haptic.medium();
      deleteMutation.mutate(category.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  // Stats
  const totalCategories = categories?.length || 0;
  const activeCategories = categories?.filter((c: any) => c.is_active).length || 0;
  const totalProducts = categories?.reduce((sum: number, c: any) => sum + (c._count?.[0]?.count || 0), 0) || 0;

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
            <h1 className="text-lg font-bold text-white">Categories</h1>
            <p className="text-[10px] text-white/70 font-mono">
              {totalCategories} categories • {totalProducts} products
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/20 active:bg-white/30"
            >
              {viewMode === 'grid' ? (
                <List className="w-4 h-4 text-white" />
              ) : (
                <LayoutGrid className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={() => { haptic.light(); setIsFormOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-blue-600 font-bold text-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
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
        className="px-4 py-3 flex items-center gap-4"
        style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: theme.primaryLight }}
          >
            <Layers className="w-4 h-4" style={{ color: theme.primary }} />
          </div>
          <div>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>Total</p>
            <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>{totalCategories}</p>
          </div>
        </div>
        <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>Active</p>
            <p className="text-sm font-bold text-emerald-600">{activeCategories}</p>
          </div>
        </div>
        <div className="w-px h-8" style={{ backgroundColor: theme.border }} />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>Products</p>
            <p className="text-sm font-bold text-blue-600">{totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Categories Grid/List */}
      <div className="p-3">
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}>
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse p-3"
                style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
              >
                {viewMode === 'grid' ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl mx-auto mb-2" style={{ backgroundColor: theme.surfaceLight }} />
                    <div className="h-3 rounded mx-auto mb-1" style={{ backgroundColor: theme.surfaceLight, width: '70%' }} />
                    <div className="h-2 rounded mx-auto" style={{ backgroundColor: theme.surfaceLight, width: '50%' }} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: theme.surfaceLight }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 rounded" style={{ backgroundColor: theme.surfaceLight, width: '60%' }} />
                      <div className="h-2 rounded" style={{ backgroundColor: theme.surfaceLight, width: '40%' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}>
            {categories.map((category: any) => (
              <CategoryCard
                key={category.id}
                category={category}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textMuted }} />
            <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>
              {searchQuery ? 'No categories found' : 'No categories yet'}
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold active:scale-95"
              style={{ backgroundColor: theme.primary, color: '#ffffff' }}
            >
              Create First Category
            </button>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <motion.button
        onClick={() => { haptic.medium(); setIsFormOpen(true); }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 z-30"
        style={{ backgroundColor: theme.primary }}
        whileTap={{ scale: 0.9 }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Category Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <MobileCategoryForm
            category={editingCategory}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileCategoriesPage;
