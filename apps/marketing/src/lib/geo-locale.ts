// Geo-based locale configuration
export type LocaleCode = "GH" | "NG" | "INTL";

export interface LocaleConfig {
  code: LocaleCode;
  country: string;
  currency: {
    symbol: string;
    code: string;
  };
  pricing: {
    free: number;
    starter: number;
    growth: number;
    business: number;
    starterAnnual: number;
    growthAnnual: number;
    businessAnnual: number;
  };
  testimonials: {
    quote: string;
    author: string;
    role: string;
    avatar: string;
  }[];
  badge: string;
  heroSubtext: string;
  trustIndicator: string;
  audienceTitle: string;
  pricingTitle: string;
  testimonialsTitle: string;
  statsLabel: string;
  statsCurrency: string;
  whyChooseTitle: string;
  whyChooseDescription: string;
  localFeature: {
    title: string;
    description: string;
  };
  paymentMethods: string;
  supportLanguages: string;
}

// Ghana locale
const ghanaLocale: LocaleConfig = {
  code: "GH",
  country: "Ghana",
  currency: { symbol: "₵", code: "GHS" },
  pricing: {
    free: 0,
    starter: 49,
    growth: 99,
    business: 199,
    starterAnnual: 39, // ~20% off (GHS 470/year)
    growthAnnual: 79, // ~20% off (GHS 950/year)
    businessAnnual: 159, // ~20% off (GHS 1910/year)
  },
  testimonials: [
    {
      quote:
        "I used to track sales in a notebook. Now I know exactly what's selling and my profit grew 40% in 3 months!",
      author: "Ama Serwaa",
      role: "Instagram Fashion Seller, Accra",
      avatar: "👩🏾‍💼",
    },
    {
      quote:
        "The WhatsApp receipts feature alone saved me 2 hours daily. My customers love the professional touch.",
      author: "Kwame Asante",
      role: "Phone Accessories Shop, Kumasi",
      avatar: "👨🏾‍💼",
    },
    {
      quote:
        "Finally, an app that works even when MTN data is acting up! Offline mode is a game changer.",
      author: "Abena Mensah",
      role: "TikTok Beauty Vendor, Tema",
      avatar: "👩🏾‍🦱",
    },
  ],
  badge: "🇬🇭 Made for Ghana • Start Free Today",
  heroSubtext:
    "The all-in-one app for Instagram sellers, TikTok vendors & small shops in Ghana. Track inventory, make sales, send WhatsApp updates — all from your phone.",
  trustIndicator: "GHS pricing",
  audienceTitle: "Built for Ghana's hustlers 💪",
  pricingTitle: "Simple pricing in Ghana Cedis 🇬🇭",
  testimonialsTitle: "Loved by sellers across Ghana ❤️",
  statsLabel: "Sellers in Ghana",
  statsCurrency: "₵5M+",
  whyChooseTitle: "Built different. Built for Ghana.",
  whyChooseDescription:
    "Not just another foreign app. We understand Ghana business.",
  localFeature: {
    title: "Made for Ghana",
    description:
      "GHS pricing, MTN/Vodafone/AirtelTigo payments, WhatsApp integration built-in.",
  },
  paymentMethods:
    "We accept Mobile Money (MTN, Vodafone Cash, AirtelTigo), debit/credit cards (Visa, Mastercard), and bank transfers. All payments are processed securely through Paystack.",
  supportLanguages:
    "WhatsApp support in English & Twi. We respond in minutes, not days.",
};

