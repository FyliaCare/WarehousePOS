import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ExternalLink,
  ArrowRight,
  Coins,
  CreditCard,
  GraduationCap,
  HeadphonesIcon,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  Calendar,
  Zap,
  BarChart3,
  MessageSquare,
  BookOpen,
  Trophy,
  Play,
  Send,
  Sparkles,
  Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";

// ============================================
// TYPES
// ============================================

interface PortalStats {
  credits: {
    balance: number;
    monthlyIncluded: number;
    monthlyUsed: number;
    lastPurchase: string | null;
  };
  subscription: {
    plan: string;
    status: "active" | "trialing" | "past_due" | "canceled";
    renewalDate: string;
    daysRemaining: number;
    price: number;
    currency: string;
  };
  training: {
    completedModules: number;
    totalModules: number;
    currentStreak: number;
    xpPoints: number;
    level: number;
  };
  support: {
    openTickets: number;
    avgResponseTime: string;
    lastTicketDate: string | null;
  };
  usage: {
    products: { used: number; limit: number };
    sales: { used: number; limit: number };
    storage: { used: number; limit: number };
  };
}

interface Activity {
  id: string;
  type: "credit" | "subscription" | "training" | "support" | "usage";
  title: string;
  description: string;
  time: string;
  icon: "coins" | "card" | "book" | "message" | "chart";
}

interface TrainingModule {
  id: string;
  name: string;
  progress: number;
  lessons: number;
  completedLessons: number;
  emoji: string;
}

// ============================================
// DEFAULT/EMPTY STATS
// ============================================

const emptyStats: PortalStats = {
  credits: {
    balance: 0,
    monthlyIncluded: 0,
    monthlyUsed: 0,
    lastPurchase: null,
  },
  subscription: {
    plan: "Free",
    status: "trialing",
    renewalDate: "-",
    daysRemaining: 0,
    price: 0,
    currency: "GHS",
  },
  training: {
    completedModules: 0,
    totalModules: 10,
    currentStreak: 0,
    xpPoints: 0,
    level: 1,
  },
  support: {
    openTickets: 0,
    avgResponseTime: "-",
    lastTicketDate: null,
  },
  usage: {
    products: { used: 0, limit: 50 },
    sales: { used: 0, limit: 100 },
    storage: { used: 0, limit: 500 },
  },
};

// ============================================
// STATIC TRAINING MODULES (no DB table yet)
// ============================================

const staticTrainingModules: TrainingModule[] = [
  {
    id: "1",
    name: "Getting Started",
    progress: 0,
    lessons: 5,
    completedLessons: 0,
    emoji: "🚀",
  },
  {
    id: "2",
    name: "POS Basics",
    progress: 0,
    lessons: 8,
    completedLessons: 0,
    emoji: "💳",
  },
  {
    id: "3",
    name: "Inventory",
    progress: 0,
    lessons: 6,
    completedLessons: 0,
    emoji: "📦",
  },
  {
    id: "4",
    name: "Reports",
    progress: 0,
    lessons: 5,
    completedLessons: 0,
    emoji: "📊",
  },
];

// ============================================
// HELPERS
// ============================================

