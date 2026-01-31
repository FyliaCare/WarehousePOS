/**
 * BusinessCategoryPicker Component
 * 
 * A beautiful, searchable component for selecting a business type/category.
 * Used in onboarding and settings to let users choose their business type.
 */

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Check, Store, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  ALL_BUSINESS_CATEGORIES,
  INDUSTRY_SECTORS,
  searchBusinessCategories,
  getCategoriesBySector,
  type BusinessCategory,
  type IndustrySector,
} from '../../../../../packages/shared/src/data/business-categories';
import type { CountryCode } from '@warehousepos/types';

// Theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1A1A',
    border: '#E5E7EB',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B40',
    accent: '#1A1A1A',
    textOnPrimary: '#FFFFFF',
    border: '#E5E7EB',
  },
};

interface BusinessCategoryPickerProps {
  value?: string;
  onChange: (categoryId: string) => void;
  onCategorySelected?: (category: BusinessCategory) => void;
  showSearch?: boolean;
  showSectorGroups?: boolean;
  compact?: boolean;
}

export function BusinessCategoryPicker({
  value,
  onChange,
  onCategorySelected,
  showSearch = true,
  showSectorGroups = true,
  compact = false,
}: BusinessCategoryPickerProps) {
  const { tenant } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSectors, setExpandedSectors] = useState<Set<IndustrySector>>(new Set());

  // Get selected category
  const selectedCategory = useMemo(() => {
    if (!value) return null;
    return ALL_BUSINESS_CATEGORIES.find(cat => cat.id === value) || null;
  }, [value]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (searchQuery.trim()) {
      return searchBusinessCategories(searchQuery);
    }
    return ALL_BUSINESS_CATEGORIES;
  }, [searchQuery]);

  // Group categories by sector
  const groupedCategories = useMemo(() => {
    if (!showSectorGroups || searchQuery.trim()) {
      return null; // Show flat list when searching
    }
    
    const groups: Record<IndustrySector, BusinessCategory[]> = {} as any;
    INDUSTRY_SECTORS.forEach(sector => {
      groups[sector.id] = getCategoriesBySector(sector.id);
    });
    return groups;
  }, [showSectorGroups, searchQuery]);

  const toggleSector = (sector: IndustrySector) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) {
        next.delete(sector);
      } else {
        next.add(sector);
      }
      return next;
    });
  };

  const handleSelect = (category: BusinessCategory) => {
    onChange(category.id);
    onCategorySelected?.(category);
  };

  // Render a single category card
  const renderCategoryCard = (category: BusinessCategory) => {
    const isSelected = value === category.id;
    
    return (
      <button
        key={category.id}
        type="button"
        onClick={() => handleSelect(category)}
        className={`
          w-full p-3 rounded-xl border-2 transition-all text-left
          ${isSelected 
            ? 'border-current shadow-md' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }
        `}
        style={isSelected ? { 
          borderColor: theme.primary,
          backgroundColor: theme.primaryLight,
        } : {}}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{category.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">
                {category.name}
              </span>
              {isSelected && (
                <Check 
                  className="w-4 h-4 shrink-0" 
                  style={{ color: theme.primary }}
                />
              )}
            </div>
            {!compact && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
        </div>
        {!compact && (
          <div className="flex flex-wrap gap-1 mt-2">
            {category.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Selected Category Preview */}
      {selectedCategory && (
        <div 
          className="p-4 rounded-xl border-2"
          style={{ 
            borderColor: theme.primary,
            backgroundColor: theme.primaryLight,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedCategory.emoji}</span>
              <div>
                <h3 className="font-bold text-gray-900">{selectedCategory.name}</h3>
                <p className="text-sm text-gray-600">{selectedCategory.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search business types... (e.g., restaurant, barber, tailor)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ 
              borderColor: theme.primaryMid,
              '--tw-ring-color': theme.primary,
            } as React.CSSProperties}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      )}

      {/* Category List */}
      <div className="max-h-[400px] overflow-y-auto rounded-xl border" style={{ borderColor: theme.border }}>
        {/* Grouped by Sector */}
        {groupedCategories && !searchQuery ? (
          <div className="divide-y divide-gray-100">
            {INDUSTRY_SECTORS.map(sector => {
              const sectorCategories = groupedCategories[sector.id];
              const isExpanded = expandedSectors.has(sector.id);
              const hasSelectedCategory = sectorCategories.some(cat => cat.id === value);
              
              return (
                <div key={sector.id}>
                  {/* Sector Header */}
                  <button
                    type="button"
                    onClick={() => toggleSector(sector.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    style={hasSelectedCategory ? { backgroundColor: theme.primaryLight } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{sector.emoji}</span>
                      <div className="text-left">
                        <span className="font-semibold text-gray-900">{sector.name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({sectorCategories.length})
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {/* Sector Categories */}
                  {isExpanded && (
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sectorCategories.map(renderCategoryCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat List (when searching) */
          <div className="p-4">
            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCategories.map(renderCategoryCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No business types found for "{searchQuery}"</p>
                <p className="text-sm mt-1">Try searching with different keywords</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <p className="text-xs text-center text-gray-400">
        {ALL_BUSINESS_CATEGORIES.length} business types available across {INDUSTRY_SECTORS.length} industries
      </p>
    </div>
  );
}

export default BusinessCategoryPicker;
