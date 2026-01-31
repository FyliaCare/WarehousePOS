/**
 * Device Detection Hook for PWA
 * Detects mobile devices and PWA standalone mode
 */

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPWA: boolean;
  isStandalone: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

export function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());

  useEffect(() => {
    const handleResize = () => setDeviceInfo(getDeviceInfo());
    const handleOrientationChange = () => {
      setTimeout(() => setDeviceInfo(getDeviceInfo()), 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Also listen for media query changes
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const handleMobileChange = () => setDeviceInfo(getDeviceInfo());
    mobileQuery.addEventListener('change', handleMobileChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      mobileQuery.removeEventListener('change', handleMobileChange);
    };
  }, []);

  return deviceInfo;
}

function getDeviceInfo(): DeviceInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check if running as installed PWA
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  // Mobile: < 768px
  const isMobile = width < 768;

  // Tablet: 768px - 1024px
  const isTablet = width >= 768 && width < 1024;

  // Desktop: >= 1024px
  const isDesktop = width >= 1024;

  // Orientation
  const orientation = height > width ? 'portrait' : 'landscape';

  // Standalone mode (covers PWA and iOS home screen apps)
  const isStandalone = isPWA || (navigator as unknown as { standalone?: boolean }).standalone || false;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isPWA,
    isStandalone,
    isTouchDevice,
    screenWidth: width,
    screenHeight: height,
    orientation,
  };
}

// Simple check functions for one-off use
export const isMobileDevice = () => window.innerWidth < 768;
export const isTabletDevice = () => window.innerWidth >= 768 && window.innerWidth < 1024;
export const isPWAInstalled = () => 
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;
