/**
 * Adaptive Deliveries Page
 * Auto-switches between mobile and desktop versions based on device
 */

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import MobileDeliveriesPage from './MobileDeliveriesPage';
import DeliveriesPage from '@/pages/DeliveriesPage';

export function AdaptiveDeliveriesPage() {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Use mobile version for phones and tablets
  if (isMobile || isTablet) {
    return <MobileDeliveriesPage />;
  }
  
  // Use desktop version for larger screens
  return <DeliveriesPage />;
}

export default AdaptiveDeliveriesPage;
