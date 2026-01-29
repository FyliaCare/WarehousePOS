import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@warehousepos/ui';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TenantsPage, TenantDetailPage } from '@/pages/tenants';
import { StoresPage, StoreDetailPage } from '@/pages/stores';
import { UsersPage } from '@/pages/users';
import { SubscriptionsPage } from '@/pages/subscriptions';
import { PaymentsPage } from '@/pages/payments';
import { AnalyticsPage } from '@/pages/analytics';
import { SupportPage } from '@/pages/support';
import { SettingsPage } from '@/pages/settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/:id" element={<TenantDetailPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/stores/:id" element={<StoreDetailPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
