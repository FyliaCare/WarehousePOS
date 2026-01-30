# Quick Fix: Supabase Phone Auth with mNotify/Termii

## The Problem

Your current setup bypasses Supabase Auth and manages OTPs manually via Edge Functions. This causes:
- Complex user creation flow
- Session management issues  
- Database trigger problems

## The Solution

Use Supabase's **native phone auth** with a **Send SMS Hook** that calls mNotify/Termii.

---

## Quick Setup Steps

### 1. Enable Phone Auth (Dashboard)

Go to: **Authentication** → **Providers** → **Phone**

Enable these settings:
- ✅ Enable Phone provider
- ✅ Enable phone sign-ups
- SMS Provider: **Hook** (not Twilio/etc)

### 2. Deploy SMS Hook

```bash
supabase functions deploy sms-hook --no-verify-jwt
```

### 3. Configure SMS Hook (Dashboard)

Go to: **Authentication** → **Hooks** → **Send SMS** → Add Hook

- Type: **HTTP Endpoint**
- URL: `https://azbheakmjwtslgmeuioj.supabase.co/functions/v1/sms-hook`
- Method: POST
- Headers:
  ```
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  Content-Type: application/json
  ```

### 4. Set Edge Function Secrets

```bash
supabase secrets set MNOTIFY_API_KEY=your_key
supabase secrets set MNOTIFY_SENDER_ID=WarePOS
supabase secrets set TERMII_API_KEY=your_key
supabase secrets set TERMII_SENDER_ID=WarePOS
```

### 5. Update Client Code

Change import in LoginPage.tsx:
```tsx
// From
import { sendOTP, verifyOTP } from '@/lib/supabase-auth';

// To
import { sendOTP, verifyOTP } from '@/lib/phone-auth-native';
```

### 6. Test

1. Go to https://warehouse-pos-zeta.vercel.app/login
2. Enter Ghana phone number
3. You should receive SMS via mNotify
4. Enter OTP
5. You're logged in!

---

## Why This Works

| Old Approach | New Approach |
|--------------|--------------|
| Edge Function generates OTP | Supabase generates OTP |
| Manual OTP table | Supabase manages internally |
| `admin.createUser` | Supabase creates on verify |
| Email/password session hack | Native phone session |
| Database triggers break | No triggers needed |

---

## Files Created

1. `supabase/functions/sms-hook/index.ts` - HTTP hook that sends SMS
2. `apps/pos/src/lib/phone-auth-native.ts` - Simplified client auth
3. `docs/PHONE_AUTH_SETUP.md` - Detailed setup guide
