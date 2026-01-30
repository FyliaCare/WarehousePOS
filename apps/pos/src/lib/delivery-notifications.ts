import { supabase } from './supabase';
import type { CountryCode } from '@warehousepos/types';

export interface DeliveryNotificationPayload {
  orderId: string;
  orderNumber: string;
  trackingCode: string;
  customerPhone?: string;
  customerName?: string;
  deliveryAddress?: string;
  riderName?: string;
  riderPhone?: string;
  estimatedTime?: string;
  status: DeliveryStatus;
  country: CountryCode;
  storeId: string;
}

type DeliveryStatus = 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

// SMS templates for different delivery stages
const smsTemplates: Record<DeliveryStatus, (payload: DeliveryNotificationPayload) => string> = {
  pending: (p) => 
    `Hi ${p.customerName || 'Customer'}, your order #${p.orderNumber} is being prepared for delivery. Track: ${getTrackingUrl(p.trackingCode)}`,
  
  assigned: (p) => 
    `Good news! A rider (${p.riderName}) has been assigned to deliver your order #${p.orderNumber}. Track: ${getTrackingUrl(p.trackingCode)}`,
  
  accepted: (p) => 
    `Your rider ${p.riderName} is on the way to pick up your order #${p.orderNumber}. ETA: ${p.estimatedTime || 'Soon'}. Track: ${getTrackingUrl(p.trackingCode)}`,
  
  picked_up: (p) => 
    `🎉 Your order #${p.orderNumber} has been picked up! Rider: ${p.riderName} (${p.riderPhone}). Track: ${getTrackingUrl(p.trackingCode)}`,
  
  in_transit: (p) => 
    `🚀 Your order #${p.orderNumber} is on its way! ETA: ${p.estimatedTime || 'Soon'}. Contact rider: ${p.riderPhone}. Track: ${getTrackingUrl(p.trackingCode)}`,
  
  delivered: (p) => 
    `✅ Your order #${p.orderNumber} has been delivered! Thank you for your purchase. Rate your experience: ${getTrackingUrl(p.trackingCode)}`,
  
  failed: (p) => 
    `⚠️ Delivery attempt for order #${p.orderNumber} was unsuccessful. Please contact support or call the store.`,
  
  cancelled: (p) => 
    `Your delivery for order #${p.orderNumber} has been cancelled. Please contact the store for more information.`,
};

// WhatsApp message templates (richer formatting)
const whatsappTemplates: Record<DeliveryStatus, (payload: DeliveryNotificationPayload) => string> = {
  pending: (p) => 
    `🛒 *Order Confirmed*\n\nHi ${p.customerName || 'Customer'},\n\nYour order #${p.orderNumber} is being prepared for delivery.\n\n📍 *Delivery to:*\n${p.deliveryAddress || 'Your address'}\n\n🔗 Track your order:\n${getTrackingUrl(p.trackingCode)}`,
  
  assigned: (p) => 
    `🏍️ *Rider Assigned*\n\nGreat news ${p.customerName || ''}!\n\n*${p.riderName}* has been assigned to deliver your order #${p.orderNumber}.\n\n⏱️ ETA: ${p.estimatedTime || 'Soon'}\n\n🔗 Track live:\n${getTrackingUrl(p.trackingCode)}`,
  
  accepted: (p) => 
    `✨ *Order Accepted*\n\nYour rider *${p.riderName}* is heading to pick up order #${p.orderNumber}.\n\n📞 Contact rider: ${p.riderPhone}\n\n🔗 Track live:\n${getTrackingUrl(p.trackingCode)}`,
  
  picked_up: (p) => 
    `📦 *Order Picked Up*\n\nYour order #${p.orderNumber} is now with the rider!\n\n🏍️ *Rider:* ${p.riderName}\n📞 *Contact:* ${p.riderPhone}\n⏱️ *ETA:* ${p.estimatedTime || 'Soon'}\n\n🔗 Track live:\n${getTrackingUrl(p.trackingCode)}`,
  
  in_transit: (p) => 
    `🚀 *On the Way!*\n\nYour order #${p.orderNumber} is on its way to you!\n\n📍 *Delivering to:*\n${p.deliveryAddress || 'Your address'}\n\n🏍️ *Rider:* ${p.riderName}\n📞 *Call:* ${p.riderPhone}\n⏱️ *ETA:* ${p.estimatedTime || 'Any moment'}\n\n🔗 Track live:\n${getTrackingUrl(p.trackingCode)}`,
  
  delivered: (p) => 
    `✅ *Delivered!*\n\nYour order #${p.orderNumber} has been delivered.\n\nThank you for choosing us! 🙏\n\n⭐ Rate your delivery experience:\n${getTrackingUrl(p.trackingCode)}`,
  
  failed: (p) => 
    `❌ *Delivery Failed*\n\nWe were unable to complete delivery for order #${p.orderNumber}.\n\nPlease contact the store or reply to this message for assistance.`,
  
  cancelled: (p) => 
    `🚫 *Delivery Cancelled*\n\nYour delivery for order #${p.orderNumber} has been cancelled.\n\nFor any questions, please contact the store.`,
};

// Generate tracking URL
function getTrackingUrl(trackingCode: string): string {
  // In production, this would be your actual tracking domain
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/track/${trackingCode}`
    : `https://app.warehousepos.com/track/${trackingCode}`;
  return baseUrl;
}

