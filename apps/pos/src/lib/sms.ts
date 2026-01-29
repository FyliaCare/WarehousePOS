// ============================================
// ORDER NOTIFICATIONS SERVICE (SECURE)
// All SMS operations go through Edge Functions
// ============================================
import { supabase } from './supabase';

interface OrderNotification {
  orderId: string;
  orderNumber: string;
  status: string;
  customerPhone?: string;
  customerName?: string;
  storeName?: string;
  total?: number;
  trackingCode?: string;
  riderName?: string;
  riderPhone?: string;
  country?: 'GH' | 'NG';
}

// Get SMS message template based on status
function getStatusMessage(notification: OrderNotification): string {
  const { orderNumber, status, storeName, trackingCode, riderName, riderPhone } = notification;
  const store = storeName || 'the store';
  
  const templates: Record<string, string> = {
    confirmed: `Your order #${orderNumber} has been confirmed by ${store}. We're preparing it now. Track: ${trackingCode}`,
    preparing: `Good news! Your order #${orderNumber} is being prepared. We'll notify you when it's ready.`,
    ready: `Your order #${orderNumber} is ready for pickup/delivery! Please come to ${store} or wait for your rider.`,
    out_for_delivery: `Your order #${orderNumber} is on its way! Rider: ${riderName || 'Assigned'} ${riderPhone ? `(${riderPhone})` : ''}. Track: ${trackingCode}`,
    delivered: `Your order #${orderNumber} has been delivered. Thank you for shopping with ${store}!`,
    cancelled: `Your order #${orderNumber} has been cancelled. If you have questions, please contact ${store}.`,
  };
  
  return templates[status] || `Your order #${orderNumber} status: ${status.replace('_', ' ')}`;
}

// Send SMS via Edge Function (SECURE - no API keys exposed)
async function sendSMS(phone: string, message: string, country: 'GH' | 'NG' = 'GH'): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { to: phone, message, country },
    });
    
    if (error) {
      console.error('SMS send error:', error);
      return false;
    }
    
    return data?.success ?? false;
  } catch (err) {
    console.error('SMS exception:', err);
    return false;
  }
}

// Send WhatsApp via Edge Function (exported for future use)
export async function sendWhatsApp(
  phone: string, 
  templateName: string, 
  params: string[], 
  country: 'GH' | 'NG' = 'GH'
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { to: phone, templateName, params, country },
    });
    
    if (error) {
      console.error('WhatsApp send error:', error);
      return false;
    }
    
    return data?.success ?? false;
  } catch (err) {
    console.error('WhatsApp exception:', err);
    return false;
  }
}

// Main function to send order status notification
export async function sendOrderNotification(notification: OrderNotification): Promise<boolean> {
  const { customerPhone, country = 'GH' } = notification;
  
  if (!customerPhone) {
    console.warn('No customer phone for notification');
    return false;
  }
  
  const message = getStatusMessage(notification);
  return await sendSMS(customerPhone, message, country);
}

// Send new order notification to store
export async function notifyStoreNewOrder(
  storePhone: string,
  orderNumber: string,
  customerName: string,
  total: number,
  country: 'GH' | 'NG' = 'GH'
): Promise<boolean> {
  const currency = country === 'GH' ? 'GHS' : 'NGN';
  const message = `New order #${orderNumber} from ${customerName}. Total: ${currency} ${total.toFixed(2)}. Check your dashboard.`;
  return await sendSMS(storePhone, message, country);
}

// Send delivery assignment notification to rider
export async function notifyRiderAssignment(
  riderPhone: string,
  orderNumber: string,
  pickupAddress: string,
  deliveryAddress: string,
  country: 'GH' | 'NG' = 'GH'
): Promise<boolean> {
  const message = `New delivery assigned! Order #${orderNumber}. Pickup: ${pickupAddress}. Deliver to: ${deliveryAddress}. Open app for details.`;
  return await sendSMS(riderPhone, message, country);
}

// Send low stock alert
export async function sendLowStockAlert(
  adminPhone: string,
  productName: string,
  currentStock: number,
  storeName: string,
  country: 'GH' | 'NG' = 'GH'
): Promise<boolean> {
  const message = `Low stock alert! ${productName} has only ${currentStock} units left at ${storeName}. Please restock soon.`;
  return await sendSMS(adminPhone, message, country);
}

// Send payment confirmation
export async function sendPaymentConfirmation(
  customerPhone: string,
  orderNumber: string,
  amount: number,
  country: 'GH' | 'NG' = 'GH'
): Promise<boolean> {
  const currency = country === 'GH' ? 'GHS' : 'NGN';
  const message = `Payment confirmed! ${currency} ${amount.toFixed(2)} received for order #${orderNumber}. Thank you!`;
  return await sendSMS(customerPhone, message, country);
}
