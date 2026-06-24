import React, { useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Truck, Wallet, User, Power, AlertTriangle, CreditCard, CheckCircle, X, Layers, Plus, Minus, Navigation, Clock } from 'lucide-react';
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
  const [payLoading, setPayLoading] = React.useState(false);
  const [payResult, setPayResult] = React.useState<{ success: boolean; message: string } | null>(null);
  
  // History state
  const [history, setHistory] = React.useState<any[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [historyFilter, setHistoryFilter] = React.useState('last24h');

  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/winch/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setHistory(data || []);
    } catch (e) { console.error('Failed to fetch history', e); }
  };

  React.useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  const safeUser = user || { walletBalance: 0, name: 'Driver', id: '', approvalStatus: 'PENDING', commissionOwed: 0 } as any;
  const commissionOwed = safeUser.commissionOwed || 0;
  const hasDebt = commissionOwed > 0;

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

    socket.on('driver_error', (data: any) => {
      alert(data.message);
      setIsOnline(false);
    });

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

    if (!isOnline) {
      if (safeUser.approvalStatus === 'BLOCKED') {
        alert('You are currently blocked by the admin. Please contact support.');
        return;
      }
      if (commissionOwed > 0) {
        alert('Please settle your commission debt to go online.');
        return;
      }
      socket.emit('driver_online', {
        driverId: safeUser.id,
        driverName: safeUser.name || 'Driver',
        vehicle: 'Flatbed Heavy-Duty',
        price: 500,
      });
      setIsOnline(true);
    } else {
      socket.emit('driver_offline');
      setIsOnline(false);
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
      {/* ── HISTORY MODAL ─────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-cyber-900">
          <div className="p-6 pt-12 flex items-center justify-between shadow-sm bg-white dark:bg-cyber-900">
            <button onClick={() => setShowHistory(false)} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white"><ArrowLeft size={20} /></button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Rides</h2>
            <div className="w-10"></div>
          </div>
          
          <div className="p-4 flex gap-2 overflow-x-auto pb-2">
            {['last24h', 'yesterday', '1week', '2weeks', '1month'].map(filter => (
              <button 
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${historyFilter === filter ? 'bg-cyber-primary text-white shadow-md' : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
              >
                {filter === 'last24h' ? 'Last 24h' : filter === 'yesterday' ? 'Yesterday' : filter === '1week' ? 'Past Week' : filter === '2weeks' ? 'Past 2 Weeks' : 'Past Month'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.filter(h => {
              const date = new Date(h.createdAt);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - date.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (historyFilter === 'last24h') return diffTime <= 24 * 60 * 60 * 1000;
              if (historyFilter === 'yesterday') return diffDays === 1;
              if (historyFilter === '1week') return diffDays <= 7;
              if (historyFilter === '2weeks') return diffDays <= 14;
              if (historyFilter === '1month') return diffDays <= 30;
              return true;
            }).map((trip, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 relative">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock size={14} className="text-cyber-primary" />
                      {new Date(trip.createdAt).toLocaleString()}
                    </h4>
                    <p className="text-xs text-gray-500">Customer: {trip.userId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-cyber-primary font-bold text-lg">{trip.price} EGP</span>
                    <span className={`block text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${trip.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {trip.status}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-lg flex items-center justify-between text-xs text-slate-600 dark:text-gray-400">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Pickup</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Dropoff</div>
                  </div>
                  <div className="text-right">
                    Commission: <span className="text-red-500 font-bold">{(trip.price * 0.1).toFixed(2)} EGP</span>
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-10 text-gray-500">No rides found for this period.</div>
            )}
          </div>
        </div>
      )}

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
                if (socketRef.current && activeBookingId) {
                  socketRef.current.emit('complete_booking', { bookingId: activeBookingId });
                }
                alert('Ride Completed! Your wallet has been credited.');
                setActiveBookingId(null);
                setIsOnline(false);
                refreshUser();
              }} className="bg-cyber-primary text-white px-4 py-2 rounded-lg font-bold">Arrived / Complete</button>
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

                <div className="bg-slate-100 dark:bg-black/20 p-3 rounded-lg mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Price:</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveRequest({...activeRequest, price: Math.max(100, activeRequest.price - 10)})} className="p-1 rounded bg-white/50 dark:bg-white/10 text-slate-900 dark:text-white font-bold">-</button>
                    <span className="font-bold text-cyber-primary">{activeRequest.price} EGP</span>
                    <button onClick={() => setActiveRequest({...activeRequest, price: activeRequest.price + 10})} className="p-1 rounded bg-white/50 dark:bg-white/10 text-slate-900 dark:text-white font-bold">+</button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleDecline} className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-lg font-bold text-slate-700 dark:text-white hover:bg-red-500 hover:text-white transition">Decline</button>
                  <button onClick={() => {
                    if (socketRef.current) {
                      socketRef.current.emit('driver_counter_offer', {
                        customerSocketId: activeRequest.customerSocketId,
                        driverId: socketRef.current.id,
                        price: activeRequest.price
                      });
                      alert(`Counter offer of ${activeRequest.price} EGP sent! Waiting for customer...`);
                      setTimer(30);
                    }
                  }} className="flex-1 bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30 py-2 rounded-lg font-bold hover:bg-cyber-primary/40 transition">Counter</button>
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
            <button className="text-gray-400 flex flex-col items-center relative" onClick={() => setShowWinchWallet(true)}>
              <Wallet size={24}/>
              {hasDebt && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
              <span className="text-[10px]">Wallet</span>
            </button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => setShowHistory(true)}><Clock size={24}/><span className="text-[10px]">History</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => navigate('/profile')}><User size={24}/><span className="text-[10px]">Profile</span></button>
          </div>
        </>
      )}
    </div>
  );
};
