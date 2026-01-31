# 🚀 Coming Soon Features

> **Last Updated:** January 31, 2026  
> **Status:** Planned for Future Releases

This document outlines features that are planned but not yet implemented in WarehousePOS. These features currently display "Coming Soon" placeholder pages in the application.

---

## 📋 Feature Overview

| Feature | Priority | Estimated Release | Status |
|---------|----------|-------------------|--------|
| Orders Management | High | Q2 2026 | 🟡 Planned |
| Delivery Management | High | Q2 2026 | 🟡 Planned |
| Rider Management | Medium | Q2 2026 | 🟡 Planned |
| Order/Delivery Tracking | Medium | Q3 2026 | 🟡 Planned |
| Delivery Assignments | Medium | Q2 2026 | 🟡 Planned |
| Mobile Reports | Low | Q3 2026 | 🟡 Planned |

---

## 📦 Orders Management

**File:** `apps/pos/src/pages/OrdersPage.tsx`

### Description
Full order management system for handling online orders, phone orders, and pre-orders separate from walk-in POS sales.

### Planned Features
- [ ] Order list with filtering (pending, processing, ready, completed, cancelled)
- [ ] Order detail view with customer info and items
- [ ] Order status workflow management
- [ ] Order creation from admin interface
- [ ] Order notifications (SMS/WhatsApp)
- [ ] Order history and search
- [ ] Print order tickets for kitchen/fulfillment
- [ ] Order notes and special instructions
- [ ] Estimated preparation time tracking

### Database Requirements
```sql
-- Will need these tables:
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    customer_id UUID REFERENCES customers(id),
    order_number TEXT,
    order_type TEXT, -- 'online', 'phone', 'pre-order'
    status TEXT, -- 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'
    subtotal DECIMAL(12,2),
    discount DECIMAL(12,2),
    tax DECIMAL(12,2),
    delivery_fee DECIMAL(12,2),
    total DECIMAL(12,2),
    payment_method TEXT,
    payment_status TEXT,
    notes TEXT,
    estimated_ready_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER,
    unit_price DECIMAL(12,2),
    total DECIMAL(12,2),
    notes TEXT
);
```

---

## 🚚 Delivery Management

**Files:** 
- `apps/pos/src/pages/DeliveriesPage.tsx`
- `apps/pos/src/pages/delivery/MobileDeliveriesPage.tsx`

### Description
Complete delivery management system for tracking and managing order deliveries.

### Planned Features
- [ ] Delivery queue with real-time status
- [ ] Delivery assignment to riders
- [ ] Delivery tracking with GPS
- [ ] Delivery zones configuration
- [ ] Delivery fee calculation
- [ ] Customer delivery notifications
- [ ] Proof of delivery (photo/signature)
- [ ] Delivery time estimates
- [ ] Failed delivery handling
- [ ] Delivery analytics and reports

### Database Requirements
```sql
CREATE TABLE deliveries (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    order_id UUID REFERENCES orders(id),
    rider_id UUID REFERENCES riders(id),
    status TEXT, -- 'pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'
    delivery_address TEXT,
    delivery_lat DECIMAL(10,8),
    delivery_lng DECIMAL(11,8),
    delivery_notes TEXT,
    estimated_delivery_at TIMESTAMPTZ,
    actual_delivery_at TIMESTAMPTZ,
    delivery_fee DECIMAL(12,2),
    distance_km DECIMAL(10,2),
    proof_photo_url TEXT,
    signature_url TEXT,
    customer_rating INTEGER,
    customer_feedback TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    name TEXT,
    description TEXT,
    polygon JSONB, -- GeoJSON polygon
    base_fee DECIMAL(12,2),
    per_km_fee DECIMAL(12,2),
    min_order_amount DECIMAL(12,2),
    estimated_time_minutes INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ
);
```

---

## 🏍️ Rider Management

**Files:**
- `apps/pos/src/pages/RidersPage.tsx`
- `apps/pos/src/pages/riders/MobileRidersPage.tsx`

### Description
Manage delivery riders, their availability, assignments, and performance.

### Planned Features
- [ ] Rider registration and profiles
- [ ] Rider availability status (online/offline/busy)
- [ ] Real-time rider location tracking
- [ ] Rider assignment queue
- [ ] Rider performance metrics
- [ ] Rider earnings tracking
- [ ] Rider ratings and reviews
- [ ] Rider documents management (ID, license)
- [ ] Rider mobile app integration
- [ ] Rider shift scheduling

