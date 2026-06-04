import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LiveMap } from '../components/LiveMap';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { io } from 'socket.io-client';

interface WinchLiveUserProps {
  bookingId: string;
  onBack: () => void;
}

export const WinchLiveUser: React.FC<WinchLiveUserProps> = ({ bookingId, onBack }) => {
  const { token } = useAuth();
  const [location, setLocation] = useState<{
    userLat?: number;
    userLng?: number;
    driverLat?: number;
    driverLng?: number;
    status: string;
  }>({ status: 'Loading...' });

  // WebSocket connection for real-time tracking
  useEffect(() => {
    const socket = io(API_URL, {
      withCredentials: true
    });

    socket.on('connect', () => {
      // Join the specific room for this booking
      socket.emit('join_winch_room', bookingId);
      
      // Emit initial user location (Using hardcoded GPS for demo phase)
      const userLat = 30.0444; 
      const userLng = 31.2357;
      socket.emit('update_location', { bookingId, userLat, userLng, status: 'User Waiting' });
    });

    // Listen for driver GPS updates
    socket.on('location_updated', (data) => {
      setLocation(prev => ({ ...prev, ...data }));
    });

    return () => {
      socket.disconnect();
    };
  }, [bookingId]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      <div className="p-6 pt-12 flex items-center justify-between shadow-sm z-10 bg-white dark:bg-cyber-900">
        <button aria-label="Back" onClick={onBack} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Live Tracking</h2>
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
        
        {/* Driver info overlay */}
        <div className="absolute bottom-6 left-6 right-6 glass-panel p-4 rounded-xl shadow-lg z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary">
                🚗
             </div>
             <div>
               <h3 className="font-bold text-slate-900 dark:text-white">Winch is on the way</h3>
               <p className="text-xs text-gray-500">Your driver is heading to your location.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
