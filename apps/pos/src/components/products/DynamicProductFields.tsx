/**
 * DynamicProductFields Component
 * 
 * Renders dynamic form fields based on the business type configuration.
 * This allows different business types to have specialized product attributes.
 */

import { useMemo } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import { 
  getBusinessCategory, 
  type ProductFieldConfig 
} from '../../../../../packages/shared/src/data/business-categories';
import type { CountryCode } from '@warehousepos/types';

// Theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    textOnLight: '#6B5A00',
    accent: '#1A1A1A',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#B8E0CC',
    textOnLight: '#004D31',
    accent: '#006B40',
  },
};

interface DynamicProductFieldsProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors?: Record<string, any>;
  group?: 'basic' | 'details' | 'pricing' | 'inventory' | 'variants' | 'custom';
}

export function DynamicProductFields({ 
  register, 
  setValue, 
  watch,
  errors = {},
  group = 'custom',
}: DynamicProductFieldsProps) {
  const { tenant } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];

  // Get business-specific product fields
  const productFields = useMemo<ProductFieldConfig[]>(() => {
    if (!tenant?.business_type) return [];
    const businessCategory = getBusinessCategory(tenant.business_type);
    if (!businessCategory) return [];
    
    // Filter by group if specified
    return businessCategory.productFields.filter(field => 
      !group || field.group === group
    ).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [tenant?.business_type, group]);

  if (productFields.length === 0) return null;

  // Render a single field based on its type
  const renderField = (field: ProductFieldConfig) => {
    const fieldName = `custom_fields.${field.name}`;
    const currentValue = watch(fieldName);

    const commonInputStyles = {
      borderColor: theme.primaryMid,
      backgroundColor: theme.primaryLight,
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={commonInputStyles}
            {...register(fieldName, { required: field.required })}
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={3}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all resize-none"
            style={commonInputStyles}
            {...register(fieldName, { required: field.required })}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={commonInputStyles}
            {...register(fieldName, { 
              required: field.required,
              valueAsNumber: true,
              min: field.min,
              max: field.max,
            })}
          />
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
              {country === 'NG' ? '₦' : 'GH₵'}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={field.placeholder || '0.00'}
              className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
              style={commonInputStyles}
              {...register(fieldName, { 
                required: field.required,
                valueAsNumber: true,
              })}
            />
          </div>
        );

      case 'select':
        return (
          <select
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all appearance-none"
            style={{
              ...commonInputStyles,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
              backgroundRepeat: 'no-repeat',
            }}
            {...register(fieldName, { required: field.required })}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border" style={commonInputStyles}>
              {field.options?.map(option => {
                const isSelected = (currentValue || []).includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      const current = currentValue || [];
                      const updated = isSelected
                        ? current.filter((v: string) => v !== option)
                        : [...current, option];
                      setValue(fieldName, updated);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      isSelected 
                        ? 'text-white border-transparent' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                    style={isSelected ? { backgroundColor: theme.accent } : {}}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'boolean':
        return (
          <button
            type="button"
            onClick={() => setValue(fieldName, !currentValue)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              currentValue ? '' : 'bg-zinc-300'
            }`}
            style={currentValue ? { backgroundColor: theme.primary } : {}}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                currentValue ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );

      case 'date':
        return (
          <input
            type="date"
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={commonInputStyles}
            {...register(fieldName, { required: field.required })}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={commonInputStyles}
            {...register(fieldName, { required: field.required })}
          />
        );

      case 'color':
        return (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              className="w-12 h-12 rounded-lg border-2 cursor-pointer"
              style={{ borderColor: theme.primaryMid }}
              {...register(fieldName)}
            />
            <input
              type="text"
              placeholder="#000000"
              className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
              style={commonInputStyles}
              value={currentValue || ''}
              onChange={(e) => setValue(fieldName, e.target.value)}
            />
          </div>
        );

      case 'weight':
        return (
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
              style={commonInputStyles}
              {...register(`${fieldName}.value`, { 
                required: field.required,
                valueAsNumber: true,
              })}
            />
            <select
              className="w-24 px-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
              style={commonInputStyles}
              {...register(`${fieldName}.unit`)}
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="lb">lb</option>
              <option value="oz">oz</option>
            </select>
          </div>
        );

      case 'dimensions':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Length</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="L"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={commonInputStyles}
                {...register(`${fieldName}.length`, { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Width</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="W"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={commonInputStyles}
                {...register(`${fieldName}.width`, { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Height</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="H"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={commonInputStyles}
                {...register(`${fieldName}.height`, { valueAsNumber: true })}
              />
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={commonInputStyles}
            {...register(fieldName, { required: field.required })}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {productFields.map((field) => (
        <div key={field.name}>
          <label className="flex items-center gap-2 text-sm font-semibold mb-1.5" style={{ color: theme.textOnLight }}>
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.helpText && (
            <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
          )}
          {renderField(field)}
          {errors?.custom_fields?.[field.name] && (
            <p className="text-xs text-red-500 mt-1">This field is required</p>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Hook to get the business-specific product fields
 */
export function useBusinessProductFields(group?: string): ProductFieldConfig[] {
  const { tenant } = useAuthStore();
  
  return useMemo(() => {
    if (!tenant?.business_type) return [];
    const businessCategory = getBusinessCategory(tenant.business_type);
    if (!businessCategory) return [];
    
    return businessCategory.productFields.filter(field => 
      !group || field.group === group
    ).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [tenant?.business_type, group]);
}

export default DynamicProductFields;
