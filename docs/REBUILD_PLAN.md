# 🏗️ WAREHOUSEPOS - COMPLETE REBUILD PLAN

> **Date:** January 27, 2026  
> **Version:** 2.0 (Updated)  
> **Status:** PLANNING PHASE  
> **Objective:** Build a world-class, visually stunning POS system for Ghana & Nigeria

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [The 4 Applications](#2-the-4-applications)
3. [Visual Design System](#3-visual-design-system)
4. [Ghana/Nigeria First Approach](#4-ghananigeria-first-approach)
5. [Technical Stack](#5-technical-stack)
6. [Database Schema Design](#6-database-schema-design)
7. [Application Structure](#7-application-structure)
8. [Core Modules by App](#8-core-modules-by-app)
9. [Development Phases](#9-development-phases)
10. [API Design](#10-api-design)
11. [Authentication Strategy](#11-authentication-strategy)
12. [Integrations](#12-integrations)
13. [Offline-First Strategy](#13-offline-first-strategy)
14. [Deployment Strategy](#14-deployment-strategy)

---

## 1. PROJECT OVERVIEW

### 1.1 What is WarehousePOS?

WarehousePOS is a **beautiful, modern, cloud-based business management platform** designed specifically for small to medium businesses in **Ghana and Nigeria**. It consists of 4 interconnected applications that work together seamlessly.

### 1.2 Core Principles

| Principle             | Description                                        |
| --------------------- | -------------------------------------------------- |
| **🎨 Beautiful**      | Visually stunning, modern UI that users love       |
| **🇬🇭🇳🇬 Africa First** | Built for Ghana & Nigeria from day one             |
| **⚡ Fast**           | Optimized for slow networks and affordable devices |
| **📴 Offline-Ready**  | Full functionality without internet                |
| **🔒 Reliable**       | Working features only, no placeholders             |
| **📱 Mobile First**   | Touch-friendly, responsive design                  |

### 1.3 Target Users

| User Type                 | App                | Description                  |
| ------------------------- | ------------------ | ---------------------------- |
| **Vendor/Business Owner** | POS App            | Manages their business daily |
| **Cashier/Staff**         | POS App            | Handles sales and customers  |
| **Delivery Rider**        | Delivery App       | Manages deliveries           |
| **Fleet Manager**         | Delivery Dashboard | Oversees all riders          |
| **Customer**              | Vendor Portal      | Views store, places orders   |
| **Platform Admin**        | Admin Portal       | Manages entire platform      |

---

## 2. THE 4 APPLICATIONS

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        WAREHOUSEPOS ECOSYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   🇬🇭 GHANA                                    🇳🇬 NIGERIA                        │
│   ├── mNotify (SMS/OTP)                       ├── Termii (SMS/OTP)              │
│   ├── Paystack (GHS)                          ├── Paystack (NGN)                │
│   └── MTN MoMo                                └── Bank Transfer                 │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         SHARED SUPABASE BACKEND                          │   │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│   │   │   Auth   │ │ Database │ │ Storage  │ │ Realtime │ │ Functions│     │   │
│   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                         │
│         ┌──────────────────────────────┼──────────────────────────────┐         │
│         │                              │                              │         │
│         ▼                              ▼                              ▼         │
│   ┌───────────┐                 ┌───────────┐                  ┌───────────┐    │
│   │    📱     │                 │    🚚     │                  │    🌐     │    │
│   │  POS APP  │◄───────────────►│ DELIVERY  │◄────────────────►│  VENDOR   │    │
│   │           │                 │ DASHBOARD │                  │  PORTAL   │    │
│   │ • Sales   │   Orders &      │           │   Order Status   │           │    │
│   │ • Stock   │   Deliveries    │ • Riders  │   & Tracking     │ • Store   │    │
│   │ • Reports │                 │ • Routes  │                  │ • Orders  │    │
│   │ • Staff   │                 │ • Track   │                  │ • Account │    │
│   └─────┬─────┘                 └─────┬─────┘                  └─────┬─────┘    │
│         │                              │                              │         │
│         └──────────────────────────────┼──────────────────────────────┘         │
│                                        │                                         │
│                                        ▼                                         │
│                                 ┌───────────┐                                   │
│                                 │    👑     │                                   │
│                                 │   ADMIN   │                                   │
│                                 │  PORTAL   │                                   │
│                                 │           │                                   │
│                                 │ • Tenants │                                   │
│                                 │ • Revenue │                                   │
│                                 │ • Support │                                   │
│                                 │ • System  │                                   │
│                                 └───────────┘                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 App Details

#### 📱 APP 1: Main POS/Management App

**URL:** `app.warehousepos.com`  
**Users:** Business owners, managers, cashiers

| Feature             | Description                                      |
| ------------------- | ------------------------------------------------ |
| Point of Sale       | Beautiful checkout with cart, payments, receipts |
| Inventory           | Products, categories, stock levels, alerts       |
| Customers           | CRM, credit, loyalty points                      |
| Sales History       | Complete transaction records                     |
| Reports & Analytics | Dashboard, charts, insights                      |
| Staff Management    | Users, roles, permissions                        |
| Settings            | Store config, integrations                       |
| Offline Mode        | Full functionality without internet              |

#### 🚚 APP 2: Delivery System Dashboard

**URL:** `delivery.warehousepos.com`  
**Users:** Fleet managers, delivery coordinators, riders

| Feature             | Description                                      |
| ------------------- | ------------------------------------------------ |
| Rider Management    | Add/manage delivery personnel                    |
| Live Tracking       | Real-time rider locations on map                 |
| Order Assignment    | Assign orders to riders                          |
| Route Optimization  | Suggest best delivery routes                     |
| Performance Metrics | Delivery times, ratings                          |
| Rider App           | Mobile view for riders (assignments, navigation) |
| Earnings            | Track rider payments/commissions                 |
| Zones               | Delivery area management                         |

#### 🌐 APP 3: Vendor Portal (Public Storefront)

**URL:** `{store-slug}.warehousepos.com`  
**Users:** End customers of vendors

| Feature              | Description                       |
| -------------------- | --------------------------------- |
| Store Catalog        | Beautiful product browsing        |
| Shopping Cart        | Add items, apply discounts        |
| Checkout             | Place orders (pickup or delivery) |
| Order Tracking       | Real-time order status            |
| Account              | Order history, saved addresses    |
| WhatsApp Integration | Order notifications, support      |
| Reviews              | Product ratings and reviews       |

#### 👑 APP 4: Admin Portal (Platform Management)

**URL:** `admin.warehousepos.com`  
**Users:** WarehousePOS platform administrators

| Feature                | Description                |
| ---------------------- | -------------------------- |
| Tenant Management      | All businesses on platform |
| Subscription & Billing | Plans, payments, revenue   |
| Support Tickets        | Help desk for vendors      |
| System Health          | Monitoring, logs, errors   |
| Analytics              | Platform-wide metrics      |
| Feature Flags          | Enable/disable features    |
| Announcements          | Broadcast to vendors       |
| User Management        | Admin accounts, roles      |

### 2.3 How Apps Communicate

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW EXAMPLE: NEW ORDER                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Customer places order on VENDOR PORTAL                      │
│     └──► Order saved to Supabase                                │
│          └──► Realtime subscription notifies POS APP            │
│               └──► Vendor sees new order alert 🔔               │
│                                                                  │
│  2. Vendor accepts order in POS APP                             │
│     └──► Order status updated to "confirmed"                    │
│          └──► WhatsApp notification sent to customer 📱         │
│                                                                  │
│  3. If delivery: Vendor assigns to rider in DELIVERY DASHBOARD  │
│     └──► Rider receives assignment notification                 │
│          └──► Customer can track delivery in VENDOR PORTAL      │
│                                                                  │
│  4. Rider completes delivery                                    │
│     └──► Status updated, notifications sent                     │
│          └──► Vendor sees completed in POS APP                  │
│               └──► ADMIN PORTAL tracks revenue 📊               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. VISUAL DESIGN SYSTEM

### 3.1 Design Philosophy

> **"African businesses deserve world-class software that looks as good as it works."**

| Principle             | Implementation                             |
| --------------------- | ------------------------------------------ |
| **Modern & Clean**    | Lots of whitespace, clear hierarchy        |
| **Vibrant Colors**    | Rich, energetic palette inspired by Africa |
| **Smooth Animations** | Subtle transitions, micro-interactions     |
| **Touch-Friendly**    | Large tap targets, gesture support         |
| **Accessible**        | High contrast, readable fonts              |
| **Dark Mode**         | Beautiful dark theme option                |

### 3.2 Color Palette

```css
/* Primary Brand Colors */
--primary: #7c3aed; /* Vibrant Purple */
--primary-light: #a78bfa;
--primary-dark: #5b21b6;

/* Country Accents */
--ghana-gold: #fcd116; /* 🇬🇭 Ghana Gold */
--ghana-green: #006b3f; /* 🇬🇭 Ghana Green */
--nigeria-green: #008751; /* 🇳🇬 Nigeria Green */

/* Semantic Colors */
--success: #10b981; /* Emerald Green */
--warning: #f59e0b; /* Amber */
--error: #ef4444; /* Red */
--info: #3b82f6; /* Blue */

/* Neutrals */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-900: #111827;

/* Dark Mode */
--dark-bg: #0f172a;
--dark-card: #1e293b;
--dark-border: #334155;
```

### 3.3 Typography

```css
/* Font Family */
font-family: "Inter", "SF Pro Display", system-ui, sans-serif;

/* Scale */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
```

### 3.4 Component Design Guidelines

#### Cards

```
- Rounded corners: 12px (lg), 8px (md), 4px (sm)
- Shadows: Subtle, layered shadows
- Borders: 1px with low opacity
- Hover: Subtle lift effect
```

#### Buttons

```
- Primary: Filled with gradient
- Secondary: Outlined
- Ghost: Text only
- Large touch targets: min 44px height
- Ripple effect on tap
```

#### Icons

```
- Library: Lucide React (consistent, beautiful)
- Size: 20px default, 24px for emphasis
- Stroke: 1.5px for lighter feel
```

#### Animations

```
- Duration: 150ms (fast), 300ms (normal), 500ms (slow)
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Micro-interactions: Button press, card hover, loading states
- Page transitions: Fade + slight slide
```

### 3.5 UI Components to Build

| Component    | Description                                     |
| ------------ | ----------------------------------------------- |
| `Button`     | Primary, secondary, ghost, icon, loading states |
| `Card`       | With hover, click, variants                     |
| `Input`      | With label, error, icon, prefix/suffix          |
| `Select`     | Searchable, multi-select                        |
| `Modal`      | Slide up on mobile, center on desktop           |
| `Drawer`     | Side panel for forms                            |
| `Toast`      | Success, error, info notifications              |
| `DataTable`  | Sortable, filterable, pagination                |
| `Chart`      | Line, bar, pie with nice styling                |
| `Avatar`     | With initials, image, status indicator          |
| `Badge`      | Status indicators                               |
| `Skeleton`   | Loading placeholders                            |
| `EmptyState` | Beautiful empty screens                         |

### 3.6 Visual Examples

#### Dashboard Card

```
┌─────────────────────────────────────┐
│  📈 Today's Sales                    │
│                                      │
│  ₵ 12,450.00        ↑ 23%           │
│  ██████████████░░░░░                 │
│                                      │
│  145 transactions                    │
└─────────────────────────────────────┘
```

#### Product Card

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │         [Product Image]      │   │
│  │                              │   │
│  └─────────────────────────────┘   │
│                                      │
│  Coca-Cola 50cl                      │
│  ₵ 8.00          ⭐ 4.5 (120)       │
│                                      │
│  [   Add to Cart   ]                │
└─────────────────────────────────────┘
```

---

## 4. GHANA/NIGERIA FIRST APPROACH

### 4.1 Country Selection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    WELCOME TO WAREHOUSEPOS                       │
│                                                                  │
│         "Built for African businesses, by Africans"             │
│                                                                  │
│                  Select your country to begin                    │
│                                                                  │
│   ┌─────────────────────┐    ┌─────────────────────┐           │
│   │                     │    │                     │           │
│   │       🇬🇭            │    │       🇳🇬            │           │
│   │                     │    │                     │           │
│   │      GHANA          │    │     NIGERIA         │           │
│   │                     │    │                     │           │
│   │   GHS • mNotify     │    │   NGN • Termii      │           │
│   │   MTN MoMo          │    │   Bank Transfer     │           │
│   │                     │    │                     │           │
│   └─────────────────────┘    └─────────────────────┘           │
│                                                                  │
│              Your choice determines:                             │
│              • Currency & pricing                                │
│              • Payment methods                                   │
│              • SMS provider                                      │
│              • Local support                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Country-Specific Configuration

| Feature             | 🇬🇭 Ghana                | 🇳🇬 Nigeria         |
| ------------------- | ----------------------- | ------------------ |
| **Currency**        | GHS (₵)                 | NGN (₦)            |
| **SMS Provider**    | mNotify                 | Termii             |
| **Payment Gateway** | Paystack                | Paystack           |
| **Mobile Money**    | MTN MoMo, Vodafone Cash | OPay, PalmPay      |
| **Bank Transfer**   | Ghana banks             | Nigerian banks     |
| **Timezone**        | Africa/Accra (GMT)      | Africa/Lagos (WAT) |
| **Phone Format**    | +233 XXX XXX XXXX       | +234 XXX XXX XXXX  |
| **Tax (VAT)**       | 15%                     | 7.5%               |
| **Support Hours**   | 8am - 6pm GMT           | 8am - 6pm WAT      |

### 4.3 Database: Country Field

```sql
-- Added to tenants table
country TEXT NOT NULL DEFAULT 'GH', -- 'GH' or 'NG'
currency TEXT NOT NULL DEFAULT 'GHS', -- 'GHS' or 'NGN'
timezone TEXT NOT NULL DEFAULT 'Africa/Accra',
phone_country_code TEXT NOT NULL DEFAULT '+233',
tax_rate DECIMAL(5,2) DEFAULT 15.00, -- 15% for Ghana, 7.5% for Nigeria

-- Country-specific settings stored in JSONB
country_config JSONB DEFAULT '{
  "sms_provider": "mnotify",
  "payment_methods": ["cash", "momo", "card"],
  "momo_providers": ["mtn", "vodafone", "airteltigo"]
}'::jsonb
```

### 4.4 SMS Integration

#### Ghana: mNotify

```typescript
// lib/sms/mnotify.ts
export async function sendSMS(phone: string, message: string) {
  const response = await fetch("https://api.mnotify.com/api/sms/quick", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: process.env.MNOTIFY_API_KEY,
      to: phone,
      msg: message,
      sender_id: "WarehousePOS",
    }),
  });
  return response.json();
}
```

#### Nigeria: Termii

```typescript
// lib/sms/termii.ts
export async function sendSMS(phone: string, message: string) {
  const response = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.TERMII_API_KEY,
      to: phone,
      from: "WarehousePOS",
      sms: message,
      type: "plain",
      channel: "generic",
    }),
  });
  return response.json();
}
```

#### Unified SMS Service

```typescript
// lib/sms/index.ts
import { sendSMS as sendMNotify } from "./mnotify";
import { sendSMS as sendTermii } from "./termii";

export async function sendSMS(
  country: "GH" | "NG",
  phone: string,
  message: string,
) {
  if (country === "GH") {
    return sendMNotify(phone, message);
  } else {
    return sendTermii(phone, message);
  }
}

export async function sendOTP(country: "GH" | "NG", phone: string) {
  const otp = generateOTP();
  const message = `Your WarehousePOS code is: ${otp}. Valid for 10 minutes.`;
  await sendSMS(country, phone, message);
  return otp;
}
```

### 4.5 WhatsApp Integration

```typescript
// lib/whatsapp/index.ts
// Using WhatsApp Business API (Meta Cloud API)

export async function sendWhatsAppMessage(
  phone: string,
  templateName: string,
  params: Record<string, string>,
) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: Object.entries(params).map(([_, value]) => ({
                type: "text",
                text: value,
              })),
            },
          ],
        },
      }),
    },
  );
  return response.json();
}

