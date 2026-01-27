import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Coins,
  TrendingUp,
  Clock,
  Sparkles,
  MessageSquare,
  Send,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Zap,
  Info,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  price_ghs: number;
  price_ngn: number;
  per_credit_usd: number;
  per_credit_ghs: number;
  per_credit_ngn: number;
  is_popular: boolean;
  sort_order: number;
}

interface CreditTransaction {
  id: string;
  type:
    | "pack_purchase"
    | "usage"
    | "monthly_allocation"
    | "refund"
    | "adjustment";
  amount: number;
  balance_after: number;
  description: string;
  message_type?: string;
  created_at: string;
}

interface UserCredits {
  id: string;
  balance: number;
  included_credits: number;
  included_remaining: number;
  last_reset_at: string;
}

// ============================================
// CREDIT RULES & PRICING
// ============================================

const CREDIT_RULES = {
  // How many credits each message type costs
  SMS_COST: 1, // 1 credit per SMS
  WHATSAPP_COST: 1, // 1 credit per WhatsApp (within 24hr window)

  // Minimum purchase
  MIN_PURCHASE_GHS: 25,
  MIN_PURCHASE_USD: 3,
  MIN_PURCHASE_NGN: 2500,

  // Maximum credits per tenant per month (prevent abuse)
  MAX_MONTHLY_PURCHASE: 50000,

  // Low balance warning threshold
  LOW_BALANCE_THRESHOLD: 50,

  // Credits expiry (purchased credits don't expire, included do at month end)
  PURCHASED_CREDITS_EXPIRE: false,
  INCLUDED_CREDITS_EXPIRE_DAYS: 30,

  // Bulk discount thresholds
  BULK_DISCOUNTS: {
    1200: 0.1, // 10% discount for 1200+ credits
    3000: 0.15, // 15% discount for 3000+ credits
  },
};

// ============================================
// COMPONENT
// ============================================

