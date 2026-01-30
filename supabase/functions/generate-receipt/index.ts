// Edge Function: Generate Receipt HTML
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/utils.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return errorResponse('orderId is required', 400);
    }

    const supabase = createSupabaseClient();

    // Fetch order with items and store
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        store:stores(name, address, phone),
        customer:customers(name, phone),
        items:order_items(*, product:products(name, sku))
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Order fetch error:', error);
      return errorResponse('Order not found', 404);
    }

    // Generate HTML receipt
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${order.order_number}</title>
  <style>
    body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
    .store-name { font-size: 18px; font-weight: bold; }
    .section { margin: 15px 0; }
    .item { display: flex; justify-content: space-between; margin: 5px 0; }
    .total-line { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${order.store?.name || 'WarehousePOS'}</div>
    <div>${order.store?.address || ''}</div>
    <div>${order.store?.phone || ''}</div>
  </div>
  
  <div class="section">
    <div>Order: ${order.order_number}</div>
    <div>Date: ${new Date(order.created_at).toLocaleString()}</div>
    <div>Customer: ${order.customer?.name || 'Walk-in'}</div>
  </div>
  
  <div class="section">
    ${order.items?.map((item: any) => `
      <div class="item">
        <span>${item.quantity}x ${item.product?.name || 'Item'}</span>
        <span>${(item.total / 100).toFixed(2)}</span>
      </div>
    `).join('') || ''}
  </div>
  
  <div class="section total-line">
    <div class="item"><span>Subtotal</span><span>${(order.subtotal / 100).toFixed(2)}</span></div>
    ${order.delivery_fee ? `<div class="item"><span>Delivery</span><span>${(order.delivery_fee / 100).toFixed(2)}</span></div>` : ''}
    <div class="item"><span>TOTAL</span><span>${(order.total / 100).toFixed(2)}</span></div>
  </div>
  
  <div class="footer">
    <div>Payment: ${order.payment_method?.toUpperCase()}</div>
    <div>Status: ${order.payment_status?.toUpperCase()}</div>
    <div>---</div>
    <div>Thank you for your purchase!</div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Generate receipt error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
