/**
 * Business Categories Index
 * 
 * Central export point for all business categories and types.
 * Import from this file to access the complete category database.
 */

// Types
export * from './types';

// Phase 1: Food & Beverage
export * from './food-beverage';

// Phase 2: Fashion & Retail
export * from './fashion-retail';

// Phase 3: Beauty & Personal Care
export * from './beauty-personal-care';

// Phase 4: Artisan & Crafts
export * from './artisan-crafts';

// Phase 5: Services & Professional
export * from './services-professional';

// Phase 6: Electronics & Technology
export * from './electronics-technology';

// Phase 7: Building & Construction
export * from './building-construction';

// Phase 8: Agriculture & Livestock
export * from './agriculture-livestock';

// Phase 9: Health & Wellness
export * from './health-wellness';

// Phase 10: Miscellaneous
export * from './miscellaneous';

// Import all categories for combined export
import { FOOD_BEVERAGE_CATEGORIES } from './food-beverage';
import { FASHION_RETAIL_CATEGORIES } from './fashion-retail';
import { BEAUTY_PERSONAL_CARE_CATEGORIES } from './beauty-personal-care';
import { ARTISAN_CRAFTS_CATEGORIES } from './artisan-crafts';
import { SERVICES_PROFESSIONAL_CATEGORIES } from './services-professional';
import { ELECTRONICS_TECHNOLOGY_CATEGORIES } from './electronics-technology';
import { BUILDING_CONSTRUCTION_CATEGORIES } from './building-construction';
import { AGRICULTURE_LIVESTOCK_CATEGORIES } from './agriculture-livestock';
import { HEALTH_WELLNESS_CATEGORIES } from './health-wellness';
import { MISCELLANEOUS_CATEGORIES } from './miscellaneous';
import type { BusinessCategory, IndustrySector } from './types';

/**
 * All business categories combined
 * This will grow as more phases are implemented
 */
export const ALL_BUSINESS_CATEGORIES: BusinessCategory[] = [
  ...FOOD_BEVERAGE_CATEGORIES,
  ...FASHION_RETAIL_CATEGORIES,
  ...BEAUTY_PERSONAL_CARE_CATEGORIES,
  ...ARTISAN_CRAFTS_CATEGORIES,
  ...SERVICES_PROFESSIONAL_CATEGORIES,
  ...ELECTRONICS_TECHNOLOGY_CATEGORIES,
  ...BUILDING_CONSTRUCTION_CATEGORIES,
  ...AGRICULTURE_LIVESTOCK_CATEGORIES,
  ...HEALTH_WELLNESS_CATEGORIES,
  ...MISCELLANEOUS_CATEGORIES,
];

/**
 * Get a business category by ID
 */
export function getBusinessCategory(id: string): BusinessCategory | undefined {
  return ALL_BUSINESS_CATEGORIES.find(cat => cat.id === id);
}

/**
 * Get all categories for a specific sector
 */
export function getCategoriesBySector(sector: IndustrySector): BusinessCategory[] {
  return ALL_BUSINESS_CATEGORIES.filter(cat => cat.sector === sector);
}

/**
 * Search categories by name or tags
 */
export function searchBusinessCategories(query: string): BusinessCategory[] {
  const lowerQuery = query.toLowerCase();
  return ALL_BUSINESS_CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(lowerQuery) ||
    cat.description.toLowerCase().includes(lowerQuery) ||
    cat.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): string[] {
  return ALL_BUSINESS_CATEGORIES.map(cat => cat.id);
}

/**
 * Summary statistics
 */
export const CATEGORY_STATS = {
  total: ALL_BUSINESS_CATEGORIES.length,
  bySector: {
    food_beverage: FOOD_BEVERAGE_CATEGORIES.length,
    fashion_retail: FASHION_RETAIL_CATEGORIES.length,
    beauty_personal_care: BEAUTY_PERSONAL_CARE_CATEGORIES.length,
    artisan_crafts: ARTISAN_CRAFTS_CATEGORIES.length,
    services_professional: SERVICES_PROFESSIONAL_CATEGORIES.length,
    electronics_technology: ELECTRONICS_TECHNOLOGY_CATEGORIES.length,
    building_construction: BUILDING_CONSTRUCTION_CATEGORIES.length,
    agriculture_livestock: AGRICULTURE_LIVESTOCK_CATEGORIES.length,
    health_wellness: HEALTH_WELLNESS_CATEGORIES.length,
    miscellaneous: MISCELLANEOUS_CATEGORIES.length,
  }
};
