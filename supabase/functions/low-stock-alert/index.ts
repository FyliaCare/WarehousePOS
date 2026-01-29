// Edge Function: Low Stock Alert
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, isDevelopment } from '../_shared/utils.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('low-stock-alert - isDev:', isDev);

  try {
    const { storeId, threshold = 10 } = await req.json();
    
    const supabase = createSupabaseClient();

    // Get stores to check
    let storeQuery = supabase.from('stores').select('id, name, owner:users(phone, country)');
    if (storeId) {
      storeQuery = storeQuery.eq('id', storeId);
    }

    const { data: stores } = await storeQuery;
    if (!stores?.length) {
      return errorResponse('No stores found', 404);
    }

    const alerts = [];

    for (const store of stores) {
      // Get low stock products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, reorder_level')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .or(`stock_quantity.lte.${threshold},stock_quantity.lte.reorder_level`);

      if (!products?.length) continue;

      const lowStockItems = products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.stock_quantity,
        reorderLevel: p.reorder_level || threshold,
      }));

      alerts.push({
        storeId: store.id,
        storeName: store.name,
        lowStockItems,
        itemCount: lowStockItems.length,
      });

      // Send SMS alert to store owner (skip in dev)
      if (!isDev && store.owner?.phone && lowStockItems.length > 0) {
        const topItems = lowStockItems.slice(0, 3).map(i => i.name).join(', ');
        const message = `Low Stock Alert: ${lowStockItems.length} items need restocking. Top items: ${topItems}. Check your dashboard.`;
        
        await supabase.functions.invoke('send-sms', {
          body: {
            to: store.owner.phone,
            message,
            country: store.owner.country || 'GH',
          },
        });
      }
    }

    return successResponse({
      alerts,
      totalAlerts: alerts.reduce((sum, a) => sum + a.itemCount, 0),
    });

  } catch (error) {
    console.error('Low stock alert error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
