/**
 * Phase 6: Electronics & Technology Business Categories
 * 
 * 6 business types for electronics and technology industry:
 * 1. Electronics Store
 * 2. Phone & Accessories Shop
 * 3. Computer / IT Services
 * 4. Solar & Energy Solutions
 * 5. CCTV & Security Systems
 * 6. Gaming / Cyber Café
 */

import type { BusinessCategory } from './types';

export const ELECTRONICS_TECHNOLOGY_CATEGORIES: BusinessCategory[] = [
  // ============================================
  // 1. ELECTRONICS STORE
  // ============================================
  {
    id: 'electronics_store',
    name: 'Electronics Store',
    description: 'Consumer electronics, appliances, and gadgets',
    icon: 'Tv',
    emoji: '📺',
    sector: 'electronics_technology',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['electronics', 'appliances', 'gadgets', 'tv', 'audio', 'home appliances'],
    defaultUnits: ['piece', 'unit', 'set'],
    defaultCategories: [
      { name: 'TVs & Displays', icon: '📺', description: 'Televisions and monitors' },
      { name: 'Audio', icon: '🔊', description: 'Speakers, soundbars, headphones' },
      { name: 'Kitchen Appliances', icon: '🍳', description: 'Blenders, microwaves, etc.' },
      { name: 'Home Appliances', icon: '🏠', description: 'Fans, irons, vacuum' },
      { name: 'Air Conditioning', icon: '❄️', description: 'ACs and coolers' },
      { name: 'Refrigeration', icon: '🧊', description: 'Fridges and freezers' },
      { name: 'Laundry', icon: '🧺', description: 'Washing machines, dryers' },
      { name: 'Small Electronics', icon: '🔌', description: 'Chargers, cables, gadgets' },
      { name: 'Used/Refurbished', icon: '♻️', description: 'Pre-owned items' },
    ],
    productFields: [
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: true,
        placeholder: 'e.g., Samsung, LG, Sony, Hisense',
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'model',
        label: 'Model Number',
        type: 'text',
        required: false,
        placeholder: 'e.g., UA55TU7000',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['Brand New', 'UK Used (Grade A)', 'UK Used (Grade B)', 'Refurbished', 'Open Box'],
        defaultValue: 'Brand New',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'size_capacity',
        label: 'Size/Capacity',
        type: 'text',
        required: false,
        placeholder: 'e.g., 55 inches, 500L, 2HP',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'power_rating',
        label: 'Power Rating',
        type: 'text',
        required: false,
        placeholder: 'e.g., 150W, 1.5HP',
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '3 Months', '6 Months', '1 Year', '2 Years', 'Manufacturer Warranty'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'installation',
        label: 'Installation',
        type: 'select',
        required: false,
        options: ['Not Required', 'Free Installation', 'Installation Extra', 'Self Install'],
        sortOrder: 7,
        group: 'pricing'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Black, Silver, White',
        sortOrder: 8,
        group: 'variants'
      }
    ]
  },

  // ============================================
  // 2. PHONE & ACCESSORIES SHOP
  // ============================================
  {
    id: 'phone_accessories',
    name: 'Phone & Accessories Shop',
    description: 'Mobile phones, tablets, and accessories',
    icon: 'Smartphone',
    emoji: '📱',
    sector: 'electronics_technology',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['phone', 'mobile', 'accessories', 'smartphone', 'tablet', 'case', 'charger'],
    defaultUnits: ['piece', 'unit', 'set'],
    defaultCategories: [
      { name: 'Smartphones', icon: '📱', description: 'Mobile phones' },
      { name: 'Tablets', icon: '📲', description: 'iPads and tablets' },
      { name: 'Cases & Covers', icon: '🛡️', description: 'Phone protection' },
      { name: 'Chargers & Cables', icon: '🔌', description: 'Charging accessories' },
      { name: 'Power Banks', icon: '🔋', description: 'Portable chargers' },
      { name: 'Earphones/Airpods', icon: '🎧', description: 'Audio accessories' },
      { name: 'Screen Protectors', icon: '📄', description: 'Tempered glass, films' },
      { name: 'Smartwatches', icon: '⌚', description: 'Wearable devices' },
      { name: 'Repairs', icon: '🔧', description: 'Phone repair services' },
    ],
    productFields: [
      {
        name: 'brand',
        label: 'Brand',
        type: 'select',
        required: true,
        options: ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Nokia', 'Realme', 'Google', 'OnePlus', 'Generic', 'Other'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'model',
        label: 'Model',
        type: 'text',
        required: false,
        placeholder: 'e.g., iPhone 15 Pro, Galaxy S24',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['Brand New (Sealed)', 'Brand New (Open Box)', 'UK Used', 'US Used', 'Refurbished', 'Nigerian Used'],
        defaultValue: 'Brand New (Sealed)',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'storage',
        label: 'Storage',
        type: 'select',
        required: false,
        options: ['N/A', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
        sortOrder: 4,
        group: 'variants'
      },
      {
        name: 'ram',
        label: 'RAM',
        type: 'select',
        required: false,
        options: ['N/A', '2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB'],
        sortOrder: 5,
        group: 'variants'
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Black, Gold, Blue',
        sortOrder: 6,
        group: 'variants'
      },
      {
        name: 'compatible_model',
        label: 'Compatible With (for accessories)',
        type: 'text',
        required: false,
        placeholder: 'e.g., iPhone 14/15, Samsung S23',
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '1 Week', '1 Month', '3 Months', '6 Months', '1 Year'],
        sortOrder: 8,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 3. COMPUTER / IT SERVICES
  // ============================================
  {
    id: 'computer_it',
    name: 'Computer / IT Services',
    description: 'Computers, laptops, networking, and IT support',
    icon: 'Laptop',
    emoji: '💻',
    sector: 'electronics_technology',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['computer', 'laptop', 'IT', 'networking', 'repair', 'software', 'hardware'],
    defaultUnits: ['piece', 'unit', 'service', 'hour'],
    defaultCategories: [
      { name: 'Laptops', icon: '💻', description: 'Portable computers' },
      { name: 'Desktops', icon: '🖥️', description: 'Desktop computers' },
      { name: 'Printers', icon: '🖨️', description: 'Printers and scanners' },
      { name: 'Components', icon: '🔧', description: 'RAM, SSD, GPU, etc.' },
      { name: 'Networking', icon: '🌐', description: 'Routers, switches, cables' },
      { name: 'Peripherals', icon: '🖱️', description: 'Mouse, keyboard, webcam' },
      { name: 'Software', icon: '📀', description: 'Software and licenses' },
      { name: 'IT Services', icon: '🛠️', description: 'Repair, setup, support' },
    ],
    productFields: [
      {
        name: 'item_type',
        label: 'Item Type',
        type: 'select',
        required: true,
        options: ['Laptop', 'Desktop', 'All-in-One', 'Printer', 'Component', 'Peripheral', 'Networking', 'Software', 'Service'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., HP, Dell, Lenovo, Apple',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'model',
        label: 'Model',
        type: 'text',
        required: false,
        placeholder: 'e.g., ThinkPad T480, MacBook Pro M3',
        sortOrder: 3,
        group: 'details'
      },
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: false,
        options: ['Brand New', 'UK Used', 'US Used', 'Refurbished', 'Open Box'],
        defaultValue: 'Brand New',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'processor',
        label: 'Processor',
        type: 'text',
        required: false,
        placeholder: 'e.g., Intel i5 12th Gen, AMD Ryzen 5',
        sortOrder: 5,
        group: 'specs'
      },
      {
        name: 'ram',
        label: 'RAM',
        type: 'select',
        required: false,
        options: ['N/A', '4GB', '8GB', '16GB', '32GB', '64GB'],
        sortOrder: 6,
        group: 'specs'
      },
      {
        name: 'storage',
        label: 'Storage',
        type: 'text',
        required: false,
        placeholder: 'e.g., 256GB SSD, 1TB HDD',
        sortOrder: 7,
        group: 'specs'
      },
      {
        name: 'screen_size',
        label: 'Screen Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., 14 inches, 15.6 inches',
        sortOrder: 8,
        group: 'specs'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '1 Month', '3 Months', '6 Months', '1 Year'],
        sortOrder: 9,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 4. SOLAR & ENERGY SOLUTIONS
  // ============================================
  {
    id: 'solar_energy',
    name: 'Solar & Energy Solutions',
    description: 'Solar panels, inverters, batteries, and power solutions',
    icon: 'Sun',
    emoji: '☀️',
    sector: 'electronics_technology',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['solar', 'inverter', 'battery', 'energy', 'power', 'renewable', 'generator'],
    defaultUnits: ['piece', 'unit', 'set', 'kW'],
    defaultCategories: [
      { name: 'Solar Panels', icon: '☀️', description: 'PV panels' },
      { name: 'Inverters', icon: '🔌', description: 'Power inverters' },
      { name: 'Batteries', icon: '🔋', description: 'Deep cycle batteries' },
      { name: 'Charge Controllers', icon: '⚡', description: 'MPPT/PWM controllers' },
      { name: 'Complete Systems', icon: '🏠', description: 'Full solar kits' },
      { name: 'Generators', icon: '⛽', description: 'Backup generators' },
      { name: 'UPS', icon: '🔌', description: 'Uninterruptible power' },
      { name: 'Installation', icon: '🔧', description: 'Installation services' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Solar Panel', 'Inverter', 'Battery', 'Charge Controller', 'Complete System', 'Generator', 'UPS', 'Cables/Accessories', 'Installation Service'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Luminous, Sukam, Felicity, Genus',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'capacity',
        label: 'Capacity/Power Rating',
        type: 'text',
        required: true,
        placeholder: 'e.g., 5kVA, 200W, 200Ah',
        helpText: 'kVA for inverters, Watts for panels, Ah for batteries',
        sortOrder: 3,
        group: 'specs'
      },
      {
        name: 'voltage',
        label: 'Voltage',
        type: 'select',
        required: false,
        options: ['12V', '24V', '48V', '96V', 'N/A'],
        sortOrder: 4,
        group: 'specs'
      },
      {
        name: 'battery_type',
        label: 'Battery Type (if applicable)',
        type: 'select',
        required: false,
        options: ['N/A', 'Tubular', 'Lithium (LiFePO4)', 'Lead Acid', 'Gel', 'AGM'],
        sortOrder: 5,
        group: 'specs'
      },
      {
        name: 'inverter_type',
        label: 'Inverter Type (if applicable)',
        type: 'select',
        required: false,
        options: ['N/A', 'Pure Sine Wave', 'Modified Sine Wave', 'Hybrid (Solar)', 'Grid-Tie'],
        sortOrder: 6,
        group: 'specs'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '6 Months', '1 Year', '2 Years', '5 Years', '10 Years', '25 Years (Panels)'],
        sortOrder: 7,
        group: 'details'
      },
      {
        name: 'installation',
        label: 'Installation',
        type: 'select',
        required: false,
        options: ['Product Only', 'Free Installation', 'Installation Extra', 'Installation Service Only'],
        sortOrder: 8,
        group: 'pricing'
      }
    ]
  },

  // ============================================
  // 5. CCTV & SECURITY SYSTEMS
  // ============================================
  {
    id: 'cctv_security',
    name: 'CCTV & Security Systems',
    description: 'Security cameras, alarms, and access control systems',
    icon: 'Camera',
    emoji: '📹',
    sector: 'electronics_technology',
    isServiceBased: false,
    pricingModel: 'per_item',
    tags: ['cctv', 'security', 'camera', 'surveillance', 'alarm', 'access control'],
    defaultUnits: ['piece', 'unit', 'set', 'channel'],
    defaultCategories: [
      { name: 'CCTV Cameras', icon: '📹', description: 'Surveillance cameras' },
      { name: 'DVR/NVR', icon: '💾', description: 'Recording devices' },
      { name: 'Complete Kits', icon: '📦', description: 'Camera + DVR packages' },
      { name: 'Access Control', icon: '🚪', description: 'Biometric, card systems' },
      { name: 'Alarm Systems', icon: '🚨', description: 'Burglar alarms' },
      { name: 'Intercom', icon: '🔔', description: 'Video doorbells, intercoms' },
      { name: 'Installation', icon: '🔧', description: 'Installation services' },
      { name: 'Accessories', icon: '🔌', description: 'Cables, mounts, power' },
    ],
    productFields: [
      {
        name: 'product_type',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['CCTV Camera', 'DVR', 'NVR', 'Complete Kit', 'Access Control', 'Alarm System', 'Intercom/Video Doorbell', 'Installation Service', 'Accessories'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., Hikvision, Dahua, CP Plus',
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'camera_type',
        label: 'Camera Type',
        type: 'select',
        required: false,
        options: ['N/A', 'Dome', 'Bullet', 'PTZ', 'Turret', 'Hidden/Spy', 'Wireless/WiFi'],
        sortOrder: 3,
        group: 'specs'
      },
      {
        name: 'resolution',
        label: 'Resolution',
        type: 'select',
        required: false,
        options: ['N/A', '720p (1MP)', '1080p (2MP)', '2K (4MP)', '4K (8MP)', '5MP'],
        sortOrder: 4,
        group: 'specs'
      },
      {
        name: 'channels',
        label: 'Channels (DVR/NVR)',
        type: 'select',
        required: false,
        options: ['N/A', '4 Channel', '8 Channel', '16 Channel', '32 Channel'],
        sortOrder: 5,
        group: 'specs'
      },
      {
        name: 'storage',
        label: 'Storage (HDD)',
        type: 'select',
        required: false,
        options: ['N/A', 'No HDD', '500GB', '1TB', '2TB', '4TB'],
        sortOrder: 6,
        group: 'specs'
      },
      {
        name: 'features',
        label: 'Features',
        type: 'multiselect',
        required: false,
        options: ['Night Vision', 'Motion Detection', 'Audio Recording', 'Remote Viewing', 'AI/Smart Detection', 'Weatherproof', 'Two-Way Audio'],
        sortOrder: 7,
        group: 'specs'
      },
      {
        name: 'installation',
        label: 'Installation',
        type: 'select',
        required: false,
        options: ['Product Only', 'Free Installation', 'Installation Extra', 'Installation Service Only'],
        sortOrder: 8,
        group: 'pricing'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: ['No Warranty', '6 Months', '1 Year', '2 Years'],
        sortOrder: 9,
        group: 'details'
      }
    ]
  },

  // ============================================
  // 6. GAMING / CYBER CAFÉ
  // ============================================
  {
    id: 'gaming_cafe',
    name: 'Gaming / Cyber Café',
    description: 'Gaming equipment, consoles, and cyber café services',
    icon: 'Gamepad2',
    emoji: '🎮',
    sector: 'electronics_technology',
    isServiceBased: true,
    pricingModel: 'per_hour',
    tags: ['gaming', 'cyber', 'cafe', 'console', 'playstation', 'xbox', 'pc gaming'],
    defaultUnits: ['hour', 'session', 'piece'],
    defaultCategories: [
      { name: 'Gaming Time', icon: '⏱️', description: 'Hourly gaming sessions' },
      { name: 'Consoles', icon: '🎮', description: 'PS5, Xbox, Nintendo' },
      { name: 'PC Gaming', icon: '💻', description: 'Gaming PCs' },
      { name: 'Controllers', icon: '🕹️', description: 'Game controllers' },
      { name: 'Games', icon: '💿', description: 'Game titles' },
      { name: 'Internet/Browsing', icon: '🌐', description: 'Internet access' },
      { name: 'Printing/Services', icon: '🖨️', description: 'Print, scan, copy' },
      { name: 'Snacks & Drinks', icon: '🍿', description: 'Refreshments' },
    ],
    productFields: [
      {
        name: 'service_type',
        label: 'Service/Product Type',
        type: 'select',
        required: true,
        options: ['Gaming Session', 'Internet Browsing', 'Console Rental', 'Game Purchase', 'Controller/Accessory', 'Printing Service', 'Food/Drinks', 'Tournament Entry'],
        sortOrder: 1,
        group: 'details'
      },
      {
        name: 'platform',
        label: 'Platform',
        type: 'select',
        required: false,
        options: ['N/A', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC', 'VR'],
        sortOrder: 2,
        group: 'details'
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        required: false,
        options: ['N/A', '30 Minutes', '1 Hour', '2 Hours', '3 Hours', '5 Hours', 'Full Day', 'Night Package'],
        sortOrder: 3,
        group: 'pricing'
      },
      {
        name: 'game_title',
        label: 'Game Title (if applicable)',
        type: 'text',
        required: false,
        placeholder: 'e.g., FIFA 24, Call of Duty, GTA V',
        sortOrder: 4,
        group: 'details'
      },
      {
        name: 'players',
        label: 'Number of Players',
        type: 'select',
        required: false,
        options: ['1 Player', '2 Players', '3-4 Players', 'Multiplayer/Online'],
        sortOrder: 5,
        group: 'details'
      },
      {
        name: 'condition',
        label: 'Condition (for products)',
        type: 'select',
        required: false,
        options: ['N/A', 'Brand New', 'Used - Like New', 'Used - Good'],
        sortOrder: 6,
        group: 'details'
      },
      {
        name: 'membership',
        label: 'Membership Discount',
        type: 'select',
        required: false,
        options: ['Regular Price', 'Member Discount', 'Student Discount', 'Package Rate'],
        sortOrder: 7,
        group: 'pricing'
      }
    ]
  }
];

// Export helper function to get category by ID
export function getElectronicsTechnologyCategory(id: string): BusinessCategory | undefined {
  return ELECTRONICS_TECHNOLOGY_CATEGORIES.find(cat => cat.id === id);
}

// Export all category IDs for validation
export const ELECTRONICS_TECHNOLOGY_IDS = ELECTRONICS_TECHNOLOGY_CATEGORIES.map(cat => cat.id);
