// Edge Function: Create Order from Portal
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, isDevelopment } from '../_shared/utils.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('create-order - isDev:', isDev);

  try {
    const { 
      storeId, 
      customerName, 
      customerPhone, 
      customerEmail,
      deliveryType, // 'pickup' | 'delivery'
      deliveryAddress,
      deliveryFee,
      items, // { product_id, quantity, unit_price }[]
      paymentMethod, // 'cash' | 'card' | 'mobile_money'
      country,
    } = await req.json();
    
    if (!storeId || !customerName || !customerPhone || !items?.length) {
      return errorResponse('storeId, customerName, customerPhone, and items are required', 400);
    }

    const supabase = createSupabaseClient();
    const formattedPhone = formatPhone(customerPhone, country || 'GH');

    // Get or create customer
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', formattedPhone)
      .eq('store_id', storeId)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          store_id: storeId,
          name: customerName,
          phone: formattedPhone,
          email: customerEmail,
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Customer create error:', customerError);
        return errorResponse('Failed to create customer', 500);
      }
      customerId = newCustomer.id;
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const total = subtotal + (deliveryFee || 0);

    // Create order
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        store_id: storeId,
        customer_id: customerId,
        delivery_type: deliveryType || 'pickup',
        delivery_address: deliveryAddress,
        delivery_fee: deliveryFee || 0,
        subtotal,
        total,
        payment_method: paymentMethod || 'cash',
        payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
        status: 'pending',
      })
      .select('*')
      .single();

    if (orderError) {
      console.error('Order create error:', orderError);
      return errorResponse('Failed to create order', 500);
    }

    // Create order items and update stock
    for (const item of items) {
      // Get product name for the order item
      let productName = item.product_name || 'Unknown Product';
      let productSku = item.product_sku || null;
      
      if (item.product_id && !item.product_name) {
        const { data: product } = await supabase
          .from('products')
          .select('name, sku')
          .eq('id', item.product_id)
          .single();
        
        if (product) {
          productName = product.name;
          productSku = product.sku;
        }
      }
      
      // Insert order item
      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        product_name: productName,
        product_sku: productSku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      });

      if (itemError) {
        console.error('Failed to insert order item:', itemError);
      }

      // Decrease stock
      if (item.product_id) {
        const { error: stockError } = await supabase.rpc('decrease_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
        
        if (stockError) {
          console.error('Failed to decrease stock:', stockError);
        }
      }
    }

    // If card payment, initialize Paystack
    let paymentData = null;
    if (paymentMethod === 'card' && customerEmail) {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          amount: total * 100, // Convert to kobo/pesewas
          email: customerEmail,
          country: country || 'GH',
          orderId: order.id,
          callbackUrl: `${req.headers.get('origin')}/order-success`,
        },
      });

      if (!error && data?.success) {
        paymentData = data;
      }
    }

    return successResponse({
      order,
      orderNumber,
      paymentData,
    });

  } catch (error) {
    console.error('Create order error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
