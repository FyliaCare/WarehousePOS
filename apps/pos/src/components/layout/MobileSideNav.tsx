/**
 * Mobile Side Navigation
 * PWA-optimized drawer navigation with light blue theme
 * Features: Smooth animations, haptic feedback, gesture support
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Store,
  Users,
  Receipt,
  Truck,
  Bike,
  BarChart3,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Bell,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

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
  primaryGradientStart: '#3b82f6',
  primaryGradientEnd: '#1d4ed8',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#e2e8f0',
};

// Haptic feedback helper
const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  heavy: () => navigator.vibrate?.(30),
  success: () => navigator.vibrate?.([10, 50, 10]),
};

// Navigation items
const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart, badge: null },
  { name: 'Products', href: '/products', icon: Package, badge: null },
  { name: 'Categories', href: '/categories', icon: Layers, badge: null },
  { name: 'Stock', href: '/stock', icon: Store, badge: null },
  { name: 'Customers', href: '/customers', icon: Users, badge: null },
  { name: 'Sales', href: '/sales', icon: Receipt, badge: null },
  { name: 'Deliveries', href: '/deliveries', icon: Truck, badge: null },
  { name: 'Riders', href: '/riders', icon: Bike, badge: null },
  { name: 'Reports', href: '/reports', icon: BarChart3, badge: null },
];

const bottomNavItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

interface MobileSideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSideNav({ isOpen, onClose }: MobileSideNavProps) {
  const { user, store, tenant, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [notificationCount] = useState(3); // Demo

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe to close
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100 || info.velocity.x < -500) {
      haptic.light();
      onClose();
    }
  };

  const handleSignOut = async () => {
    haptic.heavy();
    await signOut();
    navigate('/login');
  };

  const handleNavClick = (href: string) => {
    haptic.light();
    navigate(href);
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            ref={containerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragControls={dragControls}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.2, right: 0 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-y-0 left-0 z-[101] w-[85vw] max-w-[320px] flex flex-col overflow-hidden shadow-2xl"
            style={{ backgroundColor: theme.surface }}
          >
            {/* Compact Header with gradient */}
            <div
              className="relative pt-10 pb-4 px-4"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryGradientStart} 0%, ${theme.primaryGradientEnd} 100%)`,
              }}
            >
              {/* Close button */}
              <button
                onClick={() => { haptic.light(); onClose(); }}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>

              {/* User Profile - Compact */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                      color: theme.primary,
                    }}
                  >
                    {getInitials(user?.full_name || 'User')}
                  </div>
                  {/* Online indicator */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                    style={{ backgroundColor: theme.success }}
                  >
                    <Sparkles className="w-2 h-2 text-white" />
                  </div>
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white truncate">
                    {user?.full_name || 'User'}
                  </h2>
                  <p className="text-xs text-white/80 truncate">
                    {String(user?.role || 'Staff').charAt(0).toUpperCase() + String(user?.role || 'staff').slice(1)}
                  </p>
                </div>
              </div>

              {/* Store card - more compact */}
              <div
                className="mt-3 p-2.5 rounded-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {store?.name || 'Main Store'}
                    </p>
                    <p className="text-[10px] text-white/70 truncate">
                      {tenant?.name || 'Business'}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/50" />
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider px-2.5 mb-1.5" style={{ color: theme.textMuted }}>
                Main Menu
              </p>
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                
                return (
                  <NavButton
                    key={item.name}
                    icon={item.icon}
                    label={item.name}
                    isActive={isActive}
                    badge={item.badge}
                    onClick={() => handleNavClick(item.href)}
                  />
                );
              })}

              <div className="pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider px-3 mb-2" style={{ color: theme.textMuted }}>
                  More
                </p>
                {bottomNavItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <NavButton
                      key={item.name}
                      icon={item.icon}
                      label={item.name}
                      isActive={isActive}
                      onClick={() => handleNavClick(item.href)}
                    />
                  );
                })}
              </div>
            </nav>

            {/* Compact Footer */}
            <div className="px-3 py-3 border-t" style={{ borderColor: theme.border }}>
              {/* Side by side: Notifications + Sign Out */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                {notificationCount > 0 && (
                  <button
                    onClick={() => handleNavClick('/notifications')}
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: theme.primaryLight }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: theme.textPrimary }}>
                        {notificationCount} New
                      </p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: theme.danger }}
                    >
                      {notificationCount}
                    </div>
                  </button>
                )}

                {/* Sign out button */}
                <button
                  onClick={handleSignOut}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                    notificationCount > 0 ? '' : 'flex-1'
                  }`}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: theme.danger,
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-semibold">Sign Out</span>
                </button>
              </div>

              {/* Version - smaller */}
              <p className="text-center text-[9px] mt-2" style={{ color: theme.textMuted }}>
                WarehousePOS v2.1.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// SUPPORTING COMPONENTS
// ============================================

interface NavButtonProps {
  icon: any;
  label: string;
  isActive: boolean;
  badge?: string | number | null;
  onClick: () => void;
}

function NavButton({ icon: Icon, label, isActive, badge, onClick }: NavButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all"
      style={{
        backgroundColor: isActive ? theme.primary : 'transparent',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : theme.surfaceLight,
        }}
      >
        <Icon
          className="w-4 h-4"
          style={{ color: isActive ? 'white' : theme.textSecondary }}
        />
      </div>
      <span
        className="flex-1 text-left text-sm font-medium"
        style={{ color: isActive ? 'white' : theme.textPrimary }}
      >
        {label}
      </span>
      {badge !== null && badge !== undefined && (
        <span
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{
            backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : theme.primaryLight,
            color: isActive ? 'white' : theme.primary,
          }}
        >
          {badge}
        </span>
      )}
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      )}
    </motion.button>
  );
}

export default MobileSideNav;
