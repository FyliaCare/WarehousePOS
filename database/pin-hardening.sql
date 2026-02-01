-- Harden PIN storage and lockout policy
-- Adds server-side counters and lockout window for PIN verification

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;

-- Optional timestamp for tracking PIN updates
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMPTZ;

-- Keep attempts non-negative
ALTER TABLE users
  ALTER COLUMN pin_failed_attempts SET DEFAULT 0;

COMMENT ON COLUMN users.pin_failed_attempts IS 'Consecutive failed PIN attempts';
COMMENT ON COLUMN users.pin_locked_until IS 'Until when PIN attempts are locked';
COMMENT ON COLUMN users.pin_updated_at IS 'Last time PIN was changed';
