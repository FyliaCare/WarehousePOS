/**
 * Phase 1: Food & Beverage Business Categories
 * 
 * 10 business types for food and beverage industry:
 * 1. Restaurant / Fast Food
 * 2. Bakery / Pastry Shop
 * 3. Café / Coffee Shop
 * 4. Bar / Lounge / Nightclub
 * 5. Butcher Shop / Meat Market
 * 6. Fish Market / Seafood
 * 7. Food Truck / Street Food
 * 8. Catering Service
 * 9. Ice Cream / Frozen Treats
 * 10. Grocery / Mini Mart
 */

import type { BusinessCategory } from './types';

export const FOOD_BEVERAGE_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. RESTAURANT / FAST FOOD
  // ============================================
  {
    id: 'restaurant',
    name: 'Restaurant / Fast Food',
    description: 'Full-service restaurants, fast food, diners, and eateries',
    icon: 'UtensilsCrossed',
    emoji: '🍽️',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['restaurant', 'food', 'dining', 'eatery', 'fast food', 'diner', 'meals'],
    defaultUnits: ['portion', 'plate', 'bowl'],
    defaultCategories: [
      { name: 'Appetizers', icon: '🥗', description: 'Starters and small plates' },
      { name: 'Main Course', icon: '🍛', description: 'Primary dishes' },
      { name: 'Soups', icon: '🍲', description: 'Hot soups and stews' },
      { name: 'Rice Dishes', icon: '🍚', description: 'Rice-based meals' },
      { name: 'Grills', icon: '🍖', description: 'Grilled meats and fish' },
      { name: 'Sides', icon: '🍟', description: 'Side dishes and accompaniments' },
      { name: 'Desserts', icon: '🍰', description: 'Sweet treats and desserts' },
      { name: 'Beverages', icon: '🥤', description: 'Drinks and refreshments' },
      { name: 'Specials', icon: '⭐', description: 'Daily or weekly specials' },
      { name: 'Combos', icon: '🎁', description: 'Meal combinations and deals' },
    ],
    productFields: [
      {
        name: 'serving_size',
        label: 'Serving Size',
        type: 'select',
        required: false,
        options: ['Small', 'Medium', 'Large', 'Family Size', 'Single', 'Double'],
        placeholder: 'Select serving size',
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'dietary_tags',
        label: 'Dietary Information',
        type: 'multiselect',
        required: false,
        options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Dairy-Free', 'Nut-Free', 'Spicy', 'Contains Pork'],
        helpText: 'Select all that apply',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'spice_level',
        label: 'Spice Level',
        type: 'select',
        required: false,
        options: ['Not Spicy', 'Mild', 'Medium', 'Hot', 'Extra Hot'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'prep_time',
        label: 'Preparation Time',
        type: 'number',
        required: false,
        placeholder: '15',
        unit: 'minutes',
        min: 1,
        max: 180,
        helpText: 'Average time to prepare',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'calories',
        label: 'Calories',
        type: 'number',
        required: false,
        placeholder: '450',
        unit: 'kcal',
        helpText: 'Approximate calories per serving',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'available_for_delivery',
        label: 'Available for Delivery',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Can this item be delivered?',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'available_times',
        label: 'Availability',
        type: 'multiselect',
        required: false,
        options: ['Breakfast', 'Lunch', 'Dinner', 'All Day', 'Weekends Only'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'recommended_sides',
        label: 'Recommended Sides',
        type: 'text',
        required: false,
        placeholder: 'e.g., Jollof rice, Fried plantain',
        helpText: 'Suggested accompaniments',
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 2. BAKERY / PASTRY SHOP
  // ============================================
  {
    id: 'bakery',
    name: 'Bakery / Pastry Shop',
    description: 'Bakeries, pastry shops, bread makers, and confectioneries',
    icon: 'Croissant',
    emoji: '🥐',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['bakery', 'bread', 'pastry', 'cakes', 'confectionery', 'baked goods'],
    defaultUnits: ['piece', 'loaf', 'dozen', 'kg'],
    defaultCategories: [
      { name: 'Bread', icon: '🍞', description: 'Fresh bread and loaves' },
      { name: 'Cakes', icon: '🎂', description: 'Birthday and celebration cakes' },
      { name: 'Pastries', icon: '🥐', description: 'Croissants, pies, danish' },
      { name: 'Cookies & Biscuits', icon: '🍪', description: 'Cookies and biscuits' },
      { name: 'Pies & Tarts', icon: '🥧', description: 'Sweet and savory pies' },
      { name: 'Doughnuts', icon: '🍩', description: 'Doughnuts and fritters' },
      { name: 'Cupcakes', icon: '🧁', description: 'Individual cupcakes' },
      { name: 'Meat Pies', icon: '🥟', description: 'Savory pies and rolls' },
      { name: 'Custom Orders', icon: '✨', description: 'Special occasion orders' },
    ],
    productFields: [
      {
        name: 'size_weight',
        label: 'Size / Weight',
        type: 'select',
        required: false,
        options: ['Small', 'Medium', 'Large', 'Extra Large', '250g', '500g', '1kg', '2kg', '3kg', '5kg'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'flavor',
        label: 'Flavor',
        type: 'select',
        required: false,
        options: ['Vanilla', 'Chocolate', 'Strawberry', 'Red Velvet', 'Carrot', 'Lemon', 'Coconut', 'Fruit', 'Butter', 'Plain'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'layers',
        label: 'Number of Layers/Tiers',
        type: 'select',
        required: false,
        options: ['Single', '2 Layers', '3 Layers', '4 Layers', '5+ Layers'],
        helpText: 'For cakes',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'shelf_life',
        label: 'Shelf Life',
        type: 'number',
        required: false,
        placeholder: '3',
        unit: 'days',
        helpText: 'How long the product stays fresh',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'dietary_info',
        label: 'Dietary Information',
        type: 'multiselect',
        required: false,
        options: ['Sugar-Free', 'Gluten-Free', 'Eggless', 'Vegan', 'Low Fat', 'Contains Nuts'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'made_to_order',
        label: 'Made to Order',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Requires advance ordering',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'lead_time',
        label: 'Lead Time Required',
        type: 'select',
        required: false,
        options: ['Same Day', '24 Hours', '48 Hours', '3 Days', '1 Week', '2 Weeks'],
        helpText: 'Advance notice for custom orders',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'decoration',
        label: 'Decoration Style',
        type: 'select',
        required: false,
        options: ['Plain', 'Buttercream', 'Fondant', 'Whipped Cream', 'Glazed', 'Sprinkles', 'Custom Design'],
        sortOrder: 8,
        group: 'details'
      },
      {
        name: 'serves',
        label: 'Serves (People)',
        type: 'number',
        required: false,
        placeholder: '10',
        helpText: 'Number of people this serves',
        sortOrder: 9,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. CAFÉ / COFFEE SHOP
  // ============================================
  {
    id: 'cafe',
    name: 'Café / Coffee Shop',
    description: 'Coffee shops, tea houses, and casual cafés',
    icon: 'Coffee',
    emoji: '☕',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['cafe', 'coffee', 'tea', 'drinks', 'espresso', 'latte'],
    defaultUnits: ['cup', 'glass', 'mug'],
    defaultCategories: [
      { name: 'Hot Coffee', icon: '☕', description: 'Espresso, lattes, cappuccinos' },
      { name: 'Iced Coffee', icon: '🧊', description: 'Cold coffee drinks' },
      { name: 'Tea', icon: '🍵', description: 'Hot and iced teas' },
      { name: 'Smoothies', icon: '🥤', description: 'Blended fruit drinks' },
      { name: 'Fresh Juice', icon: '🧃', description: 'Freshly squeezed juices' },
      { name: 'Milkshakes', icon: '🥛', description: 'Blended ice cream drinks' },
      { name: 'Pastries', icon: '🥐', description: 'Baked goods and snacks' },
      { name: 'Sandwiches', icon: '🥪', description: 'Light meals' },
      { name: 'Breakfast', icon: '🍳', description: 'Morning items' },
    ],
    productFields: [
      {
        name: 'cup_size',
        label: 'Cup Size',
        type: 'select',
        required: false,
        options: ['Small (8oz)', 'Medium (12oz)', 'Large (16oz)', 'Extra Large (20oz)'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'temperature',
        label: 'Temperature',
        type: 'select',
        required: false,
        options: ['Hot', 'Iced', 'Blended'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'milk_options',
        label: 'Default Milk',
        type: 'select',
        required: false,
        options: ['Regular Milk', 'Skim Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk', 'Coconut Milk', 'No Milk'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'caffeine_level',
        label: 'Caffeine',
        type: 'select',
        required: false,
        options: ['Regular', 'Decaf', 'Extra Shot', 'Half-Caf', 'Caffeine-Free'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'sweetness',
        label: 'Default Sweetness',
        type: 'select',
        required: false,
        options: ['Unsweetened', 'Light Sugar', 'Regular Sugar', 'Extra Sweet'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'available_addons',
        label: 'Available Add-ons',
        type: 'multiselect',
        required: false,
        options: ['Extra Shot', 'Whipped Cream', 'Vanilla Syrup', 'Caramel Syrup', 'Hazelnut Syrup', 'Chocolate Drizzle', 'Cinnamon'],
        helpText: 'Add-ons customers can choose',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'bean_origin',
        label: 'Coffee Bean Origin',
        type: 'text',
        required: false,
        placeholder: 'e.g., Ethiopian, Colombian',
        helpText: 'For specialty coffees',
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. BAR / LOUNGE / NIGHTCLUB
  // ============================================
  {
    id: 'bar',
    name: 'Bar / Lounge / Nightclub',
    description: 'Bars, lounges, pubs, nightclubs, and beverage spots',
    icon: 'Wine',
    emoji: '🍸',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['bar', 'lounge', 'nightclub', 'drinks', 'alcohol', 'cocktails', 'pub'],
    defaultUnits: ['glass', 'bottle', 'shot', 'bucket'],
    defaultCategories: [
      { name: 'Beers', icon: '🍺', description: 'Local and imported beers' },
      { name: 'Wines', icon: '🍷', description: 'Red, white, and rosé' },
      { name: 'Spirits', icon: '🥃', description: 'Whisky, vodka, rum, gin' },
      { name: 'Cocktails', icon: '🍹', description: 'Mixed drinks' },
      { name: 'Mocktails', icon: '🧃', description: 'Non-alcoholic cocktails' },
      { name: 'Champagne', icon: '🍾', description: 'Sparkling wines' },
      { name: 'Soft Drinks', icon: '🥤', description: 'Sodas and mixers' },
      { name: 'Bar Snacks', icon: '🍿', description: 'Small chops and bites' },
      { name: 'Shisha', icon: '💨', description: 'Hookah flavors' },
    ],
    productFields: [
      {
        name: 'serving_type',
        label: 'Serving Type',
        type: 'select',
        required: false,
        options: ['Shot', 'Glass', 'Bottle', 'Bucket (5)', 'Bucket (6)', 'Jug', 'Pitcher'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'alcohol_content',
        label: 'Alcohol Content',
        type: 'number',
        required: false,
        placeholder: '5',
        unit: '%',
        helpText: 'ABV percentage',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Hennessy, Star, Guinness',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'origin_country',
        label: 'Country of Origin',
        type: 'text',
        required: false,
        placeholder: 'e.g., Nigeria, France, Scotland',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'serve_temp',
        label: 'Serve Temperature',
        type: 'select',
        required: false,
        options: ['Chilled', 'Room Temperature', 'On Ice', 'Frozen'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'bottle_size',
        label: 'Bottle Size',
        type: 'select',
        required: false,
        options: ['330ml', '500ml', '750ml', '1L', '1.5L', '3L'],
        helpText: 'For bottles',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'mixer_included',
        label: 'Mixer Included',
        type: 'multiselect',
        required: false,
        options: ['Coke', 'Sprite', 'Tonic', 'Soda Water', 'Energy Drink', 'Juice', 'None'],
        helpText: 'Complimentary mixers',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'age_restricted',
        label: 'Age Restricted (18+)',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 5. BUTCHER SHOP / MEAT MARKET
  // ============================================
  {
    id: 'butcher',
    name: 'Butcher Shop / Meat Market',
    description: 'Butchers, meat markets, and fresh meat vendors',
    icon: 'Beef',
    emoji: '🥩',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_weight',
    tags: ['butcher', 'meat', 'beef', 'chicken', 'goat', 'pork', 'fresh meat'],
    defaultUnits: ['kg', 'lb', 'pieces'],
    defaultCategories: [
      { name: 'Beef', icon: '🥩', description: 'Cow meat cuts' },
      { name: 'Chicken', icon: '🍗', description: 'Fresh chicken and parts' },
      { name: 'Goat', icon: '🐐', description: 'Goat meat' },
      { name: 'Pork', icon: '🥓', description: 'Pork cuts' },
      { name: 'Turkey', icon: '🦃', description: 'Turkey meat' },
      { name: 'Lamb', icon: '🐑', description: 'Lamb and mutton' },
      { name: 'Offal', icon: '🫀', description: 'Organ meats' },
      { name: 'Processed', icon: '🌭', description: 'Sausages, bacon, ham' },
      { name: 'Marinated', icon: '🍖', description: 'Pre-seasoned meats' },
    ],
    productFields: [
      {
        name: 'meat_type',
        label: 'Meat Type',
        type: 'select',
        required: true,
        options: ['Beef', 'Chicken', 'Goat', 'Pork', 'Turkey', 'Lamb', 'Duck', 'Rabbit', 'Bush Meat'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'cut_type',
        label: 'Cut Type',
        type: 'select',
        required: false,
        options: ['Whole', 'Half', 'Quarter', 'Fillet', 'Steak', 'Chops', 'Ribs', 'Minced/Ground', 'Cubed', 'Shredded', 'Drumsticks', 'Wings', 'Breast', 'Thighs', 'Offal'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'state',
        label: 'State',
        type: 'select',
        required: false,
        options: ['Fresh', 'Frozen', 'Chilled'],
        defaultValue: 'Fresh',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'bone_option',
        label: 'Bone Option',
        type: 'select',
        required: false,
        options: ['Bone-In', 'Boneless', 'With Bone Available'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'halal_certified',
        label: 'Halal Certified',
        type: 'boolean',
        required: false,
        defaultValue: false,
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'weight_range',
        label: 'Typical Weight Range',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1-1.5kg per piece',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order',
        type: 'text',
        required: false,
        placeholder: 'e.g., 500g, 1kg',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'processing_options',
        label: 'Processing Options',
        type: 'multiselect',
        required: false,
        options: ['Cut to Size', 'Cleaned', 'Deboned', 'Skinned', 'Marinated', 'Packaged'],
        helpText: 'Additional services offered',
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 6. FISH MARKET / SEAFOOD
  // ============================================
  {
    id: 'seafood',
    name: 'Fish Market / Seafood',
    description: 'Fish markets, seafood vendors, and fresh catch sellers',
    icon: 'Fish',
    emoji: '🐟',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_weight',
    tags: ['fish', 'seafood', 'fresh fish', 'shrimp', 'crab', 'fish market'],
    defaultUnits: ['kg', 'lb', 'pieces', 'bunch'],
    defaultCategories: [
      { name: 'Fresh Fish', icon: '🐟', description: 'Whole fresh fish' },
      { name: 'Frozen Fish', icon: '🧊', description: 'Frozen varieties' },
      { name: 'Smoked Fish', icon: '🔥', description: 'Smoked and dried' },
      { name: 'Dried Fish', icon: '☀️', description: 'Sun-dried fish' },
      { name: 'Shrimp/Prawns', icon: '🦐', description: 'Fresh and frozen shrimp' },
      { name: 'Crab', icon: '🦀', description: 'Fresh crabs' },
      { name: 'Snails', icon: '🐌', description: 'Fresh snails' },
      { name: 'Crayfish', icon: '🦞', description: 'Crayfish and lobster' },
      { name: 'Stockfish', icon: '🐡', description: 'Preserved fish' },
    ],
    productFields: [
      {
        name: 'fish_type',
        label: 'Fish/Seafood Type',
        type: 'select',
        required: true,
        options: ['Tilapia', 'Catfish', 'Mackerel', 'Croaker', 'Salmon', 'Tuna', 'Cod', 'Sardines', 'Shrimp', 'Prawns', 'Crab', 'Lobster', 'Crayfish', 'Snails', 'Periwinkle', 'Stockfish', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'state',
        label: 'State',
        type: 'select',
        required: true,
        options: ['Live', 'Fresh', 'Frozen', 'Smoked', 'Dried', 'Salted'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size_grade',
        label: 'Size Grade',
        type: 'select',
        required: false,
        options: ['Small', 'Medium', 'Large', 'Jumbo', 'Mixed Sizes'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'cleaning_option',
        label: 'Cleaning',
        type: 'select',
        required: false,
        options: ['Whole (Uncleaned)', 'Cleaned', 'Filleted', 'Cut Pieces', 'Headless'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'origin',
        label: 'Source',
        type: 'select',
        required: false,
        options: ['Local (Fresh Catch)', 'Farmed', 'Imported'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'catch_date',
        label: 'Catch/Arrival Date',
        type: 'date',
        required: false,
        helpText: 'When the fish was caught or received',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'minimum_order',
        label: 'Minimum Order',
        type: 'text',
        required: false,
        placeholder: 'e.g., 1kg, 500g',
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 7. FOOD TRUCK / STREET FOOD
  // ============================================
  {
    id: 'food_truck',
    name: 'Food Truck / Street Food',
    description: 'Food trucks, street food vendors, mobile kitchens',
    icon: 'Truck',
    emoji: '🚚',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['food truck', 'street food', 'mobile', 'outdoor', 'vendor', 'fast food'],
    defaultUnits: ['portion', 'wrap', 'plate', 'stick'],
    defaultCategories: [
      { name: 'Grills & BBQ', icon: '🍖', description: 'Grilled meats and suya' },
      { name: 'Wraps & Shawarma', icon: '🌯', description: 'Wrapped items' },
      { name: 'Rice Dishes', icon: '🍚', description: 'Jollof, fried rice' },
      { name: 'Noodles', icon: '🍜', description: 'Indomie and noodles' },
      { name: 'Snacks', icon: '🍟', description: 'Small chops, fries' },
      { name: 'Soups & Stews', icon: '🍲', description: 'Traditional soups' },
      { name: 'Drinks', icon: '🥤', description: 'Beverages' },
      { name: 'Desserts', icon: '🍨', description: 'Sweet treats' },
    ],
    productFields: [
      {
        name: 'portion_size',
        label: 'Portion Size',
        type: 'select',
        required: false,
        options: ['Small', 'Regular', 'Large', 'Extra Large', 'Single Stick', 'Half Dozen', 'Dozen'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'spice_level',
        label: 'Spice Level',
        type: 'select',
        required: false,
        options: ['No Pepper', 'Small Pepper', 'Medium', 'Pepper Soup Level', 'Fire! 🔥'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'protein_option',
        label: 'Protein Options',
        type: 'multiselect',
        required: false,
        options: ['Chicken', 'Beef', 'Goat', 'Fish', 'Turkey', 'Egg', 'Tofu', 'None'],
        helpText: 'Available protein add-ons',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'combo_available',
        label: 'Combo Deal Available',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Can be part of a combo meal',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'wait_time',
        label: 'Typical Wait Time',
        type: 'select',
        required: false,
        options: ['Instant', '5 minutes', '10 minutes', '15 minutes', '20+ minutes'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'best_seller',
        label: 'Best Seller',
        type: 'boolean',
        required: false,
        defaultValue: false,
        sortOrder: 6,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 8. CATERING SERVICE
  // ============================================
  {
    id: 'catering',
    name: 'Catering Service',
    description: 'Event catering, party food services, bulk food orders',
    icon: 'ChefHat',
    emoji: '🍱',
    sector: 'food_beverage',
    isServiceBased: true,
    pricingModel: 'per_person',
    tags: ['catering', 'events', 'party', 'wedding', 'corporate', 'bulk food'],
    defaultUnits: ['per person', 'per tray', 'per event'],
    defaultCategories: [
      { name: 'Wedding Packages', icon: '💒', description: 'Wedding catering' },
      { name: 'Corporate Events', icon: '🏢', description: 'Business functions' },
      { name: 'Birthday Parties', icon: '🎂', description: 'Birthday celebrations' },
      { name: 'Funeral Services', icon: '🕯️', description: 'Funeral catering' },
      { name: 'Naming Ceremonies', icon: '👶', description: 'Baby naming events' },
      { name: 'Small Chops', icon: '🍢', description: 'Finger foods and appetizers' },
      { name: 'Main Dishes', icon: '🍛', description: 'Main course items' },
      { name: 'Drinks Packages', icon: '🍹', description: 'Beverage packages' },
      { name: 'Dessert Tables', icon: '🍰', description: 'Sweet treats setup' },
    ],
    productFields: [
      {
        name: 'event_type',
        label: 'Event Type',
        type: 'select',
        required: false,
        options: ['Wedding', 'Corporate', 'Birthday', 'Funeral', 'Naming Ceremony', 'Graduation', 'Anniversary', 'Religious', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: false,
        options: ['Buffet', 'Plated Service', 'Food Packs', 'Cocktail Style', 'Family Style', 'Food Stations'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'minimum_guests',
        label: 'Minimum Guests',
        type: 'number',
        required: false,
        placeholder: '50',
        helpText: 'Minimum number of people',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'maximum_guests',
        label: 'Maximum Guests',
        type: 'number',
        required: false,
        placeholder: '500',
        helpText: 'Maximum capacity',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'menu_items',
        label: 'Menu Items Included',
        type: 'textarea',
        required: false,
        placeholder: 'List all items in this package...',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'equipment_included',
        label: 'Equipment Included',
        type: 'multiselect',
        required: false,
        options: ['Chafing Dishes', 'Serving Utensils', 'Tables', 'Chairs', 'Table Cloths', 'Decorations', 'Waiters', 'Plates & Cutlery'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'lead_time',
        label: 'Booking Lead Time',
        type: 'select',
        required: false,
        options: ['24 Hours', '48 Hours', '1 Week', '2 Weeks', '1 Month'],
        helpText: 'Advance booking required',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'delivery_setup',
        label: 'Delivery & Setup',
        type: 'select',
        required: false,
        options: ['Delivery Only', 'Delivery + Setup', 'Full Service', 'Pickup Available'],
        sortOrder: 8,
        group: 'details'
      },
      {
        name: 'deposit_required',
        label: 'Deposit Required (%)',
        type: 'number',
        required: false,
        placeholder: '50',
        unit: '%',
        sortOrder: 9,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 9. ICE CREAM / FROZEN TREATS
  // ============================================
  {
    id: 'ice_cream',
    name: 'Ice Cream / Frozen Treats',
    description: 'Ice cream shops, frozen yogurt, popsicles, gelato',
    icon: 'IceCream',
    emoji: '🍦',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['ice cream', 'frozen', 'dessert', 'gelato', 'popsicle', 'frozen yogurt'],
    defaultUnits: ['scoop', 'cup', 'cone', 'tub'],
    defaultCategories: [
      { name: 'Ice Cream', icon: '🍨', description: 'Classic ice cream' },
      { name: 'Gelato', icon: '🍧', description: 'Italian gelato' },
      { name: 'Frozen Yogurt', icon: '🥛', description: 'Healthier option' },
      { name: 'Sorbet', icon: '🍋', description: 'Fruit-based ice' },
      { name: 'Popsicles', icon: '🧊', description: 'Ice lollies' },
      { name: 'Sundaes', icon: '🍨', description: 'Topped creations' },
      { name: 'Milkshakes', icon: '🥤', description: 'Blended drinks' },
      { name: 'Tubs & Pints', icon: '🫙', description: 'Take-home sizes' },
    ],
    productFields: [
      {
        name: 'flavor',
        label: 'Flavor',
        type: 'select',
        required: true,
        options: ['Vanilla', 'Chocolate', 'Strawberry', 'Cookies & Cream', 'Mint Chocolate', 'Mango', 'Coconut', 'Banana', 'Caramel', 'Coffee', 'Pistachio', 'Bubblegum', 'Rainbow', 'Custom'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'serving_type',
        label: 'Serving Type',
        type: 'select',
        required: false,
        options: ['Single Scoop', 'Double Scoop', 'Triple Scoop', 'Cup (Small)', 'Cup (Medium)', 'Cup (Large)', 'Cone', 'Waffle Cone', 'Tub (500ml)', 'Tub (1L)'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'toppings_available',
        label: 'Available Toppings',
        type: 'multiselect',
        required: false,
        options: ['Sprinkles', 'Chocolate Sauce', 'Caramel Sauce', 'Nuts', 'Whipped Cream', 'Fresh Fruit', 'Oreo Crumbs', 'Gummy Bears', 'Wafer'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'dietary_info',
        label: 'Dietary Info',
        type: 'multiselect',
        required: false,
        options: ['Dairy-Free', 'Sugar-Free', 'Vegan', 'Gluten-Free', 'Contains Nuts', 'Low Fat'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'base_type',
        label: 'Base Type',
        type: 'select',
        required: false,
        options: ['Cream Based', 'Yogurt Based', 'Fruit Based (Sorbet)', 'Coconut Based'],
        sortOrder: 5,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 10. GROCERY / MINI MART
  // ============================================
  {
    id: 'grocery',
    name: 'Grocery / Mini Mart',
    description: 'Grocery stores, mini marts, convenience stores, supermarkets',
    icon: 'ShoppingCart',
    emoji: '🛒',
    sector: 'food_beverage',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['grocery', 'supermarket', 'mini mart', 'convenience', 'provisions', 'foodstuff'],
    defaultUnits: ['piece', 'pack', 'kg', 'litre', 'dozen'],
    defaultCategories: [
      { name: 'Beverages', icon: '🥤', description: 'Drinks and water' },
      { name: 'Snacks', icon: '🍿', description: 'Chips, biscuits, sweets' },
      { name: 'Canned Goods', icon: '🥫', description: 'Tinned foods' },
      { name: 'Dairy', icon: '🥛', description: 'Milk, cheese, yogurt' },
      { name: 'Bread & Bakery', icon: '🍞', description: 'Fresh bread items' },
      { name: 'Rice & Grains', icon: '🍚', description: 'Rice, beans, cereals' },
      { name: 'Cooking Oils', icon: '🫒', description: 'Oils and fats' },
      { name: 'Spices & Seasonings', icon: '🧂', description: 'Cooking essentials' },
      { name: 'Household', icon: '🧹', description: 'Cleaning supplies' },
      { name: 'Personal Care', icon: '🧴', description: 'Toiletries' },
      { name: 'Baby Products', icon: '👶', description: 'Baby food and items' },
      { name: 'Frozen Foods', icon: '🧊', description: 'Frozen items' },
    ],
    productFields: [
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Indomie, Peak, Dano',
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'size_weight',
        label: 'Size / Weight / Volume',
        type: 'text',
        required: false,
        placeholder: 'e.g., 500g, 1L, 12 pack',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'pack_size',
        label: 'Pack Size',
        type: 'select',
        required: false,
        options: ['Single', '3-Pack', '6-Pack', '12-Pack', 'Carton', 'Bag', 'Box'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'expiry_date',
        label: 'Expiry Date',
        type: 'date',
        required: false,
        helpText: 'Best before date',
        sortOrder: 4,
        group: 'inventory'
      },
      {
        name: 'barcode',
        label: 'Barcode',
        type: 'text',
        required: false,
        placeholder: 'Scan or enter barcode',
        sortOrder: 5,
        group: 'inventory'
      },
      {
        name: 'storage_type',
        label: 'Storage Requirements',
        type: 'select',
        required: false,
        options: ['Room Temperature', 'Refrigerated', 'Frozen', 'Cool & Dry'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'reorder_level',
        label: 'Reorder Level',
        type: 'number',
        required: false,
        placeholder: '10',
        helpText: 'Alert when stock falls below this',
        sortOrder: 7,
        group: 'inventory'
      },
      {
        name: 'supplier',
        label: 'Supplier',
        type: 'text',
        required: false,
        placeholder: 'Supplier name',
        sortOrder: 8,
        group: 'inventory'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getFoodBeverageCategory(id: string): BusinessCategory | undefined {
  return FOOD_BEVERAGE_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const FOOD_BEVERAGE_IDS = FOOD_BEVERAGE_CATEGORIES.map(cat => cat.id);
