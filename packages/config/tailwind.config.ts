import type { Config } from 'tailwindcss';

// Shared Tailwind configuration for all WarehousePOS apps
const config: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // 🇬🇭 Ghana Theme - Gold & Black (Luxurious, Premium)
        'ghana-gold': {
          DEFAULT: '#D4AF37',
          50: '#FDF8E8',
          100: '#FAF0CC',
          200: '#F5E19A',
          300: '#EFD168',
          400: '#E9C236',
          500: '#D4AF37',
          600: '#B8962D',
          700: '#8A7022',
          800: '#5C4B17',
          900: '#2E250B',
        },
        'ghana-black': {
          DEFAULT: '#1A1A1A',
          50: '#F5F5F5',
          100: '#E0E0E0',
          200: '#B3B3B3',
          300: '#808080',
          400: '#4D4D4D',
          500: '#333333',
          600: '#262626',
          700: '#1A1A1A',
          800: '#0D0D0D',
          900: '#000000',
        },
        // 🇳🇬 Nigeria Theme - Green & Black (Bold, Strong)
        'nigeria-green': {
          DEFAULT: '#008751',
          50: '#E6F5EE',
          100: '#CCF0E0',
          200: '#99E0C1',
          300: '#66D1A2',
          400: '#33C183',
          500: '#008751',
          600: '#006B41',
          700: '#005031',
          800: '#003620',
          900: '#001B10',
        },
        'nigeria-black': {
          DEFAULT: '#1A1A1A',
          50: '#F5F5F5',
          100: '#E0E0E0',
          200: '#B3B3B3',
          300: '#808080',
          400: '#4D4D4D',
          500: '#333333',
          600: '#262626',
          700: '#1A1A1A',
          800: '#0D0D0D',
          900: '#000000',
        },
        // Success, Warning, Error colors
        success: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        error: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        display: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'glow-green': '0 0 20px rgba(0, 135, 81, 0.3)',
        'glow-sm': '0 0 10px rgba(var(--primary), 0.2)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'card-hover': '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
        'elegant': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'elegant-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #F5E19A 50%, #D4AF37 100%)',
        'gradient-gold-dark': 'linear-gradient(135deg, #1A1A1A 0%, #2E250B 50%, #1A1A1A 100%)',
        'gradient-green': 'linear-gradient(135deg, #008751 0%, #00B36B 50%, #008751 100%)',
        'gradient-green-dark': 'linear-gradient(135deg, #1A1A1A 0%, #001B10 50%, #1A1A1A 100%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        'mesh-ghana': 'radial-gradient(at 40% 20%, rgba(212, 175, 55, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(212, 175, 55, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(212, 175, 55, 0.05) 0px, transparent 50%)',
        'mesh-nigeria': 'radial-gradient(at 40% 20%, rgba(0, 135, 81, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0, 135, 81, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(0, 135, 81, 0.05) 0px, transparent 50%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(var(--primary), 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(var(--primary), 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'spin-slow': 'spin-slow 3s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