function formatCurrency(amount: number, currency: string = "GHS"): string {
  const symbols: Record<string, string> = {
    GHS: "GH₵",
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbols[currency] || currency;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

function getUsagePercentage(used: number, limit: number): number {
  return Math.round((used / limit) * 100);
}

function getStatusBadge(status: PortalStats["subscription"]["status"]) {
  const configs = {
    active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
    trialing: { label: "Trial", className: "bg-blue-100 text-blue-700" },
    past_due: { label: "Past Due", className: "bg-red-100 text-red-700" },
    canceled: { label: "Canceled", className: "bg-gray-100 text-gray-700" },
  };
  return configs[status];
}

function getActivityIcon(icon: Activity["icon"]) {
  const icons = {
    coins: Coins,
    card: CreditCard,
    book: BookOpen,
    message: MessageSquare,
    chart: BarChart3,
  };
  return icons[icon];
}

function getActivityColor(type: Activity["type"]) {
  const colors = {
    credit: "bg-amber-100 text-amber-600",
    subscription: "bg-violet-100 text-violet-600",
    training: "bg-blue-100 text-blue-600",
    support: "bg-emerald-100 text-emerald-600",
    usage: "bg-gray-100 text-gray-600",
  };
  return colors[type];
}

// ============================================
// DASHBOARD COMPONENT
// ============================================

export function PortalDashboard() {
  const { user } = useOutletContext<{ user: any }>();
  const { tenant, subscription } = useAuthStore();

  // State for real data
  const [portalStats, setPortalStats] = useState<PortalStats>(emptyStats);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>(
    staticTrainingModules,
  );
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchDashboardData();
  }, [tenant?.id, user?.id]);

  const fetchDashboardData = async () => {
    if (!tenant?.id || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [
        creditsResult,
        subscriptionResult,
        productsResult,
        salesResult,
        ticketsResult,
        transactionsResult,
      ] = await Promise.all([
        // User credits
        supabase
          .from("user_credits")
          .select("*")
          .eq("user_id", user.id)
          .single(),

        // Subscription with plan details
        supabase
          .from("tenant_subscriptions")
          .select(
            `
            *,
            plan:subscription_plans(*)
          `,
          )
          .eq("tenant_id", tenant.id)
          .single(),

        // Products count
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("is_active", true),

        // Sales this month
        supabase
          .from("sales")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1,
            ).toISOString(),
          ),

        // Support tickets
        supabase
          .from("support_tickets")
          .select("id, status, created_at", { count: "exact" })
          .eq("tenant_id", tenant.id)
          .in("status", ["open", "in_progress", "waiting_customer"]),

        // Recent transactions for activity
        supabase
          .from("credit_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Process credits data
      const credits = creditsResult.data;
      const creditsBalance = credits?.balance || 0;
      const includedCredits = credits?.included_credits || 0;
      const includedRemaining = credits?.included_remaining || 0;
      const monthlyUsed = includedCredits - includedRemaining;

      // Process subscription data
      const sub = subscriptionResult.data;
      const plan = sub?.plan as any;
      const periodEnd = sub?.current_period_end
        ? new Date(sub.current_period_end)
        : null;
      const daysRemaining = periodEnd
        ? Math.max(
            0,
            Math.ceil(
              (periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            ),
          )
        : 0;
      const renewalDate = periodEnd
        ? periodEnd.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "-";

      // Map status
      const mapStatus = (s: string): PortalStats["subscription"]["status"] => {
        const statusMap: Record<string, PortalStats["subscription"]["status"]> =
          {
            active: "active",
            trialing: "trialing",
            past_due: "past_due",
            canceled: "canceled",
            expired: "canceled",
            paused: "canceled",
          };
        return statusMap[s] || "trialing";
      };

      // Process usage data
      const productsUsed = productsResult.count || 0;
      const salesUsed = salesResult.count || 0;
      const productsLimit = plan?.max_products || 50;
      const salesLimit = plan?.max_sales_per_month || 100;
      const storageLimit = plan?.storage_limit_mb || 500;

      // Process support data
      const openTickets = ticketsResult.count || 0;
      const lastTicket = ticketsResult.data?.[0];
      const lastTicketDate = lastTicket?.created_at
        ? new Date(lastTicket.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : null;

      // Set portal stats
      setPortalStats({
        credits: {
          balance: creditsBalance,
          monthlyIncluded: includedCredits,
          monthlyUsed: Math.max(0, monthlyUsed),
          lastPurchase: null,
        },
        subscription: {
          plan: plan?.name || "Free",
          status: mapStatus(sub?.status || "trialing"),
          renewalDate,
          daysRemaining,
          price: plan?.price_monthly || 0,
          currency: "GHS",
        },
        training: {
          completedModules: 0, // TODO: Implement training progress tracking
          totalModules: 10,
          currentStreak: 0,
          xpPoints: 0,
          level: 1,
        },
        support: {
          openTickets,
          avgResponseTime: "2 hrs",
          lastTicketDate,
        },
        usage: {
          products: { used: productsUsed, limit: productsLimit },
          sales: { used: salesUsed, limit: salesLimit },
          storage: { used: 0, limit: storageLimit }, // TODO: Calculate actual storage
        },
      });

      // Process recent activity
      const transactions = transactionsResult.data || [];
      const activities: Activity[] = transactions.map(
        (tx: any, idx: number) => ({
          id: tx.id || `act-${idx}`,
          type:
            tx.type === "pack_purchase"
              ? "credit"
              : tx.type === "usage"
                ? "usage"
                : "credit",
          title: getActivityTitle(tx.type),
          description: tx.description || "",
          time: formatTimeAgo(tx.created_at),
          icon:
            tx.type === "pack_purchase"
              ? "coins"
              : tx.type === "usage"
                ? "chart"
                : "coins",
        }),
      );

      // Add subscription activity if available
      if (sub?.created_at) {
        activities.push({
          id: "sub-" + sub.id,
          type: "subscription",
          title:
            sub.status === "trialing" ? "Trial started" : "Subscription active",
          description: `${plan?.name || "Free"} plan`,
          time: formatTimeAgo(sub.created_at),
          icon: "card",
        });
      }

      setRecentActivity(activities.slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // Keep default empty stats on error
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getActivityTitle = (type: string): string => {
    const titles: Record<string, string> = {
      pack_purchase: "Credits purchased",
      usage: "Credits used",
      monthly_allocation: "Monthly credits added",
      refund: "Credits refunded",
      adjustment: "Balance adjusted",
    };
    return titles[type] || "Activity";
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  };

  const creditUsagePercent =
    portalStats.credits.monthlyIncluded > 0
      ? getUsagePercentage(
          portalStats.credits.monthlyUsed,
          portalStats.credits.monthlyIncluded,
        )
      : 0;
  const statusBadge = getStatusBadge(portalStats.subscription.status);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Welcome back, {user?.full_name?.split(" ")[0] || "there"}! 👋
              </h1>
              <p className="text-violet-100">
                Manage your Warehouse subscription, credits, and learn how to
                use the platform.
              </p>
            </div>
            <a
              href="https://warehouse-qofj.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors w-fit"
            >
              <ExternalLink className="w-4 h-4" />
              Open POS App
            </a>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-amber-300" />
                <span className="text-sm text-white/70">Credit Balance</span>
              </div>
              <p className="text-2xl font-bold">
                {portalStats.credits.balance}
              </p>
              <p className="text-xs text-white/60 mt-1">
                {portalStats.credits.monthlyIncluded -
                  portalStats.credits.monthlyUsed}{" "}
                monthly left
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-emerald-300" />
                <span className="text-sm text-white/70">Current Plan</span>
              </div>
              <p className="text-2xl font-bold">
                {portalStats.subscription.plan}
              </p>
              <p className="text-xs text-white/60 mt-1">
                Renews in {portalStats.subscription.daysRemaining} days
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-blue-300" />
                <span className="text-sm text-white/70">Training</span>
              </div>
              <p className="text-2xl font-bold">
                Level {portalStats.training.level}
              </p>
              <p className="text-xs text-white/60 mt-1">
                {portalStats.training.completedModules}/
                {portalStats.training.totalModules} modules
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <HeadphonesIcon className="w-4 h-4 text-pink-300" />
                <span className="text-sm text-white/70">Support</span>
              </div>
              <p className="text-2xl font-bold">
                {portalStats.support.openTickets}
              </p>
              <p className="text-xs text-white/60 mt-1">Open ticket(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Credits Card */}
        <Link
          to="/portal/credits"
          className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg hover:border-amber-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5 text-amber-600" />
            </div>
            {portalStats.credits.balance < 50 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
                <AlertTriangle className="w-3 h-3" />
                Low
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {portalStats.credits.balance}
          </div>
          <p className="text-sm text-gray-500">SMS/WhatsApp Credits</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Monthly used</span>
              <span>
                {portalStats.credits.monthlyUsed}/
                {portalStats.credits.monthlyIncluded}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${creditUsagePercent >= 90 ? "bg-red-500" : creditUsagePercent >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
              />
            </div>
          </div>
        </Link>

        {/* Subscription Card */}
        <Link
          to="/portal/subscription"
          className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg hover:border-violet-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-violet-100 rounded-xl group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5 text-violet-600" />
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {portalStats.subscription.plan}
          </div>
          <p className="text-sm text-gray-500">
            {formatCurrency(portalStats.subscription.price)}/month
          </p>
          <div className="flex items-center gap-1 mt-3 text-xs text-violet-600 font-medium">
            <Calendar className="w-3 h-3" />
            <span>Renews {portalStats.subscription.renewalDate}</span>
          </div>
        </Link>

        {/* Training Card */}
        <Link
          to="/portal/training"
          className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
              <Zap className="w-3 h-3" />
              {portalStats.training.currentStreak} day streak
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Math.round(
              (portalStats.training.completedModules /
                portalStats.training.totalModules) *
                100,
            )}
            %
          </div>
          <p className="text-sm text-gray-500">Training Complete</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Trophy className="w-3 h-3" />
              <span>{portalStats.training.xpPoints} XP</span>
            </div>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">
              Level {portalStats.training.level}
            </span>
          </div>
        </Link>

        {/* Support Card */}
        <Link
          to="/portal/support"
          className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg hover:border-emerald-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-100 rounded-xl group-hover:scale-110 transition-transform">
              <HeadphonesIcon className="w-5 h-5 text-emerald-600" />
            </div>
            {portalStats.support.openTickets > 0 && (
              <span className="min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-emerald-500 text-white flex items-center justify-center">
                {portalStats.support.openTickets}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">Support</div>
          <p className="text-sm text-gray-500">Chat with our team</p>
          <div className="flex items-center gap-1 mt-3 text-xs text-emerald-600 font-medium">
            <Clock className="w-3 h-3" />
            <span>Avg. response: {portalStats.support.avgResponseTime}</span>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Usage Overview - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl border">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="font-semibold text-gray-900">Usage This Month</h2>
              <p className="text-sm text-gray-500">Monitor your plan limits</p>
            </div>
            <Link
              to="/portal/subscription"
              className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              View plan details
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {/* Products Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Products
                </span>
                <span className="text-sm text-gray-500">
                  {portalStats.usage.products.used} /{" "}
                  {portalStats.usage.products.limit}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    getUsagePercentage(
                      portalStats.usage.products.used,
                      portalStats.usage.products.limit,
                    ) >= 90
                      ? "bg-red-500"
                      : getUsagePercentage(
                            portalStats.usage.products.used,
                            portalStats.usage.products.limit,
                          ) >= 70
                        ? "bg-amber-500"
                        : "bg-violet-500"
                  }`}
                  style={{
                    width: `${getUsagePercentage(portalStats.usage.products.used, portalStats.usage.products.limit)}%`,
                  }}
                />
              </div>
            </div>

            {/* Sales Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Sales This Month
                </span>
                <span className="text-sm text-gray-500">
                  {portalStats.usage.sales.used} /{" "}
                  {portalStats.usage.sales.limit}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    getUsagePercentage(
                      portalStats.usage.sales.used,
                      portalStats.usage.sales.limit,
                    ) >= 90
                      ? "bg-red-500"
                      : getUsagePercentage(
                            portalStats.usage.sales.used,
                            portalStats.usage.sales.limit,
                          ) >= 70
                        ? "bg-amber-500"
                        : "bg-violet-500"
                  }`}
                  style={{
                    width: `${getUsagePercentage(portalStats.usage.sales.used, portalStats.usage.sales.limit)}%`,
                  }}
                />
              </div>
            </div>

            {/* Storage Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Storage (MB)
                </span>
                <span className="text-sm text-gray-500">
                  {portalStats.usage.storage.used} /{" "}
                  {portalStats.usage.storage.limit}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    getUsagePercentage(
                      portalStats.usage.storage.used,
                      portalStats.usage.storage.limit,
                    ) >= 90
                      ? "bg-red-500"
                      : getUsagePercentage(
                            portalStats.usage.storage.used,
                            portalStats.usage.storage.limit,
                          ) >= 70
                        ? "bg-amber-500"
                        : "bg-violet-500"
                  }`}
                  style={{
                    width: `${getUsagePercentage(portalStats.usage.storage.used, portalStats.usage.storage.limit)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Need more?</p>
                  <p className="text-sm text-gray-500">
                    Upgrade for higher limits
                  </p>
                </div>
              </div>
              <Link
                to="/portal/subscription"
                className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-2">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs text-gray-400">
                  Your activity will appear here
                </p>
              </div>
            ) : (
              recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.icon);
                const colorClass = getActivityColor(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Training Progress Section */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold text-gray-900">Training Progress</h2>
            <p className="text-sm text-gray-500">
              Continue learning how to use Warehouse POS
            </p>
          </div>
          <Link
            to="/portal/training"
            className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            View all modules
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trainingModules.map((module) => (
            <Link
              key={module.id}
              to="/portal/training"
              className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{module.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {module.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {module.completedLessons}/{module.lessons} lessons
                  </p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    module.progress === 100 ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${module.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {module.progress}% complete
                </span>
                {module.progress === 100 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Play className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/portal/credits"
          className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform">
            <Coins className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Buy Credits</p>
            <p className="text-sm text-gray-600">
              Get more SMS & WhatsApp credits
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-600 ml-auto" />
        </Link>

        <Link
          to="/portal/training"
          className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Continue Training</p>
            <p className="text-sm text-gray-600">
              Learn how to use the POS app
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-600 ml-auto" />
        </Link>

        <Link
          to="/portal/support"
          className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-lg transition-all group"
        >
          <div className="p-3 bg-emerald-100 rounded-xl group-hover:scale-110 transition-transform">
            <Send className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Get Help</p>
            <p className="text-sm text-gray-600">Chat with our support team</p>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-600 ml-auto" />
        </Link>
      </div>
    </div>
  );
}

export default PortalDashboard;
