import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button, Badge } from '@warehousepos/ui';
import { cn, formatPhone } from '@warehousepos/utils';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCartStore } from '@/stores/cartStore';

export function StoreLayout() {
  const { store } = useStoreContext();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'My Orders', href: '/orders' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              {store?.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">
                    {store?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <span className="font-bold text-lg text-foreground hidden sm:block">
                {store?.name}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    location.pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {store?.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Phone className="w-4 h-4" />
                  {formatPhone(store.phone, store.tenant?.country || 'GH')}
                </a>
              )}
              
              <Link to="/cart" className="relative">
                <Button variant="outline" size="icon">
                  <ShoppingCart className="w-5 h-5" />
                </Button>
                {itemCount > 0 && (
                  <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    variant="default"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-4 py-3 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'block py-2 text-sm font-medium transition-colors',
                    location.pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {store?.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
                >
                  <Phone className="w-4 h-4" />
                  {formatPhone(store.phone, store.tenant?.country || 'GH')}
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {store?.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {store?.name?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <span className="font-semibold text-foreground">{store?.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by{' '}
              <a
                href="https://warehousepos.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                WarehousePOS
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
