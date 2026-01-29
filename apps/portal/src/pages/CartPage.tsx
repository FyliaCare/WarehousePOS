import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, Button, EmptyState } from '@warehousepos/ui';
import { formatCurrency } from '@warehousepos/utils';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCartStore } from '@/stores/cartStore';

export function CartPage() {
  const { store } = useStoreContext();
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const currency = store?.tenant?.country === 'NG' ? 'NGN' : 'GHS';
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState
          title="Your cart is empty"
          description="Browse our products and add items to your cart"
          icon={<ShoppingBag className="w-12 h-12" />}
          action={
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product.id} className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product.id}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-primary mt-1">
                    {formatCurrency(item.product.selling_price, currency)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      className="p-1.5 hover:bg-muted transition-colors"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                    <button
                      className="p-1.5 hover:bg-muted transition-colors"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(item.product.selling_price * item.quantity, currency)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)
                </span>
                <span className="text-foreground">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-foreground">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-border my-4 pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(subtotal, currency)}</span>
              </div>
            </div>

            <Link to="/checkout">
              <Button className="w-full gap-2" size="lg">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/products">
              <Button variant="outline" className="w-full mt-3">
                Continue Shopping
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
