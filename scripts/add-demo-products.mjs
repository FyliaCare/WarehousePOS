// Add demo products to the existing store
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://diuxebnfkfbetotuhxhc.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addDemoProducts() {
  console.log('🛒 Adding demo products...\n');

  // Get existing store
  const { data: stores, error: storeError } = await supabase
    .from('stores')
    .select('id, name, tenant_id')
    .limit(1);

  if (storeError || !stores?.length) {
    console.error('❌ No store found:', storeError?.message);
    process.exit(1);
  }

  const store = stores[0];
  console.log(`📍 Found store: ${store.name} (${store.id})`);

  // Create categories
  const categories = [
    { name: 'Beverages', color: '#3B82F6', sort_order: 1 },
    { name: 'Snacks', color: '#F59E0B', sort_order: 2 },
    { name: 'Groceries', color: '#10B981', sort_order: 3 },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const { data, error } = await supabase
      .from('categories')
      .upsert({ 
        store_id: store.id, 
        name: cat.name, 
        color: cat.color, 
        sort_order: cat.sort_order,
        is_active: true 
      }, { onConflict: 'store_id,name' })
      .select()
      .single();
    
    if (data) {
      categoryMap[cat.name] = data.id;
      console.log(`✅ Category: ${cat.name}`);
    } else {
      // Try to get existing
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('store_id', store.id)
        .eq('name', cat.name)
        .single();
      if (existing) categoryMap[cat.name] = existing.id;
    }
  }

  // Demo products
  const products = [
    // Beverages
    { name: 'Coca-Cola 500ml', sku: 'COK-500', selling_price: 5.00, cost_price: 3.00, stock_quantity: 100, category: 'Beverages' },
    { name: 'Fanta Orange 500ml', sku: 'FAN-500', selling_price: 5.00, cost_price: 3.00, stock_quantity: 80, category: 'Beverages' },
    { name: 'Sprite 500ml', sku: 'SPR-500', selling_price: 5.00, cost_price: 3.00, stock_quantity: 75, category: 'Beverages' },
    { name: 'Voltic Water 1.5L', sku: 'VOL-1.5', selling_price: 3.00, cost_price: 1.50, stock_quantity: 200, category: 'Beverages' },
    { name: 'Malt Drink', sku: 'MLT-330', selling_price: 6.00, cost_price: 4.00, stock_quantity: 60, category: 'Beverages' },
    { name: 'Energy Drink 250ml', sku: 'ENG-250', selling_price: 8.00, cost_price: 5.00, stock_quantity: 50, category: 'Beverages' },
    
    // Snacks
    { name: 'Pringles Original', sku: 'PRG-ORI', selling_price: 15.00, cost_price: 10.00, stock_quantity: 30, category: 'Snacks' },
    { name: 'Digestive Biscuits', sku: 'DIG-200', selling_price: 8.00, cost_price: 5.00, stock_quantity: 45, category: 'Snacks' },
    { name: 'Plantain Chips', sku: 'PLC-150', selling_price: 6.00, cost_price: 3.50, stock_quantity: 60, category: 'Snacks' },
    { name: 'Groundnuts Pack', sku: 'GNT-100', selling_price: 4.00, cost_price: 2.00, stock_quantity: 100, category: 'Snacks' },
    
    // Groceries
    { name: 'Rice 5kg Bag', sku: 'RIC-5KG', selling_price: 85.00, cost_price: 65.00, stock_quantity: 25, category: 'Groceries' },
    { name: 'Cooking Oil 1L', sku: 'OIL-1L', selling_price: 25.00, cost_price: 18.00, stock_quantity: 40, category: 'Groceries' },
    { name: 'Sugar 1kg', sku: 'SUG-1KG', selling_price: 12.00, cost_price: 8.00, stock_quantity: 50, category: 'Groceries' },
    { name: 'Tomato Paste', sku: 'TOM-400', selling_price: 10.00, cost_price: 6.00, stock_quantity: 70, category: 'Groceries' },
    { name: 'Instant Noodles', sku: 'NOD-70G', selling_price: 3.00, cost_price: 1.80, stock_quantity: 150, category: 'Groceries' },
  ];

  console.log('\n📦 Adding products...');
  
  for (const p of products) {
    const { category, ...productData } = p;
    const { data, error } = await supabase
      .from('products')
      .upsert({
        store_id: store.id,
        category_id: categoryMap[category],
        ...productData,
        track_stock: true,
        is_active: true
      }, { onConflict: 'store_id,sku' })
      .select()
      .single();

    if (error) {
      console.log(`❌ ${p.name}: ${error.message}`);
    } else {
      console.log(`✅ ${p.name} - GHS ${p.selling_price.toFixed(2)}`);
    }
  }

  console.log('\n🎉 Demo products added! Refresh the POS page.');
}

addDemoProducts().catch(console.error);
