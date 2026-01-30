# 🔧 REQUIRED SUPABASE SECRETS - MUST SET THESE!

Your Edge Functions will fail without these secrets configured.

## Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets

### REQUIRED SECRETS:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://azbheakmjwtslgmeuioj.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (NOT anon key!) | `eyJhbGciOiJIUzI1...` |
| `MNOTIFY_API_KEY` | mNotify API key for Ghana SMS | `your-mnotify-key` |
| `MNOTIFY_SENDER_ID` | mNotify sender name | `WarehousePos` |
| `TERMII_API_KEY` | Termii API key for Nigeria SMS | `your-termii-key` |
| `TERMII_SENDER_ID` | Termii sender name | `WarehousePos` |
| `OTP_SECRET` | Random string for OTP hashing | `any-random-string-here-123` |
| `ENVIRONMENT` | **CRITICAL!** Set to `production` | `production` |

## ⚠️ CRITICAL: ENVIRONMENT Secret

If `ENVIRONMENT` is not set to `production`, OTP verification is SKIPPED!

```
ENVIRONMENT=production
```

## How to Get API Keys:

### mNotify (Ghana)
1. Go to https://mnotify.com
2. Sign up / Login
3. Go to Settings → API Keys
4. Copy your API key

### Termii (Nigeria)
1. Go to https://termii.com
2. Sign up / Login  
3. Go to Dashboard → API Keys
4. Copy your API key

## Verify Secrets Are Set

After setting secrets, you can check Edge Function logs:
1. Go to Supabase Dashboard → Edge Functions → `phone-otp-send`
2. Click "Logs"
3. Look for: `Creating Supabase client with URL: ...`
4. It should show the URL and `Service role key exists: true`

## Common Issues

### "Missing required environment variable"
→ Secret not set. Go add it.

### "Service role key exists: false"
→ `SUPABASE_SERVICE_ROLE_KEY` not set correctly

### OTP verification always succeeds (bypassed)
→ `ENVIRONMENT` not set to `production`

### SMS not being sent
→ `MNOTIFY_API_KEY` or `TERMII_API_KEY` not set
