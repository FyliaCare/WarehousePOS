// ============================================
// THEME CONFIGURATION
// Design system tokens for WarehousePOS
// UNIFIED THEME: Green, Gold, Black & White
// For Ghana 🇬🇭 and Nigeria 🇳🇬
// ============================================

export const theme = {
  colors: {
    // Primary Brand - Green
    primary: {
      DEFAULT: '#059669',
      light: '#10b981',
      dark: '#047857',
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },

    // Accent - Gold
    gold: {
      DEFAULT: '#D4AF37',
      light: '#E5C76B',
      dark: '#B8960C',
      50: '#FDF9E7',
      100: '#FCF3CF',
      200: '#F9E79F',
      300: '#F5DB6E',
      400: '#E5C76B',
      500: '#D4AF37',
      600: '#B8960C',
      700: '#9A7D0A',
      800: '#7D6608',
      900: '#5F4E06',
    },

    // Neutral - Black & White
    black: '#0f172a',
    white: '#ffffff',

    // Semantic
    success: {
      DEFAULT: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      DEFAULT: '#D4AF37',
      light: '#E5C76B',
      dark: '#B8960C',
    },
    error: {
      DEFAULT: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      DEFAULT: '#059669',
      light: '#10b981',
      dark: '#047857',
    },
  },

  fonts: {
    sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
};

// CSS Variables for runtime theme switching
export const cssVariables = {
  light: {
    '--background': '0 0% 100%',
    '--foreground': '222 47% 11%',
    '--card': '0 0% 100%',
    '--card-foreground': '222 47% 11%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222 47% 11%',
    '--primary': '160 84% 39%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '152 76% 97%',
    '--secondary-foreground': '160 84% 39%',
    '--muted': '210 40% 96%',
    '--muted-foreground': '215 16% 47%',
    '--accent': '43 74% 49%',
    '--accent-foreground': '222 47% 11%',
    '--destructive': '0 84% 60%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '214 32% 91%',
    '--input': '214 32% 91%',
    '--ring': '160 84% 39%',
    '--radius': '0.5rem',
  },
  dark: {
    '--background': '222 47% 6%',
    '--foreground': '210 40% 98%',
    '--card': '222 47% 9%',
    '--card-foreground': '210 40% 98%',
    '--popover': '222 47% 9%',
    '--popover-foreground': '210 40% 98%',
    '--primary': '160 84% 45%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '217 33% 15%',
    '--secondary-foreground': '210 40% 98%',
    '--muted': '217 33% 15%',
    '--muted-foreground': '215 20% 55%',
    '--accent': '43 74% 49%',
    '--accent-foreground': '222 47% 11%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '217 33% 17%',
    '--input': '217 33% 17%',
    '--ring': '160 84% 45%',
    '--radius': '0.5rem',
  },
};
