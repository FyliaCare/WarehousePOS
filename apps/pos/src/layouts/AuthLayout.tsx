import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
            <svg
              className="w-10 h-10 text-primary-foreground"
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
          <h1 className="text-2xl font-bold text-foreground">WarehousePOS</h1>
          <p className="text-muted-foreground">Simple. Powerful. Made for Africa.</p>
        </div>
        
        {/* Content */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-6">
          <Outlet />
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} WarehousePOS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
