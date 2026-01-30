// Edge Function: Verify Paystack Payment
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, isDevelopment } from '../_shared/utils.ts';
import { verifyPayment as verifyPaystack } from '../_shared/paystack.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('verify-payment - isDev:', isDev);

  try {
    const { reference, country } = await req.json();
    
    if (!reference || !country) {
      return errorResponse('reference and country are required', 400);
    }

    console.log('Verifying payment:', reference);

    // DEV MODE: Return mock success
    if (isDev) {
      console.log('[DEV] Mock payment verified');
      return successResponse({
        status: 'success',
        reference,
        amount: 10000,
        currency: country === 'GH' ? 'GHS' : 'NGN',
      });
    }

    // Verify with Paystack
    const result = await verifyPaystack(reference, country);

    if (!result.status || !result.data) {
      console.error('Paystack verify error:', result);
      return errorResponse(result.message || 'Payment verification failed', 500);
    }

    const supabase = createSupabaseClient();
    const paymentStatus = result.data.status === 'success' ? 'completed' : 'failed';

    // Update payment record
    await supabase.from('payments')
      .update({ 
        status: paymentStatus,
        verified_at: new Date().toISOString(),
        provider_response: result.data,
      })
      .eq('reference', reference);

    // Update order payment status if linked
    if (result.data.metadata?.orderId) {
      await supabase.from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', result.data.metadata.orderId);
    }

    return successResponse({
      status: result.data.status,
      reference: result.data.reference,
      amount: result.data.amount,
      currency: result.data.currency,
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return errorResponse('An unexpected error occurred', 500);
  }
});
