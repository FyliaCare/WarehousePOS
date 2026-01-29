import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ShoppingBag, Grid, List } from 'lucide-react';
import { Card, Input, Button, Select, Skeleton, EmptyState } from '@warehousepos/ui';
import { formatCurrency, cn } from '@warehousepos/utils';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function ProductsPage() {
  const { store } = useStoreContext();
  const addItem = useCartStore((state) => state.addItem);
  const currency = store?.tenant?.country === 'NG' ? 'NGN' : 'GHS';
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const categoryFilter = searchParams.get('category');
  const sortBy = searchParams.get('sort') || 'name';

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store?.id || '')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', store?.id, categoryFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, category:categories(name)')
        .eq('store_id', store?.id || '')
        .eq('is_active', true);

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      if (sortBy === 'price_asc') {
        query = query.order('selling_price', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('selling_price', { ascending: false });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('name');
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!store?.id,
  });

  const filteredProducts = products?.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (store) {
      addItem(product, store.id);
      toast.success('Added to cart');
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (value: string) => {
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Products</h1>
        <p className="text-muted-foreground">Browse our selection of products</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
          className="md:max-w-xs"
        />

        <div className="flex gap-3 flex-wrap">
          <Select
            value={categoryFilter || 'all'}
            onValueChange={handleCategoryChange}
            options={[
              { value: 'all', label: 'All Categories' },
              ...(categories?.map((c: any) => ({
                value: c.id,
                label: c.name,
              })) || []),
            ]}
          />

          <Select
            value={sortBy}
            onValueChange={handleSortChange}
            options={[
              { value: 'name', label: 'Name (A-Z)' },
              { value: 'price_asc', label: 'Price: Low to High' },
              { value: 'price_desc', label: 'Price: High to Low' },
              { value: 'newest', label: 'Newest First' },
            ]}
          />

          <div className="flex gap-1 border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-4'
        )}>
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className={viewMode === 'grid' ? 'aspect-square rounded-lg mb-3' : 'h-24 w-24 rounded-lg'} />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product: any) => (
              <Card key={product.id} className="overflow-hidden group">
                <Link to={`/products/${product.id}`}>
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product.id}`}>
                    <p className="text-sm text-muted-foreground mb-1">
                      {product.category?.name}
                    </p>
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(product.selling_price, currency)}
                    </p>
                    <Button size="sm" onClick={(e) => handleAddToCart(product, e)}>
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product: any) => (
              <Card key={product.id} className="p-4">
                <div className="flex gap-4">
                  <Link to={`/products/${product.id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${product.id}`}>
                      <p className="text-sm text-muted-foreground">
                        {product.category?.name}
                      </p>
                      <h3 className="font-semibold text-foreground mb-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {product.description}
                        </p>
                      )}
                    </Link>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(product.selling_price, currency)}
                      </p>
                      <Button onClick={(e) => handleAddToCart(product, e)}>
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          title="No products found"
          description={search ? `No products match "${search}"` : 'No products available at the moment'}
          icon={<ShoppingBag className="w-12 h-12" />}
        />
      )}
    </div>
  );
}