// Templates to create in WhatsApp Business Manager:
// - order_confirmation
// - order_ready
// - delivery_started
// - delivery_completed
// - payment_received
// - low_stock_alert
```

### 4.6 Currency Formatting

```typescript
// lib/currency.ts
export function formatCurrency(amount: number, country: "GH" | "NG"): string {
  const config = {
    GH: { currency: "GHS", symbol: "₵", locale: "en-GH" },
    NG: { currency: "NGN", symbol: "₦", locale: "en-NG" },
  };

  const { currency, locale } = config[country];

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Usage:
// formatCurrency(1000, 'GH') → "₵1,000.00"
// formatCurrency(1000, 'NG') → "₦1,000.00"
```

---

## 5. TECHNICAL STACK

### 5.1 Frontend (All 4 Apps)

| Technology          | Purpose      | Why                                 |
| ------------------- | ------------ | ----------------------------------- |
| **React 19**        | UI Framework | Latest features, great ecosystem    |
| **TypeScript**      | Type Safety  | Catch errors at compile time        |
| **Vite**            | Build Tool   | Fast dev server, optimized builds   |
| **TailwindCSS**     | Styling      | Rapid UI development, consistency   |
| **Shadcn/ui**       | Components   | Beautiful, accessible, customizable |
| **Framer Motion**   | Animations   | Smooth, declarative animations      |
| **TanStack Query**  | Server State | Caching, background refetch         |
| **Zustand**         | Client State | Simple, fast, TypeScript native     |
| **Dexie.js**        | IndexedDB    | Offline storage (POS app only)      |
| **React Hook Form** | Forms        | Best performance, validation        |
| **Zod**             | Validation   | Runtime type safety                 |
| **Recharts**        | Charts       | Beautiful, responsive charts        |
| **Leaflet**         | Maps         | Delivery tracking maps              |

### 5.2 Backend

| Technology     | Purpose                                           |
| -------------- | ------------------------------------------------- |
| **Supabase**   | Auth, Database, Storage, Realtime, Edge Functions |
| **PostgreSQL** | Primary database                                  |
| **PostgREST**  | Auto-generated REST API                           |
| **Realtime**   | Live updates between apps                         |

### 5.3 Integrations

| Service                   | Country    | Purpose            |
| ------------------------- | ---------- | ------------------ |
| **mNotify**               | 🇬🇭 Ghana   | SMS & OTP          |
| **Termii**                | 🇳🇬 Nigeria | SMS & OTP          |
| **Paystack**              | Both       | Payment processing |
| **WhatsApp Business API** | Both       | Notifications      |
| **Cloudinary**            | Both       | Image optimization |

### 5.4 DevOps

| Tool               | Purpose                    |
| ------------------ | -------------------------- |
| **Vercel**         | Frontend hosting           |
| **Supabase**       | Backend hosting            |
| **GitHub Actions** | CI/CD                      |
| **Sentry**         | Error monitoring           |
| **Plausible**      | Privacy-friendly analytics |

---

## 6. DATABASE SCHEMA DESIGN

### 6.1 Design Principles

1. **snake_case** - All column names
2. **UUID** - All primary keys
3. **Soft deletes** - `deleted_at` instead of DELETE
4. **Audit trail** - `created_at`, `updated_at`, `created_by`
5. **Tenant isolation** - `tenant_id` on every table
6. **Country aware** - `country` field where needed

### 6.2 Core Tables

```sql
-- ============================================
-- WAREHOUSEPOS DATABASE SCHEMA V2.0
-- Ghana & Nigeria First
-- ============================================

-- ==========================================
-- PLATFORM TABLES (Admin Portal)
-- ==========================================

-- Platform configuration
CREATE TABLE platform_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_ghs DECIMAL(10,2) NOT NULL, -- Ghana price
    price_ngn DECIMAL(10,2) NOT NULL, -- Nigeria price
    billing_period TEXT DEFAULT 'monthly', -- monthly, yearly
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}', -- { products: 100, staff: 5, stores: 1 }
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- TENANT TABLES (Multi-tenant core)
-- ==========================================

