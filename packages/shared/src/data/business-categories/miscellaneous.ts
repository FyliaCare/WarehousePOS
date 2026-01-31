/**
 * Phase 10: Miscellaneous Business Categories
 * 
 * 6 business types for miscellaneous industries:
 * 1. Pet Shop / Veterinary
 * 2. Bookstore / Stationery
 * 3. Gift Shop / Souvenirs
 * 4. Florist / Plant Shop
 * 5. Furniture Store
 * 6. Party Supplies / Event Decor
 */

import type { BusinessCategory } from './types';

export const MISCELLANEOUS_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. PET SHOP / VETERINARY
  // ============================================
  {
    id: 'pet_shop',
    name: 'Pet Shop / Veterinary',
    description: 'Pet supplies, animals, and veterinary services',
    icon: 'Dog',
    emoji: '🐕',
    sector: 'miscellaneous',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['pet', 'animal', 'dog', 'cat', 'veterinary', 'pet food', 'accessories'],
    defaultUnits: ['piece', 'bag', 'pack', 'service'],
    defaultCategories: [
      { name: 'Dogs', icon: '🐕', description: 'Dogs and puppies' },
      { name: 'Cats', icon: '🐱', description: 'Cats and kittens' },
      { name: 'Birds', icon: '🦜', description: 'Pet birds' },
      { name: 'Fish/Aquarium', icon: '🐠', description: 'Fish and aquarium' },
      { name: 'Pet Food', icon: '🦴', description: 'Food and treats' },
      { name: 'Accessories', icon: '🎀', description: 'Collars, leashes, toys' },
      { name: 'Health/Grooming', icon: '🧴', description: 'Pet care products' },
      { name: 'Vet Services', icon: '💉', description: 'Veterinary services' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product/Service Type',
        type: 'select',
        required: true,
        options: ['Live Pet', 'Pet Food', 'Treats/Snacks', 'Accessories', 'Grooming Products', 'Health Products', 'Aquarium/Habitat', 'Vet Service', 'Grooming Service'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'pet_type',
        label: 'Pet Type',
        type: 'select',
        required: false,
        options: ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster/Guinea Pig', 'Reptile', 'All Pets', 'N/A'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'breed',
        label: 'Breed (for live pets)',
        type: 'text',
        required: false,
        placeholder: 'e.g., German Shepherd, Persian Cat',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'age',
        label: 'Age (for live pets)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 3 months, Adult',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand (for products)',
        type: 'text',
        required: false,
        placeholder: 'e.g., Pedigree, Whiskas, Royal Canin',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'size_weight',
        label: 'Size/Weight',
        type: 'text',
        required: false,
        placeholder: 'e.g., 3kg bag, Small, Medium, Large',
        sortOrder: 6,
        group: 'pricing'
      },
      {
        name: 'vaccination',
        label: 'Vaccination (for live pets)',
        type: 'select',
        required: false,
        options: ['N/A', 'Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'gender',
        label: 'Gender (for live pets)',
        type: 'select',
        required: false,
        options: ['N/A', 'Male', 'Female'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 2. BOOKSTORE / STATIONERY
  // ============================================
  {
    id: 'bookstore',
    name: 'Bookstore / Stationery',
    description: 'Books, school supplies, office stationery, and educational materials',
    icon: 'BookOpen',
    emoji: '📚',
    sector: 'miscellaneous',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['books', 'stationery', 'school', 'office', 'supplies', 'educational'],
    defaultUnits: ['piece', 'pack', 'dozen', 'ream', 'set'],
    defaultCategories: [
      { name: 'Textbooks', icon: '📖', description: 'School textbooks' },
      { name: 'Novels/Fiction', icon: '📚', description: 'Fiction and literature' },
      { name: 'Religious', icon: '📿', description: 'Bibles, Qurans, religious' },
      { name: 'Notebooks', icon: '📓', description: 'Exercise and note books' },
      { name: 'Writing', icon: '✏️', description: 'Pens, pencils, markers' },
      { name: 'Office Supplies', icon: '📎', description: 'Staplers, files, clips' },
      { name: 'Art Supplies', icon: '🎨', description: 'Crayons, paints, brushes' },
      { name: 'School Bags', icon: '🎒', description: 'Bags and accessories' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Textbook', 'Novel/Fiction', 'Non-Fiction', 'Religious Book', 'Notebook/Exercise Book', 'Writing Instrument', 'Paper/Printing', 'Office Supply', 'Art Supply', 'School Bag/Accessory'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'title',
        label: 'Title/Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., New Concept Mathematics, Things Fall Apart',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'author_brand',
        label: 'Author/Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Chinua Achebe, BIC, Pilot',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'subject_category',
        label: 'Subject/Category (for books)',
        type: 'select',
        required: false,
        options: ['N/A', 'Mathematics', 'English', 'Science', 'Social Studies', 'Literature', 'Religious Studies', 'Commerce/Economics', 'Computer', 'General Knowledge', 'Fiction', 'Self-Help'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'class_level',
        label: 'Class/Level (for textbooks)',
        type: 'select',
        required: false,
        options: ['N/A', 'Nursery/KG', 'Primary 1-3', 'Primary 4-6', 'JSS 1-3', 'SSS 1-3', 'University/Tertiary', 'Professional'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., A4, A5, 2B (for exercise books)',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'pages_quantity',
        label: 'Pages/Quantity',
        type: 'text',
        required: false,
        placeholder: 'e.g., 80 pages, 12 pieces, 1 ream',
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'condition',
        label: 'Condition (for books)',
        type: 'select',
        required: false,
        options: ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'],
        defaultValue: 'New',
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. GIFT SHOP / SOUVENIRS
  // ============================================
  {
    id: 'gift_shop',
    name: 'Gift Shop / Souvenirs',
    description: 'Gift items, souvenirs, novelty products, and keepsakes',
    icon: 'Gift',
    emoji: '🎁',
    sector: 'miscellaneous',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['gift', 'souvenir', 'present', 'novelty', 'keepsake', 'decor'],
    defaultUnits: ['piece', 'set', 'pack'],
    defaultCategories: [
      { name: 'Gift Items', icon: '🎁', description: 'General gifts' },
      { name: 'Souvenirs', icon: '🗿', description: 'Local souvenirs' },
      { name: 'Home Decor', icon: '🏠', description: 'Decorative items' },
      { name: 'Greeting Cards', icon: '💌', description: 'Cards and envelopes' },
      { name: 'Toys & Games', icon: '🎮', description: 'Toys and board games' },
      { name: 'Figurines', icon: '🏆', description: 'Collectibles, trophies' },
      { name: 'Gift Wrapping', icon: '🎀', description: 'Wrapping materials' },
      { name: 'Personalized', icon: '✨', description: 'Custom/personalized gifts' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Gift Item', 'Souvenir', 'Home Decor', 'Greeting Card', 'Toy/Game', 'Figurine/Trophy', 'Photo Frame', 'Mug/Drinkware', 'Gift Basket', 'Personalized Item', 'Wrapping Material'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'occasion',
        label: 'Occasion',
        type: 'multiselect',
        required: false,
        options: ['Birthday', 'Wedding', 'Anniversary', 'Christmas', 'Eid/Ramadan', 'Valentine', 'Mother/Father\'s Day', 'Graduation', 'Baby Shower', 'Housewarming', 'Corporate', 'General'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'recipient',
        label: 'Recipient',
        type: 'select',
        required: false,
        options: ['Anyone', 'Him', 'Her', 'Kids', 'Couple', 'Family', 'Corporate/Office'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'text',
        required: false,
        placeholder: 'e.g., Ceramic, Glass, Wood, Metal',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: false,
        options: ['Mini/Small', 'Medium', 'Large', 'Extra Large', 'Various'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'personalization',
        label: 'Personalization',
        type: 'select',
        required: false,
        options: ['Not Available', 'Name Engraving', 'Custom Print', 'Photo Customization', 'Custom Message'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'gift_wrapping',
        label: 'Gift Wrapping',
        type: 'select',
        required: false,
        options: ['Not Included', 'Basic (Free)', 'Premium (Extra)', 'Included'],
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'price_range',
        label: 'Price Range',
        type: 'select',
        required: false,
        options: ['Budget (Under ₦5,000)', 'Mid-Range (₦5,000-₦20,000)', 'Premium (₦20,000-₦50,000)', 'Luxury (₦50,000+)'],
        sortOrder: 8,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 4. FLORIST / PLANT SHOP
  // ============================================
  {
    id: 'florist',
    name: 'Florist / Plant Shop',
    description: 'Fresh flowers, plants, bouquets, and floral arrangements',
    icon: 'Flower2',
    emoji: '💐',
    sector: 'miscellaneous',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['flowers', 'plants', 'florist', 'bouquet', 'garden', 'arrangement'],
    defaultUnits: ['piece', 'bunch', 'bouquet', 'pot'],
    defaultCategories: [
      { name: 'Fresh Flowers', icon: '🌹', description: 'Cut flowers' },
      { name: 'Bouquets', icon: '💐', description: 'Arranged bouquets' },
      { name: 'Indoor Plants', icon: '🪴', description: 'Potted indoor plants' },
      { name: 'Outdoor Plants', icon: '🌳', description: 'Garden plants' },
      { name: 'Succulents', icon: '🌵', description: 'Succulents and cacti' },
      { name: 'Arrangements', icon: '🎍', description: 'Floral arrangements' },
      { name: 'Plant Accessories', icon: '🌱', description: 'Pots, soil, tools' },
      { name: 'Artificial', icon: '🌸', description: 'Artificial flowers' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Fresh Cut Flowers', 'Bouquet', 'Floral Arrangement', 'Indoor Plant', 'Outdoor Plant', 'Succulent/Cactus', 'Artificial Flowers', 'Plant Pot/Vase', 'Gardening Supplies'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'flower_plant_name',
        label: 'Flower/Plant Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., Rose, Lily, Snake Plant, Monstera',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Red, White, Mixed, Assorted',
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: false,
        options: ['Small', 'Medium', 'Large', 'Extra Large', 'Custom'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'stem_count',
        label: 'Stem Count (for flowers)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 12 stems, 24 roses',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'occasion',
        label: 'Occasion',
        type: 'multiselect',
        required: false,
        options: ['Romance/Love', 'Birthday', 'Sympathy/Funeral', 'Wedding', 'Get Well', 'Congratulations', 'Corporate', 'Home Decor', 'General'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'vase_included',
        label: 'Vase/Pot Included',
        type: 'select',
        required: false,
        options: ['Not Included', 'Included', 'Available (Extra)', 'N/A'],
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'delivery',
        label: 'Delivery',
        type: 'select',
        required: false,
        options: ['Pickup Only', 'Same Day Delivery', 'Scheduled Delivery', 'Express Delivery'],
        sortOrder: 8,
        group: 'pricing'
      },
      {
        name: 'care_level',
        label: 'Care Level (for plants)',
        type: 'select',
        required: false,
        options: ['N/A', 'Easy/Low Maintenance', 'Moderate', 'High Maintenance'],
        sortOrder: 9,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 5. FURNITURE STORE
  // ============================================
  {
    id: 'furniture_store',
    name: 'Furniture Store',
    description: 'Home and office furniture, mattresses, and furnishings',
    icon: 'Armchair',
    emoji: '🛋️',
    sector: 'miscellaneous',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['furniture', 'home', 'office', 'mattress', 'sofa', 'bed', 'chair'],
    defaultUnits: ['piece', 'set', 'unit'],
    defaultCategories: [
      { name: 'Living Room', icon: '🛋️', description: 'Sofas, chairs, tables' },
      { name: 'Bedroom', icon: '🛏️', description: 'Beds, wardrobes' },
      { name: 'Dining', icon: '🪑', description: 'Dining sets, chairs' },
      { name: 'Office', icon: '💼', description: 'Desks, office chairs' },
      { name: 'Mattresses', icon: '🛏️', description: 'Mattresses, toppers' },
      { name: 'Storage', icon: '🗄️', description: 'Shelves, cabinets' },
      { name: 'Outdoor', icon: '🏡', description: 'Garden furniture' },
      { name: 'Kids', icon: '🧒', description: 'Children\'s furniture' },
    ],
    productFields: [
      {
        name: 'furniture_type',
        label: 'Furniture Type',
        type: 'select',
        required: true,
        options: ['Sofa/Couch', 'Chair', 'Table', 'Bed Frame', 'Mattress', 'Wardrobe', 'Cabinet/Shelf', 'Desk', 'Dining Set', 'TV Stand', 'Outdoor Furniture', 'Office Furniture'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Wood (Hardwood)', 'Wood (Softwood)', 'MDF/Particle Board', 'Metal', 'Leather', 'Fabric', 'Plastic', 'Glass', 'Rattan/Cane', 'Mixed'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Serta, Mouka, Custom Made',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'dimensions',
        label: 'Dimensions (L x W x H)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 200cm x 160cm x 45cm',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'seating_capacity',
        label: 'Seating/Size (for sofas/beds)',
        type: 'select',
        required: false,
        options: ['N/A', '1-Seater', '2-Seater', '3-Seater', '4-Seater', '5+ Seater', 'Single (3x6)', 'Double (4x6)', 'Queen (5x6)', 'King (6x6)', 'King (6x7)'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Brown, Black, Grey, White',
        sortOrder: 6,
        group: 'variants'
      },
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: false,
        options: ['Brand New', 'UK Used', 'Fairly Used', 'Refurbished'],
        defaultValue: 'Brand New',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'assembly',
        label: 'Assembly',
        type: 'select',
        required: false,
        options: ['Fully Assembled', 'Some Assembly Required', 'Flat Pack (Self Assembly)', 'Assembly Service Available'],
        sortOrder: 8,
        group: 'details'
      },
      {
        name: 'delivery',
        label: 'Delivery',
        type: 'select',
        required: false,
        options: ['Customer Pickup', 'Delivery Available', 'Free Delivery', 'Delivery + Setup'],
        sortOrder: 9,
        group: 'pricing'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '3 Months', '6 Months', '1 Year', '2 Years', '5 Years'],
        sortOrder: 10,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 6. PARTY SUPPLIES / EVENT DECOR
  // ============================================
  {
    id: 'party_supplies',
    name: 'Party Supplies / Event Decor',
    description: 'Party decorations, balloons, disposables, and event supplies',
    icon: 'PartyPopper',
    emoji: '🎈',
    sector: 'miscellaneous',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['party', 'supplies', 'decorations', 'balloons', 'event', 'celebration'],
    defaultUnits: ['piece', 'pack', 'set', 'dozen', 'bundle'],
    defaultCategories: [
      { name: 'Balloons', icon: '🎈', description: 'All types of balloons' },
      { name: 'Decorations', icon: '🎊', description: 'Banners, streamers' },
      { name: 'Disposables', icon: '🍽️', description: 'Plates, cups, cutlery' },
      { name: 'Cake Supplies', icon: '🎂', description: 'Candles, toppers, stands' },
      { name: 'Themed Packs', icon: '🦸', description: 'Character themes' },
      { name: 'Favors', icon: '🎁', description: 'Party favors, bags' },
      { name: 'Costumes', icon: '🎭', description: 'Costumes, masks, props' },
      { name: 'Backdrop/Setup', icon: '📸', description: 'Photo backdrops' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Balloon (Latex)', 'Balloon (Foil)', 'Balloon (LED/Glow)', 'Banner/Bunting', 'Streamer/Ribbon', 'Disposable Plates', 'Disposable Cups', 'Cutlery Set', 'Napkins', 'Cake Topper', 'Candles', 'Party Favor', 'Costume/Mask', 'Backdrop', 'Full Party Pack'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'theme',
        label: 'Theme',
        type: 'select',
        required: false,
        options: ['No Theme/Plain', 'Birthday (General)', 'Princess/Disney', 'Superhero', 'Cartoon Character', 'Sports', 'Baby Shower', 'Gender Reveal', 'Wedding', 'Graduation', 'Halloween', 'Christmas', 'African/Cultural', 'Elegant/Gold', 'Custom'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Pink, Blue, Gold, Multicolor',
        sortOrder: 3,
        group: 'variants'
      },
      {
        name: 'age_milestone',
        label: 'Age/Milestone (if applicable)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1st Birthday, Sweet 16, 50th',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'quantity_per_pack',
        label: 'Quantity per Pack',
        type: 'text',
        required: false,
        placeholder: 'e.g., 10 pieces, 50 balloons, 1 set',
        sortOrder: 5,
        group: 'pricing'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Latex', 'Foil/Mylar', 'Paper', 'Plastic', 'Fabric', 'Biodegradable', 'Mixed'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., 12 inch, 18 inch, Standard',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'inflation',
        label: 'Inflation (for balloons)',
        type: 'select',
        required: false,
        options: ['N/A', 'Uninflated', 'Air Filled', 'Helium Filled (Extra)', 'Helium Included'],
        sortOrder: 8,
        group: 'pricing'
      },
      {
        name: 'personalization',
        label: 'Personalization',
        type: 'select',
        required: false,
        options: ['Not Available', 'Name/Text Print', 'Photo Print', 'Custom Design'],
        sortOrder: 9,
        group: 'details'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getMiscellaneousCategory(id: string): BusinessCategory | undefined {
  return MISCELLANEOUS_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const MISCELLANEOUS_IDS = MISCELLANEOUS_CATEGORIES.map(cat => cat.id);
