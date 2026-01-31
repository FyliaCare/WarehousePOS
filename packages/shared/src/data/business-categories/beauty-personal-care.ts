/**
 * Phase 3: Beauty & Personal Care Business Categories
 * 
 * 8 business types for beauty and personal care industry:
 * 1. Barber Shop
 * 2. Hair Salon
 * 3. Nail Salon / Spa
 * 4. Makeup Studio
 * 5. Cosmetics / Beauty Supply
 * 6. Spa & Wellness
 * 7. Perfume / Fragrance Shop
 * 8. Skincare Clinic / Aesthetics
 */

import type { BusinessCategory } from './types';

export const BEAUTY_PERSONAL_CARE_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. BARBER SHOP
  // ============================================
  {
    id: 'barber_shop',
    name: 'Barber Shop',
    description: 'Barbershops, men\'s grooming, and haircut services',
    icon: 'Scissors',
    emoji: '💈',
    sector: 'beauty_personal_care',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['barber', 'haircut', 'grooming', 'men', 'shave', 'beard', 'trim'],
    defaultUnits: ['service'],
    defaultCategories: [
      { name: 'Haircuts', icon: '✂️', description: 'All haircut styles' },
      { name: 'Beard Services', icon: '🧔', description: 'Beard trim and shaping' },
      { name: 'Shaving', icon: '🪒', description: 'Clean shave services' },
      { name: 'Hair Treatment', icon: '💆', description: 'Scalp and hair care' },
      { name: 'Kids Cuts', icon: '👦', description: 'Children\'s haircuts' },
      { name: 'Styling', icon: '💇', description: 'Hair styling and design' },
      { name: 'Packages', icon: '🎁', description: 'Combo services' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Haircut', 'Beard Trim', 'Beard Shaping', 'Clean Shave', 'Head Shave', 'Line-up/Edge-up', 'Hair Wash', 'Scalp Treatment', 'Hair Coloring', 'Combo Package'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Duration (minutes)',
        type: 'number',
        required: false,
        placeholder: '30',
        unit: 'mins',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'hair_type',
        label: 'Hair Type',
        type: 'select',
        required: false,
        options: ['All Types', 'Short Hair', 'Long Hair', 'Afro/Kinky', 'Dreadlocks', 'Kids'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'style_complexity',
        label: 'Style Complexity',
        type: 'select',
        required: false,
        options: ['Basic', 'Standard', 'Complex/Design', 'Premium/Artistic'],
        helpText: 'Affects pricing',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'add_ons',
        label: 'Available Add-ons',
        type: 'multiselect',
        required: false,
        options: ['Hot Towel', 'Head Massage', 'Aftershave', 'Hair Product', 'Eyebrow Trim', 'Ear/Nose Hair'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'barber_level',
        label: 'Barber Level',
        type: 'select',
        required: false,
        options: ['Junior Barber', 'Senior Barber', 'Master Barber', 'Any Available'],
        helpText: 'Different pricing per level',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'appointment_required',
        label: 'Appointment Required',
        type: 'boolean',
        required: false,
        defaultValue: false,
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 2. HAIR SALON
  // ============================================
  {
    id: 'hair_salon',
    name: 'Hair Salon',
    description: 'Hair salons, braiding, weaving, and hair styling services',
    icon: 'Sparkles',
    emoji: '💇',
    sector: 'beauty_personal_care',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['salon', 'hair', 'braiding', 'weaving', 'styling', 'locs', 'extensions'],
    defaultUnits: ['service'],
    defaultCategories: [
      { name: 'Braiding', icon: '✨', description: 'All braiding styles' },
      { name: 'Weaving', icon: '💁', description: 'Weave installations' },
      { name: 'Locs/Dreadlocks', icon: '🔒', description: 'Loc services' },
      { name: 'Natural Hair', icon: '🌀', description: 'Natural hair styling' },
      { name: 'Relaxer/Perm', icon: '💆', description: 'Chemical treatments' },
      { name: 'Coloring', icon: '🎨', description: 'Hair coloring services' },
      { name: 'Treatments', icon: '💊', description: 'Hair treatments' },
      { name: 'Wash & Style', icon: '🚿', description: 'Washing and styling' },
      { name: 'Wigs', icon: '👩', description: 'Wig making and installation' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Box Braids', 'Cornrows', 'Knotless Braids', 'Twist', 'Locs Retwist', 'Loc Installation', 'Weave Sew-in', 'Quick Weave', 'Wig Install', 'Wig Making', 'Relaxer', 'Texturizer', 'Color/Dye', 'Highlights', 'Wash & Set', 'Silk Press', 'Treatment', 'Haircut/Trim', 'Crochet'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'hair_length',
        label: 'Hair Length',
        type: 'select',
        required: false,
        options: ['Short', 'Shoulder Length', 'Mid-Back', 'Waist Length', 'Extra Long'],
        helpText: 'Affects pricing for most services',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Estimated Duration',
        type: 'select',
        required: false,
        options: ['30 mins', '1 hour', '2 hours', '3 hours', '4 hours', '5 hours', '6+ hours', 'Full Day'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'hair_provided',
        label: 'Hair/Extensions Provided By',
        type: 'select',
        required: false,
        options: ['Salon (Included)', 'Salon (Extra Cost)', 'Customer Provides', 'Not Applicable'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'hair_type_brand',
        label: 'Hair Type/Brand (if provided)',
        type: 'text',
        required: false,
        placeholder: 'e.g., Xpression, Kanekalon, Human Hair',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'stylist_level',
        label: 'Stylist Level',
        type: 'select',
        required: false,
        options: ['Junior Stylist', 'Senior Stylist', 'Master Stylist', 'Creative Director'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'maintenance_timeline',
        label: 'Maintenance Timeline',
        type: 'select',
        required: false,
        options: ['1-2 weeks', '2-4 weeks', '4-6 weeks', '6-8 weeks', '2-3 months', '3+ months'],
        helpText: 'How long style typically lasts',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'appointment_required',
        label: 'Appointment Required',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. NAIL SALON / SPA
  // ============================================
  {
    id: 'nail_salon',
    name: 'Nail Salon / Spa',
    description: 'Nail care, manicure, pedicure, and nail art services',
    icon: 'Hand',
    emoji: '💅',
    sector: 'beauty_personal_care',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['nails', 'manicure', 'pedicure', 'nail art', 'gel', 'acrylic', 'spa'],
    defaultUnits: ['service'],
    defaultCategories: [
      { name: 'Manicure', icon: '💅', description: 'Hand and nail care' },
      { name: 'Pedicure', icon: '🦶', description: 'Foot and nail care' },
      { name: 'Nail Extensions', icon: '✨', description: 'Acrylics, gel extensions' },
      { name: 'Nail Art', icon: '🎨', description: 'Designs and decorations' },
      { name: 'Gel Polish', icon: '💎', description: 'Gel manicure/pedicure' },
      { name: 'Combo Packages', icon: '🎁', description: 'Mani-pedi combos' },
      { name: 'Repairs', icon: '🔧', description: 'Nail repairs and fixes' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Basic Manicure', 'Gel Manicure', 'Acrylic Full Set', 'Acrylic Fill', 'Gel Extensions', 'Polygel', 'Basic Pedicure', 'Spa Pedicure', 'Gel Pedicure', 'Mani-Pedi Combo', 'Nail Art', 'Polish Change', 'Nail Repair', 'Removal'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'nail_shape',
        label: 'Nail Shape',
        type: 'select',
        required: false,
        options: ['Square', 'Round', 'Oval', 'Almond', 'Stiletto', 'Coffin/Ballerina', 'Squoval', 'Customer Choice'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'nail_length',
        label: 'Nail Length',
        type: 'select',
        required: false,
        options: ['Natural', 'Short', 'Medium', 'Long', 'Extra Long', 'XXL'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Duration (minutes)',
        type: 'number',
        required: false,
        placeholder: '60',
        unit: 'mins',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'design_complexity',
        label: 'Design Complexity',
        type: 'select',
        required: false,
        options: ['Plain/Single Color', 'French Tip', 'Simple Design (2-3 nails)', 'Medium Design (all nails)', 'Complex/3D Art', 'Custom Design'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'add_ons',
        label: 'Available Add-ons',
        type: 'multiselect',
        required: false,
        options: ['Chrome/Mirror Finish', 'Gems/Rhinestones', 'Foil', 'Glitter', 'Hand Massage', 'Paraffin Wax', 'Hot Stone', 'Callus Removal', 'Nail Strengthener'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'appointment_required',
        label: 'Appointment Required',
        type: 'boolean',
        required: false,
        defaultValue: false,
        sortOrder: 7,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. MAKEUP STUDIO
  // ============================================
  {
    id: 'makeup_studio',
    name: 'Makeup Studio',
    description: 'Makeup artistry, bridal makeup, and beauty services',
    icon: 'Palette',
    emoji: '💄',
    sector: 'beauty_personal_care',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['makeup', 'bridal', 'mua', 'beauty', 'glam', 'cosmetics'],
    defaultUnits: ['service', 'session'],
    defaultCategories: [
      { name: 'Bridal Makeup', icon: '👰', description: 'Wedding day looks' },
      { name: 'Party/Glam', icon: '✨', description: 'Event and party makeup' },
      { name: 'Everyday/Natural', icon: '🌸', description: 'Subtle, natural looks' },
      { name: 'Editorial/Creative', icon: '🎨', description: 'Artistic makeup' },
      { name: 'Lessons', icon: '📚', description: 'Makeup tutorials' },
      { name: 'Lashes', icon: '👁️', description: 'Lash services' },
      { name: 'Packages', icon: '🎁', description: 'Combo deals' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Bridal Makeup', 'Bridal + Trial', 'Traditional Wedding', 'Court Wedding', 'Party/Owambe', 'Birthday Glam', 'Graduation', 'Photoshoot', 'Editorial', 'Everyday Makeup', 'Makeup Lesson', 'Lash Application', 'Gele Tying'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'makeup_style',
        label: 'Makeup Style',
        type: 'select',
        required: false,
        options: ['Natural/Soft Glam', 'Full Glam', 'Dramatic', 'Dewy', 'Matte', 'Traditional', 'Editorial/Creative', 'Client Choice'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        required: false,
        options: ['1 hour', '1.5 hours', '2 hours', '2.5 hours', '3 hours', '3+ hours'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'includes_lashes',
        label: 'Lashes Included',
        type: 'select',
        required: false,
        options: ['Yes - Strip Lashes', 'Yes - Individual Lashes', 'Yes - Customer Choice', 'No - Extra Cost', 'No - Customer Provides'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'includes_gele',
        label: 'Gele Tying Included',
        type: 'select',
        required: false,
        options: ['Yes - Included', 'No - Extra Cost', 'Not Applicable'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'location',
        label: 'Location',
        type: 'select',
        required: false,
        options: ['Studio', 'Client Location', 'Event Venue', 'Either (Client Choice)'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'travel_fee',
        label: 'Travel Fee',
        type: 'select',
        required: false,
        options: ['Included', 'Extra (Within City)', 'Extra (Outside City)', 'Not Applicable'],
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'touch_up_kit',
        label: 'Touch-up Kit Included',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Mini kit for touch-ups during event',
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
  // 5. COSMETICS / BEAUTY SUPPLY
  // ============================================
  {
    id: 'cosmetics_store',
    name: 'Cosmetics / Beauty Supply',
    description: 'Beauty products, skincare, makeup, and hair products retail',
    icon: 'Sparkles',
    emoji: '🧴',
    sector: 'beauty_personal_care',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['cosmetics', 'beauty', 'skincare', 'makeup', 'hair products', 'beauty supply'],
    defaultUnits: ['piece', 'set', 'bottle'],
    defaultCategories: [
      { name: 'Skincare', icon: '🧴', description: 'Face and body care' },
      { name: 'Makeup', icon: '💄', description: 'Cosmetics and makeup' },
      { name: 'Hair Care', icon: '💁', description: 'Hair products' },
      { name: 'Fragrances', icon: '🌸', description: 'Perfumes and body sprays' },
      { name: 'Tools', icon: '🖌️', description: 'Brushes, sponges, tools' },
      { name: 'Nails', icon: '💅', description: 'Nail polish and supplies' },
      { name: 'Men\'s Grooming', icon: '🧔', description: 'Men\'s products' },
      { name: 'Sets & Gifts', icon: '🎁', description: 'Gift sets and bundles' },
    ],
    productFields: [
      {
        name: 'product_category',
        label: 'Product Category',
        type: 'select',
        required: true,
        options: ['Face Cream/Moisturizer', 'Serum', 'Cleanser', 'Toner', 'Sunscreen', 'Foundation', 'Concealer', 'Powder', 'Lipstick/Lipgloss', 'Eyeshadow', 'Mascara', 'Eyeliner', 'Brushes/Tools', 'Hair Oil', 'Shampoo', 'Conditioner', 'Hair Cream', 'Perfume', 'Body Lotion', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., MAC, Fenty, The Ordinary',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size_volume',
        label: 'Size / Volume',
        type: 'text',
        required: false,
        placeholder: 'e.g., 50ml, 100g, 30 pieces',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'skin_type',
        label: 'Skin Type (if applicable)',
        type: 'select',
        required: false,
        options: ['All Skin Types', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'Acne-Prone', 'Mature', 'Not Applicable'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'shade_color',
        label: 'Shade / Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Nude, Deep Brown, 42 Warm',
        sortOrder: 5,
        group: 'variants'
      },
      {
        name: 'ingredients_highlight',
        label: 'Key Ingredients',
        type: 'multiselect',
        required: false,
        options: ['Vitamin C', 'Retinol', 'Hyaluronic Acid', 'Niacinamide', 'Salicylic Acid', 'Shea Butter', 'Coconut Oil', 'Aloe Vera', 'SPF', 'Natural/Organic'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'expiry_date',
        label: 'Expiry Date',
        type: 'date',
        required: false,
        sortOrder: 7,
        group: 'inventory'
      },
      {
        name: 'origin',
        label: 'Origin',
        type: 'select',
        required: false,
        options: ['Local/Nigerian', 'USA', 'UK', 'Korean', 'French', 'Other International'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 6. SPA & WELLNESS
  // ============================================
  {
    id: 'spa_wellness',
    name: 'Spa & Wellness',
    description: 'Day spa, massage, body treatments, and wellness services',
    icon: 'Heart',
    emoji: '🧘',
    sector: 'beauty_personal_care',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['spa', 'massage', 'wellness', 'relaxation', 'facial', 'body treatment'],
    defaultUnits: ['session', 'hour'],
    defaultCategories: [
      { name: 'Massage', icon: '💆', description: 'Body massage services' },
      { name: 'Facials', icon: '✨', description: 'Face treatments' },
      { name: 'Body Treatments', icon: '🧖', description: 'Body scrubs, wraps' },
      { name: 'Waxing', icon: '🪒', description: 'Hair removal' },
      { name: 'Sauna/Steam', icon: '♨️', description: 'Heat therapies' },
      { name: 'Packages', icon: '🎁', description: 'Spa day packages' },
      { name: 'Couples', icon: '💑', description: 'Couples treatments' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Swedish Massage', 'Deep Tissue Massage', 'Hot Stone Massage', 'Aromatherapy Massage', 'Couples Massage', 'Basic Facial', 'Deep Cleansing Facial', 'Anti-Aging Facial', 'Body Scrub', 'Body Wrap', 'Waxing', 'Sauna', 'Steam Room', 'Spa Day Package', 'Bridal Package'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        required: true,
        options: ['30 minutes', '45 minutes', '60 minutes', '90 minutes', '2 hours', '3 hours', 'Half Day', 'Full Day'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'body_area',
        label: 'Body Area (for targeted services)',
        type: 'select',
        required: false,
        options: ['Full Body', 'Back & Shoulders', 'Head & Scalp', 'Feet', 'Hands', 'Face', 'Arms', 'Legs', 'Brazilian', 'Bikini', 'Underarms', 'Full Legs', 'Half Legs'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'therapist_level',
        label: 'Therapist Level',
        type: 'select',
        required: false,
        options: ['Standard', 'Senior', 'Expert/Master', 'Any Available'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'gender_preference',
        label: 'Therapist Gender',
        type: 'select',
        required: false,
        options: ['Male', 'Female', 'No Preference'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'add_ons',
        label: 'Available Add-ons',
        type: 'multiselect',
        required: false,
        options: ['Essential Oils Upgrade', 'Hot Stones', 'Scalp Massage', 'Foot Reflexology', 'Face Mask', 'Refreshments', 'Extended Time'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'appointment_required',
        label: 'Appointment Required',
        type: 'boolean',
        required: false,
        defaultValue: true,
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'membership_discount',
        label: 'Membership Discount Available',
        type: 'boolean',
        required: false,
        defaultValue: false,
        sortOrder: 8,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 7. PERFUME / FRAGRANCE SHOP
  // ============================================
  {
    id: 'perfume_shop',
    name: 'Perfume / Fragrance Shop',
    description: 'Perfumes, colognes, body mists, and fragrance retail',
    icon: 'Flower',
    emoji: '🌸',
    sector: 'beauty_personal_care',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['perfume', 'fragrance', 'cologne', 'scent', 'body spray', 'arabian'],
    defaultUnits: ['bottle', 'piece'],
    defaultCategories: [
      { name: 'Women\'s Perfume', icon: '👩', description: 'Ladies fragrances' },
      { name: 'Men\'s Cologne', icon: '👨', description: 'Men\'s fragrances' },
      { name: 'Unisex', icon: '🌟', description: 'Gender-neutral scents' },
      { name: 'Arabian/Oud', icon: '🕌', description: 'Middle Eastern fragrances' },
      { name: 'Designer', icon: '✨', description: 'High-end brands' },
      { name: 'Body Mists', icon: '🌊', description: 'Light body sprays' },
      { name: 'Oil Perfumes', icon: '💧', description: 'Concentrated oils' },
      { name: 'Gift Sets', icon: '🎁', description: 'Fragrance gift sets' },
    ],
    productFields: [
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Women', 'Men', 'Unisex'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Dior, Tom Ford, Lattafa',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size (ml)',
        type: 'select',
        required: true,
        options: ['5ml', '10ml', '15ml', '30ml', '50ml', '75ml', '100ml', '125ml', '150ml', '200ml'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'concentration',
        label: 'Concentration',
        type: 'select',
        required: false,
        options: ['Parfum (Pure)', 'Eau de Parfum (EDP)', 'Eau de Toilette (EDT)', 'Eau de Cologne (EDC)', 'Body Mist', 'Perfume Oil'],
        helpText: 'Strength of fragrance',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'scent_family',
        label: 'Scent Family',
        type: 'select',
        required: false,
        options: ['Floral', 'Woody', 'Fresh/Citrus', 'Oriental/Spicy', 'Fruity', 'Aquatic', 'Oud/Arabic', 'Gourmand/Sweet', 'Green', 'Musky'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'longevity',
        label: 'Longevity',
        type: 'select',
        required: false,
        options: ['Light (2-4 hrs)', 'Moderate (4-6 hrs)', 'Long (6-8 hrs)', 'Very Long (8+ hrs)', 'Beast Mode (12+ hrs)'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: false,
        options: ['Original/Authentic', 'Inspired By', 'Oil Perfume', 'Tester', 'Travel Size'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'occasion',
        label: 'Best For',
        type: 'multiselect',
        required: false,
        options: ['Daily Wear', 'Office', 'Evening/Night Out', 'Special Occasions', 'Date Night', 'Summer', 'Winter'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 8. SKINCARE CLINIC / AESTHETICS
  // ============================================
  {
    id: 'skincare_clinic',
    name: 'Skincare Clinic / Aesthetics',
    description: 'Medical aesthetics, skin treatments, and advanced skincare',
    icon: 'Sparkles',
    emoji: '✨',
    sector: 'beauty_personal_care',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['skincare', 'aesthetics', 'dermatology', 'facial', 'laser', 'peel', 'treatment'],
    defaultUnits: ['session', 'treatment'],
    defaultCategories: [
      { name: 'Facials', icon: '✨', description: 'Professional facials' },
      { name: 'Chemical Peels', icon: '🧪', description: 'Skin peeling treatments' },
      { name: 'Laser Treatments', icon: '💡', description: 'Laser skin procedures' },
      { name: 'Injectables', icon: '💉', description: 'Fillers and botox' },
      { name: 'Acne Treatment', icon: '🎯', description: 'Acne solutions' },
      { name: 'Anti-Aging', icon: '⏳', description: 'Age-defying treatments' },
      { name: 'Body Contouring', icon: '💪', description: 'Body sculpting' },
      { name: 'Consultations', icon: '🩺', description: 'Skin consultations' },
    ],
    productFields: [
      {
        name: 'treatment_type',
        label: 'Treatment Type',
        type: 'select',
        required: true,
        options: ['HydraFacial', 'Microdermabrasion', 'Chemical Peel (Light)', 'Chemical Peel (Medium)', 'Chemical Peel (Deep)', 'Laser Hair Removal', 'Laser Skin Rejuvenation', 'IPL Treatment', 'Microneedling', 'PRP Facial', 'Botox', 'Dermal Fillers', 'Acne Extraction', 'LED Light Therapy', 'Body Contouring', 'Skin Consultation'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'treatment_area',
        label: 'Treatment Area',
        type: 'select',
        required: false,
        options: ['Full Face', 'Forehead', 'Under Eyes', 'Cheeks', 'Lips', 'Chin', 'Neck', 'Chest/Décolletage', 'Hands', 'Full Body', 'Underarms', 'Bikini', 'Legs', 'Arms', 'Back'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'sessions_recommended',
        label: 'Sessions Recommended',
        type: 'select',
        required: false,
        options: ['Single Session', '3 Sessions', '4 Sessions', '6 Sessions', '8 Sessions', '10+ Sessions', 'Ongoing/Maintenance'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Duration (minutes)',
        type: 'number',
        required: false,
        placeholder: '60',
        unit: 'mins',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'downtime',
        label: 'Expected Downtime',
        type: 'select',
        required: false,
        options: ['None', 'Minimal (24 hrs)', '2-3 Days', '1 Week', '2 Weeks', 'Variable'],
        helpText: 'Recovery time needed',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'consultation_required',
        label: 'Consultation Required',
        type: 'boolean',
        required: false,
        defaultValue: true,
        helpText: 'Initial consultation needed before treatment',
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'practitioner_level',
        label: 'Practitioner',
        type: 'select',
        required: false,
        options: ['Aesthetician', 'Nurse', 'Doctor/Dermatologist', 'Specialist'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'contraindications',
        label: 'Not Suitable For',
        type: 'multiselect',
        required: false,
        options: ['Pregnant Women', 'Breastfeeding', 'Active Acne', 'Sensitive Skin', 'Recent Sun Exposure', 'On Certain Medications', 'Skin Conditions'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getBeautyPersonalCareCategory(id: string): BusinessCategory | undefined {
  return BEAUTY_PERSONAL_CARE_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const BEAUTY_PERSONAL_CARE_IDS = BEAUTY_PERSONAL_CARE_CATEGORIES.map(cat => cat.id);
