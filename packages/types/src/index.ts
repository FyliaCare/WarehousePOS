// ============================================
// WAREHOUSEPOS SHARED TYPES
// Generated from database schema + additional app types
// ============================================

// ==========================================
// ENUMS (matching database)
// ==========================================

export type CountryCode = 'GH' | 'NG';

export type Currency = 'GHS' | 'NGN';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'rider';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled';

export type BillingPeriod = 'monthly' | 'yearly';

export type OrderType = 'delivery' | 'pickup';

export type PaymentMethod = 'cash' | 'card' | 'momo' | 'transfer' | 'credit';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type SaleStatus = 'pending' | 'completed' | 'voided' | 'refunded';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export type DeliveryStatus = 
  | 'assigned' 
  | 'accepted' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

export type RiderStatus = 'online' | 'offline' | 'busy';

export type VehicleType = 'bicycle' | 'motorcycle' | 'car' | 'van';

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer' | 'return';

export type NotificationChannel = 'sms' | 'whatsapp' | 'email' | 'push';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export type DiscountType = 'percentage' | 'fixed';

// ==========================================
// DATABASE ENTITY TYPES
// ==========================================

// Base type for all entities
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Soft-deletable entity
export interface SoftDeletable {
  deleted_at: string | null;
}

// ==========================================
// PLATFORM
// ==========================================

export interface PlatformConfig {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  price_ghs: number;
  price_ngn: number;
  billing_period: BillingPeriod;
  features: string[];
  limits: PlanLimits;
  is_active: boolean;
  sort_order: number;
}

export interface PlanLimits {
  products: number;
  staff: number;
  stores: number;
}

// ==========================================
// TENANT
// ==========================================

export interface Tenant extends BaseEntity, SoftDeletable {
  name: string;
  slug: string;
  logo_url?: string;
  
  // Country & localization
  country: CountryCode;
  currency: string;
  timezone: string;
  phone_country_code: string;
  default_tax_rate: number;
  
  // Contact
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  
  // Subscription
  plan_id?: string;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  
  // Features
  features_enabled: Record<string, boolean>;
  country_config: CountryConfig;
  
  is_active: boolean;
}

export interface CountryConfig {
  sms_provider: 'mnotify' | 'termii';
  payment_methods: PaymentMethod[];
  momo_providers?: string[];
}

// ==========================================
// STORE
// ==========================================

export interface Store extends BaseEntity, SoftDeletable {
  tenant_id: string;
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  is_main: boolean;
  is_active: boolean;
  portal_enabled?: boolean;
  delivery_fee?: number;
  operating_hours: OperatingHours;
  
  // Relations (populated by joins)
  tenant?: Tenant;
}

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

// ==========================================
// USER
// ==========================================

export interface User extends BaseEntity, SoftDeletable {
  tenant_id: string;
  auth_id?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  pin_hash?: string;
  role: UserRole;
  permissions: string[];
  store_id?: string;
  is_active: boolean;
  last_login_at?: string;
  
  // Relations (populated by joins)
  tenant?: Tenant;
  store?: Store;
}

// ==========================================
// CATEGORY
// ==========================================

export interface Category extends BaseEntity, SoftDeletable {
  tenant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  color: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
}

// ==========================================
// PRODUCT
// ==========================================

export interface Product extends BaseEntity, SoftDeletable {
  tenant_id: string;
  category_id?: string;
  
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  
  cost_price: number;
  selling_price: number;
  compare_price?: number;
  
  tax_rate: number;
  tax_inclusive: boolean;
  
  unit: string;
  track_stock: boolean;
  min_stock_level: number;
  
  image_url?: string;
  images: string[];
  
  has_variants: boolean;
  variant_options: VariantOption[];
  
  show_online: boolean;
  is_active: boolean;
  
  // Relations (optional, for joined queries)
  category?: Category;
  variants?: ProductVariant[];
  stock_level?: number;
  stock_quantity?: number; // Computed from stock_levels table
}

export interface VariantOption {
  name: string;
  values: string[];
}

export interface ProductVariant extends BaseEntity, SoftDeletable {
  tenant_id: string;
  product_id: string;
  name: string;
  sku: string;
  barcode?: string;
  cost_price?: number;
  selling_price: number;
  options: Record<string, string>;
  image_url?: string;
  is_active: boolean;
}

// ==========================================
// STOCK
// ==========================================

export interface StockLevel extends BaseEntity {
  tenant_id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  reserved_quantity: number;
}

