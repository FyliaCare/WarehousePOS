-- Phone users mapping table for phone-based auth and PIN lookup
CREATE TABLE IF NOT EXISTS phone_users (
  phone VARCHAR(20) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to match Edge Function upsert pattern on phone_otps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'phone_otps_phone_purpose_unique'
  ) THEN
    ALTER TABLE phone_otps
      ADD CONSTRAINT phone_otps_phone_purpose_unique UNIQUE (phone, purpose);
  END IF;
END$$;

-- Optional index to speed reverse lookup by user
CREATE INDEX IF NOT EXISTS idx_phone_users_user_id ON phone_users(user_id);

-- Tighten purposes to the ones supported by Edge Functions
DO $$
BEGIN
  -- Drop old CHECK if name differs
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'phone_otps_purpose_check'
  ) THEN
    ALTER TABLE phone_otps DROP CONSTRAINT phone_otps_purpose_check;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'phone_otps_purpose_check'
  ) THEN
    ALTER TABLE phone_otps
      ADD CONSTRAINT phone_otps_purpose_check CHECK (purpose IN ('login','registration'));
  END IF;
END$$;
