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
  const { user, refreshUser } = useAuth();
  const [location, setLocation] = useState<{
    userLat?: number;
    userLng?: number;
    driverLat?: number;
    driverLng?: number;
    destLat?: number;
    destLng?: number;
    status: string;
    distance?: string;
    eta?: string;
    price?: number;
    driverName?: string;
    vehicle?: string;
  }>({ status: 'Locating...' });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET' | 'CARD' | null>(null);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const isDriver = user?.role === UserRole.WINCH_DRIVER;

  // Fetch initial booking details
  useEffect(() => {
    fetch(`${API_URL}/api/winch/location/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data && !data.error) {
        setLocation(prev => ({
          ...prev,
          userLat: data.userLat ?? prev.userLat,
          userLng: data.userLng ?? prev.userLng,
          driverLat: data.driverLat ?? prev.driverLat,
          driverLng: data.driverLng ?? prev.driverLng,
          destLat: data.destLat,
          destLng: data.destLng,
          status: data.status,
          price: data.price,
          driverName: data.driverName,
          vehicle: data.vehicle,
        }));
        if (data.status === 'Payment_Pending') {
          setShowPaymentModal(true);
        }
      }
    })
    .catch(err => console.error('Error fetching booking details:', err));
  }, [bookingId]);

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
                userLng: longitude
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
      setLocation(prev => {
        const { status, ...rest } = data;
        return { ...prev, ...rest };
      });
    });

    socket.on('booking_status', (data: { bookingId: string; status: string; price?: number }) => {
      setLocation(prev => ({ ...prev, status: data.status }));
      if (data.status === 'Payment_Pending') {
        setShowPaymentModal(true);
      }
    });

    socket.on('booking_cancelled', () => {
      alert('This booking has been cancelled.');
      onBack();
    });

    socket.on('booking_completed', (data: { paymentMethod: string }) => {
      setPaymentMethod(data.paymentMethod as any);
      setShowPaymentModal(false);
      setShowReceipt(true);
      refreshUser();
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
      socketRef.current.emit('driver_complete_trip', { bookingId });
    }
  };

  const handleCancelTrip = () => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      if (socketRef.current) {
        socketRef.current.emit('cancel_booking', { bookingId });
      }
    }
  };

  const handleConfirmPayment = () => {
    if (!paymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    if (paymentMethod === 'WALLET' && user && user.walletBalance < (location.price || 0)) {
      alert('Insufficient wallet balance. Please top up or select another method.');
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit('pay_booking', {
        bookingId,
        paymentMethod
      });
    }
  };

  const isActive = location.status !== 'Completed' && location.status !== 'Cancelled' && location.status !== 'Payment_Pending' && location.status !== 'Locating...';

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      <div className="p-6 pt-12 flex items-center justify-between shadow-sm z-10 bg-white dark:bg-cyber-900">
        {!isActive ? (
          <button aria-label="Back" onClick={onBack} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-10"></div>
        )}
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
          destLat={location.destLat}
          destLng={location.destLng}
          tripStatus={location.status}
        />
        
        {/* Info overlay based on role */}
        <div className="absolute bottom-6 left-6 right-6 glass-panel p-4 rounded-xl shadow-lg z-[99] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
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
            <div className="flex flex-col gap-2 w-full">
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
              {isActive && location.status !== 'In Progress' && (
                <button
                  onClick={handleCancelTrip}
                  className="w-full mt-2 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Overlay Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">Trip Invoice</h3>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">Your winch driver has arrived at the destination. Please select a payment option to complete the journey.</p>
            
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500 dark:text-slate-400">Driver</span>
                <span className="font-bold text-slate-900 dark:text-white">{location.driverName || 'Winch Driver'}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500 dark:text-slate-400">Vehicle</span>
                <span className="text-slate-900 dark:text-white font-medium">{location.vehicle || 'Flatbed'}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">Amount Due</span>
                <span className="font-bold text-xl text-cyber-primary">{location.price || 0} EGP</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'CASH' ? 'border-cyber-primary bg-cyber-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="payment_method" value="CASH" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} className="text-cyber-primary focus:ring-cyber-primary" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Cash payment</p>
                    <p className="text-xs text-slate-500">Pay the driver directly in cash</p>
                  </div>
                </div>
                <span className="text-lg">💵</span>
              </label>

              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'WALLET' ? 'border-cyber-primary bg-cyber-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'} ${user && user.walletBalance < (location.price || 0) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="payment_method" value="WALLET" checked={paymentMethod === 'WALLET'} disabled={!user || user.walletBalance < (location.price || 0)} onChange={() => setPaymentMethod('WALLET')} className="text-cyber-primary focus:ring-cyber-primary" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Digital Wallet</p>
                    <p className="text-xs text-slate-500">Balance: {user?.walletBalance || 0} EGP</p>
                  </div>
                </div>
                <span className="text-lg">💼</span>
              </label>

              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'CARD' ? 'border-cyber-primary bg-cyber-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="payment_method" value="CARD" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} className="text-cyber-primary focus:ring-cyber-primary" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Credit Card</p>
                    <p className="text-xs text-slate-500">Simulate online card charge</p>
                  </div>
                </div>
                <span className="text-lg">💳</span>
              </label>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-cyber-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyber-primary/20 flex items-center justify-center gap-2"
            >
              Confirm and Pay
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500 text-3xl mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tow Completed</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Thank you for using Auto-Care AI. Here is your receipt summary.</p>

            <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-4 mb-6 space-y-3 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Driver</span>
                <span className="font-medium text-slate-900 dark:text-white">{location.driverName || 'Winch Driver'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-medium text-slate-900 dark:text-white">{location.vehicle || 'Flatbed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode</span>
                <span className="font-medium text-slate-900 dark:text-white">{paymentMethod}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-900 dark:text-white">Total Paid</span>
                <span className="text-cyber-primary">{location.price || 0} EGP</span>
              </div>
            </div>

            <button
              onClick={onBack}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
