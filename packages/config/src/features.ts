// ============================================
// FEATURE FLAGS
// Control feature availability across apps
// ============================================

export interface FeatureFlags {
  // Core features
  OFFLINE_MODE: boolean;
  MULTI_STORE: boolean;
  MULTI_CURRENCY: boolean;
  
  // POS features
  BARCODE_SCANNER: boolean;
  RECEIPT_PRINTING: boolean;
  CUSTOMER_DISPLAY: boolean;
  CASH_DRAWER: boolean;
  
  // Customer features
  LOYALTY_PROGRAM: boolean;
  CREDIT_MANAGEMENT: boolean;
  CUSTOMER_PORTAL: boolean;
  
  // Communication
  SMS_NOTIFICATIONS: boolean;
  WHATSAPP_NOTIFICATIONS: boolean;
  EMAIL_NOTIFICATIONS: boolean;
  PUSH_NOTIFICATIONS: boolean;
  
  // Payment
  MOBILE_MONEY: boolean;
  CARD_PAYMENTS: boolean;
  BANK_TRANSFER: boolean;
  SPLIT_PAYMENTS: boolean;
  
  // Delivery
  DELIVERY_MANAGEMENT: boolean;
  LIVE_TRACKING: boolean;
  ZONE_PRICING: boolean;
  
  // Online
  ONLINE_ORDERING: boolean;
  VENDOR_PORTAL: boolean;
  
  // Integrations
  ACCOUNTING_SYNC: boolean;
  API_ACCESS: boolean;
  WEBHOOKS: boolean;
  
  // Advanced
  ADVANCED_REPORTS: boolean;
  INVENTORY_FORECASTING: boolean;
  AI_INSIGHTS: boolean;
}

// Default feature flags (all disabled for safe rollout)
export const defaultFeatures: FeatureFlags = {
  // Core - enabled by default
  OFFLINE_MODE: true,
  MULTI_STORE: false,
  MULTI_CURRENCY: false,
  
  // POS
  BARCODE_SCANNER: true,
  RECEIPT_PRINTING: true,
  CUSTOMER_DISPLAY: false,
  CASH_DRAWER: false,
  
  // Customer
  LOYALTY_PROGRAM: false,
  CREDIT_MANAGEMENT: true,
  CUSTOMER_PORTAL: false,
  
  // Communication
  SMS_NOTIFICATIONS: false,
  WHATSAPP_NOTIFICATIONS: false,
  EMAIL_NOTIFICATIONS: false,
  PUSH_NOTIFICATIONS: false,
  
  // Payment
  MOBILE_MONEY: true,
  CARD_PAYMENTS: true,
  BANK_TRANSFER: true,
  SPLIT_PAYMENTS: false,
  
  // Delivery
  DELIVERY_MANAGEMENT: false,
  LIVE_TRACKING: false,
  ZONE_PRICING: false,
  
  // Online
  ONLINE_ORDERING: false,
  VENDOR_PORTAL: false,
  
  // Integrations
  ACCOUNTING_SYNC: false,
  API_ACCESS: false,
  WEBHOOKS: false,
  
  // Advanced
  ADVANCED_REPORTS: false,
  INVENTORY_FORECASTING: false,
  AI_INSIGHTS: false,
};

// Features by plan
export const planFeatures: Record<string, Partial<FeatureFlags>> = {
  free: {
    OFFLINE_MODE: true,
    BARCODE_SCANNER: true,
    RECEIPT_PRINTING: true,
    MOBILE_MONEY: true,
    CARD_PAYMENTS: true,
    BANK_TRANSFER: true,
  },
  
  starter: {
    ...defaultFeatures,
    SMS_NOTIFICATIONS: true,
    CREDIT_MANAGEMENT: true,
    ADVANCED_REPORTS: true,
  },
  
  business: {
    ...defaultFeatures,
    MULTI_STORE: true,
    SMS_NOTIFICATIONS: true,
    WHATSAPP_NOTIFICATIONS: true,
    EMAIL_NOTIFICATIONS: true,
    DELIVERY_MANAGEMENT: true,
    LIVE_TRACKING: true,
    ONLINE_ORDERING: true,
    VENDOR_PORTAL: true,
    ADVANCED_REPORTS: true,
  },
  
  enterprise: {
    OFFLINE_MODE: true,
    MULTI_STORE: true,
    MULTI_CURRENCY: true,
    BARCODE_SCANNER: true,
    RECEIPT_PRINTING: true,
    CUSTOMER_DISPLAY: true,
    CASH_DRAWER: true,
    LOYALTY_PROGRAM: true,
    CREDIT_MANAGEMENT: true,
    CUSTOMER_PORTAL: true,
    SMS_NOTIFICATIONS: true,
    WHATSAPP_NOTIFICATIONS: true,
    EMAIL_NOTIFICATIONS: true,
    PUSH_NOTIFICATIONS: true,
    MOBILE_MONEY: true,
    CARD_PAYMENTS: true,
    BANK_TRANSFER: true,
    SPLIT_PAYMENTS: true,
    DELIVERY_MANAGEMENT: true,
    LIVE_TRACKING: true,
    ZONE_PRICING: true,
    ONLINE_ORDERING: true,
    VENDOR_PORTAL: true,
    ACCOUNTING_SYNC: true,
    API_ACCESS: true,
    WEBHOOKS: true,
    ADVANCED_REPORTS: true,
    INVENTORY_FORECASTING: true,
    AI_INSIGHTS: true,
  },
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof FeatureFlags,
  tenantFeatures?: Partial<FeatureFlags>
): boolean {
  if (tenantFeatures && feature in tenantFeatures) {
    return tenantFeatures[feature] ?? false;
  }
  return defaultFeatures[feature];
}

/**
 * Get all enabled features for a plan
 */
export function getFeaturesForPlan(planSlug: string): Partial<FeatureFlags> {
  return planFeatures[planSlug] || planFeatures.free;
}