export function CreditsPage() {
  const { user, tenant } = useOutletContext<{ user: any; tenant: any }>();

  // State
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI State
  const [selectedCurrency, setSelectedCurrency] = useState<
    "USD" | "GHS" | "NGN"
  >("GHS");
  const [activeTab, setActiveTab] = useState<"buy" | "history" | "rules">(
    "buy",
  );

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchData();
  }, [tenant?.id, user?.id]);

  const fetchData = async () => {
    if (!tenant?.id || !user?.id) return;

    setIsLoading(true);
    try {
      // Fetch credit packs
      const { data: packs, error: packsError } = await supabase
        .from("credit_packs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (packsError) throw packsError;
      setCreditPacks(packs || []);

      // Fetch user credits
      const { data: credits, error: creditsError } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (creditsError && creditsError.code !== "PGRST116") {
        throw creditsError;
      }
      setUserCredits(credits);

      // Fetch recent transactions
      const { data: txns, error: txnsError } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txnsError) throw txnsError;
      setTransactions(txns || []);
    } catch (err: any) {
      console.error("Error fetching credits data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // PURCHASE HANDLER
  // ============================================

  const handlePurchase = async (pack: CreditPack) => {
    if (!user?.email || !user?.id || !tenant?.id) {
      setError("Please log in to purchase credits");
      return;
    }

    // Validate minimum purchase
    const price = getPrice(pack);
    const minPurchase =
      selectedCurrency === "GHS"
        ? CREDIT_RULES.MIN_PURCHASE_GHS
        : selectedCurrency === "NGN"
          ? CREDIT_RULES.MIN_PURCHASE_NGN
          : CREDIT_RULES.MIN_PURCHASE_USD;

    if (price < minPurchase) {
      setError(
        `Minimum purchase is ${getCurrencySymbol(selectedCurrency)}${minPurchase}`,
      );
      return;
    }

    setIsPurchasing(pack.id);
    setError(null);
    setSuccess(null);

    try {
      // Get Paystack public key
      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!paystackKey) {
        throw new Error("Payment system not configured");
      }

      const reference = `CRED_${Date.now()}_${pack.id.slice(0, 8)}`;

      // Initialize Paystack
      const handler = (window as any).PaystackPop.setup({
        key: paystackKey,
        email: user.email,
        amount: Math.round(price * 100), // Convert to pesewas/kobo
        currency: selectedCurrency,
        ref: reference,
        metadata: {
          purpose: "credits",
          pack_id: pack.id,
          pack_name: pack.name,
          credits: pack.credits,
          tenant_id: tenant.id,
          user_id: user.id,
          custom_fields: [
            { display_name: "Pack", variable_name: "pack", value: pack.name },
            {
              display_name: "Credits",
              variable_name: "credits",
              value: pack.credits.toString(),
            },
          ],
        },
        callback: async (response: any) => {
          if (response.status === "success") {
            try {
              // Add credits via database function
              const { data, error: dbError } = await supabase.rpc(
                "add_credits_from_pack",
                {
                  p_user_id: user.id,
                  p_pack_id: pack.id,
                  p_price_paid: price,
                  p_currency: selectedCurrency,
                },
              );

              if (dbError) throw dbError;

              setSuccess(
                `Successfully added ${pack.credits} credits to your account!`,
              );
              await fetchData(); // Refresh data
            } catch (err: any) {
              console.error("Error adding credits:", err);
              setError(
                `Payment successful but credits not added. Please contact support with reference: ${reference}`,
              );
            }
          }
          setIsPurchasing(null);
        },
        onClose: () => {
          setIsPurchasing(null);
        },
      });

      handler.openIframe();
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || "Failed to initiate purchase");
      setIsPurchasing(null);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = { GHS: "GH₵", NGN: "₦", USD: "$" };
    return symbols[currency] || "GH₵";
  };

  const getPrice = (pack: CreditPack) => {
    const prices: Record<string, number> = {
      USD: pack.price_usd,
      GHS: pack.price_ghs,
      NGN: pack.price_ngn,
    };
    return prices[selectedCurrency] || pack.price_ghs;
  };

  const getPerCredit = (pack: CreditPack) => {
    const rates: Record<string, number> = {
      USD: pack.per_credit_usd,
      GHS: pack.per_credit_ghs,
      NGN: pack.per_credit_ngn,
    };
    return rates[selectedCurrency] || pack.per_credit_ghs;
  };

  const getSavingsPercent = (pack: CreditPack, packs: CreditPack[]) => {
    if (packs.length === 0) return null;
    const baseRate = packs[0]?.per_credit_ghs || 0;
    const packRate = pack.per_credit_ghs;
    if (baseRate === 0 || packRate >= baseRate) return null;
    return Math.round((1 - packRate / baseRate) * 100);
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, { icon: any; color: string }> = {
      pack_purchase: {
        icon: ArrowUpRight,
        color: "text-emerald-600 bg-emerald-100",
      },
      usage: { icon: ArrowDownRight, color: "text-red-600 bg-red-100" },
      monthly_allocation: {
        icon: Gift,
        color: "text-violet-600 bg-violet-100",
      },
      refund: { icon: ArrowUpRight, color: "text-blue-600 bg-blue-100" },
      adjustment: { icon: RefreshCw, color: "text-amber-600 bg-amber-100" },
    };
    return icons[type] || icons.usage;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Computed values
  const totalBalance =
    (userCredits?.balance || 0) + (userCredits?.included_remaining || 0);
  const monthlyUsagePercent = userCredits
    ? Math.round(
        ((userCredits.included_credits - userCredits.included_remaining) /
          Math.max(userCredits.included_credits, 1)) *
          100,
      )
    : 0;
  const isLowBalance = totalBalance < CREDIT_RULES.LOW_BALANCE_THRESHOLD;

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messaging Credits</h1>
        <p className="text-gray-500 mt-1">
          Buy and manage your SMS & WhatsApp credits
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-800">Success!</p>
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-emerald-400 hover:text-emerald-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Credit Balance Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-amber-100 text-sm">Total Balance</p>
              <p className="text-3xl font-bold">
                {totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-amber-100">
              <span>Purchased credits</span>
              <span className="text-white font-medium">
                {(userCredits?.balance || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-amber-100">
              <span>Monthly included</span>
              <span className="text-white font-medium">
                {(userCredits?.included_remaining || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Allocation */}
        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 rounded-xl">
                <Gift className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Monthly Included</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(userCredits?.included_remaining || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              of {(userCredits?.included_credits || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Used this month</span>
              <span>
                {(
                  (userCredits?.included_credits || 0) -
                  (userCredits?.included_remaining || 0)
                ).toLocaleString()}{" "}
                credits
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  monthlyUsagePercent >= 90
                    ? "bg-red-500"
                    : monthlyUsagePercent >= 70
                      ? "bg-amber-500"
                      : "bg-violet-500"
                }`}
                style={{ width: `${monthlyUsagePercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Resets monthly with your subscription
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Credit Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.filter((t) => t.type === "usage").length}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span>1 credit = 1 WhatsApp message</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Send className="w-4 h-4" />
              <span>1 credit = 1 SMS (160 chars)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Balance Warning */}
      {isLowBalance && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Low credit balance</p>
            <p className="text-sm text-amber-700">
              Your credit balance is running low ({totalBalance} credits
              remaining). Purchase more credits to continue sending messages.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("buy")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "buy"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Buy Credits
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "rules"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Credit Rules
        </button>
      </div>

      {/* Buy Credits Tab */}
      {activeTab === "buy" && (
        <>
          {/* Currency Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Currency:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["GHS", "NGN", "USD"] as const).map((currency) => (
                <button
                  key={currency}
                  onClick={() => setSelectedCurrency(currency)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    selectedCurrency === currency
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>

          {/* Credit Packs Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditPacks.map((pack) => {
              const savings = getSavingsPercent(pack, creditPacks);
              return (
                <div
                  key={pack.id}
                  className={`bg-white rounded-xl border-2 p-5 transition-all hover:shadow-lg ${
                    pack.is_popular
                      ? "border-violet-500 ring-2 ring-violet-100"
                      : "border-gray-200 hover:border-violet-200"
                  }`}
                >
                  {pack.is_popular && (
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {savings && !pack.is_popular && (
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Save {savings}%
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-gray-900">
                    {pack.name}
                  </h3>

                  <div className="mt-2 mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {getCurrencySymbol(selectedCurrency)}
                        {getPrice(pack).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-semibold text-amber-600">
                        {pack.credits.toLocaleString()} credits
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    {getCurrencySymbol(selectedCurrency)}
                    {getPerCredit(pack).toFixed(3)} per credit
                  </div>

                  <button
                    onClick={() => handlePurchase(pack)}
                    disabled={isPurchasing !== null}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                      pack.is_popular
                        ? "bg-violet-600 text-white hover:bg-violet-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {isPurchasing === pack.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Purchase"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Credit Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">How credits work</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>
                    • <strong>SMS:</strong> 1 credit per message (up to 160
                    characters)
                  </li>
                  <li>
                    • <strong>WhatsApp:</strong> 1 credit per message
                  </li>
                  <li>
                    • Your plan includes {userCredits?.included_credits || 0}{" "}
                    free credits monthly
                  </li>
                  <li>
                    • <strong>Purchased credits never expire</strong>
                  </li>
                  <li>
                    • WhatsApp 24hr window: first message costs 1 credit,
                    replies are free!
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Transaction History</h3>
            <button
              onClick={fetchData}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <Coins className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">
                Your credit transactions will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((txn) => {
                const { icon: Icon, color } = getTransactionIcon(txn.type);
                return (
                  <div
                    key={txn.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50"
                  >
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {txn.description || txn.type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(txn.created_at)} at{" "}
                        {formatTime(txn.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${txn.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}
                      >
                        {txn.amount > 0 ? "+" : ""}
                        {txn.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Balance: {txn.balance_after.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Credit Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Credit Costs */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Credit Costs
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span className="font-medium">WhatsApp Message</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">1 credit</p>
                <p className="text-sm text-gray-500 mt-1">
                  Replies within 24hr window are FREE
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">SMS Message</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">1 credit</p>
                <p className="text-sm text-gray-500 mt-1">
                  Up to 160 characters per message
                </p>
              </div>
            </div>
          </div>

          {/* Credit Rules */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-violet-100 rounded-xl">
                <Shield className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Credit Rules
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    Purchased credits never expire
                  </p>
                  <p className="text-sm text-gray-500">
                    Buy once, use anytime. Your purchased credits stay in your
                    account forever.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    Monthly credits reset each billing cycle
                  </p>
                  <p className="text-sm text-gray-500">
                    Your plan's included credits refresh at the start of each
                    billing period. Unused included credits do not roll over.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    Included credits are used first
                  </p>
                  <p className="text-sm text-gray-500">
                    We always use your free included credits before touching
                    your purchased credits.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Bulk discounts</p>
                  <p className="text-sm text-gray-500">
                    Larger credit packs offer better per-credit rates. The Pro
                    pack saves up to 50% compared to Starter.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    WhatsApp 24-hour window
                  </p>
                  <p className="text-sm text-gray-500">
                    Once a customer replies to your WhatsApp message, you have
                    24 hours to send unlimited follow-up messages for free!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Purchase */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Minimum Purchase</p>
                <p className="text-sm text-amber-800 mt-1">
                  Minimum credit purchase is GH₵{CREDIT_RULES.MIN_PURCHASE_GHS}{" "}
                  / ${CREDIT_RULES.MIN_PURCHASE_USD} / ₦
                  {CREDIT_RULES.MIN_PURCHASE_NGN.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditsPage;
