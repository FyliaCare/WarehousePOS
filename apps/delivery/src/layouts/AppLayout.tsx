import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Package, Wallet, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { CountryCode } from '@warehousepos/types';

// Premium theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryDark: '#D4A900',
    textOnPrimary: '#1A1400',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryDark: '#006B41',
    textOnPrimary: '#FFFFFF',
  },
};

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Deliveries', href: '/deliveries', icon: Package },
  { name: 'Earnings', href: '/earnings', icon: Wallet },
  { name: 'Profile', href: '/profile', icon: User },
];

export function AppLayout() {
  const location = useLocation();
  const { store } = useAuthStore();
  const country: CountryCode = (store as any)?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-2 py-2 safe-area-bottom z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all relative"
              >
                {isActive && (
                  <div 
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: theme.primaryLight }}
                  />
                )}
                <div 
                  className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'scale-110' : ''
                  }`}
                  style={isActive ? { 
                    backgroundColor: theme.primary,
                  } : {}}
                >
                  <item.icon 
                    className={`w-5 h-5 transition-colors ${
                      isActive ? '' : 'text-zinc-400'
                    }`}
                    style={isActive ? { color: theme.textOnPrimary } : {}}
                  />
                </div>
                <span 
                  className={`text-xs font-medium relative z-10 transition-colors ${
                    isActive ? 'font-semibold' : 'text-zinc-400'
                  }`}
                  style={isActive ? { color: theme.primaryDark } : {}}
                >
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
