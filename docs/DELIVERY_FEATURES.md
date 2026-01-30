# 🚚 Warehouse POS - Delivery Features Documentation

> **Last Updated:** January 30, 2026  
> **Version:** 2.0 (Zone Mapping Update)  
> **Module:** Phase 3 - Delivery & Logistics

---

## Table of Contents

1. [Overview](#overview)
2. [Delivery Zone Management](#delivery-zone-management)
3. [Zone Map Drawing](#zone-map-drawing)
4. [Store Location Management](#store-location-management)
5. [Rider Management](#rider-management)
6. [Delivery Assignment System](#delivery-assignment-system)
7. [Order Tracking](#order-tracking)
8. [Rider Portal](#rider-portal)
9. [Notifications System](#notifications-system)
10. [Database Schema](#database-schema)
11. [API & Store Reference](#api--store-reference)
12. [Feature Status](#feature-status)
13. [Future Roadmap](#future-roadmap)

---

## Overview

The Warehouse POS Delivery System provides a complete end-to-end solution for managing deliveries, from zone configuration to rider management and real-time order tracking. The system supports multiple fulfillment types:

| Fulfillment Type | Icon | Description                   |
| ---------------- | ---- | ----------------------------- |
| **Pickup**       | 🏪   | Customer picks up from store  |
| **Delivery**     | 🚚   | Deliver to customer's address |
| **Dine In**      | 🍽️   | Customer eats at location     |

### Key Capabilities

- ✅ Geographic delivery zone management with interactive polygon drawing
- ✅ Full rider fleet management
- ✅ Automated delivery assignment and dispatching
- ✅ Real-time order tracking for customers
- ✅ Dedicated rider mobile portal
- ✅ Automated WhatsApp/SMS notifications
- ✅ Commission and earnings tracking
- ✅ Proof of delivery support
- ✅ Store location mapping
- ✅ Leaflet-based map components

---

## Delivery Zone Management

**Location:** `src/pages/delivery/DeliveryZonesPage.tsx`  
**Components:** 
- `src/components/maps/DeliveryZoneMap.tsx`
- `src/components/delivery/ZoneEditorModal.tsx`

### Features

Delivery zones allow businesses to define geographic areas where they deliver, each with its own pricing, timing, and visual configuration.

#### Zone Properties

| Property                  | Type         | Description                               |
| ------------------------- | ------------ | ----------------------------------------- |
| `name`                    | string       | Zone name (e.g., "East Legon", "Tema")    |
| `description`             | string       | Optional description                      |
| `delivery_fee`            | number       | Fee charged for delivery to this zone     |
| `min_order_amount`        | number       | Minimum order value required              |
| `free_delivery_threshold` | number       | Order amount above which delivery is free |
| `estimated_time_minutes`  | number       | Estimated delivery time in minutes        |
| `boundary`                | GeoJSON      | Polygon coordinates defining the zone     |
| `color`                   | string       | Hex color for zone display on map         |
| `is_active`               | boolean      | Whether zone is currently active          |

#### GeoJSON Boundary Format

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-0.1870, 5.6037],  // [longitude, latitude]
      [-0.1800, 5.6100],
      [-0.1750, 5.6050],
      [-0.1870, 5.6037]   // Closed polygon (first = last)
    ]
  ]
}
```

### User Interface

- **List View:** Card-based display with zone color, stats, and quick actions
- **Map View:** Interactive Leaflet map showing all zone polygons
- **Stats Dashboard:** Total zones, active zones, mapped zones, avg fee, avg time
- **Zone Editor:** 3-step wizard (Details → Draw Boundary → Review)

---

## Zone Map Drawing

**Location:** `src/components/maps/DeliveryZoneMap.tsx`

### Technology Stack

| Library       | Version | Purpose                       |
| ------------- | ------- | ----------------------------- |
| Leaflet       | 1.9.4   | Core mapping library          |
| react-leaflet | 5.0.0   | React bindings for Leaflet    |
| leaflet-draw  | 1.0.4   | Polygon drawing tools         |

### Map Features

#### Drawing Controls
- **Polygon Tool:** Click to add vertices, close polygon to complete
- **Edit Mode:** Drag vertices to adjust zone boundaries
- **Delete Mode:** Remove existing boundaries

#### Display Features
- **Zone Polygons:** Color-coded with customizable opacity
- **Store Marker:** Shows store location on map
- **Zone Legend:** Interactive legend to toggle zones
- **Popup Info:** Click zones to see delivery fee and status

#### Custom Controls
- **Zoom In/Out:** Map navigation
- **Locate Me:** Center on user's GPS location
- **Reset View:** Return to default map position
- **Show/Hide Zones:** Toggle zone visibility

### Theme Integration

The map automatically adapts to country theme:

| Country | Primary Color | Default Center |
| ------- | ------------- | -------------- |
| Ghana   | #FFD000 (Gold)| Accra (5.6037, -0.1870) |
| Nigeria | #008751 (Green)| Lagos (6.5244, 3.3792) |

### Zone Colors

12 predefined colors for visual differentiation:
```
#10B981, #3B82F6, #F59E0B, #EF4444, #8B5CF6, #EC4899,
#06B6D4, #F97316, #84CC16, #6366F1, #14B8A6, #D946EF
```

---

## Store Location Management

**Location:** `src/pages/settings/SettingsPage.tsx` (Store tab)  
**Component:** `src/components/maps/StoreLocationPicker.tsx`

### Features

- **Interactive Map Picker:** Click to place store marker
- **Address Search:** Search by street address
- **GPS Location:** Use device location
- **Coordinates Display:** Shows lat/lng for stored location

### Usage

1. Navigate to Settings → Store
2. Click "Set Location" button
3. Either:
   - Click on map to place marker
   - Search for address
   - Use "Locate Me" for GPS
4. Save changes

Store location is displayed on delivery zone maps and helps riders navigate.

---

## Rider Management

**Location:** `src/pages/delivery/RidersPage.tsx`  
**Store:** `src/stores/deliveryStore.ts` → `useRiderStore`

### Features

Complete rider lifecycle management from onboarding to performance tracking.

#### Rider Properties

| Property           | Type          | Description                                      |
| ------------------ | ------------- | ------------------------------------------------ |
| `full_name`        | string        | Rider's full name                                |
| `phone`            | string        | Contact phone number                             |
| `email`            | string        | Email address (optional)                         |
| `photo_url`        | string        | Profile photo URL                                |
| `vehicle_type`     | VehicleType   | motorcycle, bicycle, car, or foot                |
| `vehicle_number`   | string        | Vehicle registration number                      |
| `status`           | RiderStatus   | available, busy, or offline                      |
| `current_location` | RiderLocation | GPS coordinates                                  |
| `employment_type`  | string        | full_time, part_time, or freelance               |
| `commission_rate`  | number        | Percentage per delivery                          |
| `fixed_rate`       | number        | Fixed amount per delivery (GHS)                  |
| `id_number`        | string        | ID document number                               |
| `id_type`          | string        | ghana_card, voters_id, passport, drivers_license |
| `id_verified`      | boolean       | Verification status                              |
| `total_deliveries` | number        | Lifetime delivery count                          |
| `rating`           | number        | Average rating (1-5)                             |
| `total_ratings`    | number        | Number of ratings received                       |
| `is_active`        | boolean       | Active/inactive status                           |

#### Vehicle Types

| Type       | Icon | Emoji |
| ---------- | ---- | ----- |
| Motorcycle | 🏍️   | 🏍️    |
| Bicycle    | 🚲   | 🚲    |
| Car        | 🚗   | 🚗    |
| On Foot    | 🚶   | 🚶    |

#### Rider Status Configuration

| Status      | Color     | Description                |
| ----------- | --------- | -------------------------- |
| `available` | 🟢 Green  | Ready to accept deliveries |
| `busy`      | 🟡 Yellow | Currently on a delivery    |
| `offline`   | ⚫ Gray   | Not accepting deliveries   |

#### Rider Actions

```typescript
// Available store actions
fetchRiders(tenantId); // Load all riders
addRider(rider); // Register new rider
updateRider(id, updates); // Update rider info
deleteRider(id); // Remove rider
updateRiderStatus(id, status); // Change availability
updateRiderLocation(id, lat, lng); // Update GPS position
getRiderById(id); // Get single rider
getActiveRiders(); // Get active riders only
getAvailableRiders(); // Get available for dispatch
getRidersByStatus(status); // Filter by status
```

### Rider Earnings

The system supports flexible earning models:

1. **Commission-based:** Percentage of delivery fee (default: 70%)
2. **Fixed rate:** Set amount per delivery
3. **Tips:** Customer tips tracked separately

```typescript
// Earnings calculation
if (rider.fixed_rate > 0) {
  riderEarnings = rider.fixed_rate;
} else if (rider.commission_rate > 0) {
  riderEarnings = deliveryFee * (rider.commission_rate / 100);
} else {
  riderEarnings = deliveryFee * 0.7; // Default 70%
}
```

---

## Delivery Assignment System

**Location:** `src/pages/delivery/DeliveryAssignmentsPage.tsx`  
**Store:** `src/stores/deliveryStore.ts` → `useDeliveryAssignmentStore`

### Assignment Lifecycle

```
┌─────────────┐     ┌──────────┐     ┌───────────┐     ┌────────────┐
│   Pending   │ ──▶ │ Assigned │ ──▶ │ Accepted  │ ──▶ │ Picked Up  │
└─────────────┘     └──────────┘     └───────────┘     └────────────┘
                                                              │
                                                              ▼
┌─────────────┐     ┌──────────┐     ┌───────────┐     ┌────────────┐
│  Cancelled  │ ◀── │  Failed  │ ◀── │ Delivered │ ◀── │ In Transit │
└─────────────┘     └──────────┘     └───────────┘     └────────────┘
```

### Assignment Status

| Status       | Label      | Color  | Description                     |
| ------------ | ---------- | ------ | ------------------------------- |
| `pending`    | Pending    | Gray   | Awaiting rider assignment       |
| `assigned`   | Assigned   | Blue   | Rider has been assigned         |
| `accepted`   | Accepted   | Cyan   | Rider accepted the delivery     |
| `picked_up`  | Picked Up  | Yellow | Order collected from store      |
| `in_transit` | In Transit | Purple | On the way to customer          |
| `delivered`  | Delivered  | Green  | Successfully delivered          |
| `failed`     | Failed     | Red    | Delivery could not be completed |
| `cancelled`  | Cancelled  | Gray   | Delivery was cancelled          |

### Assignment Properties

| Property             | Type                     | Description              |
| -------------------- | ------------------------ | ------------------------ |
| `order_id`           | string                   | Reference to order       |
| `rider_id`           | string                   | Assigned rider           |
| `status`             | DeliveryAssignmentStatus | Current status           |
| `assigned_at`        | timestamp                | When assigned            |
| `accepted_at`        | timestamp                | When rider accepted      |
| `picked_up_at`       | timestamp                | When picked up           |
| `in_transit_at`      | timestamp                | When started transit     |
| `delivered_at`       | timestamp                | When delivered           |
| `failed_at`          | timestamp                | When failed              |
| `route`              | RiderLocation[]          | GPS breadcrumb trail     |
| `delivery_photo_url` | string                   | Proof of delivery photo  |
| `recipient_name`     | string                   | Who received the package |
| `signature_url`      | string                   | Digital signature URL    |
| `delivery_notes`     | string                   | Delivery notes/comments  |
| `delivery_fee`       | number                   | Total delivery charge    |
| `rider_earnings`     | number                   | Rider's portion          |
| `tip_amount`         | number                   | Customer tip             |
| `customer_rating`    | number                   | Rating given (1-5)       |
| `customer_feedback`  | string                   | Customer comments        |
| `failure_reason`     | string                   | Why delivery failed      |

### Assignment Actions

```typescript
// Available store actions
fetchAssignments(tenantId); // Load all assignments
assignRider(orderId, riderId, fee, tenantId); // Assign rider to order
updateAssignmentStatus(id, status, data); // Update status
addDeliveryProof(id, photoUrl, name, notes); // Add proof of delivery
rateDelivery(id, rating, feedback); // Customer rating
cancelAssignment(id, reason); // Cancel delivery
getAssignmentById(id); // Get single assignment
getAssignmentByOrderId(orderId); // Find by order
getAssignmentsByRiderId(riderId); // Rider's deliveries
getAssignmentsByStatus(status); // Filter by status
getPendingAssignments(); // Awaiting assignment
getActiveDeliveries(); // Currently active
getDeliveryStats(); // Dashboard statistics
```

### Delivery Statistics

```typescript
interface DeliveryStats {
  total_deliveries: number; // All-time delivered count
  delivered_today: number; // Today's successful deliveries
  in_transit: number; // Currently being delivered
  pending_assignments: number; // Awaiting dispatch
  failed_today: number; // Today's failed deliveries
  average_delivery_time: number; // Average time in minutes
  total_riders: number; // Total rider count
  available_riders: number; // Ready riders
  busy_riders: number; // On delivery
  offline_riders: number; // Not available
  total_earnings_today: number; // Today's earnings
  average_rating: number; // Average customer rating
}
```

---

## Order Tracking

**Location:** `src/pages/tracking/TrackingPage.tsx`

### Public Tracking Page

Customers can track their orders using a tracking code via a public URL:

```
https://yourstore.com/track/{TRACKING_CODE}
```

### Tracking Features

- **Real-time status updates** - Auto-refreshes every 30 seconds
- **Visual progress bar** - Shows delivery stages
- **Rider information** - Name, photo, vehicle, rating
- **Contact rider** - Direct call/WhatsApp buttons
- **Live map** - Shows rider location (when available)
- **Order activity timeline** - Chronological event history
- **Share functionality** - Share tracking link
- **Business branding** - Shows store logo and name

### Tracking Code Generation

Tracking codes are automatically generated for delivery orders:

```sql
-- 8-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_tracking_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Tracking Link Generation

```typescript
function generateTrackingLink(orderId: string, orderNumber: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/track/${orderNumber}`;
}
```

---

## Rider Portal

**Location:** `src/pages/rider/`  
**Store:** `src/stores/riderPortalStore.ts`

### Portal Pages

| Page            | Path                  | Description                |
| --------------- | --------------------- | -------------------------- |
| Login           | `/rider/login`        | OTP-based authentication   |
| Dashboard       | `/rider`              | Overview and stats         |
| Deliveries      | `/rider/deliveries`   | Active deliveries list     |
| Delivery Detail | `/rider/delivery/:id` | Single delivery management |
| History         | `/rider/history`      | Past deliveries            |
| Earnings        | `/rider/earnings`     | Earnings breakdown         |
| Profile         | `/rider/profile`      | Personal settings          |

### Authentication

The rider portal uses OTP-based authentication:

1. Rider enters phone number
2. System sends OTP via SMS
3. Rider enters OTP code
4. Session created with JWT token

Alternative: **Magic Link** authentication via URL token for quick access.

### Active Delivery Information

```typescript
interface RiderActiveDelivery {
  assignment_id: string;
  order_id: string;
  order_number: string;
  status: DeliveryAssignmentStatus;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_instructions?: string;
  order_total: number;
  delivery_fee: number;
  rider_earnings: number;
  tip_amount: number;
  item_count: number;
  assigned_at: string;
  estimated_delivery_at?: string;
  store_name: string;
  store_address?: string;
  store_phone?: string;
}
```

### Rider Portal Actions

```typescript
// Authentication
loginWithToken(token); // Magic link login
loginWithOtp(phone, otp); // OTP login
requestOtp(phone); // Request OTP
logout(); // End session
validateSession(); // Check session validity

// Deliveries
fetchActiveDeliveries(); // Get current deliveries
fetchDeliveryHistory(limit, offset); // Get past deliveries
updateDeliveryStatus(id, status); // Update assignment
addDeliveryProof(id, type, data); // Submit proof

// Location
updateLocation(assignmentId); // Send GPS ping
startLocationTracking(id); // Begin continuous tracking
stopLocationTracking(); // Stop tracking

// Earnings
fetchEarningsSummary(start, end); // Get earnings data

// Status
updateRiderStatus(status); // Change availability
```

### Location Tracking

The portal tracks rider location during active deliveries:

```typescript
interface RiderLocationPing {
  id: string;
  tenant_id: string;
  rider_id: string;
  assignment_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  battery_level?: number;
  is_charging?: boolean;
  recorded_at: string;
}
```

### Earnings Summary

```typescript
interface RiderEarningsSummary {
  total_deliveries: number;
  total_earnings: number;
  total_tips: number;
  avg_rating: number;
  deliveries_by_day: Array<{
    date: string;
    count: number;
    earnings: number;
    tips: number;
  }>;
}
```

---

## Notifications System

**Location:** `src/lib/delivery-notifications.ts`

### Notification Events

The system sends automated notifications at each delivery stage:

| Event                | Customer | Vendor | Rider |
| -------------------- | -------- | ------ | ----- |
| `delivery_requested` | ✅       | ✅     | -     |
| `rider_assigned`     | ✅       | ✅     | ✅    |
| `rider_accepted`     | ✅       | ✅     | -     |
| `rider_at_pickup`    | ✅       | ✅     | -     |
| `picked_up`          | ✅       | ✅     | -     |
| `in_transit`         | ✅       | ✅     | -     |
| `arriving_soon`      | ✅       | ✅     | -     |
| `arrived`            | ✅       | ✅     | -     |
| `delivered`          | ✅       | ✅     | ✅    |
| `delivery_failed`    | ✅       | ✅     | -     |
| `delivery_cancelled` | ✅       | ✅     | -     |

### Notification Channels

- **Customer:** WhatsApp (preferred) or SMS
- **Vendor:** In-app notifications
- **Rider:** Push notifications or SMS

### Customer Notification Templates

```typescript
// Example: Order picked up
{
  title: "Order Picked Up",
  message: "Your order #{{orderNumber}} has been picked up and is on its way to you! 🚀 Track live: {{trackingLink}}"
}

// Example: Arriving soon
{
  title: "Almost There!",
  message: "Heads up! {{riderName}} will arrive with your order #{{orderNumber}} in about 5 minutes. Please be ready to receive it."
}
```

### Available Template Variables

| Variable              | Description            |
| --------------------- | ---------------------- |
| `{{customerName}}`    | Customer's name        |
| `{{orderNumber}}`     | Order reference number |
| `{{businessName}}`    | Store/business name    |
| `{{deliveryAddress}}` | Delivery location      |
| `{{riderName}}`       | Assigned rider's name  |
| `{{trackingLink}}`    | Order tracking URL     |
| `{{estimatedTime}}`   | Expected delivery time |
| `{{failureReason}}`   | Why delivery failed    |
| `{{items}}`           | Order items summary    |
| `{{totalAmount}}`     | Order total            |

### Order Activity Logging

Every status change creates an activity record:

```typescript
interface OrderActivity {
  id: string;
  order_id: string;
  tenant_id: string;
  event_type: DeliveryNotificationEvent;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  actor_type: "system" | "vendor" | "rider" | "customer";
  actor_id?: string;
  actor_name?: string;
  is_customer_visible: boolean;
  is_vendor_visible: boolean;
  notification_sent: boolean;
  created_at: string;
}
```

---

## Database Schema

**Migration:** `supabase/migrations/005_delivery_logistics.sql`

### Tables

#### `delivery_zones`

```sql
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  free_delivery_threshold DECIMAL(12,2),
  estimated_minutes INTEGER,
  boundaries JSONB,           -- GeoJSON polygon
  postal_codes TEXT[],
  is_active BOOLEAN DEFAULT true,
  synced BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `riders`

```sql
CREATE TABLE riders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  photo_url TEXT,
  vehicle_type TEXT CHECK (IN ('motorcycle', 'bicycle', 'car', 'foot')),
  vehicle_number TEXT,
  status TEXT CHECK (IN ('available', 'busy', 'offline')),
  current_location JSONB,
  employment_type TEXT CHECK (IN ('full_time', 'part_time', 'freelance')),
  commission_rate DECIMAL(5,2),
  fixed_rate DECIMAL(12,2),
  id_number TEXT,
  id_type TEXT,
  id_verified BOOLEAN DEFAULT false,
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  synced BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `delivery_assignments`

```sql
CREATE TABLE delivery_assignments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  rider_id UUID NOT NULL REFERENCES riders(id),
  status TEXT CHECK (IN ('assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')),
  assigned_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  route JSONB DEFAULT '[]',
  delivery_photo_url TEXT,
  recipient_name TEXT,
  signature_url TEXT,
  delivery_notes TEXT,
  delivery_fee DECIMAL(12,2) DEFAULT 0,
  rider_earnings DECIMAL(12,2) DEFAULT 0,
  tip_amount DECIMAL(12,2) DEFAULT 0,
  customer_rating INTEGER CHECK (1-5),
  customer_feedback TEXT,
  failure_reason TEXT,
  synced BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `rider_location_history`

```sql
CREATE TABLE rider_location_history (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rider_id UUID NOT NULL REFERENCES riders(id),
  assignment_id UUID REFERENCES delivery_assignments(id),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  speed DECIMAL(8, 2),
  heading DECIMAL(5, 2),
  created_at TIMESTAMPTZ
);
```

#### `rider_payouts`

```sql
CREATE TABLE rider_payouts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rider_id UUID NOT NULL REFERENCES riders(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  total_tips DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  net_payout DECIMAL(12,2) DEFAULT 0,
  status TEXT CHECK (IN ('pending', 'processing', 'paid', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Orders Table Extensions

```sql
-- Added columns to orders table for delivery support
ALTER TABLE orders ADD COLUMN delivery_zone_id UUID REFERENCES delivery_zones(id);
ALTER TABLE orders ADD COLUMN rider_id UUID REFERENCES riders(id);
ALTER TABLE orders ADD COLUMN tracking_code TEXT;
ALTER TABLE orders ADD COLUMN estimated_delivery_at TIMESTAMPTZ;
```

### Indexes

```sql
-- Delivery Zones
CREATE INDEX idx_delivery_zones_tenant ON delivery_zones(tenant_id);
CREATE INDEX idx_delivery_zones_active ON delivery_zones(tenant_id, is_active);

-- Riders
CREATE INDEX idx_riders_tenant ON riders(tenant_id);
CREATE INDEX idx_riders_status ON riders(tenant_id, status);
CREATE INDEX idx_riders_active ON riders(tenant_id, is_active);
CREATE INDEX idx_riders_phone ON riders(phone);

-- Delivery Assignments
CREATE INDEX idx_delivery_assignments_tenant ON delivery_assignments(tenant_id);
CREATE INDEX idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_rider ON delivery_assignments(rider_id);
CREATE INDEX idx_delivery_assignments_status ON delivery_assignments(tenant_id, status);

-- Location History
CREATE INDEX idx_rider_location_history_rider ON rider_location_history(rider_id);
CREATE INDEX idx_rider_location_history_assignment ON rider_location_history(assignment_id);
CREATE INDEX idx_rider_location_history_created ON rider_location_history(created_at);
```

### Row Level Security

All tables have RLS enabled with tenant-based policies ensuring data isolation.

---

## API & Store Reference

### State Management

The delivery system uses Zustand stores with IndexedDB persistence:

| Store                        | File                | Purpose                  |
| ---------------------------- | ------------------- | ------------------------ |
| `useDeliveryZoneStore`       | deliveryStore.ts    | Delivery zone management |
| `useRiderStore`              | deliveryStore.ts    | Rider management         |
| `useDeliveryAssignmentStore` | deliveryStore.ts    | Assignment management    |
| `useRiderPortalStore`        | riderPortalStore.ts | Rider portal state       |

### Components

| Component                  | Location             | Purpose                    |
| -------------------------- | -------------------- | -------------------------- |
| `DeliveryOptions`          | components/pos/      | POS fulfillment selection  |
| `DeliveryMap`              | components/maps/     | Interactive zone/rider map |
| `DeliveryDashboardWidgets` | components/delivery/ | Dashboard stats            |
| `RiderStatusBoard`         | components/delivery/ | Rider availability display |
| `DeliveryPerformanceGauge` | components/delivery/ | Performance metrics        |

### Route Configuration

```typescript
// Delivery Management Routes
/delivery/zones          → DeliveryZonesPage
/delivery/riders         → RidersPage
/delivery/assignments    → DeliveryAssignmentsPage

// Rider Portal Routes
/rider/login            → RiderLoginPage
/rider                  → RiderDashboardPage
/rider/deliveries       → RiderDeliveriesPage
/rider/delivery/:id     → RiderDeliveryDetailPage
/rider/history          → RiderHistoryPage
/rider/earnings         → RiderEarningsPage
/rider/profile          → RiderProfilePage

// Public Tracking
/track/:trackingCode    → TrackingPage
```

---

## Feature Status

### ✅ Working Features

| Feature                | Status     | Notes                  |
| ---------------------- | ---------- | ---------------------- |
| Delivery zones         | ✅ Working | CRUD with coordinates  |
| Zone fee calculation   | ✅ Working | By polygon             |
| Rider management       | ✅ Working | Add, status updates    |
| Delivery assignments   | ✅ Working | Assign order to rider  |
| Map integration        | ✅ Working | Zone drawing           |
| Rider portal           | ✅ Working | Separate UI/auth       |
| Order tracking page    | ✅ Working | Public tracking        |
| Delivery notifications | ✅ Working | WhatsApp/SMS           |
| Earnings tracking      | ✅ Working | Commission/fixed rates |

### ⚫ Not Yet Built

| Feature                  | Priority | Notes               |
| ------------------------ | -------- | ------------------- |
| Real-time GPS tracking   | High     | Live map updates    |
| Route optimization       | Medium   | Suggest best routes |
| Proof of delivery photos | Medium   | Photo upload        |
| Digital signatures       | Medium   | Signature capture   |
| External delivery APIs   | Low      | Kwik, Gokada, MAX   |

---

## Future Roadmap

### Phase 3.4: Advanced Tracking

- [ ] Live GPS tracking on map
- [ ] ETA recalculation based on traffic
- [ ] Geofence notifications
- [ ] Customer can see rider approaching

### Phase 3.5: Proof of Delivery

- [ ] Photo capture at delivery
- [ ] Digital signature pad
- [ ] Timestamp and location verification
- [ ] Delivery confirmation workflow

### Phase 3.6: Route Optimization

- [ ] Multi-stop route planning
- [ ] Optimal order assignment
- [ ] Traffic-aware routing
- [ ] Batch delivery grouping

### Phase 3.7: External Integrations

- [ ] Kwik Delivery API
- [ ] Gokada integration
- [ ] MAX.ng integration
- [ ] Generic webhook support

### Phase 3.8: Analytics & Reporting

- [ ] Delivery performance reports
- [ ] Zone profitability analysis
- [ ] Rider leaderboards
- [ ] Customer satisfaction metrics

---

## Training Resources

The delivery module includes comprehensive training content:

**Module 6.1: Delivery Management**

- Duration: 30-35 minutes
- Level: 🟡 Intermediate

**Topics Covered:**

1. Delivery Setup (zones, fees, time slots)
2. Order Delivery (assigning, tracking, notifications)
3. Rider Management (adding, assignments, performance)

**Learning Outcomes:**

- Configure delivery options
- Track deliveries end-to-end
- Manage delivery team effectively

---

## Support & Troubleshooting

### Common Issues

1. **Tracking code not found**
   - Ensure order has `fulfillment_type = 'delivery'`
   - Tracking codes are auto-generated on order creation

2. **Rider not receiving assignments**
   - Check rider `is_active` and `status`
   - Verify rider is linked to correct tenant

3. **Notifications not sending**
   - Verify WhatsApp/SMS provider configuration
   - Check customer phone number format

4. **Zone not calculating fee**
   - Ensure zone has `is_active = true`
   - Verify polygon coordinates are valid

### Related Documentation

- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - Full system roadmap
- [COMPREHENSIVE_SYSTEM_AUDIT.md](./COMPREHENSIVE_SYSTEM_AUDIT.md) - System audit
- [TRAINING_MODULE_PLAN.md](./TRAINING_MODULE_PLAN.md) - Training content

---

_This document is maintained by the Warehouse POS development team._
