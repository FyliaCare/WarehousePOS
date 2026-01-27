import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  initializeSubscriptionPayment,
  processSubscriptionPaymentSuccess,
  getDaysUntilBilling,
  shouldShowBillingReminder,
  getBillingReminderMessage,
  isPaystackConfigured,
  type PaystackTransaction,
} from "../../lib/paystack";
import {
  CreditCard,
  Check,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Calendar,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Receipt,
  Download,
  Shield,
  Star,
  Sparkles,
  TrendingUp,
  Package,
  Users,
  Database,
  BarChart3,
  Globe,
  Headphones,
  Loader2,
  RefreshCw,
  Crown,
  BadgeCheck,
  Plus,
  Minus,
  X,
  Info,
  Settings,
  ExternalLink,
  Wallet,
  Phone,
  Building,
  Trash2,
  Edit3,
  CheckCircle,
  Smartphone,
  Bell,
} from "lucide-react";

// ============================================
// TYPES (Matching main POS app)
// ============================================

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_products: number;
  max_sales_per_month: number;
  max_team_members: number;
  max_customers: number;
  max_suppliers: number;
  max_locations: number;
  storage_limit_mb: number;
  api_calls_per_day: number;
  features: Record<string, boolean | number | string>;
  icon: string | null;
  color: string | null;
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
  is_public: boolean;
}

interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "expired"
    | "paused";
  billing_cycle: "monthly" | "yearly";
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  usage_products: number;
  usage_sales: number;
  usage_api_calls: number;
  usage_storage_mb: number;
  locked_price_monthly: number | null;
  locked_price_yearly: number | null;
  discount_percent: number;
  coupon_code: string | null;
  plan?: SubscriptionPlan;
  // Plan change tracking
  last_plan_change_at: string | null;
  plan_changes_this_month: number;
  has_used_trial: boolean;
}

interface BillingInvoice {
  id: string;
  invoice_number: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  invoice_date: string;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  pdf_url: string | null;
}

interface SubscriptionAddon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  price_per_unit: number | null;
  unit_name: string | null;
}

interface PaymentMethod {
  id: string;
  method_type: "card" | "bank_account" | "mobile_money";
  is_default: boolean;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  mobile_provider: string | null;
  mobile_number_last4: string | null;
}

// ============================================
// COMPONENT
// ============================================

