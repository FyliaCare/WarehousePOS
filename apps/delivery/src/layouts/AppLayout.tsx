import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Package, DollarSign, User } from 'lucide-react';
import { cn } from '@warehousepos/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Deliveries', href: '/deliveries', icon: Package },
  { name: 'Earnings', href: '/earnings', icon: DollarSign },
  { name: 'Profile', href: '/profile', icon: User },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 safe-area-bottom">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