export interface StockMovement {
  id: string;
  tenant_id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  user_id?: string;
  type: StockMovementType;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  notes?: string;
  created_at: string;
}

// ==========================================
// CUSTOMER
// ==========================================

export interface Customer extends BaseEntity, SoftDeletable {
  tenant_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  default_latitude?: number;
  default_longitude?: number;
  credit_limit: number;
  credit_balance: number;
  loyalty_points: number;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
}

export interface CustomerAddress extends BaseEntity {
  tenant_id: string;
  customer_id: string;
  label: string;
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
}

// ==========================================
// SALE
// ==========================================

export interface Sale extends BaseEntity {
  tenant_id: string;
  store_id: string;
  user_id?: string;
  customer_id?: string;
  sale_number: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discount_type?: DiscountType;
  discount_code?: string;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  amount_paid: number;
  change_given: number;
  status: SaleStatus;
  voided_at?: string;
  voided_by?: string;
  void_reason?: string;
  notes?: string;
  synced_at?: string;
  
  // Relations
  customer?: Customer;
  user?: User;
  store?: Store;
}

export interface SaleItem {
  product_id: string;
  variant_id?: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

// ==========================================
// ORDER
// ==========================================

export interface Order extends BaseEntity {
  tenant_id: string;
  store_id: string;
  customer_id?: string;
  order_number: string;
  
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  
  order_type: OrderType;
  delivery_address?: string;
  delivery_city?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_notes?: string;
  
  items: SaleItem[];
  
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total: number;
  
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference?: string;
  
  status: OrderStatus;
  
  confirmed_at?: string;
  preparing_at?: string;
  ready_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  
  cancelled_by?: string;
  cancel_reason?: string;
  
  source: string;
  notes?: string;
  
  // Relations
  customer?: Customer;
  store?: Store;
  delivery_assignment?: DeliveryAssignment;
}

// ==========================================
// DELIVERY
// ==========================================

export interface Rider extends BaseEntity, SoftDeletable {
  tenant_id: string;
  user_id?: string;
  name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  vehicle_type: VehicleType;
  vehicle_number?: string;
  status: RiderStatus;
  current_latitude?: number;
  current_longitude?: number;
  last_location_at?: string;
  total_deliveries: number;
  total_earnings: number;
  average_rating: number;
  is_active: boolean;
}

export interface DeliveryAssignment extends BaseEntity {
  tenant_id: string;
  order_id: string;
  rider_id: string;
  status: DeliveryStatus;
  assigned_at: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  distance_km?: number;
  duration_minutes?: number;
  delivery_fee?: number;
  rider_earnings?: number;
  customer_rating?: number;
  customer_feedback?: string;
  notes?: string;
  
