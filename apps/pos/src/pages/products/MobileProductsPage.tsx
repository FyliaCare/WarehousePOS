/**
 * Mobile Products Page
 * PWA-optimized products management with light blue theme
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  X,
  Tag,
  ChevronLeft,
  Camera,
  DollarSign,
  Hash,
  Barcode,
  Archive,
  Check,
  Loader2,
  AlertTriangle,
  LayoutGrid,
  List,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@warehousepos/utils';
import type { Category, CountryCode } from '@warehousepos/types';

// ============================================
// THEME CONFIGURATION - Light Blue
// ============================================
const theme = {
  // Base colors
  background: '#f8fafc',      // Light gray background
  surface: '#ffffff',          // White cards
  surfaceLight: '#f1f5f9',    // Slightly darker surface
  surfaceElevated: '#e2e8f0', // Elevated elements
  
  // Primary blue palette
  primary: '#2563eb',          // Blue 600
  primaryLight: '#dbeafe',     // Blue 100
  primaryMid: '#93c5fd',       // Blue 300
  primaryDark: '#1d4ed8',      // Blue 700
  primaryGlow: '#3b82f620',    // Blue with transparency
  
  // Text colors
  textPrimary: '#0f172a',      // Slate 900
  textSecondary: '#475569',    // Slate 600
  textMuted: '#94a3b8',        // Slate 400
  
  // Status colors
  success: '#10b981',          // Emerald 500
  warning: '#f59e0b',          // Amber 500
  danger: '#ef4444',           // Red 500
  
  // Border
  border: '#e2e8f0',           // Slate 200
};

// Haptic feedback helper
const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  success: () => navigator.vibrate?.([10, 50, 10]),
};

// ============================================
// PRODUCT CARD COMPONENT
// ============================================
interface ProductCardProps {
  product: any;
  country: CountryCode;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  viewMode: 'grid' | 'list';
}

function ProductCard({ product, country, onEdit, onDelete, viewMode }: ProductCardProps) {
  const stockStatus = product.stock_quantity === 0 
    ? { label: 'Out', color: 'bg-red-100 text-red-700' }
    : product.stock_quantity < (product.low_stock_threshold || 10) 
    ? { label: 'Low', color: 'bg-amber-100 text-amber-700' }
    : { label: 'Good', color: 'bg-emerald-100 text-emerald-700' };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
      >
        {/* Image */}
        <div 
          className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: theme.surfaceLight }}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-5 h-5" style={{ color: theme.textMuted }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold truncate" style={{ color: theme.textPrimary }}>
            {product.name}
          </h3>
          <p className="text-[10px] font-mono" style={{ color: theme.textMuted }}>
            {product.sku || 'No SKU'} • {product.stock_quantity || 0} units
          </p>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono" style={{ color: theme.primary }}>
            {formatCurrency(product.price || 0, country)}
          </span>
          <button
            onClick={() => { haptic.light(); onEdit(product); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-95"
            style={{ backgroundColor: theme.primaryLight }}
          >
            <Edit2 className="w-3.5 h-3.5" style={{ color: theme.primary }} />
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
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      {/* Image */}
      <div 
        className="relative aspect-square"
        style={{ backgroundColor: theme.surfaceLight }}
      >
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8" style={{ color: theme.textMuted }} />
          </div>
        )}
        
        {/* Status Badge */}
        <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${stockStatus.color}`}>
          {stockStatus.label}
        </span>

        {/* Quick Actions */}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <button
            onClick={() => { haptic.light(); onEdit(product); }}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-white/90 active:scale-95"
          >
            <Edit2 className="w-3 h-3" style={{ color: theme.textSecondary }} />
          </button>
          <button
            onClick={() => { haptic.medium(); onDelete(product); }}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-white/90 active:scale-95"
          >
            <Trash2 className="w-3 h-3" style={{ color: theme.danger }} />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-2">
        {product.category?.name && (
          <p className="text-[9px] font-medium mb-0.5" style={{ color: theme.primary }}>
            {product.category.name}
          </p>
        )}
        <h3 className="text-[10px] font-semibold truncate mb-0.5" style={{ color: theme.textPrimary }}>
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono" style={{ color: theme.primary }}>
            {formatCurrency(product.price || 0, country)}
          </span>
          <span className="text-[9px] font-mono" style={{ color: theme.textMuted }}>
            {product.stock_quantity || 0} pcs
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MOBILE PRODUCT FORM COMPONENT
// ============================================
interface MobileProductFormProps {
  product?: any;
  categories: Category[];
  country: CountryCode;
  onSuccess: () => void;
  onCancel: () => void;
}

function MobileProductForm({ product, categories, country, onSuccess, onCancel }: MobileProductFormProps) {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();
  const currencySymbol = country === 'NG' ? '₦' : 'GH₵';
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category_id: product?.category_id || '',
    price: product?.price?.toString() || '',
    cost_price: product?.cost_price?.toString() || '',
    quantity: product?.stock_quantity?.toString() || '0',
    low_stock_threshold: product?.low_stock_threshold?.toString() || '10',
    description: product?.description || '',
    image_url: product?.image_url || '',
    track_inventory: product?.track_inventory ?? true,
    is_active: product?.is_active ?? true,
  });

  const [activeSection, setActiveSection] = useState<'basic' | 'pricing' | 'inventory'>('basic');

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error('Store not found');
      
      const productData = {
        store_id: store.id,
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.price) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        track_inventory: formData.track_inventory,
        is_active: formData.is_active,
      };

      if (product?.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData as never)
          .eq('id', product.id);
        if (error) throw error;

        // Update stock level if quantity changed
        if (formData.quantity !== product.stock_quantity?.toString()) {
          const { error: stockError } = await supabase
            .from('stock_levels')
            .upsert({
              store_id: store.id,
              product_id: product.id,
              quantity: parseInt(formData.quantity) || 0,
            } as never);
          if (stockError) throw stockError;
        }
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData as never)
          .select()
          .single();
        if (error) throw error;

        // Create initial stock level
        if (newProduct) {
          const { error: stockError } = await supabase
            .from('stock_levels')
            .insert({
              store_id: store.id,
              product_id: newProduct.id,
              quantity: parseInt(formData.quantity) || 0,
            } as never);
          if (stockError) throw stockError;
        }
      }
    },
    onSuccess: () => {
      haptic.success();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(product ? 'Product updated' : 'Product created');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error('Failed to save product', { description: error.message });
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
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
          {product ? 'Edit Product' : 'New Product'}
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

      {/* Section Tabs */}
      <div 
        className="flex gap-1 px-3 py-2"
        style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}
      >
        {[
          { id: 'basic', label: 'Basic', icon: Package },
          { id: 'pricing', label: 'Pricing', icon: DollarSign },
          { id: 'inventory', label: 'Stock', icon: Archive },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{
              backgroundColor: activeSection === section.id ? theme.primary : 'transparent',
              color: activeSection === section.id ? '#ffffff' : theme.textSecondary,
            }}
          >
            <section.icon className="w-3.5 h-3.5" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* Basic Info Section */}
          {activeSection === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Product Image */}
              <div 
                className="aspect-video rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer active:opacity-70"
                style={{ backgroundColor: theme.surfaceLight, border: `2px dashed ${theme.border}` }}
              >
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Product" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <Camera className="w-8 h-8" style={{ color: theme.textMuted }} />
                    <span className="text-xs" style={{ color: theme.textMuted }}>Tap to add photo</span>
                  </>
                )}
              </div>

              {/* Image URL Input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                  Image URL
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textMuted }} />
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => updateField('image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: theme.surface, 
                      border: `1px solid ${theme.border}`,
                      color: theme.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter product name"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: theme.surface, 
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textMuted }} />
                  <select
                    value={formData.category_id}
                    onChange={(e) => updateField('category_id', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: theme.surface, 
                      border: `1px solid ${theme.border}`,
                      color: theme.textPrimary,
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                    SKU
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textMuted }} />
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => updateField('sku', e.target.value.toUpperCase())}
                      placeholder="SKU001"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: theme.surface, 
                        border: `1px solid ${theme.border}`,
                        color: theme.textPrimary,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                    Barcode
                  </label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textMuted }} />
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => updateField('barcode', e.target.value)}
                      placeholder="123456789"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: theme.surface, 
                        border: `1px solid ${theme.border}`,
                        color: theme.textPrimary,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Optional product description..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-xs resize-none focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: theme.surface, 
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Pricing Section */}
          {activeSection === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Selling Price */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                  Selling Price *
                </label>
                <div 
                  className="rounded-xl p-4"
                  style={{ backgroundColor: theme.primaryLight, border: `2px solid ${theme.primary}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: theme.primary }}>{currencySymbol}</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      placeholder="0.00"
                      className="flex-1 text-2xl font-bold font-mono bg-transparent focus:outline-none"
                      style={{ color: theme.primary }}
                    />
                  </div>
                </div>
              </div>

              {/* Cost Price */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                  Cost Price
                </label>
                <div 
                  className="rounded-xl p-4"
                  style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium" style={{ color: theme.textMuted }}>{currencySymbol}</span>
                    <input
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => updateField('cost_price', e.target.value)}
                      placeholder="0.00"
                      className="flex-1 text-xl font-bold font-mono bg-transparent focus:outline-none"
                      style={{ color: theme.textPrimary }}
                    />
                  </div>
                </div>
              </div>

              {/* Profit Margin Display */}
              {formData.price && formData.cost_price && parseFloat(formData.price) > 0 && (
                <div 
                  className="rounded-xl p-4"
                  style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
                      Profit Margin
                    </span>
                    <span 
                      className="text-sm font-bold"
                      style={{ color: parseFloat(formData.price) > parseFloat(formData.cost_price) ? theme.success : theme.danger }}
                    >
                      {formatCurrency(parseFloat(formData.price) - parseFloat(formData.cost_price), country)}
                      {' '}
                      ({Math.round(((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price)) * 100)}%)
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Inventory Section */}
          {activeSection === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Track Inventory Toggle */}
              <div 
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>Track Inventory</p>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Monitor stock levels</p>
                </div>
                <button
                  onClick={() => updateField('track_inventory', !formData.track_inventory)}
                  className={`w-12 h-7 rounded-full transition-all ${formData.track_inventory ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <motion.div
                    animate={{ x: formData.track_inventory ? 22 : 2 }}
                    className="w-5 h-5 rounded-full bg-white shadow"
                  />
                </button>
              </div>

              {/* Current Stock */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                  Current Stock
                </label>
                <div 
                  className="rounded-xl p-4"
                  style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => updateField('quantity', e.target.value)}
                    placeholder="0"
                    className="w-full text-3xl font-bold font-mono text-center bg-transparent focus:outline-none"
                    style={{ color: theme.textPrimary }}
                  />
                  <p className="text-center text-[10px] mt-1" style={{ color: theme.textMuted }}>units in stock</p>
                </div>
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: theme.textMuted }}>
                  Low Stock Alert
                </label>
                <div 
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
                >
                  <AlertTriangle className="w-5 h-5" style={{ color: theme.warning }} />
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: theme.textSecondary }}>Alert when below</p>
                  </div>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => updateField('low_stock_threshold', e.target.value)}
                    className="w-16 text-lg font-bold font-mono text-center rounded-lg py-1"
                    style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
                  />
                  <span className="text-xs" style={{ color: theme.textMuted }}>units</span>
                </div>
              </div>

              {/* Active Status */}
              <div 
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>Active</p>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Show in POS</p>
                </div>
                <button
                  onClick={() => updateField('is_active', !formData.is_active)}
                  className={`w-12 h-7 rounded-full transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <motion.div
                    animate={{ x: formData.is_active ? 22 : 2 }}
                    className="w-5 h-5 rounded-full bg-white shadow"
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN MOBILE PRODUCTS PAGE
// ============================================
export function MobileProductsPage() {
  const { tenant, store } = useAuthStore();
  const queryClient = useQueryClient();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', store?.id, searchQuery, selectedCategory],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('products')
        .select('*, category:categories(name, icon), stock_levels(quantity)')
        .eq('store_id', store.id);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data } = await query.order('created_at', { ascending: false });
      
      let result = (data || []).map((product: any) => ({
        ...product,
        stock_quantity: product.stock_levels?.[0]?.quantity || 0,
      }));

      if (searchQuery) {
        result = result.filter(
          (item: any) =>
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return result;
    },
    enabled: !!store?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false } as never)
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
  });

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (product: any) => {
    if (confirm(`Delete "${product.name}"?`)) {
      haptic.medium();
      deleteMutation.mutate(product.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  // Stats
  const totalProducts = products?.length || 0;
  const lowStockCount = products?.filter((p: any) => p.stock_quantity < (p.low_stock_threshold || 10)).length || 0;

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
            <h1 className="text-lg font-bold text-white">Products</h1>
            <p className="text-[10px] text-white/70 font-mono">
              {totalProducts} items • {lowStockCount} low stock
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
            placeholder="Search products..."
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

      {/* Categories Horizontal Scroll */}
      <div 
        className="px-3 py-2 overflow-x-auto scrollbar-hide flex gap-2"
        style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}
      >
        <button
          onClick={() => { haptic.light(); setSelectedCategory(null); }}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all active:scale-95"
          style={{
            backgroundColor: !selectedCategory ? theme.primary : theme.surfaceLight,
            color: !selectedCategory ? '#ffffff' : theme.textSecondary,
          }}
        >
          ALL
        </button>
        {categories?.map((cat: Category) => (
          <button
            key={cat.id}
            onClick={() => { haptic.light(); setSelectedCategory(cat.id); }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 active:scale-95"
            style={{
              backgroundColor: selectedCategory === cat.id ? theme.primary : theme.surfaceLight,
              color: selectedCategory === cat.id ? '#ffffff' : theme.textSecondary,
            }}
          >
            {cat.icon && <span className="text-xs">{cat.icon}</span>}
            {cat.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Products Grid/List */}
      <div className="p-3">
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}>
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square" style={{ backgroundColor: theme.surfaceLight }} />
                    <div className="p-2 space-y-1">
                      <div className="h-3 rounded" style={{ backgroundColor: theme.surfaceLight, width: '70%' }} />
                      <div className="h-3 rounded" style={{ backgroundColor: theme.surfaceLight, width: '50%' }} />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: theme.surfaceLight }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 rounded" style={{ backgroundColor: theme.surfaceLight, width: '60%' }} />
                      <div className="h-2 rounded" style={{ backgroundColor: theme.surfaceLight, width: '40%' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}>
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                country={country}
                onEdit={handleEdit}
                onDelete={handleDelete}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textMuted }} />
            <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>
              {searchQuery ? 'No products found' : 'No products yet'}
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold active:scale-95"
              style={{ backgroundColor: theme.primary, color: '#ffffff' }}
            >
              Add First Product
            </button>
          </div>
        )}
      </div>

      {/* Floating Add Button (always visible) */}
      <motion.button
        onClick={() => { haptic.medium(); setIsFormOpen(true); }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 z-30"
        style={{ backgroundColor: theme.primary }}
        whileTap={{ scale: 0.9 }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Product Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <MobileProductForm
            product={editingProduct}
            categories={categories || []}
            country={country}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileProductsPage;
