/**
 * Phase 2: Fashion & Retail Business Categories
 * 
 * 10 business types for fashion and retail industry:
 * 1. Clothing Store / Boutique
 * 2. Shoe Store
 * 3. Jewelry Store
 * 4. Fabric / Textile Store
 * 5. Tailor / Fashion Designer
 * 6. Accessories / Bags Store
 * 7. Children's Store / Kids Wear
 * 8. Thrift / Vintage Store
 * 9. Uniform / Workwear Store
 * 10. Sportswear / Athletic Store
 */

import type { BusinessCategory } from './types';

export const FASHION_RETAIL_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. CLOTHING STORE / BOUTIQUE
  // ============================================
  {
    id: 'clothing_store',
    name: 'Clothing Store / Boutique',
    description: 'Fashion boutiques, clothing retailers, and apparel stores',
    icon: 'Shirt',
    emoji: '👗',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['clothing', 'fashion', 'boutique', 'apparel', 'wear', 'clothes', 'dress'],
    defaultUnits: ['piece', 'set', 'pair'],
    defaultCategories: [
      { name: 'Tops', icon: '👕', description: 'Shirts, blouses, t-shirts' },
      { name: 'Bottoms', icon: '👖', description: 'Trousers, skirts, shorts' },
      { name: 'Dresses', icon: '👗', description: 'Gowns and dresses' },
      { name: 'Outerwear', icon: '🧥', description: 'Jackets, coats, blazers' },
      { name: 'Traditional Wear', icon: '🥻', description: 'Ankara, Kente, Agbada' },
      { name: 'Underwear', icon: '🩲', description: 'Undergarments' },
      { name: 'Sleepwear', icon: '🛏️', description: 'Pajamas, nightwear' },
      { name: 'Swimwear', icon: '👙', description: 'Beach and pool wear' },
      { name: 'Suits', icon: '🤵', description: 'Formal suits' },
    ],
    productFields: [
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'sizes_available',
        label: 'Sizes Available',
        type: 'multiselect',
        required: true,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'One Size', 'Custom'],
        sortOrder: 2,
        group: 'variants'
      },
      {
        name: 'colors_available',
        label: 'Colors Available',
        type: 'multiselect',
        required: false,
        options: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Grey', 'Navy', 'Beige', 'Multi-Color'],
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Cotton', 'Polyester', 'Silk', 'Linen', 'Wool', 'Denim', 'Chiffon', 'Lace', 'Ankara', 'Kente', 'Velvet', 'Satin', 'Leather', 'Blend'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'Enter brand name',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        required: false,
        options: ['Casual', 'Formal', 'Traditional', 'Streetwear', 'Bohemian', 'Vintage', 'Sporty', 'Elegant'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'season',
        label: 'Season',
        type: 'select',
        required: false,
        options: ['All Season', 'Harmattan', 'Rainy Season', 'Summer', 'Winter'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'care_instructions',
        label: 'Care Instructions',
        type: 'text',
        required: false,
        placeholder: 'e.g., Machine wash cold, Dry clean only',
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 2. SHOE STORE
  // ============================================
  {
    id: 'shoe_store',
    name: 'Shoe Store',
    description: 'Footwear stores, shoe shops, and sandal vendors',
    icon: 'Footprints',
    emoji: '👟',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['shoes', 'footwear', 'sneakers', 'heels', 'sandals', 'boots', 'slippers'],
    defaultUnits: ['pair'],
    defaultCategories: [
      { name: 'Sneakers', icon: '👟', description: 'Casual and athletic sneakers' },
      { name: 'Formal Shoes', icon: '👞', description: 'Office and dress shoes' },
      { name: 'Sandals', icon: '🩴', description: 'Open-toe sandals' },
      { name: 'Heels', icon: '👠', description: 'High heels and pumps' },
      { name: 'Boots', icon: '🥾', description: 'Ankle and knee boots' },
      { name: 'Slippers', icon: '🩴', description: 'House and palm slippers' },
      { name: 'Flats', icon: '🥿', description: 'Ballet flats and loafers' },
      { name: 'Traditional', icon: '👡', description: 'Native sandals and slippers' },
      { name: 'Kids Shoes', icon: '👶', description: 'Children\'s footwear' },
    ],
    productFields: [
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls', 'Kids'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'sizes_available',
        label: 'Sizes Available (EU)',
        type: 'multiselect',
        required: true,
        options: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
        helpText: 'Select all available EU sizes',
        sortOrder: 2,
        group: 'variants'
      },
      {
        name: 'size_system',
        label: 'Size System',
        type: 'select',
        required: false,
        options: ['EU', 'US', 'UK', 'Universal'],
        defaultValue: 'EU',
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'colors_available',
        label: 'Colors Available',
        type: 'multiselect',
        required: false,
        options: ['Black', 'White', 'Brown', 'Tan', 'Red', 'Blue', 'Grey', 'Gold', 'Silver', 'Multi-Color'],
        sortOrder: 4,
        group: 'variants'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Leather', 'Suede', 'Canvas', 'Synthetic', 'Rubber', 'Fabric', 'Mesh', 'Patent Leather'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'heel_height',
        label: 'Heel Height',
        type: 'select',
        required: false,
        options: ['Flat', 'Low (1-2")', 'Medium (2-3")', 'High (3-4")', 'Very High (4"+)'],
        helpText: 'For heeled shoes',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Nike, Adidas, Zara',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'closure_type',
        label: 'Closure Type',
        type: 'select',
        required: false,
        options: ['Lace-up', 'Slip-on', 'Velcro', 'Buckle', 'Zipper', 'None'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. JEWELRY STORE
  // ============================================
  {
    id: 'jewelry_store',
    name: 'Jewelry Store',
    description: 'Jewelry shops, gold sellers, and accessories boutiques',
    icon: 'Gem',
    emoji: '💍',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['jewelry', 'gold', 'silver', 'rings', 'necklaces', 'earrings', 'bracelets'],
    defaultUnits: ['piece', 'set', 'pair'],
    defaultCategories: [
      { name: 'Rings', icon: '💍', description: 'Wedding, engagement, fashion' },
      { name: 'Necklaces', icon: '📿', description: 'Chains, pendants, chokers' },
      { name: 'Earrings', icon: '✨', description: 'Studs, hoops, dangles' },
      { name: 'Bracelets', icon: '⭕', description: 'Bangles and bracelets' },
      { name: 'Watches', icon: '⌚', description: 'Wristwatches' },
      { name: 'Anklets', icon: '🦶', description: 'Ankle jewelry' },
      { name: 'Brooches', icon: '📌', description: 'Pins and brooches' },
      { name: 'Sets', icon: '🎁', description: 'Matching jewelry sets' },
      { name: 'Traditional', icon: '🏺', description: 'African beads and coral' },
    ],
    productFields: [
      {
        name: 'material',
        label: 'Primary Material',
        type: 'select',
        required: true,
        options: ['Gold (24K)', 'Gold (18K)', 'Gold (14K)', 'Gold (10K)', 'Silver (Sterling)', 'Platinum', 'Stainless Steel', 'Brass', 'Copper', 'Beads', 'Coral', 'Costume/Fashion'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'gemstones',
        label: 'Gemstones',
        type: 'multiselect',
        required: false,
        options: ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Pearl', 'Amethyst', 'Topaz', 'Opal', 'Cubic Zirconia', 'None'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., Ring size 7, 18" chain',
        helpText: 'Ring size, chain length, etc.',
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'weight',
        label: 'Weight (grams)',
        type: 'number',
        required: false,
        placeholder: '5.5',
        unit: 'g',
        helpText: 'Weight in grams',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'certification',
        label: 'Certification',
        type: 'select',
        required: false,
        options: ['Certified (with papers)', 'Hallmarked', 'Not Certified'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'occasion',
        label: 'Occasion',
        type: 'multiselect',
        required: false,
        options: ['Wedding', 'Engagement', 'Daily Wear', 'Party', 'Traditional Ceremony', 'Gift'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'custom_order',
        label: 'Custom Order Available',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Can be made to order',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'gift_box',
        label: 'Gift Box Included',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. FABRIC / TEXTILE STORE
  // ============================================
  {
    id: 'fabric_store',
    name: 'Fabric / Textile Store',
    description: 'Fabric shops, textile markets, and material sellers',
    icon: 'Scissors',
    emoji: '🧵',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['fabric', 'textile', 'ankara', 'lace', 'material', 'cloth', 'kente'],
    defaultUnits: ['yard', 'meter', '6 yards', '12 yards'],
    defaultCategories: [
      { name: 'Ankara', icon: '🎨', description: 'African wax prints' },
      { name: 'Lace', icon: '✨', description: 'Cord, French, Swiss lace' },
      { name: 'Aso-Oke', icon: '🏺', description: 'Traditional woven fabric' },
      { name: 'Kente', icon: '🇬🇭', description: 'Ghanaian Kente cloth' },
      { name: 'Cotton', icon: '☁️', description: 'Plain cotton fabrics' },
      { name: 'Silk', icon: '🎀', description: 'Silk and satin' },
      { name: 'Chiffon', icon: '💨', description: 'Light flowing fabrics' },
      { name: 'Velvet', icon: '👑', description: 'Velvet and velour' },
      { name: 'Suiting', icon: '👔', description: 'Senator and suit materials' },
      { name: 'Atiku', icon: '🥻', description: 'Atiku and Guinea brocade' },
    ],
    productFields: [
      {
        name: 'fabric_type',
        label: 'Fabric Type',
        type: 'select',
        required: true,
        options: ['Ankara', 'Lace (Cord)', 'Lace (French)', 'Lace (Swiss)', 'Aso-Oke', 'Kente', 'Atiku', 'Guinea Brocade', 'Cotton', 'Silk', 'Chiffon', 'Velvet', 'Satin', 'Organza', 'Jacquard', 'Damask', 'Wool', 'Linen'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'price_unit',
        label: 'Price Per',
        type: 'select',
        required: true,
        options: ['Per Yard', 'Per Meter', 'Per 6 Yards', 'Per 12 Yards', 'Per Bundle', 'Per Piece'],
        sortOrder: 2,
        group: 'pricing'
      },
      {
        name: 'width',
        label: 'Width (inches)',
        type: 'select',
        required: false,
        options: ['36"', '44"', '45"', '54"', '58"', '60"'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'colors_patterns',
        label: 'Color/Pattern',
        type: 'text',
        required: false,
        placeholder: 'e.g., Red/Gold, Blue Multi-pattern',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'quality_grade',
        label: 'Quality Grade',
        type: 'select',
        required: false,
        options: ['Premium/Original', 'Standard', 'Economy', 'Sample Cut'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'origin',
        label: 'Origin',
        type: 'select',
        required: false,
        options: ['Nigerian', 'Ghanaian', 'Swiss', 'Austrian', 'Chinese', 'Indian', 'Dutch', 'Local'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order',
        type: 'text',
        required: false,
        placeholder: 'e.g., 2 yards',
        sortOrder: 7,
        group: 'inventory'
      },
      {
        name: 'occasion',
        label: 'Best For',
        type: 'multiselect',
        required: false,
        options: ['Wedding', 'Traditional Ceremony', 'Casual Wear', 'Office Wear', 'Party', 'Burial', 'Christening'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 5. TAILOR / FASHION DESIGNER
  // ============================================
  {
    id: 'tailor',
    name: 'Tailor / Fashion Designer',
    description: 'Custom tailoring, fashion design, and alterations',
    icon: 'Scissors',
    emoji: '✂️',
    sector: 'fashion_retail',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['tailor', 'fashion designer', 'sewing', 'custom', 'alterations', 'bespoke'],
    defaultUnits: ['piece', 'set', 'outfit'],
    defaultCategories: [
      { name: 'Men\'s Native', icon: '🥻', description: 'Agbada, Kaftan, Senator' },
      { name: 'Women\'s Native', icon: '👗', description: 'Iro & Buba, Boubou' },
      { name: 'Formal Suits', icon: '🤵', description: 'Business and wedding suits' },
      { name: 'Dresses', icon: '👗', description: 'Gowns and dresses' },
      { name: 'Casual Wear', icon: '👕', description: 'Everyday clothing' },
      { name: 'Bridal Wear', icon: '👰', description: 'Wedding outfits' },
      { name: 'Alterations', icon: '📏', description: 'Repairs and adjustments' },
      { name: 'Uniforms', icon: '👔', description: 'School and work uniforms' },
    ],
    productFields: [
      {
        name: 'garment_type',
        label: 'Garment Type',
        type: 'select',
        required: true,
        options: ['Agbada', 'Kaftan', 'Senator', 'Buba & Sokoto', 'Iro & Buba', 'Gown', 'Dress', 'Blouse', 'Skirt', 'Trouser', 'Suit (2-piece)', 'Suit (3-piece)', 'Shirt', 'Jumpsuit', 'Shorts', 'Other'],
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
        options: ['Customer', 'Shop', 'Either'],
        defaultValue: 'Customer',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'measurements_required',
        label: 'Measurements Required',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Customer needs to come for measurements',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'production_time',
        label: 'Production Time',
        type: 'select',
        required: false,
        options: ['Same Day', '24 Hours', '2-3 Days', '1 Week', '2 Weeks', '3-4 Weeks'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'rush_available',
        label: 'Rush Order Available',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Express service at extra cost',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'includes_fitting',
        label: 'Includes Fitting',
        type: 'select',
        required: false,
        options: ['1 Fitting', '2 Fittings', 'No Fitting', 'Unlimited'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'design_complexity',
        label: 'Design Complexity',
        type: 'select',
        required: false,
        options: ['Simple', 'Standard', 'Complex', 'Very Elaborate'],
        helpText: 'Affects pricing',
        sortOrder: 8,
        group: 'details'
      },
      {
        name: 'embellishments',
        label: 'Embellishments',
        type: 'multiselect',
        required: false,
        options: ['Embroidery', 'Beading', 'Stonework', 'Sequins', 'Lace Trim', 'None'],
        sortOrder: 9,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 6. ACCESSORIES / BAGS STORE
  // ============================================
  {
    id: 'accessories_store',
    name: 'Accessories / Bags Store',
    description: 'Handbags, belts, wallets, and fashion accessories',
    icon: 'Briefcase',
    emoji: '👜',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['bags', 'accessories', 'handbags', 'wallets', 'belts', 'scarves'],
    defaultUnits: ['piece', 'set'],
    defaultCategories: [
      { name: 'Handbags', icon: '👜', description: 'Ladies handbags' },
      { name: 'Backpacks', icon: '🎒', description: 'Casual and school bags' },
      { name: 'Wallets', icon: '👛', description: 'Wallets and purses' },
      { name: 'Belts', icon: '🥋', description: 'Fashion and dress belts' },
      { name: 'Hats & Caps', icon: '🧢', description: 'Headwear' },
      { name: 'Scarves', icon: '🧣', description: 'Scarves and shawls' },
      { name: 'Sunglasses', icon: '🕶️', description: 'Fashion eyewear' },
      { name: 'Ties', icon: '👔', description: 'Neckties and bowties' },
      { name: 'Travel Bags', icon: '🧳', description: 'Luggage and duffles' },
    ],
    productFields: [
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Genuine Leather', 'Faux Leather', 'Canvas', 'Nylon', 'Polyester', 'Suede', 'Fabric', 'Straw/Raffia'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: false,
        options: ['Mini', 'Small', 'Medium', 'Large', 'Extra Large', 'One Size'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'select',
        required: false,
        options: ['Black', 'Brown', 'Tan', 'White', 'Red', 'Blue', 'Pink', 'Multi-Color', 'Gold', 'Silver'],
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Louis Vuitton, Gucci, Local Brand',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: false,
        options: ['Men', 'Women', 'Unisex'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'occasion',
        label: 'Occasion',
        type: 'multiselect',
        required: false,
        options: ['Casual', 'Office/Work', 'Party/Evening', 'Travel', 'Sports', 'Wedding'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'features',
        label: 'Features',
        type: 'multiselect',
        required: false,
        options: ['Adjustable Strap', 'Removable Strap', 'Multiple Compartments', 'Zipper Closure', 'Magnetic Closure', 'Waterproof'],
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 7. CHILDREN'S STORE / KIDS WEAR
  // ============================================
  {
    id: 'kids_store',
    name: 'Children\'s Store / Kids Wear',
    description: 'Children\'s clothing, toys, and baby items',
    icon: 'Baby',
    emoji: '🧸',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['kids', 'children', 'baby', 'toddler', 'toys', 'kids wear'],
    defaultUnits: ['piece', 'set', 'pack'],
    defaultCategories: [
      { name: 'Baby Clothing', icon: '👶', description: '0-12 months' },
      { name: 'Toddler Wear', icon: '🧒', description: '1-3 years' },
      { name: 'Kids Clothing', icon: '👧', description: '4-12 years' },
      { name: 'School Wear', icon: '🎒', description: 'Uniforms and school items' },
      { name: 'Shoes', icon: '👟', description: 'Kids footwear' },
      { name: 'Toys', icon: '🧸', description: 'Toys and games' },
      { name: 'Baby Essentials', icon: '🍼', description: 'Diapers, bottles, etc.' },
      { name: 'Accessories', icon: '🎀', description: 'Hair accessories, bags' },
    ],
    productFields: [
      {
        name: 'age_range',
        label: 'Age Range',
        type: 'select',
        required: true,
        options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years', '3-4 years', '4-6 years', '6-8 years', '8-10 years', '10-12 years', '12+ years'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Boys', 'Girls', 'Unisex'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: false,
        options: ['Newborn', '0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M', '2T', '3T', '4T', '5', '6', '7', '8', '10', '12', '14'],
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'select',
        required: false,
        options: ['Blue', 'Pink', 'White', 'Yellow', 'Green', 'Red', 'Multi-Color', 'Neutral'],
        sortOrder: 4,
        group: 'variants'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['100% Cotton', 'Cotton Blend', 'Organic Cotton', 'Polyester', 'Fleece', 'Denim'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'safety_certified',
        label: 'Safety Certified',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Meets child safety standards',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'set_includes',
        label: 'Set Includes',
        type: 'text',
        required: false,
        placeholder: 'e.g., Top + Bottom + Cap',
        helpText: 'For sets/combos',
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 8. THRIFT / VINTAGE STORE
  // ============================================
  {
    id: 'thrift_store',
    name: 'Thrift / Vintage Store',
    description: 'Second-hand clothing, vintage items, and Okrika/Bend-down',
    icon: 'Recycle',
    emoji: '♻️',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['thrift', 'vintage', 'second-hand', 'okrika', 'bend-down', 'used'],
    defaultUnits: ['piece', 'bundle', 'bale'],
    defaultCategories: [
      { name: 'Tops', icon: '👕', description: 'Shirts, blouses, t-shirts' },
      { name: 'Bottoms', icon: '👖', description: 'Jeans, trousers, skirts' },
      { name: 'Dresses', icon: '👗', description: 'Dresses and gowns' },
      { name: 'Shoes', icon: '👟', description: 'Footwear' },
      { name: 'Bags', icon: '👜', description: 'Bags and purses' },
      { name: 'Vintage/Designer', icon: '✨', description: 'Premium vintage finds' },
      { name: 'Kids Wear', icon: '🧒', description: 'Children\'s clothing' },
      { name: 'Bales', icon: '📦', description: 'Wholesale bales' },
    ],
    productFields: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'As-Is'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'original_brand',
        label: 'Original Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Zara, H&M, Nike, Unknown',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: false,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
        sortOrder: 4,
        group: 'variants'
      },
      {
        name: 'era_style',
        label: 'Era/Style',
        type: 'select',
        required: false,
        options: ['90s', '2000s', '2010s', 'Vintage', 'Retro', 'Modern', 'Classic'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'defects',
        label: 'Known Defects',
        type: 'text',
        required: false,
        placeholder: 'e.g., Small stain on sleeve, None',
        helpText: 'Be honest about flaws',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'grade',
        label: 'Grade (for bales)',
        type: 'select',
        required: false,
        options: ['Grade A', 'Grade B', 'Grade C', 'Mixed'],
        helpText: 'Quality grading for bulk',
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 9. UNIFORM / WORKWEAR STORE
  // ============================================
  {
    id: 'uniform_store',
    name: 'Uniform / Workwear Store',
    description: 'School uniforms, corporate wear, and industrial workwear',
    icon: 'Briefcase',
    emoji: '👔',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['uniform', 'workwear', 'school uniform', 'corporate', 'industrial', 'scrubs'],
    defaultUnits: ['piece', 'set'],
    defaultCategories: [
      { name: 'School Uniforms', icon: '🎒', description: 'Primary and secondary' },
      { name: 'Corporate Wear', icon: '👔', description: 'Office uniforms' },
      { name: 'Medical Scrubs', icon: '🥼', description: 'Hospital and clinic wear' },
      { name: 'Industrial/Safety', icon: '🦺', description: 'Work safety clothing' },
      { name: 'Security Uniforms', icon: '👮', description: 'Guard and security wear' },
      { name: 'Hospitality', icon: '🧑‍🍳', description: 'Restaurant and hotel' },
      { name: 'Sports Uniforms', icon: '⚽', description: 'Team jerseys' },
      { name: 'Accessories', icon: '🧢', description: 'Caps, badges, ties' },
    ],
    productFields: [
      {
        name: 'uniform_type',
        label: 'Uniform Type',
        type: 'select',
        required: true,
        options: ['School', 'Corporate', 'Medical', 'Industrial', 'Security', 'Hospitality', 'Sports', 'Religious'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'sizes_available',
        label: 'Sizes Available',
        type: 'multiselect',
        required: true,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'Custom'],
        sortOrder: 2,
        group: 'variants'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Navy Blue, Khaki',
        sortOrder: 4,
        group: 'variants'
      },
      {
        name: 'logo_embroidery',
        label: 'Logo/Embroidery',
        type: 'select',
        required: false,
        options: ['Included', 'Available (Extra Cost)', 'Not Available'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order Quantity',
        type: 'number',
        required: false,
        placeholder: '10',
        helpText: 'For bulk/corporate orders',
        sortOrder: 6,
        group: 'inventory'
      },
      {
        name: 'bulk_discount',
        label: 'Bulk Discount Available',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'institution_name',
        label: 'Institution/Company (if specific)',
        type: 'text',
        required: false,
        placeholder: 'e.g., Kings College, GTBank',
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 10. SPORTSWEAR / ATHLETIC STORE
  // ============================================
  {
    id: 'sportswear_store',
    name: 'Sportswear / Athletic Store',
    description: 'Sports clothing, athletic gear, and fitness wear',
    icon: 'Dumbbell',
    emoji: '⚽',
    sector: 'fashion_retail',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['sportswear', 'athletic', 'fitness', 'gym', 'jersey', 'sports'],
    defaultUnits: ['piece', 'set', 'pair'],
    defaultCategories: [
      { name: 'Jerseys', icon: '👕', description: 'Football, basketball jerseys' },
      { name: 'Tracksuits', icon: '🏃', description: 'Training suits' },
      { name: 'Gym Wear', icon: '💪', description: 'Workout clothing' },
      { name: 'Sports Shoes', icon: '👟', description: 'Athletic footwear' },
      { name: 'Shorts', icon: '🩳', description: 'Sports shorts' },
      { name: 'Equipment', icon: '⚽', description: 'Balls, gear, accessories' },
      { name: 'Compression', icon: '🦾', description: 'Compression wear' },
      { name: 'Swimming', icon: '🏊', description: 'Swimwear and gear' },
    ],
    productFields: [
      {
        name: 'sport_type',
        label: 'Sport/Activity',
        type: 'select',
        required: false,
        options: ['Football/Soccer', 'Basketball', 'Running', 'Gym/Fitness', 'Tennis', 'Swimming', 'Boxing', 'Cycling', 'Yoga', 'General Athletic'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'sizes_available',
        label: 'Sizes Available',
        type: 'multiselect',
        required: true,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Black/Red, Team Colors',
        sortOrder: 4,
        group: 'variants'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Nike, Adidas, Under Armour',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'team',
        label: 'Team (for jerseys)',
        type: 'text',
        required: false,
        placeholder: 'e.g., Manchester United, Lakers',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'features',
        label: 'Features',
        type: 'multiselect',
        required: false,
        options: ['Moisture-Wicking', 'Breathable', 'Quick-Dry', 'UV Protection', 'Compression', 'Reflective', 'Pockets'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'customization',
        label: 'Team Customization Available',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Add names, numbers, logos',
        sortOrder: 8,
        group: 'details'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getFashionRetailCategory(id: string): BusinessCategory | undefined {
  return FASHION_RETAIL_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const FASHION_RETAIL_IDS = FASHION_RETAIL_CATEGORIES.map(cat => cat.id);