// Generate short tracking code
export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar chars (I,O,0,1)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Send SMS notification
export async function sendDeliverySMS(payload: DeliveryNotificationPayload): Promise<boolean> {
  if (!payload.customerPhone) return false;
  
  try {
    const message = smsTemplates[payload.status](payload);
    
    const { error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: payload.customerPhone,
        message,
        country: payload.country,
      },
    });

    if (error) {
      console.error('SMS send failed:', error);
      return false;
    }

    // Log the notification
    await logNotification({
      ...payload,
      channel: 'sms',
      message,
    });

    return true;
  } catch (error) {
    console.error('SMS notification error:', error);
    return false;
  }
}

// Send WhatsApp notification
export async function sendDeliveryWhatsApp(payload: DeliveryNotificationPayload): Promise<boolean> {
  if (!payload.customerPhone) return false;
  
  try {
    const message = whatsappTemplates[payload.status](payload);
    
    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: payload.customerPhone,
        message,
        country: payload.country,
      },
    });

    if (error) {
      console.error('WhatsApp send failed:', error);
      return false;
    }

    // Log the notification
    await logNotification({
      ...payload,
      channel: 'whatsapp',
      message,
    });

    return true;
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return false;
  }
}

// Send notification via preferred channel
export async function sendDeliveryNotification(
  payload: DeliveryNotificationPayload,
  preferWhatsApp: boolean = true
): Promise<boolean> {
  // Try WhatsApp first if preferred
  if (preferWhatsApp) {
    const whatsappSent = await sendDeliveryWhatsApp(payload);
    if (whatsappSent) return true;
  }
  
  // Fall back to SMS
  return await sendDeliverySMS(payload);
}

// Log notification for audit
async function logNotification(data: {
  orderId: string;
  orderNumber: string;
  status: string;
  channel: 'sms' | 'whatsapp';
  message: string;
  storeId: string;
}): Promise<void> {
  try {
    await supabase.from('order_events').insert({
      order_id: data.orderId,
      event_type: 'notification',
      event_data: {
        channel: data.channel,
        status: data.status,
        message_preview: data.message.substring(0, 100),
      },
      created_at: new Date().toISOString(),
    } as never);
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

// Notify rider of new assignment
export async function notifyRiderAssignment(
  riderPhone: string,
  orderData: {
    orderNumber: string;
    pickupAddress: string;
    deliveryAddress: string;
    fee: number;
    country: CountryCode;
  }
): Promise<boolean> {
  try {
    const currencySymbol = orderData.country === 'NG' ? '₦' : 'GH₵';
    const message = `🆕 *New Delivery Assignment*\n\n` +
      `Order #${orderData.orderNumber}\n\n` +
      `📍 *Pickup:*\n${orderData.pickupAddress}\n\n` +
      `📍 *Deliver to:*\n${orderData.deliveryAddress}\n\n` +
      `💰 *Earnings:* ${currencySymbol}${(orderData.fee * 0.7).toFixed(2)}\n\n` +
      `Open your app to accept this delivery.`;

    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: riderPhone,
        message,
        country: orderData.country,
      },
    });

    return !error;
  } catch (error) {
    console.error('Rider notification error:', error);
    return false;
  }
}

// Batch notification for daily summary
export async function sendDailySummary(
  _storeId: string,
  recipientPhone: string,
  country: CountryCode,
  summary: {
    totalDeliveries: number;
    completed: number;
    failed: number;
    totalRevenue: number;
    topRider?: string;
  }
): Promise<boolean> {
  try {
    const currencySymbol = country === 'NG' ? '₦' : 'GH₵';
    const successRate = summary.totalDeliveries > 0 
      ? ((summary.completed / summary.totalDeliveries) * 100).toFixed(1) 
      : '0';

    const message = `📊 *Daily Delivery Summary*\n\n` +
      `📦 Total Deliveries: ${summary.totalDeliveries}\n` +
      `✅ Completed: ${summary.completed}\n` +
      `❌ Failed: ${summary.failed}\n` +
      `📈 Success Rate: ${successRate}%\n` +
      `💰 Revenue: ${currencySymbol}${summary.totalRevenue.toFixed(2)}\n` +
      (summary.topRider ? `\n🏆 Top Rider: ${summary.topRider}` : '');

    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: recipientPhone,
        message,
        country,
      },
    });

    return !error;
  } catch (error) {
    console.error('Daily summary error:', error);
    return false;
  }
}

// Status change handler - call this when delivery status changes
export async function onDeliveryStatusChange(
  orderId: string,
  newStatus: DeliveryStatus,
  storeId: string
): Promise<void> {
  try {
    // Fetch order and rider details
    const { data: order } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        tracking_code,
        customer_name,
        customer_phone,
        delivery_address,
        rider:riders(name, phone)
      `)
      .eq('id', orderId)
      .single();

    if (!order) return;

    // Fetch store for country
    const { data: store } = await supabase
      .from('stores')
      .select('tenant:tenants(country)')
      .eq('id', storeId)
      .single();

    const country = (store?.tenant as any)?.country || 'GH';
    const rider = order.rider as any;

    // Build notification payload
    const payload: DeliveryNotificationPayload = {
      orderId: order.id,
      orderNumber: order.order_number,
      trackingCode: order.tracking_code || generateTrackingCode(),
      customerPhone: order.customer_phone,
      customerName: order.customer_name,
      deliveryAddress: order.delivery_address,
      riderName: rider?.name,
      riderPhone: rider?.phone,
      status: newStatus,
      country,
      storeId,
    };

    // Send notification (prefer WhatsApp)
    await sendDeliveryNotification(payload, true);
  } catch (error) {
    console.error('Status change notification error:', error);
  }
}
