/**
 * Adaptive Reports Page
 * Automatically switches between mobile and desktop versions
 */

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import MobileReportsPage from './MobileReportsPage';
import ReportsPage from '@/pages/ReportsPage';

export default function AdaptiveReportsPage() {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Use mobile version for phones and tablets
  if (isMobile || isTablet) {
    return <MobileReportsPage />;
  }
  
  // Use desktop version for larger screens
  return <ReportsPage />;
}
