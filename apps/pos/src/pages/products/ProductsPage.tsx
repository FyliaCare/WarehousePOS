import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Upload,
  Download,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Select,
  EmptyState,
  Skeleton,
} from '@warehousepos/ui';
import { formatCurrency, cn } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product, Category, CountryCode, Currency } from '@warehousepos/types';
import { ProductForm } from '@/components/products/ProductForm';

export function ProductsPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const currency: Currency = country === 'NG' ? 'NGN' : 'GHS';
  const queryClient = useQueryClient();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', store?.id, searchQuery, selectedCategory],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('products')
        .select('*, category:categories(name)')
        .eq('store_id', store.id);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            placeholder="All Categories"
            options={[
              { value: '', label: 'All Categories' },
              ...(categories?.map((c: Category) => ({
                value: c.id,
                label: c.name,
              })) || []),
            ]}
          />
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </div>
      </Card>

      {/* Products Grid/List */}
      {isLoading ? (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        )}>
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-40 mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground/50" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant={product.is_active ? 'success' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {product.category?.name || 'No category'}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-primary">
                      {formatCurrency(product.selling_price, country)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {products.map((product: any) => (
                <div key={product.id} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.sku} • {product.category?.name || 'No category'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(product.selling_price, country)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cost: {formatCurrency(product.cost_price, country)}
                    </p>
                  </div>
                  <Badge variant={product.is_active ? 'success' : 'secondary'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      ) : (
        <EmptyState
          title="No products found"
          description="Add your first product to start selling"
          icon={<Package className="w-12 h-12" />}
          action={{ label: 'Add Product', onClick: () => setIsFormOpen(true) }}
        />
      )}

      {/* Product Form Modal */}
      <Modal
        open={isFormOpen}
        onOpenChange={handleFormClose}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <ProductForm
          product={editingProduct}
          categories={categories || []}
          currency={currency}
          onSuccess={handleFormClose}
        />
      </Modal>
    </div>
  );
}
