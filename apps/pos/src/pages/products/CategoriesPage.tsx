import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Layers, 
  Package,
  Grid3X3,
  List,
  X,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Category, CountryCode } from '@warehousepos/types';
import { CategoryForm } from '@/components/products/CategoryForm';

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

export function CategoriesPage() {
  const { tenant, store } = useAuthStore();
  const queryClient = useQueryClient();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
        throw new Error('Cannot delete category with products. Move products first.');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete category', { description: error.message });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
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
    <div className="min-h-screen bg-zinc-50">
      {/* Premium Header */}
      <div 
        className="px-6 py-5"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: theme.textOnPrimary }}>
              Categories
            </h1>
            <p className="text-sm mt-0.5 opacity-80" style={{ color: theme.textOnPrimary }}>
              Organize your products into categories
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90"
            style={{ 
              backgroundColor: theme.accent,
              color: country === 'GH' ? '#FFD000' : '#FFFFFF'
            }}
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-6 py-3 border-b bg-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
              <Layers className="w-4 h-4" style={{ color: theme.accent }} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total</p>
              <p className="text-sm font-semibold text-zinc-900">{totalCategories}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Active</p>
              <p className="text-sm font-semibold text-zinc-900">{activeCategories}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-zinc-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Products</p>
              <p className="text-sm font-semibold text-zinc-900">{totalProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & View Controls */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': theme.primaryMid } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-zinc-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'text-white' : 'text-zinc-500 hover:bg-zinc-100'
              }`}
              style={viewMode === 'grid' ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'text-white' : 'text-zinc-500 hover:bg-zinc-100'
              }`}
              style={viewMode === 'list' ? { backgroundColor: theme.primary, color: theme.textOnPrimary } : {}}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Content */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-2'}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-200 p-4 animate-pulse">
                <div className="w-12 h-12 bg-zinc-200 rounded-lg mb-3" />
                <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map((category: any) => (
                <div
                  key={category.id}
                  className="group bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-lg hover:border-zinc-300 transition-all relative"
                >
                  {/* Status indicator */}
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${category.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                  
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3"
                    style={{ backgroundColor: category.color || theme.primaryLight }}
                  >
                    {category.icon || '📦'}
                  </div>
                  
                  {/* Name */}
                  <h3 className="font-semibold text-sm text-zinc-900 mb-1 truncate">
                    {category.name}
                  </h3>
                  
                  {/* Product count */}
                  <p className="text-xs text-zinc-500 mb-3">
                    {category._count?.[0]?.count || 0} products
                  </p>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-1.5 rounded-lg border border-zinc-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              {categories.map((category: any, index: number) => (
                <div
                  key={category.id}
                  className={`flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors ${
                    index !== categories.length - 1 ? 'border-b border-zinc-100' : ''
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: category.color || theme.primaryLight }}
                  >
                    {category.icon || '📦'}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-zinc-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-xs text-zinc-500 truncate">{category.description}</p>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-zinc-900">{category._count?.[0]?.count || 0}</p>
                      <p className="text-[10px] text-zinc-500">Products</p>
                    </div>
                    
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.is_active 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-zinc-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Layers className="w-8 h-8" style={{ color: theme.accent }} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No categories yet</h3>
            <p className="text-sm text-zinc-500 mb-4">Create categories to organize your products</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{ 
                backgroundColor: theme.primary, 
                color: theme.textOnPrimary 
              }}
            >
              <Plus className="w-4 h-4" />
              Add Your First Category
            </button>
          </div>
        )}
      </div>

      {/* Category Form Slide Panel */}
      {isFormOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={handleFormClose}
          />
          
          {/* Slide Panel */}
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden"
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
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {editingCategory ? 'Update category details' : 'Create a new product category'}
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
              <CategoryForm
                category={editingCategory}
                onSuccess={handleFormClose}
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
    </div>
  );
}
