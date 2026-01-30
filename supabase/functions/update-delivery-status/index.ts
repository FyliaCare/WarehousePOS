// Edge Function: Update Delivery Status
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, isDevelopment } from '../_shared/utils.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('update-delivery-status - isDev:', isDev);

  try {
    const { 
      deliveryId, 
      status, // 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
      notes,
      location, // { lat, lng }
    } = await req.json();
    
    if (!deliveryId || !status) {
      return errorResponse('deliveryId and status are required', 400);
    }

    const validStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return errorResponse('Invalid status', 400);
    }

    const supabase = createSupabaseClient();

    // Get delivery with order and customer info
    const { data: delivery, error: fetchError } = await supabase
      .from('delivery_assignments')
      .select('*, order:orders(*, customer:customers(*))')
      .eq('id', deliveryId)
      .single();

    if (fetchError || !delivery) {
      return errorResponse('Delivery not found', 404);
    }

    // Build update object
    const updateData: Record<string, any> = {
      status,
      notes: notes || delivery.notes,
      updated_at: new Date().toISOString(),
    };

    if (location) {
      updateData.current_lat = location.lat;
      updateData.current_lng = location.lng;
    }

    if (status === 'picked_up') {
      updateData.picked_up_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    // Update delivery
    const { data: updated, error: updateError } = await supabase
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', deliveryId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Update delivery error:', updateError);
      return errorResponse('Failed to update delivery', 500);
    }

    // Sync order status
    const orderStatusMap: Record<string, string> = {
      'picked_up': 'out_for_delivery',
      'in_transit': 'out_for_delivery',
      'delivered': 'completed',
      'failed': 'delivery_failed',
    };

    if (orderStatusMap[status]) {
      await supabase.from('orders')
        .update({ status: orderStatusMap[status] })
        .eq('id', delivery.order_id);
    }

    // Notify customer (skip in dev)
    if (!isDev && delivery.order?.customer?.phone) {
      const statusMessages: Record<string, string> = {
        'picked_up': 'Your order has been picked up and is on the way!',
        'in_transit': 'Your delivery is in transit.',
        'delivered': 'Your order has been delivered. Thank you!',
        'failed': 'Delivery attempt failed. We will retry soon.',
      };

      if (statusMessages[status]) {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: delivery.order.customer.phone,
            message: statusMessages[status],
            country: delivery.order.customer.country || 'GH',
          },
        });
      }
    }

    return successResponse({
      delivery: updated,
      message: 'Delivery status updated',
    });

  } catch (error) {
    console.error('Update delivery status error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
