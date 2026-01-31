import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Receipt,
  Settings,
  Menu,
  X,
  LogOut,
  Store,
  Bell,
  ChevronDown,
  ChevronRight,
  Truck,
  Bike,
  BarChart3,
  MapPin,
  Send,
  Search,
} from 'lucide-react';
import { Avatar } from '@warehousepos/ui';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@warehousepos/utils';
import { formatPhone } from '@/lib/supabase-auth';
import { MobileSideNav } from '@/components/layout/MobileSideNav';
import type { CountryCode } from '@warehousepos/types';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: Layers },
  { name: 'Stock', href: '/stock', icon: Store },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Sales', href: '/sales', icon: Receipt },
  { 
    name: 'Deliveries', 
    href: '/deliveries', 
    icon: Truck,
    children: [
      { name: 'All Deliveries', href: '/deliveries', icon: Package },
      { name: 'Dispatch', href: '/deliveries/dispatch', icon: Send },
      { name: 'Zones', href: '/deliveries/zones', icon: MapPin },
    ]
  },
  { name: 'Riders', href: '/riders', icon: Bike },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { user, tenant, store, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const isGhana = country === 'GH';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen bg-background ${!isGhana ? 'theme-nigeria' : ''}`}>
      {/* Mobile Side Navigation - PWA Optimized */}
      {isMobile && (
        <MobileSideNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Desktop sidebar overlay */}
      {sidebarOpen && !isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/50 transform transition-transform duration-300 ease-out lg:translate-x-0 shadow-xl lg:shadow-none',
          'hidden lg:block', // Hide on mobile, we use MobileSideNav instead
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg',
              isGhana 
                ? 'bg-gradient-to-br from-ghana-gold-400 to-ghana-gold-600' 
                : 'bg-gradient-to-br from-nigeria-green-400 to-nigeria-green-600'
            )}>
              <svg
                className="w-6 h-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <span className="font-bold text-foreground">WarehousePOS</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{isGhana ? '🇬🇭' : '🇳🇬'}</span>
                <span className={cn(
                  'text-xs font-medium',
                  isGhana ? 'text-ghana-gold-600 dark:text-ghana-gold-400' : 'text-nigeria-green-600 dark:text-nigeria-green-400'
                )}>
                  {isGhana ? 'Ghana' : 'Nigeria'}
                </span>
              </div>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store selector */}
        <div className="p-4">
          <button className={cn(
            'w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200',
            isGhana 
              ? 'bg-ghana-gold-50 border-ghana-gold-200 hover:border-ghana-gold-300 dark:bg-ghana-gold-500/10 dark:border-ghana-gold-500/20 dark:hover:border-ghana-gold-500/40' 
              : 'bg-nigeria-green-50 border-nigeria-green-200 hover:border-nigeria-green-300 dark:bg-nigeria-green-500/10 dark:border-nigeria-green-500/20 dark:hover:border-nigeria-green-500/40'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                isGhana ? 'bg-ghana-gold-100 dark:bg-ghana-gold-500/20' : 'bg-nigeria-green-100 dark:bg-nigeria-green-500/20'
              )}>
                <Store className={cn(
                  'w-5 h-5',
                  isGhana ? 'text-ghana-gold-600 dark:text-ghana-gold-400' : 'text-nigeria-green-600 dark:text-nigeria-green-400'
                )} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{store?.name || 'Main Store'}</p>
                <p className="text-xs text-muted-foreground">{tenant?.name}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            // On mobile, don't expand children for Deliveries (it has a unified mobile page with tabs)
            const skipChildrenOnMobile = isMobile && item.name === 'Deliveries';
            const isExpanded = !skipChildrenOnMobile && (expandedNav === item.name || (hasChildren && location.pathname.startsWith(item.href)));
            const isActiveParent = hasChildren && location.pathname.startsWith(item.href);
            
            // On mobile, treat Deliveries as a simple link (no children)
            if (hasChildren && !skipChildrenOnMobile) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setExpandedNav(isExpanded ? null : item.name)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActiveParent
                        ? isGhana 
                          ? 'bg-ghana-gold-100 text-ghana-gold-900 dark:bg-ghana-gold-500/20 dark:text-ghana-gold-400' 
                          : 'bg-nigeria-green-100 text-nigeria-green-900 dark:bg-nigeria-green-500/20 dark:text-nigeria-green-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </span>
                    <ChevronRight className={cn(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-90'
                    )} />
                  </button>
                  {isExpanded && item.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                              isActive
                                ? isGhana 
                                  ? 'bg-gradient-to-r from-ghana-gold-500 to-ghana-gold-600 text-black shadow-md' 
                                  : 'bg-gradient-to-r from-nigeria-green-500 to-nigeria-green-600 text-white shadow-md'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )
                          }
                        >
                          <child.icon className="w-4 h-4" />
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? isGhana 
                        ? 'bg-gradient-to-r from-ghana-gold-500 to-ghana-gold-600 text-black shadow-md' 
                        : 'bg-gradient-to-r from-nigeria-green-500 to-nigeria-green-600 text-white shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-border/50">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar - Light Blue theme header */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] backdrop-blur-xl border-b border-[#1d4ed8]/50 flex items-center justify-between px-3 lg:px-6 shadow-md">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-xl transition-colors text-white/90 hover:bg-white/10 active:bg-white/20"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title - hidden on mobile, shown on desktop */}
          <div className="hidden lg:block" />
          
          {/* Mobile title */}
          <h1 className="lg:hidden text-base font-bold text-white">WarehousePOS</h1>

          {/* Right side */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Search - desktop only */}
            <button className="hidden lg:flex relative p-2.5 rounded-xl transition-colors text-white/80 hover:text-white hover:bg-white/10">
              <Search className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <button className="relative p-2 lg:p-2.5 rounded-xl transition-colors text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 lg:top-1.5 lg:right-1.5 w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full border-2 border-[#2563eb] bg-amber-400" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 lg:gap-3 p-1.5 lg:p-2 rounded-xl transition-all duration-200 hover:bg-white/10 active:bg-white/20"
              >
                <Avatar
                  name={user?.full_name || 'User'}
                  size="sm"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white">
                    {user?.full_name}
                  </p>
                  <p className="text-xs capitalize text-white/70">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/70 hidden md:block" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-card border border-border/50 rounded-xl shadow-xl z-50 py-2 animate-scale-in">
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email || formatPhone(user?.phone || '', country)}</p>
                    </div>
                    <div className="py-1">
                      <NavLink
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </NavLink>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