  // Relations
  rider?: Rider;
  order?: Order;
}

export interface DeliveryZone extends BaseEntity {
  tenant_id: string;
  store_id?: string;
  name: string;
  coordinates: [number, number][];
  delivery_fee: number;
  min_order_amount: number;
  estimated_minutes: number;
  is_active: boolean;
}

// ==========================================
// NOTIFICATION
// ==========================================

export interface NotificationTemplate extends BaseEntity {
  tenant_id?: string;
  name: string;
  slug: string;
  sms_content?: string;
  whatsapp_template_name?: string;
  email_subject?: string;
  email_content?: string;
  push_title?: string;
  push_body?: string;
  variables: string[];
  is_active: boolean;
}

export interface Notification {
  id: string;
  tenant_id: string;
  recipient_type: string;
  recipient_id?: string;
  recipient_phone?: string;
  recipient_email?: string;
  channel: NotificationChannel;
  template_id?: string;
  content: string;
  reference_type?: string;
  reference_id?: string;
  status: NotificationStatus;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

// ==========================================
// SUPPORT
// ==========================================

export interface SupportTicket extends BaseEntity {
  tenant_id: string;
  user_id?: string;
  ticket_number: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assigned_to?: string;
  resolved_at?: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin' | 'system';
  sender_id?: string;
  message: string;
  attachments: string[];
  created_at: string;
}

// ==========================================
// APP-SPECIFIC TYPES
// ==========================================

// Cart (POS)
export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  customer?: Customer;
  subtotal: number;
  discount: number;
  discount_type?: DiscountType;
  discount_code?: string;
  tax: number;
  total: number;
}

// Dashboard Stats
export interface DashboardStats {
  today_sales: number;
  today_orders: number;
  today_revenue: number;
  pending_orders: number;
  low_stock_count: number;
  active_riders: number;
}

// API Response
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Filter params
export interface ProductFilters extends PaginationParams {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  show_online?: boolean;
  low_stock?: boolean;
}

export interface SaleFilters extends PaginationParams {
  search?: string;
  store_id?: string;
  user_id?: string;
  customer_id?: string;
  status?: SaleStatus;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
}

export interface OrderFilters extends PaginationParams {
  search?: string;
  store_id?: string;
  status?: OrderStatus;
  order_type?: OrderType;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
}

// Form Inputs
export interface CreateProductInput {
  tenant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  compare_price?: number;
  tax_rate?: number;
  tax_inclusive?: boolean;
  unit?: string;
  track_stock?: boolean;
  min_stock_level?: number;
  image_url?: string;
  images?: string[];
  has_variants?: boolean;
  variant_options?: VariantOption[];
  show_online?: boolean;
}

export interface CreateSaleInput {
  tenant_id: string;
  store_id: string;
  user_id?: string;
  customer_id?: string;
  items: SaleItem[];
  subtotal: number;
  discount?: number;
  discount_type?: DiscountType;
  discount_code?: string;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  amount_paid: number;
  change_given?: number;
  notes?: string;
}

export interface CreateOrderInput {
  tenant_id: string;
  store_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: OrderType;
  delivery_address?: string;
  delivery_city?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_notes?: string;
  items: SaleItem[];
  subtotal: number;
  discount?: number;
  delivery_fee?: number;
  tax: number;
  total: number;
  payment_method?: PaymentMethod;
  source?: string;
  notes?: string;
}

// ==========================================
// DATABASE TYPE (Supabase compatibility)
// ==========================================

// Helper type for database inserts - makes most fields optional since DB has defaults
export type InsertType<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>> & {
  // Only require the essential fields for each table (override in specific tables)
};

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>> & {
          name: string;
          slug: string;
          country: CountryCode;
        };
        Update: Partial<Omit<Tenant, 'id'>>;
      };
      users: {
        Row: User;
        Insert: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> & {
          id: string; // Required - maps to auth.users
          tenant_id: string;
          phone: string;
          full_name: string;
          role: UserRole;
        };
        Update: Partial<Omit<User, 'id'>>;
      };
      stores: {
        Row: Store;
        Insert: Partial<Omit<Store, 'id' | 'created_at' | 'updated_at'>> & {
          tenant_id: string;
          name: string;
        };
        Update: Partial<Omit<Store, 'id'>>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>> & {
          tenant_id: string;
          name: string;
        };
        Update: Partial<Omit<Category, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>> & {
          tenant_id: string;
          store_id: string;
          name: string;
          price: number;
        };
        Update: Partial<Omit<Product, 'id'>>;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: Partial<Omit<ProductVariant, 'id' | 'created_at'>> & {
          product_id: string;
          name: string;
        };
        Update: Partial<Omit<ProductVariant, 'id'>>;
      };
      stock_levels: {
        Row: StockLevel;
        Insert: Partial<Omit<StockLevel, 'id' | 'created_at' | 'updated_at'>> & {
          product_id: string;
          store_id: string;
        };
        Update: Partial<Omit<StockLevel, 'id'>>;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>> & {
          tenant_id: string;
          phone: string;
        };
        Update: Partial<Omit<Customer, 'id'>>;
      };
      sales: {
        Row: Sale;
        Insert: Partial<Omit<Sale, 'id' | 'created_at' | 'updated_at'>> & {
          tenant_id: string;
          store_id: string;
        };
        Update: Partial<Omit<Sale, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>> & {
          tenant_id: string;
          store_id: string;
        };
        Update: Partial<Omit<Order, 'id'>>;
      };
      riders: {
        Row: Rider;
        Insert: Partial<Omit<Rider, 'id' | 'created_at' | 'updated_at'>> & {
          tenant_id: string;
          store_id: string;
          user_id: string;
        };
        Update: Partial<Omit<Rider, 'id'>>;
      };
      delivery_assignments: {
        Row: DeliveryAssignment;
        Insert: Partial<Omit<DeliveryAssignment, 'id' | 'created_at' | 'updated_at'>> & {
          order_id: string;
          rider_id: string;
        };
        Update: Partial<Omit<DeliveryAssignment, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      country_code: CountryCode;
      user_role: UserRole;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      sale_status: SaleStatus;
      order_status: OrderStatus;
    };
  };
}
