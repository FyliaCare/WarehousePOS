/**
 * AdaptiveProductsPage - Automatically switches between Desktop and Mobile Products
 * 
 * - On mobile/tablet or PWA standalone mode → MobileProductsPage
 * - On desktop with large screen → ProductsPage (original)
 * - Smooth transitions between modes
 */

import { Suspense, lazy } from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { Loader2 } from 'lucide-react';

// Lazy load both versions for better performance
const DesktopProducts = lazy(() => import('@/pages/products/ProductsPage').then(m => ({ default: m.ProductsPage })));
const MobileProducts = lazy(() => import('@/pages/products/MobileProductsPage'));

// Loading spinner
function ProductsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading Products...</p>
      </div>
    </div>
  );
}

export function AdaptiveProductsPage() {
  const { isMobile, isTablet, isPWA, isTouchDevice } = useDeviceDetect();

  // Use mobile Products when:
  // 1. On mobile device (<768px)
  // 2. On tablet (<1024px) AND it's a touch device
  // 3. Running as installed PWA on any touch device
  const useMobileVersion = isMobile || (isTablet && isTouchDevice) || (isPWA && isTouchDevice);

  return (
    <Suspense fallback={<ProductsLoading />}>
      {useMobileVersion ? <MobileProducts /> : <DesktopProducts />}
    </Suspense>
  );
}

export default AdaptiveProductsPage;
