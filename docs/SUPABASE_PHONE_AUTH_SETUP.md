# Supabase Phone Auth Setup Guide

This document explains how to set up Phone Authentication for WarehousePOS using custom OTP via mNotify (Ghana 🇬🇭) and Termii (Nigeria 🇳🇬).

## Overview

WarehousePOS uses a **custom OTP flow** with local SMS providers for cost-effective authentication while maintaining Supabase Auth security:

- **mNotify**: Ghana SMS provider (~₵0.04/SMS vs Twilio's ~₵0.75/SMS)
- **Termii**: Nigeria SMS provider (competitive local rates)
- **Supabase Auth**: JWT sessions, auto-refresh tokens, RLS policies

### Why Custom OTP?

Supabase only natively supports Twilio, MessageBird, and Vonage which are:
- **Expensive**: 15-20x more costly than local providers
- **Not optimized**: For Ghana/Nigeria markets

Our approach uses Edge Functions to:
1. Generate and store OTPs securely
2. Send via local SMS providers (mNotify/Termii)
3. Create `auth.users` on verification → JWT sessions work normally
4. All RLS policies using `auth.uid()` continue to work

## Prerequisites

1. Supabase project (create one at [supabase.com](https://supabase.com))
2. **mNotify account** (for Ghana): [mnotify.com](https://mnotify.com)
3. **Termii account** (for Nigeria): [termii.com](https://termii.com)

## Step 1: Run Database Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `database/migrate-to-supabase-auth.sql`
4. Run the SQL script

This migration will:
- Create/update the `users` table with proper `auth.users` foreign key
- Create `phone_otps` table for OTP storage
- Set up RLS policies for multi-tenant isolation
- Create helper functions and cleanup jobs

## Step 2: Deploy Edge Functions

Deploy the OTP Edge Functions to Supabase:

```bash
# From the project root
cd supabase/functions

# Deploy phone-otp-send
supabase functions deploy phone-otp-send --no-verify-jwt

# Deploy phone-otp-verify  
supabase functions deploy phone-otp-verify --no-verify-jwt
```

## Step 3: Configure Environment Variables

In Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**:

### Required Secrets

```env
# OTP Security
OTP_SECRET=your-secure-random-string-min-32-chars

# mNotify (Ghana 🇬🇭)
MNOTIFY_API_KEY=your-mnotify-api-key
MNOTIFY_SENDER_ID=WarehousePOS

# Termii (Nigeria 🇳🇬)
TERMII_API_KEY=your-termii-api-key
TERMII_SENDER_ID=WarehousePOS

# Development Mode (optional)
ENVIRONMENT=development
```

### Getting API Keys

#### mNotify (Ghana)
1. Create account at [mnotify.com](https://mnotify.com)
2. Go to **Dashboard** → **API Keys**
3. Generate a new API key
4. Register a Sender ID (requires approval, ~24 hours)
5. Load SMS credits

#### Termii (Nigeria)
1. Create account at [termii.com](https://termii.com)
2. Go to **Settings** → **API Keys**
3. Copy your API key
4. Register a Sender ID
5. Load SMS credits

## Step 4: Test the Setup

### Development Mode

When `ENVIRONMENT=development`:
- OTPs are returned in the API response (shown in UI)
- SMS is NOT sent (saves credits)
- Use the displayed OTP to complete verification

### Production Mode

When `ENVIRONMENT=production`:
- OTPs are sent via SMS
- Never displayed in response
- Full security measures active

## Architecture

### Authentication Flow

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Phone     │────►│  phone-otp-send │────►│  mNotify/Termii │
│   Entry     │     │  (Edge Function)│     │   (SMS sent)    │
└─────────────┘     └────────┬────────┘     └─────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  phone_otps    │
                    │  (DB table)    │
                    │  - otp_hash    │
                    │  - expires_at  │
                    │  - attempts    │
                    └────────────────┘
                             │
                             ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Enter     │────►│ phone-otp-verify│────►│   auth.users    │
│   OTP       │     │ (Edge Function) │     │   (created)     │
└─────────────┘     └────────┬────────┘     └─────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  JWT Session   │
                    │  Created       │
                    │  (normal flow) │
                    └────────────────┘
```

### Security Features

1. **OTP Hashing**: OTPs stored as SHA-256 hash with secret
2. **Rate Limiting**: Max 1 OTP per 60 seconds per phone
3. **Expiry**: OTPs expire after 5 minutes
4. **Attempt Limiting**: Max 5 verification attempts
5. **Auto Cleanup**: Expired OTPs deleted every 15 minutes

### Database Structure

```
auth.users (Supabase managed - created by Edge Function)
    │
    ├──► public.users (1:1 relationship)
    │        │
    │        ├──► tenants (business/organization)
    │        │
    │        └──► stores (physical locations)
    │
    └──► JWT contains: user_id, phone
```

## Cost Comparison

| Provider | Ghana (per SMS) | Nigeria (per SMS) |
|----------|-----------------|-------------------|
| mNotify  | ~₵0.04          | N/A               |
| Termii   | N/A             | ~₦3-4             |
| Twilio   | ~₵0.75          | ~₦50+             |

**Savings**: 15-20x cheaper with local providers!

## Troubleshooting

### "Rate limit - please wait"

- Users must wait 60 seconds between OTP requests
- This prevents SMS spam and abuse

### "Invalid or expired code"

- OTPs expire after 5 minutes
- Maximum 5 verification attempts allowed
- Request a new OTP if expired

### "SMS not delivered"

1. Check mNotify/Termii dashboard for delivery status
2. Verify phone number format (+233XXXXXXXXX or +234XXXXXXXXXX)
3. Ensure account has sufficient credits
4. Check Edge Function logs in Supabase Dashboard

### "Edge Function error"

1. Go to Supabase Dashboard → **Edge Functions** → **Logs**
2. Check for missing environment variables
3. Verify function is deployed correctly

### "User created but no profile"

This happens when:
1. Auth user created in `auth.users`
2. But registration not completed (no `public.users` record)

The app handles this by redirecting to registration page to complete profile setup.

## Security Considerations

1. **OTP_SECRET**: Use a strong random string (32+ chars)
2. **HTTPS**: Always use in production
3. **Rate Limiting**: Built into Edge Functions
4. **OTP Expiry**: Prevents replay attacks
5. **Hash Storage**: OTPs never stored in plain text
6. **RLS Policies**: Enforce tenant isolation via `auth.uid()`

## Environment Variables

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Functions (Supabase Secrets)

```env
OTP_SECRET=your-secure-random-string
MNOTIFY_API_KEY=your-mnotify-key
MNOTIFY_SENDER_ID=WarehousePOS
TERMII_API_KEY=your-termii-key
TERMII_SENDER_ID=WarehousePOS
ENVIRONMENT=development  # or production
```

## Files Modified/Created

### Edge Functions (NEW)
- `supabase/functions/phone-otp-send/index.ts` - Generate & send OTP
- `supabase/functions/phone-otp-verify/index.ts` - Verify OTP & create session

### Auth Service
- `apps/pos/src/lib/supabase-auth.ts` - Calls Edge Functions

### Auth Pages
- `apps/pos/src/pages/auth/LoginPage.tsx` - Login UI with devOTP
- `apps/pos/src/pages/auth/RegisterPage.tsx` - Registration UI with devOTP

### Database
- `database/migrate-to-supabase-auth.sql` - Migration with phone_otps table

## Deployment Checklist

- [ ] Run database migration
- [ ] Deploy phone-otp-send Edge Function
- [ ] Deploy phone-otp-verify Edge Function
- [ ] Set OTP_SECRET in Supabase secrets
- [ ] Set MNOTIFY_API_KEY and MNOTIFY_SENDER_ID
- [ ] Set TERMII_API_KEY and TERMII_SENDER_ID
- [ ] Set ENVIRONMENT to 'production'
- [ ] Test with real phone numbers
- [ ] Load SMS credits in provider accounts

## Support

- **mNotify**: [mnotify.com/support](https://mnotify.com)
- **Termii**: [termii.com/support](https://termii.com)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
