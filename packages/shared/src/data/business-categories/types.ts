/**
 * Business Categories Type Definitions
 * 
 * These types define the structure for business categories and their
 * associated product field configurations for the WarehousePOS system.
 */

// Field types that can be used in product forms
export type ProductFieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'date'
  | 'time'
  | 'image'
  | 'color'
  | 'weight'
  | 'dimensions';

// Configuration for a single product field
export interface ProductFieldConfig {
  /** Unique field identifier (snake_case) */
  name: string;
  /** Display label for the field */
  label: string;
  /** Type of input control */
  type: ProductFieldType;
  /** Whether the field is required */
  required: boolean;
  /** Options for select/multiselect fields */
  options?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Help text shown below field */
  helpText?: string;
  /** Default value */
  defaultValue?: string | number | boolean;
  /** Minimum value (for number fields) */
  min?: number;
  /** Maximum value (for number fields) */
  max?: number;
  /** Unit of measurement (kg, ml, etc.) */
  unit?: string;
  /** Display order in form */
  sortOrder: number;
  /** Group/section this field belongs to */
  group?: 'basic' | 'details' | 'pricing' | 'inventory' | 'variants' | 'custom' | 'specs';
}

// Default product category suggestion
export interface DefaultCategory {
  name: string;
  icon: string;
  description?: string;
}

// Industry sector grouping
export type IndustrySector = 
  | 'food_beverage'
  | 'fashion_retail'
  | 'beauty_personal_care'
  | 'artisan_crafts'
  | 'services_professional'
  | 'electronics_technology'
  | 'building_construction'
  | 'agriculture_livestock'
  | 'health_wellness'
  | 'miscellaneous';

// Main business category definition
export interface BusinessCategory {
  /** Unique identifier (snake_case) */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Lucide icon name */
  icon: string;
  /** Fallback emoji */
  emoji: string;
  /** Industry sector this belongs to */
  sector: IndustrySector;
  /** Custom product fields for this business type */
  productFields: ProductFieldConfig[];
  /** Suggested default categories for products */
  defaultCategories: DefaultCategory[];
  /** Tags for searchability */
  tags: string[];
  /** Whether this is a service-based business (vs product-based) */
  isServiceBased: boolean;
  /** Whether pricing is typically per unit, per kg, per hour, etc. */
  pricingModel: 'per_item' | 'per_weight' | 'per_hour' | 'per_service' | 'per_person' | 'per_sqm';
  /** Common units of measurement */
  defaultUnits?: string[];
}

// Sector metadata
export interface SectorInfo {
  id: IndustrySector;
  name: string;
  description: string;
  icon: string;
  emoji: string;
}

// Export sector information
export const INDUSTRY_SECTORS: SectorInfo[] = [
  {
    id: 'food_beverage',
    name: 'Food & Beverage',
    description: 'Restaurants, cafes, bakeries, food vendors',
    icon: 'UtensilsCrossed',
    emoji: '🍽️'
  },
  {
    id: 'fashion_retail',
    name: 'Fashion & Retail',
    description: 'Clothing, shoes, accessories, fashion stores',
    icon: 'Shirt',
    emoji: '👗'
  },
  {
    id: 'beauty_personal_care',
    name: 'Beauty & Personal Care',
    description: 'Salons, barbershops, spas, cosmetics',
    icon: 'Sparkles',
    emoji: '💄'
  },
  {
    id: 'artisan_crafts',
    name: 'Artisan & Crafts',
    description: 'Handmade goods, traditional crafts, custom work',
    icon: 'Hammer',
    emoji: '🎨'
  },
  {
    id: 'services_professional',
    name: 'Services & Professional',
    description: 'Repairs, printing, photography, events',
    icon: 'Briefcase',
    emoji: '💼'
  },
  {
    id: 'electronics_technology',
    name: 'Electronics & Technology',
    description: 'Electronics, phones, computers, tech services',
    icon: 'Monitor',
    emoji: '📱'
  },
  {
    id: 'building_construction',
    name: 'Building & Construction',
    description: 'Building materials, contractors, trades',
    icon: 'HardHat',
    emoji: '🏗️'
  },
  {
    id: 'agriculture_livestock',
    name: 'Agriculture & Livestock',
    description: 'Farming, livestock, agricultural supplies',
    icon: 'Tractor',
    emoji: '🌾'
  },
  {
    id: 'health_wellness',
    name: 'Health & Wellness',
    description: 'Pharmacy, medical supplies, wellness',
    icon: 'Heart',
    emoji: '💊'
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    description: 'Other retail and service businesses',
    icon: 'Store',
    emoji: '🏪'
  }
];
