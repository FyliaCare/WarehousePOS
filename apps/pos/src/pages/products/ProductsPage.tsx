import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Upload,
  Download,
  Grid3X3,
  List,
  Eye,
  Copy,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Tag,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product, Category, CountryCode, Currency } from '@warehousepos/types';
import SmartProductForm from '@/components/products/SmartProductForm';
import QuickAddFAB from '@/components/products/QuickAddFAB';

export function ProductsPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const currency: Currency = country === 'NG' ? 'NGN' : 'GHS';
  const currencySymbol = country === 'NG' ? '₦' : 'GH₵';
  const queryClient = useQueryClient();

  // Country-based theming
  const isNigeria = tenant?.country === 'NG';
  const theme = isNigeria ? {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#B8E0CC',
    primaryDark: '#006B41',
    accent: '#00A86B',
    text: '#FFFFFF',
    textOnLight: '#004D31',
  } : {
    primary: '#FFD000',
    primaryLight: '#FFF9E0',
    primaryMid: '#FFEC80',
    primaryDark: '#C9A400',
    accent: '#B8960B',
    text: '#1A1400',
    textOnLight: '#6B5A00',
  };

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  // Fetch products with stock levels joined
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', store?.id, searchQuery, selectedCategory, selectedStatus],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('products')
        .select('*, category:categories(name), stock_levels(quantity)')
        .eq('store_id', store.id);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedStatus === 'active') {
        query = query.eq('is_active', true);
      } else if (selectedStatus === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data } = await query.order('created_at', { ascending: false });
      
      // Map stock_levels to stock_quantity for easier access
      return (data || []).map((product: any) => ({
        ...product,
        stock_quantity: product.stock_levels?.[0]?.quantity || 0,
      }));
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
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete product', { description: error.message });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const formatPrice = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`;

  // Stats
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p: any) => p.is_active).length || 0;
  const lowStockProducts = products?.filter((p: any) => (p.stock_quantity || 0) < (p.low_stock_threshold || 10)).length || 0;
  const totalValue = products?.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0) || 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.primaryLight }}>
      {/* Premium Header */}
      <div style={{ backgroundColor: theme.primary }}>
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold" style={{ color: theme.text }}>Products</h1>
              <p className="text-sm opacity-80" style={{ color: theme.text }}>Manage your inventory catalog</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: theme.text }}
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: theme.text }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg"
                style={{ 
                  backgroundColor: isNigeria ? '#FFFFFF' : '#1A1400',
                  color: isNigeria ? theme.primary : '#FFD000'
                }}
              >
                <Sparkles className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Stats Strip */}
          <div 
            className="rounded-xl p-1 shadow-xl -mb-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.97)' }}
          >
            <div className="grid grid-cols-4 divide-x" style={{ borderColor: theme.primaryMid }}>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Package className="w-4 h-4" style={{ color: theme.accent }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: theme.accent }}>
                    Total Products
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: theme.textOnLight }}>{totalProducts}</p>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: theme.accent }}>
                    Active
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: theme.textOnLight }}>{activeProducts}</p>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: theme.accent }}>
                    Low Stock
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: theme.textOnLight }}>{lowStockProducts}</p>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" style={{ color: theme.accent }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: theme.accent }}>
                    Inventory Value
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: theme.textOnLight }}>{formatPrice(totalValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-5 pt-14 pb-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border p-4 mb-4" style={{ borderColor: theme.primaryMid }}>
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.accent }} />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: theme.primaryMid, 
                  backgroundColor: theme.primaryLight,
                }}
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 min-w-[160px]"
                style={{ borderColor: theme.primaryMid, color: theme.textOnLight }}
              >
                <option value="">All Categories</option>
                {categories?.map((c: Category) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: theme.accent }} />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 min-w-[140px]"
                style={{ borderColor: theme.primaryMid, color: theme.textOnLight }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: theme.accent }} />
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: theme.primaryMid }}>
              <button
                onClick={() => setViewMode('grid')}
                className="p-2.5 transition-colors"
                style={{ 
                  backgroundColor: viewMode === 'grid' ? theme.primary : 'transparent',
                  color: viewMode === 'grid' ? theme.text : theme.textOnLight
                }}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2.5 transition-colors"
                style={{ 
                  backgroundColor: viewMode === 'list' ? theme.primary : 'transparent',
                  color: viewMode === 'list' ? theme.text : theme.textOnLight
                }}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {isLoading ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
            : 'space-y-2'
          }>
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className="bg-white rounded-xl border p-4 animate-pulse"
                style={{ borderColor: theme.primaryMid }}
              >
                <div className="aspect-square rounded-lg mb-3" style={{ backgroundColor: theme.primaryMid }} />
                <div className="h-4 rounded mb-2" style={{ backgroundColor: theme.primaryMid, width: '70%' }} />
                <div className="h-3 rounded" style={{ backgroundColor: theme.primaryMid, width: '50%' }} />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((product: any) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-all"
                  style={{ borderColor: theme.primaryMid }}
                >
                  {/* Image */}
                  <div className="relative aspect-square" style={{ backgroundColor: theme.primaryLight }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12" style={{ color: theme.primaryMid }} />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div 
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        backgroundColor: product.is_active ? '#ECFDF5' : '#FEF2F2',
                        color: product.is_active ? '#059669' : '#DC2626'
                      }}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </div>

                    {/* Stock Warning */}
                    {(product.stock_quantity || 0) < (product.low_stock_threshold || 10) && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                        Low Stock
                      </div>
                    )}

                    {/* Quick Actions - Show on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-full bg-white text-zinc-700 hover:scale-110 transition-transform"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-full bg-white text-zinc-700 hover:scale-110 transition-transform">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product)}
                        className="p-2 rounded-full bg-white text-red-600 hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3">
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: theme.accent }}>
                      {product.category?.name || 'Uncategorized'}
                    </p>
                    <h3 className="font-semibold text-sm text-zinc-900 truncate mb-1">{product.name}</h3>
                    <p className="text-[11px] text-zinc-500 mb-2 font-mono">
                      {product.sku || 'No SKU'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold" style={{ color: theme.textOnLight }}>
                        {formatPrice(product.price || 0)}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primaryLight, color: theme.textOnLight }}>
                        {product.stock_quantity || 0} in stock
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: theme.primaryMid }}>
              {/* Table Header */}
              <div 
                className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b"
                style={{ backgroundColor: theme.primaryLight, color: theme.textOnLight, borderColor: theme.primaryMid }}
              >
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1 text-center">Stock</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y" style={{ borderColor: theme.primaryMid }}>
                {products.map((product: any) => (
                  <div 
                    key={product.id} 
                    className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-zinc-50 transition-colors"
                  >
                    {/* Product */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: theme.primaryLight }}
                      >
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5" style={{ color: theme.primaryMid }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-zinc-900 truncate">{product.name}</p>
                        <p className="text-xs text-zinc-500">{product.sku || 'No SKU'}</p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                        style={{ backgroundColor: theme.primaryLight, color: theme.textOnLight }}
                      >
                        <Tag className="w-3 h-3" />
                        {product.category?.name || 'None'}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 text-right">
                      <p className="font-semibold text-sm" style={{ color: theme.textOnLight }}>
                        {formatPrice(product.price || 0)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Cost: {formatPrice(product.cost_price || 0)}
                      </p>
                    </div>

                    {/* Stock */}
                    <div className="col-span-1 text-center">
                      <span 
                        className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                          (product.stock_quantity || 0) < (product.low_stock_threshold || 10) 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {product.stock_quantity || 0}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 text-center">
                      {product.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                        style={{ color: theme.textOnLight }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: theme.primaryMid }}>
            <div 
              className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: theme.primary }}
            >
              <Package className="w-10 h-10" style={{ color: theme.text }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No products found</h3>
            <p className="text-sm text-zinc-500 mb-4">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your filters' 
                : 'Add your first product to start selling'}
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ backgroundColor: theme.primary, color: theme.text }}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* Product Form Slide Panel */}
      {isFormOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={handleFormClose}
          />
          
          {/* Slide Panel */}
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden"
            style={{ 
              animation: 'slideInFromRight 0.3s ease-out',
            }}
          >
            {/* Panel Header */}
            <div 
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {editingProduct ? 'Update product details below' : 'Fill in the product details below'}
                </p>
              </div>
              <button
                onClick={handleFormClose}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            
            {/* Panel Content */}
            <div className="overflow-y-auto h-[calc(100%-80px)] p-6">
              <SmartProductForm
                product={editingProduct}
                categories={categories || []}
                currency={currency}
                onSuccess={handleFormClose}
                onCancel={handleFormClose}
                initialMode={editingProduct ? 'full' : 'quick'}
              />
            </div>
          </div>
          
          {/* Keyframe Animation */}
          <style>{`
            @keyframes slideInFromRight {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
          `}</style>
        </>
      )}

      {/* Mobile Quick Add FAB */}
      <QuickAddFAB
        categories={categories || []}
        currency={currency}
        onProductAdded={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
        brandColor={theme.primary}
        brandTextColor={theme.text}
      />
    </div>
  );
}
