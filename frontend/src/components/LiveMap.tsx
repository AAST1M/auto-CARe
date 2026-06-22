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
    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    scaledSize: new google.maps.Size(44, 44),
    anchor: new google.maps.Point(22, 44),
  };
};

const DRIVER_MARKER_ICON = (loaded: boolean): google.maps.Icon | undefined => {
  if (!loaded || typeof google === 'undefined') return undefined;
  return {
    path: 'M18 4l-2-2H8L6 4H2v2h20V4zM5 20c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8H5v12zm6.5-4.5l-3-3L10 11l1.5 1.5L15 9l1.5 1.5-5 5z',
    fillColor: '#ef4444',
    fillOpacity: 1,
    strokeColor: '#fff',
    strokeWeight: 1.5,
    scale: 1.4,
    anchor: new google.maps.Point(12, 24),
  } as google.maps.Symbol & google.maps.Icon;
};

interface LiveMapProps {
  userLat?: number;
  userLng?: number;
  driverLat?: number;
  driverLng?: number;
}

export const LiveMap: React.FC<LiveMapProps> = ({ userLat, userLng, driverLat, driverLng }) => {
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
        zoom={14}
        onLoad={onMapLoad}
        options={{
          styles: MAP_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
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
