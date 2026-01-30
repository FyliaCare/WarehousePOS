# 🏪 Warehouse POS - Complete Features Documentation

> **Last Updated:** January 30, 2026  
> **Version:** 1.0  
> **Platform:** Warehouse POS - Multi-tenant SaaS for Ghana & West Africa

---

## Table of Contents

1. [Overview](#overview)
2. [Point of Sale (POS)](#point-of-sale-pos)
3. [Inventory Management](#inventory-management)
4. [Customer Management](#customer-management)
5. [Sales & Transactions](#sales--transactions)
6. [Order Management](#order-management)
7. [Online Storefront](#online-storefront)
8. [Reports & Analytics](#reports--analytics)
9. [Marketing & Loyalty](#marketing--loyalty)
10. [Delivery & Logistics](#delivery--logistics)
11. [Finance & Accounting](#finance--accounting)
12. [Tax & Compliance](#tax--compliance)
13. [Payroll Management](#payroll-management)
14. [Staff Management](#staff-management)
15. [Notifications & Messaging](#notifications--messaging)
16. [Settings & Configuration](#settings--configuration)
17. [PWA & Offline Features](#pwa--offline-features)
18. [Subscription Plans](#subscription-plans)

---

## Overview

Warehouse POS is a comprehensive, offline-first Point of Sale system designed specifically for small to medium businesses in Ghana and West Africa. The system provides end-to-end business management from sales to inventory, customers, deliveries, and financial reporting.

### Key Highlights

| Feature                     | Description                                    |
| --------------------------- | ---------------------------------------------- |
| **Offline-First**           | Full functionality without internet connection |
| **Multi-Tenant**            | Each business has isolated, secure data        |
| **Mobile-First**            | Optimized for smartphone use                   |
| **Local Payments**          | MoMo, Vodafone Cash, AirtelTigo, cash, cards   |
| **West African Compliance** | Ghana VAT, NHIL, GETFUND, SSNIT ready          |
| **WhatsApp Integration**    | Send receipts and notifications via WhatsApp   |

### Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **State Management:** Zustand with persistence
- **Offline Database:** IndexedDB via Dexie.js
- **Cloud Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Styling:** Tailwind CSS + shadcn/ui
- **PWA:** Service Worker with background sync

---

## Point of Sale (POS)

**Location:** `src/pages/pos/POSPage.tsx`  
**Store:** `src/stores/posStore.ts`

The heart of Warehouse POS - a fast, intuitive checkout experience optimized for both mobile and desktop.

### Core Features

| Feature                  | Description                               | Status     |
| ------------------------ | ----------------------------------------- | ---------- |
| **Product Search**       | Fuzzy search by name, SKU, or barcode     | ✅ Working |
| **Barcode Scanning**     | Camera-based and hardware scanner support | ✅ Working |
| **Shopping Cart**        | Add, remove, adjust quantities            | ✅ Working |
| **Item Discounts**       | Per-item percentage or fixed discounts    | ✅ Working |
| **Cart Discounts**       | Apply discount to entire cart             | ✅ Working |
| **Multiple Payments**    | Split between cash, card, MoMo            | ✅ Working |
| **Hold Transactions**    | Park sales for later                      | ✅ Working |
| **Receipt Printing**     | Thermal printer support (58mm/80mm)       | ✅ Working |
| **WhatsApp Receipts**    | Send digital receipts instantly           | ✅ Working |
| **Customer Selection**   | Quick lookup, apply loyalty               | ✅ Working |
| **Loyalty Points**       | Earn and redeem at checkout               | ✅ Working |
| **Promo Codes**          | Validate and apply discounts              | ✅ Working |
| **Gift Card Redemption** | Apply gift card balances                  | ✅ Working |
| **Offline Mode**         | Full functionality without internet       | ✅ Working |

### Payment Methods Supported

```
┌─────────────────────────────────────────────────────────┐
│                    Payment Options                       │
├─────────────────────────────────────────────────────────┤
│  💵 Cash          │ Traditional cash payment            │
│  💳 Card          │ Visa, Mastercard, Verve             │
│  📱 MTN MoMo      │ Ghana's largest mobile money        │
│  📱 Vodafone Cash │ Vodafone mobile wallet              │
│  📱 AirtelTigo    │ AirtelTigo Money                    │
│  🏦 Bank Transfer │ Direct bank payments                │
│  🎁 Gift Card     │ Warehouse gift cards                │
│  💰 Store Credit  │ Customer credit balance             │
│  🔀 Split Payment │ Combine multiple methods            │
└─────────────────────────────────────────────────────────┘
```

### Fulfillment Types

| Type         | Icon | Description                  |
| ------------ | ---- | ---------------------------- |
| **Pickup**   | 🏪   | Customer collects from store |
| **Delivery** | 🚚   | Deliver to customer address  |
| **Dine-In**  | 🍽️   | For restaurants/cafes        |

### Hold & Recall

- Park incomplete transactions
- Store multiple held sales
- Recall and continue later
- Preserved during offline mode

### Keyboard Shortcuts

| Shortcut | Action               |
| -------- | -------------------- |
| `Ctrl+K` | Quick search         |
| `Ctrl+P` | Proceed to payment   |
| `Ctrl+H` | Hold transaction     |
| `Ctrl+C` | Select customer      |
| `Esc`    | Cancel/close dialogs |

---

## Inventory Management

**Location:** `src/pages/inventory/`  
**Store:** `src/stores/inventoryStore.ts`

Complete product and stock management with multi-location support.

### Products

| Feature             | Description                           | Status     |
| ------------------- | ------------------------------------- | ---------- |
| **Product CRUD**    | Create, read, update, delete products | ✅ Working |
| **Categories**      | Hierarchical category structure       | ✅ Working |
| **Product Images**  | Multiple images per product           | ✅ Working |
| **Variants**        | Size, color, material options         | ✅ Working |
| **Barcode Support** | Generate and print barcodes           | ✅ Working |
| **Cost & Pricing**  | Cost price, selling price, margins    | ✅ Working |
| **Tax Settings**    | Per-product tax configuration         | ✅ Working |
| **Bulk Import**     | CSV import with mapping               | ✅ Working |
| **Bulk Export**     | Export to CSV/Excel                   | ✅ Working |

### Product Fields

```typescript
interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: string;
  brand?: string;

  // Pricing
  cost_price: number;
  selling_price: number;
  compare_at_price?: number; // For "was/now" pricing

  // Tax
  tax_type: "standard" | "reduced" | "exempt";
  tax_inclusive: boolean;

  // Inventory
  track_inventory: boolean;
  low_stock_threshold: number;

  // Status
  is_active: boolean;
  is_featured: boolean;

  // Media
  image_url?: string;
  images?: string[];

  // Variants
  has_variants: boolean;
  variants?: ProductVariant[];
}
```

### Stock Management

| Feature                | Description                     | Status     |
| ---------------------- | ------------------------------- | ---------- |
| **Stock Levels**       | Track quantity per location     | ✅ Working |
| **Stock Adjustments**  | Add, remove, set stock          | ✅ Working |
| **Adjustment Reasons** | Damage, theft, count correction | ✅ Working |
| **Stock Transfers**    | Move between locations          | ✅ Working |
| **Low Stock Alerts**   | Configurable thresholds         | ✅ Working |
| **Stock History**      | Audit trail of changes          | ✅ Working |
| **Batch Tracking**     | Lot/batch number support        | ✅ Working |
| **Expiry Tracking**    | For perishable goods            | ✅ Working |

### Stock Adjustment Types

```
┌──────────────────────────────────────────────────────┐
│                Adjustment Reasons                     │
├──────────────────────────────────────────────────────┤
│  ➕ Stock Received      │ New inventory arrived      │
│  ➖ Damaged             │ Broken/unsellable items    │
│  ➖ Theft               │ Lost or stolen             │
│  ➖ Expired             │ Past expiration date       │
│  🔄 Count Correction    │ Physical count difference  │
│  🎁 Promotional Use     │ Given away/samples         │
│  ↔️ Transfer Out        │ Sent to another location   │
│  ↔️ Transfer In         │ Received from location     │
└──────────────────────────────────────────────────────┘
```

---

## Customer Management

**Location:** `src/pages/customers/`  
**Store:** `src/stores/customerStore.ts`

Build relationships with your customers through comprehensive profile management.

### Customer Features

| Feature              | Description                   | Status     |
| -------------------- | ----------------------------- | ---------- |
| **Customer CRUD**    | Full customer management      | ✅ Working |
| **Customer Groups**  | VIP, wholesale, retail, etc.  | ✅ Working |
| **Group Discounts**  | Automatic discounts by group  | ✅ Working |
| **Purchase History** | Complete transaction history  | ✅ Working |
| **Credit Balance**   | Track customer debts          | ✅ Working |
| **Loyalty Points**   | Earn and redeem points        | ✅ Working |
| **Customer Search**  | By name, phone, email         | ✅ Working |
| **Quick Add**        | Add customers during checkout | ✅ Working |

### Customer Profile

```typescript
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;

  // Address
  address?: string;
  city?: string;
  region?: string;

  // Business
  company?: string;
  tax_id?: string;

  // Classification
  customer_group_id?: string;
  tags?: string[];

  // Financial
  credit_limit: number;
  credit_balance: number; // Negative = owes money

  // Loyalty
  loyalty_points: number;
  loyalty_tier?: string;

  // Stats
  total_purchases: number;
  total_spent: number;
  last_purchase_date?: string;

  // Notes
  notes?: string;
}
```

### Credit & Debt Management

| Feature                 | Description            | Status     |
| ----------------------- | ---------------------- | ---------- |
| **Credit Transactions** | Record credit sales    | ✅ Working |
| **Debt Aging**          | 30/60/90 day tracking  | ✅ Working |
| **Payment Recording**   | Track debt payments    | ✅ Working |
| **Credit Limits**       | Per-customer limits    | ✅ Working |
| **WhatsApp Reminders**  | Send payment reminders | ✅ Working |
| **Debt Reports**        | Outstanding balances   | ✅ Working |

---

## Sales & Transactions

**Location:** `src/pages/sales/`

Complete sales history and transaction management.

### Sales Features

| Feature              | Description                 | Status     |
| -------------------- | --------------------------- | ---------- |
| **Sales History**    | Searchable, filterable list | ✅ Working |
| **Sale Details**     | Full transaction breakdown  | ✅ Working |
| **Void Sales**       | Cancel completed sales      | ✅ Working |
| **Reprint Receipts** | Reprint any receipt         | ✅ Working |
| **Export Data**      | CSV with date ranges        | ✅ Working |
| **Daily Summary**    | End of day reports          | ✅ Working |

### Returns & Refunds

| Feature               | Description                          | Status     |
| --------------------- | ------------------------------------ | ---------- |
| **Process Returns**   | From sale reference                  | ✅ Working |
| **Partial Returns**   | Return selected items                | ✅ Working |
| **Refund Options**    | Cash, original payment, store credit | ✅ Working |
| **Return Reasons**    | Track why items returned             | ✅ Working |
| **Approval Workflow** | Manager approval if needed           | ✅ Working |

### Quotations

| Feature              | Description             | Status     |
| -------------------- | ----------------------- | ---------- |
| **Create Quotes**    | Professional quotations | ✅ Working |
| **Quote Templates**  | Customizable formats    | ✅ Working |
| **Valid Until Date** | Expiry tracking         | ✅ Working |
| **PDF Generation**   | Download as PDF         | ✅ Working |
| **WhatsApp Send**    | Share via WhatsApp      | ✅ Working |
| **Convert to Sale**  | One-click conversion    | ✅ Working |

### Layaway Plans

| Feature               | Description                  | Status     |
| --------------------- | ---------------------------- | ---------- |
| **Create Layaway**    | With deposit                 | ✅ Working |
| **Payment Schedule**  | Custom installments          | ✅ Working |
| **Payment Recording** | Track payments               | ✅ Working |
| **Auto Reminders**    | Automated notifications      | ✅ Working |
| **Status Tracking**   | Pending → Active → Completed | ✅ Working |

---

## Order Management

**Location:** `src/pages/orders/`  
**Store:** `src/stores/ordersStore.ts`

Manage orders from multiple channels in one place.

### Order Sources

| Source           | Description         |
| ---------------- | ------------------- |
| **POS**          | Walk-in customers   |
| **WhatsApp**     | Orders via WhatsApp |
| **Phone**        | Phone orders        |
| **Online Store** | From storefront     |
| **Instagram**    | Social media orders |

### Order Workflow

```
┌─────────┐    ┌───────────┐    ┌─────────┐    ┌───────────┐    ┌───────────┐
│   New   │ -> │ Confirmed │ -> │ Preparing│ -> │   Ready   │ -> │ Delivered │
└─────────┘    └───────────┘    └─────────┘    └───────────┘    └───────────┘
                                                      │
                                                      v
                                               ┌───────────┐
                                               │  Picked   │
                                               │    Up     │
                                               └───────────┘
```

### Order Features

| Feature                    | Description                 | Status     |
| -------------------------- | --------------------------- | ---------- |
| **Order CRUD**             | Create, view, update orders | ✅ Working |
| **Multi-Source**           | Track order origin          | ✅ Working |
| **Status Workflow**        | Full lifecycle management   | ✅ Working |
| **Kanban View**            | Drag-and-drop board         | ✅ Working |
| **Calendar View**          | Orders by date              | ✅ Working |
| **Customer Notifications** | Status update alerts        | ✅ Working |
| **Delivery Assignment**    | Assign to riders            | ✅ Working |
| **Order Notes**            | Internal and customer notes | ✅ Working |

---

## Online Storefront

**Location:** `src/pages/storefront/`, `src/pages/settings/CatalogSettingsPage.tsx`

Create a beautiful online catalog to share with customers.

### Storefront Features

| Feature                 | Description                   | Status     |
| ----------------------- | ----------------------------- | ---------- |
| **Store Branding**      | Logo, colors, fonts           | ✅ Working |
| **Custom Themes**       | Multiple design presets       | ✅ Working |
| **Product Display**     | Grid and list views           | ✅ Working |
| **Category Navigation** | Browse by category            | ✅ Working |
| **Product Search**      | Real-time search              | ✅ Working |
| **Product Details**     | Images, description, price    | ✅ Working |
| **Social Links**        | Instagram, Facebook, WhatsApp | ✅ Working |
| **Contact Info**        | Phone, address, hours         | ✅ Working |
| **SEO Settings**        | Meta tags, Open Graph         | ✅ Working |
| **Shareable Link**      | yourstore.warehousepos.com    | ✅ Working |

### Customer Inquiries

| Feature                | Description              | Status     |
| ---------------------- | ------------------------ | ---------- |
| **Inquiry Submission** | Customers can inquire    | ✅ Working |
| **Inquiry Dashboard**  | View all inquiries       | ✅ Working |
| **Status Management**  | New → Quoted → Converted | ✅ Working |
| **WhatsApp Reply**     | Quick response           | ✅ Working |
| **Convert to Quote**   | Pre-fill quotation       | ✅ Working |

---

## Reports & Analytics

**Location:** `src/pages/reports/`, `src/pages/analytics/`  
**Store:** `src/stores/analyticsStore.ts`

Make data-driven decisions with comprehensive reporting.

### Sales Reports

| Report                  | Description           | Status     |
| ----------------------- | --------------------- | ---------- |
| **Daily Sales**         | Today's performance   | ✅ Working |
| **Weekly Sales**        | Week-over-week trends | ✅ Working |
| **Monthly Sales**       | Monthly summaries     | ✅ Working |
| **Product Performance** | Best/worst sellers    | ✅ Working |
| **Category Analysis**   | Sales by category     | ✅ Working |
| **Staff Performance**   | Sales by employee     | ✅ Working |
| **Payment Methods**     | Breakdown by payment  | ✅ Working |
| **Hourly Trends**       | Peak sales hours      | ✅ Working |

### Inventory Reports

| Report               | Description           | Status     |
| -------------------- | --------------------- | ---------- |
| **Stock Levels**     | Current inventory     | ✅ Working |
| **Stock Valuation**  | Inventory worth       | ✅ Working |
| **Low Stock**        | Items below threshold | ✅ Working |
| **Movement History** | Stock changes         | ✅ Working |
| **Dead Stock**       | Items not selling     | ✅ Working |
| **Turnover Rate**    | Inventory efficiency  | ✅ Working |

### Financial Reports

| Report              | Description         | Status     |
| ------------------- | ------------------- | ---------- |
| **Profit & Loss**   | Revenue vs expenses | ✅ Working |
| **Gross Margin**    | Product margins     | ✅ Working |
| **Cash Flow**       | Money in/out        | ✅ Working |
| **Tax Reports**     | VAT, withholding    | ✅ Working |
| **Expense Summary** | Spending breakdown  | ✅ Working |

### AI-Powered Analytics

| Feature                | Description             | Status     |
| ---------------------- | ----------------------- | ---------- |
| **Sales Forecasting**  | Predict future sales    | ✅ Working |
| **Demand Prediction**  | Reorder recommendations | ✅ Working |
| **RFM Segmentation**   | Customer scoring        | ✅ Working |
| **CLV Calculation**    | Customer lifetime value | ✅ Working |
| **Trend Detection**    | Identify patterns       | ✅ Working |
| **Smart Alerts**       | Automated insights      | ✅ Working |
| **AI Recommendations** | Actionable insights     | ✅ Working |

---

## Marketing & Loyalty

**Location:** `src/pages/marketing/`  
**Store:** `src/stores/loyaltyStore.ts`, `src/stores/marketingStore.ts`

Grow your business with built-in marketing tools.

### Loyalty Program

| Feature               | Description                       | Status     |
| --------------------- | --------------------------------- | ---------- |
| **Tier System**       | Bronze → Silver → Gold → Platinum | ✅ Working |
| **Points Earning**    | Points per purchase               | ✅ Working |
| **Points Redemption** | Redeem at checkout                | ✅ Working |
| **Referral Codes**    | Customer referrals                | ✅ Working |
| **Tier Benefits**     | Discounts per tier                | ✅ Working |
| **Birthday Rewards**  | Special birthday offers           | ✅ Working |

### Loyalty Tiers

| Tier        | Points Required | Benefits                  |
| ----------- | --------------- | ------------------------- |
| 🥉 Bronze   | 0               | 1 point per ₵10           |
| 🥈 Silver   | 500             | 1.25x points, 2% discount |
| 🥇 Gold     | 2,000           | 1.5x points, 5% discount  |
| 💎 Platinum | 5,000           | 2x points, 10% discount   |

### Promo Codes

| Feature                  | Description                  | Status     |
| ------------------------ | ---------------------------- | ---------- |
| **Create Codes**         | Custom promo codes           | ✅ Working |
| **Discount Types**       | Percentage or fixed          | ✅ Working |
| **Usage Limits**         | Max uses, per customer       | ✅ Working |
| **Date Validity**        | Start and end dates          | ✅ Working |
| **Min Order Amount**     | Minimum cart value           | ✅ Working |
| **Product Restrictions** | Specific products/categories | ✅ Working |

### Gift Cards

| Feature                 | Description            | Status     |
| ----------------------- | ---------------------- | ---------- |
| **Issue Gift Cards**    | Unique code generation | ✅ Working |
| **Custom Amounts**      | Any value              | ✅ Working |
| **Balance Tracking**    | Real-time balance      | ✅ Working |
| **Partial Redemption**  | Use part of balance    | ✅ Working |
| **Expiry Management**   | Optional expiration    | ✅ Working |
| **Transaction History** | Usage tracking         | ✅ Working |

### Marketing Campaigns

| Feature               | Description          | Status     |
| --------------------- | -------------------- | ---------- |
| **Customer Segments** | RFM-based targeting  | ✅ Working |
| **Campaign Creation** | SMS, WhatsApp, Email | ✅ Working |
| **Templates**         | Message templates    | ✅ Working |
| **Scheduling**        | Future send dates    | ✅ Working |
| **Analytics**         | Campaign performance | ✅ Working |

---

## Delivery & Logistics

**Location:** `src/pages/delivery/`  
**Store:** `src/stores/deliveryStore.ts`

> For comprehensive delivery documentation, see [DELIVERY_FEATURES.md](./DELIVERY_FEATURES.md)

### Quick Overview

| Feature                    | Description                   | Status     |
| -------------------------- | ----------------------------- | ---------- |
| **Delivery Zones**         | Geographic areas with pricing | ✅ Working |
| **Zone Fees**              | Custom fee per zone           | ✅ Working |
| **Rider Management**       | Add and manage riders         | ✅ Working |
| **Delivery Assignment**    | Assign orders to riders       | ✅ Working |
| **Map Integration**        | Draw zone boundaries          | ✅ Working |
| **Rider Portal**           | Dedicated rider app           | ✅ Working |
| **Order Tracking**         | Customer tracking page        | ✅ Working |
| **Delivery Notifications** | Automated updates             | ✅ Working |

---

## Finance & Accounting

**Location:** `src/pages/finance/`, `src/pages/accounting/`

Keep your finances organized and compliant.

### Financial Overview

| Feature              | Description        | Status     |
| -------------------- | ------------------ | ---------- |
| **Dashboard**        | Financial snapshot | ✅ Working |
| **Cash Flow**        | Money movement     | ✅ Working |
| **Revenue Tracking** | Sales revenue      | ✅ Working |
| **Expense Tracking** | Business expenses  | ✅ Working |
| **Payment Methods**  | Configure payments | ✅ Working |

### Expense Management

| Feature                | Description                     | Status     |
| ---------------------- | ------------------------------- | ---------- |
| **Expense CRUD**       | Record expenses                 | ✅ Working |
| **Categories**         | Rent, utilities, supplies, etc. | ✅ Working |
| **Receipt Upload**     | Attach receipts                 | ✅ Working |
| **Recurring Expenses** | Auto-repeat                     | ✅ Working |
| **Expense Reports**    | Spending analysis               | ✅ Working |

### Accounting

| Feature                  | Description            | Status     |
| ------------------------ | ---------------------- | ---------- |
| **Chart of Accounts**    | Ghana COA default      | ✅ Working |
| **Account Hierarchy**    | Parent-child structure | ✅ Working |
| **Journal Entries**      | Debit/credit posting   | ✅ Working |
| **Balance Validation**   | Debits = Credits       | ✅ Working |
| **Fiscal Periods**       | Period management      | ✅ Working |
| **Financial Statements** | P&L, Balance Sheet     | ✅ Working |

---

## Tax & Compliance

**Location:** `src/pages/tax/`

Stay compliant with Ghana and Nigeria tax regulations.

### Ghana Tax Support

| Tax              | Rate | Description                |
| ---------------- | ---- | -------------------------- |
| **VAT**          | 15%  | Standard VAT               |
| **NHIL**         | 2.5% | National Health Insurance  |
| **GETFUND**      | 2.5% | Ghana Education Trust Fund |
| **CST**          | 5%   | Communication Service Tax  |
| **Tourism Levy** | 1%   | For hospitality            |

### Tax Features

| Feature             | Description           | Status     |
| ------------------- | --------------------- | ---------- |
| **Tax Rates**       | Ghana & Nigeria rates | ✅ Working |
| **Tax Settings**    | TIN, VAT registration | ✅ Working |
| **Tax Exemptions**  | Per product/customer  | ✅ Working |
| **Tax Breakdown**   | On invoices/receipts  | ✅ Working |
| **Tax Reports**     | Period summaries      | ✅ Working |
| **Withholding Tax** | For applicable items  | ✅ Working |

---

## Payroll Management

**Location:** `src/pages/payroll/`

Pay your team accurately with automatic tax calculations.

### Payroll Features

| Feature                | Description                | Status     |
| ---------------------- | -------------------------- | ---------- |
| **Employee Setup**     | Add staff with salary info | ✅ Working |
| **Ghana PAYE**         | 2025 tax brackets          | ✅ Working |
| **SSNIT Calculations** | Tier 1/2/3 contributions   | ✅ Working |
| **Nigeria PAYE**       | Nigerian tax rates         | ✅ Working |
| **Payroll Runs**       | Process monthly payroll    | ✅ Working |
| **Payslip Generation** | Detailed payslips          | ✅ Working |
| **Deductions**         | Loans, advances, etc.      | ✅ Working |
| **Allowances**         | Transport, housing, etc.   | ✅ Working |

### Ghana PAYE Brackets (2025)

| Annual Income (GHS) | Rate  |
| ------------------- | ----- |
| Up to 4,824         | 0%    |
| 4,824 - 6,024       | 5%    |
| 6,024 - 8,424       | 10%   |
| 8,424 - 46,824      | 17.5% |
| 46,824 - 288,024    | 25%   |
| Above 288,024       | 30%   |

### SSNIT Contributions

| Tier   | Employee | Employer |
| ------ | -------- | -------- |
| Tier 1 | 5.5%     | 13%      |
| Tier 2 | 5%       | -        |
| Tier 3 | Optional | Optional |

---

## Staff Management

**Location:** `src/pages/staff/`

Manage your team effectively.

### Staff Features

| Feature                 | Description                     | Status     |
| ----------------------- | ------------------------------- | ---------- |
| **Staff Accounts**      | Create user accounts            | ✅ Working |
| **Role Management**     | Admin, Manager, Cashier, Viewer | ✅ Working |
| **Permissions**         | Granular access control         | ✅ Working |
| **PIN Login**           | Quick cashier access            | ✅ Working |
| **Activity Tracking**   | Action audit trail              | ✅ Working |
| **Performance Reports** | Sales by staff                  | ✅ Working |

### Roles & Permissions

| Role        | Description       | Key Permissions                   |
| ----------- | ----------------- | --------------------------------- |
| **Owner**   | Full access       | Everything                        |
| **Admin**   | Management access | Settings, staff, reports          |
| **Manager** | Operations access | Inventory, orders, basic reports  |
| **Cashier** | POS access        | Sales, customers, basic inventory |
| **Viewer**  | Read-only         | View reports and data             |

### Scheduling

| Feature                | Description      | Status     |
| ---------------------- | ---------------- | ---------- |
| **Shift Management**   | Weekly calendar  | ✅ Working |
| **Clock In/Out**       | Time tracking    | ✅ Working |
| **Break Tracking**     | Start/end breaks | ✅ Working |
| **Attendance Records** | Historical data  | ✅ Working |

---

## Notifications & Messaging

**Location:** `src/lib/delivery-notifications.ts`, Supabase Edge Functions

Keep customers and staff informed automatically.

### Notification Channels

| Channel      | Use Case                     | Status     |
| ------------ | ---------------------------- | ---------- |
| **WhatsApp** | Receipts, reminders, updates | ✅ Working |
| **SMS**      | Backup notifications         | ✅ Working |
| **In-App**   | Staff notifications          | ✅ Working |
| **Push**     | PWA notifications            | ✅ Working |

### Automated Notifications

| Trigger          | Customer | Staff |
| ---------------- | -------- | ----- |
| Order Confirmed  | ✅       | ✅    |
| Order Ready      | ✅       | -     |
| Rider Assigned   | ✅       | ✅    |
| Out for Delivery | ✅       | -     |
| Delivered        | ✅       | ✅    |
| Payment Reminder | ✅       | -     |
| Low Stock Alert  | -        | ✅    |

### WhatsApp Features

- Send digital receipts instantly
- Customer order updates
- Payment reminders for debts
- Layaway payment reminders
- Delivery tracking links
- Promotional messages

---

## Settings & Configuration

**Location:** `src/pages/settings/`

Customize Warehouse POS for your business.

### General Settings

| Setting              | Description              |
| -------------------- | ------------------------ |
| **Business Info**    | Name, address, logo      |
| **Currency**         | GHS, NGN, USD            |
| **Tax Settings**     | TIN, VAT registration    |
| **Receipt Settings** | Header, footer, logo     |
| **Default Payment**  | Preferred payment method |

### Store Locations

| Feature             | Description              |
| ------------------- | ------------------------ |
| **Multiple Stores** | Add unlimited locations  |
| **Per-Store Stock** | Independent inventory    |
| **Store Settings**  | Individual configuration |
| **Stock Transfers** | Move between stores      |

### Integration Settings

| Integration           | Description        | Status     |
| --------------------- | ------------------ | ---------- |
| **WhatsApp Business** | API configuration  | ✅ Ready   |
| **SMS Gateway**       | Hubtel, Arkesel    | ✅ Ready   |
| **Paystack**          | Payment processing | ✅ Working |
| **Thermal Printers**  | ESC/POS printers   | ✅ Working |

---

## PWA & Offline Features

Warehouse POS works anywhere, even without internet.

### Offline Capabilities

| Feature               | Offline Support |
| --------------------- | --------------- |
| **Process Sales**     | ✅ Full support |
| **Manage Inventory**  | ✅ Full support |
| **Customer Lookup**   | ✅ Full support |
| **Print Receipts**    | ✅ Full support |
| **View Reports**      | ✅ Cached data  |
| **Create Orders**     | ✅ Full support |
| **Hold Transactions** | ✅ Full support |

### Sync Features

| Feature                 | Description            |
| ----------------------- | ---------------------- |
| **Background Sync**     | Automatic when online  |
| **Sync Queue**          | Ordered operation sync |
| **Conflict Resolution** | Server-wins strategy   |
| **Sync Status**         | Visual indicator       |
| **Manual Sync**         | Force sync button      |

### Installation

- **Mobile:** Add to Home Screen from Chrome
- **Desktop:** Install as desktop app
- **Works on:** Android, iOS, Windows, Mac, Linux

---

## Subscription Plans

### Plan Comparison

| Feature            | Free  | Starter | Growth  | Business |
| ------------------ | ----- | ------- | ------- | -------- |
| **Price (GHS/mo)** | 0     | 49      | 99      | 199      |
| **Products**       | 5     | 200     | 1,000   | 5,000    |
| **Sales/Month**    | 20    | 500     | 2,000   | 10,000   |
| **Staff Accounts** | 1     | 1       | 3       | 10       |
| **Locations**      | 1     | 1       | 1       | 3        |
| **WhatsApp/Day**   | 0     | 30      | 100     | 300      |
| **SMS/Day**        | 0     | 0       | 30      | 100      |
| **Report History** | 1 day | 14 days | 30 days | 90 days  |
| **Full POS**       | ❌    | ✅      | ✅      | ✅       |
| **Inventory**      | ❌    | ✅      | ✅      | ✅       |
| **Online Shop**    | ❌    | ✅      | ✅      | ✅       |
| **Profit Reports** | ❌    | ❌      | ✅      | ✅       |
| **Gift Cards**     | ❌    | ❌      | ✅      | ✅       |
| **Promo Codes**    | ❌    | ❌      | ✅      | ✅       |
| **Delivery**       | ❌    | ❌      | ❌      | ✅       |
| **AI Insights**    | ❌    | ❌      | ❌      | ✅       |

### Trial

- **7-day free trial** on Starter, Growth, Business plans
- No credit card required
- Full access during trial
- Automatic downgrade to Free if not subscribed

---

## Related Documentation

- [DELIVERY_FEATURES.md](./DELIVERY_FEATURES.md) - Detailed delivery module documentation
- [MARKETING_WEBSITE.md](./MARKETING_WEBSITE.md) - Marketing website documentation
- [DEVELOPMENT_ROADMAP.md](../DEVELOPMENT_ROADMAP.md) - Feature roadmap
- [COMPREHENSIVE_SYSTEM_AUDIT.md](../COMPREHENSIVE_SYSTEM_AUDIT.md) - System audit

---

_This document is maintained by the Warehouse POS development team._
