import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import { Button, Card, Skeleton } from '@warehousepos/ui';
import { formatCurrency } from '@warehousepos/utils';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function HomePage() {
  const { store } = useStoreContext();
  const addItem = useCartStore((state) => state.addItem);
  const currency = store?.tenant?.country === 'NG' ? 'NGN' : 'GHS';

  // Fetch featured products
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['featured-products', store?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .eq('store_id', store?.id || '')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!store?.id,
  });

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

  const handleAddToCart = (product: any) => {
    if (store) {
      addItem(product, store.id);
      toast.success('Added to cart');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to {store?.name}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {store?.description || 'Browse our products and place your order online. Fast delivery and secure payment.'}
          </p>
          <Link to="/products">
            <Button size="lg" className="gap-2">
              Shop Now <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Easy Shopping</h3>
              <p className="text-sm text-muted-foreground">Browse and order from anywhere</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">Get your orders delivered quickly</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">Multiple payment options available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Categories</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {categories.map((category: any) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="flex-shrink-0 px-6 py-3 bg-card border border-border rounded-full hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="font-medium text-foreground">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
            <Link to="/products" className="text-primary hover:underline">
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="aspect-square rounded-lg mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-5 w-1/2" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts?.map((product: any) => (
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
                        {formatCurrency(product.price, currency)}
                      </p>
                      <Button size="sm" onClick={() => handleAddToCart(product)}>
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
