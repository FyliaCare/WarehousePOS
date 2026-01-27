/**
 * Paystack Payment Integration for Vendor Portal
 *
 * Handles:
 * - Subscription billing (monthly/yearly)
 * - Transaction verification
 * - Mobile Money payments
 */

import { supabase } from "./supabase";

// ============================================
// TYPES
// ============================================

export type Currency = "GHS" | "NGN" | "USD" | "ZAR" | "KES";
export type BillingCycle = "monthly" | "yearly";
export type PaymentPurpose = "subscription" | "credits" | "order" | "addon";

export interface PaystackInitializeOptions {
  email: string;
  amount: number; // In kobo/pesewas (smallest currency unit)
  currency?: Currency;
  reference?: string;
  callback_url?: string;
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
    [key: string]: any;
  };
  channels?: (
    | "card"
    | "bank"
    | "ussd"
    | "qr"
    | "mobile_money"
    | "bank_transfer"
  )[];
}

export interface SubscriptionPaymentOptions {
  email: string;
  planId: string;
  planSlug: string;
  planName: string;
  amount: number;
  billingCycle: BillingCycle;
  currency: Currency;
  tenantId: string;
  userId: string;
}

export interface PaystackTransaction {
  reference: string;
  status: "success" | "failed" | "abandoned" | "pending";
  message: string;
  transaction?: string;
  trxref?: string;
  amount?: number;
  currency?: string;
  paid_at?: string;
  channel?: string;
}

export interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    channel: string;
    customer: {
      email: string;
      phone: string | null;
    };
    metadata?: Record<string, any>;
  };
}

// ============================================
// UTILITIES
// ============================================

/**
 * Generate a unique transaction reference
 */
