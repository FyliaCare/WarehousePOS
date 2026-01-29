// ============================================
// DELIVERY APP NOTIFICATIONS
// Real-time notifications for new assignments
// ============================================

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

let notificationChannel: RealtimeChannel | null = null;
let onNewAssignment: ((assignment: any) => void) | null = null;

// Play notification sound
export function playNotificationSound(): void {
  try {
    // Try audio file first
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => {
      // Fallback: Use Web Audio API
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Two-tone notification
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.frequency.value = 1100;
      }, 150);
      
      setTimeout(() => {
        oscillator.stop();
      }, 300);
    });
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

// Vibrate device if supported
export function vibrateDevice(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
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
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Show browser notification
export function showBrowserNotification(title: string, body: string, onClick?: () => void): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const notification = new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: 'delivery-notification',
  });
  
  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
}

// Subscribe to new delivery assignments for this rider
export function subscribeToAssignments(
  riderId: string,
  callback: (assignment: any) => void
): void {
  if (notificationChannel) {
    // Already subscribed, just update callback
    onNewAssignment = callback;
    return;
  }
  
  onNewAssignment = callback;
  
  notificationChannel = supabase
    .channel(`rider-assignments-${riderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_assignments',
        filter: `rider_id=eq.${riderId}`,
      },
      async (payload) => {
        console.log('New assignment received:', payload);
        
        // Fetch full assignment details with order info
        const { data: assignment } = await supabase
          .from('delivery_assignments')
          .select('*, order:orders(*, customer:customers(name, phone, address))')
          .eq('id', (payload.new as any).id)
          .single();
        
        if (assignment && onNewAssignment) {
          // Play sound and vibrate
          playNotificationSound();
          vibrateDevice();
          
          const orderData = assignment as any;
          
          // Show browser notification
          showBrowserNotification(
            '🚚 New Delivery!',
            `Order #${orderData.order?.order_number?.slice(-6)} - ${orderData.order?.customer?.name || 'Customer'}`,
            () => {
              onNewAssignment?.(assignment);
            }
          );
          
          // Call the callback
          onNewAssignment(assignment);
        }
      }
    )
    .subscribe();
  
  console.log('Subscribed to delivery assignments');
}

// Unsubscribe from assignments
export function unsubscribeFromAssignments(): void {
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel);
    notificationChannel = null;
    onNewAssignment = null;
    console.log('Unsubscribed from delivery assignments');
  }
}
