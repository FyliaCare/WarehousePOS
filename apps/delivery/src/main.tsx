import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@warehousepos/ui';
import App from './App';
import { initSentry, SentryErrorBoundary } from './lib/sentry';
import './index.css';

// Initialize Sentry error monitoring
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-center" richColors />
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
