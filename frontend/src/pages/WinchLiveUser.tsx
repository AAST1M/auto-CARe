import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LiveMap } from '../components/LiveMap';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { io } from 'socket.io-client';
import { UserRole } from '../types';

interface WinchLiveUserProps {
  bookingId: string;
  onBack: () => void;
}

export const WinchLiveUser: React.FC<WinchLiveUserProps> = ({ bookingId, onBack }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState<{
    userLat?: number;
    userLng?: number;
    driverLat?: number;
    driverLng?: number;
    status: string;
    distance?: string;
    eta?: string;
  }>({ status: 'Locating...' });

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const isDriver = user?.role === UserRole.WINCH_DRIVER;

  // WebSocket connection for real-time tracking
  useEffect(() => {
    const socket = io(API_URL, {
      withCredentials: true
    });
    socketRef.current = socket;

    let watchId: number | null = null;

    socket.on('connect', () => {
      // Join the specific room for this booking
      socket.emit('join_winch_room', bookingId);
      
      // Watch real location dynamically
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const latitude = pos.coords.latitude;
            const longitude = pos.coords.longitude;
            
            if (isDriver) {
              socket.emit('update_location', {
                bookingId,
                driverLat: latitude,
                driverLng: longitude,
                status: 'Driver En Route'
              });
              setLocation(prev => ({
                ...prev,
                driverLat: latitude,
                driverLng: longitude,
                status: 'Driver En Route'
              }));
            } else {
              socket.emit('update_location', {
                bookingId,
                userLat: latitude,
                userLng: longitude,
                status: 'User Waiting'
              });
              setLocation(prev => ({
                ...prev,
                userLat: latitude,
                userLng: longitude,
                status: 'Waiting for Driver GPS'
              }));
            }
          },
          (err) => {
            console.error('Geolocation error:', err);
            // Fallback
            if (isDriver) {
              socket.emit('update_location', {
                bookingId,
                driverLat: 30.0500,
                driverLng: 31.2400,
                status: 'Driver En Route (Fallback)'
              });
            } else {
              socket.emit('update_location', {
                bookingId,
                userLat: 30.0444,
                userLng: 31.2357,
                status: 'User Waiting (Fallback)'
              });
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        // Fallback
        if (isDriver) {
          socket.emit('update_location', {
            bookingId,
            driverLat: 30.0500,
            driverLng: 31.2400,
            status: 'Driver En Route (No GPS)'
          });
        } else {
          socket.emit('update_location', {
            bookingId,
            userLat: 30.0444,
            userLng: 31.2357,
            status: 'User Waiting (No GPS)'
          });
        }
      }
    });

    // Listen for driver and user GPS updates (eta/distance computed by backend)
    socket.on('location_updated', (data) => {
      setLocation(prev => ({ ...prev, ...data }));
    });

    socket.on('booking_completed', () => {
      alert('The ride has been completed!');
      onBack(); // Go back to dashboard
    });

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      socket.disconnect();
    };
  }, [bookingId, isDriver]);

  const handleCompleteTow = () => {
    if (socketRef.current) {
      socketRef.current.emit('complete_booking', { bookingId });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      <div className="p-6 pt-12 flex items-center justify-between shadow-sm z-10 bg-white dark:bg-cyber-900">
        <button aria-label="Back" onClick={onBack} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            {isDriver ? 'Live Navigation' : 'Live Tracking'}
          </h2>
          <p className="text-xs text-cyber-primary font-bold">{location.status}</p>
        </div>
        <div className="w-10"></div>
      </div>
      
      <div className="flex-1 relative">
        <LiveMap 
          userLat={location.userLat} 
          userLng={location.userLng} 
          driverLat={location.driverLat} 
          driverLng={location.driverLng} 
        />
        
        {/* Info overlay based on role */}
        <div className="absolute bottom-6 left-6 right-6 glass-panel p-4 rounded-xl shadow-lg z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
          {isDriver ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary text-xl">
                  👤
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Customer Location</h3>
                  <p className="text-xs text-gray-500">
                    {location.distance ? `${location.distance} away` : 'Drive safely to your customer.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleCompleteTow}
                className="px-4 py-2 bg-cyber-primary text-white font-bold rounded-lg shadow hover:bg-blue-600 transition-colors"
              >
                Arrived / Complete
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary text-xl">
                  🚗
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {location.eta ? `Arriving in ~${location.eta}` : 'Winch is on the way'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {location.distance ? `${location.distance} away` : 'Driver is heading to you.'}
                  </p>
                </div>
              </div>
              
              <a href="tel:+201000000000" className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg shadow hover:bg-green-600 transition-colors">
                Call Driver
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
