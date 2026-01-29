-- ==========================================
-- PHASE 2: ONLINE & DELIVERY MIGRATION
-- Run this in Supabase SQL Editor after Phase 1 schema
-- ==========================================

-- ==========================================
-- 1. ADD PORTAL COLUMNS TO STORES
-- ==========================================
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_settings JSONB DEFAULT '{
    "showPrices": true,
    "allowOrders": true,
    "allowDelivery": true,
    "allowPickup": true,
    "minOrderAmount": 0,
    "bannerImage": null,
    "description": null,
    "openingHours": null
  }',
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(5, 2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS base_delivery_fee DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_delivery_threshold DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- Generate slugs for existing stores that don't have one
UPDATE stores 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::TEXT, 1, 8)
WHERE slug IS NULL;

-- ==========================================
-- 2. DELIVERY ZONES
-- ==========================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  delivery_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  min_order_amount DECIMAL(12, 2) DEFAULT 0,
  estimated_time_minutes INTEGER DEFAULT 45,
  -- Polygon boundary as GeoJSON
  boundary JSONB,
  -- Or simple radius from store
  radius_km DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. CUSTOMER AUTH (for portal)
-- ==========================================
CREATE TABLE IF NOT EXISTS portal_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  name VARCHAR(200),
  email VARCHAR(255),
  default_address TEXT,
  default_city VARCHAR(100),
  default_latitude DECIMAL(10, 8),
  default_longitude DECIMAL(11, 8),
  saved_addresses JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_order_at TIMESTAMPTZ,
  UNIQUE(store_id, phone)
);

-- ==========================================
-- 4. ADD PORTAL COLUMNS TO ORDERS
-- ==========================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'pos',
  ADD COLUMN IF NOT EXISTS portal_customer_id UUID REFERENCES portal_customers(id),
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS estimated_ready_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(10);

-- ==========================================
-- 5. ORDER TRACKING EVENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. RIDER LOCATION HISTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS rider_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  delivery_assignment_id UUID REFERENCES delivery_assignments(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for rider location queries
CREATE INDEX IF NOT EXISTS idx_rider_locations_rider_id ON rider_locations(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_locations_recorded_at ON rider_locations(recorded_at);

-- ==========================================
-- 7. ADD COLUMNS TO RIDERS
-- ==========================================
ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_balance DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- ==========================================
-- 8. NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  rider_id UUID REFERENCES riders(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON notifications(store_id);

-- ==========================================
-- 9. RLS POLICIES FOR NEW TABLES
-- ==========================================

-- Delivery Zones
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their store zones" ON delivery_zones
  FOR SELECT USING (
    store_id IN (SELECT store_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage their store zones" ON delivery_zones
  FOR ALL USING (
    store_id IN (SELECT store_id FROM users WHERE id = auth.uid())
  );

-- Portal can view zones
CREATE POLICY "Public can view active zones" ON delivery_zones
  FOR SELECT USING (is_active = true);

-- Portal Customers
ALTER TABLE portal_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users can view customers" ON portal_customers
  FOR SELECT USING (
    store_id IN (SELECT store_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Public can insert customers" ON portal_customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can update own record" ON portal_customers
  FOR UPDATE USING (id = auth.uid()::uuid);

-- Order Events
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order events" ON order_events
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE store_id IN (
        SELECT store_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create order events" ON order_events
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE store_id IN (
        SELECT store_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Public can view their order events by tracking code
CREATE POLICY "Public can view order events by tracking" ON order_events
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE tracking_code IS NOT NULL)
  );

-- Rider Locations
ALTER TABLE rider_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users can view rider locations" ON rider_locations
  FOR SELECT USING (
    rider_id IN (
      SELECT id FROM riders WHERE store_id IN (
        SELECT store_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Riders can insert own location" ON rider_locations
  FOR INSERT WITH CHECK (true);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ==========================================
-- 10. FUNCTIONS FOR PHASE 2
-- ==========================================

-- Generate unique tracking code
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Auto-generate tracking code for orders
CREATE OR REPLACE FUNCTION set_order_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := generate_tracking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_tracking_code_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_tracking_code();

-- Add order event on status change
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_events (order_id, event_type, title, description)
    VALUES (
      NEW.id,
      'status_change',
      CASE NEW.status
        WHEN 'pending' THEN 'Order Placed'
        WHEN 'confirmed' THEN 'Order Confirmed'
        WHEN 'preparing' THEN 'Preparing Your Order'
        WHEN 'ready' THEN 'Ready for Pickup/Delivery'
        WHEN 'out_for_delivery' THEN 'Out for Delivery'
        WHEN 'delivered' THEN 'Order Delivered'
        WHEN 'cancelled' THEN 'Order Cancelled'
        ELSE 'Status Updated'
      END,
      CASE NEW.status
        WHEN 'pending' THEN 'Your order has been received'
        WHEN 'confirmed' THEN 'The store has confirmed your order'
        WHEN 'preparing' THEN 'Your order is being prepared'
        WHEN 'ready' THEN 'Your order is ready'
        WHEN 'out_for_delivery' THEN 'Your order is on the way'
        WHEN 'delivered' THEN 'Your order has been delivered'
        WHEN 'cancelled' THEN COALESCE(NEW.cancellation_reason, 'Order was cancelled')
        ELSE 'Order status has been updated'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_event_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Also log initial order placement
CREATE OR REPLACE FUNCTION log_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_events (order_id, event_type, title, description)
  VALUES (NEW.id, 'order_placed', 'Order Placed', 'Your order has been received');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_order_event_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_new_order();

-- ==========================================
-- 11. REALTIME SUBSCRIPTIONS
-- ==========================================
-- Enable realtime for orders (for POS notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_events;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE rider_locations;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2 migration completed successfully!';
  RAISE NOTICE '📦 Added: delivery_zones, portal_customers, order_events, rider_locations, notifications';
  RAISE NOTICE '🔄 Updated: stores, orders, riders tables';
  RAISE NOTICE '🔔 Enabled realtime for: orders, order_events, delivery_assignments, notifications, rider_locations';
END $$;
