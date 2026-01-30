import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Locate, 
  MapPin,
  Search,
  Navigation,
} from 'lucide-react';
import type { CountryCode } from '@warehousepos/types';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryDark: '#D4A900',
    textOnPrimary: '#1A1A1A',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryDark: '#006B40',
    textOnPrimary: '#FFFFFF',
  },
};

// Default centers for countries
const defaultCenters = {
  GH: { lat: 5.6037, lng: -0.1870 }, // Accra
  NG: { lat: 6.5244, lng: 3.3792 }, // Lagos
};

export interface StoreLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface StoreLocationPickerProps {
  country: CountryCode;
  location?: StoreLocation | null;
  onLocationChange: (location: StoreLocation) => void;
  height?: string;
  className?: string;
}

export function StoreLocationPicker({
  country,
  location,
  onLocationChange,
  height = '400px',
  className = '',
}: StoreLocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const [mapReady, setMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const theme = themes[country];
  const defaultCenter = defaultCenters[country];

  // Custom store marker icon
  const storeIcon = L.divIcon({
    className: 'custom-store-marker',
    html: `
      <div style="
        background-color: ${theme.primary};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        <svg 
          style="transform: rotate(45deg); width: 18px; height: 18px; color: ${theme.textOnPrimary};"
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2.5"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = location 
      ? [location.lat, location.lng] as L.LatLngExpression
      : [defaultCenter.lat, defaultCenter.lng] as L.LatLngExpression;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: location ? 16 : 12,
      zoomControl: false,
      attributionControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    // Click handler for placing marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Place or move marker
  const placeMarker = useCallback((lat: number, lng: number) => {
    if (!mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon: storeIcon,
        draggable: true,
      }).addTo(mapRef.current);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange({ lat: pos.lat, lng: pos.lng });
      });

      markerRef.current = marker;
    }

    onLocationChange({ lat, lng });
    mapRef.current.panTo([lat, lng]);
  }, [onLocationChange, storeIcon]);

  // Update marker when location prop changes
  useEffect(() => {
    if (!mapReady || !location) return;

    placeMarker(location.lat, location.lng);
  }, [mapReady, location?.lat, location?.lng]);

  // Get current location
  const handleLocateMe = useCallback(() => {
    if (!mapRef.current || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        placeMarker(latitude, longitude);
        mapRef.current?.setView([latitude, longitude], 16);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location services.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [placeMarker]);

  // Search for address
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !mapRef.current) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=${country.toLowerCase()}&limit=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        placeMarker(latitude, longitude);
        mapRef.current.setView([latitude, longitude], 16);
        onLocationChange({ lat: latitude, lng: longitude, address: display_name });
      } else {
        alert('Location not found. Try a more specific address.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search for location.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, country, placeMarker, onLocationChange]);

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {/* Search Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000]">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': theme.primary } as any}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2.5 rounded-xl font-medium text-sm shadow-md transition-all disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: theme.textOnPrimary }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        style={{ height }}
        className="w-full"
      />

      {/* Controls */}
      <div className="absolute bottom-16 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="p-3 bg-white rounded-xl shadow-md hover:bg-zinc-50 transition-colors disabled:opacity-50"
          title="Use my current location"
        >
          {isLocating ? (
            <Navigation className="w-5 h-5 animate-pulse" style={{ color: theme.primary }} />
          ) : (
            <Locate className="w-5 h-5 text-zinc-600" />
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-sm text-zinc-600">
          <MapPin className="w-4 h-4" style={{ color: theme.primary }} />
          <span>Click on map to set store location</span>
        </div>
      </div>

      {/* Current Coordinates */}
      {location && (
        <div className="absolute bottom-3 right-3 z-[1000]">
          <div className="px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-xs text-zinc-500 font-mono">
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
}
