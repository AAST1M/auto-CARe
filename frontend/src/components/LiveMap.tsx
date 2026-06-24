import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 }; // Cairo fallback

// Custom Google Maps style — dark/modern look
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const USER_MARKER_ICON = (loaded: boolean): google.maps.Icon | undefined => {
  if (!loaded || typeof google === 'undefined') return undefined;
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
  <defs>
    <linearGradient id="userGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
  <path d="M16 2C8.2 2 2 8.2 2 16c0 10.5 12.8 23.5 13.3 24.1.4.4 1 .4 1.4 0C17.2 39.5 30 26.5 30 16 30 8.2 23.8 2 16 2z" fill="url(#userGrad)" stroke="#ffffff" stroke-width="2" filter="url(#shadow)" />
  <circle cx="16" cy="16" r="8" fill="#ffffff" />
  <text x="16" y="20.5" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="900" fill="#1d4ed8" text-anchor="middle">U</text>
</svg>
`)}`,
    scaledSize: new google.maps.Size(40, 52),
    anchor: new google.maps.Point(20, 52),
  };
};

const DRIVER_MARKER_ICON = (loaded: boolean): google.maps.Icon | undefined => {
  if (!loaded || typeof google === 'undefined') return undefined;
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#d97706" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#ffffff" stroke="#f59e0b" stroke-width="3" filter="url(#glow)" />
  <circle cx="20" cy="20" r="12" fill="#d97706" />
  <path d="M14 15h4.5l2 2.5h4c.6 0 1 .4 1 1v4.5c0 .3-.2.5-.5.5H23.5c-.3-1.2-1.3-2-2.5-2s-2.2.8-2.5 2H13.5c-.3 0-.5-.2-.5-.5v-5c0-.6.4-1 1-1zm3.5 8c0-.6-.4-1-1-1s-1 .4-1 1 .4 1 1 1 1-.4 1-1zm8 0c0-.6-.4-1-1-1s-1 .4-1 1 .4 1 1 1 1-.4 1-1z" fill="#ffffff" />
</svg>
`)}`,
    scaledSize: new google.maps.Size(44, 44),
    anchor: new google.maps.Point(22, 22),
  };
};

interface LiveMapProps {
  userLat?: number;
  userLng?: number;
  driverLat?: number;
  driverLng?: number;
  mapTypeId?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onMapLoadExternal?: (map: google.maps.Map) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({ userLat, userLng, driverLat, driverLng, mapTypeId = 'roadmap', zoom = 14, onZoomChange, onMapLoadExternal }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fetch driving directions whenever both pins are available
  useEffect(() => {
    if (!isLoaded || !userLat || !userLng || !driverLat || !driverLng) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: driverLat, lng: driverLng },
        destination: { lat: userLat, lng: userLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, [isLoaded, userLat, userLng, driverLat, driverLng]);

  // Auto-fit bounds when coordinates change
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;
    if (userLat && userLng) { bounds.extend({ lat: userLat, lng: userLng }); hasPoints = true; }
    if (driverLat && driverLng) { bounds.extend({ lat: driverLat, lng: driverLng }); hasPoints = true; }
    if (hasPoints) {
      if (userLat && userLng && driverLat && driverLng) {
        mapRef.current.fitBounds(bounds, { top: 80, bottom: 80, left: 40, right: 40 });
      } else {
        const pt = userLat && userLng ? { lat: userLat, lng: userLng } : { lat: driverLat!, lng: driverLng! };
        mapRef.current.panTo(pt);
        mapRef.current.setZoom(15);
      }
    }
  }, [isLoaded, userLat, userLng, driverLat, driverLng]);

  const center = (userLat && userLng)
    ? { lat: userLat, lng: userLng }
    : (driverLat && driverLng)
    ? { lat: driverLat, lng: driverLng }
    : DEFAULT_CENTER;

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white rounded-xl">
        <div className="text-center p-6">
          <p className="text-2xl mb-2">🗺️</p>
          <p className="font-bold">Map unavailable</p>
          <p className="text-xs text-gray-400 mt-1">Check your Google Maps API key in frontend/.env</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm font-medium">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={zoom}
        mapTypeId={mapTypeId}
        onLoad={(map) => {
          onMapLoad(map);
          if (onMapLoadExternal) onMapLoadExternal(map);
        }}
        onZoomChanged={() => {
          if (mapRef.current && onZoomChange) {
            const currentZoom = mapRef.current.getZoom();
            if (currentZoom !== undefined) {
              onZoomChange(currentZoom);
            }
          }
        }}
        options={{
          styles: mapTypeId === 'roadmap' ? MAP_STYLE : [],
          disableDefaultUI: false,
          zoomControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
        }}
      >
        {/* User location marker (blue) */}
        {userLat && userLng && (
          <Marker
            position={{ lat: userLat, lng: userLng }}
            icon={USER_MARKER_ICON(isLoaded)}
            title="Your Location"
            label={{ text: 'You', color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
          />
        )}

        {/* Driver location marker (red truck icon) */}
        {driverLat && driverLng && !directions && (
          <Marker
            position={{ lat: driverLat, lng: driverLng }}
            icon={DRIVER_MARKER_ICON(isLoaded)}
            title="Winch Driver"
          />
        )}

        {/* Real driving route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#0ea5e9',
                strokeWeight: 5,
                strokeOpacity: 0.9,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};