-- Tenants (Businesses)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,

    -- Country & localization
    country TEXT NOT NULL DEFAULT 'GH', -- 'GH' or 'NG'
    currency TEXT NOT NULL DEFAULT 'GHS',
    timezone TEXT NOT NULL DEFAULT 'Africa/Accra',
    phone_country_code TEXT NOT NULL DEFAULT '+233',
    default_tax_rate DECIMAL(5,2) DEFAULT 0,

    -- Contact
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,

    -- Subscription
    plan_id UUID REFERENCES subscription_plans(id),
    subscription_status TEXT DEFAULT 'trial', -- trial, active, past_due, cancelled
    trial_ends_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,

    -- Features & limits
    features_enabled JSONB DEFAULT '{}',

    -- Country-specific config
    country_config JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users (Staff members)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE, -- Supabase auth.users.id

    -- Basic info
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,

    -- Authentication
    pin_hash TEXT, -- For quick POS login

    -- Role & permissions
    role TEXT NOT NULL DEFAULT 'cashier', -- owner, manager, cashier, rider
    permissions JSONB DEFAULT '[]',

    -- Assignment
    store_id UUID, -- Default store

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stores (Locations/branches)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,

    -- Location for delivery
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    -- Settings
    is_main BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Operating hours
    operating_hours JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INVENTORY TABLES
