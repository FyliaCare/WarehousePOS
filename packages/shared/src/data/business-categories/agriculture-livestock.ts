/**
 * Phase 8: Agriculture & Livestock Business Categories
 * 
 * 5 business types for agriculture and livestock industry:
 * 1. Farm Produce / Agro Store
 * 2. Livestock / Poultry Farm
 * 3. Agricultural Inputs
 * 4. Animal Feed Store
 * 5. Aquaculture / Fish Farm
 */

import type { BusinessCategory } from './types';

export const AGRICULTURE_LIVESTOCK_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. FARM PRODUCE / AGRO STORE
  // ============================================
  {
    id: 'farm_produce',
    name: 'Farm Produce / Agro Store',
    description: 'Fresh farm produce, vegetables, fruits, and grains',
    icon: 'Wheat',
    emoji: '🌾',
    sector: 'agriculture_livestock',
    isServiceBased: false,
    pricingModel: 'per_weight',
    tags: ['farm', 'produce', 'vegetables', 'fruits', 'grains', 'organic', 'fresh'],
    defaultUnits: ['kg', 'bag', 'basket', 'crate', 'bunch', 'piece'],
    defaultCategories: [
      { name: 'Vegetables', icon: '🥬', description: 'Fresh vegetables' },
      { name: 'Fruits', icon: '🍎', description: 'Fresh fruits' },
      { name: 'Grains & Cereals', icon: '🌾', description: 'Rice, maize, wheat' },
      { name: 'Tubers', icon: '🥔', description: 'Yam, cassava, potatoes' },
      { name: 'Legumes', icon: '🫘', description: 'Beans, groundnuts, cowpeas' },
      { name: 'Spices & Herbs', icon: '🌿', description: 'Local spices and herbs' },
      { name: 'Palm Products', icon: '🌴', description: 'Palm oil, kernel' },
      { name: 'Processed', icon: '📦', description: 'Garri, flour, processed' },
    ],
    productFields: [
      {
        name: 'produce_type',
        label: 'Produce Type',
        type: 'select',
        required: true,
        options: ['Vegetable', 'Fruit', 'Grain/Cereal', 'Tuber', 'Legume', 'Spice/Herb', 'Oil/Palm Product', 'Processed', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'freshness',
        label: 'Freshness',
        type: 'select',
        required: false,
        options: ['Fresh (Same Day)', 'Fresh (1-2 Days)', 'Fresh (3-5 Days)', 'Dried', 'Processed', 'Frozen'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'origin',
        label: 'Origin/Source',
        type: 'text',
        required: false,
        placeholder: 'e.g., Local Farm, Northern Nigeria, Imported',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'organic',
        label: 'Organic',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Organically grown without chemicals',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'unit_of_sale',
        label: 'Unit of Sale',
        type: 'select',
        required: true,
        options: ['Per Kg', 'Per Bag', 'Per Basket', 'Per Crate', 'Per Bunch', 'Per Piece', 'Per Dozen', 'Per Mudu/Tin'],
        sortOrder: 5,
        group: 'pricing'
      },
      {
        name: 'weight_per_unit',
        label: 'Weight per Unit (if applicable)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 50kg bag, 25kg basket',
        sortOrder: 6,
        group: 'pricing'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1 bag, 5kg',
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'storage_advice',
        label: 'Storage',
        type: 'select',
        required: false,
        options: ['Room Temperature', 'Cool & Dry', 'Refrigerate', 'Freeze', 'Use Immediately'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 2. LIVESTOCK / POULTRY FARM
  // ============================================
  {
    id: 'livestock_poultry',
    name: 'Livestock / Poultry Farm',
    description: 'Live animals, poultry, and animal products',
    icon: 'Bird',
    emoji: '🐔',
    sector: 'agriculture_livestock',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['livestock', 'poultry', 'chicken', 'goat', 'cattle', 'eggs', 'farm'],
    defaultUnits: ['piece', 'kg', 'crate', 'dozen'],
    defaultCategories: [
      { name: 'Poultry - Live', icon: '🐔', description: 'Live chickens, turkeys' },
      { name: 'Poultry - Dressed', icon: '🍗', description: 'Processed poultry' },
      { name: 'Eggs', icon: '🥚', description: 'Fresh eggs' },
      { name: 'Goats', icon: '🐐', description: 'Live goats' },
      { name: 'Sheep/Ram', icon: '🐏', description: 'Live sheep and rams' },
      { name: 'Cattle', icon: '🐄', description: 'Live cattle' },
      { name: 'Pigs', icon: '🐷', description: 'Live pigs' },
      { name: 'Day-Old Chicks', icon: '🐣', description: 'DOC for rearing' },
    ],
    productFields: [
      {
        name: 'animal_type',
        label: 'Animal Type',
        type: 'select',
        required: true,
        options: ['Chicken (Broiler)', 'Chicken (Layer)', 'Chicken (Local/Noiler)', 'Turkey', 'Duck', 'Guinea Fowl', 'Goat', 'Sheep/Ram', 'Cattle', 'Pig', 'Rabbit', 'Day-Old Chicks', 'Eggs', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['Live', 'Dressed/Processed', 'Cut Pieces', 'Frozen'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'weight_size',
        label: 'Weight/Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1.5-2kg, Medium, Large',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'age',
        label: 'Age (for live animals)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 6 weeks, 3 months, Mature',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'breed',
        label: 'Breed',
        type: 'text',
        required: false,
        placeholder: 'e.g., Arbor Acres, Kuroiler, West African Dwarf',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'vaccination',
        label: 'Vaccination Status',
        type: 'select',
        required: false,
        options: ['N/A', 'Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'unit_of_sale',
        label: 'Unit of Sale',
        type: 'select',
        required: true,
        options: ['Per Bird/Animal', 'Per Kg (Live Weight)', 'Per Kg (Dressed)', 'Per Crate (Eggs)', 'Per Dozen', 'Per 100'],
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order',
        type: 'text',
        required: false,
        placeholder: 'e.g., 10 birds, 1 crate',
        sortOrder: 8,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 3. AGRICULTURAL INPUTS
  // ============================================
  {
    id: 'agricultural_inputs',
    name: 'Agricultural Inputs',
    description: 'Seeds, fertilizers, pesticides, and farming equipment',
    icon: 'Sprout',
    emoji: '🌱',
    sector: 'agriculture_livestock',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['seeds', 'fertilizer', 'pesticide', 'farming', 'agriculture', 'inputs', 'equipment'],
    defaultUnits: ['kg', 'bag', 'litre', 'piece', 'packet'],
    defaultCategories: [
      { name: 'Seeds', icon: '🌱', description: 'Planting seeds' },
      { name: 'Fertilizers', icon: '🧪', description: 'NPK, Urea, organic' },
      { name: 'Pesticides', icon: '🐛', description: 'Insecticides, herbicides' },
      { name: 'Farm Tools', icon: '🔧', description: 'Hoes, cutlasses, etc.' },
      { name: 'Irrigation', icon: '💧', description: 'Pipes, sprinklers' },
      { name: 'Greenhouses', icon: '🏡', description: 'Greenhouse materials' },
      { name: 'Packaging', icon: '📦', description: 'Bags, crates, storage' },
      { name: 'Machinery', icon: '🚜', description: 'Farm machinery' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Seeds', 'Fertilizer', 'Pesticide/Herbicide', 'Farm Tool', 'Irrigation Equipment', 'Greenhouse Material', 'Packaging', 'Machinery', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Monsanto, Notore, Indorama',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'crop_type',
        label: 'Crop Type (for seeds)',
        type: 'text',
        required: false,
        placeholder: 'e.g., Maize, Rice, Tomato, Pepper',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'composition',
        label: 'Composition (for fertilizers)',
        type: 'text',
        required: false,
        placeholder: 'e.g., NPK 15:15:15, Urea 46-0-0',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'size_weight',
        label: 'Size/Weight',
        type: 'text',
        required: true,
        placeholder: 'e.g., 50kg bag, 1 litre, 500g',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'application',
        label: 'Application Method',
        type: 'select',
        required: false,
        options: ['N/A', 'Foliar Spray', 'Soil Application', 'Seed Treatment', 'Irrigation', 'Manual'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'expiry_date',
        label: 'Expiry/Best Before',
        type: 'date',
        required: false,
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'certification',
        label: 'Certification',
        type: 'select',
        required: false,
        options: ['NAFDAC Approved', 'SON Certified', 'Imported (Licensed)', 'Not Certified'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. ANIMAL FEED STORE
  // ============================================
  {
    id: 'animal_feed',
    name: 'Animal Feed Store',
    description: 'Poultry feed, livestock feed, and feed ingredients',
    icon: 'Package',
    emoji: '🌽',
    sector: 'agriculture_livestock',
    isServiceBased: false,
    pricingModel: 'per_weight',
    tags: ['feed', 'poultry', 'livestock', 'animal feed', 'concentrate', 'premix'],
    defaultUnits: ['kg', 'bag', 'ton'],
    defaultCategories: [
      { name: 'Poultry Feed', icon: '🐔', description: 'Chicken, turkey feed' },
      { name: 'Fish Feed', icon: '🐟', description: 'Floating, sinking feed' },
      { name: 'Cattle Feed', icon: '🐄', description: 'Dairy, beef cattle' },
      { name: 'Pig Feed', icon: '🐷', description: 'Pig and swine feed' },
      { name: 'Goat/Sheep Feed', icon: '🐐', description: 'Small ruminant feed' },
      { name: 'Concentrates', icon: '🧪', description: 'Feed concentrates' },
      { name: 'Premixes', icon: '💊', description: 'Vitamin premixes' },
      { name: 'Raw Materials', icon: '🌾', description: 'Maize, soya, GNC' },
    ],
    productFields: [
      {
        name: 'feed_type',
        label: 'Feed Type',
        type: 'select',
        required: true,
        options: ['Starter Feed', 'Grower Feed', 'Finisher Feed', 'Layer Feed', 'Broiler Feed', 'Fish Feed (Floating)', 'Fish Feed (Sinking)', 'Cattle Feed', 'Pig Feed', 'Goat/Sheep Feed', 'Concentrate', 'Premix', 'Raw Material'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'animal_type',
        label: 'Animal Type',
        type: 'select',
        required: true,
        options: ['Poultry (Broiler)', 'Poultry (Layer)', 'Poultry (General)', 'Fish (Catfish)', 'Fish (Tilapia)', 'Fish (General)', 'Cattle', 'Pig', 'Goat/Sheep', 'Rabbit', 'General/Multi'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Top Feeds, Vital Feeds, CHI, Hybrid',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'weight',
        label: 'Weight',
        type: 'select',
        required: true,
        options: ['1kg', '5kg', '10kg', '15kg', '25kg', '50kg', 'Per Kg (Loose)'],
        sortOrder: 4,
        group: 'pricing'
      },
      {
        name: 'protein_content',
        label: 'Protein Content',
        type: 'text',
        required: false,
        placeholder: 'e.g., 18%, 21%, 45%',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'pellet_size',
        label: 'Pellet Size (for fish feed)',
        type: 'select',
        required: false,
        options: ['N/A', '1mm', '2mm', '3mm', '4mm', '6mm', '9mm', 'Mash/Powder'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'manufacturing_date',
        label: 'Manufacturing Date',
        type: 'date',
        required: false,
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1 bag, 5 bags',
        sortOrder: 8,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 5. AQUACULTURE / FISH FARM
  // ============================================
  {
    id: 'aquaculture',
    name: 'Aquaculture / Fish Farm',
    description: 'Fish farming, fingerlings, and aquaculture products',
    icon: 'Fish',
    emoji: '🐟',
    sector: 'agriculture_livestock',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['fish', 'aquaculture', 'catfish', 'tilapia', 'fingerlings', 'pond', 'seafood'],
    defaultUnits: ['kg', 'piece', 'per 100', 'per 1000'],
    defaultCategories: [
      { name: 'Live Fish', icon: '🐟', description: 'Table-size live fish' },
      { name: 'Processed Fish', icon: '🍣', description: 'Smoked, dried, fresh' },
      { name: 'Fingerlings', icon: '🐠', description: 'Juvenile fish for stocking' },
      { name: 'Juveniles', icon: '🐡', description: 'Post-fingerlings' },
      { name: 'Broodstock', icon: '🐋', description: 'Breeding fish' },
      { name: 'Equipment', icon: '🔧', description: 'Pond equipment, aerators' },
      { name: 'Pond Liners', icon: '🛡️', description: 'Tarpaulin, geomembrane' },
      { name: 'Consultancy', icon: '📋', description: 'Farm setup services' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Live Fish (Table Size)', 'Processed Fish', 'Fingerlings', 'Juveniles', 'Post Juveniles', 'Broodstock', 'Equipment', 'Pond Liner', 'Consultancy/Service'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'fish_species',
        label: 'Fish Species',
        type: 'select',
        required: true,
        options: ['Catfish (Clarias)', 'Catfish (Heterobranchus)', 'Catfish (Heteroclarias)', 'Tilapia', 'Mackerel', 'Carp', 'Other', 'N/A'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size_weight',
        label: 'Size/Weight',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1kg, 500g-800g, 2-3 inches',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: false,
        options: ['Live', 'Fresh (Gutted)', 'Fresh (Whole)', 'Smoked', 'Dried', 'Frozen', 'N/A'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'unit_of_sale',
        label: 'Unit of Sale',
        type: 'select',
        required: true,
        options: ['Per Kg', 'Per Fish', 'Per 100', 'Per 500', 'Per 1000', 'Per Piece', 'Per SQM'],
        sortOrder: 5,
        group: 'pricing'
      },
      {
        name: 'survival_rate',
        label: 'Survival Rate (for fingerlings)',
        type: 'select',
        required: false,
        options: ['N/A', '80%+', '85%+', '90%+', '95%+', 'Guaranteed'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'source',
        label: 'Source/Hatchery',
        type: 'text',
        required: false,
        placeholder: 'e.g., Own Hatchery, NIOMR, Partner Farm',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order',
        type: 'text',
        required: false,
        placeholder: 'e.g., 100 fingerlings, 10kg',
        sortOrder: 8,
        group: 'pricing'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getAgricultureLivestockCategory(id: string): BusinessCategory | undefined {
  return AGRICULTURE_LIVESTOCK_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const AGRICULTURE_LIVESTOCK_IDS = AGRICULTURE_LIVESTOCK_CATEGORIES.map(cat => cat.id);
