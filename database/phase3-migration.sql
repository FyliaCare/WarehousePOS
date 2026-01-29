-- ==========================================
-- PHASE 3: ADMIN & BILLING MIGRATION
-- Run this in Supabase SQL Editor after Phase 2 schema
-- ==========================================

-- ==========================================
-- 1. SUBSCRIPTION PLANS
-- ==========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Pricing (monthly)
  price_ghs DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_ngn DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Yearly pricing (optional discount)
  yearly_price_ghs DECIMAL(10, 2),
  yearly_price_ngn DECIMAL(10, 2),
  
  -- Features included
  features JSONB DEFAULT '[]',
  
  -- Limits
  limits JSONB DEFAULT '{
    "products": -1,
    "staff": 1,
    "stores": 1,
    "monthly_orders": -1,
    "sms_credits": 0,
    "api_access": false,
    "white_label": false,
    "priority_support": false
  }',
  
  -- Plan settings
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  trial_days INTEGER DEFAULT 14,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, slug, description, price_ghs, price_ngn, yearly_price_ghs, yearly_price_ngn, features, limits, is_active, is_featured, trial_days, sort_order) VALUES
(
  'Free',
  'free',
  'Perfect for getting started. Basic POS features with limited products.',
  0,
  0,
  0,
  0,
  '["Basic POS", "Up to 50 products", "1 staff member", "Sales reports", "Email support"]',
  '{"products": 50, "staff": 1, "stores": 1, "monthly_orders": 100, "sms_credits": 0, "api_access": false, "white_label": false, "priority_support": false}',
  true,
  false,
  0,
  1
),
(
  'Starter',
  'starter',
  'Great for small businesses. More products and features.',
  49,
  4900,
  490,
  49000,
  '["Everything in Free", "Up to 500 products", "3 staff members", "Customer management", "Inventory alerts", "50 SMS/month"]',
  '{"products": 500, "staff": 3, "stores": 1, "monthly_orders": 500, "sms_credits": 50, "api_access": false, "white_label": false, "priority_support": false}',
  true,
  false,
  14,
  2
),
(
  'Business',
  'business',
  'For growing businesses. Unlimited products and online ordering.',
  149,
  14900,
  1490,
  149000,
  '["Everything in Starter", "Unlimited products", "10 staff members", "Online store portal", "Delivery management", "200 SMS/month", "Priority support"]',
  '{"products": -1, "staff": 10, "stores": 2, "monthly_orders": -1, "sms_credits": 200, "api_access": true, "white_label": false, "priority_support": true}',
  true,
  true,
  14,
  3
),
(
  'Enterprise',
  'enterprise',
  'For large businesses. Full features with white-label option.',
  399,
  39900,
  3990,
  399000,
  '["Everything in Business", "Unlimited staff", "Up to 10 stores", "White-label branding", "500 SMS/month", "Dedicated support", "API access", "Custom integrations"]',
  '{"products": -1, "staff": -1, "stores": 10, "monthly_orders": -1, "sms_credits": 500, "api_access": true, "white_label": true, "priority_support": true}',
  true,
  false,
  14,
  4
)
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- 2. SUBSCRIPTIONS (Active tenant subscriptions)
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'trial',
  -- trial, active, past_due, cancelled, expired
  
  -- Billing cycle
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
  
  -- Period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Paystack
  paystack_customer_code VARCHAR(100),
  paystack_subscription_code VARCHAR(100),
  paystack_email_token VARCHAR(100),
  paystack_authorization_code VARCHAR(100),
  
  -- Credits
  sms_credits_remaining INTEGER DEFAULT 0,
  sms_credits_used INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- ==========================================
-- 3. PAYMENTS/INVOICES
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL, -- GHS, NGN
  
  -- Type
  type VARCHAR(30) NOT NULL, -- subscription, sms_credits, one_time
  description TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending, paid, failed, refunded
  
  -- Paystack
  paystack_reference VARCHAR(100) UNIQUE,
  paystack_transaction_id VARCHAR(100),
  paystack_authorization_code VARCHAR(100),
  
  -- Payment details
  payment_method VARCHAR(30), -- card, bank_transfer, mobile_money
  payment_channel VARCHAR(50), -- card, bank, mobile_money
  card_last4 VARCHAR(4),
  card_type VARCHAR(20), -- visa, mastercard
  bank_name VARCHAR(100),
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Invoice details
  invoice_number VARCHAR(50),
  invoice_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(paystack_reference);