-- ==========================================

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,

    parent_id UUID REFERENCES categories(id), -- For subcategories
    sort_order INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, name)
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT NOT NULL,
    barcode TEXT,

    -- Pricing
    cost_price DECIMAL(12,2) DEFAULT 0,
    selling_price DECIMAL(12,2) NOT NULL,
    compare_price DECIMAL(12,2), -- For showing discounts

    -- Tax
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_inclusive BOOLEAN DEFAULT false,

    -- Inventory
    unit TEXT DEFAULT 'piece', -- piece, kg, liter, pack
    track_stock BOOLEAN DEFAULT true,
    min_stock_level INTEGER DEFAULT 0,

    -- Media
    image_url TEXT,
    images JSONB DEFAULT '[]', -- Array of image URLs

    -- Variants
    has_variants BOOLEAN DEFAULT false,
    variant_options JSONB DEFAULT '[]', -- [{ name: "Size", values: ["S", "M", "L"] }]

    -- Online store
    show_online BOOLEAN DEFAULT true,

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, sku)
);

-- Product variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    name TEXT NOT NULL, -- e.g., "Large / Red"
    sku TEXT NOT NULL,
    barcode TEXT,

    cost_price DECIMAL(12,2),
    selling_price DECIMAL(12,2) NOT NULL,

    options JSONB NOT NULL, -- { "Size": "Large", "Color": "Red" }

    image_url TEXT,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, sku)
);

-- Stock levels (per store)
CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0, -- For pending orders

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(store_id, product_id, variant_id)
);

-- Stock movements (audit trail)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    user_id UUID REFERENCES users(id),

    type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'transfer', 'return'
    quantity INTEGER NOT NULL,

    reference_type TEXT, -- 'sale', 'purchase', 'manual', 'transfer', 'order'
    reference_id UUID,

    reason TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- CUSTOMER TABLES
-- ==========================================

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Basic info
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,

    -- Address
    address TEXT,
    city TEXT,

    -- For delivery
    default_latitude DECIMAL(10,8),
    default_longitude DECIMAL(11,8),

    -- Financials
    credit_limit DECIMAL(12,2) DEFAULT 0,
    credit_balance DECIMAL(12,2) DEFAULT 0,

    -- Loyalty
    loyalty_points INTEGER DEFAULT 0,

    -- Stats
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_order_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,
    tags JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- SALES TABLES
-- ==========================================

-- Sales (POS transactions)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    user_id UUID REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),

    sale_number TEXT NOT NULL,

    -- Items (JSONB for simplicity)
    items JSONB NOT NULL DEFAULT '[]',

    -- Totals
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    discount_type TEXT, -- 'percentage', 'fixed'
    discount_code TEXT,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,

    -- Payment
    payment_method TEXT NOT NULL, -- 'cash', 'card', 'momo', 'transfer', 'credit'
    payment_reference TEXT,
    amount_paid DECIMAL(12,2) NOT NULL,
    change_given DECIMAL(12,2) DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'voided', 'refunded'

    -- Void/refund info
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES users(id),
    void_reason TEXT,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, sale_number)
);

-- ==========================================
-- ONLINE ORDERS (Vendor Portal)
-- ==========================================

-- Online orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    customer_id UUID REFERENCES customers(id),

    order_number TEXT NOT NULL,

    -- Customer info (captured at order time)
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,

    -- Delivery info
    order_type TEXT NOT NULL DEFAULT 'delivery', -- 'delivery', 'pickup'
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_latitude DECIMAL(10,8),
    delivery_longitude DECIMAL(11,8),
    delivery_notes TEXT,

    -- Items
    items JSONB NOT NULL DEFAULT '[]',

    -- Totals
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    delivery_fee DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,

    -- Payment
    payment_method TEXT, -- 'cash_on_delivery', 'momo', 'card', 'transfer'
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payment_reference TEXT,

    -- Status
    status TEXT DEFAULT 'pending',
    -- pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled

    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Cancellation
    cancelled_by TEXT, -- 'customer', 'vendor', 'system'
    cancel_reason TEXT,

    -- Source
    source TEXT DEFAULT 'portal', -- 'portal', 'whatsapp', 'phone'

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, order_number)
);

-- ==========================================
-- DELIVERY TABLES
-- ==========================================

