/**
 * Phase 5: Services & Professional Business Categories
 * 
 * 10 business types for service-based industries:
 * 1. Auto Mechanic / Garage
 * 2. Electrician
 * 3. Plumber
 * 4. Photographer / Studio
 * 5. Printing & Branding
 * 6. Laundry / Dry Cleaning
 * 7. Car Wash
 * 8. Event Planning / Rentals
 * 9. Tutoring / Education Center
 * 10. Gym / Fitness Center
 */

import type { BusinessCategory } from './types';

export const SERVICES_PROFESSIONAL_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. AUTO MECHANIC / GARAGE
  // ============================================
  {
    id: 'auto_mechanic',
    name: 'Auto Mechanic / Garage',
    description: 'Vehicle repairs, maintenance, and auto services',
    icon: 'Car',
    emoji: '🔧',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['mechanic', 'auto', 'car', 'repair', 'garage', 'vehicle', 'maintenance'],
    defaultUnits: ['service', 'job', 'hour'],
    defaultCategories: [
      { name: 'Engine Repairs', icon: '🔧', description: 'Engine work and rebuilds' },
      { name: 'Brake Service', icon: '🛑', description: 'Brake pads, discs, fluid' },
      { name: 'Oil & Fluids', icon: '🛢️', description: 'Oil change, coolant, transmission' },
      { name: 'Electrical', icon: '⚡', description: 'Battery, alternator, wiring' },
      { name: 'Suspension', icon: '🚗', description: 'Shocks, springs, alignment' },
      { name: 'AC Service', icon: '❄️', description: 'AC repair and regas' },
      { name: 'Tires', icon: '⭕', description: 'Tire change, balancing, repair' },
      { name: 'Body Work', icon: '🎨', description: 'Dents, painting, panels' },
      { name: 'Diagnostics', icon: '💻', description: 'Computer diagnostics' },
      { name: 'General Service', icon: '✅', description: 'Routine maintenance' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Repair', 'Maintenance', 'Replacement', 'Diagnostic', 'Installation', 'Inspection'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'vehicle_type',
        label: 'Vehicle Type',
        type: 'select',
        required: false,
        options: ['Sedan/Saloon', 'SUV/Jeep', 'Pickup/Truck', 'Van/Bus', 'Motorcycle', 'Tricycle (Keke)', 'Heavy Duty', 'All Vehicles'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'parts_included',
        label: 'Parts Included',
        type: 'select',
        required: false,
        options: ['Parts Included', 'Labor Only (Customer Parts)', 'Parts Extra'],
        sortOrder: 3,
        group: 'pricing'
      },
      {
        name: 'estimated_duration',
        label: 'Estimated Duration',
        type: 'select',
        required: false,
        options: ['30 Minutes', '1 Hour', '2-3 Hours', 'Half Day', 'Full Day', '2-3 Days', '1 Week+'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '1 Week', '1 Month', '3 Months', '6 Months', '1 Year'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'pickup_delivery',
        label: 'Pickup/Delivery',
        type: 'select',
        required: false,
        options: ['Customer Brings Vehicle', 'Pickup Available (Extra)', 'Home Service Available'],
        sortOrder: 6,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 2. ELECTRICIAN
  // ============================================
  {
    id: 'electrician',
    name: 'Electrician',
    description: 'Electrical installations, repairs, and wiring services',
    icon: 'Zap',
    emoji: '⚡',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['electrician', 'electrical', 'wiring', 'installation', 'power', 'lighting'],
    defaultUnits: ['service', 'point', 'hour', 'job'],
    defaultCategories: [
      { name: 'Wiring', icon: '🔌', description: 'House and office wiring' },
      { name: 'Lighting', icon: '💡', description: 'Light installation and repair' },
      { name: 'Appliance Install', icon: '🔧', description: 'AC, water heater, etc.' },
      { name: 'Panel/Breaker', icon: '⚡', description: 'Distribution boards, breakers' },
      { name: 'Repairs', icon: '🛠️', description: 'Fault finding and repairs' },
      { name: 'Generator', icon: '🔋', description: 'Generator installation/service' },
      { name: 'Solar', icon: '☀️', description: 'Solar panel installation' },
      { name: 'Security Systems', icon: '🔒', description: 'CCTV, alarms, access control' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['New Installation', 'Repair', 'Maintenance', 'Inspection', 'Upgrade', 'Fault Finding'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'property_type',
        label: 'Property Type',
        type: 'select',
        required: false,
        options: ['Residential', 'Commercial', 'Industrial', 'All Types'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'materials_included',
        label: 'Materials',
        type: 'select',
        required: false,
        options: ['Materials Included', 'Labor Only', 'Materials Extra'],
        sortOrder: 3,
        group: 'pricing'
      },
      {
        name: 'estimated_duration',
        label: 'Estimated Duration',
        type: 'select',
        required: false,
        options: ['1-2 Hours', 'Half Day', 'Full Day', '2-3 Days', '1 Week', 'Project Based'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'certification',
        label: 'Certification',
        type: 'boolean',
        required: false,
        defaultValue: false,
        helpText: 'Includes electrical certificate',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '1 Month', '3 Months', '6 Months', '1 Year'],
        sortOrder: 6,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. PLUMBER
  // ============================================
  {
    id: 'plumber',
    name: 'Plumber',
    description: 'Plumbing installations, repairs, and drainage services',
    icon: 'Droplets',
    emoji: '🔧',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['plumber', 'plumbing', 'pipes', 'water', 'drainage', 'bathroom'],
    defaultUnits: ['service', 'point', 'hour', 'job'],
    defaultCategories: [
      { name: 'Pipe Work', icon: '🔧', description: 'Pipe installation and repair' },
      { name: 'Drainage', icon: '🚿', description: 'Drain clearing and installation' },
      { name: 'Bathroom', icon: '🚽', description: 'Toilet, sink, shower install' },
      { name: 'Kitchen', icon: '🍳', description: 'Kitchen plumbing' },
      { name: 'Water Heater', icon: '🔥', description: 'Heater installation/repair' },
      { name: 'Tank/Pump', icon: '🛢️', description: 'Water tank and pump services' },
      { name: 'Leaks', icon: '💧', description: 'Leak detection and repair' },
      { name: 'Borehole', icon: '⛲', description: 'Borehole and well services' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['New Installation', 'Repair', 'Maintenance', 'Unblocking', 'Leak Repair', 'Replacement'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'property_type',
        label: 'Property Type',
        type: 'select',
        required: false,
        options: ['Residential', 'Commercial', 'Industrial', 'All Types'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'materials_included',
        label: 'Materials',
        type: 'select',
        required: false,
        options: ['Materials Included', 'Labor Only', 'Materials Extra'],
        sortOrder: 3,
        group: 'pricing'
      },
      {
        name: 'urgency',
        label: 'Service Type',
        type: 'select',
        required: false,
        options: ['Standard', 'Same Day', 'Emergency (24hr)', 'Scheduled'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'estimated_duration',
        label: 'Estimated Duration',
        type: 'select',
        required: false,
        options: ['1-2 Hours', 'Half Day', 'Full Day', '2-3 Days', 'Project Based'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '1 Month', '3 Months', '6 Months', '1 Year'],
        sortOrder: 6,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. PHOTOGRAPHER / STUDIO
  // ============================================
  {
    id: 'photographer',
    name: 'Photographer / Studio',
    description: 'Photography services, videography, and photo studio',
    icon: 'Camera',
    emoji: '📷',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['photography', 'photographer', 'studio', 'video', 'wedding', 'portrait'],
    defaultUnits: ['session', 'hour', 'event', 'package'],
    defaultCategories: [
      { name: 'Passport/ID Photos', icon: '🪪', description: 'Official document photos' },
      { name: 'Portrait', icon: '🖼️', description: 'Individual and family portraits' },
      { name: 'Wedding', icon: '💒', description: 'Wedding photography/video' },
      { name: 'Events', icon: '🎉', description: 'Parties, corporate events' },
      { name: 'Product', icon: '📦', description: 'Product photography' },
      { name: 'Videography', icon: '🎬', description: 'Video production' },
      { name: 'Editing', icon: '✨', description: 'Photo/video editing' },
      { name: 'Prints', icon: '🖨️', description: 'Photo printing services' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Photography', 'Videography', 'Photo + Video', 'Editing Only', 'Printing', 'Passport/ID Photo'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'event_type',
        label: 'Event/Session Type',
        type: 'select',
        required: false,
        options: ['Studio Portrait', 'Outdoor Shoot', 'Wedding', 'Birthday/Party', 'Corporate Event', 'Product Shoot', 'Fashion', 'Documentary'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        required: false,
        options: ['15 Minutes', '30 Minutes', '1 Hour', '2 Hours', 'Half Day', 'Full Day', 'Multi-Day'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'deliverables',
        label: 'Deliverables',
        type: 'select',
        required: false,
        options: ['Digital Files Only', 'Digital + Prints', 'Prints Only', 'Album Included', 'Video File', 'Custom Package'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'edited_photos_count',
        label: 'Edited Photos/Minutes',
        type: 'text',
        required: false,
        placeholder: 'e.g., 20 edited photos, 5 min video',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'turnaround_time',
        label: 'Turnaround Time',
        type: 'select',
        required: false,
        options: ['Same Day', '24 Hours', '3-5 Days', '1 Week', '2 Weeks', '3-4 Weeks'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'travel_included',
        label: 'Travel/Location',
        type: 'select',
        required: false,
        options: ['Studio Only', 'Travel Included', 'Travel Extra', 'Customer Location'],
        sortOrder: 7,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 5. PRINTING & BRANDING
  // ============================================
  {
    id: 'printing',
    name: 'Printing & Branding',
    description: 'Printing services, branding materials, and signage',
    icon: 'Printer',
    emoji: '🖨️',
    sector: 'services_professional',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['printing', 'branding', 'signage', 'banner', 'flyer', 'business cards'],
    defaultUnits: ['piece', 'copy', 'sqm', 'set'],
    defaultCategories: [
      { name: 'Business Cards', icon: '💳', description: 'Name and business cards' },
      { name: 'Flyers/Posters', icon: '📄', description: 'Promotional materials' },
      { name: 'Banners', icon: '🎌', description: 'Roll-up, flex, vinyl' },
      { name: 'Signage', icon: '🪧', description: 'Shop signs, 3D letters' },
      { name: 'Branding', icon: '✨', description: 'Branded items, merch' },
      { name: 'Stationery', icon: '📝', description: 'Letterheads, envelopes' },
      { name: 'Large Format', icon: '🖼️', description: 'Billboards, vehicle wraps' },
      { name: 'Packaging', icon: '📦', description: 'Boxes, labels, bags' },
    ],
    productFields: [
      {
        name: 'print_type',
        label: 'Print Type',
        type: 'select',
        required: true,
        options: ['Digital Print', 'Offset Print', 'Large Format', 'Screen Print', 'Sublimation', 'Embroidery', 'Engraving', 'Vinyl/Sticker'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Paper/Card', 'Vinyl/Flex', 'Fabric', 'Acrylic', 'Metal', 'Wood', 'Glass', 'PVC'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., A4, 3x6ft, 85x55mm',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'quantity_range',
        label: 'Minimum Quantity',
        type: 'select',
        required: false,
        options: ['1+', '10+', '25+', '50+', '100+', '500+', '1000+'],
        sortOrder: 4,
        group: 'pricing'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'select',
        required: false,
        options: ['Full Color', 'Black & White', 'Single Color', '2 Colors', 'Custom'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'finishing',
        label: 'Finishing',
        type: 'multiselect',
        required: false,
        options: ['None', 'Lamination (Matte)', 'Lamination (Glossy)', 'UV Coating', 'Embossing', 'Foiling', 'Die Cut', 'Binding'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'design_included',
        label: 'Design Service',
        type: 'select',
        required: false,
        options: ['Design Included', 'Design Extra', 'Customer Provides Design'],
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'turnaround',
        label: 'Turnaround Time',
        type: 'select',
        required: false,
        options: ['Same Day', '24 Hours', '2-3 Days', '1 Week', '2 Weeks'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 6. LAUNDRY / DRY CLEANING
  // ============================================
  {
    id: 'laundry',
    name: 'Laundry / Dry Cleaning',
    description: 'Laundry services, dry cleaning, and garment care',
    icon: 'Shirt',
    emoji: '👔',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_item',
    tags: ['laundry', 'dry cleaning', 'wash', 'iron', 'clothes', 'garment'],
    defaultUnits: ['piece', 'kg', 'load'],
    defaultCategories: [
      { name: 'Wash & Fold', icon: '🧺', description: 'Basic laundry service' },
      { name: 'Wash & Iron', icon: '👔', description: 'Laundry with ironing' },
      { name: 'Dry Cleaning', icon: '✨', description: 'Professional dry clean' },
      { name: 'Ironing Only', icon: '🔥', description: 'Press and iron service' },
      { name: 'Suits & Formal', icon: '🤵', description: 'Suits, gowns, formal wear' },
      { name: 'Bedding', icon: '🛏️', description: 'Sheets, duvets, blankets' },
      { name: 'Special Items', icon: '👗', description: 'Wedding dress, leather, etc.' },
      { name: 'Express', icon: '⚡', description: 'Same-day service' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Wash Only', 'Wash & Fold', 'Wash & Iron', 'Dry Clean', 'Iron Only', 'Stain Removal', 'Special Care'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'item_type',
        label: 'Item Type',
        type: 'select',
        required: false,
        options: ['Shirt/Blouse', 'Trousers/Pants', 'Dress', 'Suit (2pc)', 'Suit (3pc)', 'Jacket/Blazer', 'Coat', 'Bedding', 'Curtains', 'Other'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'fabric_type',
        label: 'Fabric Type',
        type: 'select',
        required: false,
        options: ['Regular', 'Delicate/Silk', 'Wool', 'Leather/Suede', 'Lace/Embroidered', 'Mixed'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'turnaround',
        label: 'Turnaround',
        type: 'select',
        required: false,
        options: ['Express (Same Day)', 'Express (24hr)', 'Standard (2-3 Days)', 'Economy (3-5 Days)'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'pickup_delivery',
        label: 'Pickup/Delivery',
        type: 'select',
        required: false,
        options: ['Drop-off Only', 'Pickup (Extra)', 'Delivery (Extra)', 'Pickup & Delivery (Extra)', 'Pickup & Delivery (Included)'],
        sortOrder: 5,
        group: 'pricing'
      },
      {
        name: 'starch',
        label: 'Starch Preference',
        type: 'select',
        required: false,
        options: ['No Starch', 'Light Starch', 'Medium Starch', 'Heavy Starch'],
        sortOrder: 6,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 7. CAR WASH
  // ============================================
  {
    id: 'car_wash',
    name: 'Car Wash',
    description: 'Vehicle cleaning, detailing, and valeting services',
    icon: 'Sparkles',
    emoji: '🚗',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['car wash', 'detailing', 'auto', 'cleaning', 'valet', 'vehicle'],
    defaultUnits: ['wash', 'service'],
    defaultCategories: [
      { name: 'Basic Wash', icon: '💧', description: 'Exterior wash' },
      { name: 'Full Wash', icon: '🚿', description: 'Interior + exterior' },
      { name: 'Premium Wash', icon: '✨', description: 'Detailed cleaning' },
      { name: 'Interior Only', icon: '🪑', description: 'Interior cleaning' },
      { name: 'Engine Wash', icon: '🔧', description: 'Engine bay cleaning' },
      { name: 'Detailing', icon: '💎', description: 'Full detailing service' },
      { name: 'Polish/Wax', icon: '🌟', description: 'Paint protection' },
      { name: 'Add-ons', icon: '➕', description: 'Extra services' },
    ],
    productFields: [
      {
        name: 'wash_type',
        label: 'Wash Type',
        type: 'select',
        required: true,
        options: ['Basic Exterior', 'Standard (Interior + Exterior)', 'Premium/Executive', 'Full Detailing', 'Interior Only', 'Engine Wash'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'vehicle_size',
        label: 'Vehicle Size',
        type: 'select',
        required: true,
        options: ['Sedan/Saloon', 'SUV/Jeep', 'Pickup/Truck', 'Van/Bus', 'Motorcycle', 'Tricycle'],
        sortOrder: 2,
        group: 'pricing'
      },
      {
        name: 'add_ons',
        label: 'Add-on Services',
        type: 'multiselect',
        required: false,
        options: ['Air Freshener', 'Tire Shine', 'Dashboard Polish', 'Leather Conditioning', 'Fabric Protection', 'Glass Coating', 'Underbody Wash'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Estimated Duration',
        type: 'select',
        required: false,
        options: ['15-20 Minutes', '30-45 Minutes', '1 Hour', '2-3 Hours', 'Half Day'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'mobile_service',
        label: 'Service Location',
        type: 'select',
        required: false,
        options: ['At Wash Bay', 'Mobile (Customer Location)', 'Both Available'],
        sortOrder: 5,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 8. EVENT PLANNING / RENTALS
  // ============================================
  {
    id: 'event_rentals',
    name: 'Event Planning / Rentals',
    description: 'Event equipment rentals, decoration, and planning services',
    icon: 'PartyPopper',
    emoji: '🎉',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_service',
    tags: ['events', 'party', 'wedding', 'rental', 'decoration', 'catering', 'planning'],
    defaultUnits: ['event', 'day', 'piece', 'package'],
    defaultCategories: [
      { name: 'Chairs & Tables', icon: '🪑', description: 'Seating and tables' },
      { name: 'Tents & Canopies', icon: '⛺', description: 'Event tents' },
      { name: 'Decoration', icon: '🎈', description: 'Event decoration' },
      { name: 'Sound/PA System', icon: '🔊', description: 'Audio equipment' },
      { name: 'Lighting', icon: '💡', description: 'Event lighting' },
      { name: 'Catering Equipment', icon: '🍽️', description: 'Serving items, chafing dishes' },
      { name: 'Full Planning', icon: '📋', description: 'Complete event planning' },
      { name: 'MC/Entertainment', icon: '🎤', description: 'MC and entertainment' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: ['Equipment Rental Only', 'Setup & Rental', 'Full Decoration', 'Event Planning', 'Full Package'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'event_type',
        label: 'Event Type',
        type: 'select',
        required: false,
        options: ['Wedding', 'Birthday', 'Funeral', 'Corporate', 'Religious', 'Graduation', 'Baby Shower', 'Other'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'guest_count',
        label: 'Guest Count Range',
        type: 'select',
        required: false,
        options: ['1-50', '51-100', '101-200', '201-500', '500+'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'rental_duration',
        label: 'Rental Duration',
        type: 'select',
        required: false,
        options: ['Half Day', '1 Day', '2 Days', '3 Days', 'Weekly'],
        sortOrder: 4,
        group: 'pricing'
      },
      {
        name: 'setup_included',
        label: 'Setup/Teardown',
        type: 'select',
        required: false,
        options: ['Self Setup', 'Setup Included', 'Setup & Teardown Included', 'Setup Extra'],
        sortOrder: 5,
        group: 'pricing'
      },
      {
        name: 'delivery',
        label: 'Delivery',
        type: 'select',
        required: false,
        options: ['Customer Pickup', 'Delivery Included', 'Delivery Extra (Based on Location)'],
        sortOrder: 6,
        group: 'pricing'
      },
      {
        name: 'deposit_required',
        label: 'Deposit Required',
        type: 'select',
        required: false,
        options: ['No Deposit', '25%', '50%', '100% Upfront'],
        sortOrder: 7,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 9. TUTORING / EDUCATION CENTER
  // ============================================
  {
    id: 'tutoring',
    name: 'Tutoring / Education Center',
    description: 'Private tutoring, lessons, and educational services',
    icon: 'GraduationCap',
    emoji: '📚',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_hour',
    tags: ['tutoring', 'education', 'lessons', 'teaching', 'school', 'learning'],
    defaultUnits: ['hour', 'session', 'month', 'term'],
    defaultCategories: [
      { name: 'Primary School', icon: '📖', description: 'Primary level subjects' },
      { name: 'Secondary/JHS', icon: '📚', description: 'JHS/JSS subjects' },
      { name: 'Senior High/WAEC', icon: '🎓', description: 'SHS and exam prep' },
      { name: 'Languages', icon: '🗣️', description: 'English, French, etc.' },
      { name: 'Computer/IT', icon: '💻', description: 'Computer training' },
      { name: 'Music', icon: '🎵', description: 'Music lessons' },
      { name: 'Professional', icon: '👔', description: 'Professional certifications' },
      { name: 'Test Prep', icon: '✍️', description: 'WAEC, SAT, IELTS prep' },
    ],
    productFields: [
      {
        name: 'subject',
        label: 'Subject/Course',
        type: 'select',
        required: true,
        options: ['Mathematics', 'English', 'Science', 'French', 'Social Studies', 'ICT/Computing', 'Music', 'Art', 'Accounting', 'Economics', 'All Subjects', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'level',
        label: 'Level',
        type: 'select',
        required: true,
        options: ['Nursery/KG', 'Primary 1-3', 'Primary 4-6', 'JHS/JSS', 'SHS/SSS', 'University', 'Adult/Professional'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'class_type',
        label: 'Class Type',
        type: 'select',
        required: false,
        options: ['One-on-One', 'Small Group (2-5)', 'Group Class (6-15)', 'Large Class (15+)', 'Online'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Session Duration',
        type: 'select',
        required: false,
        options: ['30 Minutes', '1 Hour', '1.5 Hours', '2 Hours', '3 Hours'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'frequency',
        label: 'Frequency',
        type: 'select',
        required: false,
        options: ['Once', 'Weekly', '2x per Week', '3x per Week', 'Daily', 'Monthly Package'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'location',
        label: 'Location',
        type: 'select',
        required: false,
        options: ['At Center', 'Home Visit', 'Online', 'Flexible'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'materials_included',
        label: 'Materials',
        type: 'select',
        required: false,
        options: ['Materials Included', 'Materials Extra', 'Student Provides'],
        sortOrder: 7,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 10. GYM / FITNESS CENTER
  // ============================================
  {
    id: 'gym',
    name: 'Gym / Fitness Center',
    description: 'Fitness memberships, personal training, and wellness services',
    icon: 'Dumbbell',
    emoji: '💪',
    sector: 'services_professional',
    isServiceBased: true,
    pricingModel: 'per_person',
    tags: ['gym', 'fitness', 'workout', 'training', 'exercise', 'health'],
    defaultUnits: ['session', 'day', 'month', 'membership'],
    defaultCategories: [
      { name: 'Memberships', icon: '🎫', description: 'Gym memberships' },
      { name: 'Personal Training', icon: '🏋️', description: 'One-on-one training' },
      { name: 'Group Classes', icon: '👥', description: 'Aerobics, yoga, etc.' },
      { name: 'Day Pass', icon: '🎟️', description: 'Single visit passes' },
      { name: 'Equipment Rental', icon: '💪', description: 'Equipment for home use' },
      { name: 'Supplements', icon: '🥤', description: 'Protein, vitamins' },
      { name: 'Merchandise', icon: '👕', description: 'Gym wear, accessories' },
      { name: 'Wellness', icon: '🧘', description: 'Massage, sauna' },
    ],
    productFields: [
      {
        name: 'membership_type',
        label: 'Membership/Service Type',
        type: 'select',
        required: true,
        options: ['Day Pass', 'Weekly', 'Monthly', 'Quarterly', 'Bi-Annual', 'Annual', 'Personal Training Session', 'Group Class', 'Product'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'access_level',
        label: 'Access Level',
        type: 'select',
        required: false,
        options: ['Basic (Gym Only)', 'Standard (Gym + Classes)', 'Premium (All Access)', 'VIP (All + Personal Trainer)'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'class_type',
        label: 'Class Type (if applicable)',
        type: 'select',
        required: false,
        options: ['N/A', 'Aerobics', 'Yoga', 'Spinning/Cycling', 'CrossFit', 'Zumba', 'Boxing/Kickboxing', 'HIIT', 'Pilates', 'Dance Fitness'],
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'time_slot',
        label: 'Time Slot',
        type: 'select',
        required: false,
        options: ['Any Time', 'Morning (5am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-10pm)', 'Off-Peak Only', '24/7 Access'],
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'trainer_sessions',
        label: 'PT Sessions Included',
        type: 'select',
        required: false,
        options: ['None', '1 Session', '2 Sessions', '4 Sessions', '8 Sessions', 'Unlimited'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'guest_passes',
        label: 'Guest Passes',
        type: 'select',
        required: false,
        options: ['None', '1 per Month', '2 per Month', '4 per Month'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'locker',
        label: 'Locker',
        type: 'select',
        required: false,
        options: ['Not Included', 'Shared Locker', 'Personal Locker Included', 'Personal Locker (Extra)'],
        sortOrder: 7,
        group: 'details'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getServicesProfessionalCategory(id: string): BusinessCategory | undefined {
  return SERVICES_PROFESSIONAL_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const SERVICES_PROFESSIONAL_IDS = SERVICES_PROFESSIONAL_CATEGORIES.map(cat => cat.id);
