import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { 
  Locate, 
  ZoomIn, 
  ZoomOut,
  Eye,
  EyeOff,
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
    zoneColors: ['#FFD000', '#FF9500', '#34C759', '#007AFF', '#AF52DE', '#FF3B30'],
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E6F5EE',
    primaryDark: '#006B40',
    textOnPrimary: '#FFFFFF',
    zoneColors: ['#008751', '#34C759', '#007AFF', '#FF9500', '#AF52DE', '#FF3B30'],
  },
};

// Default center points for Ghana and Nigeria
const defaultCenters = {
  GH: { lat: 5.6037, lng: -0.1870 }, // Accra
  NG: { lat: 6.5244, lng: 3.3792 }, // Lagos
};

export interface ZoneBoundary {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON format: [[[lng, lat], [lng, lat], ...]]
}

export interface DeliveryZoneData {
  id: string;
  name: string;
  description?: string;
  delivery_fee: number;
  is_active: boolean;
  boundary?: ZoneBoundary;
  color?: string;
}

interface DeliveryZoneMapProps {
  zones: DeliveryZoneData[];
  country: CountryCode;
  selectedZoneId?: string | null;
  onZoneSelect?: (zoneId: string | null) => void;
  onBoundaryChange?: (zoneId: string, boundary: ZoneBoundary) => void;
  onNewZoneBoundary?: (boundary: ZoneBoundary) => void;
  isDrawingMode?: boolean;
  isEditing?: boolean;
  editingZoneId?: string | null;
  storeLocation?: { lat: number; lng: number } | null;
  showControls?: boolean;
  height?: string;
  className?: string;
}

