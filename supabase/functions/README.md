# Supabase Edge Functions

This directory contains all Supabase Edge Functions for the WarehousePOS platform.

## Functions Overview

### Authentication
- **send-rider-otp** - Send OTP to rider's phone for authentication
- **verify-rider-otp** - Verify OTP and return rider session

### SMS & Notifications
- **send-sms** - Send SMS via mNotify (Ghana) or Termii (Nigeria)
- **send-whatsapp** - Send WhatsApp messages via Meta Business API

### Payments
- **process-payment** - Initialize Paystack payment
- **verify-payment** - Verify Paystack transaction status
- **paystack-webhook** - Handle Paystack webhook events

### Orders & Deliveries
- **create-order** - Create order from customer portal
- **assign-delivery** - Assign delivery to a rider
- **update-delivery-status** - Update delivery status and notify customer
- **generate-receipt** - Generate receipt HTML for an order

### Reports & Alerts
- **low-stock-alert** - Check for low stock products and send alerts
- **daily-summary** - Generate and send daily sales summary

## Deployment

Deploy all functions:
```bash
supabase functions deploy
```

Deploy specific function:
```bash
supabase functions deploy send-sms
```

## Environment Variables

Set the following secrets in Supabase:

```bash
# SMS Providers
supabase secrets set MNOTIFY_API_KEY=your-key
supabase secrets set MNOTIFY_SENDER_ID=WarehousePOS
supabase secrets set TERMII_API_KEY=your-key
supabase secrets set TERMII_SENDER_ID=WarehousePOS

# Paystack
supabase secrets set PAYSTACK_SECRET_KEY_GH=sk_live_xxx
supabase secrets set PAYSTACK_SECRET_KEY_NG=sk_live_xxx

# WhatsApp (optional)
supabase secrets set WHATSAPP_ACCESS_TOKEN=your-token
supabase secrets set WHATSAPP_PHONE_NUMBER_ID_GH=your-id
supabase secrets set WHATSAPP_PHONE_NUMBER_ID_NG=your-id
```

## Testing Locally

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-sms' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to": "+233201234567", "message": "Test", "country": "GH"}'
```

## Scheduled Functions

The following functions should be scheduled via Supabase cron:

- **daily-summary** - Run daily at midnight
- **low-stock-alert** - Run every 6 hours

Set up cron jobs in Supabase Dashboard > Database > Extensions > pg_cron
