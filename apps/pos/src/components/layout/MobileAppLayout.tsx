/**
 * Mobile App Layout
 * PWA-optimized layout with light blue theme
 * Features: Side navigation, bottom tab bar, header
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  Bell,
  Search,
  ShoppingCart,
  LayoutDashboard,
  Package,
  Receipt,
  MoreHorizontal,
} from 'lucide-react';
import { MobileSideNav } from './MobileSideNav';

// ============================================
// THEME CONFIGURATION - Light Blue
// ============================================
const theme = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceLight: '#f1f5f9',
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  primaryDark: '#1d4ed8',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
};

// Haptic feedback
const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
};

// Bottom tab bar items
const bottomTabs = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Sales', href: '/sales', icon: Receipt },
  { name: 'More', href: '#more', icon: MoreHorizontal },
];

// Page titles
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/products': 'Products',
  '/categories': 'Categories',
  '/stock': 'Stock',
  '/customers': 'Customers',
  '/sales': 'Sales',
  '/deliveries': 'Deliveries',
  '/riders': 'Riders',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export function MobileAppLayout() {
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [notificationCount] = useState(3);
  const location = useLocation();
  const navigate = useNavigate();

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    for (const [key, value] of Object.entries(pageTitles)) {
      if (path.startsWith(key)) return value;
    }
    return 'WarehousePOS';
  };

  // Handle bottom tab click
  const handleTabClick = (href: string) => {
    haptic.light();
    if (href === '#more') {
      setSideNavOpen(true);
    } else {
      navigate(href);
    }
  };

  // Check if tab is active
  const isTabActive = (href: string) => {
    if (href === '#more') return sideNavOpen;
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Side Navigation */}
      <MobileSideNav isOpen={sideNavOpen} onClose={() => setSideNavOpen(false)} />

      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 h-14 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
        }}
      >
        {/* Menu button */}
        <button
          onClick={() => { haptic.light(); setSideNavOpen(true); }}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        {/* Title */}
        <h1 className="text-base font-bold text-white">
          {getPageTitle()}
        </h1>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Search className="w-5 h-5 text-white" />
          </button>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Bell className="w-5 h-5 text-white" />
            {notificationCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: '#ef4444' }}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-around px-2 border-t"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {bottomTabs.map((tab) => {
          const isActive = isTabActive(tab.href);
          return (
            <motion.button
              key={tab.name}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTabClick(tab.href)}
              className="flex flex-col items-center justify-center flex-1 py-1 relative"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomTabIndicator"
                  className="absolute -top-0.5 w-12 h-1 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon container */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive ? theme.primaryLight : 'transparent',
                }}
              >
                <tab.icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: isActive ? theme.primary : theme.textMuted }}
                />
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-medium mt-0.5 transition-colors"
                style={{ color: isActive ? theme.primary : theme.textMuted }}
              >
                {tab.name}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}

export default MobileAppLayout;
