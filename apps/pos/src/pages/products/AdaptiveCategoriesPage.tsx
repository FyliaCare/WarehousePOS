/**
 * AdaptiveCategoriesPage - Automatically switches between Desktop and Mobile Categories
 * 
 * - On mobile/tablet or PWA standalone mode → MobileCategoriesPage
 * - On desktop with large screen → CategoriesPage (original)
 * - Smooth transitions between modes
 */

import { Suspense, lazy } from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { Loader2 } from 'lucide-react';

// Lazy load both versions for better performance
const DesktopCategories = lazy(() => import('@/pages/products/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const MobileCategories = lazy(() => import('@/pages/products/MobileCategoriesPage'));

// Loading spinner
function CategoriesLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading Categories...</p>
      </div>
    </div>
  );
}

export function AdaptiveCategoriesPage() {
  const { isMobile, isTablet, isPWA, isTouchDevice } = useDeviceDetect();

  // Use mobile Categories when:
  // 1. On mobile device (<768px)
  // 2. On tablet (<1024px) AND it's a touch device
  // 3. Running as installed PWA on any touch device
  const useMobileVersion = isMobile || (isTablet && isTouchDevice) || (isPWA && isTouchDevice);

  return (
    <Suspense fallback={<CategoriesLoading />}>
      {useMobileVersion ? <MobileCategories /> : <DesktopCategories />}
    </Suspense>
  );
}

export default AdaptiveCategoriesPage;