-- Riders (Delivery personnel)
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- Links to user if they have app access

    -- Basic info
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,

    -- Vehicle
    vehicle_type TEXT DEFAULT 'motorcycle', -- bicycle, motorcycle, car
    vehicle_number TEXT,

    -- Status
    status TEXT DEFAULT 'offline', -- online, offline, busy
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    last_location_at TIMESTAMPTZ,

    -- Stats
    total_deliveries INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delivery assignments
CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id),

    -- Status
    status TEXT DEFAULT 'assigned',
    -- assigned, accepted, picked_up, in_transit, delivered, cancelled

    -- Timestamps
    assigned_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Tracking
    distance_km DECIMAL(10,2),
    duration_minutes INTEGER,

    -- Payment
    delivery_fee DECIMAL(12,2),
    rider_earnings DECIMAL(12,2),

    -- Rating
    customer_rating INTEGER, -- 1-5
    customer_feedback TEXT,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delivery zones
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id),

    name TEXT NOT NULL,

    -- Zone definition (polygon)
    coordinates JSONB NOT NULL, -- Array of [lat, lng] points

    -- Pricing
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_order_amount DECIMAL(10,2) DEFAULT 0,

    -- Timing
    estimated_minutes INTEGER DEFAULT 45,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- COMMUNICATION TABLES
-- ==========================================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for platform-wide

    name TEXT NOT NULL,
    slug TEXT NOT NULL,

    -- Content by channel
    sms_content TEXT,
    whatsapp_template_name TEXT,
    email_subject TEXT,
    email_content TEXT,
    push_title TEXT,
    push_body TEXT,

    -- Variables available
    variables JSONB DEFAULT '[]', -- ['customer_name', 'order_number', 'total']

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications sent
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Recipient
    recipient_type TEXT NOT NULL, -- 'customer', 'user', 'rider'
    recipient_id UUID,
    recipient_phone TEXT,
    recipient_email TEXT,

    -- Content
    channel TEXT NOT NULL, -- 'sms', 'whatsapp', 'email', 'push'
    template_id UUID REFERENCES notification_templates(id),
    content TEXT NOT NULL,

    -- Reference
    reference_type TEXT, -- 'order', 'sale', 'delivery'
    reference_id UUID,

    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    sent_at TIMESTAMPTZ,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Tenants
CREATE INDEX idx_tenants_country ON tenants(country);
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_phone ON users(phone);

-- Products
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_active ON products(tenant_id, is_active);

-- Stock
CREATE INDEX idx_stock_levels_tenant ON stock_levels(tenant_id);
CREATE INDEX idx_stock_levels_store_product ON stock_levels(store_id, product_id);

-- Sales
CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);

-- Orders
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Customers
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Riders
CREATE INDEX idx_riders_tenant ON riders(tenant_id);
CREATE INDEX idx_riders_status ON riders(status);

-- Deliveries
CREATE INDEX idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_rider ON delivery_assignments(rider_id);
CREATE INDEX idx_delivery_assignments_status ON delivery_assignments(status);
```

---

## 7. APPLICATION STRUCTURE

### 7.1 Monorepo Structure

```
WarehousePOS/
├── apps/
│   ├── marketing/          # ✅ Marketing website (done)
│   │   └── src/
│   │
│   ├── pos/                # 📱 Main POS/Management App
│   │   ├── public/
│   │   └── src/
│   │       ├── api/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── pos/
│   │       │   ├── inventory/
│   │       │   ├── customers/
│   │       │   ├── sales/
│   │       │   ├── reports/
│   │       │   └── settings/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── stores/
│   │       └── types/
│   │
│   ├── delivery/           # 🚚 Delivery Dashboard
│   │   └── src/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── riders/
│   │       │   ├── assignments/
│   │       │   ├── tracking/
│   │       │   ├── zones/
│   │       │   └── reports/
│   │       └── ...
│   │
│   ├── portal/             # 🌐 Vendor Portal (Customer-facing)
│   │   └── src/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── catalog/
│   │       │   ├── cart/
│   │       │   ├── checkout/
│   │       │   ├── orders/
│   │       │   └── account/
│   │       └── ...
│   │
│   └── admin/              # 👑 Admin Portal
│       └── src/
│           ├── components/
│           ├── features/
│           │   ├── tenants/
│           │   ├── subscriptions/
│           │   ├── support/
│           │   ├── analytics/
│           │   └── system/
│           └── ...
│
├── packages/               # Shared code
│   ├── ui/                 # Shared UI components
│   ├── utils/              # Shared utilities
│   ├── types/              # Shared TypeScript types
│   └── config/             # Shared config (tailwind, etc.)
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── send-sms/
│       ├── send-whatsapp/
│       ├── process-payment/
│       └── webhooks/
│
└── docs/
    ├── REBUILD_PLAN.md
    └── LESSONS_LEARNED.md
```

### 7.2 Shared Packages

#### packages/ui

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── DataTable.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── useToast.ts
│   └── index.ts
└── package.json
```

#### packages/utils

```
packages/utils/
├── src/
│   ├── currency.ts      # formatCurrency()
│   ├── date.ts          # formatDate(), timeAgo()
│   ├── phone.ts         # formatPhone(), validatePhone()
│   ├── validation.ts    # Zod schemas
│   └── index.ts
└── package.json
```

---

## 8. CORE MODULES BY APP

### 8.1 📱 POS App Modules

| Module        | Features                           | Priority |
| ------------- | ---------------------------------- | -------- |
| **Auth**      | Login, PIN, country selection      | Phase 1  |
| **Dashboard** | Stats, charts, quick actions       | Phase 1  |
| **POS**       | Checkout, cart, payments, receipts | Phase 1  |
| **Products**  | CRUD, categories, variants         | Phase 1  |
| **Stock**     | Levels, adjustments, transfers     | Phase 1  |
| **Customers** | CRUD, credit, loyalty              | Phase 1  |
| **Sales**     | History, details, voids            | Phase 1  |
| **Reports**   | Sales, inventory, profit           | Phase 2  |
| **Orders**    | Online orders management           | Phase 2  |
| **Settings**  | Store, staff, integrations         | Phase 2  |

### 8.2 🚚 Delivery Dashboard Modules

| Module          | Features                     | Priority |
| --------------- | ---------------------------- | -------- |
| **Dashboard**   | Active deliveries, rider map | Phase 2  |
| **Riders**      | CRUD, status, performance    | Phase 2  |
| **Assignments** | Assign orders to riders      | Phase 2  |
| **Tracking**    | Live map, ETA                | Phase 2  |
| **Zones**       | Delivery area management     | Phase 2  |
| **Reports**     | Delivery metrics, earnings   | Phase 3  |

