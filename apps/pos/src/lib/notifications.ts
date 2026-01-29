// ============================================
// ORDER NOTIFICATIONS
// Secure version - uses Edge Functions
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
}

// Get SMS message template based on status
function getStatusMessage(notification: OrderNotification): string {
  const { orderNumber, status, storeName, trackingCode, riderName, riderPhone } = notification;
  const store = storeName || 'the store';
  
  const templates: Record<string, string> = {
    confirmed: `Your order #${orderNumber} has been confirmed by ${store}. We're preparing it now.${trackingCode ? ` Track: ${trackingCode}` : ''}`,
    preparing: `Good news! Your order #${orderNumber} is being prepared. We'll notify you when it's ready.`,
    ready: `Your order #${orderNumber} is ready for pickup/delivery!`,
    out_for_delivery: `Your order #${orderNumber} is on its way!${riderName ? ` Rider: ${riderName}` : ''}${riderPhone ? ` (${riderPhone})` : ''}`,
    delivered: `Your order #${orderNumber} has been delivered. Thank you for shopping with ${store}!`,
    cancelled: `Your order #${orderNumber} has been cancelled. If you have questions, please contact ${store}.`,
  };
  
  return templates[status] || `Your order #${orderNumber} status: ${status.replace('_', ' ')}`;
}

// Send order notification via Edge Function
export async function sendOrderNotification(notification: OrderNotification): Promise<boolean> {
  const { customerPhone, orderNumber, status } = notification;
  
  if (!customerPhone) {
    console.warn('No customer phone for notification');
    return false;
  }

  const message = getStatusMessage(notification);

  try {
    // Use Edge Function for secure SMS sending
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        phone: customerPhone,
        message,
        template_type: 'order_notification',
        metadata: {
          order_id: notification.orderId,
          order_number: orderNumber,
          status,
        }
      }
    });

    if (error) {
      console.error('Failed to send notification:', error);
      return false;
    }

    return data?.success || false;
  } catch (err) {
    console.error('Error sending notification:', err);
    return false;
  }
}

// Play notification sound for new orders
export function playNotificationSound(): void {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    // Audio not supported or blocked
    console.warn('Could not play notification sound:', err);
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Show browser notification
export function showBrowserNotification(title: string, body: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      ...options
    });
  }
}
