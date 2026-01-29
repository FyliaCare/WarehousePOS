import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Store,
  Users,
  CreditCard,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@warehousepos/utils';
import { Avatar } from '@warehousepos/ui';
import { useAuthStore } from '@/stores/authStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tenants', href: '/tenants', icon: Building2 },
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'Payments', href: '/payments', icon: DollarSign },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Support', href: '/support', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-muted">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">W</span>
              </div>
              <span className="font-bold text-foreground">Admin Panel</span>
            </div>
            <button
              className="lg:hidden p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar name={user?.full_name || 'Admin'} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            {/* User Menu */}
            <div className="relative">
              <button
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <Avatar name={user?.full_name || 'Admin'} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-foreground">
                  {user?.full_name}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                    <NavLink
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </NavLink>
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-muted"
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
