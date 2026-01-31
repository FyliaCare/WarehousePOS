/**
 * useBusinessCategory Hook
 * 
 * React hook to get business category configuration based on tenant's business_type.
 * Provides access to product fields, default categories, and other business-specific settings.
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  getBusinessCategory,
  getCategoriesBySector,
  searchBusinessCategories,
  ALL_BUSINESS_CATEGORIES,
  INDUSTRY_SECTORS,
  type BusinessCategory,
  type IndustrySector,
  type ProductFieldConfig,
  type DefaultCategory,
} from '../../../../packages/shared/src/data/business-categories';

interface UseBusinessCategoryReturn {
  /** The current business category based on tenant's business_type */
  businessCategory: BusinessCategory | null;
  /** All available business categories */
  allCategories: BusinessCategory[];
  /** Industry sectors for grouping */
  sectors: typeof INDUSTRY_SECTORS;
  /** Get categories by sector */
  getCategoriesBySector: (sector: IndustrySector) => BusinessCategory[];
  /** Search categories */
  searchCategories: (query: string) => BusinessCategory[];
  /** Whether the business is service-based */
  isServiceBased: boolean;
  /** Product fields specific to this business type */
  productFields: ProductFieldConfig[];
  /** Suggested default categories for this business */
  defaultCategories: DefaultCategory[];
  /** Default units for this business type */
  defaultUnits: string[];
  /** The pricing model (per_item, per_weight, etc.) */
  pricingModel: BusinessCategory['pricingModel'] | null;
  /** Loading state */
  isLoading: boolean;
}

export function useBusinessCategory(): UseBusinessCategoryReturn {
  const { tenant, isLoading } = useAuthStore();
  
  const businessCategory = useMemo(() => {
    if (!tenant?.business_type) return null;
    return getBusinessCategory(tenant.business_type) || null;
  }, [tenant?.business_type]);

  return {
    businessCategory,
    allCategories: ALL_BUSINESS_CATEGORIES,
    sectors: INDUSTRY_SECTORS,
    getCategoriesBySector,
    searchCategories: searchBusinessCategories,
    isServiceBased: businessCategory?.isServiceBased ?? false,
    productFields: businessCategory?.productFields ?? [],
    defaultCategories: businessCategory?.defaultCategories ?? [],
    defaultUnits: businessCategory?.defaultUnits ?? ['piece', 'kg', 'box'],
    pricingModel: businessCategory?.pricingModel ?? null,
    isLoading,
  };
}

/**
 * Get the icon component for a business category
 * Returns the emoji as fallback if Lucide icon isn't available
 */
export function getBusinessIcon(category: BusinessCategory | null): string {
  if (!category) return '📦';
  return category.emoji;
}

/**
 * Format pricing model for display
 */
export function formatPricingModel(model: BusinessCategory['pricingModel']): string {
  const labels: Record<BusinessCategory['pricingModel'], string> = {
    per_item: 'Per Item',
    per_weight: 'Per Weight (kg)',
    per_hour: 'Per Hour',
    per_service: 'Per Service',
    per_person: 'Per Person',
    per_sqm: 'Per Square Meter',
  };
  return labels[model] || 'Per Item';
}

export type { BusinessCategory, IndustrySector, ProductFieldConfig, DefaultCategory };