// Nigeria locale
const nigeriaLocale: LocaleConfig = {
  code: "NG",
  country: "Nigeria",
  currency: { symbol: "₦", code: "NGN" },
  pricing: {
    free: 0,
    starter: 4900,
    growth: 9900,
    business: 19900,
    starterAnnual: 3900, // ~20% off
    growthAnnual: 7900, // ~20% off
    businessAnnual: 15900, // ~20% off
  },
  testimonials: [
    {
      quote:
        "I run my entire Ankara business from my phone now. Sales tracking, customer management, everything!",
      author: "Chioma Okafor",
      role: "Instagram Fashion Seller, Lagos",
      avatar: "👩🏾‍💼",
    },
    {
      quote:
        "The offline mode saved me during NEPA wahala. I kept making sales even without light!",
      author: "Emeka Nwosu",
      role: "Electronics Shop, Onitsha",
      avatar: "👨🏾‍💼",
    },
    {
      quote:
        "WhatsApp receipts make my business look professional. My customers think I'm running a big company!",
      author: "Fatima Ibrahim",
      role: "TikTok Beauty Vendor, Abuja",
      avatar: "👩🏾‍🦱",
    },
  ],
  badge: "🇳🇬 Made for Nigeria • Start Free Today",
  heroSubtext:
    "The all-in-one app for Instagram sellers, TikTok vendors & small shops in Nigeria. Track inventory, make sales, send WhatsApp updates — all from your phone.",
  trustIndicator: "Naira pricing",
  audienceTitle: "Built for Nigerian hustlers 💪",
  pricingTitle: "Simple pricing in Naira 🇳🇬",
  testimonialsTitle: "Loved by sellers across Nigeria ❤️",
  statsLabel: "Sellers in Nigeria",
  statsCurrency: "₦500M+",
  whyChooseTitle: "Built different. Built for Nigeria.",
  whyChooseDescription:
    "Not just another oyinbo app. We understand Nigerian business.",
  localFeature: {
    title: "Made for Nigeria",
    description:
      "Naira pricing, bank transfers, Paystack, WhatsApp integration built-in.",
  },
  paymentMethods:
    "We accept bank transfers, debit cards, USSD, and all Nigerian payment methods. All payments are processed securely through Paystack.",
  supportLanguages:
    "Support in English & Pidgin. We respond in minutes, not days.",
};

// International locale (default)
const internationalLocale: LocaleConfig = {
  code: "INTL",
  country: "International",
  currency: { symbol: "$", code: "USD" },
  pricing: {
    free: 0,
    starter: 4,
    growth: 8,
    business: 16,
    starterAnnual: 3, // ~20% off
    growthAnnual: 6, // ~20% off
    businessAnnual: 13, // ~20% off
  },
  testimonials: [
    {
      quote:
        "I used to track sales in a notebook. Now I know exactly what's selling and my profit grew 40% in 3 months!",
      author: "Sarah Mitchell",
      role: "Instagram Fashion Seller, UK",
      avatar: "👩🏻‍💼",
    },
    {
      quote:
        "The WhatsApp receipts feature alone saved me 2 hours daily. My customers love the professional touch.",
      author: "Ahmed Hassan",
      role: "Phone Accessories Shop, Dubai",
      avatar: "👨🏽‍💼",
    },
    {
      quote:
        "Finally, an app that works even when my internet is acting up! Offline mode is a game changer.",
      author: "Maria Santos",
      role: "TikTok Beauty Vendor, Brazil",
      avatar: "👩🏽‍🦱",
    },
  ],
  badge: "🌍 Trusted Worldwide • Start Free Today",
  heroSubtext:
    "The all-in-one app for Instagram sellers, TikTok vendors & small shops everywhere. Track inventory, make sales, send WhatsApp updates — all from your phone.",
  trustIndicator: "Free forever plan",
  audienceTitle: "Built for ambitious sellers 💪",
  pricingTitle: "Simple, transparent pricing 💰",
  testimonialsTitle: "Loved by sellers worldwide ❤️",
  statsLabel: "Sellers Worldwide",
  statsCurrency: "$50M+",
  whyChooseTitle: "Built different. Built for you.",
  whyChooseDescription: "Simple, powerful, and designed for modern sellers.",
  localFeature: {
    title: "Works Anywhere",
    description:
      "Multi-currency support, local payment methods, WhatsApp integration.",
  },
  paymentMethods:
    "We accept all major credit/debit cards (Visa, Mastercard, Amex), PayPal, and local payment methods in many countries including mobile money. All payments are processed securely.",
  supportLanguages:
    "24/7 support via chat & email. We respond in minutes, not days.",
};

// Get locale by country code
export function getLocaleByCode(code: LocaleCode): LocaleConfig {
  switch (code) {
    case "GH":
      return ghanaLocale;
    case "NG":
      return nigeriaLocale;
    default:
      return internationalLocale;
  }
}

// Format price with locale
export function formatPrice(amount: number, locale: LocaleConfig): string {
  if (amount === 0) return `${locale.currency.symbol}0`;

  // Format large numbers with commas for Nigeria
  if (locale.code === "NG" && amount >= 1000) {
    return `${locale.currency.symbol}${amount.toLocaleString()}`;
  }

  return `${locale.currency.symbol}${amount}`;
}

// Calculate annual savings
export function calculateAnnualSavings(
  monthly: number,
  annual: number,
): number {
  return (monthly - annual) * 12;
}
