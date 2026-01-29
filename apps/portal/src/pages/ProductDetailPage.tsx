import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingBag, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Card, Button, Badge, Skeleton } from '@warehousepos/ui';
import { formatCurrency } from '@warehousepos/utils';
import type { Product } from '@warehousepos/types';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Product with category name from join
type ProductWithCategory = Product & { category?: { name: string } | null };

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { store } = useStoreContext();
  const addItem = useCartStore((state) => state.addItem);
  const currency = store?.tenant?.country === 'NG' ? 'NGN' : 'GHS';
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .eq('id', id || '')
        .single();
      return data as ProductWithCategory | null;
    },
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (store && product) {
      // Cast to Product for cart store (category is optional)
      for (let i = 0; i < quantity; i++) {
        addItem(product as Product, store.id);
      }
      toast.success(`Added ${quantity} item(s) to cart`);
      setQuantity(1);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-6" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-lg text-muted-foreground mb-4">Product not found</p>
        <Link to="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-24 h-24 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <Badge variant="secondary" className="mb-2">
            {product.category?.name || 'Uncategorized'}
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
          <p className="text-2xl font-bold text-primary mb-4">
            {formatCurrency(product.selling_price, currency)}
          </p>

          {product.description && (
            <p className="text-muted-foreground mb-6">{product.description}</p>
          )}

          {/* Stock Status */}
          {product.track_stock && (
            <div className="mb-6">
              {(product.stock_quantity ?? 0) > 10 ? (
                <Badge variant="success">In Stock</Badge>
              ) : (product.stock_quantity ?? 0) > 0 ? (
                <Badge variant="warning">Low Stock ({product.stock_quantity} left)</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-muted-foreground">Quantity:</span>
            <div className="flex items-center border border-border rounded-lg">
              <button
                className="p-2 hover:bg-muted transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                className="p-2 hover:bg-muted transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleAddToCart}
            disabled={product.track_stock && (product.stock_quantity ?? 0) <= 0}
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart - {formatCurrency(product.selling_price * quantity, currency)}
          </Button>

          {/* SKU & Barcode */}
          <Card className="mt-6 p-4">
            <h3 className="font-semibold text-foreground mb-3">Product Details</h3>
            <div className="space-y-2 text-sm">
              {product.sku && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="text-foreground">{product.sku}</span>
                </div>
              )}
              {product.barcode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barcode</span>
                  <span className="text-foreground">{product.barcode}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
