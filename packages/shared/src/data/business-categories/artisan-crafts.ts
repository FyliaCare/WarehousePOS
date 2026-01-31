/**
 * Phase 4: Artisan & Crafts Business Categories
 * 
 * 10 business types for artisan and crafts industry:
 * 1. Carpenter / Furniture Maker
 * 2. Welder / Metal Fabricator
 * 3. Potter / Ceramics
 * 4. Leatherworker
 * 5. Beadwork / Jewelry Maker
 * 6. Shoe Maker / Cobbler
 * 7. Tailor / Seamstress (Traditional)
 * 8. Basket / Mat Weaver
 * 9. Artist / Painter
 * 10. Woodcarver / Sculptor
 */

import type { BusinessCategory } from './types';

export const ARTISAN_CRAFTS_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. CARPENTER / FURNITURE MAKER
  // ============================================
  {
    id: 'carpenter',
    name: 'Carpenter / Furniture Maker',
    description: 'Woodworking, custom furniture, and carpentry services',
    icon: 'Hammer',
    emoji: '🪑',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['carpenter', 'furniture', 'woodwork', 'cabinet', 'joinery', 'wood'],
    defaultUnits: ['piece', 'set', 'unit'],
    defaultCategories: [
      { name: 'Chairs & Seating', icon: '🪑', description: 'Chairs, stools, benches' },
      { name: 'Tables', icon: '🪵', description: 'Dining, coffee, side tables' },
      { name: 'Beds & Frames', icon: '🛏️', description: 'Bed frames and headboards' },
      { name: 'Cabinets & Storage', icon: '🗄️', description: 'Wardrobes, shelves, cabinets' },
      { name: 'Doors & Windows', icon: '🚪', description: 'Interior and exterior doors' },
      { name: 'Kitchen', icon: '🍳', description: 'Kitchen cabinets and counters' },
      { name: 'Office Furniture', icon: '💼', description: 'Desks, bookshelves' },
      { name: 'Custom Work', icon: '✨', description: 'Bespoke items' },
      { name: 'Repairs', icon: '🔧', description: 'Furniture repairs' },
    ],
    productFields: [
      {
        name: 'wood_type',
        label: 'Wood Type',
        type: 'select',
        required: false,
        options: ['Mahogany', 'Oak', 'Teak', 'Pine', 'Plywood', 'MDF', 'Particle Board', 'Odum', 'Iroko', 'Mansonia', 'Mixed/Customer Choice'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'dimensions',
        label: 'Dimensions (L x W x H)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 180cm x 90cm x 75cm',
        helpText: 'Length x Width x Height',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'finish',
        label: 'Finish',
        type: 'select',
        required: false,
        options: ['Natural/Unfinished', 'Varnished', 'Lacquered', 'Painted', 'Polished', 'Stained', 'Matte', 'Glossy'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color/Stain',
        type: 'text',
        required: false,
        placeholder: 'e.g., Dark Brown, Natural, White',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['1-2 Days', '3-5 Days', '1 Week', '2 Weeks', '3-4 Weeks', '1-2 Months'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'installation',
        label: 'Installation',
        type: 'select',
        required: false,
        options: ['Included', 'Available (Extra Cost)', 'Not Available', 'Customer Pickup'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '3 Months', '6 Months', '1 Year', '2 Years'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'custom_design',
        label: 'Custom Design',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Made to customer specifications',
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 2. WELDER / METAL FABRICATOR
  // ============================================
  {
    id: 'welder',
    name: 'Welder / Metal Fabricator',
    description: 'Metal welding, fabrication, gates, and iron works',
    icon: 'Wrench',
    emoji: '🔧',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['welder', 'welding', 'metal', 'fabrication', 'iron', 'gates', 'steel'],
    defaultUnits: ['piece', 'unit', 'meter'],
    defaultCategories: [
      { name: 'Gates', icon: '🚧', description: 'Entrance and compound gates' },
      { name: 'Burglar Proofing', icon: '🔒', description: 'Window and door security' },
      { name: 'Railings', icon: '🛤️', description: 'Staircase and balcony rails' },
      { name: 'Doors', icon: '🚪', description: 'Metal doors and frames' },
      { name: 'Tanks & Stands', icon: '🛢️', description: 'Water tank stands' },
      { name: 'Furniture', icon: '🪑', description: 'Metal furniture' },
      { name: 'Canopies', icon: '⛱️', description: 'Carports and shade structures' },
      { name: 'Custom Work', icon: '✨', description: 'Bespoke fabrication' },
      { name: 'Repairs', icon: '🔧', description: 'Welding repairs' },
    ],
    productFields: [
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: true,
        options: ['Iron/Mild Steel', 'Stainless Steel', 'Aluminum', 'Galvanized Steel', 'Wrought Iron', 'Mixed'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'dimensions',
        label: 'Dimensions',
        type: 'text',
        required: false,
        placeholder: 'e.g., 12ft x 6ft (gate)',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'finish',
        label: 'Finish',
        type: 'select',
        required: false,
        options: ['Painted', 'Powder Coated', 'Galvanized', 'Polished', 'Raw/Unfinished', 'Anti-Rust Treated'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Black, Brown, Grey, Green',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'design_style',
        label: 'Design Style',
        type: 'select',
        required: false,
        options: ['Simple/Plain', 'Standard Pattern', 'Decorative', 'Modern/Contemporary', 'Custom Design'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['Same Day', '1-2 Days', '3-5 Days', '1 Week', '2 Weeks', '3-4 Weeks'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'installation',
        label: 'Installation',
        type: 'select',
        required: false,
        options: ['Included', 'Available (Extra Cost)', 'Not Available'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'automation',
        label: 'Automation (for gates)',
        type: 'select',
        required: false,
        options: ['Manual', 'Automated (Included)', 'Automation Ready', 'Not Applicable'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. POTTER / CERAMICS
  // ============================================
  {
    id: 'pottery',
    name: 'Potter / Ceramics',
    description: 'Handmade pottery, ceramics, and clay works',
    icon: 'Container',
    emoji: '🏺',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['pottery', 'ceramics', 'clay', 'handmade', 'vase', 'pots'],
    defaultUnits: ['piece', 'set'],
    defaultCategories: [
      { name: 'Vases', icon: '🏺', description: 'Decorative vases' },
      { name: 'Bowls', icon: '🥣', description: 'Serving and decorative' },
      { name: 'Plates & Dishes', icon: '🍽️', description: 'Tableware' },
      { name: 'Planters', icon: '🪴', description: 'Flower pots and planters' },
      { name: 'Mugs & Cups', icon: '☕', description: 'Drinkware' },
      { name: 'Sculptures', icon: '🗿', description: 'Decorative pieces' },
      { name: 'Traditional Pots', icon: '🫖', description: 'Cultural and cooking pots' },
      { name: 'Custom Orders', icon: '✨', description: 'Made to order' },
    ],
    productFields: [
      {
        name: 'clay_type',
        label: 'Clay Type',
        type: 'select',
        required: false,
        options: ['Earthenware', 'Stoneware', 'Porcelain', 'Terracotta', 'Local Clay'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: false,
        options: ['Mini/Small', 'Medium', 'Large', 'Extra Large', 'Custom'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'dimensions',
        label: 'Dimensions (if specific)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 30cm height x 20cm diameter',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'glaze_finish',
        label: 'Glaze/Finish',
        type: 'select',
        required: false,
        options: ['Unglazed/Natural', 'Clear Glaze', 'Colored Glaze', 'Matte', 'Glossy', 'Textured', 'Hand-painted'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Earth Brown, Blue, Multi-color',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'handmade',
        label: 'Handmade',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'food_safe',
        label: 'Food Safe',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Safe for food contact',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['Ready Stock', '1 Week', '2 Weeks', '3-4 Weeks'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. LEATHERWORKER
  // ============================================
  {
    id: 'leatherworker',
    name: 'Leatherworker',
    description: 'Handcrafted leather goods, bags, and accessories',
    icon: 'Briefcase',
    emoji: '👝',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['leather', 'handmade', 'bags', 'belts', 'wallet', 'craftsman'],
    defaultUnits: ['piece', 'set'],
    defaultCategories: [
      { name: 'Bags', icon: '👜', description: 'Handbags, totes, duffles' },
      { name: 'Belts', icon: '🥋', description: 'Men\'s and women\'s belts' },
      { name: 'Wallets', icon: '👛', description: 'Wallets and cardholders' },
      { name: 'Sandals', icon: '🩴', description: 'Leather sandals' },
      { name: 'Journal Covers', icon: '📔', description: 'Book and journal covers' },
      { name: 'Accessories', icon: '✨', description: 'Keychains, straps, etc.' },
      { name: 'Custom Work', icon: '🎨', description: 'Bespoke items' },
      { name: 'Repairs', icon: '🔧', description: 'Leather repairs' },
    ],
    productFields: [
      {
        name: 'leather_type',
        label: 'Leather Type',
        type: 'select',
        required: true,
        options: ['Full Grain Leather', 'Top Grain Leather', 'Genuine Leather', 'Bonded Leather', 'Faux/Vegan Leather', 'Suede', 'Nubuck', 'Exotic (Crocodile, Snake)'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'select',
        required: false,
        options: ['Black', 'Brown', 'Tan', 'Cognac', 'Burgundy', 'Navy', 'Natural', 'Custom Color'],
        sortOrder: 2,
        group: 'variants'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., Medium, 32" (belt), 12x8 inches',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'hardware',
        label: 'Hardware Finish',
        type: 'select',
        required: false,
        options: ['Gold', 'Silver', 'Brass', 'Antique Brass', 'Gunmetal', 'None'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'personalization',
        label: 'Personalization',
        type: 'select',
        required: false,
        options: ['None', 'Initials (Included)', 'Initials (Extra)', 'Custom Design (Extra)', 'Full Name (Extra)'],
        helpText: 'Embossing or engraving',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'handmade',
        label: 'Handmade',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['Ready Stock', '3-5 Days', '1 Week', '2 Weeks', '3-4 Weeks'],
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 5. BEADWORK / JEWELRY MAKER
  // ============================================
  {
    id: 'beadwork',
    name: 'Beadwork / Jewelry Maker',
    description: 'Handmade beaded jewelry and African beadwork',
    icon: 'Gem',
    emoji: '📿',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['beads', 'jewelry', 'handmade', 'african', 'traditional', 'necklace'],
    defaultUnits: ['piece', 'set', 'pair'],
    defaultCategories: [
      { name: 'Necklaces', icon: '📿', description: 'Beaded necklaces' },
      { name: 'Bracelets', icon: '⭕', description: 'Wrist beads' },
      { name: 'Earrings', icon: '✨', description: 'Beaded earrings' },
      { name: 'Anklets', icon: '🦶', description: 'Ankle beads' },
      { name: 'Waist Beads', icon: '💃', description: 'Traditional waist beads' },
      { name: 'Sets', icon: '🎁', description: 'Matching sets' },
      { name: 'Bridal', icon: '👰', description: 'Wedding beadwork' },
      { name: 'Traditional', icon: '🏺', description: 'Cultural pieces' },
    ],
    productFields: [
      {
        name: 'bead_type',
        label: 'Bead Type',
        type: 'select',
        required: true,
        options: ['Glass Beads', 'Crystal Beads', 'Seed Beads', 'Wood Beads', 'Coral', 'Pearl', 'Stone/Semi-precious', 'Plastic/Acrylic', 'Metal Beads', 'Mixed'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'color_scheme',
        label: 'Color Scheme',
        type: 'text',
        required: false,
        placeholder: 'e.g., Gold & Red, Multicolor, Blue tones',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'length_size',
        label: 'Length/Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., 18 inches, Adjustable, S/M/L',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        required: false,
        options: ['Traditional African', 'Modern', 'Bohemian', 'Minimalist', 'Statement/Bold', 'Bridal', 'Everyday'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'occasion',
        label: 'Occasion',
        type: 'multiselect',
        required: false,
        options: ['Daily Wear', 'Traditional Ceremony', 'Wedding', 'Party', 'Religious', 'Gift'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'handmade',
        label: 'Handmade',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'custom_colors',
        label: 'Custom Colors Available',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Can be made in customer\'s choice of colors',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['Ready Stock', '1-2 Days', '3-5 Days', '1 Week', '2 Weeks'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 6. SHOE MAKER / COBBLER
  // ============================================
  {
    id: 'shoemaker',
    name: 'Shoe Maker / Cobbler',
    description: 'Custom shoe making, repairs, and traditional footwear',
    icon: 'Footprints',
    emoji: '👞',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['shoes', 'cobbler', 'footwear', 'sandals', 'repair', 'custom'],
    defaultUnits: ['pair', 'piece'],
    defaultCategories: [
      { name: 'Custom Shoes', icon: '👞', description: 'Made to measure shoes' },
      { name: 'Sandals', icon: '🩴', description: 'Handmade sandals' },
      { name: 'Traditional', icon: '🥿', description: 'Native slippers and sandals' },
      { name: 'Repairs', icon: '🔧', description: 'Shoe repairs' },
      { name: 'Resoling', icon: '👟', description: 'Sole replacement' },
      { name: 'Polish/Shine', icon: '✨', description: 'Cleaning and polishing' },
      { name: 'Restoration', icon: '🔄', description: 'Full shoe restoration' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Custom New Shoes', 'Custom Sandals', 'Repair', 'Resoling', 'Polish/Shine', 'Restoration', 'Stretching', 'Dyeing'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'shoe_type',
        label: 'Shoe Type',
        type: 'select',
        required: false,
        options: ['Oxford/Formal', 'Loafer', 'Boot', 'Sandal', 'Slipper', 'Native/Traditional', 'Sneaker', 'Heel', 'Flat'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Leather', 'Suede', 'Canvas', 'Rubber', 'Synthetic', 'Mixed'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'size_range',
        label: 'Size (EU)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 42, 35-46',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Black, Brown, Tan',
        sortOrder: 5,
        group: 'variants'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: false,
        options: ['Men', 'Women', 'Unisex', 'Children'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production/Repair Time',
        type: 'select',
        required: false,
        options: ['Same Day', '24 Hours', '2-3 Days', '1 Week', '2 Weeks', '3-4 Weeks'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '1 Month', '3 Months', '6 Months'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 7. TRADITIONAL TAILOR / SEAMSTRESS
  // ============================================
  {
    id: 'traditional_tailor',
    name: 'Traditional Tailor / Seamstress',
    description: 'Traditional African clothing and native attire specialists',
    icon: 'Scissors',
    emoji: '🧵',
    sector: 'artisan_crafts',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['tailor', 'traditional', 'native', 'agbada', 'kente', 'seamstress'],
    defaultUnits: ['piece', 'set', 'outfit'],
    defaultCategories: [
      { name: 'Agbada', icon: '👘', description: 'Grand Agbada attire' },
      { name: 'Kaftan/Jalabiya', icon: '🥻', description: 'Flowing robes' },
      { name: 'Senator', icon: '👔', description: 'Senator wear' },
      { name: 'Kente Wear', icon: '🎨', description: 'Kente cloth outfits' },
      { name: 'Aso-Oke', icon: '✨', description: 'Aso-Oke styles' },
      { name: 'Women\'s Native', icon: '👗', description: 'Traditional women\'s wear' },
      { name: 'Children\'s', icon: '👶', description: 'Kids traditional wear' },
      { name: 'Bridal', icon: '👰', description: 'Traditional wedding attire' },
    ],
    productFields: [
      {
        name: 'garment_type',
        label: 'Garment Type',
        type: 'select',
        required: true,
        options: ['Agbada (Full Set)', 'Agbada (Top Only)', 'Kaftan', 'Senator', 'Buba & Sokoto', 'Danshiki', 'Aso-Oke Complete', 'Kente Cloth Style', 'Boubou', 'Wrapper Style', 'Blouse/Top', 'Other Traditional'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Men', 'Women', 'Boys', 'Girls'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'fabric_by',
        label: 'Fabric Provided By',
        type: 'select',
        required: false,
        options: ['Customer', 'Tailor (Extra Cost)', 'Included in Price'],
        defaultValue: 'Customer',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'embroidery_level',
        label: 'Embroidery Level',
        type: 'select',
        required: false,
        options: ['No Embroidery', 'Light/Simple', 'Medium', 'Heavy/Elaborate', 'Premium/Signature'],
        helpText: 'Affects pricing significantly',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'embroidery_style',
        label: 'Embroidery Style',
        type: 'select',
        required: false,
        options: ['Machine Embroidery', 'Hand Embroidery', 'Stonework', 'Beadwork', 'Mixed', 'Not Applicable'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'cap_included',
        label: 'Cap/Fila Included',
        type: 'select',
        required: false,
        options: ['Yes - Included', 'Yes - Extra Cost', 'No', 'Not Applicable'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['3-5 Days', '1 Week', '2 Weeks', '3 Weeks', '1 Month'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'rush_available',
        label: 'Rush Service Available',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Express service at extra cost',
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 8. BASKET / MAT WEAVER
  // ============================================
  {
    id: 'weaver',
    name: 'Basket / Mat Weaver',
    description: 'Traditional weaving, baskets, mats, and woven crafts',
    icon: 'Archive',
    emoji: '🧺',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['weaving', 'basket', 'mat', 'raffia', 'traditional', 'handwoven'],
    defaultUnits: ['piece', 'set'],
    defaultCategories: [
      { name: 'Baskets', icon: '🧺', description: 'Storage and decorative' },
      { name: 'Mats', icon: '🟫', description: 'Floor and sleeping mats' },
      { name: 'Bags', icon: '👜', description: 'Woven bags and totes' },
      { name: 'Hats', icon: '👒', description: 'Woven hats and caps' },
      { name: 'Fans', icon: '🪭', description: 'Hand fans' },
      { name: 'Decor', icon: '🏠', description: 'Wall hangings, trivets' },
      { name: 'Furniture', icon: '🪑', description: 'Woven chairs, stools' },
    ],
    productFields: [
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: true,
        options: ['Raffia', 'Straw', 'Palm Fronds', 'Bamboo', 'Cane/Rattan', 'Seagrass', 'Sisal', 'Mixed Natural'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: false,
        options: ['Small', 'Medium', 'Large', 'Extra Large', 'Custom'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'dimensions',
        label: 'Dimensions',
        type: 'text',
        required: false,
        placeholder: 'e.g., 40cm x 30cm, 6ft x 4ft',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'color_pattern',
        label: 'Color/Pattern',
        type: 'text',
        required: false,
        placeholder: 'e.g., Natural, Dyed multicolor, Traditional pattern',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'handwoven',
        label: 'Handwoven',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'use_type',
        label: 'Primary Use',
        type: 'select',
        required: false,
        options: ['Storage', 'Decorative', 'Functional', 'Gift', 'Multipurpose'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['Ready Stock', '1-2 Days', '3-5 Days', '1 Week', '2 Weeks'],
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 9. ARTIST / PAINTER
  // ============================================
  {
    id: 'artist',
    name: 'Artist / Painter',
    description: 'Fine art, paintings, portraits, and murals',
    icon: 'Palette',
    emoji: '🎨',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['art', 'painting', 'artist', 'portrait', 'mural', 'canvas'],
    defaultUnits: ['piece', 'commission'],
    defaultCategories: [
      { name: 'Paintings', icon: '🖼️', description: 'Original paintings' },
      { name: 'Portraits', icon: '👤', description: 'Custom portraits' },
      { name: 'Murals', icon: '🏠', description: 'Wall murals' },
      { name: 'Prints', icon: '📄', description: 'Art prints' },
      { name: 'Digital Art', icon: '💻', description: 'Digital artwork' },
      { name: 'Abstract', icon: '🌀', description: 'Abstract pieces' },
      { name: 'African Art', icon: '🌍', description: 'African themed' },
      { name: 'Commissions', icon: '✨', description: 'Custom artwork' },
    ],
    productFields: [
      {
        name: 'art_type',
        label: 'Art Type',
        type: 'select',
        required: true,
        options: ['Original Painting', 'Portrait', 'Mural', 'Print/Reproduction', 'Digital Art', 'Mixed Media', 'Sketch/Drawing'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'medium',
        label: 'Medium',
        type: 'select',
        required: false,
        options: ['Oil Paint', 'Acrylic', 'Watercolor', 'Charcoal', 'Pencil', 'Pastel', 'Digital', 'Mixed Media', 'Spray Paint'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size (inches or cm)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 24x36 inches, 60x90cm',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        required: false,
        options: ['Realistic', 'Abstract', 'Contemporary', 'Traditional African', 'Pop Art', 'Impressionist', 'Minimalist', 'Surreal'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'framed',
        label: 'Framing',
        type: 'select',
        required: false,
        options: ['Unframed', 'Framed (Included)', 'Framed (Extra Cost)', 'Gallery Wrapped Canvas'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'select',
        required: false,
        options: ['Portrait', 'Landscape', 'Still Life', 'Abstract', 'African Culture', 'Nature', 'Urban', 'Religious', 'Custom'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'commission_available',
        label: 'Commission Available',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Can create custom pieces',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time (Commissions)',
        type: 'select',
        required: false,
        options: ['1 Week', '2 Weeks', '3-4 Weeks', '1-2 Months', 'Varies'],
        sortOrder: 8,
        group: 'details'
      },
      {
        name: 'certificate',
        label: 'Certificate of Authenticity',
        type: 'boolean',
        required: false,
        defaultValue: false,
        sortOrder: 9,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 10. WOODCARVER / SCULPTOR
  // ============================================
  {
    id: 'woodcarver',
    name: 'Woodcarver / Sculptor',
    description: 'Wood carvings, sculptures, and traditional African art',
    icon: 'TreePine',
    emoji: '🪵',
    sector: 'artisan_crafts',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['woodcarving', 'sculpture', 'carving', 'african art', 'mask', 'statue'],
    defaultUnits: ['piece'],
    defaultCategories: [
      { name: 'Masks', icon: '🎭', description: 'Traditional masks' },
      { name: 'Statues/Figures', icon: '🗿', description: 'Human and animal figures' },
      { name: 'Wall Art', icon: '🖼️', description: 'Wall hangings and plaques' },
      { name: 'Functional Items', icon: '🥄', description: 'Bowls, spoons, stools' },
      { name: 'Religious', icon: '✝️', description: 'Religious carvings' },
      { name: 'Animals', icon: '🦁', description: 'Animal sculptures' },
      { name: 'Custom', icon: '✨', description: 'Custom carvings' },
    ],
    productFields: [
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: true,
        options: ['Wood - Mahogany', 'Wood - Ebony', 'Wood - Teak', 'Wood - Iroko', 'Wood - Other', 'Stone', 'Bronze', 'Clay', 'Mixed Materials'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'height',
        label: 'Height',
        type: 'text',
        required: false,
        placeholder: 'e.g., 30cm, 2ft, 1m',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        required: false,
        options: ['Traditional African', 'Contemporary', 'Abstract', 'Realistic', 'Tribal/Ethnic', 'Religious'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'finish',
        label: 'Finish',
        type: 'select',
        required: false,
        options: ['Natural/Raw', 'Polished', 'Stained', 'Painted', 'Oiled', 'Waxed'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'cultural_significance',
        label: 'Cultural Origin/Significance',
        type: 'text',
        required: false,
        placeholder: 'e.g., Yoruba, Benin, Ashanti, Modern',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'handcarved',
        label: 'Handcarved',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'one_of_a_kind',
        label: 'One of a Kind',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Unique piece',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'custom_available',
        label: 'Custom Orders Available',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 8,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time (Custom)',
        type: 'select',
        required: false,
        options: ['1 Week', '2 Weeks', '3-4 Weeks', '1-2 Months', '2-3 Months'],
        sortOrder: 9,
        group: 'details'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getArtisanCraftsCategory(id: string): BusinessCategory | undefined {
  return ARTISAN_CRAFTS_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const ARTISAN_CRAFTS_IDS = ARTISAN_CRAFTS_CATEGORIES.map(cat => cat.id);
