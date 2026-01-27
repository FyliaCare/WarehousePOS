import { createContext, useContext, ReactNode } from "react";
import { useGeoLocale } from "../hooks/useGeoLocale";
import { LocaleConfig, LocaleCode, getLocaleByCode } from "../lib/geo-locale";

interface GeoLocaleContextType {
  locale: LocaleConfig;
  loading: boolean;
  detectedCountry: string | null;
  setLocaleOverride: (code: LocaleCode) => void;
  clearOverride: () => void;
  isGhana: boolean;
  isNigeria: boolean;
  isInternational: boolean;
}

const GeoLocaleContext = createContext<GeoLocaleContextType | null>(null);

export function GeoLocaleProvider({ children }: { children: ReactNode }) {
  const geoLocale = useGeoLocale();

  return (
    <GeoLocaleContext.Provider value={geoLocale}>
      {children}
    </GeoLocaleContext.Provider>
  );
}

export function useGeoLocaleContext() {
  const context = useContext(GeoLocaleContext);
  if (!context) {
    // Return a default if used outside provider
    return {
      locale: getLocaleByCode("INTL"),
      loading: false,
      detectedCountry: null,
      setLocaleOverride: () => {},
      clearOverride: () => {},
      isGhana: false,
      isNigeria: false,
      isInternational: true,
    };
  }
  return context;
}