-- ==========================================
-- 4. SMS CREDIT PURCHASES & USAGE
-- ==========================================
CREATE TABLE IF NOT EXISTS sms_credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  credits INTEGER NOT NULL,
  price_ghs DECIMAL(10, 2) NOT NULL,
  price_ngn DECIMAL(10, 2) NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert SMS packages
INSERT INTO sms_credit_packages (name, credits, price_ghs, price_ngn, bonus_credits, sort_order) VALUES
('Starter Pack', 100, 15, 1500, 0, 1),
('Growth Pack', 500, 60, 6000, 50, 2),
('Business Pack', 1000, 100, 10000, 150, 3),
('Enterprise Pack', 5000, 400, 40000, 1000, 4)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS sms_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  message TEXT,
  message_type VARCHAR(50), -- otp, order_notification, delivery_update, marketing
  credits_used INTEGER DEFAULT 1,
  status VARCHAR(20), -- sent, failed, pending
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_usage_tenant ON sms_usage_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_usage_created ON sms_usage_log(created_at);

-- ==========================================
-- 5. ADMIN USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Supabase auth user id
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(30) DEFAULT 'admin', -- super_admin, admin, support
  permissions JSONB DEFAULT '[]',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. SUPPORT TICKETS
-- ==========================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Ticket info
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50), -- billing, technical, feature_request, bug, other
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Status
  status VARCHAR(20) DEFAULT 'open',
  -- open, in_progress, waiting_customer, resolved, closed
  
  -- Assignment
  assigned_to UUID REFERENCES admin_users(id),
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- tenant, admin
  sender_id UUID,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT false, -- Admin-only notes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages ON support_ticket_messages(ticket_id);

-- ==========================================
-- 7. ANNOUNCEMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info', -- info, warning, maintenance, feature
  
  -- Targeting
  target_countries JSONB DEFAULT '["GH", "NG"]', -- Countries to show to
  target_plans JSONB, -- Specific plans, null = all
  
  -- Display settings
  is_dismissible BOOLEAN DEFAULT true,
  show_on_dashboard BOOLEAN DEFAULT true,
  show_on_login BOOLEAN DEFAULT false,
  
  -- Scheduling
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track dismissed announcements
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, tenant_id)
);

-- ==========================================
-- 8. PLATFORM ANALYTICS
-- ==========================================
CREATE TABLE IF NOT EXISTS platform_analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  
  -- Tenant stats
  total_tenants INTEGER DEFAULT 0,
  new_tenants INTEGER DEFAULT 0,
  active_tenants INTEGER DEFAULT 0, -- Made a sale/order that day
  churned_tenants INTEGER DEFAULT 0,
  
  -- Order stats
  total_orders INTEGER DEFAULT 0,
  total_order_value DECIMAL(15, 2) DEFAULT 0,
  pos_orders INTEGER DEFAULT 0,
  online_orders INTEGER DEFAULT 0,
  delivery_orders INTEGER DEFAULT 0,
  
  -- Revenue stats (platform fees)
  platform_revenue_ghs DECIMAL(12, 2) DEFAULT 0,
  platform_revenue_ngn DECIMAL(12, 2) DEFAULT 0,
  subscription_revenue_ghs DECIMAL(12, 2) DEFAULT 0,
  subscription_revenue_ngn DECIMAL(12, 2) DEFAULT 0,
  sms_revenue_ghs DECIMAL(12, 2) DEFAULT 0,
  sms_revenue_ngn DECIMAL(12, 2) DEFAULT 0,
  
  -- By country
  stats_by_country JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics_daily(date);

-- ==========================================
-- 9. UPDATE TENANTS TABLE
-- ==========================================
-- Note: subscription_status and trial_ends_at already exist in base schema
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(30) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set default trial period for existing tenants
UPDATE tenants 
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE trial_ends_at IS NULL AND subscription_status = 'trial';

