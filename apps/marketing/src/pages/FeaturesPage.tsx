import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Package,
  Receipt,
  Users,
  MessageCircle,
  BarChart3,
  Globe,
  Truck,
  Megaphone,
  Search,
  BadgePercent,
  CreditCard,
  History,
  Wallet,
  LayoutGrid,
  Boxes,
  AlertCircle,
  Tag,
  Box,
  ClipboardList,
  TrendingDown,
  Building,
  UserPlus,
  Award,
  Gift,
  Target,
  TrendingUp,
  Bell,
  FileText,
  Phone,
  Calendar,
  DollarSign,
  PieChart,
  Clock,
  FileBarChart,
  Banknote,
  Store,
  Share2,
  ShoppingBag,
  CheckCircle2,
  Zap,
  ChevronRight,
} from "lucide-react";

// Realistic feature data with specific, believable details
const featureGroups = [
  {
    id: "pos",
    category: "Point of Sale",
    tagline: "Checkout in seconds, not minutes",
    description:
      "Ring up sales fast from your phone or any device. No clunky hardware, no long training. Just tap and go.",
    features: [
      {
        icon: Search,
        title: "Instant search",
        detail: "Find products in milliseconds",
        example: "Type 'nike' to see all Nike products instantly",
      },
      {
        icon: Search,
        title: "Quick search",
        detail: "By name, SKU, or category",
        example: "Type 'nike' to see all Nike products",
      },
      {
        icon: BadgePercent,
        title: "Instant discounts",
        detail: "10% off or ₵250 flat",
        example: "Tap discount → Enter amount → Done",
      },
      {
        icon: CreditCard,
        title: "Split payments",
        detail: "₵1,000 cash + ₵750 MoMo",
        example: "Customer pays ₵1,750 across 2 methods",
      },
      {
        icon: Receipt,
        title: "WhatsApp receipts",
        detail: "Sent in 2 seconds",
        example: "Auto-send to customer's phone number",
      },
      {
        icon: History,
        title: "Hold & recall",
        detail: "Park incomplete sales",
        example: "Customer left to get cash? Hold the sale",
      },
      {
        icon: Wallet,
        title: "Store credit",
        detail: "Track IOUs and prepayments",
        example: "Akua owes ₵625 from last week",
      },
      {
        icon: LayoutGrid,
        title: "Favorites grid",
        detail: "One-tap best sellers",
        example: "Your top 12 products always visible",
      },
    ],
  },
  {
    id: "inventory",
    category: "Inventory Tracking",
    tagline: "Always know what you have",
    description:
      "No more guessing games. See exactly what's in stock, get alerts before things run out, and never disappoint a customer again.",
    features: [
      {
        icon: Boxes,
        title: "Live stock counts",
        detail: "Updates with every sale",
        example: "24 Nike Air Max left (was 26 yesterday)",
      },
      {
        icon: AlertCircle,
        title: "Low stock alerts",
        detail: "When you hit 5 units or less",
        example: "⚠️ Only 3 phone cases left - reorder?",
      },
      {
        icon: Tag,
        title: "Product variants",
        detail: "Sizes, colors, styles",
        example: "T-shirt: S(12), M(24), L(8), XL(3)",
      },
      {
        icon: Box,
        title: "Stock transfers",
        detail: "Between stores/warehouses",
        example: "Move 10 units from Osu to East Legon",
      },
      {
        icon: ClipboardList,
        title: "Stock counts",
        detail: "Scan with your phone",
        example: "Count 200 items in 15 minutes",
      },
      {
        icon: TrendingDown,
        title: "Expiry tracking",
        detail: "For perishable goods",
        example: "5 items expire in 3 days - discount now?",
      },
      {
        icon: Building,
        title: "Multi-location",
        detail: "Manage 3+ locations",
        example: "Madina: 50 units • Spintex: 32 units",
      },
      {
        icon: History,
        title: "Stock history",
        detail: "Full audit trail",
        example: "Who adjusted what, when, and why",
      },
    ],
  },
  {
    id: "customers",
    category: "Customer Management",
    tagline: "Remember every customer",
    description:
      "Keep track of who buys what, who owes you, and who deserves a little extra attention. Build real relationships.",
    features: [
      {
        icon: UserPlus,
        title: "Customer profiles",
        detail: "Phone, email, preferences",
        example: "Mrs. Obi: Bought 12 times, prefers WhatsApp",
      },
      {
        icon: History,
        title: "Purchase history",
        detail: "Everything they've bought",
        example: "Last bought: 2 weeks ago, ₵2,250",
      },
      {
        icon: Award,
        title: "Loyalty points",
        detail: "1 point per ₵5 spent",
        example: "Kwame has 2,400 points (₵12K spent)",
      },
      {
        icon: Wallet,
        title: "Credit accounts",
        detail: "Buy now, pay later",
        example: "Kofi owes ₵6,375 (due Friday)",
      },
      {
        icon: Gift,
        title: "Birthday offers",
        detail: "Auto-send on their birthday",
        example: "Happy birthday! 15% off this week",
      },
      {
        icon: Target,
        title: "Customer segments",
        detail: "Group by spending/behavior",
        example: "VIP: 47 customers who spend ₵2,500+",
      },
      {
        icon: Bell,
        title: "Win-back alerts",
        detail: "When regulars disappear",
        example: "Abena hasn't visited in 30 days",
      },
      {
        icon: FileText,
        title: "Private notes",
        detail: "Remember preferences",
        example: "Always buys size 42, no credit",
      },
    ],
  },
  {
    id: "messaging",
    category: "WhatsApp & SMS",
    tagline: "Stay in touch without thinking about it",
    description:
      "Receipts, reminders, and updates go out automatically. Your customers feel taken care of, and you don't have to lift a finger.",
    features: [
      {
        icon: Receipt,
        title: "Auto receipts",
        detail: "WhatsApp after every sale",
        example: "Receipt sent to 0803-XXX-1234 ✓",
      },
      {
        icon: Truck,
        title: "Delivery updates",
        detail: "Packed, dispatched, delivered",
        example: "Your order is on the way! ETA: 2PM",
      },
      {
        icon: Bell,
        title: "Payment reminders",
        detail: "For credit customers",
        example: "Hi Kofi, ₵6,350 due tomorrow",
      },
      {
        icon: Gift,
        title: "Birthday wishes",
        detail: "With discount code",
        example: "Happy birthday! Use code BDAY15",
      },
      {
        icon: Calendar,
        title: "Appointment reminders",
        detail: "Reduce no-shows",
        example: "Tomorrow 3PM - Collection ready",
      },
      {
        icon: AlertCircle,
        title: "Back-in-stock alerts",
        detail: "When items restock",
        example: "iPhone 15 Pro now available!",
      },
      {
        icon: Megaphone,
        title: "Bulk promos",
        detail: "To 100+ customers at once",
        example: "Flash sale! 20% off all shoes today",
      },
      {
        icon: Phone,
        title: "SMS fallback",
        detail: "When WhatsApp fails",
        example: "Auto-switch to SMS for delivery",
      },
    ],
  },
  {
    id: "analytics",
    category: "Reports & Analytics",
    tagline: "See exactly where your money goes",
    description:
      "No more wondering if you're making money. See your real profit, find what's working, and spot problems before they hurt.",
    features: [
      {
        icon: TrendingUp,
        title: "Sales dashboard",
        detail: "Today, week, month",
        example: "Today: ₵17.4K (up 23% from yesterday)",
      },
      {
        icon: DollarSign,
        title: "Profit tracking",
        detail: "Revenue minus costs",
        example: "₵29.6K sales → ₵10.4K profit (35%)",
      },
      {
        icon: PieChart,
        title: "Product performance",
        detail: "Best and worst sellers",
        example: "Nike sneakers: 45 sold, ₵34K revenue",
      },
      {
        icon: Users,
        title: "Staff performance",
        detail: "Who's selling what",
        example: "Ama: 32 sales, ₵9,350 this week",
      },
      {
        icon: Clock,
        title: "Peak hours",
        detail: "When you're busiest",
        example: "Most sales: 2PM-5PM on Saturdays",
      },
      {
        icon: Package,
        title: "Inventory reports",
        detail: "Turnover and dead stock",
        example: "12 items haven't sold in 90 days",
      },
      {
        icon: FileBarChart,
        title: "Export to Excel",
        detail: "Download any report",
        example: "Jan_2026_sales.xlsx (2,847 rows)",
      },
      {
        icon: Banknote,
        title: "Cash flow",
        detail: "Money in vs money out",
        example: "Week: +₵14.2K | Month: +₵60K",
      },
    ],
  },
  {
    id: "online",
    category: "Online Store",
    tagline: "Sell online without the headache",
    description:
      "Get your own shop link in minutes. Share it anywhere: WhatsApp, Instagram, wherever your customers are. Orders come to you.",
    features: [
      {
        icon: Store,
        title: "Instant shop page",
        detail: "yourshop.warehouse.gh",
        example: "Share: warehouse.gh/bellafashion",
      },
      {
        icon: Share2,
        title: "One link everywhere",
        detail: "Instagram, WhatsApp, anywhere",
        example: "Put in your Instagram bio",
      },
      {
        icon: ShoppingBag,
        title: "Online orders",
        detail: "Customers order directly",
        example: "New order from Chioma: 3 items",
      },
      {
        icon: CreditCard,
        title: "Online payment",
        detail: "Paystack, bank transfer, cash",
        example: "₵2,250 paid via Paystack ✓",
      },
      {
        icon: Package,
        title: "Auto stock sync",
        detail: "Online & offline inventory",
        example: "Sold in-store? Online stock updates",
      },
      {
        icon: Truck,
        title: "Delivery zones",
        detail: "Set fees by area",
        example: "Osu: ₵75 • Tema: ₵125",
      },
      {
        icon: Clock,
        title: "Operating hours",
        detail: "Control when orders come",
        example: "Accept orders: 9AM-7PM only",
      },
      {
        icon: Bell,
        title: "Order notifications",
        detail: "Instant WhatsApp alerts",
        example: "🔔 New order: ₵1,750 (3 items)",
      },
    ],
  },
];

