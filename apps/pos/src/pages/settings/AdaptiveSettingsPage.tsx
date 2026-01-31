/**
 * Adaptive Settings Page
 * Auto-switches between mobile and desktop versions
 */

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import MobileSettingsPage from './MobileSettingsPage';
import { SettingsPage } from './SettingsPage';

export default function AdaptiveSettingsPage() {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Use mobile version for phones and tablets
  if (isMobile || isTablet) {
    return <MobileSettingsPage />;
  }
  
  // Use desktop version for larger screens
  return <SettingsPage />;
}
