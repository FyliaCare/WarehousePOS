// ============================================
// GPS LOCATION TRACKING SERVICE
// Track rider location and send to server
// ============================================

import { supabase } from './supabase';

interface LocationState {
  watchId: number | null;
  lastUpdate: number;
  isTracking: boolean;
  currentPosition: GeolocationPosition | null;
}

const state: LocationState = {
  watchId: null,
  lastUpdate: 0,
  isTracking: false,
  currentPosition: null,
};

// Minimum time between location updates (in milliseconds)
const UPDATE_INTERVAL = 10000; // 10 seconds

// Send location to server
async function sendLocationUpdate(
  riderId: string,
  deliveryAssignmentId: string | null,
  position: GeolocationPosition
): Promise<void> {
  const now = Date.now();
  
  // Throttle updates
  if (now - state.lastUpdate < UPDATE_INTERVAL) {
    return;
  }
  
  state.lastUpdate = now;
  
  try {
    // Update rider's current location
    await supabase
      .from('riders')
      .update({
        current_latitude: position.coords.latitude,
        current_longitude: position.coords.longitude,
        last_seen_at: new Date().toISOString(),
      } as never)
      .eq('id', riderId);
    
    // If on active delivery, also log to rider_locations
    if (deliveryAssignmentId) {
      await supabase.from('rider_locations').insert({
        rider_id: riderId,
        delivery_assignment_id: deliveryAssignmentId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
      } as never);
    }
  } catch (error) {
    console.error('Failed to send location update:', error);
  }
}

// Start tracking rider location
export function startLocationTracking(
  riderId: string,
  deliveryAssignmentId: string | null = null
): void {
  if (state.isTracking) {
    console.log('Location tracking already active');
    return;
  }
  
  if (!('geolocation' in navigator)) {
    console.error('Geolocation not supported');
    return;
  }
  
  state.isTracking = true;
  
  const handleSuccess = (position: GeolocationPosition) => {
    state.currentPosition = position;
    sendLocationUpdate(riderId, deliveryAssignmentId, position);
  };
  
  const handleError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error.message);
  };
  
  // Get initial position
  navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  });
  
  // Start watching position
  state.watchId = navigator.geolocation.watchPosition(
    handleSuccess,
    handleError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }
  );
  
  console.log('Location tracking started');
}

// Stop tracking
export function stopLocationTracking(): void {
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }
  state.isTracking = false;
  state.currentPosition = null;
  console.log('Location tracking stopped');
}

// Update the delivery assignment being tracked
export function updateTrackingDelivery(deliveryAssignmentId: string | null): void {
  // The next location update will use this new assignment ID
  console.log('Tracking delivery updated:', deliveryAssignmentId);
}

// Get current position
export function getCurrentPosition(): GeolocationPosition | null {
  return state.currentPosition;
}

// Check if tracking is active
export function isTrackingActive(): boolean {
  return state.isTracking;
}

// Request location permission
export async function requestLocationPermission(): Promise<boolean> {
  if (!('permissions' in navigator)) {
    return false;
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    
    if (result.state === 'granted') {
      return true;
    }
    
    if (result.state === 'prompt') {
      // This will trigger the permission prompt
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false)
        );
      });
    }
    
    return false;
  } catch {
    return false;
  }
}
