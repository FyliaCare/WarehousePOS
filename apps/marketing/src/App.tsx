import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MarketingLayout } from "./layouts/MarketingLayout";
import { PortalLayout } from "./layouts/PortalLayout";
import { GeoLocaleProvider } from "./contexts/GeoLocaleContext";
import { TrainingProvider } from "./contexts/TrainingContext";

// Lazy load public pages
const HomePage = lazy(() => import("./pages/HomePage"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

// Lazy load portal pages
const PortalDashboard = lazy(() => import("./pages/portal/DashboardPage"));
const CreditsPage = lazy(() => import("./pages/portal/CreditsPage"));
const SubscriptionPage = lazy(() => import("./pages/portal/SubscriptionPage"));
const TrainingPage = lazy(() => import("./pages/portal/TrainingPage"));
const SupportPage = lazy(() => import("./pages/portal/SupportPage"));
const ProfilePage = lazy(() => import("./pages/portal/ProfilePage"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <GeoLocaleProvider>
      <TrainingProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public marketing pages */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Portal - auth is handled inside PortalLayout */}
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<PortalDashboard />} />
              <Route path="credits" element={<CreditsPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </TrainingProvider>
    </GeoLocaleProvider>
  );
}
