// Edge Function: Assign Delivery to Rider
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, isDevelopment } from '../_shared/utils.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('assign-delivery - isDev:', isDev);

  try {
    const { orderId, riderId } = await req.json();
    
    if (!orderId || !riderId) {
      return errorResponse('orderId and riderId are required', 400);
    }

    const supabase = createSupabaseClient();

    // Verify order exists and is pending delivery
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, store:stores(name, phone)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return errorResponse('Order not found', 404);
    }

    // Verify rider exists and is available
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .select('*')
      .eq('id', riderId)
      .eq('is_active', true)
      .single();

    if (riderError || !rider) {
      return errorResponse('Rider not found or not available', 404);
    }

    // Create or update delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('delivery_assignments')
      .upsert({
        order_id: orderId,
        rider_id: riderId,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
      }, { onConflict: 'order_id' })
      .select('*')
      .single();

    if (deliveryError) {
      console.error('Delivery assign error:', deliveryError);
      return errorResponse('Failed to assign delivery', 500);
    }

    // Update order status
    await supabase.from('orders')
      .update({ status: 'processing' })
      .eq('id', orderId);

    // Notify rider via SMS (skip in dev)
    if (!isDev && rider.phone) {
      await supabase.functions.invoke('send-sms', {
        body: {
          to: rider.phone,
          message: `New delivery assigned! Order #${order.order_number}. Check your app for details.`,
          country: rider.country || 'GH',
        },
      });
    }

    return successResponse({
      delivery,
      message: 'Delivery assigned successfully',
    });

  } catch (error) {
    console.error('Assign delivery error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