// Subtle fade in
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Hero Section - Direct and opinionated
function HeroSection() {
  return (
    <section className="pt-24 pb-12 lg:pt-32 lg:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-[800px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 mb-6 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Everything you need, nothing you don't
            </div>

            <h1 className="text-[2.5rem] leading-[1.15] lg:text-[3.25rem] font-[650] text-slate-900 mb-5 tracking-[-0.02em]">
              Tools that actually help.
              <span className="text-slate-500">
                {" "}
                Not ones that get in your way.
              </span>
            </h1>

            <p className="text-[1.0625rem] leading-relaxed text-slate-600 mb-8 max-w-[620px]">
              Inventory, sales, customers, reports. All in one place. Easy to
              learn, fast to use, and it just works. Even when your internet
              doesn't.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white text-[15px] font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-700 text-[15px] font-medium rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
              >
                See pricing
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Feature category with realistic examples
function FeatureCategory({
  group,
  index,
}: {
  group: (typeof featureGroups)[0];
  index: number;
}) {
  const isOdd = index % 2 === 1;

  return (
    <section className={`py-16 lg:py-24 ${isOdd ? "bg-slate-50/40" : ""}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-[1200px] mx-auto">
          {/* Category header - asymmetric */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            className={`mb-12 lg:mb-16 ${isOdd ? "lg:ml-auto lg:max-w-[720px]" : "max-w-[720px]"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
                {group.id === "pos" && (
                  <Receipt className="w-5 h-5 text-white" />
                )}
                {group.id === "inventory" && (
                  <Package className="w-5 h-5 text-white" />
                )}
                {group.id === "customers" && (
                  <Users className="w-5 h-5 text-white" />
                )}
                {group.id === "messaging" && (
                  <MessageCircle className="w-5 h-5 text-white" />
                )}
                {group.id === "analytics" && (
                  <BarChart3 className="w-5 h-5 text-white" />
                )}
                {group.id === "online" && (
                  <Globe className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-semibold text-slate-900">
                  {group.category}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {group.tagline}
                </p>
              </div>
            </div>
            <p className="text-[15px] text-slate-600 leading-relaxed">
              {group.description}
            </p>
          </motion.div>

          {/* Feature grid - varied layout */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {group.features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-900 transition-colors">
                    <feature.icon className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-0.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-500">{feature.detail}</p>
                  </div>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed font-mono bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                  {feature.example}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Real use case section
function UseCaseSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div>
              <p className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">
                A Typical Day
              </p>
              <h2 className="text-[2rem] lg:text-[2.5rem] font-[650] leading-tight tracking-[-0.01em] mb-5">
                See how Kofi runs his shop with Warehouse
              </h2>
              <div className="space-y-5">
                {[
                  {
                    time: "9:30 AM",
                    action: "Opens shop, checks yesterday's report",
                    detail:
                      "₵14.2K sales, 47 transactions, best seller: Nike Air Max",
                  },
                  {
                    time: "10:15 AM",
                    action: "Gets low stock alert on phone",
                    detail:
                      "Only 4 iPhone cases left - he orders 20 more from supplier",
                  },
                  {
                    time: "2:47 PM",
                    action: "Customer buys ₵4,475 worth of shoes",
                    detail:
                      "Scans barcode, applies 10% discount, takes MoMo, WhatsApp receipt sent",
                  },
                  {
                    time: "6:30 PM",
                    action: "Closes for the day, checks profit",
                    detail: "₵17.4K revenue today, ₵6.1K profit (35% margin)",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-4 border-l-2 border-slate-700 pl-5 py-1"
                  >
                    <div className="flex-shrink-0">
                      <span className="text-sm font-semibold text-emerald-400">
                        {step.time}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-medium text-white mb-1">
                        {step.action}
                      </p>
                      <p className="text-sm text-slate-400">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup showing stats */}
            <div className="relative mx-auto" style={{ maxWidth: "280px" }}>
              <div className="bg-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-b-xl z-10"></div>
                <div className="bg-slate-900 rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-slate-800 px-5 py-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-medium">6:30 PM</span>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-2.5 bg-emerald-500 rounded-sm"></div>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-xs text-slate-500">Today's Summary</p>
                    <p className="text-lg font-semibold text-white">
                      Kofi's Shop
                    </p>
                  </div>

                  {/* Stats content */}
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-white">
                          ₵460K
                        </span>
                        <span className="text-xs text-emerald-400 font-medium bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          +24%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                        Total Revenue (30 days)
                      </p>
                    </div>

                    <div className="space-y-2.5 border-t border-slate-800 pt-3">
                      {[
                        {
                          label: "Profit",
                          value: "₵160K",
                          sub: "34.8% margin",
                        },
                        {
                          label: "Transactions",
                          value: "1,247",
                          sub: "Avg: ₵369",
                        },
                        {
                          label: "Products sold",
                          value: "2,891",
                          sub: "Top: Nike Air Max",
                        },
                        {
                          label: "Messages sent",
                          value: "1,163",
                          sub: "Receipts + promos",
                        },
                      ].map((stat, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0"
                        >
                          <div>
                            <p className="text-xs text-slate-300">
                              {stat.label}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {stat.sub}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-white">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Reliability section - works anywhere, anytime
function ReliabilitySection() {
  return (
    <section className="py-16 lg:py-20 bg-slate-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
              <Zap className="w-4 h-4" />
              <span className="uppercase tracking-wide">
                Built to be reliable
              </span>
            </div>
            <h2 className="text-[1.75rem] lg:text-[2rem] font-[650] text-slate-900 leading-tight tracking-[-0.01em] mb-4">
              Your business keeps going. Even when things don't go to plan.
            </h2>
            <p className="text-[15px] text-slate-600 max-w-[560px] mx-auto">
              Internet down? Power cut? No worries. Keep selling and Warehouse
              catches up when you're back online.
            </p>
          </div>

          {/* Simple feature cards */}
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: Receipt,
                title: "Never miss a sale",
                detail:
                  "Keep selling even without internet. Everything syncs later.",
              },
              {
                icon: Package,
                title: "Stock always accurate",
                detail:
                  "Real-time updates across all your devices and locations.",
              },
              {
                icon: Users,
                title: "Customer data safe",
                detail:
                  "All your customer info backed up and accessible anywhere.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-lg p-5 text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-slate-700" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Comparison with realistic competitors
function ComparisonSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50/40">
      <div className="container mx-auto px-4">
        <div className="max-w-[1000px] mx-auto">
          <div className="mb-12">
            <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
              Honest comparison
            </p>
            <h2 className="text-[2rem] lg:text-[2.5rem] font-[650] text-slate-900 leading-tight tracking-[-0.01em] mb-4">
              Why people switch to Warehouse
            </h2>
            <p className="text-[15px] text-slate-600">
              We know you have options. Here's how we stack up.
            </p>
          </div>

          {/* Honest comparison table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-5 py-4 font-medium text-slate-500 bg-slate-50"></th>
                    <th className="text-center px-5 py-4 font-semibold text-slate-900 bg-white min-w-[140px]">
                      Warehouse
                    </th>
                    <th className="text-center px-5 py-4 font-medium text-slate-500 bg-slate-50 min-w-[140px]">
                      Excel + WhatsApp
                    </th>
                    <th className="text-center px-5 py-4 font-medium text-slate-500 bg-slate-50 min-w-[140px]">
                      Expensive POS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    {
                      feature: "Works offline",
                      warehouse: true,
                      excel: "Sort of",
                      expensive: false,
                    },
                    {
                      feature: "No hardware needed",
                      warehouse: true,
                      excel: true,
                      expensive: false,
                    },
                    {
                      feature: "Real profit tracking",
                      warehouse: true,
                      excel: false,
                      expensive: true,
                    },
                    {
                      feature: "WhatsApp integration",
                      warehouse: true,
                      excel: "Manual",
                      expensive: false,
                    },
                    {
                      feature: "Setup time",
                      warehouse: "10 min",
                      excel: "-",
                      expensive: "2 days",
                    },
                    {
                      feature: "Monthly cost",
                      warehouse: "From ₵49",
                      excel: "Free",
                      expensive: "₵500+",
                    },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3.5 font-medium text-slate-700 bg-slate-50">
                        {row.feature}
                      </td>
                      <td className="px-5 py-3.5 text-center bg-white">
                        {typeof row.warehouse === "boolean" ? (
                          row.warehouse ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <span className="text-slate-400">-</span>
                          )
                        ) : (
                          <span className="font-medium text-slate-900">
                            {row.warehouse}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center bg-slate-50">
                        {typeof row.excel === "boolean" ? (
                          row.excel ? (
                            <CheckCircle2 className="w-5 h-5 text-slate-400 mx-auto" />
                          ) : (
                            <span className="text-slate-400">-</span>
                          )
                        ) : (
                          <span className="text-slate-600">{row.excel}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center bg-slate-50">
                        {typeof row.expensive === "boolean" ? (
                          row.expensive ? (
                            <CheckCircle2 className="w-5 h-5 text-slate-400 mx-auto" />
                          ) : (
                            <span className="text-slate-400">-</span>
                          )
                        ) : (
                          <span className="text-slate-600">
                            {row.expensive}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Final CTA
function FinalCTA() {
  return (
    <section className="py-20 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="text-[2rem] lg:text-[2.75rem] font-[650] text-slate-900 leading-tight tracking-[-0.01em] mb-5">
            Give it a try. It's free for 7 days.
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            No credit card needed. No strings attached. Just sign up and see if
            it works for you. We think it will.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 text-white text-[15px] font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Start 7-day trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-slate-700 text-[15px] font-medium rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
            >
              See pricing
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Main Component
export default function FeaturesPage() {
  return (
    <div className="bg-white">
      <HeroSection />
      {featureGroups.map((group, index) => (
        <FeatureCategory key={group.id} group={group} index={index} />
      ))}
      <UseCaseSection />
      <ReliabilitySection />
      <ComparisonSection />
      <FinalCTA />
    </div>
  );
}
