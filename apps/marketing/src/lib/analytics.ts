// Analytics Tracking Service
// Tracks user activity, page views, clicks, and location

import { supabase } from "./supabase";

// Generate or get session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("wa_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem("wa_session_id", sessionId);
  }
  return sessionId;
}

// Device detection
function getDeviceInfo() {
  const ua = navigator.userAgent;

  // Device type
  let deviceType = "desktop";
  if (/Mobi|Android/i.test(ua)) deviceType = "mobile";
  else if (/Tablet|iPad/i.test(ua)) deviceType = "tablet";

  // Browser detection
  let browser = "Unknown";
  let browserVersion = "";
  if (ua.includes("Firefox/")) {
    browser = "Firefox";
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || "";
  } else if (ua.includes("Edg/")) {
    browser = "Edge";
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || "";
  } else if (ua.includes("Chrome/")) {
    browser = "Chrome";
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || "";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    browser = "Safari";
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || "";
  }

  // OS detection
  let os = "Unknown";
  let osVersion = "";
  if (ua.includes("Windows")) {
    os = "Windows";
    osVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || "";
  } else if (ua.includes("Mac OS")) {
    os = "macOS";
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace("_", ".") || "";
  } else if (ua.includes("Android")) {
    os = "Android";
    osVersion = ua.match(/Android (\d+)/)?.[1] || "";
  } else if (
    ua.includes("iOS") ||
    ua.includes("iPhone") ||
    ua.includes("iPad")
  ) {
    os = "iOS";
    osVersion = ua.match(/OS (\d+)/)?.[1] || "";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  }

  return {
    deviceType,
    browser,
    browserVersion,
    os,
    osVersion,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
  };
}

// Get UTM parameters from URL
function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  };
}

// Location data cache
let locationData: {
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
} | null = null;

