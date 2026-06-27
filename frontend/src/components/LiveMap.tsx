import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Layers } from 'lucide-react';

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

const DEST_MARKER_ICON = (loaded: boolean): google.maps.Icon | undefined => {
  if (!loaded || typeof google === 'undefined') return undefined;
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
  <defs>
    <linearGradient id="destGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
  <path d="M16 2C8.2 2 2 8.2 2 16c0 10.5 12.8 23.5 13.3 24.1.4.4 1 .4 1.4 0C17.2 39.5 30 26.5 30 16 30 8.2 23.8 2 16 2z" fill="url(#destGrad)" stroke="#ffffff" stroke-width="2" filter="url(#shadow)" />
  <circle cx="16" cy="16" r="8" fill="#ffffff" />
  <text x="16" y="20.5" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="900" fill="#b91c1c" text-anchor="middle">B</text>
</svg>
`)}`,
    scaledSize: new google.maps.Size(40, 52),
    anchor: new google.maps.Point(20, 52),
  };
};

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
  <text x="16" y="20.5" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="900" fill="#1d4ed8" text-anchor="middle">A</text>
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
  destLat?: number;
  destLng?: number;
  tripStatus?: string;
  mapTypeId?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onMapLoadExternal?: (map: google.maps.Map) => void;
  onRouteUpdate?: (info: { distance: string; eta: string }) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  userLat,
  userLng,
  driverLat,
  driverLng,
  destLat,
  destLng,
  tripStatus,
  mapTypeId = 'roadmap',
  zoom = 14,
  onZoomChange,
  onMapLoadExternal,
  onRouteUpdate,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [directionsToA, setDirectionsToA] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsAToB, setDirectionsAToB] = useState<google.maps.DirectionsResult | null>(null);
  const [currentMapType, setCurrentMapType] = useState<string>(mapTypeId);
  const [showMapTypeMenu, setShowMapTypeMenu] = useState(false);

  useEffect(() => {
    setCurrentMapType(mapTypeId);
  }, [mapTypeId]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fetch driving directions
  useEffect(() => {
    if (!isLoaded) return;

    const directionsService = new google.maps.DirectionsService();

    // 1. Leg 1: Driver to Customer (Point A)
    // Only needed if driver position is active and status is Active or Arrived
    const needDriverToA = !!(driverLat && driverLng && userLat && userLng && (tripStatus === 'Active' || tripStatus === 'Arrived'));

    if (needDriverToA) {
      directionsService.route(
        {
          origin: { lat: driverLat!, lng: driverLng! },
          destination: { lat: userLat!, lng: userLng! },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirectionsToA(result);
          } else {
            setDirectionsToA(null);
          }
        }
      );
    } else {
      setDirectionsToA(null);
    }

    // 2. Leg 2: Customer to Destination (Point B)
    // - If tripStatus is In Progress, the driver travels from current position (driverLat/Lng) to destLat/Lng
    // - If tripStatus is Active or Arrived, we show customer (userLat/Lng) to destLat/Lng
    // - If reviewing/no status, we show customer (userLat/Lng) to destLat/Lng
    const needAToB = !!(userLat && userLng && destLat && destLng && (tripStatus === 'Active' || tripStatus === 'Arrived' || !tripStatus || tripStatus === 'Reviewing'));
    const needDriverToB = !!(driverLat && driverLng && destLat && destLng && tripStatus === 'In Progress');

    if (needAToB) {
      directionsService.route(
        {
          origin: { lat: userLat!, lng: userLng! },
          destination: { lat: destLat!, lng: destLng! },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirectionsAToB(result);
          } else {
            setDirectionsAToB(null);
          }
        }
      );
    } else if (needDriverToB) {
      directionsService.route(
        {
          origin: { lat: driverLat!, lng: driverLng! },
          destination: { lat: destLat!, lng: destLng! },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirectionsAToB(result);
          } else {
            setDirectionsAToB(null);
          }
        }
      );
    } else {
      // Fallback for old tracking with no dest coordinates: just driver to customer
      if (driverLat && driverLng && userLat && userLng && !destLat && !destLng) {
        directionsService.route(
          {
            origin: { lat: driverLat, lng: driverLng },
            destination: { lat: userLat, lng: userLng },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              setDirectionsAToB(result);
            } else {
              setDirectionsAToB(null);
            }
          }
        );
      } else {
        setDirectionsAToB(null);
      }
    }
  }, [isLoaded, userLat, userLng, driverLat, driverLng, destLat, destLng, tripStatus]);

  // Invoke callback when route results or status change
  const [lastEmitted, setLastEmitted] = useState({ distance: '', eta: '' });
  
  useEffect(() => {
    if (!onRouteUpdate) return;
    let activeLeg = null;

    if (tripStatus === 'Active' || tripStatus === 'Driver En Route') {
      activeLeg = directionsToA?.routes[0]?.legs[0];
    } else if (tripStatus === 'In Progress' || tripStatus === 'Towing') {
      activeLeg = directionsAToB?.routes[0]?.legs[0];
    } else if (!tripStatus || tripStatus === 'Reviewing' || tripStatus === 'Pending_Approval') {
      activeLeg = directionsAToB?.routes[0]?.legs[0];
    }

    if (!activeLeg && !tripStatus) {
      activeLeg = directionsAToB?.routes[0]?.legs[0];
    }

    if (activeLeg) {
      const dist = activeLeg.distance?.text || '';
      const eta = activeLeg.duration?.text || '';
      
      if (dist !== lastEmitted.distance || eta !== lastEmitted.eta) {
        setLastEmitted({ distance: dist, eta });
        onRouteUpdate({ distance: dist, eta });
      }
    }
  }, [directionsToA, directionsAToB, tripStatus]);

  // Auto-fit bounds when coordinates change
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;
    if (userLat && userLng) { bounds.extend({ lat: userLat, lng: userLng }); hasPoints = true; }
    if (driverLat && driverLng) { bounds.extend({ lat: driverLat, lng: driverLng }); hasPoints = true; }
    if (destLat && destLng) { bounds.extend({ lat: destLat, lng: destLng }); hasPoints = true; }
    if (hasPoints) {
      const count = (userLat && userLng ? 1 : 0) + (driverLat && driverLng ? 1 : 0) + (destLat && destLng ? 1 : 0);
      if (count > 1) {
        mapRef.current.fitBounds(bounds, { top: 80, bottom: 80, left: 40, right: 40 });
      } else {
        const pt = userLat && userLng ? { lat: userLat, lng: userLng } : driverLat && driverLng ? { lat: driverLat, lng: driverLng } : { lat: destLat!, lng: destLng! };
        mapRef.current.panTo(pt);
        mapRef.current.setZoom(15);
      }
    }
  }, [isLoaded, userLat, userLng, driverLat, driverLng, destLat, destLng]);

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
        mapTypeId={currentMapType}
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
          styles: currentMapType === 'roadmap' ? MAP_STYLE : [],
          disableDefaultUI: false,
          zoomControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
        }}
      >
        {/* User location marker (A) */}
        {userLat && userLng && (
          <Marker
            position={{ lat: userLat, lng: userLng }}
            icon={USER_MARKER_ICON(isLoaded)}
            title="Pickup Location (Point A)"
          />
        )}

        {/* Driver location marker (winch icon) */}
        {driverLat && driverLng && (
          <Marker
            position={{ lat: driverLat, lng: driverLng }}
            icon={DRIVER_MARKER_ICON(isLoaded)}
            title="Winch Driver"
          />
        )}

        {/* Destination marker (B) */}
        {destLat && destLng && (
          <Marker
            position={{ lat: destLat, lng: destLng }}
            icon={DEST_MARKER_ICON(isLoaded)}
            title="Destination (Point B)"
          />
        )}

        {/* Leg 1: Driver to Customer (Arrived or heading there) */}
        {directionsToA && (
          <DirectionsRenderer
            directions={directionsToA}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#f59e0b',
                strokeWeight: 4,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}

        {/* Leg 2: Customer to Destination (Towing) */}
        {directionsAToB && (
          <DirectionsRenderer
            directions={directionsAToB}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#0ea5e9',
                strokeWeight: 5,
                strokeOpacity: 0.9,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* Floating Map Controls */}
      <div className="absolute right-4 top-4 z-[999] flex flex-col gap-2 pointer-events-auto">
        {/* Map Type Toggle Button */}
        <div className="relative">
          <button
            onClick={() => setShowMapTypeMenu(!showMapTypeMenu)}
            className={`p-3.5 rounded-full shadow-lg border transition-all flex items-center justify-center ${
              showMapTypeMenu
                ? 'bg-cyber-primary text-white border-cyber-primary scale-105 shadow-cyber-primary/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:text-cyber-primary border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95'
            }`}
            title="Change map type"
            aria-label="Change map type"
          >
            <Layers size={18} />
          </button>

          {showMapTypeMenu && (
            <div className="absolute right-14 top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700/80 rounded-2xl p-2 shadow-2xl flex gap-1 items-center min-w-[280px]">
              {[
                { id: 'roadmap', label: 'Default', icon: '🗺️' },
                { id: 'satellite', label: 'Satellite', icon: '🛰️' },
                { id: 'terrain', label: 'Terrain', icon: '⛰️' },
                { id: 'hybrid', label: 'Hybrid', icon: '🌐' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setCurrentMapType(type.id);
                    setShowMapTypeMenu(false);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
                    currentMapType === type.id
                      ? 'bg-cyber-primary text-white font-bold shadow-md scale-105'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-base">{type.icon}</span>
                  <span className="text-[10px] tracking-wide">{type.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <button
          onClick={() => {
            if (mapRef.current) {
              const z = mapRef.current.getZoom();
              if (z !== undefined) mapRef.current.setZoom(z + 1);
            }
          }}
          className="w-11 h-11 rounded-full shadow-lg border transition-all flex items-center justify-center bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95 text-lg font-bold"
          title="Zoom In"
          aria-label="Zoom In"
        >
          ＋
        </button>

        <button
          onClick={() => {
            if (mapRef.current) {
              const z = mapRef.current.getZoom();
              if (z !== undefined) mapRef.current.setZoom(z - 1);
            }
          }}
          className="w-11 h-11 rounded-full shadow-lg border transition-all flex items-center justify-center bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95 text-lg font-bold"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          －
        </button>
      </div>
    </div>
  );
};
