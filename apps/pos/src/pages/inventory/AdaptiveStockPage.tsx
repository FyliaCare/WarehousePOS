/**
 * Adaptive Stock Page
 * Auto-switches between mobile and desktop versions based on device
 */

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { MobileStockPage } from './MobileStockPage';
import { StockPage } from './StockPage';

export function AdaptiveStockPage() {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Use mobile version for phones and tablets
  if (isMobile || isTablet) {
    return <MobileStockPage />;
  }
  
  // Use desktop version for larger screens
  return <StockPage />;
}

export default AdaptiveStockPage;
