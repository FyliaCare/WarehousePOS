import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // POS Settings
  quickAddEnabled: boolean;
  soundEnabled: boolean;
  printReceipt: boolean;
  showStockWarnings: boolean;
  lowStockThreshold: number;
  
  // Display
  compactMode: boolean;
  showProductImages: boolean;
  gridColumns: 3 | 4 | 5 | 6;
  
  // Receipt
  receiptHeader: string;
  receiptFooter: string;
  showTaxOnReceipt: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setQuickAdd: (enabled: boolean) => void;
  setSound: (enabled: boolean) => void;
  setPrintReceipt: (enabled: boolean) => void;
  setShowStockWarnings: (enabled: boolean) => void;
  setLowStockThreshold: (threshold: number) => void;
  setCompactMode: (enabled: boolean) => void;
  setShowProductImages: (enabled: boolean) => void;
  setGridColumns: (columns: 3 | 4 | 5 | 6) => void;
  setReceiptHeader: (header: string) => void;
  setReceiptFooter: (footer: string) => void;
  setShowTaxOnReceipt: (show: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  theme: 'system' as const,
  quickAddEnabled: true,
  soundEnabled: true,
  printReceipt: true,
  showStockWarnings: true,
  lowStockThreshold: 10,
  compactMode: false,
  showProductImages: true,
  gridColumns: 4 as const,
  receiptHeader: 'Thank you for shopping with us!',
  receiptFooter: 'Powered by WarehousePOS',
  showTaxOnReceipt: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      setTheme: (theme) => set({ theme }),
      setQuickAdd: (quickAddEnabled) => set({ quickAddEnabled }),
      setSound: (soundEnabled) => set({ soundEnabled }),
      setPrintReceipt: (printReceipt) => set({ printReceipt }),
      setShowStockWarnings: (showStockWarnings) => set({ showStockWarnings }),
      setLowStockThreshold: (lowStockThreshold) => set({ lowStockThreshold }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setShowProductImages: (showProductImages) => set({ showProductImages }),
      setGridColumns: (gridColumns) => set({ gridColumns }),
      setReceiptHeader: (receiptHeader) => set({ receiptHeader }),
      setReceiptFooter: (receiptFooter) => set({ receiptFooter }),
      setShowTaxOnReceipt: (showTaxOnReceipt) => set({ showTaxOnReceipt }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'warehousepos-settings',
    }
  )
);

// Apply theme on load
const applyTheme = () => {
  const settings = useSettingsStore.getState();
  const root = document.documentElement;
  
  if (settings.theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', settings.theme === 'dark');
  }
};

// Listen for theme changes
if (typeof window !== 'undefined') {
  useSettingsStore.subscribe(() => {
    applyTheme();
  });
  
  // Apply initial theme
  applyTheme();
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useSettingsStore.getState().theme === 'system') {
      applyTheme();
    }
  });
}
