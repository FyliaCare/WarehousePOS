# 🏪 WarehousePOS

> A beautiful, modern Point of Sale and Business Management platform built for **Ghana 🇬🇭** and **Nigeria 🇳🇬**.

---

## 🎯 Overview

WarehousePOS is a comprehensive business management ecosystem consisting of **4 interconnected applications**:

| App                       | Purpose                             | Users                  |
| ------------------------- | ----------------------------------- | ---------------------- |
| 📱 **POS App**            | Point of Sale & Business Management | Vendors, Cashiers      |
| 🚚 **Delivery Dashboard** | Delivery & Rider Management         | Fleet Managers, Riders |
| 🌐 **Vendor Portal**      | Online Storefront                   | Customers              |
| 👑 **Admin Portal**       | Platform Management                 | WarehousePOS Admins    |

---

## 🇬🇭🇳🇬 Africa First

Built specifically for Ghanaian and Nigerian businesses:

| Feature      | 🇬🇭 Ghana                | 🇳🇬 Nigeria    |
| ------------ | ----------------------- | ------------- |
| Currency     | GHS (₵)                 | NGN (₦)       |
| SMS Provider | mNotify                 | Termii        |
| Mobile Money | MTN MoMo, Vodafone Cash | OPay, PalmPay |
| Payments     | Paystack                | Paystack      |

---

## 📋 Project Status

| Phase | Description              | Status      | Target       |
| ----- | ------------------------ | ----------- | ------------ |
| 0     | Planning & Documentation | ✅ Complete | Jan 2026     |
| 1     | Core POS App             | 🔄 Starting | Feb-Mar 2026 |
| 2     | Online Portal & Delivery | ⏳ Planned  | Apr-May 2026 |
| 3     | Admin Portal & Polish    | ⏳ Planned  | Jun 2026     |

---

## 🗂️ Project Structure

```
WarehousePOS/
├── apps/
│   ├── marketing/      # ✅ Marketing website (done)
│   ├── pos/            # 📱 Main POS/Management App
│   ├── delivery/       # 🚚 Delivery Dashboard
│   ├── portal/         # 🌐 Vendor Portal (Customer-facing)
│   └── admin/          # 👑 Admin Portal
│
├── packages/
│   ├── ui/             # Shared UI components
│   ├── utils/          # Shared utilities
│   └── types/          # Shared TypeScript types
│
├── supabase/
│   ├── migrations/     # Database schema
│   └── functions/      # Edge functions
│
└── docs/
    ├── REBUILD_PLAN.md               # Complete roadmap
    └── LESSONS_LEARNED_AND_CAUTIONS.md  # What to avoid
```

---

## 🛠️ Tech Stack

| Category      | Technology                            |
| ------------- | ------------------------------------- |
| Frontend      | React 19, TypeScript, Vite            |
| Styling       | TailwindCSS, Shadcn/ui, Framer Motion |
| State         | TanStack Query, Zustand               |
| Offline       | Dexie.js (IndexedDB)                  |
| Backend       | Supabase (PostgreSQL)                 |
| Payments      | Paystack                              |
| SMS           | mNotify (🇬🇭), Termii (🇳🇬)             |
| Notifications | WhatsApp Business API                 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended)
- Supabase account

### Marketing Website

```bash
cd apps/marketing
npm install
npm run dev
```

### POS Application

_Coming soon - Phase 1_

---

## 📚 Documentation

| Document                                                     | Description                                     |
| ------------------------------------------------------------ | ----------------------------------------------- |
| [REBUILD_PLAN.md](./docs/REBUILD_PLAN.md)                    | Complete roadmap, architecture, database schema |
| [LESSONS_LEARNED.md](./docs/LESSONS_LEARNED_AND_CAUTIONS.md) | Mistakes to avoid from old system               |

---

## 🎨 Design Principles

- **🎨 Beautiful** - Modern UI that users love
- **⚡ Fast** - Optimized for slow networks
- **📴 Offline-Ready** - Works without internet
- **📱 Mobile First** - Touch-friendly design
- **🔒 Reliable** - No broken features

---

## 📝 License

Proprietary - All rights reserved.

---

Built with ❤️ for African businesses.