### 8.3 🌐 Vendor Portal Modules

| Module       | Features                 | Priority |
| ------------ | ------------------------ | -------- |
| **Catalog**  | Product browsing, search | Phase 2  |
| **Cart**     | Add/remove, quantities   | Phase 2  |
| **Checkout** | Order placement, payment | Phase 2  |
| **Orders**   | Order tracking, history  | Phase 2  |
| **Account**  | Profile, addresses       | Phase 2  |

### 8.4 👑 Admin Portal Modules

| Module            | Features                | Priority |
| ----------------- | ----------------------- | -------- |
| **Dashboard**     | Platform metrics        | Phase 3  |
| **Tenants**       | All businesses, details | Phase 3  |
| **Subscriptions** | Plans, billing, revenue | Phase 3  |
| **Support**       | Tickets, chat           | Phase 3  |
| **Analytics**     | Platform-wide reports   | Phase 3  |
| **System**        | Health, logs, config    | Phase 3  |

---

## 9. DEVELOPMENT PHASES

### Phase 1: Core POS (Weeks 1-6)

**Goal:** Fully functional POS for a single store

| Week | Focus     | Deliverables                                    |
| ---- | --------- | ----------------------------------------------- |
| 1    | Setup     | Monorepo, Supabase, auth with country selection |
| 2    | Products  | Product CRUD, categories, images                |
| 3    | Inventory | Stock levels, adjustments                       |
| 4    | POS       | Checkout flow, cart, payments                   |
| 5    | Sales     | Sales history, receipts, voids                  |
| 6    | Customers | Customer CRUD, credit, basic loyalty            |

### Phase 2: Online & Delivery (Weeks 7-12)

**Goal:** Online ordering and delivery management

| Week | Focus               | Deliverables                      |
| ---- | ------------------- | --------------------------------- |
| 7    | Portal - Catalog    | Product browsing, search, filters |
| 8    | Portal - Checkout   | Cart, checkout, order placement   |
| 9    | POS - Orders        | Order management, notifications   |
| 10   | Delivery - Riders   | Rider management, status          |
| 11   | Delivery - Tracking | Assignment, live tracking         |
| 12   | Integration         | WhatsApp notifications, SMS       |

### Phase 3: Admin & Polish (Weeks 13-16)

**Goal:** Platform management and refinement

| Week | Focus           | Deliverables                     |
| ---- | --------------- | -------------------------------- |
| 13   | Admin - Tenants | Tenant management, onboarding    |
| 14   | Admin - Billing | Subscriptions, payments          |
| 15   | Reports         | Advanced reports across all apps |
| 16   | Polish          | Bug fixes, performance, testing  |

---

## 10. API DESIGN

### 10.1 API Layer Pattern

```typescript
// api/products.ts
import { supabase } from "@/lib/supabase";
import type { Product, CreateProductInput } from "@/types";

export const productsApi = {
  list: async (tenantId: string, filters?: ProductFilters) => {
    let query = supabase
      .from("products")
      .select("*, category:categories(id, name)")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    if (filters?.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query.order("name");
    if (error) throw error;
    return data as Product[];
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(id, name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Product;
  },

  create: async (input: CreateProductInput) => {
    const { data, error } = await supabase
      .from("products")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  update: async (id: string, input: Partial<Product>) => {
    const { data, error } = await supabase
      .from("products")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
  },
};
```

### 10.2 React Query Hooks

```typescript
// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useProducts(filters?: ProductFilters) {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["products", tenantId, filters],
    queryFn: () => productsApi.list(tenantId, filters),
    enabled: !!tenantId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Product created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
}
```

---

## 11. AUTHENTICATION STRATEGY

### 11.0 Core Principle: Phone + 6-Digit PIN ONLY

> ⚠️ **IMPORTANT**: This system uses **ONLY telephone number and 6-digit PIN** for authentication.
>
> - NO email/password login
> - NO social login (Google, Facebook, etc.)
> - Simple, fast, mobile-friendly

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION METHOD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   📱 PHONE NUMBER  +  🔢 6-DIGIT PIN                            │
│                                                                  │
│   • Phone = Your Identity (verified via OTP)                    │
│   • PIN = Your Password (6 digits, easy to remember)            │
│                                                                  │
│   Why this approach?                                             │
│   ✓ Everyone has a phone number                                 │
│   ✓ PINs are easier than passwords                              │
│   ✓ Perfect for quick POS transactions                          │
│   ✓ Staff can use shared tablets with their own PIN             │
│   ✓ Works for users who don't have email                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.1 Registration Flow (Sign Up)

```
┌─────────────────────────────────────────────────────────────────┐
│                      REGISTRATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SELECT COUNTRY                                              │
│     ┌─────────────┐  ┌─────────────┐                           │
│     │  🇬🇭 Ghana   │  │  🇳🇬 Nigeria │                           │
│     └─────────────┘  └─────────────┘                           │
│                          │                                       │
│  2. ENTER PHONE NUMBER   ▼                                       │
│     ┌─────────────────────────────┐                             │
│     │ +233 │ 024 XXX XXXX         │                             │
│     └─────────────────────────────┘                             │
│                          │                                       │
│  3. VERIFY OTP           ▼                                       │
│     ┌─────────────────────────────┐                             │
│     │    ○ ○ ○ ○ ○ ○              │ ← SMS via mNotify/Termii   │
│     └─────────────────────────────┘                             │
│                          │                                       │
│  4. CREATE 6-DIGIT PIN   ▼                                       │
│     ┌─────────────────────────────┐                             │
│     │    ○ ○ ○ ○ ○ ○              │ ← Your login PIN           │
│     │    Enter PIN                │                             │
│     └─────────────────────────────┘                             │
│     ┌─────────────────────────────┐                             │
│     │    ○ ○ ○ ○ ○ ○              │ ← Confirm PIN              │
│     │    Confirm PIN              │                             │
│     └─────────────────────────────┘                             │
│                          │                                       │
│  5. BUSINESS DETAILS     ▼                                       │
│     ┌─────────────────────────────┐                             │
│     │ Business Name: _________    │                             │
│     │ Your Name: _____________    │                             │
│     │ Email (optional): _____     │ ← For receipts only        │
│     └─────────────────────────────┘                             │
│                          │                                       │
│  6. WELCOME!             ▼                                       │
│     🎉 Account created                                          │
│     → Go to Dashboard                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Login Flow (Phone + 6-Digit PIN ONLY)

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ENTER PHONE NUMBER                                          │
│     ┌─────────────────────────────┐                             │
│     │ +233 │ 024 XXX XXXX         │                             │
│     └─────────────────────────────┘                             │
│                          │                                       │
│  2. ENTER 6-DIGIT PIN    ▼                                       │
│     ┌─────────────────────────────┐                             │
│     │    ○ ○ ○ ○ ○ ○              │                             │
│     └─────────────────────────────┘                             │
│                          │                                       │
│  3. SUCCESS!             ▼                                       │
│     ✅ Logged in                                                │
│     → Go to Dashboard                                           │
│                                                                  │
│  ─────────────────────────────────────────────────────          │
│  Forgot PIN? → Verify via OTP → Create new PIN                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.3 Authentication Implementation

```typescript
// auth/login.ts - PHONE + 6-DIGIT PIN ONLY