// Fetch location from IP (free API)
async function getLocationData() {
  if (locationData) return locationData;

  try {
    // Using ip-api.com (free, no API key needed, 45 requests/minute)
    const response = await fetch(
      "http://ip-api.com/json/?fields=status,country,countryCode,city,region,lat,lon,timezone",
    );
    const data = await response.json();

    if (data.status === "success") {
      locationData = {
        country: data.country,
        country_code: data.countryCode,
        city: data.city,
        region: data.region,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch location:", error);
  }

  return locationData || {};
}

// Track an event
export async function trackEvent(
  eventType: string,
  eventName?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    const sessionId = getSessionId();
    const device = getDeviceInfo();
    const utm = getUtmParams();
    const location = await getLocationData();

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const event = {
      event_type: eventType,
      event_name: eventName,
      session_id: sessionId,
      user_id: user?.id,
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      ...location,
      device_type: device.deviceType,
      browser: device.browser,
      browser_version: device.browserVersion,
      os: device.os,
      os_version: device.osVersion,
      screen_width: device.screenWidth,
      screen_height: device.screenHeight,
      language: device.language,
      metadata: metadata || {},
      ...utm,
    };

    // Insert event
    const { error } = await supabase.from("analytics_events").insert(event);

    if (error) {
      console.warn("Failed to track event:", error);
    }
  } catch (error) {
    console.warn("Analytics error:", error);
  }
}

// Track page view
export async function trackPageView() {
  await trackEvent("page_view");
  await updateActiveSession();
}

// Track click
export function trackClick(
  elementName: string,
  metadata?: Record<string, unknown>,
) {
  trackEvent("click", elementName, metadata);
}

// Track download
export function trackDownload(
  downloadName: string,
  metadata?: Record<string, unknown>,
) {
  trackEvent("download", downloadName, metadata);
}

// Track signup
export function trackSignup(metadata?: Record<string, unknown>) {
  trackEvent("signup", "user_signup", metadata);
}

// Track login
export function trackLogin(metadata?: Record<string, unknown>) {
  trackEvent("login", "user_login", metadata);
}

// Track feature use
export function trackFeatureUse(
  featureName: string,
  metadata?: Record<string, unknown>,
) {
  trackEvent("feature_use", featureName, metadata);
}

// Track error
export function trackError(
  errorName: string,
  metadata?: Record<string, unknown>,
) {
  trackEvent("error", errorName, metadata);
}

// Update active session (heartbeat)
export async function updateActiveSession() {
  try {
    const sessionId = getSessionId();
    const device = getDeviceInfo();
    const location = await getLocationData();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.rpc("upsert_active_session", {
      p_session_id: sessionId,
      p_user_id: user?.id || null,
      p_tenant_id: null, // Could be fetched from user profile
      p_current_page: window.location.pathname,
      p_current_page_title: document.title,
      p_country: location.country || null,
      p_country_code: location.country_code || null,
      p_city: location.city || null,
      p_device_type: device.deviceType,
      p_browser: device.browser,
      p_os: device.os,
    });
  } catch (error) {
    console.warn("Failed to update session:", error);
  }
}

// Initialize analytics - call this on app load
export function initAnalytics() {
  // Track initial page view
  trackPageView();

  // Set up heartbeat (every 30 seconds)
  setInterval(() => {
    updateActiveSession();
  }, 30000);

  // Track page changes for SPA
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackPageView();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Track before unload
  window.addEventListener("beforeunload", () => {
    // Mark session as ending (using sendBeacon for reliability)
    navigator.sendBeacon?.(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/cleanup_inactive_sessions`,
      JSON.stringify({}),
    );
  });

  console.log("📊 Analytics initialized");
}

// Auto-track clicks on elements with data-track attribute
export function setupClickTracking() {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const trackElement = target.closest("[data-track]");

    if (trackElement) {
      const trackName = trackElement.getAttribute("data-track");
      const trackData = trackElement.getAttribute("data-track-meta");

      if (trackName) {
        trackClick(trackName, trackData ? JSON.parse(trackData) : undefined);
      }
    }
  });
}

// ============================================
// ENGAGEMENT SCORING INTEGRATION
// Track user behavior to predict subscription likelihood
// ============================================

// Update engagement score based on activity
export async function updateEngagementScore(eventType: string = "page_view") {
  try {
    const sessionId = getSessionId();
    const location = await getLocationData();
    const utm = getUtmParams();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.rpc("update_engagement_from_event", {
      p_session_id: sessionId,
      p_event_type: eventType,
      p_page_path: window.location.pathname,
      p_user_id: user?.id || null,
      p_tenant_id: null,
      p_country: location.country || null,
      p_country_code: location.country_code || null,
      p_utm_source: utm.utm_source || null,
      p_utm_medium: utm.utm_medium || null,
      p_utm_campaign: utm.utm_campaign || null,
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.warn("Failed to update engagement:", error);
  }
}

// Track time on page
let pageStartTime = Date.now();
let totalTimeOnSite = 0;

export function trackTimeOnPage() {
  const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
  totalTimeOnSite += timeSpent;
  pageStartTime = Date.now();

  // Update engagement with time spent
  if (timeSpent > 5) {
    // Only track if they spent more than 5 seconds
    trackEvent("feature_use", "time_on_page", {
      seconds: timeSpent,
      totalSeconds: totalTimeOnSite,
      page: window.location.pathname,
    });
  }
}

// Track scroll depth
let maxScrollDepth = 0;

export function setupScrollTracking() {
  window.addEventListener("scroll", () => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;
    const scrollPercent = Math.round((currentScroll / scrollHeight) * 100);

    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;

      // Track milestones: 25%, 50%, 75%, 100%
      if ([25, 50, 75, 100].includes(scrollPercent)) {
        trackEvent("feature_use", "scroll_depth", {
          depth: scrollPercent,
          page: window.location.pathname,
        });
      }
    }
  });
}

// Enhanced page view with engagement
export async function trackPageViewEnhanced() {
  // Track time on previous page
  trackTimeOnPage();
  pageStartTime = Date.now();
  maxScrollDepth = 0;

  // Track the page view
  await trackPageView();

  // Update engagement scoring
  await updateEngagementScore("page_view");
}

// Enhanced signup tracking with engagement
export async function trackSignupComplete(
  tenantId?: string,
  plan?: string,
  metadata?: Record<string, unknown>,
) {
  await trackEvent("signup", "signup_complete", {
    ...metadata,
    tenant_id: tenantId,
    plan: plan,
  });

  // Update engagement - they completed signup!
  await updateEngagementScore("signup");
}

// Track pricing page view (high intent signal)
export async function trackPricingView() {
  await trackEvent("page_view", "pricing_view", {
    page: window.location.pathname,
  });
  await updateEngagementScore("page_view");
}

// Track demo/trial interest
export async function trackDemoInterest(action: string) {
  await trackEvent("feature_use", "demo_interest", {
    action: action, // 'watch_demo', 'start_trial', 'request_demo'
  });
  await updateEngagementScore("feature_use");
}

// Track CTA clicks (call-to-action)
export async function trackCTAClick(ctaName: string, ctaLocation: string) {
  await trackEvent("click", "cta_click", {
    cta_name: ctaName,
    cta_location: ctaLocation,
    page: window.location.pathname,
  });
  await updateEngagementScore("click");
}

// Initialize enhanced analytics with all tracking
export function initEnhancedAnalytics() {
  // Basic analytics
  initAnalytics();

  // Scroll tracking
  setupScrollTracking();

  // Track time on page when user leaves
  window.addEventListener("beforeunload", () => {
    trackTimeOnPage();
  });

  // Track time when page becomes hidden (mobile tab switch)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackTimeOnPage();
    } else {
      pageStartTime = Date.now();
    }
  });

  // Initial engagement update
  updateEngagementScore("page_view");

  console.log("📊 Enhanced analytics with engagement scoring initialized");
}
