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
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);
  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [withdrawLoading, setWithdrawLoading] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(false);
  const [activeRequest, setActiveRequest] = React.useState<any | null>(null);
  const [activeBookingId, setActiveBookingId] = React.useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = React.useState<any | null>(null);
  const [driverLoc, setDriverLoc] = React.useState({ lat: 30.0500, lng: 31.2400 });
  const [userLoc, setUserLoc] = React.useState({ lat: 30.0444, lng: 31.2357 });
  const [timer, setTimer] = React.useState(30);
  const [completedTripEarnings, setCompletedTripEarnings] = React.useState<{ price: number; paymentMethod: string } | null>(null);
  const [eta, setEta] = React.useState<string>('');
  const [distance, setDistance] = React.useState<string>('');
  const [destAddress, setDestAddress] = React.useState<string>('Point B (Drop-off)');
  
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
      const userId = localStorage.getItem('userId') || (user && user.id);
      if (userId) socket.emit('register_user', userId);
    });

    // Incoming booking request from customer
    socket.on('new_request', (data: any) => {
      setActiveRequest({
        ...data,
        originalPrice: data.price
      });
      setTimer(30);
      setDistance('');
      setEta('');
    });

    // Booking was created (after accepting)
    socket.on('booking_started', (data: { bookingId: string; userLat?: number; userLng?: number }) => {
      setActiveBookingId(data.bookingId);
      setActiveRequest(null);
      setDistance('');
      setEta('');
    });

    socket.on('booking_status', (data: { bookingId: string; status: string }) => {
      setBookingDetails((prev: any) => {
        if (prev && prev.id === data.bookingId) {
          return { ...prev, status: data.status };
        }
        return prev;
      });
    });

    socket.on('booking_cancelled', () => {
      alert('Booking was cancelled by customer.');
      setActiveBookingId(null);
      setBookingDetails(null);
      setIsOnline(false);
    });

    socket.on('booking_completed', (data: { paymentMethod: string; price: number }) => {
      setCompletedTripEarnings({
        price: data.price,
        paymentMethod: data.paymentMethod
      });
      setBookingDetails(null);
      setActiveBookingId(null);
      setIsOnline(false);
      refreshUser();
    });

    socket.on('location_updated', (data: any) => {
      if (data.userLat && data.userLng) setUserLoc({ lat: data.userLat, lng: data.userLng });
      if (data.eta) setEta(data.eta);
      if (data.distance) setDistance(data.distance);
    });

    socket.on('booking_error', (data: any) => alert(data.message));

    socket.on('driver_error', (data: any) => {
      alert(data.message);
      setIsOnline(false);
    });

    return () => { socket.disconnect(); };
  }, []);

  // Join the winch room whenever activeBookingId is set
  useEffect(() => {
    const socket = socketRef.current;
    if (activeBookingId && socket) {
      socket.emit('join_winch_room', activeBookingId);
    }
  }, [activeBookingId]);

  // Fetch active booking details when activeBookingId is set
  useEffect(() => {
    if (!activeBookingId) {
      setBookingDetails(null);
      return;
    }

    fetch(`${API_URL}/api/winch/location/${activeBookingId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data && !data.error) {
        setBookingDetails(data);
        if (data.destLat && data.destLng && (window as any).google?.maps?.Geocoder) {
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode({ location: { lat: data.destLat, lng: data.destLng } }, (results: any, status: any) => {
            if (status === (window as any).google.maps.GeocoderStatus.OK && results && results[0]) {
              setDestAddress(results[0].formatted_address.split(',')[0] || 'Point B (Drop-off)');
            }
          });
        }
        if (data.userLat && data.userLng) setUserLoc({ lat: data.userLat, lng: data.userLng });
      }
    })
    .catch(e => console.error('Error fetching booking details for driver:', e));
  }, [activeBookingId]);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!activeRequest) return;
    if (timer <= 0) { setActiveRequest(null); return; }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, activeRequest]);

  // Start GPS streaming once booking is active
  useEffect(() => {
    const socket = socketRef.current;
    if (!activeBookingId || !socket) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDriverLoc({ lat: latitude, lng: longitude });
        
        const currentStatus = bookingDetails?.status || 'Active';

        socket.emit('update_location', {
          bookingId: activeBookingId,
          driverLat: latitude,
          driverLng: longitude,
          status: currentStatus === 'In Progress' ? 'Towing' : 'Driver En Route',
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
  }, [activeBookingId, bookingDetails?.status]);

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
      pickupLat: activeRequest.pickupLat,
      pickupLng: activeRequest.pickupLng,
      dropoffLat: activeRequest.dropoffLat,
      dropoffLng: activeRequest.dropoffLng,
      priceIsAdjusted: activeRequest.price !== activeRequest.originalPrice
    });
  };

  // Decline
  const handleDecline = () => {
    const socket = socketRef.current;
    if (!socket || !activeRequest) return;
    socket.emit('decline_request', { customerSocketId: activeRequest.customerSocketId });
    setActiveRequest(null);
  };

  const handleWithdraw = async (amount: number) => {
    if (amount <= 0 || amount > safeUser.walletBalance) {
      alert('Invalid withdrawal amount.');
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw');
      alert(data.message || `Withdrawal request for ${amount} EGP sent.`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      await refreshUser();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleSettleDebt = async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/settle-commission`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to settle debt');
      alert('Debt settled successfully!');
      refreshUser();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      {/* ── HISTORY MODAL ─────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-cyber-900">
          <div className="p-6 pt-12 flex items-center justify-between shadow-sm bg-white dark:bg-cyber-900">
            <button aria-label="Back" onClick={() => setShowHistory(false)} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white"><ArrowLeft size={20} /></button>
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
              const diffTime = now.getTime() - date.getTime();
              const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
              const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));
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
                    <p className="text-xs text-gray-500">Customer ID: {trip.userId.substring(0, 8)}...</p>
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
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Route Completed</div>
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
        <div className="flex-1 p-6 pt-12 flex flex-col bg-slate-50 dark:bg-slate-900">
          <button aria-label="Go Back" title="Go Back" onClick={() => setShowWinchWallet(false)} className="mb-6 w-fit text-slate-900 dark:text-white"><ArrowLeft /></button>
          <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Wallet</h2>
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-blue-700 text-white mb-6">
            <p className="text-sm opacity-80">Total Balance</p>
            <p className="text-4xl font-bold">{safeUser.walletBalance?.toLocaleString()} EGP</p>
          </div>

          {commissionOwed > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-6 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-red-700 dark:text-red-400">Commission Debt</span>
                <span className="font-bold text-red-700 dark:text-red-400">{commissionOwed} EGP</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-500">
                You must settle this debt using your wallet balance before you can receive new requests.
              </p>
              <button 
                onClick={handleSettleDebt}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                Settle Debt Now
              </button>
            </div>
          )}

          <button onClick={() => setShowWithdrawModal(true)} className="mt-auto w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Request Withdrawal</button>
        </div>
      ) : activeBookingId ? (
        // ── LIVE NAVIGATION VIEW (LOCKED SCREEN) ───────────────────────────────────────────────
        <div className="flex-1 flex flex-col h-full bg-white relative">
          <div className="p-6 pt-12 flex items-center justify-between shadow-sm z-10 bg-white dark:bg-cyber-900">
            {/* Back button removed to lock the navigation during trip */}
            <div className="w-10" />
            <div className="text-center">
              <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Live Navigation</h2>
              <p className="text-xs text-cyber-primary font-bold">{bookingDetails?.status || 'Active'}</p>
            </div>
            <div className="w-10" />
          </div>
          <div className="flex-1 relative">
            <LiveMap 
              userLat={userLoc.lat} 
              userLng={userLoc.lng} 
              driverLat={driverLoc.lat} 
              driverLng={driverLoc.lng} 
              destLat={bookingDetails?.destLat}
              destLng={bookingDetails?.destLng}
              tripStatus={bookingDetails?.status}
              onRouteUpdate={({ distance, eta }) => {
                setDistance(distance);
                setEta(eta);
              }}
            />
            
            <div className="absolute bottom-6 left-6 right-6 glass-panel p-4 rounded-xl shadow-lg z-[99] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {bookingDetails?.status === 'Pending_Approval' ? 'Pending Price Approval' :
                     bookingDetails?.status === 'Active' ? 'Heading to Point A (Pickup)' : 
                     bookingDetails?.status === 'Arrived' ? 'Arrived at Point A' : 
                     bookingDetails?.status === 'In Progress' ? `Heading to ${destAddress}` : 
                     'Payment Pending'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {bookingDetails?.status === 'Pending_Approval' ? 'Waiting for customer to approve rate' :
                     bookingDetails?.status === 'Active' ? 'Navigate to pickup location' : 
                     bookingDetails?.status === 'Arrived' ? 'Verify customer car is loaded' : 
                     bookingDetails?.status === 'In Progress' ? 'Towing vehicle to destination' : 
                     'Waiting for customer payment...'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total Price</p>
                  <span className="font-bold text-cyber-primary">{bookingDetails?.price || 0} EGP</span>
                </div>
              </div>

              {/* Synchronized ETA and Distance Display */}
              <div className="grid grid-cols-2 gap-4 text-center py-1">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-gray-105 dark:border-gray-850">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">Remaining Time (ETA)</span>
                  <span className="text-base font-bold text-slate-800 dark:text-white" id="driver-eta-value">{eta || 'Calculating...'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-gray-105 dark:border-gray-850">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">Remaining Distance</span>
                  <span className="text-base font-bold text-slate-800 dark:text-white" id="driver-distance-value">{distance || 'Calculating...'}</span>
                </div>
              </div>
              
              {bookingDetails?.status === 'Pending_Approval' && (
                <div className="text-center py-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl text-sm animate-pulse">
                  ⌛ Waiting for customer to approve the price of {bookingDetails?.price} EGP...
                </div>
              )}

              {bookingDetails?.status === 'Active' && (
                <button 
                  onClick={() => {
                    if (socketRef.current) {
                      socketRef.current.emit('driver_arrived', { bookingId: activeBookingId });
                    }
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition"
                >
                  Arrived at Customer (Point A)
                </button>
              )}

              {bookingDetails?.status === 'Arrived' && (
                <button 
                  onClick={() => {
                    if (socketRef.current) {
                      socketRef.current.emit('pickup_done', { bookingId: activeBookingId });
                    }
                  }}
                  className="w-full py-3 bg-cyber-primary hover:bg-blue-600 text-white font-bold rounded-xl transition animate-pulse"
                >
                  Pickup Done (Towing Started)
                </button>
              )}

              {bookingDetails?.status === 'In Progress' && (
                <button 
                  onClick={() => {
                    if (socketRef.current) {
                      socketRef.current.emit('driver_complete_trip', { bookingId: activeBookingId });
                    }
                  }}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition"
                >
                  Complete Trip (End Trip / إنهاء)
                </button>
              )}

              {bookingDetails?.status === 'Payment_Pending' && (
                <div className="text-center py-2 text-sm font-semibold text-amber-600 animate-pulse">
                  ⌛ Waiting for customer payment to complete booking...
                </div>
              )}
            </div>
          </div>
        </div>
      ) : completedTripEarnings ? (
        // ── EARNINGS SUMMARY OVERLAY ───────────────────────────────────────────
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500 text-3xl mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Trip Completed!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Payment received. Here is your trip earnings summary.</p>

            <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-4 mb-6 space-y-3 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Price</span>
                <span className="font-medium text-slate-900 dark:text-white">{completedTripEarnings.price} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Commission (10%)</span>
                <span className="font-medium text-red-500">-{(completedTripEarnings.price * 0.1).toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode</span>
                <span className="font-medium text-slate-900 dark:text-white">{completedTripEarnings.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-900 dark:text-white">Net Added to Wallet / Cash</span>
                <span className="text-cyber-primary">{(completedTripEarnings.price * 0.9).toFixed(2)} EGP</span>
              </div>
            </div>

            <button
              onClick={() => setCompletedTripEarnings(null)}
              className="w-full py-3 bg-cyber-primary text-white font-bold rounded-xl transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (isOnline && activeRequest) ? (
        // ── FULLSCREEN REQUEST REVIEW SCREEN ──────────────────────────────────────────────
        <div className="flex-1 flex flex-col h-full bg-white relative">
          <div className="p-6 pt-12 flex items-center justify-between shadow-sm z-10 bg-white dark:bg-cyber-900">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Incoming Request</h2>
            <div className="p-2 bg-red-500 text-white text-xs font-bold rounded-lg animate-pulse">{timer}s remaining</div>
          </div>
          <div className="flex-1 relative">
            <LiveMap 
              userLat={activeRequest.pickupLat} 
              userLng={activeRequest.pickupLng} 
              destLat={activeRequest.dropoffLat} 
              destLng={activeRequest.dropoffLng} 
              tripStatus="Reviewing"
              onRouteUpdate={({ distance, eta }) => {
                setDistance(distance);
                setEta(eta);
              }}
            />
            
            <div className="absolute bottom-6 left-6 right-6 glass-panel p-4 rounded-xl shadow-lg z-[99] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md flex flex-col gap-3">
              <div>
                <span className="bg-cyber-primary/25 text-cyber-primary text-xs font-bold px-2 py-0.5 rounded">NEW WINCH TRIP</span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">{activeRequest.car}</h3>
                <p className="text-xs text-gray-500">{activeRequest.issue}</p>
                <div className="flex justify-between items-center text-xs mt-2 text-slate-600 dark:text-gray-300 font-bold">
                  <span>Distance</span>
                  <span className="text-cyber-primary">{activeRequest.distance || 'Nearby'}</span>
                </div>
              </div>

              {/* Price Negotiation adjustment controls */}
              <div className="bg-slate-100 dark:bg-black/30 p-3 rounded-lg flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Trip Fare:</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveRequest({ ...activeRequest, price: Math.max(100, activeRequest.price - 50) })}
                    className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-900 dark:text-white text-lg transition hover:bg-slate-300"
                  >
                    -
                  </button>
                  <span className="font-bold text-cyber-primary text-lg">{activeRequest.price} EGP</span>
                  <button 
                    onClick={() => setActiveRequest({ ...activeRequest, price: activeRequest.price + 50 })}
                    className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-900 dark:text-white text-lg transition hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleDecline} 
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-xl font-bold text-slate-700 dark:text-white hover:bg-red-500 hover:text-white transition"
                >
                  Decline
                </button>
                <button 
                  onClick={() => {
                    if (socketRef.current) {
                      socketRef.current.emit('driver_counter_offer', {
                        customerSocketId: activeRequest.customerSocketId,
                        driverId: socketRef.current.id,
                        price: activeRequest.price
                      });
                      alert(`Counter offer of ${activeRequest.price} EGP sent! Waiting for customer...`);
                      setTimer(30);
                    }
                  }}
                  className="flex-1 bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30 py-3 rounded-xl font-bold hover:bg-cyber-primary/30 transition text-center"
                >
                  Counter Offer
                </button>
                <button 
                  onClick={handleAccept} 
                  className="flex-1 bg-cyber-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition"
                >
                  Accept
                </button>
              </div>
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
                <p className="text-gray-400 text-sm">Welcome back, {safeUser.name}</p>
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
            <div className="text-center py-10 text-gray-500">
              <div className={`mx-auto w-fit mb-2 p-4 rounded-full ${isOnline ? 'bg-green-500/10 text-green-500 animate-pulse' : 'bg-gray-500/10'}`}>
                <Power size={32} />
              </div>
              <p>{isOnline ? 'Searching for requests...' : 'Go online to receive requests'}</p>
            </div>

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

      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-cyber-900 rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Withdraw Funds</h3>
            <p className="text-sm text-gray-500 mb-6">Enter the amount you wish to withdraw</p>

            <div className="relative mb-4">
              <input
                type="number"
                placeholder="Amount..."
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyber-primary text-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">EGP</span>
            </div>

            <button
              onClick={() => withdrawAmount && Number(withdrawAmount) > 0 && handleWithdraw(Number(withdrawAmount))}
              disabled={withdrawLoading || !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > safeUser.walletBalance}
              className="w-full py-4 bg-gradient-to-r from-cyber-primary to-blue-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {withdrawLoading ? 'Processing...' : `Withdraw ${withdrawAmount ? `${withdrawAmount} EGP` : ''}`}
            </button>

            <button
              onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); }}
              className="w-full mt-3 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