export function DeliveryZoneMap({
  zones,
  country,
  selectedZoneId,
  onZoneSelect,
  onBoundaryChange,
  onNewZoneBoundary,
  isDrawingMode = false,
  isEditing = false,
  editingZoneId,
  storeLocation,
  showControls = true,
  height = '500px',
  className = '',
}: DeliveryZoneMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const zonesLayerRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  
  const [mapReady, setMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showAllZones, setShowAllZones] = useState(true);
  const [currentDrawnBoundary, setCurrentDrawnBoundary] = useState<ZoneBoundary | null>(null);
  
  const theme = themes[country];
  const defaultCenter = defaultCenters[country];

  // Get zone color
  const getZoneColor = useCallback((index: number, zoneId: string) => {
    if (selectedZoneId === zoneId) return theme.primary;
    return theme.zoneColors[index % theme.zoneColors.length];
  }, [selectedZoneId, theme]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [storeLocation?.lat || defaultCenter.lat, storeLocation?.lng || defaultCenter.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    // Add tile layer - using OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create feature group for zones
    const zonesLayer = new L.FeatureGroup();
    zonesLayer.addTo(map);
    zonesLayerRef.current = zonesLayer;

    // Add store marker if location provided
    if (storeLocation) {
      const storeIcon = L.divIcon({
        className: 'custom-store-marker',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: ${theme.primary};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${theme.textOnPrimary}" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([storeLocation.lat, storeLocation.lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup('<strong>Store Location</strong>');
    }

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      zonesLayerRef.current = null;
    };
  }, []);

  // Handle drawing mode
  useEffect(() => {
    if (!mapRef.current || !zonesLayerRef.current || !mapReady) return;

    const map = mapRef.current;
    const zonesLayer = zonesLayerRef.current;

    // Remove existing draw control
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
      drawControlRef.current = null;
    }

    if (isDrawingMode || isEditing) {
      // Create draw control
      const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e74c3c',
              message: '<strong>Error:</strong> Shape edges cannot cross!',
            },
            shapeOptions: {
              color: theme.primary,
              fillColor: theme.primary,
              fillOpacity: 0.3,
              weight: 3,
            },
          },
          polyline: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
        },
        edit: {
          featureGroup: zonesLayer,
          remove: false,
          edit: isEditing ? {} : false,
        },
      });

      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Handle polygon creation
      const handleCreated = (e: L.LeafletEvent) => {
        const event = e as L.DrawEvents.Created;
        const layer = event.layer as L.Polygon;
        const latLngs = layer.getLatLngs()[0] as L.LatLng[];
        
        // Convert to GeoJSON format (lng, lat)
        const coordinates = latLngs.map((ll) => [ll.lng, ll.lat]);
        // Close the polygon
        if (coordinates.length > 0) {
          coordinates.push([...coordinates[0]]);
        }
        
        const boundary: ZoneBoundary = {
          type: 'Polygon',
          coordinates: [coordinates],
        };
        
        setCurrentDrawnBoundary(boundary);
        
        if (onNewZoneBoundary && !editingZoneId) {
          onNewZoneBoundary(boundary);
        } else if (onBoundaryChange && editingZoneId) {
          onBoundaryChange(editingZoneId, boundary);
        }
        
        // Remove the drawn layer (will be rendered as part of zones)
        map.removeLayer(layer);
      };

      // Handle polygon edit
      const handleEdited = (e: L.LeafletEvent) => {
        const event = e as L.DrawEvents.Edited;
        event.layers.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            const zoneId = (layer as any).zoneId;
            const latLngs = layer.getLatLngs()[0] as L.LatLng[];
            
            const coordinates = latLngs.map((ll) => [ll.lng, ll.lat]);
            if (coordinates.length > 0) {
              coordinates.push([...coordinates[0]]);
            }
            
            const boundary: ZoneBoundary = {
              type: 'Polygon',
              coordinates: [coordinates],
            };
            
            if (onBoundaryChange && zoneId) {
              onBoundaryChange(zoneId, boundary);
            }
          }
        });
      };

      map.on(L.Draw.Event.CREATED, handleCreated);
      map.on(L.Draw.Event.EDITED, handleEdited);

      return () => {
        map.off(L.Draw.Event.CREATED, handleCreated);
        map.off(L.Draw.Event.EDITED, handleEdited);
      };
    }
  }, [mapReady, isDrawingMode, isEditing, editingZoneId, theme, onNewZoneBoundary, onBoundaryChange]);

  // Render zones
  useEffect(() => {
    if (!mapRef.current || !zonesLayerRef.current || !mapReady) return;

    const zonesLayer = zonesLayerRef.current;
    zonesLayer.clearLayers();

    if (!showAllZones && !selectedZoneId) return;

    const zonesToRender = showAllZones 
      ? zones 
      : zones.filter(z => z.id === selectedZoneId);

    zonesToRender.forEach((zone, index) => {
      if (!zone.boundary?.coordinates?.[0]) return;

      const coords = zone.boundary.coordinates[0];
      // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
      const latLngs: L.LatLngExpression[] = coords.map(([lng, lat]) => [lat, lng]);
      
      const color = zone.color || getZoneColor(index, zone.id);
      const isSelected = selectedZoneId === zone.id;

      const polygon = L.polygon(latLngs, {
        color: isSelected ? theme.primary : color,
        fillColor: color,
        fillOpacity: isSelected ? 0.4 : (zone.is_active ? 0.25 : 0.1),
        weight: isSelected ? 4 : 2,
        dashArray: zone.is_active ? undefined : '5, 5',
      });

      // Store zone ID for editing
      (polygon as any).zoneId = zone.id;

      // Add popup
      polygon.bindPopup(`
        <div style="min-width: 150px;">
          <strong style="font-size: 14px;">${zone.name}</strong>
          ${zone.description ? `<p style="margin: 4px 0; color: #666; font-size: 12px;">${zone.description}</p>` : ''}
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: #888;">Delivery Fee:</span>
              <strong style="color: ${theme.primary};">
                ${country === 'NG' ? '₦' : 'GH₵'}${zone.delivery_fee.toLocaleString()}
              </strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
              <span style="color: #888;">Status:</span>
              <span style="color: ${zone.is_active ? '#34C759' : '#888'};">
                ${zone.is_active ? '● Active' : '○ Inactive'}
              </span>
            </div>
          </div>
        </div>
      `, { closeButton: true });

      // Click handler
      polygon.on('click', () => {
        if (onZoneSelect && !isEditing) {
          onZoneSelect(zone.id);
        }
      });

      polygon.addTo(zonesLayer);

      // Fit bounds to show all zones
      if (zonesToRender.length > 0 && index === zonesToRender.length - 1) {
        const bounds = zonesLayer.getBounds();
        if (bounds.isValid()) {
          mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    });
  }, [zones, showAllZones, selectedZoneId, editingZoneId, mapReady, country, theme, getZoneColor, isEditing, onZoneSelect]);

  // Locate user
  const handleLocate = useCallback(() => {
    if (!mapRef.current) return;
    
    setIsLocating(true);
    mapRef.current.locate({ setView: true, maxZoom: 14 });
    
    mapRef.current.once('locationfound', () => setIsLocating(false));
    mapRef.current.once('locationerror', () => {
      setIsLocating(false);
      alert('Could not get your location');
    });
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  // Reset view
  const handleResetView = useCallback(() => {
    if (!mapRef.current) return;
    
    if (storeLocation) {
      mapRef.current.setView([storeLocation.lat, storeLocation.lng], 12);
    } else {
      mapRef.current.setView([defaultCenter.lat, defaultCenter.lng], 12);
    }
  }, [storeLocation, defaultCenter]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-zinc-200 ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }}
        className="z-0"
      />

      {/* Custom Controls */}
      {showControls && (
        <>
          {/* Top Left - Drawing Indicator */}
          {(isDrawingMode || isEditing) && (
            <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: theme.primary }}
              />
              <span className="text-sm font-medium text-zinc-700">
                {isEditing ? 'Click polygon to edit' : 'Click to draw zone boundary'}
              </span>
            </div>
          )}

          {/* Right Side Controls - positioned below leaflet-draw toolbar */}
          <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
            {/* Zoom Controls */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={handleZoomIn}
                className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 transition-colors border-b border-zinc-100"
              >
                <ZoomIn className="w-5 h-5 text-zinc-600" />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 transition-colors"
              >
                <ZoomOut className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            {/* Location */}
            <button
              onClick={handleLocate}
              disabled={isLocating}
              className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              <Locate className={`w-5 h-5 text-zinc-600 ${isLocating ? 'animate-pulse' : ''}`} />
            </button>

            {/* Reset View */}
            <button
              onClick={handleResetView}
              className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-100 transition-colors"
            >
              <Navigation className="w-5 h-5 text-zinc-600" />
            </button>

            {/* Toggle All Zones */}
            <button
              onClick={() => setShowAllZones(!showAllZones)}
              className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-zinc-100 transition-colors"
              title={showAllZones ? 'Hide other zones' : 'Show all zones'}
            >
              {showAllZones ? (
                <Eye className="w-5 h-5 text-zinc-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-zinc-600" />
              )}
            </button>
          </div>

          {/* Bottom Left - Legend */}
          {zones.length > 0 && (
            <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg p-3 max-w-[200px]">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Zones ({zones.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {zones.slice(0, 6).map((zone, index) => (
                  <button
                    key={zone.id}
                    onClick={() => onZoneSelect?.(zone.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-colors hover:bg-zinc-50 ${
                      selectedZoneId === zone.id ? 'bg-zinc-100' : ''
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ 
                        backgroundColor: zone.color || getZoneColor(index, zone.id),
                        opacity: zone.is_active ? 1 : 0.4,
                      }}
                    />
                    <span className={`text-xs truncate ${zone.is_active ? 'text-zinc-700' : 'text-zinc-400'}`}>
                      {zone.name}
                    </span>
                  </button>
                ))}
                {zones.length > 6 && (
                  <p className="text-xs text-zinc-400 px-2">+{zones.length - 6} more</p>
                )}
              </div>
            </div>
          )}

          {/* Current Drawn Boundary Info */}
          {currentDrawnBoundary && isDrawingMode && (
            <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-xl shadow-lg p-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm font-medium">Boundary drawn</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {currentDrawnBoundary.coordinates[0].length - 1} points
              </p>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {!mapReady && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: theme.primaryLight }}
        >
          <div className="flex flex-col items-center gap-3">
            <div 
              className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.primary }}
            />
            <p className="text-sm text-zinc-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryZoneMap;
