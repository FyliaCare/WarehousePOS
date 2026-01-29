import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { CountrySelectPage } from '@/pages/auth/CountrySelectPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { POSPage } from '@/pages/POSPage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { CategoriesPage } from '@/pages/products/CategoriesPage';
import { StockPage } from '@/pages/inventory/StockPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { SalesPage } from '@/pages/sales/SalesPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, tenant } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!tenant) {
    return <Navigate to="/select-country" replace />;
  }
  
  return <>{children}</>;
}

// Auth route wrapper (redirect if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, tenant } = useAuthStore();
  
  if (isAuthenticated && tenant) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* PWA Components */}
      <OfflineIndicator />
      <PWAInstallPrompt />
      
      <Routes>
        {/* Login route - full screen without layout wrapper */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />
        
        {/* Register route - full screen without layout wrapper */}
        <Route
          path="/register"
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          }
        />
        
        {/* Other Auth routes with layout */}
        <Route element={<AuthLayout />}>
          <Route
            path="/select-country"
            element={<CountrySelectPage />}
          />
        </Route>

        {/* App routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
