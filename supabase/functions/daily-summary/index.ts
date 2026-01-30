// Edge Function: Daily Sales Summary
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, isDevelopment } from '../_shared/utils.ts';

interface Order {
  total: number;
  payment_status: string;
  status: string;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('daily-summary - isDev:', isDev);

  try {
    const { storeId, date } = await req.json();
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    const supabase = createSupabaseClient();

    // If specific store requested
    const storeFilter = storeId ? { store_id: storeId } : {};

    // Get stores to process
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, phone, owner:users(phone, country)')
      .match(storeFilter);

    if (!stores?.length) {
      return errorResponse('No stores found', 404);
    }

    const summaries = [];

    for (const store of stores) {
      // Get orders for the day
      const { data: orders } = await supabase
        .from('orders')
        .select('total, payment_status, status')
        .eq('store_id', store.id)
        .gte('created_at', `${targetDate}T00:00:00`)
        .lt('created_at', `${targetDate}T23:59:59`);

      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter((o: Order) => o.status === 'completed').length || 0;
      const totalRevenue = orders?.filter((o: Order) => o.payment_status === 'paid')
        .reduce((sum: number, o: Order) => sum + (o.total || 0), 0) || 0;
      const pendingPayments = orders?.filter((o: Order) => o.payment_status === 'pending')
        .reduce((sum: number, o: Order) => sum + (o.total || 0), 0) || 0;

      const summary = {
        storeId: store.id,
        storeName: store.name,
        date: targetDate,
        totalOrders,
        completedOrders,
        totalRevenue: totalRevenue / 100, // Convert from cents
        pendingPayments: pendingPayments / 100,
      };

      summaries.push(summary);

      // Send SMS summary to store owner (skip in dev)
      if (!isDev && store.owner?.phone) {
        const message = `Daily Summary for ${store.name} (${targetDate}): Orders: ${totalOrders}, Completed: ${completedOrders}, Revenue: ${(totalRevenue / 100).toFixed(2)}`;
        
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
      date: targetDate,
      summaries,
    });

  } catch (error) {
    console.error('Daily summary error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
