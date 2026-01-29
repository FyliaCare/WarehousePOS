# 🔐 WarehousePOS Configuration Guide

> Complete guide to all API keys, credentials, and configuration settings for WarehousePOS.

---

## 📋 Table of Contents

1. [Quick Start](#1-quick-start)
2. [Supabase (Database & Auth)](#2-supabase-database--auth)
3. [Paystack (Payments)](#3-paystack-payments)
4. [mNotify (Ghana SMS)](#4-mnotify-ghana-sms)
5. [Termii (Nigeria SMS)](#5-termii-nigeria-sms)
6. [WhatsApp Business API](#6-whatsapp-business-api)
7. [Cloudinary (Image Storage)](#7-cloudinary-image-storage)
8. [Security Settings](#8-security-settings)
9. [Feature Flags](#9-feature-flags)
10. [Monitoring & Analytics](#10-monitoring--analytics)
11. [Development Settings](#11-development-settings)
12. [Environment Files](#12-environment-files)

---

## 1. Quick Start

```bash
# 1. Copy the example env file
cp .env.example .env

# 2. Fill in your credentials (see sections below)

# 3. Start development
pnpm dev
```

---

## 2. Supabase (Database & Auth)

### Where to Get
🔗 **Dashboard**: https://supabase.com/dashboard

### Required Keys

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Project URL | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Public API key (safe for frontend) | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (server-side ONLY) | Settings → API → service_role |
| `SUPABASE_JWT_SECRET` | For custom JWT validation | Settings → API → JWT Secret |
| `DATABASE_URL` | Direct PostgreSQL connection | Settings → Database → URI |

### Example Values

```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.xxxxx
DATABASE_URL=postgresql://postgres:your-password@db.abcdefghijk.supabase.co:5432/postgres
```

### Setup Steps

1. Create account at https://supabase.com
2. Create new project
3. Wait for project to initialize (~2 minutes)
4. Go to **Settings** → **API**
5. Copy the required keys

---

## 3. Paystack (Payments)

### Where to Get
🔗 **Dashboard**: https://dashboard.paystack.com

### Supported Countries
- 🇬🇭 Ghana (GHS)
- 🇳🇬 Nigeria (NGN)

### Required Keys

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `PAYSTACK_PUBLIC_KEY` | Frontend payments | Settings → API Keys → Public Key |
| `PAYSTACK_SECRET_KEY` | Backend verification | Settings → API Keys → Secret Key |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook validation | Settings → Webhooks |

### Example Values

```env
# Test Mode
PAYSTACK_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Live Mode (Production)
PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY_HERE
PAYSTACK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

### Setup Steps

1. Create account at https://paystack.com
2. Complete business verification
3. Go to **Settings** → **API Keys & Webhooks**
4. Copy test keys for development
5. Set up webhook URL: `https://your-domain.com/api/webhooks/paystack`

### Webhook Events to Enable

- `charge.success`
- `transfer.success`
- `transfer.failed`
- `subscription.create`
- `subscription.disable`
- `invoice.payment_failed`

---

## 4. mNotify (Ghana SMS 🇬🇭)

### Where to Get
🔗 **Dashboard**: https://apps.mnotify.com

### Required Keys

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `MNOTIFY_API_KEY` | API authentication | Settings → API Keys |
| `MNOTIFY_SENDER_ID` | SMS sender name | Sender IDs → Approved IDs |

### Example Values

```env
MNOTIFY_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
MNOTIFY_SENDER_ID=WarehousePOS
```

### Setup Steps

1. Create account at https://apps.mnotify.com
2. Verify your account (ID required)
3. Buy SMS credits
4. Create/register Sender ID (requires approval, 24-48 hours)
5. Go to **Settings** → **API Keys**
6. Generate new API key

### Pricing (Approximate)

| Package | Cost (GHS) | SMS Count |
|---------|------------|-----------|
| Starter | 50 | ~500 |
| Business | 200 | ~2,200 |
| Enterprise | 500 | ~5,800 |

### Usage Code

```typescript
// lib/sms/mnotify.ts
const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY;
const MNOTIFY_SENDER_ID = process.env.MNOTIFY_SENDER_ID;

export async function sendSMS_Ghana(phone: string, message: string) {
  const response = await fetch('https://apps.mnotify.net/smsapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: MNOTIFY_API_KEY,
      to: phone,
      msg: message,
      sender_id: MNOTIFY_SENDER_ID,
    }),
  });
  return response.json();
}
```

---

## 5. Termii (Nigeria SMS 🇳🇬)

### Where to Get
🔗 **Dashboard**: https://accounts.termii.com

### Required Keys

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `TERMII_API_KEY` | API authentication | Settings → API Key |
| `TERMII_SENDER_ID` | SMS sender name | Messaging → Sender ID |
| `TERMII_SECRET_KEY` | Webhook verification | Settings → Webhook |

### Example Values

```env
TERMII_API_KEY=TL_YOUR_API_KEY_HERE
TERMII_SENDER_ID=WarehousePOS
TERMII_SECRET_KEY=YOUR_SECRET_KEY_HERE
```

### Setup Steps

1. Create account at https://accounts.termii.com
2. Verify business (CAC document required for Nigeria)
3. Buy SMS credits
4. Register Sender ID (DND route requires approval)
5. Go to **Settings** → **API Key**
6. Copy your API key

### Pricing (Approximate)

| Route | Cost per SMS (NGN) | Notes |
|-------|-------------------|-------|
| Generic | 2.5 | May not reach DND numbers |
| DND | 4.0 | Reaches all numbers |

### Usage Code

```typescript
// lib/sms/termii.ts
const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID;

export async function sendSMS_Nigeria(phone: string, message: string) {
  const response = await fetch('https://api.ng.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TERMII_API_KEY,
      to: phone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'dnd', // or 'generic'
    }),
  });
  return response.json();
}
```

---

## 6. WhatsApp Business API

### Where to Get
🔗 **Dashboard**: https://developers.facebook.com

### Required Keys

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp number ID | WhatsApp → Phone Numbers |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Business account ID | WhatsApp → Overview |
| `WHATSAPP_ACCESS_TOKEN` | API token | WhatsApp → Configuration |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Custom string for webhook | You create this |
| `WHATSAPP_APP_SECRET` | For signature validation | App Settings → Basic |

### Example Values

```env
WHATSAPP_PHONE_NUMBER_ID=109876543210987
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBAKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=my-custom-verify-token-12345
WHATSAPP_APP_SECRET=abcdef1234567890abcdef1234567890
```

### Setup Steps

1. Create Meta Developer account
2. Create a new app (Business type)
3. Add WhatsApp product to your app
4. Set up a test phone number (free for testing)
5. For production: Apply for WhatsApp Business API access
6. Create message templates for delivery updates

### Message Templates Required

| Template Name | Purpose | Example |
|---------------|---------|---------|
| `order_confirmation` | New order | "Your order #{{1}} has been confirmed. Total: {{2}}" |
| `delivery_update` | Status change | "Your order #{{1}} is now {{2}}. Track: {{3}}" |
| `delivery_complete` | Delivered | "Your order #{{1}} has been delivered. Thank you!" |
| `otp_verification` | OTP codes | "Your WarehousePOS code is {{1}}. Valid for 10 minutes." |

### Usage Code

```typescript
// lib/whatsapp/client.ts
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function sendWhatsAppMessage(to: string, templateName: string, params: string[]) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [{
            type: 'body',
            parameters: params.map(p => ({ type: 'text', text: p })),
          }],
        },
      }),
    }
  );
  return response.json();
}
```

---

## 7. Cloudinary (Image Storage)

### Where to Get
🔗 **Dashboard**: https://cloudinary.com/console

### Required Keys

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | Dashboard → Cloud name |
| `CLOUDINARY_API_KEY` | API key | Dashboard → API Key |
| `CLOUDINARY_API_SECRET` | API secret | Dashboard → API Secret |

### Example Values

```env
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
```

### Setup Steps

1. Create account at https://cloudinary.com
2. Go to Dashboard
3. Copy your cloud name, API key, and API secret
4. (Optional) Create upload presets for different image types

### Upload Presets to Create

| Preset Name | Purpose | Settings |
|-------------|---------|----------|
| `product_images` | Product photos | Max 2MB, auto-format, auto-quality |
| `profile_photos` | User avatars | Max 500KB, crop to square |
| `receipts` | Receipt images | Max 5MB, PDF allowed |

---

## 8. Security Settings

### Required Keys

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `JWT_SECRET` | Token signing | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Data encryption | `openssl rand -hex 32` |
| `SESSION_SECRET` | Session management | `openssl rand -base64 32` |

### Example Values

```env
JWT_SECRET=Kj9mN2xQp4rT7wY1bC5vF8hL3sD6gA0eU
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4
SESSION_SECRET=Xm7pQ2nR5tW8yB1vC4fH6jL9sD3gA0eU
```

### Generate Commands (PowerShell)

```powershell
# Generate random secrets
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 9. Feature Flags

Control which features are enabled:

```env
# Notifications
ENABLE_WHATSAPP_NOTIFICATIONS=true   # Send WhatsApp delivery updates
ENABLE_SMS_NOTIFICATIONS=true        # Send SMS OTPs
ENABLE_EMAIL_NOTIFICATIONS=false     # Email (not primary channel)

# Features
ENABLE_OFFLINE_MODE=true             # Allow offline POS operation
ENABLE_DELIVERY_TRACKING=true        # Real-time rider tracking
ENABLE_INVENTORY_ALERTS=true         # Low stock notifications
ENABLE_MULTI_STORE=true              # Multiple store locations
```

---

## 10. Monitoring & Analytics

### Sentry (Error Tracking)
🔗 https://sentry.io

```env
SENTRY_DSN=https://xxxxxxx@o123456.ingest.sentry.io/1234567
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=warehousepos
```

### Plausible (Privacy-friendly Analytics)
🔗 https://plausible.io

```env
PLAUSIBLE_DOMAIN=warehousepos.com
PLAUSIBLE_API_KEY=your-api-key
```

### LogRocket (Session Replay - Optional)
🔗 https://logrocket.com

```env
LOGROCKET_APP_ID=your-org/warehousepos
```

---

## 11. Development Settings

```env
# Environment
NODE_ENV=development

# Bypass SMS in development (OTPs printed to console)
DEV_BYPASS_SMS=true
DEV_DEFAULT_OTP=123456

# Local URLs
VITE_APP_URL=http://localhost:5173
VITE_POS_URL=http://localhost:5174
VITE_DELIVERY_URL=http://localhost:5175
VITE_PORTAL_URL=http://localhost:5176
VITE_ADMIN_URL=http://localhost:5177

# Rate limiting (relaxed for dev)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## 12. Environment Files

### File Structure

```
WarehousePOS/
├── .env.example          # Template (committed to git)
├── .env                  # Local development (NEVER commit!)
├── .env.production       # Production values (NEVER commit!)
├── .env.staging          # Staging values (NEVER commit!)
└── apps/
    ├── pos/.env          # POS-specific overrides
    ├── delivery/.env     # Delivery-specific overrides
    ├── portal/.env       # Portal-specific overrides
    └── admin/.env        # Admin-specific overrides
```

### .gitignore (Important!)

```gitignore
# Environment files - NEVER commit these!
.env
.env.local
.env.production
.env.staging
*.env

# Keep the example
!.env.example
```

---

## 📋 Complete .env.example

```env
# ============================================
# WAREHOUSEPOS - COMPLETE CONFIGURATION
# ============================================

# === APPLICATION ===
NODE_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_POS_URL=http://localhost:5174
VITE_DELIVERY_URL=http://localhost:5175
VITE_PORTAL_URL=http://localhost:5176
VITE_ADMIN_URL=http://localhost:5177

# === SUPABASE ===
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# === PAYSTACK (Ghana & Nigeria) ===
PAYSTACK_PUBLIC_KEY=pk_test_YOUR_KEY
PAYSTACK_SECRET_KEY=YOUR_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET=whsec_xxx

# === MNOTIFY (Ghana SMS 🇬🇭) ===
MNOTIFY_API_KEY=your-api-key
MNOTIFY_SENDER_ID=WarehousePOS

# === TERMII (Nigeria SMS 🇳🇬) ===
TERMII_API_KEY=your-api-key
TERMII_SENDER_ID=WarehousePOS
TERMII_SECRET_KEY=your-secret-key

# === WHATSAPP BUSINESS API ===
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
WHATSAPP_APP_SECRET=your-app-secret

# === CLOUDINARY (Images) ===
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=your-api-secret

# === SECURITY ===
JWT_SECRET=generate-with-openssl-rand-base64-32
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
SESSION_SECRET=generate-with-openssl-rand-base64-32

# === OTP SETTINGS ===
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
PIN_MAX_ATTEMPTS=5
PIN_LOCKOUT_MINUTES=15

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# === FEATURE FLAGS ===
ENABLE_WHATSAPP_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_OFFLINE_MODE=true
ENABLE_DELIVERY_TRACKING=true

# === MONITORING ===
SENTRY_DSN=https://xxx@sentry.io/xxx
PLAUSIBLE_DOMAIN=warehousepos.com

# === DEVELOPMENT ONLY ===
DEV_BYPASS_SMS=false
DEV_DEFAULT_OTP=123456
```

---

## 🚨 Security Reminders

1. **NEVER** commit `.env` files to git
2. **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend
3. **NEVER** expose `PAYSTACK_SECRET_KEY` to the frontend
4. **ALWAYS** use environment variables, never hardcode secrets
5. **ROTATE** API keys if they are ever exposed
6. **USE** different keys for development and production

---

## 📞 Support Links

| Service | Documentation | Support |
|---------|---------------|---------|
| Supabase | https://supabase.com/docs | Discord: https://discord.supabase.com |
| Paystack | https://paystack.com/docs | Email: support@paystack.com |
| mNotify | https://docs.mnotify.com | Email: support@mnotify.com |
| Termii | https://developers.termii.com | Email: support@termii.com |
| WhatsApp | https://developers.facebook.com/docs/whatsapp | Business Help Center |
| Cloudinary | https://cloudinary.com/documentation | Support Portal |

---

*Last updated: January 2026*
