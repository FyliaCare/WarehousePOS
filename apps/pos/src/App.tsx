import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt';
import { Loader2 } from 'lucide-react';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';

// Pages - Auth (using email-based auth)
import { LoginPage, RegisterPage } from '@/pages/auth';
import { CountrySelectPage } from '@/pages/auth/CountrySelectPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { CategoriesPage } from '@/pages/products/CategoriesPage';
import { StockPage } from '@/pages/inventory/StockPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { SalesPage } from '@/pages/sales/SalesPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import DeliveriesPage from '@/pages/DeliveriesPage';
import RidersPage from '@/pages/RidersPage';
import ReportsPage from '@/pages/ReportsPage';

// Lazy load POS pages for better code splitting
const POSPage = lazy(() => import('@/pages/POSPage').then(m => ({ default: m.POSPage })));
const MobilePOSPage = lazy(() => import('@/pages/pos/MobilePOSPage'));
const AdaptivePOSPage = lazy(() => import('@/pages/pos/AdaptivePOSPage'));

// Delivery Management
import DeliveryZonesPage from '@/pages/delivery/DeliveryZonesPage';
import DeliveryAssignmentsPage from '@/pages/delivery/DeliveryAssignmentsPage';
import TrackingPage from '@/pages/tracking/TrackingPage';

// Loading fallback for lazy components
function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

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
        
        {/* Setup route - for users who signed in but need business setup */}
        <Route
          path="/setup"
          element={<RegisterPage />}
        />
        
        {/* Other Auth routes with layout */}
        <Route element={<AuthLayout />}>
          <Route
            path="/select-country"
            element={<CountrySelectPage />}
          />
        </Route>

        {/* Mobile POS - Full screen without sidebar for PWA mode */}
        <Route
          path="/mobile-pos"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}>
                <MobilePOSPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Public Tracking Page - No auth required */}
        <Route path="/track/:trackingCode" element={<TrackingPage />} />
        <Route path="/track" element={<TrackingPage />} />

        {/* App routes with sidebar */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pos" element={<Suspense fallback={<PageLoading />}><AdaptivePOSPage /></Suspense>} />
          <Route path="/pos/desktop" element={<Suspense fallback={<PageLoading />}><POSPage /></Suspense>} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/deliveries/zones" element={<DeliveryZonesPage />} />
          <Route path="/deliveries/dispatch" element={<DeliveryAssignmentsPage />} />
          <Route path="/riders" element={<RidersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
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
