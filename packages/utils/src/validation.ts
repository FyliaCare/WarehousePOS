import { z } from 'zod';

// ============================================
// ZOD VALIDATION SCHEMAS
// Runtime validation at boundaries
// ============================================

// ==========================================
// BASE SCHEMAS
// ==========================================

export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits');

export const pinSchema = z.string().length(4, 'PIN must be 4 digits').regex(/^\d+$/, 'PIN must contain only numbers');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const countrySchema = z.enum(['GH', 'NG']);

// ==========================================
// PRODUCT SCHEMAS
// ==========================================

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(1000).optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  barcode: z.string().max(50).optional(),
  cost_price: z.number().min(0, 'Cost price cannot be negative'),
  selling_price: z.number().min(0.01, 'Selling price must be greater than 0'),
  compare_price: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_inclusive: z.boolean().default(false),
  unit: z.string().default('piece'),
  track_stock: z.boolean().default(true),
  min_stock_level: z.number().int().min(0).default(0),
  category_id: z.string().uuid().optional(),
  image_url: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  has_variants: z.boolean().default(false),
  variant_options: z.array(z.object({
    name: z.string(),
    values: z.array(z.string()),
  })).default([]),
  show_online: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// ==========================================
// CUSTOMER SCHEMAS
// ==========================================

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  credit_limit: z.number().min(0).default(0),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ==========================================
// SALE SCHEMAS
// ==========================================

export const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  name: z.string(),
  sku: z.string(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
});

export const createSaleSchema = z.object({
  store_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_code: z.string().optional(),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  payment_method: z.enum(['cash', 'card', 'momo', 'transfer', 'credit']),
  payment_reference: z.string().optional(),
  amount_paid: z.number().min(0),
  change_given: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

// ==========================================
// ORDER SCHEMAS
// ==========================================

export const createOrderSchema = z.object({
  store_id: z.string().uuid(),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: phoneSchema,
  customer_email: emailSchema.optional(),
  order_type: z.enum(['delivery', 'pickup']),
  delivery_address: z.string().optional(),
  delivery_city: z.string().optional(),
  delivery_latitude: z.number().optional(),
  delivery_longitude: z.number().optional(),
  delivery_notes: z.string().max(500).optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  delivery_fee: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  payment_method: z.enum(['cash', 'card', 'momo', 'transfer', 'credit']).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    if (data.order_type === 'delivery') {
      return !!data.delivery_address;
    }
    return true;
  },
  {
    message: 'Delivery address is required for delivery orders',
    path: ['delivery_address'],
  }
);

// ==========================================
// AUTH SCHEMAS
// ==========================================

export const loginWithPhoneSchema = z.object({
  country: countrySchema,
  phone: phoneSchema,
});

export const verifyOTPSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const loginWithPINSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
});

export const loginWithEmailSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  country: countrySchema,
  phone: phoneSchema,
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema.optional(),
  pin: pinSchema,
});

export const registerWithEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  country: countrySchema,
  phone: phoneSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ==========================================
// STOCK SCHEMAS
// ==========================================

export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  store_id: z.string().uuid(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

// ==========================================
// RIDER SCHEMAS
// ==========================================

export const createRiderSchema = z.object({
  name: z.string().min(1, 'Rider name is required').max(200),
  phone: phoneSchema,
  email: emailSchema.optional(),
  vehicle_type: z.enum(['bicycle', 'motorcycle', 'car', 'van']).default('motorcycle'),
  vehicle_number: z.string().max(20).optional(),
});

export const updateRiderSchema = createRiderSchema.partial();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Validate data against a schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return { success: false, errors };
}

/**
 * Get first validation error message
 */
export function getFirstError(
  schema: z.ZodSchema,
  data: unknown
): string | null {
  const result = schema.safeParse(data);

  if (result.success) {
    return null;
  }

  return result.error.errors[0]?.message || 'Validation failed';
}

// ==========================================
// SCHEMA ALIASES (for convenience)
// ==========================================

export const loginSchema = loginWithEmailSchema;
export const productSchema = createProductSchema;
export const customerSchema = createCustomerSchema;

// ==========================================
// TYPE EXPORTS
// ==========================================

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;
export type LoginWithPINInput = z.infer<typeof loginWithPINSchema>;
export type RegisterInput = z.infer<typeof registerWithEmailSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type SaleInput = z.infer<typeof createSaleSchema>;
export type OrderInput = z.infer<typeof createOrderSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type RiderInput = z.infer<typeof createRiderSchema>;
