/**
 * Phase 7: Building & Construction Business Categories
 * 
 * 6 business types for building and construction industry:
 * 1. Building Materials Store
 * 2. Paint & Coatings Shop
 * 3. Tiles & Flooring
 * 4. Plumbing Supplies
 * 5. Electrical Supplies
 * 6. Interior Design / Decoration
 */

import type { BusinessCategory } from './types';

export const BUILDING_CONSTRUCTION_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. BUILDING MATERIALS STORE
  // ============================================
  {
    id: 'building_materials',
    name: 'Building Materials Store',
    description: 'Cement, blocks, roofing, iron rods, and construction supplies',
    icon: 'Building2',
    emoji: '🧱',
    sector: 'building_construction',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['building', 'construction', 'cement', 'blocks', 'roofing', 'iron rods', 'hardware'],
    defaultUnits: ['bag', 'piece', 'bundle', 'ton', 'trip', 'length'],
    defaultCategories: [
      { name: 'Cement', icon: '🧱', description: 'Cement bags' },
      { name: 'Blocks', icon: '⬛', description: 'Concrete blocks' },
      { name: 'Iron Rods', icon: '🔩', description: 'Reinforcement bars' },
      { name: 'Roofing', icon: '🏠', description: 'Roofing sheets, materials' },
      { name: 'Sand & Gravel', icon: '⛰️', description: 'Aggregates' },
      { name: 'Timber/Wood', icon: '🪵', description: 'Structural wood' },
      { name: 'Nails & Fasteners', icon: '📍', description: 'Nails, screws, bolts' },
      { name: 'Doors & Windows', icon: '🚪', description: 'Frames and fittings' },
      { name: 'Tools', icon: '🔨', description: 'Construction tools' },
    ],
    productFields: [
      {
        name: 'material_type',
        label: 'Material Type',
        type: 'select',
        required: true,
        options: ['Cement', 'Blocks', 'Iron Rods', 'Roofing Sheets', 'Sand', 'Gravel/Granite', 'Timber', 'Nails/Fasteners', 'POP/Plaster', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Dangote, BUA, Lafarge',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size_specification',
        label: 'Size/Specification',
        type: 'text',
        required: true,
        placeholder: 'e.g., 50kg, 6 inches, 12mm, 0.45mm',
        helpText: 'Size, thickness, diameter as applicable',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'grade_quality',
        label: 'Grade/Quality',
        type: 'select',
        required: false,
        options: ['Standard', 'Premium', 'Grade A', 'Grade B', 'Industrial', 'Commercial'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'unit_of_sale',
        label: 'Unit of Sale',
        type: 'select',
        required: true,
        options: ['Per Bag', 'Per Piece', 'Per Bundle', 'Per Length', 'Per Trip', 'Per Ton', 'Per Square Meter', 'Per Dozen'],
        sortOrder: 5,
        group: 'pricing'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order',
        type: 'text',
        required: false,
        placeholder: 'e.g., 10 bags, 1 trip',
        sortOrder: 6,
        group: 'pricing'
      },
      {
        name: 'delivery_available',
        label: 'Delivery',
        type: 'select',
        required: false,
        options: ['Pickup Only', 'Delivery Available', 'Free Delivery (Min Order)', 'Delivery Extra'],
        sortOrder: 7,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 2. PAINT & COATINGS SHOP
  // ============================================
  {
    id: 'paint_shop',
    name: 'Paint & Coatings Shop',
    description: 'Paints, varnishes, and surface finishing products',
    icon: 'Paintbrush',
    emoji: '🎨',
    sector: 'building_construction',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['paint', 'coating', 'emulsion', 'gloss', 'primer', 'varnish'],
    defaultUnits: ['litre', 'gallon', 'bucket', 'tin'],
    defaultCategories: [
      { name: 'Emulsion Paint', icon: '🎨', description: 'Water-based wall paint' },
      { name: 'Gloss/Oil Paint', icon: '✨', description: 'Oil-based paint' },
      { name: 'Textured Paint', icon: '🧱', description: 'Textured coatings' },
      { name: 'Primers', icon: '🔲', description: 'Undercoats and primers' },
      { name: 'Wood Finishes', icon: '🪵', description: 'Varnish, stain, polish' },
      { name: 'Specialty', icon: '⭐', description: 'Anti-rust, waterproof' },
      { name: 'Tools', icon: '🖌️', description: 'Brushes, rollers, trays' },
      { name: 'Accessories', icon: '🔧', description: 'Thinners, fillers, tape' },
    ],
    productFields: [
      {
        name: 'paint_type',
        label: 'Paint Type',
        type: 'select',
        required: true,
        options: ['Emulsion (Matt)', 'Emulsion (Silk/Satin)', 'Gloss/Oil Paint', 'Textured Paint', 'Primer/Undercoat', 'Varnish', 'Wood Stain', 'Anti-Rust Paint', 'Road Marking Paint', 'Spray Paint'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Dulux, Berger, CAP, Sandtex',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: true,
        placeholder: 'e.g., White, Cream, Brilliant White',
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: true,
        options: ['250ml', '500ml', '1 Litre', '4 Litres', '10 Litres', '20 Litres', '25 Litres'],
        sortOrder: 4,
        group: 'variants'
      },
      {
        name: 'finish',
        label: 'Finish',
        type: 'select',
        required: false,
        options: ['Matt/Flat', 'Silk/Satin', 'Semi-Gloss', 'Gloss', 'Textured', 'Metallic'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'coverage',
        label: 'Coverage',
        type: 'text',
        required: false,
        placeholder: 'e.g., 10-12 sqm per litre',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'application',
        label: 'Application',
        type: 'select',
        required: false,
        options: ['Interior', 'Exterior', 'Interior & Exterior', 'Wood', 'Metal', 'Concrete'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'color_mixing',
        label: 'Color Mixing',
        type: 'select',
        required: false,
        options: ['Ready Mixed', 'Custom Mix Available', 'Tinting Base'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. TILES & FLOORING
  // ============================================
  {
    id: 'tiles_flooring',
    name: 'Tiles & Flooring',
    description: 'Ceramic tiles, floor tiles, and flooring materials',
    icon: 'Grid3x3',
    emoji: '🔲',
    sector: 'building_construction',
    isServiceBased: false,
    pricingModel: 'per_sqm',
    tags: ['tiles', 'flooring', 'ceramic', 'porcelain', 'granite', 'marble'],
    defaultUnits: ['sqm', 'carton', 'piece'],
    defaultCategories: [
      { name: 'Floor Tiles', icon: '🔲', description: 'Floor ceramic/porcelain' },
      { name: 'Wall Tiles', icon: '⬜', description: 'Wall ceramic tiles' },
      { name: 'Granite', icon: '🪨', description: 'Natural granite' },
      { name: 'Marble', icon: '⚪', description: 'Marble tiles and slabs' },
      { name: 'Vinyl/Laminate', icon: '📋', description: 'Vinyl and laminate floors' },
      { name: 'Outdoor/Paving', icon: '🏞️', description: 'Outdoor tiles, interlocks' },
      { name: 'Accessories', icon: '🔧', description: 'Adhesive, grout, spacers' },
      { name: 'Installation', icon: '👷', description: 'Tiling services' },
    ],
    productFields: [
      {
        name: 'tile_type',
        label: 'Tile Type',
        type: 'select',
        required: true,
        options: ['Ceramic', 'Porcelain', 'Granite', 'Marble', 'Vitrified', 'Vinyl/LVT', 'Laminate', 'Interlock/Paving', 'Mosaic'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'application',
        label: 'Application',
        type: 'select',
        required: true,
        options: ['Floor', 'Wall', 'Floor & Wall', 'Outdoor', 'Bathroom', 'Kitchen', 'Commercial'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size (cm)',
        type: 'select',
        required: true,
        options: ['30x30', '40x40', '45x45', '60x60', '80x80', '100x100', '120x60', '30x60', '25x40', 'Custom'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'finish',
        label: 'Finish',
        type: 'select',
        required: false,
        options: ['Glossy', 'Matt', 'Semi-Polished', 'Rustic', 'Textured/Anti-Slip', 'Polished', 'Honed'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'color_pattern',
        label: 'Color/Pattern',
        type: 'text',
        required: false,
        placeholder: 'e.g., White, Wood Look, Marble Effect',
        sortOrder: 5,
        group: 'variants'
      },
      {
        name: 'brand',
        label: 'Brand/Origin',
        type: 'text',
        required: false,
        placeholder: 'e.g., Spanish, Italian, Chinese, Nigerian',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'pieces_per_carton',
        label: 'Pieces per Carton',
        type: 'number',
        required: false,
        placeholder: 'e.g., 4, 6, 8',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'sqm_per_carton',
        label: 'SQM per Carton',
        type: 'number',
        required: false,
        placeholder: 'e.g., 1.44',
        sortOrder: 8,
        group: 'pricing'
      },
      {
        name: 'grade',
        label: 'Grade',
        type: 'select',
        required: false,
        options: ['Grade A (First Quality)', 'Grade B', 'Grade C', 'Commercial Grade'],
        sortOrder: 9,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. PLUMBING SUPPLIES
  // ============================================
  {
    id: 'plumbing_supplies',
    name: 'Plumbing Supplies',
    description: 'Pipes, fittings, sanitary ware, and plumbing materials',
    icon: 'Droplet',
    emoji: '🚿',
    sector: 'building_construction',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['plumbing', 'pipes', 'fittings', 'sanitary', 'bathroom', 'water'],
    defaultUnits: ['piece', 'length', 'set', 'roll'],
    defaultCategories: [
      { name: 'Pipes', icon: '🔧', description: 'PVC, PPR, metal pipes' },
      { name: 'Fittings', icon: '🔩', description: 'Joints, elbows, tees' },
      { name: 'Toilets', icon: '🚽', description: 'WC, cisterns' },
      { name: 'Basins & Sinks', icon: '🚰', description: 'Wash basins, kitchen sinks' },
      { name: 'Taps & Mixers', icon: '🚿', description: 'Faucets and mixers' },
      { name: 'Showers', icon: '🚿', description: 'Shower heads, sets' },
      { name: 'Water Heaters', icon: '🔥', description: 'Heaters and geysers' },
      { name: 'Pumps & Tanks', icon: '⛽', description: 'Water pumps, tanks' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Pipe', 'Fitting', 'Toilet/WC', 'Basin/Sink', 'Tap/Faucet', 'Shower', 'Water Heater', 'Pump', 'Tank', 'Valve', 'Accessories'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['PVC', 'PPR', 'CPVC', 'Galvanized Iron', 'Stainless Steel', 'Copper', 'Ceramic', 'Brass', 'Plastic'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g.,DERA, Grohe, TOTO, Geberit',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1/2 inch, 3/4 inch, 1 inch',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'select',
        required: false,
        options: ['White', 'Chrome', 'Stainless', 'Gold', 'Black', 'Bone/Ivory', 'Other'],
        sortOrder: 5,
        group: 'variants'
      },
      {
        name: 'pressure_rating',
        label: 'Pressure Rating',
        type: 'select',
        required: false,
        options: ['N/A', 'Low Pressure', 'Standard', 'High Pressure'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '6 Months', '1 Year', '2 Years', '5 Years', 'Lifetime'],
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 5. ELECTRICAL SUPPLIES
  // ============================================
  {
    id: 'electrical_supplies',
    name: 'Electrical Supplies',
    description: 'Cables, switches, lighting, and electrical accessories',
    icon: 'Plug',
    emoji: '🔌',
    sector: 'building_construction',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['electrical', 'cables', 'wires', 'switches', 'lighting', 'sockets'],
    defaultUnits: ['piece', 'roll', 'coil', 'meter', 'set'],
    defaultCategories: [
      { name: 'Cables & Wires', icon: '🔌', description: 'Electrical cables' },
      { name: 'Switches & Sockets', icon: '💡', description: 'Wall switches, outlets' },
      { name: 'Lighting', icon: '💡', description: 'Bulbs, fixtures, fittings' },
      { name: 'Distribution', icon: '⚡', description: 'Panels, breakers, MCBs' },
      { name: 'Conduits', icon: '🔧', description: 'PVC pipes, trunking' },
      { name: 'Fans', icon: '🌀', description: 'Ceiling and standing fans' },
      { name: 'Accessories', icon: '🔩', description: 'Junction boxes, clips' },
      { name: 'Tools', icon: '🔧', description: 'Electrical tools, testers' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Cable/Wire', 'Switch', 'Socket/Outlet', 'Light Bulb', 'Light Fixture', 'Distribution Board', 'Breaker/MCB', 'Conduit/Trunking', 'Fan', 'Extension', 'Accessories'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Schneider, ABB, Legrand, Philips',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'specification',
        label: 'Specification',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1.5mm, 2.5mm, 4mm (cables), 13A, 15A (sockets)',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'cable_type',
        label: 'Cable Type (if applicable)',
        type: 'select',
        required: false,
        options: ['N/A', 'Single Core', 'Flat Twin & Earth', 'Flexible', 'Armoured', 'Coaxial', 'Speaker Wire'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'length_quantity',
        label: 'Length/Quantity',
        type: 'text',
        required: false,
        placeholder: 'e.g., 100m roll, 50m coil',
        sortOrder: 5,
        group: 'pricing'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., White, Gold, Black',
        sortOrder: 6,
        group: 'variants'
      },
      {
        name: 'wattage',
        label: 'Wattage (for lighting)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 9W, 15W, 60W equivalent',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'certification',
        label: 'Certification',
        type: 'select',
        required: false,
        options: ['SON Approved', 'CE Certified', 'Standard', 'Not Certified'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 6. INTERIOR DESIGN / DECORATION
  // ============================================
  {
    id: 'interior_design',
    name: 'Interior Design / Decoration',
    description: 'Interior finishing, wallpapers, curtains, and décor items',
    icon: 'Sofa',
    emoji: '🛋️',
    sector: 'building_construction',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['interior', 'design', 'decoration', 'wallpaper', 'curtains', 'ceiling', 'decor'],
    defaultUnits: ['sqm', 'piece', 'roll', 'meter', 'project'],
    defaultCategories: [
      { name: 'Wallpapers', icon: '🎨', description: 'Wall coverings' },
      { name: 'POP/Ceiling', icon: '⬜', description: 'Ceiling designs, POP' },
      { name: 'Curtains & Blinds', icon: '🪟', description: 'Window treatments' },
      { name: 'Flooring', icon: '🔲', description: 'Carpets, rugs, vinyl' },
      { name: 'Furniture', icon: '🛋️', description: 'Custom furniture' },
      { name: 'Lighting Design', icon: '💡', description: 'Decorative lighting' },
      { name: 'Artwork & Decor', icon: '🖼️', description: 'Wall art, accessories' },
      { name: 'Design Services', icon: '📐', description: 'Consultation, design' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Product/Service Type',
        type: 'select',
        required: true,
        options: ['Wallpaper', 'POP/Ceiling', 'Curtains', 'Blinds', 'Carpet/Rug', 'Design Consultation', 'Full Interior Design', '3D Visualization', 'Installation Service', 'Furniture', 'Artwork/Decor'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        required: false,
        options: ['Modern', 'Contemporary', 'Classic', 'Minimalist', 'Traditional', 'Luxury', 'Industrial', 'Bohemian', 'African/Cultural'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'text',
        required: false,
        placeholder: 'e.g., Vinyl, Fabric, Velvet, 3D Panels',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'dimensions',
        label: 'Dimensions/Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., Per SQM, 5m roll, Custom',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'color_pattern',
        label: 'Color/Pattern',
        type: 'text',
        required: false,
        placeholder: 'e.g., Floral, Geometric, Plain',
        sortOrder: 5,
        group: 'variants'
      },
      {
        name: 'installation',
        label: 'Installation',
        type: 'select',
        required: false,
        options: ['Product Only', 'Installation Included', 'Installation Extra', 'Installation Service Only'],
        sortOrder: 6,
        group: 'pricing'
      },
      {
        name: 'room_type',
        label: 'Room Type',
        type: 'select',
        required: false,
        options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Commercial', 'Whole House/Building'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'project_duration',
        label: 'Project Duration',
        type: 'select',
        required: false,
        options: ['N/A', '1 Day', '2-3 Days', '1 Week', '2 Weeks', '1 Month', 'Custom'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getBuildingConstructionCategory(id: string): BusinessCategory | undefined {
  return BUILDING_CONSTRUCTION_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const BUILDING_CONSTRUCTION_IDS = BUILDING_CONSTRUCTION_CATEGORIES.map(cat => cat.id);
