/**
 * Phase 9: Health & Wellness Business Categories
 * 
 * 4 business types for health and wellness industry:
 * 1. Pharmacy / Drug Store
 * 2. Herbal / Traditional Medicine
 * 3. Medical Equipment & Supplies
 * 4. Optical / Eye Care
 */

import type { BusinessCategory } from './types';

export const HEALTH_WELLNESS_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. PHARMACY / DRUG STORE
  // ============================================
  {
    id: 'pharmacy',
    name: 'Pharmacy / Drug Store',
    description: 'Prescription medicines, OTC drugs, and health products',
    icon: 'Pill',
    emoji: '💊',
    sector: 'health_wellness',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['pharmacy', 'drugs', 'medicine', 'prescription', 'health', 'OTC'],
    defaultUnits: ['piece', 'pack', 'bottle', 'strip', 'box'],
    defaultCategories: [
      { name: 'Prescription Drugs', icon: '📋', description: 'Prescription medicines' },
      { name: 'OTC Medicines', icon: '💊', description: 'Over-the-counter drugs' },
      { name: 'Pain Relief', icon: '🩹', description: 'Analgesics, pain killers' },
      { name: 'Antibiotics', icon: '💉', description: 'Anti-infectives' },
      { name: 'Vitamins & Supplements', icon: '🍊', description: 'Nutritional supplements' },
      { name: 'First Aid', icon: '🩹', description: 'Bandages, antiseptics' },
      { name: 'Baby Care', icon: '👶', description: 'Infant health products' },
      { name: 'Personal Care', icon: '🧴', description: 'Health & hygiene' },
    ],
    productFields: [
      {
        name: 'drug_type',
        label: 'Drug Type',
        type: 'select',
        required: true,
        options: ['Prescription (POM)', 'Over The Counter (OTC)', 'Pharmacy Only (P)', 'Supplement/Vitamin', 'Medical Device', 'First Aid', 'Personal Care'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'generic_name',
        label: 'Generic Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., Paracetamol, Amoxicillin',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'brand_name',
        label: 'Brand Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Panadol, Augmentin',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'dosage_form',
        label: 'Dosage Form',
        type: 'select',
        required: true,
        options: ['Tablet', 'Capsule', 'Syrup/Suspension', 'Injection', 'Cream/Ointment', 'Drops (Eye/Ear)', 'Inhaler', 'Suppository', 'Powder', 'Patch', 'Other'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'strength',
        label: 'Strength/Dosage',
        type: 'text',
        required: false,
        placeholder: 'e.g., 500mg, 250mg/5ml',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'pack_size',
        label: 'Pack Size',
        type: 'text',
        required: true,
        placeholder: 'e.g., 10 tablets, 100ml bottle',
        sortOrder: 6,
        group: 'pricing'
      },
      {
        name: 'manufacturer',
        label: 'Manufacturer',
        type: 'text',
        required: false,
        placeholder: 'e.g., Emzor, GSK, Pfizer',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'expiry_date',
        label: 'Expiry Date',
        type: 'date',
        required: true,
        sortOrder: 8,
        group: 'details'
      },
      {
        name: 'nafdac_number',
        label: 'NAFDAC Number',
        type: 'text',
        required: false,
        placeholder: 'e.g., A4-1234',
        sortOrder: 9,
        group: 'details'
      },
      {
        name: 'storage',
        label: 'Storage Conditions',
        type: 'select',
        required: false,
        options: ['Room Temperature', 'Cool & Dry', 'Refrigerate (2-8°C)', 'Freeze', 'Protect from Light'],
        sortOrder: 10,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 2. HERBAL / TRADITIONAL MEDICINE
  // ============================================
  {
    id: 'herbal_medicine',
    name: 'Herbal / Traditional Medicine',
    description: 'Herbal remedies, traditional medicines, and natural products',
    icon: 'Leaf',
    emoji: '🌿',
    sector: 'health_wellness',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['herbal', 'traditional', 'natural', 'alternative', 'medicine', 'herbs'],
    defaultUnits: ['bottle', 'pack', 'sachet', 'piece', 'kg'],
    defaultCategories: [
      { name: 'Herbal Drinks', icon: '🍵', description: 'Teas, tonics, bitters' },
      { name: 'Capsules/Tablets', icon: '💊', description: 'Herbal supplements' },
      { name: 'Topical', icon: '🧴', description: 'Balms, oils, creams' },
      { name: 'Raw Herbs', icon: '🌿', description: 'Dried herbs, roots' },
      { name: 'Traditional Prep', icon: '🫖', description: 'Agbo, native remedies' },
      { name: 'Weight Management', icon: '⚖️', description: 'Slimming products' },
      { name: 'Sexual Health', icon: '💪', description: 'Performance products' },
      { name: 'Immune Boosters', icon: '🛡️', description: 'Immunity support' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Herbal Tea/Drink', 'Bitters/Tonic', 'Capsule/Tablet', 'Powder', 'Oil', 'Cream/Balm', 'Raw Herb', 'Traditional Preparation', 'Mixed/Combo'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand/Producer',
        type: 'text',
        required: false,
        placeholder: 'e.g., Yem-Kem, Pax Herbal, Local Producer',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'main_ingredients',
        label: 'Main Ingredients',
        type: 'text',
        required: false,
        placeholder: 'e.g., Moringa, Neem, Ginger, Bitter Leaf',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'health_benefit',
        label: 'Health Benefit/Use',
        type: 'multiselect',
        required: false,
        options: ['General Wellness', 'Immune Support', 'Digestive Health', 'Pain Relief', 'Malaria/Fever', 'Diabetes Support', 'Blood Pressure', 'Weight Loss', 'Energy/Vitality', 'Sexual Health', 'Skin/Beauty', 'Detox/Cleanse'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size/Quantity',
        type: 'text',
        required: true,
        placeholder: 'e.g., 500ml, 60 capsules, 200g',
        sortOrder: 5,
        group: 'pricing'
      },
      {
        name: 'dosage_instructions',
        label: 'Dosage Instructions',
        type: 'text',
        required: false,
        placeholder: 'e.g., 2 caps daily, 50ml morning & night',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'nafdac_status',
        label: 'NAFDAC Status',
        type: 'select',
        required: false,
        options: ['NAFDAC Registered', 'NAFDAC Pending', 'Not Registered', 'Traditional/Local'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'expiry_date',
        label: 'Expiry Date',
        type: 'date',
        required: false,
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. MEDICAL EQUIPMENT & SUPPLIES
  // ============================================
  {
    id: 'medical_equipment',
    name: 'Medical Equipment & Supplies',
    description: 'Medical devices, hospital supplies, and healthcare equipment',
    icon: 'Stethoscope',
    emoji: '🩺',
    sector: 'health_wellness',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['medical', 'equipment', 'hospital', 'supplies', 'devices', 'healthcare'],
    defaultUnits: ['piece', 'box', 'pack', 'set'],
    defaultCategories: [
      { name: 'Diagnostic', icon: '🩺', description: 'BP monitors, thermometers' },
      { name: 'Mobility Aids', icon: '🦽', description: 'Wheelchairs, walkers' },
      { name: 'Surgical', icon: '🔪', description: 'Surgical instruments' },
      { name: 'Consumables', icon: '🧤', description: 'Gloves, syringes, masks' },
      { name: 'Monitoring', icon: '📊', description: 'Glucose meters, oximeters' },
      { name: 'Respiratory', icon: '💨', description: 'Nebulizers, oxygen' },
      { name: 'Hospital Furniture', icon: '🛏️', description: 'Beds, trolleys' },
      { name: 'Lab Equipment', icon: '🔬', description: 'Laboratory devices' },
    ],
    productFields: [
      {
        name: 'equipment_type',
        label: 'Equipment Type',
        type: 'select',
        required: true,
        options: ['Diagnostic Device', 'Monitoring Device', 'Mobility Aid', 'Surgical Instrument', 'Consumable/Disposable', 'Respiratory Equipment', 'Hospital Furniture', 'Lab Equipment', 'First Aid', 'PPE'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Omron, Accu-Chek, Philips',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'model',
        label: 'Model',
        type: 'text',
        required: false,
        placeholder: 'e.g., M3, Active, ProSeries',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'specification',
        label: 'Specification',
        type: 'text',
        required: false,
        placeholder: 'e.g., Digital, Automatic, 100-test strips',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'use_type',
        label: 'Use Type',
        type: 'select',
        required: false,
        options: ['Home Use', 'Professional/Clinical', 'Hospital', 'Laboratory', 'Both Home & Clinical'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'pack_quantity',
        label: 'Pack Quantity',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1 unit, Box of 100, Pack of 50',
        sortOrder: 6,
        group: 'pricing'
      },
      {
        name: 'certification',
        label: 'Certification',
        type: 'multiselect',
        required: false,
        options: ['CE Marked', 'FDA Approved', 'ISO Certified', 'NAFDAC Registered', 'WHO Approved'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '3 Months', '6 Months', '1 Year', '2 Years', 'Manufacturer Warranty'],
        sortOrder: 8,
        group: 'details'
      },
      {
        name: 'expiry_date',
        label: 'Expiry Date (for consumables)',
        type: 'date',
        required: false,
        sortOrder: 9,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. OPTICAL / EYE CARE
  // ============================================
  {
    id: 'optical',
    name: 'Optical / Eye Care',
    description: 'Eyeglasses, contact lenses, and vision care products',
    icon: 'Glasses',
    emoji: '👓',
    sector: 'health_wellness',
    isServiceBased: true,
    pricingModel: 'per_item',
    tags: ['optical', 'glasses', 'eyewear', 'lenses', 'vision', 'eye care'],
    defaultUnits: ['piece', 'pair', 'box'],
    defaultCategories: [
      { name: 'Prescription Glasses', icon: '👓', description: 'Rx eyeglasses' },
      { name: 'Sunglasses', icon: '🕶️', description: 'Sun protection eyewear' },
      { name: 'Contact Lenses', icon: '👁️', description: 'Soft and hard lenses' },
      { name: 'Reading Glasses', icon: '📖', description: 'Ready readers' },
      { name: 'Frames Only', icon: '🖼️', description: 'Empty frames' },
      { name: 'Lenses Only', icon: '⭕', description: 'Replacement lenses' },
      { name: 'Eye Care', icon: '💧', description: 'Drops, solutions' },
      { name: 'Eye Test', icon: '📋', description: 'Vision examination' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Complete Glasses (Frame + Lens)', 'Frame Only', 'Lens Only', 'Sunglasses', 'Contact Lens', 'Reading Glasses', 'Eye Drops/Solution', 'Eye Test Service', 'Accessories'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Ray-Ban, Gucci, Essilor',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'frame_material',
        label: 'Frame Material',
        type: 'select',
        required: false,
        options: ['N/A', 'Metal', 'Plastic/Acetate', 'Titanium', 'TR90/Flexible', 'Wood', 'Rimless', 'Semi-Rimless'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'lens_type',
        label: 'Lens Type',
        type: 'select',
        required: false,
        options: ['N/A', 'Single Vision', 'Bifocal', 'Progressive/Multifocal', 'Blue Light Filter', 'Photochromic (Transitions)', 'Polarized', 'Non-Prescription'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'lens_material',
        label: 'Lens Material',
        type: 'select',
        required: false,
        options: ['N/A', 'Plastic (CR-39)', 'Polycarbonate', 'High Index 1.67', 'High Index 1.74', 'Glass'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'lens_coating',
        label: 'Lens Coating',
        type: 'multiselect',
        required: false,
        options: ['None', 'Anti-Reflective', 'Scratch Resistant', 'UV Protection', 'Blue Light Block', 'Hydrophobic', 'Anti-Fog'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'prescription_required',
        label: 'Prescription',
        type: 'select',
        required: false,
        options: ['Not Required', 'Required (Customer Provides)', 'Eye Test Included', 'Ready-Made Power'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: false,
        options: ['Unisex', 'Men', 'Women', 'Kids'],
        sortOrder: 8,
        group: 'variants'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Black, Gold, Tortoise',
        sortOrder: 9,
        group: 'variants'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['Ready Stock', 'Same Day', '24 Hours', '2-3 Days', '1 Week', '2 Weeks'],
        sortOrder: 10,
        group: 'details'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getHealthWellnessCategory(id: string): BusinessCategory | undefined {
  return HEALTH_WELLNESS_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const HEALTH_WELLNESS_IDS = HEALTH_WELLNESS_CATEGORIES.map(cat => cat.id);