### Database Requirements
```sql
CREATE TABLE riders (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    full_name TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    vehicle_type TEXT, -- 'motorcycle', 'bicycle', 'car'
    vehicle_number TEXT,
    license_number TEXT,
    status TEXT, -- 'active', 'inactive', 'suspended'
    is_online BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    rating DECIMAL(3,2),
    total_deliveries INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE rider_documents (
    id UUID PRIMARY KEY,
    rider_id UUID REFERENCES riders(id),
    document_type TEXT, -- 'id_card', 'license', 'insurance'
    document_url TEXT,
    expiry_date DATE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);
```

---

## 📍 Order/Delivery Tracking

**Files:**
- `apps/pos/src/pages/TrackingPage.tsx`
- `apps/pos/src/pages/tracking/TrackingPage.tsx`

### Description
Real-time tracking interface for orders and deliveries with map visualization.

### Planned Features
- [ ] Live map with rider locations
- [ ] Order status timeline
- [ ] ETA calculations
- [ ] Customer tracking link generation
- [ ] Push notifications for status updates
- [ ] Delivery route visualization
- [ ] Multiple order tracking
- [ ] Tracking history

### Technical Requirements
- Google Maps or Mapbox integration
- WebSocket for real-time updates
- Background location tracking for riders
- Push notification service integration

---

## 📊 Delivery Assignments

**File:** `apps/pos/src/pages/delivery/DeliveryAssignmentsPage.tsx`

### Description
Interface for assigning deliveries to riders and managing the assignment queue.

### Planned Features
- [ ] Pending deliveries queue
- [ ] Available riders list
- [ ] Smart assignment suggestions (based on location, load)
- [ ] Manual assignment override
- [ ] Batch assignment
- [ ] Re-assignment handling
- [ ] Assignment history
- [ ] Rider workload balancing

### Database Requirements
```sql
CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY,
    delivery_id UUID REFERENCES deliveries(id),
    rider_id UUID REFERENCES riders(id),
    assigned_by UUID REFERENCES users(id),
    status TEXT, -- 'pending', 'accepted', 'rejected', 'completed'
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ
);
```

---

## 📱 Mobile Reports

**File:** `apps/pos/src/pages/reports/MobileReportsPage.tsx`

### Description
Mobile-optimized reporting interface for viewing sales and business analytics on the go.

### Planned Features
- [ ] Daily sales summary
- [ ] Quick stats dashboard
- [ ] Sales by payment method
- [ ] Top products chart
- [ ] Revenue trends
- [ ] Comparative analysis (vs yesterday, last week)
- [ ] Export reports (PDF, CSV)
- [ ] Custom date range selection
- [ ] Offline report caching

---

## 🛠️ Implementation Notes

### Priority Order
1. **Orders Management** - Core feature needed for online ordering
2. **Delivery Management** - Required for delivery operations
3. **Rider Management** - Needed before delivery assignments
4. **Delivery Assignments** - Connects riders to deliveries
5. **Tracking** - Customer-facing feature
6. **Mobile Reports** - Nice-to-have enhancement

### Dependencies
```
Orders → Deliveries → Delivery Assignments
              ↓
           Riders → Tracking
```

### API Endpoints Needed
```
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status

POST   /api/deliveries
GET    /api/deliveries
PATCH  /api/deliveries/:id/status
POST   /api/deliveries/:id/assign

POST   /api/riders
GET    /api/riders
PATCH  /api/riders/:id/status
GET    /api/riders/:id/location

GET    /api/tracking/:trackingCode
WS     /api/tracking/:trackingCode/live
```

### Third-Party Integrations Required
- **Maps:** Google Maps API or Mapbox for delivery zones and tracking
- **SMS:** mNotify (Ghana) / Termii (Nigeria) for notifications
- **Push:** Firebase Cloud Messaging for real-time updates
- **Payments:** Paystack for delivery fee collection

---

## 📝 Contribution Guidelines

When implementing these features:

1. **Create feature branch:** `feature/orders-management`
2. **Add database migrations:** `supabase/migrations/XXX_add_orders.sql`
3. **Update types:** `packages/types/src/index.ts`
4. **Implement backend:** Edge Functions or API routes
5. **Build UI:** Desktop + Mobile versions
6. **Add tests:** Unit and integration tests
7. **Update documentation:** This file and API docs

---

## 📞 Contact

For questions about these planned features, contact the development team or create an issue in the repository.
