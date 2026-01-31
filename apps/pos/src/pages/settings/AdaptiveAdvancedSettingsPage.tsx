/**
 * Adaptive Advanced Settings Page
 * Auto-switches between mobile and desktop versions
 */

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import MobileAdvancedSettingsPage from './MobileAdvancedSettingsPage';
import { AdvancedSettingsPage } from './AdvancedSettingsPage';

export default function AdaptiveAdvancedSettingsPage() {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Use mobile version for phones and tablets
  if (isMobile || isTablet) {
    return <MobileAdvancedSettingsPage />;
  }
  
  // Use desktop version for larger screens
  return <AdvancedSettingsPage />;
}
