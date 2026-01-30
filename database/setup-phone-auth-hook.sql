-- ============================================
-- SUPABASE PHONE AUTH WITH CUSTOM SMS HOOK
-- The PROPER way to do phone auth with mNotify/Termii
-- ============================================
-- 
-- How this works:
-- 1. Client calls supabase.auth.signInWithOtp({ phone })
-- 2. Supabase Auth generates OTP and triggers our send_sms hook
-- 3. Our hook sends SMS via mNotify (Ghana) or Termii (Nigeria)
-- 4. User receives SMS, enters OTP
-- 5. Client calls supabase.auth.verifyOtp({ phone, token, type: 'sms' })
-- 6. Supabase verifies and creates session - DONE!
--
-- Benefits:
-- - No custom Edge Functions needed for OTP
-- - No manual OTP table management
-- - Built-in rate limiting
-- - Standard Supabase session handling
-- ============================================

-- Step 1: Create the SMS Hook Function
-- This function is called by Supabase Auth whenever an SMS needs to be sent

CREATE OR REPLACE FUNCTION public.send_sms_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    phone text;
    otp text;
    country text := 'GH'; -- Default to Ghana
    message text;
    api_response jsonb;
BEGIN
    -- Extract phone and OTP from the event
    phone := event->'user'->>'phone';
    otp := event->'sms'->>'otp';
    
    IF phone IS NULL OR otp IS NULL THEN
        RAISE EXCEPTION 'Missing phone or OTP in event';
    END IF;
    
    -- Determine country from phone number
    IF phone LIKE '+234%' THEN
        country := 'NG';
    ELSIF phone LIKE '+233%' THEN
        country := 'GH';
    END IF;
    
    -- Build the message
    message := 'Your WarehousePOS code is ' || otp || '. Valid for 5 minutes.';
    
    -- Log the attempt (for debugging)
    RAISE NOTICE 'Sending SMS to % (%) with OTP %', phone, country, otp;
    
    -- Call our Edge Function to actually send the SMS
    -- (We need an Edge Function because Postgres can't directly call mNotify/Termii APIs)
    SELECT content::jsonb INTO api_response
    FROM http_post(
        current_setting('app.settings.supabase_url') || '/functions/v1/send-sms',
        jsonb_build_object(
            'phone', phone,
            'message', message,
            'country', country
        )::text,
        'application/json'
    );
    
    -- Return empty response (success)
    RETURN '{}'::jsonb;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block auth flow
    RAISE WARNING 'SMS Hook Error: % %', SQLERRM, SQLSTATE;
    -- Return error to Supabase Auth
    RETURN jsonb_build_object(
        'error', jsonb_build_object(
            'http_code', 500,
            'message', 'Failed to send SMS: ' || SQLERRM
        )
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.send_sms_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.send_sms_hook FROM authenticated, anon, public;

-- Step 2: Enable the http extension (needed for API calls from Postgres)
-- Run this if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Step 3: Store API settings securely
-- You'll set these via Supabase Dashboard > Settings > Database > Settings
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';

SELECT 'SMS Hook function created!' as result;
SELECT 'IMPORTANT: Enable this hook in Supabase Dashboard > Authentication > Hooks > Send SMS' as next_step;
