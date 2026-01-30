// Edge Function: Initialize Paystack Payment
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, isDevelopment } from '../_shared/utils.ts';
import { initializePayment } from '../_shared/paystack.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('process-payment - isDev:', isDev);

  try {
    const { amount, email, reference, country, orderId, metadata, callbackUrl } = await req.json();
    
    if (!amount || !email || !country) {
      return errorResponse('amount, email, and country are required', 400);
    }

    // Generate reference if not provided
    const paymentRef = reference || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Processing payment:', { amount, email, country, paymentRef });

    // DEV MODE: Return mock payment URL
    if (isDev) {
      console.log('[DEV] Mock payment initialized');
      return successResponse({
        authorization_url: `https://checkout.paystack.com/test/${paymentRef}`,
        access_code: 'test_access_code',
        reference: paymentRef,
      });
    }

    // Initialize Paystack payment
    const result = await initializePayment(
      amount,
      email,
      paymentRef,
      country,
      { orderId, ...metadata },
      callbackUrl
    );

    if (!result.status || !result.data) {
      console.error('Paystack error:', result);
      return errorResponse(result.message || 'Payment initialization failed', 500);
    }

    // Store payment record
    const supabase = createSupabaseClient();
    await supabase.from('payments').insert({
      reference: paymentRef,
      order_id: orderId,
      amount,
      currency: country === 'GH' ? 'GHS' : 'NGN',
      status: 'pending',
      provider: 'paystack',
      metadata: { email, ...metadata },
    });

    return successResponse({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    });

  } catch (error) {
    console.error('Process payment error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
