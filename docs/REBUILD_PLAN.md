# 🏗️ WAREHOUSEPOS - COMPLETE REBUILD PLAN

> **Date:** January 27, 2026  
> **Version:** 1.0  
> **Status:** PLANNING PHASE  
> **Objective:** Build a world-class POS system from scratch

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technical Stack (Simplified)](#2-technical-stack-simplified)
3. [Database Schema Design](#3-database-schema-design)
4. [Application Structure](#4-application-structure)
5. [Core Modules](#5-core-modules)
6. [Development Phases](#6-development-phases)
7. [API Design](#7-api-design)
8. [Authentication Strategy](#8-authentication-strategy)
9. [Offline-First Strategy](#9-offline-first-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Strategy](#11-deployment-strategy)

---

## 1. PROJECT OVERVIEW

### 1.1 What is WarehousePOS?

WarehousePOS is a **cloud-based Point of Sale and Inventory Management system** designed for small to medium businesses in Ghana and Nigeria. 

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Simple** | Do one thing well before adding more |
| **Reliable** | Working features only, no placeholders |
| **Fast** | Optimized for slow networks and old devices |
| **Offline-Ready** | Full functionality without internet |
| **Maintainable** | Clean code, good documentation |

### 1.3 Target MVP Features (Phase 1)

1. ✅ User Authentication (Email + Phone)
2. ✅ Product Management (CRUD)
3. ✅ Category Management
4. ✅ Stock Management
5. ✅ Point of Sale (Checkout)
6. ✅ Sales History
7. ✅ Customer Management
8. ✅ Basic Reports
9. ✅ Receipt Printing
10. ✅ Offline Mode

### 1.4 Future Features (Phase 2+)

- Multi-store support
- Advanced reporting
- Loyalty programs
- Online storefront
- Delivery tracking
- WhatsApp integration
- SMS notifications
- Multi-currency

---

## 2. TECHNICAL STACK (SIMPLIFIED)

### 2.1 Frontend

| Technology | Purpose | Why |
|------------|---------|-----|
| **React 19** | UI Framework | Latest, familiar, great ecosystem |
| **TypeScript** | Type Safety | Catch errors at compile time |
| **Vite** | Build Tool | Fast development, optimized builds |
| **TailwindCSS** | Styling | Rapid UI development |
| **Shadcn/ui** | Components | Beautiful, accessible, customizable |
| **TanStack Query** | Server State | Caching, refetching, mutations |
| **Zustand** | Client State | Simple, minimal boilerplate |
| **Dexie.js** | IndexedDB | Offline storage with good DX |
| **React Hook Form** | Forms | Performance, validation |
| **Zod** | Validation | Runtime type safety |

### 2.2 Backend

| Technology | Purpose | Why |
|------------|---------|-----|
| **Supabase** | Backend Platform | Auth, DB, Storage, Functions |
| **PostgreSQL** | Database | Reliable, feature-rich |
| **Edge Functions** | Serverless | For integrations (payments, SMS) |

### 2.3 Integrations

| Service | Purpose | Priority |
|---------|---------|----------|
| **Paystack** | Payments | Phase 1 |
| **mNotify** | SMS/OTP | Phase 1 |
| **WhatsApp API** | Messaging | Phase 2 |

### 2.4 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    REACT APP                             │   │
│   │                                                          │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│   │  │    Pages     │  │  Components  │  │    Hooks     │  │   │
│   │  └──────┬───────┘  └──────────────┘  └──────┬───────┘  │   │
│   │         │                                    │          │   │
│   │         └────────────────┬───────────────────┘          │   │
│   │                          │                               │   │
│   │  ┌───────────────────────┴───────────────────────────┐  │   │
│   │  │              TanStack Query                        │  │   │
│   │  │         (Caching, Refetching, Mutations)          │  │   │
│   │  └───────────────────────┬───────────────────────────┘  │   │
│   │                          │                               │   │
│   │  ┌───────────┐   ┌───────┴────────┐   ┌───────────┐    │   │
│   │  │  Zustand  │   │  API Service   │   │   Dexie   │    │   │
│   │  │ (UI State)│   │   (Queries)    │   │(IndexedDB)│    │   │
│   │  └───────────┘   └───────┬────────┘   └─────┬─────┘    │   │
│   │                          │                   │          │   │
│   └──────────────────────────┼───────────────────┼──────────┘   │
│                              │                   │               │
└──────────────────────────────┼───────────────────┼───────────────┘
                               │                   │
                    ┌──────────┴───────────────────┴──────────┐
                    │              NETWORK                     │
                    └──────────────────┬───────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────┐
│                          SUPABASE                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │    Auth    │  │  Database  │  │  Storage   │  │  Functions │ │
│  │            │  │ PostgreSQL │  │  (Images)  │  │   (Edge)   │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 3. DATABASE SCHEMA DESIGN

### 3.1 Design Principles

1. **Snake_case everywhere** - All columns use snake_case
2. **UUID for all IDs** - Universal unique identifiers
3. **Soft deletes** - Never hard delete, use `deleted_at`
4. **Audit trails** - `created_at`, `updated_at`, `created_by`
5. **Tenant isolation** - `tenant_id` on every table
6. **Explicit nullability** - Every column has NULL or NOT NULL

### 3.2 Core Tables

```sql
-- ============================================
-- WAREHOUSEPOS DATABASE SCHEMA V1.0
-- ============================================

-- TENANTS (Multi-tenant support)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    currency TEXT DEFAULT 'GHS',
    timezone TEXT DEFAULT 'Africa/Accra',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- USERS (Staff members)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE, -- Supabase auth.users.id
    email TEXT,
    phone TEXT,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'cashier', -- owner, manager, cashier
    pin_hash TEXT, -- For quick login
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- STORES (Locations/branches)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_main BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT DEFAULT 'piece', -- piece, kg, liter, etc.
    cost_price DECIMAL(12,2) DEFAULT 0,
    selling_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    track_stock BOOLEAN DEFAULT true,
    min_stock_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, sku)
);

-- STOCK LEVELS (Per store)
CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(store_id, product_id)
);

-- STOCK MOVEMENTS (Audit trail)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'transfer'
    quantity INTEGER NOT NULL,
    reference_type TEXT, -- 'sale', 'purchase', 'manual', 'transfer'
    reference_id UUID,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CUSTOMERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    credit_balance DECIMAL(12,2) DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- SALES
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    user_id UUID REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    sale_number TEXT NOT NULL,
    
    -- Items stored as JSONB array
    items JSONB NOT NULL DEFAULT '[]',
    
    -- Totals
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    discount_type TEXT, -- 'percentage', 'fixed'
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    
    -- Payment
    payment_method TEXT NOT NULL, -- 'cash', 'card', 'momo', 'credit'
    amount_paid DECIMAL(12,2) NOT NULL,
    change_given DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'voided', 'refunded'
    
    -- Metadata
    notes TEXT,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES users(id),
    void_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, sale_number)
);

-- EXPENSES
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    user_id UUID REFERENCES users(id),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    expense_date DATE DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- SUPPLIERS
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- PURCHASE ORDERS
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    supplier_id UUID REFERENCES suppliers(id),
    user_id UUID REFERENCES users(id),
    order_number TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'draft', -- 'draft', 'ordered', 'received', 'cancelled'
    notes TEXT,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, order_number)
);

-- SYNC QUEUE (For offline sync)
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- 'create', 'update', 'delete'
    record_id UUID NOT NULL,
    data JSONB NOT NULL,
    retries INTEGER DEFAULT 0,
    last_error TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Indexes

```sql
-- Essential indexes for performance
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX idx_stock_levels_tenant ON stock_levels(tenant_id);
CREATE INDEX idx_stock_levels_store ON stock_levels(store_id);
CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);

CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);
```

---

## 4. APPLICATION STRUCTURE

### 4.1 Folder Structure

```
WarehousePOS/
├── apps/
│   ├── marketing/              # Marketing website (already done)
│   │   └── src/
│   └── pos/                    # Main POS application
│       ├── public/
│       │   └── manifest.json
│       ├── src/
│       │   ├── api/            # API services (Supabase queries)
│       │   │   ├── products.ts
│       │   │   ├── sales.ts
│       │   │   ├── customers.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── components/     # Reusable UI components
│       │   │   ├── ui/         # Shadcn components
│       │   │   ├── forms/      # Form components
│       │   │   ├── tables/     # Table components
│       │   │   └── layout/     # Layout components
│       │   │
│       │   ├── features/       # Feature modules
│       │   │   ├── auth/
│       │   │   ├── pos/
│       │   │   ├── inventory/
│       │   │   ├── customers/
│       │   │   ├── sales/
│       │   │   ├── reports/
│       │   │   └── settings/
│       │   │
│       │   ├── hooks/          # Custom hooks
│       │   │   ├── useAuth.ts
│       │   │   ├── useProducts.ts
│       │   │   └── useSales.ts
│       │   │
│       │   ├── lib/            # Utilities
│       │   │   ├── supabase.ts
│       │   │   ├── db.ts       # Dexie setup
│       │   │   ├── sync.ts     # Sync logic
│       │   │   └── utils.ts
│       │   │
│       │   ├── stores/         # Zustand stores
│       │   │   ├── authStore.ts
│       │   │   ├── cartStore.ts
│       │   │   └── uiStore.ts
│       │   │
│       │   ├── types/          # TypeScript types
│       │   │   └── index.ts    # Generated from DB
│       │   │
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       │
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       └── vite.config.ts
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── send-otp/
│       └── process-payment/
│
├── docs/
│   ├── REBUILD_PLAN.md
│   ├── LESSONS_LEARNED.md
│   └── API_DOCS.md
│
└── README.md
```

### 4.2 Component Guidelines

```
MAX 200 LINES PER COMPONENT

Good:
- ProductCard.tsx (50 lines)
- ProductList.tsx (80 lines)
- ProductForm.tsx (150 lines)

Bad:
- ProductPage.tsx (800 lines) ❌
```

---

## 5. CORE MODULES

### 5.1 Authentication Module

**Features:**
- Email/password login
- Phone + OTP login
- PIN quick login (for staff)
- Session management
- Role-based access

**Files:**
```
features/auth/
├── LoginPage.tsx
├── components/
│   ├── EmailLoginForm.tsx
│   ├── PhoneLoginForm.tsx
│   └── PinPad.tsx
└── hooks/
    └── useAuth.ts
```

### 5.2 POS Module

**Features:**
- Product search/scan
- Shopping cart
- Customer selection
- Payment processing
- Receipt printing

**Files:**
```
features/pos/
├── POSPage.tsx
├── components/
│   ├── ProductGrid.tsx
│   ├── Cart.tsx
│   ├── CustomerSearch.tsx
│   ├── PaymentModal.tsx
│   └── Receipt.tsx
└── hooks/
    └── useCart.ts
```

### 5.3 Inventory Module

**Features:**
- Product CRUD
- Category management
- Stock levels
- Stock adjustments
- Low stock alerts

**Files:**
```
features/inventory/
├── ProductsPage.tsx
├── CategoriesPage.tsx
├── StockPage.tsx
├── components/
│   ├── ProductForm.tsx
│   ├── ProductTable.tsx
│   ├── CategoryForm.tsx
│   ├── StockAdjustmentModal.tsx
│   └── LowStockAlert.tsx
└── hooks/
    ├── useProducts.ts
    └── useStock.ts
```

### 5.4 Customers Module

**Features:**
- Customer CRUD
- Credit management
- Loyalty points
- Purchase history

**Files:**
```
features/customers/
├── CustomersPage.tsx
├── CustomerDetailPage.tsx
├── components/
│   ├── CustomerForm.tsx
│   ├── CustomerTable.tsx
│   ├── CreditHistory.tsx
│   └── PurchaseHistory.tsx
└── hooks/
    └── useCustomers.ts
```

### 5.5 Sales Module

**Features:**
- Sales history
- Sale details
- Refunds/voids
- Export

**Files:**
```
features/sales/
├── SalesPage.tsx
├── SaleDetailPage.tsx
├── components/
│   ├── SalesTable.tsx
│   ├── SaleReceipt.tsx
│   └── RefundModal.tsx
└── hooks/
    └── useSales.ts
```

### 5.6 Reports Module

**Features:**
- Daily summary
- Sales reports
- Inventory reports
- Profit reports

**Files:**
```
features/reports/
├── DashboardPage.tsx
├── SalesReportPage.tsx
├── InventoryReportPage.tsx
├── components/
│   ├── SalesSummaryCard.tsx
│   ├── SalesChart.tsx
│   ├── TopProductsTable.tsx
│   └── DateRangePicker.tsx
└── hooks/
    └── useReports.ts
```

---

## 6. DEVELOPMENT PHASES

### Phase 1: Foundation (Week 1-2)

| Task | Priority | Est. Time |
|------|----------|-----------|
| Setup Vite + React + TypeScript | HIGH | 1 day |
| Setup TailwindCSS + Shadcn/ui | HIGH | 1 day |
| Setup Supabase project | HIGH | 1 day |
| Create database schema | HIGH | 2 days |
| Setup authentication | HIGH | 2 days |
| Basic routing | HIGH | 1 day |
| Basic layout | HIGH | 1 day |

### Phase 2: Inventory (Week 3-4)

| Task | Priority | Est. Time |
|------|----------|-----------|
| Products CRUD | HIGH | 3 days |
| Categories CRUD | HIGH | 1 day |
| Stock levels | HIGH | 2 days |
| Stock adjustments | HIGH | 2 days |
| Product images | MEDIUM | 1 day |

### Phase 3: POS (Week 5-6)

| Task | Priority | Est. Time |
|------|----------|-----------|
| Product search | HIGH | 1 day |
| Shopping cart | HIGH | 2 days |
| Customer selection | HIGH | 1 day |
| Payment processing | HIGH | 2 days |
| Receipt printing | HIGH | 2 days |
| Hold/recall | MEDIUM | 1 day |

### Phase 4: Customers & Sales (Week 7-8)

| Task | Priority | Est. Time |
|------|----------|-----------|
| Customers CRUD | HIGH | 2 days |
| Sales history | HIGH | 2 days |
| Sale details | HIGH | 1 day |
| Basic reports | HIGH | 3 days |
| Dashboard | HIGH | 2 days |

### Phase 5: Offline & Polish (Week 9-10)

| Task | Priority | Est. Time |
|------|----------|-----------|
| IndexedDB setup | HIGH | 2 days |
| Sync logic | HIGH | 3 days |
| Error handling | HIGH | 2 days |
| Loading states | HIGH | 1 day |
| PWA setup | MEDIUM | 1 day |
| Testing | HIGH | 3 days |

---

## 7. API DESIGN

### 7.1 Query Pattern

```typescript
// api/products.ts
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

export const productsApi = {
  // Get all products for tenant
  getAll: async (tenantId: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id, name)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },
  
  // Get single product
  getById: async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id, name)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Create product
  create: async (product: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Update product
  update: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Delete (soft delete)
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },
};
```

### 7.2 React Query Pattern

```typescript
// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/products';
import { useAuth } from './useAuth';

export function useProducts() {
  const { tenantId } = useAuth();
  
  return useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => productsApi.getAll(tenantId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();
  
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });
}
```

---

## 8. AUTHENTICATION STRATEGY

### 8.1 Auth Flow

```
1. User enters email/phone
2. If email → password login
3. If phone → send OTP
4. On success → fetch tenant & user data
5. Store in Zustand + localStorage
6. Redirect to dashboard
```

### 8.2 Auth Store

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: (user: User, tenant: Tenant) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      isAuthenticated: false,
      login: (user, tenant) => set({ user, tenant, isAuthenticated: true }),
      logout: () => set({ user: null, tenant: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

---

## 9. OFFLINE-FIRST STRATEGY

### 9.1 Principles

1. **Read from local (IndexedDB) first**
2. **Write to local first, then sync to cloud**
3. **Queue failed syncs for retry**
4. **Show sync status to user**

### 9.2 Sync Flow

```
User creates sale:
1. Save to IndexedDB immediately
2. Add to sync queue
3. Show success to user
4. In background, push to Supabase
5. If fails, retry up to 3 times
6. If still fails, mark as failed and alert user
```

### 9.3 Simplified Sync Code

```typescript
// lib/sync.ts
export async function syncToCloud(item: SyncQueueItem): Promise<void> {
  const { table_name, operation, data, record_id } = item;
  
  try {
    if (operation === 'create' || operation === 'update') {
      const { error } = await supabase
        .from(table_name)
        .upsert(data, { onConflict: 'id' });
      
      if (error) throw error;
    } else if (operation === 'delete') {
      const { error } = await supabase
        .from(table_name)
        .delete()
        .eq('id', record_id);
      
      if (error) throw error;
    }
    
    // Remove from queue on success
    await db.syncQueue.delete(item.id);
    
  } catch (error) {
    // Increment retry count
    await db.syncQueue.update(item.id, {
      retries: item.retries + 1,
      last_error: error.message,
    });
    
    // Mark as failed after 3 retries
    if (item.retries >= 3) {
      await db.syncQueue.update(item.id, { status: 'failed' });
    }
    
    throw error;
  }
}
```

---

## 10. TESTING STRATEGY

### 10.1 Test Types

| Type | Coverage | Tools |
|------|----------|-------|
| Unit Tests | Business logic | Vitest |
| Component Tests | UI components | React Testing Library |
| E2E Tests | Critical flows | Playwright |

### 10.2 Critical Paths to Test

1. ✅ User login flow
2. ✅ Create product
3. ✅ POS checkout flow
4. ✅ Sale with multiple items
5. ✅ Apply discount
6. ✅ Process payment
7. ✅ Print receipt
8. ✅ Void sale
9. ✅ Offline sync

---

## 11. DEPLOYMENT STRATEGY

### 11.1 Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:5173 | Local development |
| Staging | staging.warehousepos.com | Pre-production testing |
| Production | app.warehousepos.com | Live users |

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - run: npm run deploy
```

---

## 📋 NEXT STEPS

1. [ ] Review this plan and approve
2. [ ] Create GitHub repo for WarehousePOS
3. [ ] Setup Supabase project
4. [ ] Create initial database migration
5. [ ] Setup frontend project
6. [ ] Begin Phase 1 development

---

> **Document maintained by:** Development Team  
> **Last updated:** January 27, 2026
