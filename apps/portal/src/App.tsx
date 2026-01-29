import { Routes, Route } from 'react-router-dom';
import { StoreLayout } from '@/layouts/StoreLayout';
import { useStoreContext } from '@/contexts/StoreContext';
import { LoadingSpinner } from '@warehousepos/ui';

// Pages
import { HomePage } from '@/pages/HomePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { StoreNotFoundPage } from '@/pages/StoreNotFoundPage';

function App() {
  const { store, isLoading } = useStoreContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!store) {
    return <StoreNotFoundPage />;
  }

  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
