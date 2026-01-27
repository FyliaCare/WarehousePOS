import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  X,
  ArrowRight,
  ChevronRight,
  WifiOff,
  Zap,
  MessageCircle,
} from "lucide-react";
import { useGeoLocaleContext } from "../contexts/GeoLocaleContext";

// Helper function for Ghana pricing
function formatPrice(amount: number, locale: any) {
  if (amount === 0) return "₵0";
  return `₵${amount.toLocaleString()}`;
}

// Hero - Direct and opinionated
function HeroSection() {
  return (
    <section className="pt-24 pb-12 lg:pt-32 lg:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-[760px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-[2.5rem] lg:text-[3.25rem] font-[650] text-slate-900 leading-[1.1] tracking-[-0.02em] mb-5">
              Try free. Upgrade when it makes sense.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-[580px]">
              Most people start free and stay free. When your business grows,
              our pricing grows with you. No surprises.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Pricing Cards - Asymmetric and realistic
function PricingCards() {
  const { locale } = useGeoLocaleContext();

  return (
    <section className="pb-20 lg:pb-28">
      <div className="container mx-auto px-4">
        <div className="max-w-[1400px] mx-auto">
          {/* All cards in one row */}
          <div className="grid lg:grid-cols-4 gap-6 mb-8">
            {/* Free Plan */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Free
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-[650] text-slate-900">
                    {formatPrice(locale.pricing.free, locale)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">Forever. Actually.</p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {[
                  "5 products",
                  "20 sales/month",
                  "Basic POS",
                  "Works offline",
                  "1 day history",
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
                className="block w-full py-2.5 text-center text-sm font-medium bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Start for free
              </Link>

              <p className="text-xs text-slate-500 mt-4 italic">
                Good for testing, not much else
              </p>
            </div>

            {/* Starter Plan - recommended */}
            <div className="bg-slate-900 text-white rounded-xl p-6 relative">
              <div className="absolute -top-3 right-6 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most choose this
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Starter</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-[650]">
                    {formatPrice(locale.pricing.starter, locale)}
                  </span>
                  <span className="text-slate-400">/month</span>
                </div>
                <p className="text-sm text-slate-400">
                  Try free for 7 days • Cancel anytime
                </p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {[
                  "200 products",
                  "500 sales/month",
                  "Full POS + discounts",
                  "Inventory tracking",
                  "Low stock alerts",
                  "Online shop link",
                  "30 WhatsApp receipts/day",
                  "Customer profiles",
                  "14-day history",
                  "Email support",
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
                Start 30-day trial
              </Link>
            </div>

            {/* Growth */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Growth
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-[650] text-slate-900">
                    {formatPrice(locale.pricing.growth, locale)}
                  </span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-500">
                  For shops with staff & multiple products
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Everything in Starter, plus:
                </p>
                <ul className="space-y-2.5">
                  {[
                    "1,000 products",
                    "2,000 sales/month",
                    "3 staff accounts",
                    "Profit tracking",
                    "Gift cards & promos",
                    "100 messages/day",
                    "CSV export",
                    "30-day history",
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/signup"
                className="block w-full py-2.5 text-center text-sm font-medium bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Start trial
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Business
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-[650] text-slate-900">
                    {formatPrice(locale.pricing.business, locale)}
                  </span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-500">
                  Multi-location & delivery
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Everything in Growth, plus:
                </p>
                <ul className="space-y-2.5">
                  {[
                    "5,000 products",
                    "10,000 sales/month",
                    "10 staff accounts",
                    "3 locations",
                    "Delivery & riders",
                    "300 messages/day",
                    "AI insights",
                    "90-day history",
                    "Priority support",
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/signup"
                className="block w-full py-2.5 text-center text-sm font-medium bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Start trial
              </Link>
            </div>
          </div>

          {/* Save 20% note */}
          <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Save 20% with annual billing
                </p>
                <p className="text-sm text-amber-800">
                  Pay yearly and get 2 months free. Switch billing anytime in
                  settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Real limits section - honest about what happens
function LimitsSection() {
  return (
    <section className="py-16 lg:py-20 bg-slate-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px] mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-3">
              What happens when you hit a limit?
            </h2>
            <p className="text-[15px] text-slate-600">
              No tricks. Here's exactly what happens.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                limit: "Product limit",
                what: "Can't add more products",
                can: "Still sell existing products",
                fix: "Upgrade or delete old products",
              },
              {
                limit: "Sales limit",
                what: "Can't make more sales this month",
                can: "Access reports & inventory",
                fix: "Upgrade or wait for next month",
              },
              {
                limit: "Message credits",
                what: "Messages pause",
                can: "Still make sales normally",
                fix: "Buy more credits (₵40 for 50)",
              },
              {
                limit: "Staff accounts",
                what: "Can't add more staff",
                can: "Existing staff keep working",
                fix: "Upgrade to add more seats",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-lg p-5"
              >
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  {item.limit}
                </p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-2">
                    <X className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{item.what}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{item.can}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      <strong className="text-slate-700">Fix:</strong>{" "}
                      {item.fix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-slate-100 rounded-lg">
            <p className="text-sm text-slate-700">
              <strong className="text-slate-900">
                You'll always get warned:
              </strong>{" "}
              We send alerts at 80% and 90% of any limit. No surprise lockouts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Messaging - the confusing part explained simply
function MessagingSection() {
  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-[1000px] mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-3">
              How messaging credits work
            </h2>
            <p className="text-[15px] text-slate-600">
              Every paid plan includes free daily messages. Need more? Here's
              what it costs.
            </p>
          </div>

          {/* What is 1 credit */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
            <p className="text-sm font-medium text-slate-700 mb-4">
              1 credit = 1 message:
            </p>
            <div className="grid sm:grid-cols-4 gap-3">
              {[
                "WhatsApp receipt",
                "Delivery update",
                "Payment reminder",
                "SMS notification",
              ].map((item, i) => (
                <div
                  key={i}
                  className="text-center p-3 bg-slate-50 rounded-lg text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Included amounts */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { plan: "Starter", amount: "30/day", total: "~900/month" },
              { plan: "Growth", amount: "100/day", total: "~3,000/month" },
              { plan: "Business", amount: "300/day", total: "~9,000/month" },
            ].map((item, i) => (
              <div key={i} className="text-center p-5 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">{item.plan}</p>
                <p className="text-2xl font-semibold text-slate-900 mb-0.5">
                  {item.amount}
                </p>
                <p className="text-xs text-slate-500">{item.total}</p>
              </div>
            ))}
          </div>

          {/* Buy more */}
          <div className="bg-slate-900 text-white rounded-xl p-6">
            <div className="max-w-[700px]">
              <p className="text-sm font-medium text-slate-300 mb-4">
                Need more credits?
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-xl font-semibold mb-1">₵25</p>
                  <p className="text-sm text-slate-400">
                    100 credits • Just ₵0.25 each
                  </p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-xl font-semibold mb-1">₵95</p>
                  <p className="text-sm text-slate-400">
                    600 credits • ₵0.16 each
                  </p>
                  <span className="inline-block mt-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    Best value
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Buy anytime from your dashboard. Credits never expire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Real FAQ - actual questions people ask
function FAQSection() {
  return (
    <section className="py-16 lg:py-20 bg-slate-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-[800px] mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 mb-3">
              Common questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Do I need a card to start?",
                a: "No. Free plan never asks for payment. Paid plans ask for card after the 7-day trial ends.",
              },
              {
                q: "What if I go over my sales limit?",
                a: "You'll get warnings at 80% and 90%. If you hit the limit, sales pause until next month or you upgrade. Your data stays safe.",
              },
              {
                q: "Can I switch plans?",
                a: "Yes. Upgrade anytime (takes effect immediately). Downgrade at next billing cycle. No penalties.",
              },
              {
                q: "What happens if I cancel?",
                a: "You keep access until your current period ends. All your data stays for 90 days if you want to come back.",
              },
              {
                q: "Do you offer refunds?",
                a: "You get 7 days completely free to test everything. After that, no refunds, but you can cancel anytime to stop future charges.",
              },
              {
                q: "Can I export my data?",
                a: "Growth and Business plans can export to CSV anytime. Free and Starter can view reports but not export.",
              },
            ].map((item, i) => (
              <div key={i} className="border-l-2 border-slate-300 pl-5 py-1">
                <p className="text-[15px] font-medium text-slate-900 mb-2">
                  {item.q}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 bg-white border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-700 mb-3">
              <strong className="text-slate-900">Still have questions?</strong>
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-emerald-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp us
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Final CTA - simple and direct
function FinalCTA() {
  return (
    <section className="py-20 lg:py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="max-w-[650px] mx-auto text-center">
          <h2 className="text-[2rem] lg:text-[2.5rem] font-[650] text-white leading-tight tracking-[-0.01em] mb-4">
            Try it free. No card needed.
          </h2>
          <p className="text-lg text-slate-300 mb-7">
            Most people start free and upgrade when they're ready. Takes 2
            minutes to set up.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-slate-900 text-[15px] font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-sm text-slate-400 mt-4">
            2,400+ Ghanaian businesses already using Warehouse
          </p>
        </div>
      </div>
    </section>
  );
}

// Main Component
export function PricingPage() {
  return (
    <div className="bg-white">
      <HeroSection />
      <PricingCards />
      <LimitsSection />
      <MessagingSection />
      <FAQSection />
      <FinalCTA />
    </div>
  );
}

export default PricingPage;
