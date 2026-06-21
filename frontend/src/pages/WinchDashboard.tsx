import React, { useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Truck, Wallet, User, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LiveMap } from '../components/LiveMap';
import { API_URL } from '../config';
import { io, Socket } from 'socket.io-client';

export const WinchDashboard = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [showWinchWallet, setShowWinchWallet] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(false);
  const [activeRequest, setActiveRequest] = React.useState<any | null>(null);
  const [activeBookingId, setActiveBookingId] = React.useState<string | null>(null);
  const [driverLoc, setDriverLoc] = React.useState({ lat: 30.0500, lng: 31.2400 });
  const [userLoc, setUserLoc] = React.useState({ lat: 30.0444, lng: 31.2357 });
  const [timer, setTimer] = React.useState(30);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const safeUser = user || { walletBalance: 0, name: 'Driver', id: '' } as any;

  // Connect socket once on mount
  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (safeUser.id) socket.emit('register_user', safeUser.id);
    });

    // Incoming booking request from customer
    socket.on('new_request', (data: any) => {
      setActiveRequest(data);
      setTimer(30);
    });

    // Booking was created (after accepting)
    socket.on('booking_started', (data: { bookingId: string }) => {
      setActiveBookingId(data.bookingId);
      setActiveRequest(null);
    });

    socket.on('booking_error', (data: any) => alert(data.message));

    return () => { socket.disconnect(); };
  }, []);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!activeRequest) return;
    if (timer <= 0) { setActiveRequest(null); return; }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, activeRequest]);

  // Go online / offline
  const toggleOnline = () => {
    const socket = socketRef.current;
    if (!socket) return;

    if (isOnline) {
      socket.emit('driver_offline');
      setIsOnline(false);
    } else {
      socket.emit('driver_online', {
        driverId: safeUser.id,
        driverName: safeUser.name || 'Driver',
        vehicle: 'Flatbed Heavy-Duty',
        price: 500,
      });
      setIsOnline(true);
    }
  };

  // Accept the customer's request
  const handleAccept = () => {
    const socket = socketRef.current;
    if (!socket || !activeRequest) return;
    socket.emit('accept_request', {
      customerSocketId: activeRequest.customerSocketId,
      customerId: activeRequest.customerId,
      driverId: safeUser.id,
      driverName: safeUser.name || 'Driver',
      vehicle: 'Flatbed Heavy-Duty',
      price: activeRequest.price,
    });
  };

  // Decline
  const handleDecline = () => {
    const socket = socketRef.current;
    if (!socket || !activeRequest) return;
    socket.emit('decline_request', { customerSocketId: activeRequest.customerSocketId });
    setActiveRequest(null);
  };

  // Start GPS streaming once booking is active
  useEffect(() => {
    const socket = socketRef.current;
    if (!activeBookingId || !socket) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDriverLoc({ lat: latitude, lng: longitude });
        socket.emit('update_location', {
          bookingId: activeBookingId,
          driverLat: latitude,
          driverLng: longitude,
          status: 'Driver En Route',
        });
      },
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    watchIdRef.current = watchId;

    // Listen for customer location updates
    socket.on('location_updated', (data: any) => {
      if (data.userLat && data.userLng) setUserLoc({ lat: data.userLat, lng: data.userLng });
    });

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      socket.off('location_updated');
    };
  }, [activeBookingId]);

  const handleWithdraw = async () => {
    if (safeUser.walletBalance > 0) {
      alert(`Withdrawal request for ${safeUser.walletBalance} EGP sent to your bank.`);
      await refreshUser();
    } else {
      alert('No funds to withdraw.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      {showWinchWallet ? (
        <div className="flex-1 p-6 pt-12 flex flex-col">
          <button aria-label="Back" onClick={() => setShowWinchWallet(false)} className="mb-6 w-fit text-slate-900 dark:text-white"><ArrowLeft /></button>
          <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Wallet</h2>
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-blue-700 text-white mb-6">
            <p className="text-sm opacity-80">Total Balance</p>
            <p className="text-4xl font-bold">{safeUser.walletBalance?.toLocaleString()} EGP</p>
          </div>
          <button onClick={handleWithdraw} className="mt-auto w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Request Withdrawal</button>
        </div>
      ) : activeBookingId ? (
        // ── LIVE NAVIGATION VIEW ───────────────────────────────────────────────
        <div className="flex-1 flex flex-col h-full bg-white relative">
          <div className="p-6 pt-12 flex items-center justify-between shadow-sm z-10 bg-white dark:bg-cyber-900">
            <button aria-label="Back" onClick={() => { setActiveBookingId(null); setIsOnline(false); }} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Live Navigation</h2>
              <p className="text-xs text-green-500 font-bold">En Route to Customer</p>
            </div>
            <div className="w-10" />
          </div>
          <div className="flex-1 relative">
            <LiveMap userLat={userLoc.lat} userLng={userLoc.lng} driverLat={driverLoc.lat} driverLng={driverLoc.lng} />
            <div className="absolute bottom-6 left-6 right-6 glass-panel p-4 rounded-xl shadow-lg z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Customer Location</h3>
                <p className="text-xs text-gray-500">Drive safely to your customer</p>
              </div>
              <button onClick={() => {
                alert('Marked as Arrived!');
                setActiveBookingId(null);
                setIsOnline(false);
                refreshUser();
              }} className="bg-cyber-primary text-white px-4 py-2 rounded-lg font-bold">Arrived</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── HEADER ──────────────────────────────────────────────────────── */}
          <div className="p-6 pt-12 bg-cyber-900 text-white pb-8 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold font-display">Winch Command</h2>
                <p className="text-gray-400 text-sm">Welcome, {safeUser.name}</p>
              </div>
              <div onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gray-700 border border-cyber-primary overflow-hidden cursor-pointer">
                <img src="https://picsum.photos/100/100" alt="Profile" />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div onClick={toggleOnline} className={`w-14 h-8 rounded-full relative transition-colors duration-300 cursor-pointer ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${isOnline ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="font-bold">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Wallet Balance</p>
                <p className="text-xl font-bold text-cyber-primary">{safeUser.walletBalance} EGP</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* ── INCOMING REQUEST ──────────────────────────────────────────── */}
            {isOnline && activeRequest ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border-l-4 border-cyber-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-red-500 text-white text-[10px] font-bold rounded-bl-lg">{timer}s</div>
                <span className="bg-cyber-primary/20 text-cyber-primary text-xs font-bold px-2 py-1 rounded inline-block mb-2">🔔 NEW REQUEST</span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{activeRequest.car}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><MapPin size={14}/> {activeRequest.distance} away</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customer: {activeRequest.customerName} • {activeRequest.issue}</p>

                <div className="bg-slate-100 dark:bg-black/20 p-3 rounded-lg mb-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Offered Price: {activeRequest.price} EGP</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleDecline} className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-lg font-bold text-slate-700 dark:text-white hover:bg-red-500 hover:text-white transition">Decline</button>
                  <button onClick={handleAccept} className="flex-1 bg-cyber-primary text-white py-2 rounded-lg font-bold shadow-lg hover:bg-blue-600 transition">Accept</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <div className={`mx-auto w-fit mb-2 p-4 rounded-full ${isOnline ? 'bg-green-500/10 text-green-500 animate-pulse' : 'bg-gray-500/10'}`}>
                  <Power size={32} />
                </div>
                <p>{isOnline ? 'Searching for requests...' : 'Go online to receive requests'}</p>
              </div>
            )}

            {/* ── WALLET CARD ───────────────────────────────────────────────── */}
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Wallet</h3>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 text-sm">Available Balance</span>
                <span className="font-bold text-xl text-slate-900 dark:text-white">{safeUser.walletBalance} EGP</span>
              </div>
              <button onClick={() => setShowWinchWallet(true)} className="w-full py-3 border border-cyber-primary text-cyber-primary rounded-lg font-bold hover:bg-cyber-primary hover:text-white transition">View Details</button>
            </div>
          </div>

          {/* ── BOTTOM NAV ────────────────────────────────────────────────────── */}
          <div className="p-4 glass-panel flex justify-around items-center">
            <button className="text-cyber-primary flex flex-col items-center"><Truck size={24}/><span className="text-[10px]">Requests</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => setShowWinchWallet(true)}><Wallet size={24}/><span className="text-[10px]">Wallet</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => navigate('/profile')}><User size={24}/><span className="text-[10px]">Profile</span></button>
          </div>
        </>
      )}
    </div>
  );
};
