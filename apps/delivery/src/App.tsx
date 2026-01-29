import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DeliveriesPage } from '@/pages/DeliveriesPage';
import { DeliveryDetailPage } from '@/pages/DeliveryDetailPage';
import { EarningsPage } from '@/pages/EarningsPage';
import { ProfilePage } from '@/pages/ProfilePage';

// Layouts
import { AppLayout } from '@/layouts/AppLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
