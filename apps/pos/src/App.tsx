import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt';
import { Loader2 } from 'lucide-react';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';

// Pages - Auth (using email-based auth)
import { LoginPage, RegisterPage, ResetPasswordPage, AuthCallbackPage } from '@/pages/auth';
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
const AdaptiveReportsPage = lazy(() => import('@/pages/reports/AdaptiveReportsPage'));

// Lazy load POS pages for better code splitting
const POSPage = lazy(() => import('@/pages/POSPage').then(m => ({ default: m.POSPage })));
const MobilePOSPage = lazy(() => import('@/pages/pos/MobilePOSPage').then(m => ({ default: m.MobilePOSPage })));
const AdaptivePOSPage = lazy(() => import('@/pages/pos/AdaptivePOSPage'));
const MobileProductsPage = lazy(() => import('@/pages/products/MobileProductsPage'));
const AdaptiveProductsPage = lazy(() => import('@/pages/products/AdaptiveProductsPage'));
const MobileCategoriesPage = lazy(() => import('@/pages/products/MobileCategoriesPage'));
const AdaptiveCategoriesPage = lazy(() => import('@/pages/products/AdaptiveCategoriesPage'));
const MobileStockPage = lazy(() => import('@/pages/inventory/MobileStockPage'));
const AdaptiveStockPage = lazy(() => import('@/pages/inventory/AdaptiveStockPage'));
const MobileCustomersPage = lazy(() => import('@/pages/customers/MobileCustomersPage'));
const AdaptiveCustomersPage = lazy(() => import('@/pages/customers/AdaptiveCustomersPage'));
const MobileSalesPage = lazy(() => import('@/pages/sales/MobileSalesPage'));
const AdaptiveSalesPage = lazy(() => import('@/pages/sales/AdaptiveSalesPage'));
const AdaptiveDeliveriesPage = lazy(() => import('@/pages/delivery/AdaptiveDeliveriesPage'));
const AdaptiveRidersPage = lazy(() => import('@/pages/riders/AdaptiveRidersPage').then(m => ({ default: m.AdaptiveRidersPage })));
const AdaptiveAdvancedSettingsPage = lazy(() => import('@/pages/settings/AdaptiveAdvancedSettingsPage'));
const AdaptiveSettingsPage = lazy(() => import('@/pages/settings/AdaptiveSettingsPage'));

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
        
        {/* Password Reset route - for users resetting their password */}
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
        
        {/* Auth Callback - handles email verification, password reset redirects */}
        <Route
          path="/auth/callback"
          element={<AuthCallbackPage />}
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

        {/* Mobile Products - Full screen without sidebar for PWA mode */}
        <Route
          path="/mobile-products"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}>
                <MobileProductsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Mobile Categories - Full screen without sidebar for PWA mode */}
        <Route
          path="/mobile-categories"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}>
                <MobileCategoriesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Mobile Stock - Full screen without sidebar for PWA mode */}
        <Route
          path="/mobile-stock"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}>
                <MobileStockPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Mobile Customers - Full screen without sidebar for PWA mode */}
        <Route
          path="/mobile-customers"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}>
                <MobileCustomersPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Mobile Sales - Full screen without sidebar for PWA mode */}
        <Route
          path="/mobile-sales"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}>
                <MobileSalesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Mobile Deliveries - Full screen without sidebar for PWA mode */}
        <Route
          path="/mobile-deliveries"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}>
                <AdaptiveDeliveriesPage />
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
          <Route path="/products" element={<Suspense fallback={<PageLoading />}><AdaptiveProductsPage /></Suspense>} />
          <Route path="/products/desktop" element={<ProductsPage />} />
          <Route path="/categories" element={<Suspense fallback={<PageLoading />}><AdaptiveCategoriesPage /></Suspense>} />
          <Route path="/categories/desktop" element={<CategoriesPage />} />
          <Route path="/stock" element={<Suspense fallback={<PageLoading />}><AdaptiveStockPage /></Suspense>} />
          <Route path="/stock/desktop" element={<StockPage />} />
          <Route path="/customers" element={<Suspense fallback={<PageLoading />}><AdaptiveCustomersPage /></Suspense>} />
          <Route path="/customers/desktop" element={<CustomersPage />} />
          <Route path="/sales" element={<Suspense fallback={<PageLoading />}><AdaptiveSalesPage /></Suspense>} />
          <Route path="/sales/desktop" element={<SalesPage />} />
          <Route path="/deliveries" element={<Suspense fallback={<PageLoading />}><AdaptiveDeliveriesPage /></Suspense>} />
          <Route path="/deliveries/desktop" element={<DeliveriesPage />} />
          <Route path="/deliveries/zones" element={<DeliveryZonesPage />} />
          <Route path="/deliveries/dispatch" element={<DeliveryAssignmentsPage />} />
          <Route path="/riders" element={<Suspense fallback={<PageLoading />}><AdaptiveRidersPage /></Suspense>} />
          <Route path="/riders/desktop" element={<RidersPage />} />
          <Route path="/reports" element={<Suspense fallback={<PageLoading />}><AdaptiveReportsPage /></Suspense>} />
          <Route path="/reports/desktop" element={<ReportsPage />} />
          <Route path="/settings" element={<Suspense fallback={<PageLoading />}><AdaptiveSettingsPage /></Suspense>} />
          <Route path="/settings/desktop" element={<SettingsPage />} />
          <Route path="/settings/advanced" element={<Suspense fallback={<PageLoading />}><AdaptiveAdvancedSettingsPage /></Suspense>} />
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