-- ==========================================
-- 10. AUDIT LOG
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- tenant, subscription, payment, ticket
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at);

-- ==========================================
-- 11. RLS POLICIES
-- ==========================================

-- Subscription Plans (public read)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own subscription" ON subscriptions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own payments" ON payments
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Support Tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own tickets" ON support_tickets
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Tenants can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Ticket Messages
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view non-internal messages" ON support_ticket_messages
  FOR SELECT USING (
    is_internal = false AND
    ticket_id IN (
      SELECT id FROM support_tickets WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (is_active = true AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW()));

-- ==========================================
-- 12. FUNCTIONS
-- ==========================================

-- Function to increment SMS credits
CREATE OR REPLACE FUNCTION add_sms_credits(
  p_tenant_id UUID,
  p_credits INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions
  SET sms_credits_remaining = sms_credits_remaining + p_credits,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use SMS credit
CREATE OR REPLACE FUNCTION use_sms_credit(
  p_tenant_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT sms_credits_remaining INTO v_credits
  FROM subscriptions WHERE tenant_id = p_tenant_id;
  
  IF v_credits > 0 THEN
    UPDATE subscriptions
    SET sms_credits_remaining = sms_credits_remaining - 1,
        sms_credits_used = sms_credits_used + 1,
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_tenant_id UUID,
  p_limit_key VARCHAR
) RETURNS INTEGER AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  SELECT (sp.limits->>p_limit_key)::INTEGER INTO v_limit
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.tenant_id = p_tenant_id;
  
  RETURN COALESCE(v_limit, -1); -- -1 means unlimited
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number() 
RETURNS VARCHAR AS $$
DECLARE
  v_number VARCHAR;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'TKT-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM support_tickets WHERE ticket_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- ==========================================
-- 13. VIEWS FOR ADMIN DASHBOARD
-- ==========================================

-- View: Tenant overview with subscription info
CREATE OR REPLACE VIEW admin_tenant_overview AS
SELECT 
  t.id,
  t.name as business_name,
  t.billing_email as email,
  t.phone,
  t.country,
  COALESCE(t.is_active, true) as is_active,
  COALESCE(t.subscription_tier, 'free') as subscription_tier,
  t.subscription_status,
  t.trial_ends_at,
  t.created_at,
  COALESCE(st.store_name, 'No stores') as store_count_display,
  (SELECT COUNT(*) FROM stores WHERE tenant_id = t.id) as store_count,
  (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count,
  (SELECT COUNT(*) FROM orders WHERE store_id IN (SELECT id FROM stores WHERE tenant_id = t.id)) as order_count,
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE store_id IN (SELECT id FROM stores WHERE tenant_id = t.id) AND payment_status = 'paid') as total_revenue,
  sp.name as plan_name,
  sub.status as subscription_status_detail,
  sub.current_period_end
FROM tenants t
LEFT JOIN subscriptions sub ON sub.tenant_id = t.id
LEFT JOIN subscription_plans sp ON sub.plan_id = sp.id
LEFT JOIN LATERAL (SELECT name as store_name FROM stores WHERE tenant_id = t.id LIMIT 1) st ON true
ORDER BY t.created_at DESC;

-- View: Revenue summary
CREATE OR REPLACE VIEW admin_revenue_summary AS
SELECT 
  DATE_TRUNC('month', p.created_at) as month,
  p.currency,
  COUNT(*) as payment_count,
  SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN p.type = 'subscription' THEN p.amount ELSE 0 END) as subscription_revenue,
  SUM(CASE WHEN p.type = 'sms_credits' THEN p.amount ELSE 0 END) as sms_revenue
FROM payments p
WHERE p.status = 'paid'
GROUP BY DATE_TRUNC('month', p.created_at), p.currency
ORDER BY month DESC;

COMMENT ON TABLE subscription_plans IS 'Platform subscription tiers with pricing and limits';
COMMENT ON TABLE subscriptions IS 'Active tenant subscriptions';
COMMENT ON TABLE payments IS 'Payment records and invoices';
COMMENT ON TABLE support_tickets IS 'Customer support tickets';
COMMENT ON TABLE announcements IS 'Platform-wide announcements';
