// Edge Function: Paystack Webhook Handler
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/utils.ts';
import { verifyWebhookSignature } from '../_shared/paystack.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('paystack-webhook received');

  try {
    const signature = req.headers.get('x-paystack-signature') || '';
    const body = await req.text();
    
    if (!signature) {
      console.error('Missing Paystack signature');
      return new Response('Invalid signature', { status: 400 });
    }

    // Parse the event to get country
    const event = JSON.parse(body);
    const country = event.data?.currency === 'GHS' ? 'GH' : 'NG';

    // Verify signature
    const isValid = await verifyWebhookSignature(body, signature, country);
    if (!isValid) {
      console.error('Invalid Paystack signature');
      return new Response('Invalid signature', { status: 401 });
    }

    console.log('Webhook event:', event.event);
    const supabase = createSupabaseClient();

    switch (event.event) {
      case 'charge.success': {
        const { reference, metadata } = event.data;
        console.log('Payment successful:', reference);

        // Update payment
        await supabase.from('payments')
          .update({ 
            status: 'completed',
            verified_at: new Date().toISOString(),
            provider_response: event.data,
          })
          .eq('reference', reference);

        // Update order
        if (metadata?.orderId) {
          await supabase.from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', metadata.orderId);
        }
        break;
      }

      case 'subscription.create': {
        const { subscription_code, customer, plan } = event.data;
        console.log('Subscription created:', subscription_code);

        await supabase.from('subscriptions').upsert({
          code: subscription_code,
          customer_email: customer.email,
          plan_code: plan.plan_code,
          status: 'active',
          provider: 'paystack',
        }, { onConflict: 'code' });
        break;
      }

      case 'subscription.disable': {
        const { subscription_code } = event.data;
        console.log('Subscription disabled:', subscription_code);

        await supabase.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('code', subscription_code);
        break;
      }

      case 'invoice.payment_failed': {
        const { subscription } = event.data;
        console.log('Payment failed for subscription:', subscription?.subscription_code);

        if (subscription?.subscription_code) {
          await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('code', subscription.subscription_code);
        }
        break;
      }

      default:
        console.log('Unhandled event:', event.event);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
});
