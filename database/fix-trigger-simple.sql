-- ==========================================
-- SIMPLIFIED TRIGGER - Non-blocking
-- Run this in Supabase SQL Editor
-- ==========================================

-- Drop the trigger completely for now
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simple, fast function that just saves phone mapping
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Just log and return - don't create tenant/store/user profile here
  -- The app will handle profile setup separately
  RAISE NOTICE 'New auth user created: %', NEW.id;
  
  -- Only save phone_users mapping if phone exists
  IF NEW.phone IS NOT NULL THEN
    INSERT INTO phone_users (phone, user_id)
    VALUES (NEW.phone, NEW.id)
    ON CONFLICT (phone) DO UPDATE SET user_id = NEW.id, updated_at = NOW();
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

SELECT 'Simplified trigger installed!' as result;
