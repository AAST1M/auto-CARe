import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LiveMapProps {
  userLat?: number;
  userLng?: number;
  driverLat?: number;
  driverLng?: number;
}

// Helper component to auto-fit bounds when coordinates change
const AutoFitBounds = ({ userLat, userLng, driverLat, driverLng }: LiveMapProps) => {
  const map = useMap();

  useEffect(() => {
    const bounds: [number, number][] = [];
    if (userLat && userLng) bounds.push([userLat, userLng]);
    if (driverLat && driverLng) bounds.push([driverLat, driverLng]);

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0] as [number, number], 14);
      } else {
        const leafletBounds = L.latLngBounds(bounds);
        map.fitBounds(leafletBounds, { padding: [50, 50] });
      }
    }
  }, [map, userLat, userLng, driverLat, driverLng]);

  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({ userLat, userLng, driverLat, driverLng }) => {
  // Default center (Cairo if no coordinates)
  const defaultCenter: [number, number] = [30.0444, 31.2357];
  
  const center: [number, number] = (userLat && userLng) 
    ? [userLat, userLng] 
    : (driverLat && driverLng) ? [driverLat, driverLng] : defaultCenter;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-lg relative z-0">
      <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={userIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {driverLat && driverLng && (
          <Marker position={[driverLat, driverLng]} icon={driverIcon}>
            <Popup>Winch Driver</Popup>
          </Marker>
        )}

        <AutoFitBounds userLat={userLat} userLng={userLng} driverLat={driverLat} driverLng={driverLng} />
      </MapContainer>
    </div>
  );
};
