/**
 * Adaptive Sales Page
 * Auto-switches between mobile and desktop versions based on device
 */

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { MobileSalesPage } from './MobileSalesPage';
import { SalesPage } from './SalesPage';

export function AdaptiveSalesPage() {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Use mobile version for phones and tablets
  if (isMobile || isTablet) {
    return <MobileSalesPage />;
  }
  
  // Use desktop version for larger screens
  return <SalesPage />;
}

export default AdaptiveSalesPage;