export function SubscriptionPage() {
  const { user, tenant } = useOutletContext<{ user: any; tenant: any }>();

  // State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [addons, setAddons] = useState<SubscriptionAddon[]>([]);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(
    null,
  );
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Loading states
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI State
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [activeTab, setActiveTab] = useState<
    "plans" | "usage" | "invoices" | "payment"
  >("plans");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [showPlanDetails, setShowPlanDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Payment Method Modal States
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [paymentMethodType, setPaymentMethodType] = useState<
    "card" | "mobile_money"
  >("mobile_money");

  // Payment Form States
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    setAsDefault: false,
  });

  const [mobileMoneyForm, setMobileMoneyForm] = useState({
    provider: "MTN Mobile Money",
    phoneNumber: "",
    accountName: "",
    setAsDefault: false,
  });

  // Mobile Money providers for Ghana
  const mobileMoneyProviders = [
    { id: "mtn", name: "MTN Mobile Money", color: "bg-yellow-500" },
    { id: "vodafone", name: "Vodafone Cash", color: "bg-red-500" },
    { id: "airteltigo", name: "AirtelTigo Money", color: "bg-blue-500" },
  ];

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchPlans();
    fetchAddons();
    if (tenant?.id) {
      fetchSubscription();
      fetchInvoices();
      fetchPaymentMethods();
    }
  }, [tenant?.id]);

  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError("Failed to load plans");
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchAddons = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_addons")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error && error.code !== "PGRST116") throw error;
      setAddons(data || []);
    } catch (err) {
      console.error("Error fetching addons:", err);
    }
  };

  const fetchSubscription = async () => {
    if (!tenant?.id) return;
    setIsLoadingSubscription(true);
    try {
      const { data, error } = await supabase
        .from("tenant_subscriptions")
        .select(
          `
          *,
          plan:subscription_plans(*)
        `,
        )
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setSubscription(data);

      // Set billing cycle from subscription
      if (data?.billing_cycle) {
        setBillingCycle(data.billing_cycle);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const fetchInvoices = async () => {
    if (!tenant?.id) return;
    setIsLoadingInvoices(true);
    try {
      const { data, error } = await supabase
        .from("billing_invoices")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("invoice_date", { ascending: false })
        .limit(20);

      if (error && error.code !== "PGRST116") throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!tenant?.id) return;
    try {
      const { data, error } = await supabase
        .from("tenant_payment_methods")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false });

      if (error && error.code !== "PGRST116") throw error;
      setPaymentMethods(data || []);
    } catch (err) {
      console.error("Error fetching payment methods:", err);
    }
  };

  // ============================================
  // PAYMENT METHOD ACTIONS
  // ============================================

  const resetPaymentForms = () => {
    setCardForm({
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      setAsDefault: false,
    });
    setMobileMoneyForm({
      provider: "MTN Mobile Money",
      phoneNumber: "",
      accountName: "",
      setAsDefault: false,
    });
  };

  const handleAddPaymentMethod = async () => {
    if (!tenant?.id) return;

    setIsProcessing(true);
    setError(null);

    try {
      let paymentData: any = {
        tenant_id: tenant.id,
        method_type: paymentMethodType,
        is_active: true,
        is_default:
          paymentMethodType === "card"
            ? cardForm.setAsDefault
            : mobileMoneyForm.setAsDefault,
        created_at: new Date().toISOString(),
      };

      if (paymentMethodType === "card") {
        // Validate card form
        if (
          !cardForm.cardNumber ||
          !cardForm.cardholderName ||
          !cardForm.expiryMonth ||
          !cardForm.expiryYear
        ) {
          throw new Error("Please fill in all card details");
        }

        // Determine card brand from number
        const cardBrand = getCardBrand(cardForm.cardNumber);

        paymentData = {
          ...paymentData,
          card_brand: cardBrand,
          card_last4: cardForm.cardNumber.slice(-4),
          card_exp_month: parseInt(cardForm.expiryMonth),
          card_exp_year: parseInt(cardForm.expiryYear),
        };
      } else {
        // Mobile money
        if (!mobileMoneyForm.phoneNumber || !mobileMoneyForm.accountName) {
          throw new Error("Please fill in all mobile money details");
        }

        paymentData = {
          ...paymentData,
          mobile_provider: mobileMoneyForm.provider,
          mobile_number_last4: mobileMoneyForm.phoneNumber.slice(-4),
        };
      }

      // If setting as default, update other methods first
      if (paymentData.is_default) {
        await supabase
          .from("tenant_payment_methods")
          .update({ is_default: false })
          .eq("tenant_id", tenant.id);
      }

      const { error } = await supabase
        .from("tenant_payment_methods")
        .insert(paymentData);

      if (error) throw error;

      // Refresh payment methods
      await fetchPaymentMethods();

      // Close modal and reset form
      setShowAddPaymentModal(false);
      resetPaymentForms();
    } catch (err: any) {
      console.error("Error adding payment method:", err);
      setError(err.message || "Failed to add payment method");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    if (!tenant?.id) return;

    setIsProcessing(true);
    setError(null);

    try {
      // First, remove default from all methods
      await supabase
        .from("tenant_payment_methods")
        .update({ is_default: false })
        .eq("tenant_id", tenant.id);

      // Then set the selected one as default
      const { error } = await supabase
        .from("tenant_payment_methods")
        .update({ is_default: true })
        .eq("id", methodId);

      if (error) throw error;

      // Refresh
      await fetchPaymentMethods();
    } catch (err: any) {
      console.error("Error setting default payment method:", err);
      setError(err.message || "Failed to set default payment method");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePaymentMethod = async () => {
    if (!selectedPaymentMethod?.id || !tenant?.id) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from("tenant_payment_methods")
        .update({ is_active: false })
        .eq("id", selectedPaymentMethod.id);

      if (error) throw error;

      // If deleted method was default, set another as default
      if (selectedPaymentMethod.is_default) {
        const remainingMethods = paymentMethods.filter(
          (m) => m.id !== selectedPaymentMethod.id,
        );
        if (remainingMethods.length > 0) {
          await supabase
            .from("tenant_payment_methods")
            .update({ is_default: true })
            .eq("id", remainingMethods[0].id);
        }
      }

      // Refresh and close modal
      await fetchPaymentMethods();
      setShowDeletePaymentModal(false);
      setSelectedPaymentMethod(null);
    } catch (err: any) {
      console.error("Error deleting payment method:", err);
      setError(err.message || "Failed to delete payment method");
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardBrand = (cardNumber: string): string => {
    const cleanNumber = cardNumber.replace(/\s/g, "");
    if (/^4/.test(cleanNumber)) return "visa";
    if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6(?:011|5)/.test(cleanNumber)) return "discover";
    return "card";
  };

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const getProviderColor = (provider: string): string => {
    if (provider.toLowerCase().includes("mtn")) return "bg-yellow-500";
    if (provider.toLowerCase().includes("vodafone")) return "bg-red-500";
    if (provider.toLowerCase().includes("airtel")) return "bg-blue-500";
    return "bg-gray-500";
  };

  const getProviderIcon = (provider: string): string => {
    if (provider.toLowerCase().includes("mtn")) return "🟡";
    if (provider.toLowerCase().includes("vodafone")) return "🔴";
    if (provider.toLowerCase().includes("airtel")) return "🔵";
    return "📱";
  };

  // ============================================
  // SUBSCRIPTION ACTIONS
  // ============================================

  // Check if we should show billing reminder (7 days before renewal)
  const billingReminderInfo = useMemo(() => {
    if (
      !subscription?.current_period_end ||
      subscription.status !== "active" ||
      subscription.cancel_at_period_end
    ) {
      return null;
    }

    const daysUntil = getDaysUntilBilling(subscription.current_period_end);
    const shouldShow = shouldShowBillingReminder(
      subscription.current_period_end,
    );

    if (!shouldShow) return null;

    const currentPlan = plans.find((p) => p.id === subscription.plan_id);
    const amount =
      subscription.billing_cycle === "yearly"
        ? subscription.locked_price_yearly || currentPlan?.price_yearly || 0
        : subscription.locked_price_monthly || currentPlan?.price_monthly || 0;

    return {
      daysUntil,
      amount,
      currency: currentPlan?.currency || "GHS",
      message: getBillingReminderMessage(
        subscription.current_period_end,
        amount,
        currentPlan?.currency || "GHS",
      ),
    };
  }, [subscription, plans]);

  const handleChangePlan = async (newPlan: SubscriptionPlan) => {
    if (!tenant?.id || !user?.email) return;

    setIsProcessing(true);
    setError(null);

    // ============================================
    // SUBSCRIPTION CHANGE RULES & SAFEGUARDS
    // ============================================

    // Rule 1: Can only change plan once per month
    if (subscription?.last_plan_change_at) {
      const lastChange = new Date(subscription.last_plan_change_at);
      const now = new Date();
      const daysSinceLastChange = Math.floor(
        (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastChange < 30) {
        const daysRemaining = 30 - daysSinceLastChange;
        setError(
          `You can only change your plan once per month. Please wait ${daysRemaining} more day${daysRemaining > 1 ? "s" : ""} before changing plans.`,
        );
        setIsProcessing(false);
        return;
      }
    }

    // Rule 2: Cannot switch to the same plan
    if (subscription?.plan_id === newPlan.id) {
      setError("You are already subscribed to this plan.");
      setIsProcessing(false);
      return;
    }

    // Rule 3: Check if user is eligible for trial
    const isNewUser = !subscription || !subscription.has_used_trial;
    const isEligibleForTrial = isNewUser && newPlan.slug !== "free";

    // Rule 4: For downgrades, require payment for remaining period or wait until period end
    const isDowngrade = subscription && isPlanDowngrade(newPlan);

    // Calculate amount (0 for trial, or actual price)
    let amount =
      billingCycle === "yearly" ? newPlan.price_yearly : newPlan.price_monthly;
    let startTrial = false;

    // If eligible for trial, don't charge now
    if (isEligibleForTrial) {
      startTrial = true;
      amount = 0; // No charge during trial
    }

    // Check if Paystack is configured (only needed if charging)
    if (amount > 0 && !isPaystackConfigured()) {
      setError("Payment system is not configured. Please contact support.");
      setIsProcessing(false);
      return;
    }

    try {
      // If starting a trial (no payment needed)
      if (startTrial) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Get plan details
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("price_monthly, price_yearly, slug")
          .eq("id", newPlan.id)
          .single();

        // Create or update subscription with trial
        if (subscription?.id) {
          await supabase
            .from("tenant_subscriptions")
            .update({
              plan_id: newPlan.id,
              status: "trialing",
              billing_cycle: billingCycle,
              trial_started_at: now.toISOString(),
              trial_ends_at: trialEnd.toISOString(),
              locked_price_monthly: plan?.price_monthly,
              locked_price_yearly: plan?.price_yearly,
              last_plan_change_at: now.toISOString(),
              has_used_trial: true,
              canceled_at: null,
              cancel_at_period_end: false,
            })
            .eq("id", subscription.id);
        } else {
          await supabase.from("tenant_subscriptions").insert({
            tenant_id: tenant.id,
            plan_id: newPlan.id,
            status: "trialing",
            billing_cycle: billingCycle,
            trial_started_at: now.toISOString(),
            trial_ends_at: trialEnd.toISOString(),
            locked_price_monthly: plan?.price_monthly,
            locked_price_yearly: plan?.price_yearly,
            last_plan_change_at: now.toISOString(),
            has_used_trial: true,
            plan_changes_this_month: 1,
          });
        }

        // Update tenant
        await supabase
          .from("tenants")
          .update({
            subscription_status: "trialing",
            subscription_tier: plan?.slug,
            subscription_ends_at: trialEnd.toISOString(),
          })
          .eq("id", tenant.id);

        // Refresh data
        await fetchSubscription();
        setShowUpgradeModal(false);
        setSelectedPlan(null);
        setIsProcessing(false);
        return;
      }

      // If payment is required, use Paystack
      await initializeSubscriptionPayment(
        {
          email: user.email,
          planId: newPlan.id,
          planSlug: newPlan.slug,
          planName: newPlan.name,
          amount,
          billingCycle,
          currency: (newPlan.currency || "GHS") as "GHS" | "NGN" | "USD",
          tenantId: tenant.id,
          userId: user.id,
        },
        {
          onSuccess: async (response: PaystackTransaction) => {
            console.log("Payment successful:", response);

            // Process the payment and activate subscription
            const result = await processSubscriptionPaymentSuccess(
              response.reference,
              tenant.id,
              newPlan.id,
              billingCycle,
              amount,
              newPlan.currency || "GHS",
            );

            if (result.success) {
              // Update plan change tracking
              await supabase
                .from("tenant_subscriptions")
                .update({
                  last_plan_change_at: new Date().toISOString(),
                  has_used_trial: true, // Mark trial as used even if they paid
                })
                .eq("tenant_id", tenant.id);

              // Refresh data
              await fetchSubscription();
              await fetchInvoices();
              setShowUpgradeModal(false);
              setSelectedPlan(null);
            } else {
              setError(result.message);
            }
            setIsProcessing(false);
          },
          onClose: () => {
            console.log("Payment popup closed");
            setIsProcessing(false);
          },
        },
      );
    } catch (err) {
      console.error("Error initiating payment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initiate payment",
      );
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async (atPeriodEnd = true) => {
    if (!subscription?.id) return;

    setIsProcessing(true);
    try {
      const updates: Partial<TenantSubscription> = {
        canceled_at: new Date().toISOString(),
      };

      if (atPeriodEnd) {
        updates.cancel_at_period_end = true;
      } else {
        updates.status = "canceled";
      }

      const { error } = await supabase
        .from("tenant_subscriptions")
        .update(updates)
        .eq("id", subscription.id);

      if (error) throw error;

      await fetchSubscription();
      setShowCancelModal(false);
    } catch (err) {
      console.error("Error canceling subscription:", err);
      setError("Failed to cancel subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscription?.id) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("tenant_subscriptions")
        .update({
          canceled_at: null,
          cancel_at_period_end: false,
        })
        .eq("id", subscription.id);

      if (error) throw error;
      await fetchSubscription();
    } catch (err) {
      console.error("Error resuming subscription:", err);
      setError("Failed to resume subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const formatCurrency = (amount: number, currency?: string | null) => {
    // Always default to GHS for Ghana market
    const curr = currency || "GHS";

    // Custom symbol mapping for currencies not well-supported by Intl
    const symbolMap: Record<string, string> = {
      GHS: "GH₵",
      NGN: "₦",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };

    const symbol = symbolMap[curr] || "GH₵";

    // Format the number
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol}${formatted}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = () => {
    if (!subscription?.current_period_end) return 0;
    const end = new Date(subscription.current_period_end);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTrialDaysRemaining = () => {
    if (!subscription?.trial_ends_at) return 0;
    const end = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600 bg-red-100";
    if (percentage >= 75) return "text-amber-600 bg-amber-100";
    return "text-emerald-600 bg-emerald-100";
  };

  const getStatusBadge = (status: TenantSubscription["status"]) => {
    const badges: Record<
      TenantSubscription["status"],
      { label: string; className: string; icon: React.ReactNode }
    > = {
      active: {
        label: "Active",
        className: "bg-emerald-100 text-emerald-700",
        icon: <BadgeCheck className="w-3.5 h-3.5" />,
      },
      trialing: {
        label: "Trial",
        className: "bg-blue-100 text-blue-700",
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      past_due: {
        label: "Past Due",
        className: "bg-red-100 text-red-700",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
      },
      canceled: {
        label: "Canceled",
        className: "bg-gray-100 text-gray-700",
        icon: <X className="w-3.5 h-3.5" />,
      },
      expired: {
        label: "Expired",
        className: "bg-gray-100 text-gray-700",
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      paused: {
        label: "Paused",
        className: "bg-amber-100 text-amber-700",
        icon: <Clock className="w-3.5 h-3.5" />,
      },
    };
    return badges[status] || badges.active;
  };

  const currentPlan = subscription?.plan || null;
  const currentPlanIndex = currentPlan
    ? plans.findIndex((p) => p.id === currentPlan.id)
    : -1;

  const isPlanUpgrade = (plan: SubscriptionPlan) => {
    if (!currentPlan) return true;
    const planIndex = plans.findIndex((p) => p.id === plan.id);
    return planIndex > currentPlanIndex;
  };

  const isPlanDowngrade = (plan: SubscriptionPlan) => {
    if (!currentPlan) return false;
    const planIndex = plans.findIndex((p) => p.id === plan.id);
    return planIndex < currentPlanIndex;
  };

  // Computed values
  const usageStats = useMemo(() => {
    if (!subscription || !currentPlan) {
      return {
        products: { used: 0, limit: 5 },
        sales: { used: 0, limit: 50 },
        staff: { used: 1, limit: 1 },
        storage: { used: 0, limit: 100 },
        apiCalls: { used: 0, limit: 0 },
      };
    }

    return {
      products: {
        used: subscription.usage_products || 0,
        limit:
          currentPlan.max_products === -1
            ? "Unlimited"
            : currentPlan.max_products,
      },
      sales: {
        used: subscription.usage_sales || 0,
        limit:
          currentPlan.max_sales_per_month === -1
            ? "Unlimited"
            : currentPlan.max_sales_per_month,
      },
      staff: {
        used: 1, // Would need to query actual staff count
        limit:
          currentPlan.max_team_members === -1
            ? "Unlimited"
            : currentPlan.max_team_members,
      },
      storage: {
        used: subscription.usage_storage_mb || 0,
        limit: currentPlan.storage_limit_mb,
      },
      apiCalls: {
        used: subscription.usage_api_calls || 0,
        limit:
          currentPlan.api_calls_per_day === -1
            ? "Unlimited"
            : currentPlan.api_calls_per_day,
      },
    };
  }, [subscription, currentPlan]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading subscription...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-500 mt-1">
            Manage your plan, usage, and billing
          </p>
        </div>
        <button
          onClick={() => {
            fetchSubscription();
            fetchPlans();
            fetchInvoices();
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Trial Banner */}
      {subscription?.status === "trialing" && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">You're on a free trial</p>
                <p className="text-blue-100 text-sm">
                  {getTrialDaysRemaining()} days remaining • Ends{" "}
                  {formatDate(subscription.trial_ends_at)}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Cancellation Banner */}
      {subscription?.cancel_at_period_end && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  Subscription Canceling
                </p>
                <p className="text-amber-600 text-sm">
                  Your subscription will end on{" "}
                  {formatDate(subscription.current_period_end || null)}
                </p>
              </div>
            </div>
            <button
              onClick={handleResumeSubscription}
              disabled={isProcessing}
              className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Resume Subscription"}
            </button>
          </div>
        </div>
      )}

      {/* Billing Reminder Banner - 7 days before renewal */}
      {billingReminderInfo && (
        <div
          className={`rounded-xl p-4 border ${
            billingReminderInfo.daysUntil <= 1
              ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                billingReminderInfo.daysUntil <= 1
                  ? "bg-amber-100"
                  : "bg-blue-100"
              }`}
            >
              <Bell
                className={`w-5 h-5 ${
                  billingReminderInfo.daysUntil <= 1
                    ? "text-amber-600"
                    : "text-blue-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <h4
                className={`font-semibold ${
                  billingReminderInfo.daysUntil <= 1
                    ? "text-amber-900"
                    : "text-blue-900"
                }`}
              >
                {billingReminderInfo.daysUntil <= 1
                  ? "Billing Soon"
                  : "Upcoming Renewal"}
              </h4>
              <p
                className={`text-sm mt-0.5 ${
                  billingReminderInfo.daysUntil <= 1
                    ? "text-amber-700"
                    : "text-blue-700"
                }`}
              >
                {billingReminderInfo.message}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={() => setActiveTab("payment")}
                  className={`text-sm font-medium ${
                    billingReminderInfo.daysUntil <= 1
                      ? "text-amber-700 hover:text-amber-800"
                      : "text-blue-700 hover:text-blue-800"
                  }`}
                >
                  Manage payment methods →
                </button>
                <span
                  className={`text-xs ${
                    billingReminderInfo.daysUntil <= 1
                      ? "text-amber-500"
                      : "text-blue-500"
                  }`}
                >
                  Renews {formatDate(subscription?.current_period_end || null)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Overview */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  {currentPlan?.is_popular ? (
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <Crown className="w-5 h-5" />
                  )}
                </div>
                <h2 className="text-2xl font-bold">
                  {currentPlan?.name || "Free"} Plan
                </h2>
                {subscription && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 flex items-center gap-1.5`}
                  >
                    {getStatusBadge(subscription.status).icon}
                    {getStatusBadge(subscription.status).label}
                  </span>
                )}
              </div>
              <p className="text-violet-100">
                {currentPlan ? (
                  <>
                    {formatCurrency(
                      subscription?.billing_cycle === "yearly"
                        ? subscription?.locked_price_yearly ||
                            currentPlan.price_yearly
                        : subscription?.locked_price_monthly ||
                            currentPlan.price_monthly,
                      currentPlan.currency,
                    )}
                    /
                    {subscription?.billing_cycle === "yearly"
                      ? "year"
                      : "month"}
                    {subscription?.discount_percent ? (
                      <span className="ml-2 px-2 py-0.5 bg-emerald-500/30 rounded text-xs">
                        {subscription.discount_percent}% off
                      </span>
                    ) : null}
                  </>
                ) : (
                  "No active subscription"
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-violet-100">
                  {subscription?.status === "trialing"
                    ? "Trial ends"
                    : "Next billing date"}
                </p>
                <p className="font-semibold text-lg">
                  {subscription?.status === "trialing"
                    ? formatDate(subscription?.trial_ends_at ?? null)
                    : formatDate(subscription?.current_period_end ?? null)}
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Usage Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-violet-100 text-sm mb-1">
                <Package className="w-4 h-4" />
                <span>Products</span>
              </div>
              <p className="font-semibold">
                {usageStats.products.used} /{" "}
                {usageStats.products.limit === "Unlimited"
                  ? "∞"
                  : usageStats.products.limit}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-violet-100 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Sales</span>
              </div>
              <p className="font-semibold">
                {usageStats.sales.used} /{" "}
                {usageStats.sales.limit === "Unlimited"
                  ? "∞"
                  : usageStats.sales.limit}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-violet-100 text-sm mb-1">
                <Users className="w-4 h-4" />
                <span>Staff</span>
              </div>
              <p className="font-semibold">
                {usageStats.staff.used} /{" "}
                {usageStats.staff.limit === "Unlimited"
                  ? "∞"
                  : usageStats.staff.limit}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-violet-100 text-sm mb-1">
                <Database className="w-4 h-4" />
                <span>Storage</span>
              </div>
              <p className="font-semibold">
                {usageStats.storage.used} / {usageStats.storage.limit} MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { id: "plans", label: "Plans", icon: Package },
          { id: "usage", label: "Usage", icon: BarChart3 },
          { id: "invoices", label: "Billing History", icon: Receipt },
          { id: "payment", label: "Payment Methods", icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 py-4">
            <span
              className={`text-sm font-medium ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"}`}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "yearly" : "monthly",
                )
              }
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === "yearly" ? "bg-violet-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  billingCycle === "yearly" ? "translate-x-7" : ""
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${billingCycle === "yearly" ? "text-gray-900" : "text-gray-500"}`}
            >
              Yearly
            </span>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              Save 20%
            </span>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const price =
                billingCycle === "yearly"
                  ? plan.price_yearly
                  : plan.price_monthly;
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isUpgrade = isPlanUpgrade(plan);
              const isDowngrade = isPlanDowngrade(plan);

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl border-2 p-5 transition-all relative ${
                    plan.is_popular
                      ? "border-violet-500 ring-2 ring-violet-100"
                      : "border-gray-200 hover:border-gray-300"
                  } ${isCurrentPlan ? "bg-violet-50" : ""}`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Most Popular
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mb-3">
                      <BadgeCheck className="w-4 h-4" />
                      Current Plan
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    {plan.icon && <span className="text-xl">{plan.icon}</span>}
                    <h3 className="text-lg font-bold text-gray-900">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    {plan.tagline || plan.description}
                  </p>

                  <div className="mb-5">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(price, plan.currency)}
                    </span>
                    <span className="text-gray-500">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>

                  {/* Key Limits */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-gray-600">
                        {plan.max_products === -1
                          ? "Unlimited"
                          : plan.max_products.toLocaleString()}{" "}
                        products
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-gray-600">
                        {plan.max_sales_per_month === -1
                          ? "Unlimited"
                          : plan.max_sales_per_month.toLocaleString()}{" "}
                        sales/month
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-gray-600">
                        {plan.max_team_members === -1
                          ? "Unlimited"
                          : plan.max_team_members}{" "}
                        team members
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-gray-600">
                        {plan.max_locations === -1
                          ? "Unlimited"
                          : plan.max_locations}{" "}
                        location{plan.max_locations !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Features */}
                  <button
                    onClick={() =>
                      setShowPlanDetails(
                        showPlanDetails === plan.id ? null : plan.id,
                      )
                    }
                    className="w-full flex items-center justify-center gap-1 text-sm text-violet-600 hover:text-violet-700 mb-4"
                  >
                    {showPlanDetails === plan.id ? "Hide" : "View all"} features
                    {showPlanDetails === plan.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showPlanDetails === plan.id && (
                    <div className="border-t pt-4 mb-4 space-y-2 max-h-48 overflow-y-auto">
                      {Object.entries(plan.features || {}).map(
                        ([key, value]) => {
                          if (
                            value === false ||
                            value === null ||
                            value === undefined
                          )
                            return null;
                          const label = key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                          return (
                            <div
                              key={key}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              <span className="text-gray-600">{label}</span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {isCurrentPlan ? (
                    <button
                      className="w-full py-2.5 bg-gray-100 text-gray-500 font-medium rounded-lg cursor-default"
                      disabled
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowUpgradeModal(true);
                      }}
                      className={`w-full py-2.5 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isUpgrade
                          ? "bg-violet-600 text-white hover:bg-violet-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isUpgrade ? (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          Upgrade
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-4 h-4" />
                          Downgrade
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Plan Comparison Footer */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Included in all plans
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Globe className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm text-gray-700">Mobile POS App</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Shield className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm text-gray-700">Secure Payments</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm text-gray-700">Basic Reports</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Headphones className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm text-gray-700">Email Support</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          {/* Usage Overview Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Usage Overview</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Current billing period:{" "}
                  {formatDate(subscription?.current_period_start ?? null)} -{" "}
                  {formatDate(subscription?.current_period_end ?? null)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Live Data
                </span>
              </div>
            </div>

            {/* Circular Progress Charts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Products Circle */}
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#productGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${usageStats.products.limit === "Unlimited" ? 0 : (getUsagePercentage(usageStats.products.used, usageStats.products.limit as number) / 100) * 251.2} 251.2`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient
                        id="productGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#A78BFA" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <p className="text-2xl font-bold">
                        {usageStats.products.limit === "Unlimited"
                          ? "∞"
                          : `${getUsagePercentage(usageStats.products.used, usageStats.products.limit as number)}%`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-violet-300 text-sm font-medium mb-1">
                  <Package className="w-4 h-4" />
                  Products
                </div>
                <p className="text-white font-semibold">
                  {usageStats.products.used.toLocaleString()}
                  <span className="text-slate-400 font-normal">
                    {" "}
                    /{" "}
                    {usageStats.products.limit === "Unlimited"
                      ? "∞"
                      : usageStats.products.limit.toLocaleString()}
                  </span>
                </p>
              </div>

              {/* Sales Circle */}
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#salesGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${usageStats.sales.limit === "Unlimited" ? 0 : (getUsagePercentage(usageStats.sales.used, usageStats.sales.limit as number) / 100) * 251.2} 251.2`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient
                        id="salesGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <p className="text-2xl font-bold">
                        {usageStats.sales.limit === "Unlimited"
                          ? "∞"
                          : `${getUsagePercentage(usageStats.sales.used, usageStats.sales.limit as number)}%`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-medium mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Sales
                </div>
                <p className="text-white font-semibold">
                  {usageStats.sales.used.toLocaleString()}
                  <span className="text-slate-400 font-normal">
                    {" "}
                    /{" "}
                    {usageStats.sales.limit === "Unlimited"
                      ? "∞"
                      : usageStats.sales.limit.toLocaleString()}
                  </span>
                </p>
              </div>

              {/* Team Circle */}
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#teamGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${usageStats.staff.limit === "Unlimited" ? 0 : (getUsagePercentage(usageStats.staff.used, usageStats.staff.limit as number) / 100) * 251.2} 251.2`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient
                        id="teamGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#60A5FA" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <p className="text-2xl font-bold">
                        {usageStats.staff.limit === "Unlimited"
                          ? "∞"
                          : `${getUsagePercentage(usageStats.staff.used, usageStats.staff.limit as number)}%`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-blue-300 text-sm font-medium mb-1">
                  <Users className="w-4 h-4" />
                  Team
                </div>
                <p className="text-white font-semibold">
                  {usageStats.staff.used}
                  <span className="text-slate-400 font-normal">
                    {" "}
                    /{" "}
                    {usageStats.staff.limit === "Unlimited"
                      ? "∞"
                      : usageStats.staff.limit}
                  </span>
                </p>
              </div>

              {/* Storage Circle */}
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#storageGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(getUsagePercentage(usageStats.storage.used, usageStats.storage.limit) / 100) * 251.2} 251.2`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient
                        id="storageGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <p className="text-2xl font-bold">
                        {getUsagePercentage(
                          usageStats.storage.used,
                          usageStats.storage.limit,
                        )}
                        %
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-300 text-sm font-medium mb-1">
                  <Database className="w-4 h-4" />
                  Storage
                </div>
                <p className="text-white font-semibold">
                  {usageStats.storage.used} MB
                  <span className="text-slate-400 font-normal">
                    {" "}
                    / {usageStats.storage.limit} MB
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Usage Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Products Card */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Products</h3>
                      <p className="text-sm text-gray-500">Catalog inventory</p>
                    </div>
                  </div>
                  {usageStats.products.limit !== "Unlimited" && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        getUsagePercentage(
                          usageStats.products.used,
                          usageStats.products.limit as number,
                        ) >= 90
                          ? "bg-red-100 text-red-700"
                          : getUsagePercentage(
                                usageStats.products.used,
                                usageStats.products.limit as number,
                              ) >= 75
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {getUsagePercentage(
                        usageStats.products.used,
                        usageStats.products.limit as number,
                      ) >= 90
                        ? "Almost Full"
                        : getUsagePercentage(
                              usageStats.products.used,
                              usageStats.products.limit as number,
                            ) >= 75
                          ? "High Usage"
                          : "Healthy"}
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {usageStats.products.used.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      of{" "}
                      {usageStats.products.limit === "Unlimited"
                        ? "unlimited"
                        : usageStats.products.limit.toLocaleString()}{" "}
                      products
                    </p>
                  </div>
                  {usageStats.products.limit !== "Unlimited" && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-violet-600">
                        {(
                          (usageStats.products.limit as number) -
                          usageStats.products.used
                        ).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">remaining</p>
                    </div>
                  )}
                </div>

                {usageStats.products.limit !== "Unlimited" && (
                  <div className="relative">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500 relative"
                        style={{
                          width: `${Math.min(100, getUsagePercentage(usageStats.products.used, usageStats.products.limit as number))}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>0</span>
                      <span>
                        {(
                          (usageStats.products.limit as number) / 2
                        ).toLocaleString()}
                      </span>
                      <span>
                        {(usageStats.products.limit as number).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Card */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl text-white shadow-lg shadow-emerald-500/25">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Sales This Month
                      </h3>
                      <p className="text-sm text-gray-500">
                        Transactions processed
                      </p>
                    </div>
                  </div>
                  {usageStats.sales.limit !== "Unlimited" && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        getUsagePercentage(
                          usageStats.sales.used,
                          usageStats.sales.limit as number,
                        ) >= 90
                          ? "bg-red-100 text-red-700"
                          : getUsagePercentage(
                                usageStats.sales.used,
                                usageStats.sales.limit as number,
                              ) >= 75
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {getUsagePercentage(
                        usageStats.sales.used,
                        usageStats.sales.limit as number,
                      ) >= 90
                        ? "Almost Full"
                        : getUsagePercentage(
                              usageStats.sales.used,
                              usageStats.sales.limit as number,
                            ) >= 75
                          ? "High Usage"
                          : "Healthy"}
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {usageStats.sales.used.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      of{" "}
                      {usageStats.sales.limit === "Unlimited"
                        ? "unlimited"
                        : usageStats.sales.limit.toLocaleString()}{" "}
                      sales
                    </p>
                  </div>
                  {usageStats.sales.limit !== "Unlimited" && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
                        {(
                          (usageStats.sales.limit as number) -
                          usageStats.sales.used
                        ).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">remaining</p>
                    </div>
                  )}
                </div>

                {usageStats.sales.limit !== "Unlimited" && (
                  <div className="relative">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500 relative"
                        style={{
                          width: `${Math.min(100, getUsagePercentage(usageStats.sales.used, usageStats.sales.limit as number))}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>0</span>
                      <span>
                        {(
                          (usageStats.sales.limit as number) / 2
                        ).toLocaleString()}
                      </span>
                      <span>
                        {(usageStats.sales.limit as number).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Team Members
                      </h3>
                      <p className="text-sm text-gray-500">Staff accounts</p>
                    </div>
                  </div>
                  {usageStats.staff.limit !== "Unlimited" && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        getUsagePercentage(
                          usageStats.staff.used,
                          usageStats.staff.limit as number,
                        ) >= 90
                          ? "bg-red-100 text-red-700"
                          : getUsagePercentage(
                                usageStats.staff.used,
                                usageStats.staff.limit as number,
                              ) >= 75
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {getUsagePercentage(
                        usageStats.staff.used,
                        usageStats.staff.limit as number,
                      ) >= 90
                        ? "At Limit"
                        : "Available"}
                    </span>
                  )}
                </div>

                {/* Visual Staff Representation */}
                <div className="flex items-center gap-2 mb-4">
                  {usageStats.staff.limit !== "Unlimited" &&
                    Array.from({
                      length: Math.min(10, usageStats.staff.limit as number),
                    }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          i < usageStats.staff.used
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300"
                        }`}
                      >
                        {i < usageStats.staff.used ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>
                    ))}
                  {usageStats.staff.limit !== "Unlimited" &&
                    (usageStats.staff.limit as number) > 10 && (
                      <span className="text-sm text-gray-500">
                        +{(usageStats.staff.limit as number) - 10} more
                      </span>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {usageStats.staff.used}
                    </span>
                    <span className="text-gray-500">
                      {" "}
                      /{" "}
                      {usageStats.staff.limit === "Unlimited"
                        ? "∞"
                        : usageStats.staff.limit}{" "}
                      members
                    </span>
                  </div>
                  {usageStats.staff.limit !== "Unlimited" && (
                    <span className="text-blue-600 font-semibold">
                      {(usageStats.staff.limit as number) -
                        usageStats.staff.used}{" "}
                      slots available
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Storage Card */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/25">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Storage</h3>
                      <p className="text-sm text-gray-500">
                        File storage space
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      getUsagePercentage(
                        usageStats.storage.used,
                        usageStats.storage.limit,
                      ) >= 90
                        ? "bg-red-100 text-red-700"
                        : getUsagePercentage(
                              usageStats.storage.used,
                              usageStats.storage.limit,
                            ) >= 75
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {getUsagePercentage(
                      usageStats.storage.used,
                      usageStats.storage.limit,
                    ) >= 90
                      ? "Almost Full"
                      : getUsagePercentage(
                            usageStats.storage.used,
                            usageStats.storage.limit,
                          ) >= 75
                        ? "High Usage"
                        : "Plenty of Space"}
                  </span>
                </div>

                {/* Storage Visualization */}
                <div className="grid grid-cols-10 gap-1 mb-4">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const threshold = (i + 1) * 10;
                    const usage = getUsagePercentage(
                      usageStats.storage.used,
                      usageStats.storage.limit,
                    );
                    const isFilled = usage >= threshold - 10;
                    const isPartial =
                      usage > threshold - 10 && usage < threshold;

                    return (
                      <div
                        key={i}
                        className={`h-8 rounded transition-all ${
                          isFilled
                            ? usage >= 90
                              ? "bg-gradient-to-t from-red-500 to-red-400"
                              : usage >= 75
                                ? "bg-gradient-to-t from-amber-500 to-amber-400"
                                : "bg-gradient-to-t from-amber-500 to-yellow-400"
                            : "bg-gray-100"
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {usageStats.storage.used}
                    </p>
                    <p className="text-sm text-gray-500">MB used</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600">
                      {usageStats.storage.limit - usageStats.storage.used}
                    </p>
                    <p className="text-sm text-gray-500">
                      MB free of {usageStats.storage.limit} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Tips & Upgrade Prompt */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Tips Card */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Info className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Usage Tips</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Sales quota resets at the start of each billing cycle
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Product counts include all active items in your catalog
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Storage includes product images and attachments</span>
                </li>
              </ul>
            </div>

            {/* Upgrade Prompt */}
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-xl p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Need More Resources?</h3>
                </div>
                <p className="text-violet-100 text-sm mb-4">
                  Upgrade your plan to unlock higher limits, more features, and
                  priority support.
                </p>
                <button
                  onClick={() => setActiveTab("plans")}
                  className="w-full px-4 py-2.5 bg-white text-violet-600 font-semibold rounded-lg hover:bg-violet-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  View Upgrade Options
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Billing History</h3>
            {invoices.length > 0 && (
              <button className="text-sm text-violet-600 font-medium hover:text-violet-700 flex items-center gap-1">
                <Download className="w-4 h-4" />
                Download all
              </button>
            )}
          </div>

          {isLoadingInvoices ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-violet-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No invoices yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Your billing history will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`p-2.5 rounded-lg ${
                      invoice.status === "paid"
                        ? "bg-emerald-100"
                        : invoice.status === "open"
                          ? "bg-amber-100"
                          : "bg-gray-100"
                    }`}
                  >
                    <Receipt
                      className={`w-5 h-5 ${
                        invoice.status === "paid"
                          ? "text-emerald-600"
                          : invoice.status === "open"
                            ? "text-amber-600"
                            : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(invoice.invoice_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        invoice.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : invoice.status === "open"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </span>
                  </div>
                  {invoice.pdf_url && (
                    <a
                      href={invoice.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === "payment" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Payment Methods</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your payment methods for subscriptions
                </p>
              </div>
              <button
                onClick={() => {
                  resetPaymentForms();
                  setShowAddPaymentModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Method
              </button>
            </div>

            {paymentMethods.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  No payment methods added
                </h4>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  Add a payment method to subscribe to plans and make purchases.
                  We support Mobile Money and cards.
                </p>
                <button
                  onClick={() => {
                    resetPaymentForms();
                    setShowAddPaymentModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Payment Method
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Payment Method Icon */}
                    <div
                      className={`p-3 rounded-xl ${
                        method.method_type === "mobile_money"
                          ? getProviderColor(method.mobile_provider || "") +
                            " bg-opacity-10"
                          : "bg-gradient-to-br from-gray-100 to-gray-200"
                      }`}
                    >
                      {method.method_type === "card" ? (
                        <CreditCard className="w-6 h-6 text-gray-700" />
                      ) : method.method_type === "mobile_money" ? (
                        <Smartphone className="w-6 h-6 text-gray-700" />
                      ) : (
                        <Building className="w-6 h-6 text-gray-700" />
                      )}
                    </div>

                    {/* Payment Method Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">
                          {method.method_type === "card" && method.card_brand
                            ? `${method.card_brand.charAt(0).toUpperCase() + method.card_brand.slice(1)} •••• ${method.card_last4}`
                            : method.method_type === "mobile_money" &&
                                method.mobile_provider
                              ? `${method.mobile_provider}`
                              : "Payment Method"}
                        </p>
                        {method.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {method.method_type === "mobile_money" &&
                          method.mobile_number_last4 && (
                            <>
                              Phone ending in •••• {method.mobile_number_last4}
                            </>
                          )}
                        {method.method_type === "card" &&
                          method.card_exp_month &&
                          method.card_exp_year && (
                            <>
                              Expires{" "}
                              {String(method.card_exp_month).padStart(2, "0")}/
                              {method.card_exp_year}
                            </>
                          )}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!method.is_default && (
                        <button
                          onClick={() =>
                            handleSetDefaultPaymentMethod(method.id)
                          }
                          disabled={isProcessing}
                          className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPaymentMethod(method);
                          setShowDeletePaymentModal(true);
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mobile Actions Dropdown */}
                    <div className="relative sm:hidden">
                      <button
                        onClick={() => {
                          setSelectedPaymentMethod(method);
                          setShowEditPaymentModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods Summary Cards */}
          {paymentMethods.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mobile Money Summary */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Smartphone className="w-5 h-5 text-yellow-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Mobile Money
                    </h4>
                    <p className="text-sm text-gray-500">
                      {
                        paymentMethods.filter(
                          (m) => m.method_type === "mobile_money",
                        ).length
                      }{" "}
                      method(s)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Fast and convenient payments via MTN MoMo, Vodafone Cash, or
                  AirtelTigo Money
                </p>
              </div>

              {/* Card Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Cards</h4>
                    <p className="text-sm text-gray-500">
                      {
                        paymentMethods.filter((m) => m.method_type === "card")
                          .length
                      }{" "}
                      card(s)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Visa, Mastercard, and other major cards accepted
                </p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-white rounded-lg shadow-sm">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Secure Payment Processing
                </h4>
                <p className="text-sm text-gray-600">
                  Your payment information is encrypted and securely processed.
                  We never store your full card details. For Mobile Money, we
                  use secure provider APIs for safe transactions.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    256-bit SSL
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    PCI Compliant
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Encrypted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Payment Method
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Choose your preferred payment option
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  resetPaymentForms();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Type Selector */}
            <div className="p-5 border-b">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethodType("mobile_money")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentMethodType === "mobile_money"
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`p-3 rounded-full ${
                      paymentMethodType === "mobile_money"
                        ? "bg-violet-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Smartphone
                      className={`w-6 h-6 ${
                        paymentMethodType === "mobile_money"
                          ? "text-violet-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-medium ${
                      paymentMethodType === "mobile_money"
                        ? "text-violet-700"
                        : "text-gray-700"
                    }`}
                  >
                    Mobile Money
                  </span>
                  <span className="text-xs text-gray-500">
                    MTN, Vodafone, AirtelTigo
                  </span>
                </button>

                <button
                  onClick={() => setPaymentMethodType("card")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentMethodType === "card"
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`p-3 rounded-full ${
                      paymentMethodType === "card"
                        ? "bg-violet-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <CreditCard
                      className={`w-6 h-6 ${
                        paymentMethodType === "card"
                          ? "text-violet-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-medium ${
                      paymentMethodType === "card"
                        ? "text-violet-700"
                        : "text-gray-700"
                    }`}
                  >
                    Card
                  </span>
                  <span className="text-xs text-gray-500">
                    Visa, Mastercard
                  </span>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-5">
              {paymentMethodType === "mobile_money" ? (
                /* Mobile Money Form */
                <div className="space-y-4">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Provider
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {mobileMoneyProviders.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() =>
                            setMobileMoneyForm({
                              ...mobileMoneyForm,
                              provider: provider.name,
                            })
                          }
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            mobileMoneyForm.provider === provider.name
                              ? "border-violet-500 bg-violet-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 ${provider.color} rounded-full mx-auto mb-2 flex items-center justify-center`}
                          >
                            <Phone className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium text-gray-700 block truncate">
                            {provider.name.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        +233
                      </span>
                      <input
                        type="tel"
                        value={mobileMoneyForm.phoneNumber}
                        onChange={(e) =>
                          setMobileMoneyForm({
                            ...mobileMoneyForm,
                            phoneNumber: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          })
                        }
                        placeholder="XX XXX XXXX"
                        className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your registered mobile money number
                    </p>
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={mobileMoneyForm.accountName}
                      onChange={(e) =>
                        setMobileMoneyForm({
                          ...mobileMoneyForm,
                          accountName: e.target.value,
                        })
                      }
                      placeholder="Name on mobile money account"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  {/* Set as Default */}
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mobileMoneyForm.setAsDefault}
                      onChange={(e) =>
                        setMobileMoneyForm({
                          ...mobileMoneyForm,
                          setAsDefault: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <div>
                      <span className="font-medium text-gray-700">
                        Set as default payment method
                      </span>
                      <p className="text-xs text-gray-500">
                        Use this for automatic payments
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                /* Card Form */
                <div className="space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={(e) =>
                          setCardForm({
                            ...cardForm,
                            cardNumber: formatCardNumber(e.target.value).slice(
                              0,
                              19,
                            ),
                          })
                        }
                        placeholder="1234 5678 9012 3456"
                        className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardForm.cardholderName}
                      onChange={(e) =>
                        setCardForm({
                          ...cardForm,
                          cardholderName: e.target.value,
                        })
                      }
                      placeholder="Name on card"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Month
                      </label>
                      <select
                        value={cardForm.expiryMonth}
                        onChange={(e) =>
                          setCardForm({
                            ...cardForm,
                            expiryMonth: e.target.value,
                          })
                        }
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (month) => (
                            <option
                              key={month}
                              value={String(month).padStart(2, "0")}
                            >
                              {String(month).padStart(2, "0")}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Year
                      </label>
                      <select
                        value={cardForm.expiryYear}
                        onChange={(e) =>
                          setCardForm({
                            ...cardForm,
                            expiryYear: e.target.value,
                          })
                        }
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                      >
                        <option value="">YY</option>
                        {Array.from(
                          { length: 10 },
                          (_, i) => new Date().getFullYear() + i,
                        ).map((year) => (
                          <option key={year} value={String(year).slice(-2)}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardForm.cvv}
                        onChange={(e) =>
                          setCardForm({
                            ...cardForm,
                            cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                          })
                        }
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Set as Default */}
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardForm.setAsDefault}
                      onChange={(e) =>
                        setCardForm({
                          ...cardForm,
                          setAsDefault: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <div>
                      <span className="font-medium text-gray-700">
                        Set as default payment method
                      </span>
                      <p className="text-xs text-gray-500">
                        Use this for automatic payments
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  resetPaymentForms();
                  setError(null);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaymentMethod}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Method Modal */}
      {showDeletePaymentModal && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Remove Payment Method?
              </h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to remove{" "}
                <span className="font-medium text-gray-700">
                  {selectedPaymentMethod.method_type === "card"
                    ? `${selectedPaymentMethod.card_brand} •••• ${selectedPaymentMethod.card_last4}`
                    : `${selectedPaymentMethod.mobile_provider} •••• ${selectedPaymentMethod.mobile_number_last4}`}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            {selectedPaymentMethod.is_default && (
              <div className="bg-amber-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">
                      This is your default payment method
                    </p>
                    <p className="mt-1">
                      Removing it will set another payment method as default if
                      available.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeletePaymentModal(false);
                  setSelectedPaymentMethod(null);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePaymentMethod}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove Method
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Actions Modal (Mobile) */}
      {showEditPaymentModal && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm sm:mx-4">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg ${
                    selectedPaymentMethod.method_type === "mobile_money"
                      ? "bg-yellow-100"
                      : "bg-gray-100"
                  }`}
                >
                  {selectedPaymentMethod.method_type === "card" ? (
                    <CreditCard className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-yellow-700" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {selectedPaymentMethod.method_type === "card"
                      ? `${selectedPaymentMethod.card_brand} •••• ${selectedPaymentMethod.card_last4}`
                      : selectedPaymentMethod.mobile_provider}
                  </p>
                  {selectedPaymentMethod.is_default && (
                    <p className="text-xs text-violet-600 font-medium">
                      Default method
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowEditPaymentModal(false);
                    setSelectedPaymentMethod(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-2">
              {!selectedPaymentMethod.is_default && (
                <button
                  onClick={() => {
                    handleSetDefaultPaymentMethod(selectedPaymentMethod.id);
                    setShowEditPaymentModal(false);
                    setSelectedPaymentMethod(null);
                  }}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Star className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-700">
                    Set as default
                  </span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowEditPaymentModal(false);
                  setShowDeletePaymentModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">Remove payment method</span>
              </button>
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowEditPaymentModal(false);
                  setSelectedPaymentMethod(null);
                }}
                className="w-full py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Section */}
      {subscription &&
        subscription.status !== "canceled" &&
        !subscription.cancel_at_period_end && (
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">
                  Cancel Subscription
                </h3>
                <p className="text-sm text-gray-500">
                  Your access will continue until{" "}
                  {formatDate(subscription.current_period_end || null)}
                </p>
              </div>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        )}

      {/* Upgrade/Change Plan Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {/* Check if user is eligible for trial */}
            {(() => {
              const isEligibleForTrial =
                (!subscription || !subscription.has_used_trial) &&
                selectedPlan.slug !== "free";
              return (
                <>
                  <div className="text-center mb-6">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        isEligibleForTrial
                          ? "bg-emerald-100"
                          : isPlanUpgrade(selectedPlan)
                            ? "bg-violet-100"
                            : "bg-amber-100"
                      }`}
                    >
                      {isEligibleForTrial ? (
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                      ) : isPlanUpgrade(selectedPlan) ? (
                        <ArrowUpRight className="w-6 h-6 text-violet-600" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {isEligibleForTrial
                        ? `Start Your Free Trial - ${selectedPlan.name}`
                        : isPlanUpgrade(selectedPlan)
                          ? `Upgrade to ${selectedPlan.name}`
                          : `Downgrade to ${selectedPlan.name}`}
                    </h3>
                    <p className="text-gray-500">
                      {isEligibleForTrial
                        ? "Try all premium features free for 7 days. No payment required to start."
                        : isPlanUpgrade(selectedPlan)
                          ? "Unlock more features and higher limits"
                          : "You'll lose access to some features at the end of your billing period"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Plan</span>
                      <span className="font-semibold text-gray-900">
                        {selectedPlan.name}
                      </span>
                    </div>

                    {isEligibleForTrial ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Trial Period</span>
                          <span className="font-medium text-emerald-600">
                            7 Days Free
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-gray-600">After Trial</span>
                          <span className="font-bold text-lg text-gray-900">
                            {formatCurrency(
                              billingCycle === "yearly"
                                ? selectedPlan.price_yearly
                                : selectedPlan.price_monthly,
                              selectedPlan.currency,
                            )}
                            <span className="text-sm font-normal text-gray-500">
                              /{billingCycle === "yearly" ? "year" : "month"}
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-center">
                          You'll be asked to pay when the trial ends
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Billing Cycle</span>
                          <span className="font-medium text-gray-900">
                            {billingCycle.charAt(0).toUpperCase() +
                              billingCycle.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-gray-600">Price</span>
                          <span className="font-bold text-lg text-gray-900">
                            {formatCurrency(
                              billingCycle === "yearly"
                                ? selectedPlan.price_yearly
                                : selectedPlan.price_monthly,
                              selectedPlan.currency,
                            )}
                            <span className="text-sm font-normal text-gray-500">
                              /{billingCycle === "yearly" ? "year" : "month"}
                            </span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowUpgradeModal(false);
                        setSelectedPlan(null);
                      }}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleChangePlan(selectedPlan)}
                      disabled={isProcessing}
                      className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                        isEligibleForTrial
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : isPlanUpgrade(selectedPlan)
                            ? "bg-violet-600 text-white hover:bg-violet-700"
                            : "bg-amber-600 text-white hover:bg-amber-700"
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : isEligibleForTrial ? (
                        "Start Free Trial"
                      ) : (
                        `Confirm ${isPlanUpgrade(selectedPlan) ? "Upgrade" : "Downgrade"}`
                      )}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cancel Subscription?
              </h3>
              <p className="text-gray-500 mb-6">
                You'll lose access to premium features at the end of your
                billing period (
                {formatDate(subscription?.current_period_end || null)}). You can
                resubscribe anytime.
              </p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">What you'll lose:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Access to premium features</li>
                    <li>Higher usage limits</li>
                    <li>Priority support</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Plan
              </button>
              <button
                onClick={() => handleCancelSubscription(true)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Cancel Plan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionPage;