import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

/**
 * Primary Login Method: Phone + 6-Digit PIN
 * This is the ONLY way to log in to the system.
 */
export async function loginWithPhoneAndPIN(
  phone: string,
  pin: string,
): Promise<AuthResult> {
  // Validate PIN format (exactly 6 digits)
  if (!/^\d{6}$/.test(pin)) {
    return { success: false, error: "PIN must be exactly 6 digits" };
  }

  // Find user by phone number
  const { data: user, error } = await supabase
    .from("users")
    .select("id, tenant_id, phone, pin_hash, full_name, role, is_active")
    .eq("phone", phone)
    .single();

  if (error || !user) {
    return { success: false, error: "Invalid phone number or PIN" };
  }

  if (!user.is_active) {
    return { success: false, error: "Account is deactivated" };
  }

  // Verify PIN
  const pinValid = await bcrypt.compare(pin, user.pin_hash);
  if (!pinValid) {
    return { success: false, error: "Invalid phone number or PIN" };
  }

  // Create session
  const session = await createSession(user);

  // Update last login
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  return { success: true, user, session };
}

/**
 * Forgot PIN Flow: Verify via OTP, then reset PIN
 */
export async function requestPINReset(
  country: "GH" | "NG",
  phone: string,
): Promise<{ success: boolean; error?: string }> {
  // Check if user exists
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!user) {
    return { success: false, error: "Phone number not found" };
  }

  // Send OTP via mNotify (GH) or Termii (NG)
  const otp = generateOTP(); // 6-digit code
  await sendOTP(country, phone, otp);

  // Store OTP with 10-minute expiry
  await supabase.from("phone_otps").upsert({
    phone,
    otp_hash: await bcrypt.hash(otp, 10),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    purpose: "pin_reset",
  });

  return { success: true };
}

/**
 * Reset PIN after OTP verification
 */
export async function resetPIN(
  phone: string,
  otp: string,
  newPIN: string,
): Promise<{ success: boolean; error?: string }> {
  // Validate new PIN format
  if (!/^\d{6}$/.test(newPIN)) {
    return { success: false, error: "PIN must be exactly 6 digits" };
  }

  // Verify OTP
  const { data: otpRecord } = await supabase
    .from("phone_otps")
    .select("*")
    .eq("phone", phone)
    .eq("purpose", "pin_reset")
    .single();

  if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) {
    return { success: false, error: "OTP expired or invalid" };
  }

  const otpValid = await bcrypt.compare(otp, otpRecord.otp_hash);
  if (!otpValid) {
    return { success: false, error: "Invalid OTP" };
  }

  // Update PIN
  const pinHash = await bcrypt.hash(newPIN, 10);
  await supabase.from("users").update({ pin_hash: pinHash }).eq("phone", phone);

  // Delete used OTP
  await supabase.from("phone_otps").delete().eq("phone", phone);

  return { success: true };
}

/**
 * Registration: Phone + OTP + Create 6-Digit PIN
 */
export async function registerUser(params: {
  country: "GH" | "NG";
  phone: string;
  otp: string;
  pin: string;
  businessName: string;
  fullName: string;
  email?: string;
}): Promise<AuthResult> {
  const { country, phone, otp, pin, businessName, fullName, email } = params;

  // Validate PIN format
  if (!/^\d{6}$/.test(pin)) {
    return { success: false, error: "PIN must be exactly 6 digits" };
  }

  // Verify OTP
  const otpValid = await verifyOTP(phone, otp, "registration");
  if (!otpValid) {
    return { success: false, error: "Invalid or expired OTP" };
  }

  // Create tenant (business)
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      name: businessName,
      country,
      currency: country === "GH" ? "GHS" : "NGN",
      phone_country_code: country === "GH" ? "+233" : "+234",
      timezone: country === "GH" ? "Africa/Accra" : "Africa/Lagos",
    })
    .select()
    .single();

  if (tenantError) {
    return { success: false, error: "Failed to create business" };
  }

  // Create user with hashed PIN
  const pinHash = await bcrypt.hash(pin, 10);
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      tenant_id: tenant.id,
      phone,
      pin_hash: pinHash,
      full_name: fullName,
      email: email || null,
      role: "owner",
      is_active: true,
    })
    .select()
    .single();

  if (userError) {
    return { success: false, error: "Failed to create user" };
  }

  // Create session and return
  const session = await createSession(user);
  return { success: true, user, session };
}
```

### 11.4 PIN Security Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                     6-DIGIT PIN RULES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ MUST be exactly 6 digits (000000 - 999999)                  │
│  ✅ Stored as bcrypt hash (never plain text)                    │
│  ✅ 5 failed attempts = 15 minute lockout                       │
│  ✅ PIN reset requires OTP verification                         │
│                                                                  │
│  ❌ NOT allowed: sequential (123456, 654321)                    │
│  ❌ NOT allowed: repeated (111111, 222222)                      │
│  ❌ NOT allowed: common PINs (000000, 123123)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Validate PIN strength
export function validatePINStrength(pin: string): {
  valid: boolean;
  error?: string;
} {
  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, error: "PIN must be exactly 6 digits" };
  }

  // Check for sequential
  if (/012345|123456|234567|345678|456789|567890/.test(pin)) {
    return { valid: false, error: "PIN cannot be sequential" };
  }
  if (/987654|876543|765432|654321|543210/.test(pin)) {
    return { valid: false, error: "PIN cannot be sequential" };
  }

  // Check for all same digits
  if (/^(\d)\1{5}$/.test(pin)) {
    return { valid: false, error: "PIN cannot be all same digits" };
  }

  // Check for common PINs
  const commonPINs = ["123123", "121212", "131313", "696969"];
  if (commonPINs.includes(pin)) {
    return { valid: false, error: "PIN is too common" };
  }

  return { valid: true };
}
```

