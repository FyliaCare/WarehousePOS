# Phone Authentication Setup Guide
## Using Supabase Native Phone Auth + mNotify/Termii

This guide explains how to set up phone authentication the **correct way** using Supabase's built-in phone auth with a custom SMS Hook for mNotify (Ghana) and Termii (Nigeria).

## Why This Approach?

**Before (Complex - What We Had):**
- Custom Edge Functions for OTP send/verify
- Manual OTP table and rate limiting
- Email/password workaround for sessions
- Database triggers causing issues

**After (Simple - Supabase Native):**
- `signInWithOtp({ phone })` → Supabase handles everything
- SMS Hook sends via mNotify/Termii
- `verifyOtp({ phone, token, type: 'sms' })` → Session created!
- No custom OTP tables, no workarounds

---

## Step 1: Enable Phone Auth in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Phone** provider and enable it
3. Settings:
   - **Enable Phone Sign-ups**: ON
   - **SMS Provider**: Select "Hook" (we'll configure our own)
   - **OTP Expiry**: 300 seconds (5 minutes)
   - **OTP Length**: 6

---

## Step 2: Deploy the SMS Hook Edge Function

### 2.1 Set Environment Variables

In Supabase Dashboard → Edge Functions → Settings, add:

```
MNOTIFY_API_KEY=your_mnotify_api_key
MNOTIFY_SENDER_ID=WarePOS
TERMII_API_KEY=your_termii_api_key  
TERMII_SENDER_ID=WarePOS
```

### 2.2 Deploy the Function

```bash
cd /path/to/WarehousePOS
supabase functions deploy sms-hook --no-verify-jwt
```

**Important:** The `--no-verify-jwt` flag is required because Supabase Auth calls the hook internally without a JWT.

---

## Step 3: Configure the SMS Hook in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Hooks**
2. Click **Add Hook** for "Send SMS"
3. Select **HTTP Request**
4. Configure:
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/sms-hook`
   - **HTTP Method**: POST
   - **Headers**: 
     ```json
     {
       "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
       "Content-Type": "application/json"
     }
     ```
5. Click **Enable Hook**

---

## Step 4: Update Client Code

Replace the old auth service with the new native one:

```typescript
// OLD - Don't use
import { sendOTP, verifyOTP } from '@/lib/supabase-auth';

// NEW - Use this
import { sendOTP, verifyOTP } from '@/lib/phone-auth-native';
```

### Usage Example

```typescript
// Send OTP
const result = await sendOTP('0241234567', 'GH');
if (!result.success) {
  console.error(result.error);
  return;
}

// Verify OTP (after user enters code)
const verifyResult = await verifyOTP('0241234567', 'GH', '123456');
if (verifyResult.success) {
  console.log('User authenticated!', verifyResult.user);
  // Session is automatically set
} else {
  console.error(verifyResult.error);
}
```

---

## Step 5: Simplify Database (Optional Cleanup)

You can remove the old custom OTP infrastructure:

```sql
-- Remove old OTP table (Supabase manages OTPs internally)
DROP TABLE IF EXISTS phone_otps;

-- Remove old trigger (simplified version already deployed)
-- The simple trigger only saves phone_users mapping

-- Keep phone_users for quick lookups
-- This is still useful for app-level phone→user mapping
```

---

## How It Works

### Flow Diagram

```
User enters phone
       │
       ▼
┌──────────────────────┐
│ supabase.auth        │
│ .signInWithOtp({     │
│   phone: '+233...'   │
│ })                   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Supabase Auth        │
│ - Generates OTP      │
│ - Stores internally  │
│ - Rate limits        │
│ - Calls SMS Hook     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ sms-hook (Edge Fn)   │
│ - Detects country    │
│ - Ghana → mNotify    │
│ - Nigeria → Termii   │
│ - Returns success    │
└──────────┬───────────┘
           │
           ▼
     User receives SMS
           │
           ▼
User enters OTP code
           │
           ▼
┌──────────────────────┐
│ supabase.auth        │
│ .verifyOtp({         │
│   phone, token,      │
│   type: 'sms'        │
│ })                   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Supabase Auth        │
│ - Verifies OTP       │
│ - Creates user if    │
│   new                │
│ - Returns session    │
└──────────┬───────────┘
           │
           ▼
     User logged in! ✅
```

---

## Testing

### Test Locally

For local development, you can:

1. Set `ENVIRONMENT=development` in your `.env`
2. The SMS Hook will log the OTP instead of sending it
3. Or use Supabase's test phone numbers

### Production Testing

1. Use a real phone number
2. Check Supabase logs: **Dashboard** → **Logs** → **Edge Functions**
3. Check Auth logs: **Dashboard** → **Authentication** → **Logs**

---

## Troubleshooting

### "Phone signups are disabled"
→ Enable Phone provider in Auth settings

### "Too many requests"
→ Rate limit hit (1 OTP per 60 seconds by default)

### SMS not received
1. Check Edge Function logs
2. Verify mNotify/Termii API keys
3. Check phone number format (+233... or +234...)

### "Invalid OTP"
→ OTP expired (5 min) or wrong code

### Session not persisting
→ Check `supabase.auth.getSession()` after verify

---

## API Keys

### mNotify (Ghana)
- Sign up: https://mnotify.com
- Get API key from dashboard
- Verify sender ID is approved

### Termii (Nigeria)  
- Sign up: https://termii.com
- Get API key from dashboard
- Register sender ID

---

## Security Notes

1. **Service Role Key**: Only used server-side (Edge Functions)
2. **Anon Key**: Used in client-side code
3. **SMS Hook**: Requires auth header for security
4. **Rate Limiting**: Built into Supabase Auth
5. **OTP Storage**: Handled by Supabase (not in your database)
