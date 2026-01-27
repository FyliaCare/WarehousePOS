import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  TrendingUp,
  Users,
  Receipt,
  ChevronRight,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { useGeoLocaleContext } from "../contexts/GeoLocaleContext";
import { formatPrice } from "../lib/geo-locale";

// Subtle, natural animations
const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Hero Section - Asymmetric, opinionated layout
function HeroSection() {
  const { locale } = useGeoLocaleContext();

  return (
    <section className="pt-24 pb-16 lg:pt-32 lg:pb-24">
      <div className="container mx-auto px-4">
        {/* Asymmetric two-column layout */}
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-start max-w-[1400px] mx-auto">
          {/* Left: Content (slightly wider) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-8"
          >
            {/* Small, understated badge */}
            <div className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 mb-7 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Used by 10,000+ businesses
            </div>

            <h1 className="text-[2.75rem] leading-[1.15] lg:text-[3.5rem] font-[650] text-slate-900 mb-6 tracking-[-0.02em]">
              You run the business.
              <br />
              <span className="text-slate-600">
                We'll handle the paperwork.
              </span>
            </h1>

            <p className="text-[1.0625rem] leading-relaxed text-slate-600 mb-8 max-w-[520px]">
              Warehouse keeps track of your inventory, sales, and customers. So
              you can spend less time on admin and more time doing what you
              love: building your business.
            </p>

            {/* CTA with realistic secondary action */}
            <div className="flex flex-col sm:flex-row gap-3 mb-9">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white text-[15px] font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
              >
                Start 7-day trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-slate-700 text-[15px] font-medium rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
              >
                See it in action
              </a>
            </div>

            {/* Realistic trust indicators - varied, not perfectly aligned */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Free for 7 days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Setup in 10 minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>No hardware needed</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Realistic Phone Mockup showing the actual app */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:mt-4"
          >
            {/* Phone Frame */}
            <div className="relative mx-auto" style={{ maxWidth: "280px" }}>
              {/* Phone bezel */}
              <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-10"></div>

                {/* Screen */}
                <div className="bg-white rounded-[2rem] overflow-hidden relative">
                  {/* Status bar */}
                  <div className="bg-slate-50 px-5 py-2 flex items-center justify-between text-[10px]">
                    <span className="font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-2 bg-slate-400 rounded-sm"></div>
                        <div className="w-1 h-2.5 bg-slate-400 rounded-sm"></div>
                        <div className="w-1 h-3 bg-slate-400 rounded-sm"></div>
                        <div className="w-1 h-3.5 bg-slate-300 rounded-sm"></div>
                      </div>
                      <div className="w-5 h-2.5 bg-emerald-500 rounded-sm"></div>
                    </div>
                  </div>

                  {/* App header */}
                  <div className="bg-slate-900 text-white px-4 py-3">
                    <p className="text-xs text-slate-400">Dashboard</p>
                    <p className="text-lg font-semibold">Today's Sales</p>
                  </div>

                  {/* Sales summary */}
                  <div className="p-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-slate-900">
                        ₵4,287
                      </span>
                      <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                        +23%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      32 sales • ₵134 avg
                    </p>

                    {/* Recent transactions */}
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">
                      Recent
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          item: "Nike Air Max 270",
                          qty: 2,
                          amount: "₵1,100",
                          method: "MoMo",
                        },
                        {
                          item: "Wireless Earbuds",
                          qty: 1,
                          amount: "₵295",
                          method: "Cash",
                        },
                        {
                          item: "Phone Case",
                          qty: 3,
                          amount: "₵196",
                          method: "Card",
                        },
                      ].map((tx, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">
                              {tx.item}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Qty {tx.qty} • {tx.method}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-slate-900">
                            {tx.amount}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Bottom nav indicator */}
                    <div className="flex justify-center gap-8 mt-4 pt-3 border-t border-slate-100">
                      <div className="text-center">
                        <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-1">
                          <TrendingUp className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[9px] text-slate-900 font-medium">
                          Home
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-1">
                          <Receipt className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-[9px] text-slate-400">POS</span>
                      </div>
                      <div className="text-center">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-1">
                          <Package className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-[9px] text-slate-400">Stock</span>
                      </div>
                      <div className="text-center">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-1">
                          <Users className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-[9px] text-slate-400">More</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-[2.5rem] pointer-events-none"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Problem statement - real pain points, not generic benefits
function ProblemSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px] mx-auto">
          {/* Offset heading */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 lg:mb-16"
          >
            <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
              The Problem
            </p>
            <h2 className="text-[2rem] lg:text-[2.5rem] font-[650] text-slate-900 leading-tight tracking-[-0.01em] max-w-[680px]">
              You didn't start a business to spend your nights in spreadsheets.
            </h2>
          </motion.div>

          {/* Asymmetric grid of real problems */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            {[
              {
                problem: "The admin never ends",
                reality:
                  "Counting stock, writing receipts, updating records. There's always more.",
              },
              {
                problem: "You're flying blind",
                reality:
                  "Sales are coming in, but are you actually making money? Hard to say.",
              },
              {
                problem: "Everything's scattered",
                reality:
                  "Customer orders on WhatsApp. Contacts in your phone. Prices in your head.",
              },
              {
                problem: "Good customers slip away",
                reality:
                  "Life gets busy. You forget to follow up. They go somewhere else.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border-l-2 border-slate-300 pl-5 py-1"
              >
                <p className="text-[15px] font-medium text-slate-900 mb-1.5">
                  {item.problem}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.reality}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// How it works - actual product flow, not features list
function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-14">
            <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
              How it works
            </p>
            <h2 className="text-[2rem] lg:text-[2.5rem] font-[650] text-slate-900 leading-tight tracking-[-0.01em]">
              Let us worry about the details.
            </h2>
          </div>

          {/* Asymmetric step layout with realistic screens */}
          <div className="space-y-16 lg:space-y-24">
            {/* Step 1 */}
            <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center">
              <div className="lg:order-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-semibold">
                    1
                  </span>
                  <span className="uppercase tracking-wide">Add Products</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-4 leading-tight">
                  Import your inventory in minutes
                </h3>
                <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                  Upload a CSV from your Excel sheet or add products one by one.
                  Our smart system auto-fills details. Takes about 10 minutes
                  for most shops.
                </p>
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200/50 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm text-amber-900">
                    <strong className="font-semibold">Real example:</strong>{" "}
                    Kofi in Accra imported 200 products in under 15 minutes
                  </p>
                </div>
              </div>
              <div className="lg:order-2">
                {/* Phone mockup - Product Import */}
                <div className="relative mx-auto" style={{ maxWidth: "260px" }}>
                  <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-xl z-10"></div>
                    <div className="bg-white rounded-[2rem] overflow-hidden">
                      {/* Header */}
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          Import Products
                        </span>
                        <button className="text-slate-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-900">
                                inventory.csv
                              </p>
                              <p className="text-[10px] text-slate-500">
                                187 products found
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {["Name", "Price", "Stock", "SKU"].map((field, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between py-1.5 border-b border-slate-100"
                            >
                              <span className="text-xs text-slate-600">
                                {field}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                                Col {String.fromCharCode(65 + i)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button className="w-full py-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg">
                          Import 187 Products
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
              <div>
                {/* Phone mockup - POS interface */}
                <div className="relative mx-auto" style={{ maxWidth: "260px" }}>
                  <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-xl z-10"></div>
                    <div className="bg-white rounded-[2rem] overflow-hidden">
                      {/* Header */}
                      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                        <span className="text-xs font-medium">New Sale</span>
                        <span className="text-[10px] text-slate-400">
                          3:47 PM
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        {/* Sale items */}
                        {[
                          { name: "Men's Polo Shirt", price: 190, qty: 2 },
                          { name: "Denim Jeans", price: 345, qty: 1 },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-xs font-medium text-slate-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                ₵{item.price}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center">
                                <Minus className="w-2.5 h-2.5 text-slate-600" />
                              </button>
                              <span className="text-xs font-medium text-slate-900 w-4 text-center">
                                {item.qty}
                              </span>
                              <button className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center">
                                <Plus className="w-2.5 h-2.5 text-slate-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-slate-200 pt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Subtotal</span>
                            <span className="font-medium text-slate-900">
                              ₵725
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-slate-900">Total</span>
                            <span className="text-slate-900">₵725</span>
                          </div>
                        </div>
                        <button className="w-full py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg">
                          Charge ₵725
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-semibold">
                    2
                  </span>
                  <span className="uppercase tracking-wide">Sell Smarter</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-4 leading-tight">
                  Serve customers while we track everything
                </h3>
                <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                  Focus on your customers. Warehouse automatically tracks
                  inventory, updates stock, and sends receipts. You just make
                  the sale.
                </p>
                <div className="space-y-2.5">
                  {[
                    "Automatic inventory updates",
                    "WhatsApp receipts in one tap",
                    "Customer history saved automatically",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center">
              <div className="lg:order-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-semibold">
                    3
                  </span>
                  <span className="uppercase tracking-wide">Grow Smarter</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-4 leading-tight">
                  Make decisions with real data, not guesses
                </h3>
                <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                  See what's actually making you money. Know which products to
                  restock, which customers to follow up with, and where to focus
                  your energy.
                </p>
                <p className="text-sm text-slate-500 italic">
                  "Warehouse showed me my actual margins. I was pricing some
                  items way too low. Changed everything."
                </p>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Akua, Accra
                </p>
              </div>
              <div className="lg:order-2">
                {/* Phone mockup - Analytics dashboard */}
                <div className="relative mx-auto" style={{ maxWidth: "260px" }}>
                  <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-xl z-10"></div>
                    <div className="bg-white rounded-[2rem] overflow-hidden">
                      {/* Header */}
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                        <span className="text-xs font-medium text-slate-700">
                          This Week
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="p-2.5 bg-slate-50 rounded-lg">
                            <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">
                              Revenue
                            </p>
                            <p className="text-lg font-semibold text-slate-900">
                              ₵29.6K
                            </p>
                            <p className="text-[10px] text-emerald-600 font-medium">
                              +18%
                            </p>
                          </div>
                          <div className="p-2.5 bg-emerald-50 rounded-lg">
                            <p className="text-[10px] text-slate-600 mb-0.5 uppercase tracking-wide">
                              Profit
                            </p>
                            <p className="text-lg font-semibold text-emerald-900">
                              ₵10.4K
                            </p>
                            <p className="text-[10px] text-emerald-700 font-medium">
                              35% margin
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                            Top Products
                          </p>
                          {[
                            {
                              name: "Black Sneakers",
                              sold: 24,
                              revenue: "₵4,730",
                            },
                            {
                              name: "Cotton T-Shirts",
                              sold: 31,
                              revenue: "₵2,675",
                            },
                            {
                              name: "Baseball Caps",
                              sold: 18,
                              revenue: "₵1,552",
                            },
                          ].map((product, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                            >
                              <div className="flex-1">
                                <p className="text-xs font-medium text-slate-900">
                                  {product.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {product.sold} sold
                                </p>
                              </div>
                              <p className="text-xs font-semibold text-slate-900">
                                {product.revenue}
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
        </div>
      </div>
    </section>
  );
}

// Social proof with realistic, specific examples
function SocialProofSection() {
  const { locale } = useGeoLocaleContext();

  return (
    <section className="py-16 lg:py-20 bg-slate-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium text-slate-500 mb-2">
              Trusted by 10,000+ businesses across Africa
            </p>
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900">
              More time for customers. More clarity on profits.
            </h2>
          </div>

          {/* Asymmetric testimonial cards with varied heights */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "I used to spend 2 hours every night updating my records. Now Warehouse does it automatically. I actually have time for my family again.",
                author: "Kwame A.",
                role: "Phone accessories",
                location: "Kumasi",
                metric: "2hrs saved daily",
              },
              {
                quote:
                  "For the first time, I can see exactly which products make me money and which ones just sit there. Grew my profit by 40% in 3 months.",
                author: "Ama S.",
                role: "Fashion boutique",
                location: "Accra",
                metric: "+40% profit",
              },
              {
                quote:
                  "The low stock alerts and customer follow-ups are gold. I never miss reorders or forget to check on my regulars anymore.",
                author: "Kofi M.",
                role: "Supermarket",
                location: "Tema",
                metric: "200+ products",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col"
              >
                <p className="text-[15px] text-slate-700 leading-relaxed mb-5 flex-1">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-start justify-between pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-slate-500">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                  <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md whitespace-nowrap">
                    {testimonial.metric}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Pricing with realistic edge cases and details
function PricingSection() {
  const { locale } = useGeoLocaleContext();

  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-[1000px] mx-auto">
          <div className="mb-12 max-w-[600px]">
            <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
              Pricing
            </p>
            <h2 className="text-[2rem] lg:text-[2.5rem] font-[650] text-slate-900 leading-tight tracking-[-0.01em] mb-4">
              Try free for 7 days.
              <br />
              Then pay what makes sense.
            </h2>
            <p className="text-[15px] text-slate-600">
              No credit card needed. Cancel anytime. Actually.
            </p>
          </div>

          {/* Asymmetric pricing cards */}
          <div className="grid md:grid-cols-[1fr_1.15fr] gap-6 mb-8">
            {/* Starter */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-7">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Starter
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-slate-900">
                    {formatPrice(locale.pricing.starter, locale)}
                  </span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-600">
                  Billed monthly • Try free for 7 days
                </p>
              </div>

              <ul className="space-y-3 mb-7">
                {[
                  "200 products",
                  "500 sales/month",
                  "Inventory tracking",
                  "Low stock alerts",
                  "Online shop link",
                  "WhatsApp receipts (30/day)",
                  "Works offline",
                  "Customer profiles",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className="block w-full py-3 text-center text-sm font-medium bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Start free trial
              </Link>
            </div>

            {/* Growth - Recommended */}
            <div className="bg-slate-900 text-white rounded-xl p-7 relative border-2 border-slate-900">
              <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most popular
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Growth</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold">
                    {formatPrice(locale.pricing.growth, locale)}
                  </span>
                  <span className="text-slate-400">/month</span>
                </div>
                <p className="text-sm text-slate-400">
                  Billed monthly • Try free for 7 days
                </p>
              </div>

              <ul className="space-y-3 mb-7">
                {[
                  "1,000 products",
                  "2,000 sales/month",
                  "3 staff accounts",
                  "Profit & loss reports",
                  "Gift cards & promo codes",
                  "WhatsApp + SMS (100/day)",
                  "CSV import/export",
                  "Priority support",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-100"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className="block w-full py-3 text-center text-sm font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Start free trial
              </Link>

              <p className="text-xs text-slate-400 mt-4 text-center">
                Save 20% with annual billing
              </p>
            </div>
          </div>

          {/* Realistic FAQ/edge cases */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
            <p className="text-sm font-medium text-slate-900">
              Common questions:
            </p>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <strong className="text-slate-900">
                  What happens after 7 days?
                </strong>{" "}
                We'll send you an email. You can upgrade, downgrade, or cancel.
                We don't auto-charge.
              </p>
              <p>
                <strong className="text-slate-900">
                  Can I switch plans later?
                </strong>{" "}
                Yes. Upgrade anytime. Downgrade at your next billing cycle.
              </p>
              <p>
                <strong className="text-slate-900">
                  Need more? Business plan at ₵199/month
                </strong>{" "}
                5,000 products, 10 staff, 3 locations, delivery management, AI
                insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Final CTA with real urgency, not fake scarcity
function FinalCTA() {
  return (
    <section className="py-20 lg:py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="text-[2rem] lg:text-[2.75rem] font-[650] text-white leading-tight tracking-[-0.01em] mb-5">
            Ready to take back
            <br />
            your evenings?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-[560px] mx-auto">
            Less time on paperwork. More time with customers, family, and the
            things that actually matter. Give it a try.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-slate-900 text-[15px] font-medium rounded-lg hover:bg-slate-100 transition-colors"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white text-[15px] font-medium rounded-lg hover:bg-slate-800 transition-colors border border-slate-700"
            >
              See how it works
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-slate-400">
            Free for 7 days • No credit card required • Setup in 10 minutes
          </p>
        </div>
      </div>
    </section>
  );
}

// Main HomePage Component
export function HomePage() {
  return (
    <div className="bg-white">
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <SocialProofSection />
      <PricingSection />
      <FinalCTA />
    </div>
  );
}

export default HomePage;