---

## 12. INTEGRATIONS

### 12.1 Payment Processing (Paystack)

```typescript
// lib/payment/paystack.ts
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function initializePayment(params: {
  email: string;
  amount: number; // in kobo/pesewas
  currency: "GHS" | "NGN";
  reference: string;
  metadata?: Record<string, any>;
}) {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        currency: params.currency,
        reference: params.reference,
        metadata: params.metadata,
        callback_url: `${process.env.APP_URL}/payment/callback`,
      }),
    },
  );

  return response.json();
}

export async function verifyPayment(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    },
  );

  return response.json();
}
```

### 12.2 Mobile Money

```typescript
// Ghana Mobile Money via Paystack
export async function chargeMobileMoney(params: {
  phone: string;
  provider: "mtn" | "vodafone" | "airteltigo";
  amount: number;
  reference: string;
}) {
  const response = await fetch("https://api.paystack.co/charge", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      email: "customer@example.com",
      currency: "GHS",
      mobile_money: {
        phone: params.phone,
        provider: params.provider,
      },
      reference: params.reference,
    }),
  });

  return response.json();
}
```

### 12.3 WhatsApp Notifications

```typescript
// Notification types
const WHATSAPP_TEMPLATES = {
  order_confirmation: {
    name: "order_confirmation",
    params: ["customer_name", "order_number", "total", "store_name"],
  },
  order_ready: {
    name: "order_ready_pickup",
    params: ["customer_name", "order_number", "store_address"],
  },
  delivery_started: {
    name: "delivery_on_the_way",
    params: ["customer_name", "rider_name", "eta_minutes"],
  },
  delivery_completed: {
    name: "delivery_completed",
    params: ["customer_name", "order_number"],
  },
};

// Send notification
export async function sendOrderConfirmation(order: Order) {
  await sendWhatsAppMessage(order.customer_phone, "order_confirmation", {
    customer_name: order.customer_name,
    order_number: order.order_number,
    total: formatCurrency(order.total, order.tenant.country),
    store_name: order.store.name,
  });
}
```

---

## 13. OFFLINE-FIRST STRATEGY

### 13.1 Which Apps Need Offline?

| App                    | Offline Support | Reason                            |
| ---------------------- | --------------- | --------------------------------- |
| **POS App**            | ✅ Full         | Must work during internet outage  |
| **Delivery Dashboard** | ⚠️ Partial      | Needs real-time, but cache recent |
| **Vendor Portal**      | ❌ No           | Requires internet for orders      |
| **Admin Portal**       | ❌ No           | Admin tasks need real-time data   |

### 13.2 POS Offline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    POS OFFLINE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      REACT APP                           │   │
│   │                          │                               │   │
│   │   ┌──────────────────────┴──────────────────────────┐   │   │
│   │   │              TanStack Query                      │   │   │
│   │   │    (Manages server state, caches responses)      │   │   │
│   │   └──────────────────────┬──────────────────────────┘   │   │
│   │                          │                               │   │
│   │   ┌──────────────────────┼──────────────────────────┐   │   │
│   │   │                      │                          │   │   │
│   │   ▼                      ▼                          ▼   │   │
│   │ ┌──────────┐      ┌──────────────┐      ┌──────────┐   │   │
│   │ │ DEXIE.JS │◄────►│  SYNC ENGINE │◄────►│ SUPABASE │   │   │
│   │ │(IndexedDB)│      │              │      │  (Cloud) │   │   │
│   │ │          │      │ • Queue ops  │      │          │   │   │
│   │ │ • Products│      │ • Retry fail │      │ • Auth   │   │   │
│   │ │ • Sales   │      │ • Conflict   │      │ • Sync   │   │   │
│   │ │ • Stock   │      │   resolution │      │ • Backup │   │   │
│   │ │ • Customers│      │              │      │          │   │   │
│   │ └──────────┘      └──────────────┘      └──────────┘   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   OFFLINE BEHAVIOR:                                             │
│   ✓ All reads from IndexedDB (instant)                         │
│   ✓ Writes go to IndexedDB + sync queue                        │
│   ✓ Sync queue processes when online                           │
│   ✓ Uses UPSERT to handle conflicts                            │
│   ✓ Shows sync status indicator                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 13.3 Sync Rules

```typescript
// ALWAYS use upsert (never insert)
const { error } = await supabase
  .from("sales")
  .upsert(sale, { onConflict: "id" });

// Max 3 retries, then move to failed queue
if (item.retries >= 3) {
  await markAsFailed(item);
  showUserAlert("Some data failed to sync");
}

// Conflict resolution: Last write wins
// (For more complex scenarios, use timestamps)
```

---

## 14. DEPLOYMENT STRATEGY

### 14.1 Environments

| Environment | URL Pattern                 | Purpose   |
| ----------- | --------------------------- | --------- |
| Development | localhost:5173              | Local dev |
| Staging     | staging-\*.warehousepos.com | Testing   |
| Production  | \*.warehousepos.com         | Live      |

### 14.2 URLs

| App           | Production URL            |
| ------------- | ------------------------- |
| Marketing     | warehousepos.com          |
| POS App       | app.warehousepos.com      |
| Delivery      | delivery.warehousepos.com |
| Vendor Portal | {slug}.warehousepos.com   |
| Admin         | admin.warehousepos.com    |

### 14.3 Hosting

| Service    | Used For                     |
| ---------- | ---------------------------- |
| Vercel     | All frontend apps            |
| Supabase   | Backend, database, auth      |
| Cloudinary | Image storage & optimization |
| Sentry     | Error monitoring             |

---

## 📋 NEXT STEPS

1. [ ] Review and approve this plan
2. [ ] Create new GitHub repository
3. [ ] Setup Supabase project with country config
4. [ ] Create monorepo structure
5. [ ] Implement shared UI components
6. [ ] Begin Phase 1: POS App core

---

## 📝 APPROVAL

| Role          | Name | Date | Approved |
| ------------- | ---- | ---- | -------- |
| Product Owner |      |      | [ ]      |
| Tech Lead     |      |      | [ ]      |
| Developer     |      |      | [ ]      |

---

> **Document Version:** 2.0  
> **Last Updated:** January 27, 2026  
> **Next Review:** Before Phase 1 kickoff