export function generateReference(prefix: string = "TXN"): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`.toUpperCase();
}

/**
 * Convert amount to smallest currency unit (kobo/pesewas)
 */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert from smallest currency unit to main unit
 */
export function fromSmallestUnit(amount: number): number {
  return amount / 100;
}

// ============================================
// PAYSTACK POPUP INTEGRATION
// ============================================

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: any) => {
        openIframe: () => void;
      };
    };
  }
}

/**
 * Load Paystack script if not already loaded
 */
export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script"));
    document.body.appendChild(script);
  });
}

/**
 * Initialize and open Paystack payment popup
 */
export async function initializePayment(
  options: PaystackInitializeOptions & {
    publicKey: string;
    onSuccess: (response: PaystackTransaction) => void;
    onClose: () => void;
  },
): Promise<void> {
  await loadPaystackScript();

  if (!window.PaystackPop) {
    throw new Error("Paystack script not loaded");
  }

  const reference = options.reference || generateReference();

  const handler = window.PaystackPop.setup({
    key: options.publicKey,
    email: options.email,
    amount: options.amount, // Already in smallest unit
    currency: options.currency || "GHS",
    ref: reference,
    callback: (response: PaystackTransaction) => {
      options.onSuccess({
        ...response,
        reference: reference,
      });
    },
    onClose: options.onClose,
    metadata: options.metadata,
    channels: options.channels,
  });

  handler.openIframe();
}

// ============================================
// DEFAULT CONFIG
// ============================================

/**
 * Get Paystack public key from environment or settings
 */
export function getPaystackPublicKey(): string | null {
  // Check for environment variable
  if (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
    return import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  }

  // Return null if not configured - will be checked at runtime
  return null;
}

/**
 * Check if Paystack is configured
 */
export function isPaystackConfigured(): boolean {
  return !!getPaystackPublicKey();
}

// ============================================
// SUBSCRIPTION PAYMENT FUNCTIONS
// ============================================

/**
 * Initialize subscription payment via Paystack
 */
export async function initializeSubscriptionPayment(
  options: SubscriptionPaymentOptions,
  callbacks: {
    onSuccess: (response: PaystackTransaction) => void;
    onClose: () => void;
  },
): Promise<void> {
  const publicKey = getPaystackPublicKey();
  if (!publicKey) {
    throw new Error(
      "Paystack is not configured. Please set VITE_PAYSTACK_PUBLIC_KEY",
    );
  }

  const reference = generateReference("SUB");

  // Store pending payment in database
  try {
    await supabase.from("payment_transactions").insert({
      reference,
      user_id: options.userId,
      tenant_id: options.tenantId,
      purpose: "subscription",
      amount: options.amount,
      currency: options.currency,
      status: "pending",
      metadata: {
        plan_slug: options.planSlug,
        plan_id: options.planId,
        plan_name: options.planName,
        billing_cycle: options.billingCycle,
      },
    });
  } catch (err) {
    console.warn("Could not store pending transaction:", err);
    // Continue anyway - webhook will handle it
  }

  // Initialize Paystack payment
  await initializePayment({
    publicKey,
    email: options.email,
    amount: toSmallestUnit(options.amount),
    currency: options.currency,
    reference,
    metadata: {
      purpose: "subscription",
      plan_slug: options.planSlug,
      plan_id: options.planId,
      billing_cycle: options.billingCycle,
      tenant_id: options.tenantId,
      user_id: options.userId,
      custom_fields: [
        {
          display_name: "Plan",
          variable_name: "plan",
          value: options.planName,
        },
        {
          display_name: "Billing Cycle",
          variable_name: "billing",
          value: options.billingCycle === "yearly" ? "Yearly" : "Monthly",
        },
      ],
    },
    channels: ["card", "mobile_money", "bank_transfer"],
    onSuccess: callbacks.onSuccess,
    onClose: callbacks.onClose,
  });
}

// ============================================
// PAYMENT VERIFICATION & PROCESSING
// ============================================

/**
 * Process successful payment (called after Paystack callback)
 * This activates the subscription after successful payment
 */
export async function processSubscriptionPaymentSuccess(
  reference: string,
  tenantId: string,
  planId: string,
  billingCycle: BillingCycle,
  amount: number,
  currency: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Update payment transaction status
    await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    // Get plan details for locked pricing
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("price_monthly, price_yearly, slug")
      .eq("id", planId)
      .single();

    // Check if subscription exists
    const { data: existingSub } = await supabase
      .from("tenant_subscriptions")
      .select("id, has_used_trial")
      .eq("tenant_id", tenantId)
      .single();

    if (existingSub) {
      // Update existing subscription
      await supabase
        .from("tenant_subscriptions")
        .update({
          plan_id: planId,
          status: "active",
          billing_cycle: billingCycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          locked_price_monthly: plan?.price_monthly,
          locked_price_yearly: plan?.price_yearly,
          canceled_at: null,
          cancel_at_period_end: false,
          // Track plan changes
          last_plan_change_at: now.toISOString(),
          has_used_trial: true, // Once paid, trial is considered used
          // Clear trial fields since they paid
          trial_started_at: null,
          trial_ends_at: null,
        })
        .eq("tenant_id", tenantId);
    } else {
      // Create new subscription
      await supabase.from("tenant_subscriptions").insert({
        tenant_id: tenantId,
        plan_id: planId,
        status: "active",
        billing_cycle: billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        locked_price_monthly: plan?.price_monthly,
        locked_price_yearly: plan?.price_yearly,
        // Track plan changes
        last_plan_change_at: now.toISOString(),
        has_used_trial: true, // Paying = no more trial
        plan_changes_this_month: 1,
      });
    }

    // Update tenant
    await supabase
      .from("tenants")
      .update({
        subscription_status: "active",
        subscription_tier: plan?.slug,
        subscription_ends_at: periodEnd.toISOString(),
      })
      .eq("id", tenantId);

    // Create invoice
    const invoiceNumber = `INV-${Date.now()}`;
    await supabase.from("billing_invoices").insert({
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      status: "paid",
      subtotal: amount,
      total: amount,
      amount_paid: amount,
      amount_due: 0,
      currency: currency,
      invoice_date: new Date().toISOString().split("T")[0],
      paid_at: new Date().toISOString(),
      paystack_reference: reference,
    });

    return { success: true, message: "Subscription activated successfully" };
  } catch (error: any) {
    console.error("Error processing subscription payment:", error);
    return {
      success: false,
      message: error.message || "Failed to activate subscription",
    };
  }
}

// ============================================
// BILLING REMINDER HELPERS
// ============================================

/**
 * Calculate days until billing
 */
export function getDaysUntilBilling(periodEnd: string | null): number {
  if (!periodEnd) return -1;

  const endDate = new Date(periodEnd);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if billing reminder should be shown (7 days before)
 */
export function shouldShowBillingReminder(periodEnd: string | null): boolean {
  const daysUntil = getDaysUntilBilling(periodEnd);
  return daysUntil >= 0 && daysUntil <= 7;
}

/**
 * Format billing reminder message
 */
export function getBillingReminderMessage(
  periodEnd: string | null,
  amount: number,
  currency: string,
): string {
  const daysUntil = getDaysUntilBilling(periodEnd);

  if (daysUntil === 0) {
    return `Your subscription renews today. You will be charged ${formatCurrency(amount, currency)}.`;
  } else if (daysUntil === 1) {
    return `Your subscription renews tomorrow. You will be charged ${formatCurrency(amount, currency)}.`;
  } else {
    return `Your subscription renews in ${daysUntil} days. You will be charged ${formatCurrency(amount, currency)}.`;
  }
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    GHS: "GH₵",
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
}
