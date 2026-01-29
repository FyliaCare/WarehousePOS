import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import { StoreProvider } from './contexts/StoreContext';
import { initSentry, SentryErrorBoundary } from './lib/sentry';
import './index.css';

// Initialize Sentry error monitoring
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <StoreProvider>
            <App />
            <Toaster position="top-center" richColors />
          </StoreProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </SentryErrorBoundary>
  </React.StrictMode>
);

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">We've been notified and are working on it.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
