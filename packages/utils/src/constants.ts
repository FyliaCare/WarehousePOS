import type { CountryCode } from '@warehousepos/types';

// ============================================
// CONSTANTS
// Ghana & Nigeria focused
// ============================================

// ==========================================
// COUNTRY CONFIGURATION
// ==========================================

export const COUNTRIES: Record<CountryCode, {
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  dialCode: string;
  timezone: string;
  taxRate: number;
  smsProvider: 'mnotify' | 'termii';
}> = {
  GH: {
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    currencySymbol: '₵',
    dialCode: '+233',
    timezone: 'Africa/Accra',
    taxRate: 15,
    smsProvider: 'mnotify',
  },
  NG: {
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    dialCode: '+234',
    timezone: 'Africa/Lagos',
    taxRate: 7.5,
    smsProvider: 'termii',
  },
};

// ==========================================
// PAYMENT METHODS
// ==========================================

export const PAYMENT_METHODS = {
  cash: { label: 'Cash', icon: 'Banknote' },
  card: { label: 'Card', icon: 'CreditCard' },
  momo: { label: 'Mobile Money', icon: 'Smartphone' },
  transfer: { label: 'Bank Transfer', icon: 'Building' },
  credit: { label: 'Credit', icon: 'Receipt' },
} as const;

export const MOMO_PROVIDERS: Record<CountryCode, { id: string; name: string }[]> = {
  GH: [
    { id: 'mtn', name: 'MTN Mobile Money' },
    { id: 'vodafone', name: 'Vodafone Cash' },
    { id: 'airteltigo', name: 'AirtelTigo Money' },
  ],
  NG: [
    { id: 'opay', name: 'OPay' },
    { id: 'palmpay', name: 'PalmPay' },
  ],
};

// ==========================================
// ORDER/SALE STATUS
// ==========================================

export const SALE_STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  completed: { label: 'Completed', color: 'green' },
  voided: { label: 'Voided', color: 'red' },
  refunded: { label: 'Refunded', color: 'orange' },
} as const;

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'yellow', description: 'Waiting for confirmation' },
  confirmed: { label: 'Confirmed', color: 'blue', description: 'Order accepted' },
  preparing: { label: 'Preparing', color: 'purple', description: 'Being prepared' },
  ready: { label: 'Ready', color: 'cyan', description: 'Ready for pickup/delivery' },
  out_for_delivery: { label: 'Out for Delivery', color: 'indigo', description: 'On the way' },
  delivered: { label: 'Delivered', color: 'green', description: 'Successfully delivered' },
  cancelled: { label: 'Cancelled', color: 'red', description: 'Order cancelled' },
} as const;

export const DELIVERY_STATUSES = {
  assigned: { label: 'Assigned', color: 'yellow' },
  accepted: { label: 'Accepted', color: 'blue' },
  picked_up: { label: 'Picked Up', color: 'purple' },
  in_transit: { label: 'In Transit', color: 'indigo' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
} as const;

// ==========================================
// USER ROLES
// ==========================================

export const USER_ROLES = {
  owner: { label: 'Owner', description: 'Full access to everything', level: 4 },
  manager: { label: 'Manager', description: 'Manage store operations', level: 3 },
  cashier: { label: 'Cashier', description: 'Handle sales and customers', level: 2 },
  rider: { label: 'Rider', description: 'Delivery personnel', level: 1 },
} as const;

// ==========================================
// PRODUCT UNITS
// ==========================================

export const PRODUCT_UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'carton', label: 'Carton' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'bag', label: 'Bag' },
  { value: 'roll', label: 'Roll' },
] as const;

// ==========================================
// SUBSCRIPTION FEATURES
// ==========================================

export const FEATURES = {
  BASIC_POS: 'basic_pos',
  FULL_POS: 'full_pos',
  INVENTORY: 'inventory',
  CUSTOMERS: 'customers',
  REPORTS: 'reports',
  ADVANCED_REPORTS: 'advanced_reports',
  MULTI_STORE: 'multi_store',
  ONLINE_ORDERING: 'online_ordering',
  DELIVERY: 'delivery',
  SMS_NOTIFICATIONS: 'sms_notifications',
  WHATSAPP_NOTIFICATIONS: 'whatsapp_notifications',
  API_ACCESS: 'api_access',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
} as const;

// ==========================================
// COLORS (for categories, tags, etc.)
// ==========================================

export const CATEGORY_COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#22c55e', label: 'Green' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#d946ef', label: 'Fuchsia' },
  { value: '#ec4899', label: 'Pink' },
] as const;

// ==========================================
// APP ROUTES
// ==========================================

export const POS_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  POS: '/pos',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  STOCK: '/stock',
  CUSTOMERS: '/customers',
  SALES: '/sales',
  ORDERS: '/orders',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const DELIVERY_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  RIDERS: '/riders',
  ASSIGNMENTS: '/assignments',
  TRACKING: '/tracking',
  ZONES: '/zones',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const PORTAL_ROUTES = {
  HOME: '/',
  CATALOG: '/catalog',
  PRODUCT: '/product/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER: '/order/:id',
  ACCOUNT: '/account',
} as const;

export const ADMIN_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TENANTS: '/tenants',
  SUBSCRIPTIONS: '/subscriptions',
  SUPPORT: '/support',
  ANALYTICS: '/analytics',
  SYSTEM: '/system',
  SETTINGS: '/settings',
} as const;

// ==========================================
// API ENDPOINTS (relative paths)
// ==========================================

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_VERIFY_OTP: '/auth/verify-otp',
  AUTH_LOGOUT: '/auth/logout',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT: (id: string) => `/products/${id}`,
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY: (id: string) => `/categories/${id}`,
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER: (id: string) => `/customers/${id}`,
  
  // Sales
  SALES: '/sales',
  SALE: (id: string) => `/sales/${id}`,
  
  // Orders
  ORDERS: '/orders',
  ORDER: (id: string) => `/orders/${id}`,
  
  // Stock
  STOCK: '/stock',
  STOCK_ADJUSTMENT: '/stock/adjustment',
  
  // Riders
  RIDERS: '/riders',
  RIDER: (id: string) => `/riders/${id}`,
  
  // Reports
  REPORTS_SALES: '/reports/sales',
  REPORTS_INVENTORY: '/reports/inventory',
  REPORTS_CUSTOMERS: '/reports/customers',
} as const;

// ==========================================
// LIMITS & DEFAULTS
// ==========================================

export const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  PIN_LENGTH: 4,
  MAX_RETRY_ATTEMPTS: 3,
  SYNC_INTERVAL_MS: 30000, // 30 seconds
  LOW_STOCK_THRESHOLD: 10,
  MAX_CART_ITEMS: 100,
  MAX_IMAGE_SIZE_MB: 5,
  RECEIPT_WIDTH: 80, // mm
} as const;
