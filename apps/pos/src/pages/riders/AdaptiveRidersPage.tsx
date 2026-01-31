/**
 * Adaptive Riders Page
 * Auto-switches between mobile and desktop versions based on device
 */

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import MobileRidersPage from './MobileRidersPage';
import RidersPage from '@/pages/RidersPage';

export function AdaptiveRidersPage() {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Use mobile version for phones and tablets
  if (isMobile || isTablet) {
    return <MobileRidersPage />;
  }
  
  // Use desktop version for larger screens
  return <RidersPage />;
}

export default AdaptiveRidersPage;
