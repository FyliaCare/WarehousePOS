/**
 * AdaptivePOSPage - Automatically switches between Desktop and Mobile POS
 * 
 * - On mobile/tablet or PWA standalone mode → MobilePOSPage
 * - On desktop with large screen → POSPage (original)
 * - Smooth transitions between modes
 */

import { Suspense, lazy } from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { Loader2 } from 'lucide-react';

// Lazy load both versions for better performance
const DesktopPOS = lazy(() => import('@/pages/POSPage').then(m => ({ default: m.POSPage })));
const MobilePOS = lazy(() => import('@/pages/pos/MobilePOSPage'));

// Loading spinner
function POSLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading Point of Sale...</p>
      </div>
    </div>
  );
}

export function AdaptivePOSPage() {
  const { isMobile, isTablet, isPWA, isTouchDevice } = useDeviceDetect();

  // Use mobile POS when:
  // 1. On mobile device (<768px)
  // 2. On tablet (<1024px) AND it's a touch device
  // 3. Running as installed PWA on any touch device
  const useMobileVersion = isMobile || (isTablet && isTouchDevice) || (isPWA && isTouchDevice);

  return (
    <Suspense fallback={<POSLoading />}>
      {useMobileVersion ? <MobilePOS /> : <DesktopPOS />}
    </Suspense>
  );
}

export default AdaptivePOSPage;
