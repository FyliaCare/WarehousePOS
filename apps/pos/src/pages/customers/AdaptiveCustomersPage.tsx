/**
 * Adaptive Customers Page
 * Auto-switches between mobile and desktop versions based on device
 */

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { MobileCustomersPage } from './MobileCustomersPage';
import { CustomersPage } from './CustomersPage';

export function AdaptiveCustomersPage() {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Use mobile version for phones and tablets
  if (isMobile || isTablet) {
    return <MobileCustomersPage />;
  }
  
  // Use desktop version for larger screens
  return <CustomersPage />;
}

export default AdaptiveCustomersPage;
