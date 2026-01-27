import { useState, useEffect } from "react";
import { LocaleCode, LocaleConfig, getLocaleByCode } from "../lib/geo-locale";

// Free IP geolocation API
const GEO_API_URL = "https://ipapi.co/json/";

// Country code to locale mapping
const COUNTRY_TO_LOCALE: Record<string, LocaleCode> = {
  GH: "GH", // Ghana
  NG: "NG", // Nigeria
};

// Cache key for localStorage
const LOCALE_CACHE_KEY = "warehouse_geo_locale";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedLocale {
  code: LocaleCode;
  timestamp: number;
}

export function useGeoLocale() {
  const [locale, setLocale] = useState<LocaleConfig>(getLocaleByCode("INTL"));
  const [loading, setLoading] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  useEffect(() => {
    async function detectLocale() {
      try {
        // Check cache first
        const cached = localStorage.getItem(LOCALE_CACHE_KEY);
        if (cached) {
          const parsedCache: CachedLocale = JSON.parse(cached);
          const isValid = Date.now() - parsedCache.timestamp < CACHE_DURATION;
          if (isValid) {
            setLocale(getLocaleByCode(parsedCache.code));
            setDetectedCountry(parsedCache.code);
            setLoading(false);
            return;
          }
        }

        // Fetch geo data
        const response = await fetch(GEO_API_URL);
        if (!response.ok) throw new Error("Geo API failed");

        const data = await response.json();
        const countryCode = data.country_code as string;

        // Map to our locale codes
        const localeCode: LocaleCode = COUNTRY_TO_LOCALE[countryCode] || "INTL";

        // Cache the result
        const cacheData: CachedLocale = {
          code: localeCode,
          timestamp: Date.now(),
        };
        localStorage.setItem(LOCALE_CACHE_KEY, JSON.stringify(cacheData));

        setLocale(getLocaleByCode(localeCode));
        setDetectedCountry(countryCode);
      } catch (error) {
        // Fallback to international on error
        console.warn(
          "Geo detection failed, using international locale:",
          error,
        );
        setLocale(getLocaleByCode("INTL"));
      } finally {
        setLoading(false);
      }
    }

    detectLocale();
  }, []);

  // Allow manual locale override (useful for testing or user preference)
  const setLocaleOverride = (code: LocaleCode) => {
    const cacheData: CachedLocale = {
      code,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCALE_CACHE_KEY, JSON.stringify(cacheData));
    setLocale(getLocaleByCode(code));
    setDetectedCountry(code);
  };

  // Clear override and re-detect
  const clearOverride = () => {
    localStorage.removeItem(LOCALE_CACHE_KEY);
    setLoading(true);
    // Re-trigger detection
    window.location.reload();
  };

  return {
    locale,
    loading,
    detectedCountry,
    setLocaleOverride,
    clearOverride,
    isGhana: locale.code === "GH",
    isNigeria: locale.code === "NG",
    isInternational: locale.code === "INTL",
  };
}

// Hook for just getting the locale without all the extras
export function useLocale(): LocaleConfig {
  const { locale } = useGeoLocale();
  return locale;
}
