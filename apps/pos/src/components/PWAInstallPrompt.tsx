import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:bottom-6 lg:w-80 animate-in slide-in-from-bottom-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ghana-gold-400 to-ghana-gold-600 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">Install WarehousePOS</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Add to home screen for the best experience
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-ghana-gold-400 to-ghana-gold-500 text-gray-900"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to check PWA status
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isInstalled, isOnline };
}

// Offline indicator component
export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-gray-900 text-center py-2 text-sm font-medium z-50 safe-top">
      You're offline. Some features may be limited.
    </div>
  );
}
