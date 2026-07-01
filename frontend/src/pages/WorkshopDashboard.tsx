import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Activity, Calendar, Wallet, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { GoogleMap, Marker as GMarker, useJsApiLoader } from '@react-google-maps/api';
import { FileText, MapPin } from 'lucide-react';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
const GMAP_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

export const WorkshopDashboard = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [showWorkshopWallet, setShowWorkshopWallet] = React.useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);
  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [withdrawLoading, setWithdrawLoading] = React.useState(false);
  const [showWorkshopProfile, setShowWorkshopProfile] = useState(false);
  const [myWorkshop, setMyWorkshop] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: GMAP_LIBRARIES,
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    address: '',
    latitude: 30.0444,
    longitude: 31.2357,
    image: ''
  });

  useEffect(() => {
    if (myWorkshop) {
      setProfileForm({
        name: myWorkshop.name || '',
        description: myWorkshop.description || '',
        address: myWorkshop.address || '',
        latitude: myWorkshop.latitude || 30.0444,
        longitude: myWorkshop.longitude || 31.2357,
        image: myWorkshop.image || ''
      });
    }
  }, [myWorkshop]);

  const fetchMyWorkshop = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/workshops/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
            setMyWorkshop(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!myWorkshop) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/workshops/${myWorkshop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        alert('Profile updated successfully!');
        fetchMyWorkshop();
        setShowWorkshopProfile(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fallback
  const safeUser = user || { walletBalance: 0, shopName: 'My Workshop' } as any;

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/workshops/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchMyWorkshop();
  }, []);

  const handleWorkshopAction = async (id: string, action: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let newStatus = '';
    if (action === 'Check-In') newStatus = 'Checked-In';
    else if (action === 'Accept') newStatus = 'Confirmed';
    else if (action === 'Decline') newStatus = 'Cancelled';
    else if (action === 'Complete') newStatus = 'Completed';
    else if (action === 'Reschedule') {
      alert(`Rescheduling request sent.`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/workshops/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Update failed');

      if (action === 'Check-In') {
        const appt = appointments.find(a => a.id === id);
        refreshUser();
      }

      // Refresh appointments list
      await fetchAppointments();
    } catch (err) {
      alert('Could not update status. Please try again.');
    }
  };

  const updateCarStatus = async (id: string, currentProgress: number) => {
    try {
      const newProgress = Math.min(100, currentProgress + 25);
      const res = await fetch(`${API_URL}/api/workshops/appointments/${id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ progress: newProgress })
      });
      if (res.ok) {
        await fetchAppointments();
      } else {
        throw new Error('Failed to update progress');
      }
    } catch (err) {
      alert('Could not update status. Please try again.');
    }
  };

  const handleWorkshopWithdraw = async (amount: number) => {
    if (!amount || amount <= 0 || amount > safeUser.walletBalance) {
      alert('Invalid withdrawal amount. Make sure it is greater than 0 and does not exceed your balance.');
      return;
    }
    setWithdrawLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
      
      alert(data.message || `Withdrawal request for ${amount} EGP submitted.`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Error processing withdrawal');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const activeCars = appointments.filter(a => ['Checked-In', 'Repairing', 'Quality Check', 'Ready'].includes(a.status));

  return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
          {showWorkshopProfile ? (
              <div className="flex-1 p-6 pt-12 flex flex-col overflow-y-auto">
                   <button aria-label="Back" onClick={() => setShowWorkshopProfile(false)} className="mb-6 w-fit text-slate-900 dark:text-white"><ArrowLeft /></button>
                   <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Workshop Profile</h2>
                   
                   <div className="space-y-4">
                     <div>
                       <label htmlFor="workshop-name" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Workshop Name</label>
                       <input id="workshop-name" placeholder="Workshop Name" type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-white dark:bg-black/40 p-4 rounded-xl outline-none text-slate-900 dark:text-white border border-gray-200 dark:border-gray-800" />
                     </div>
                     <div>
                       <label htmlFor="workshop-desc" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Description</label>
                       <textarea id="workshop-desc" placeholder="Workshop Description" value={profileForm.description} onChange={e => setProfileForm({...profileForm, description: e.target.value})} className="w-full bg-white dark:bg-black/40 p-4 rounded-xl outline-none text-slate-900 dark:text-white border border-gray-200 dark:border-gray-800 h-24" />
                     </div>
                     <div>
                       <label htmlFor="workshop-address" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Address</label>
                       <input id="workshop-address" placeholder="Workshop Address" type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full bg-white dark:bg-black/40 p-4 rounded-xl outline-none text-slate-900 dark:text-white border border-gray-200 dark:border-gray-800" />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Pin Location on Map</label>
                       {isMapLoaded ? (
                         <div className="h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 relative">
                           <GoogleMap
                             mapContainerStyle={{ width: '100%', height: '100%' }}
                             center={{ lat: profileForm.latitude, lng: profileForm.longitude }}
                             zoom={14}
                             onClick={(e) => {
                               if (e.latLng) {
                                 setProfileForm({ ...profileForm, latitude: e.latLng.lat(), longitude: e.latLng.lng() });
                               }
                             }}
                             options={{ disableDefaultUI: true }}
                           >
                             <GMarker position={{ lat: profileForm.latitude, lng: profileForm.longitude }} />
                           </GoogleMap>
                           <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs p-2 rounded text-center backdrop-blur-md">
                             Tap map to set location
                           </div>
                         </div>
                       ) : (
                         <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center animate-pulse">Loading map...</div>
                       )}
                     </div>
                     
                     <div>
                       <label htmlFor="workshop-image" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Cover Photo URL / Base64</label>
                       <input id="workshop-image" type="text" value={profileForm.image} onChange={e => setProfileForm({...profileForm, image: e.target.value})} placeholder="https://..." className="w-full bg-white dark:bg-black/40 p-4 rounded-xl outline-none text-slate-900 dark:text-white border border-gray-200 dark:border-gray-800 mb-2" />
                       {profileForm.image && <img src={profileForm.image} alt="Preview" className="w-full h-32 object-cover rounded-xl" />}
                     </div>

                   </div>

                   <button onClick={handleUpdateProfile} className="mt-8 mb-8 w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Save Profile</button>
              </div>
          ) : showWorkshopWallet ? (
             <div className="flex-1 p-6 pt-12 flex flex-col">
                   <button aria-label="Back" onClick={() => setShowWorkshopWallet(false)} className="mb-6 w-fit text-slate-900 dark:text-white"><ArrowLeft /></button>
                   <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Shop Wallet</h2>
                   <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-blue-700 text-white mb-6">
                       <p className="text-sm opacity-80">Total Revenue</p>
                       <p className="text-4xl font-bold">{safeUser.walletBalance.toLocaleString()} EGP</p>
                   </div>
                   <button onClick={() => setShowWithdrawModal(true)} className="mt-auto w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Withdraw Funds</button>
               </div>
          ) : (
          <>
          <div className="p-6 pt-12 bg-gradient-to-r from-gray-900 to-cyber-900 text-white pb-8 rounded-b-3xl shadow-lg">
               <div className="flex justify-between items-center mb-6">
                   <div>
                       <h2 className="text-2xl font-bold font-display">{safeUser.shopName || 'My Workshop'}</h2>
                       <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12}/> Verified Partner</p>
                   </div>
                   <div onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gray-700 border border-cyber-primary overflow-hidden">
                       <img src="https://picsum.photos/100/100" alt="User Profile" />
                   </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                       <p className="text-xs text-gray-300">Active Bookings</p>
                       <p className="text-2xl font-bold">{appointments.filter(a => a.status !== 'Cancelled').length}</p>
                   </div>
                   <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                       <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">Cars in Shop</h3>
                       <p className="text-2xl font-bold">{activeCars.length}</p>
                   </div>
               </div>
           </div>

           <div className="flex-1 p-6 space-y-6 overflow-y-auto">
               
               {/* Live Tracker */}
               <div>
                   <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Activity size={18} className="text-cyber-primary"/> Live Car Tracker</h3>
                   <div className="space-y-3">
                       {activeCars.map(car => (
                         <div key={car.id} className="glass-panel p-4 rounded-xl">
                           <div className="flex justify-between items-center mb-2">
                             <span className="font-bold text-slate-900 dark:text-white">{car.carDetails || 'Unknown Car'}</span>
                             <span className="text-xs text-gray-500">{car.user?.name || 'Unknown User'}</span>
                           </div>
                           <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                              <style>{`
                                #progress-bar-dash-${car.id} {
                                  width: ${car.progress || 0}%;
                                }
                              `}</style>
                              <div id={`progress-bar-dash-${car.id}`} className="bg-cyber-primary h-2 rounded-full transition-all duration-500" />
                            </div>
                           <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-cyber-primary">{car.status}</span>
                             {car.status !== 'Completed' && (
                               <button 
                                 onClick={() => {
                                   if (car.progress >= 100 || car.status === 'Ready') {
                                     handleWorkshopAction(car.id, 'Complete');
                                   } else {
                                     updateCarStatus(car.id, car.progress || 0);
                                   }
                                 }} 
                                 className="text-xs bg-slate-200 dark:bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-cyber-primary hover:text-white transition font-bold"
                               >
                                 {car.progress < 25 ? 'Start Repair' : 
                                  car.progress < 75 ? 'Start Quality Check' : 
                                  car.progress < 100 ? 'Mark Ready' : 'Mark Claimed (Done)'}
                               </button>
                             )}
                           </div>
                         </div>
                       ))}
                       {activeCars.length === 0 && <p className="text-gray-500 text-sm">No cars currently being serviced.</p>}
                   </div>
               </div>

               <div>
                   <h3 className="font-bold text-slate-900 dark:text-white mb-3">Incoming Appointments</h3>
                   {loading && <p className="text-gray-500 text-sm">Loading appointments...</p>}
                   {!loading && appointments.length === 0 && <p className="text-gray-500 text-sm">No appointments yet.</p>}
                   {appointments.map(appt => (
                       <div key={appt.id} className={`glass-panel p-4 rounded-xl border-l-4 mb-3 ${appt.status === 'Confirmed' ? 'border-yellow-500' : appt.status === 'Checked-In' ? 'border-green-500' : 'border-gray-500'}`}>
                           <div className="flex justify-between mb-2">
                               <span className="font-bold text-slate-900 dark:text-white">{appt.user?.name || appt.user?.email || 'Customer'}</span>
                               <span className="text-xs text-gray-500">{appt.time}</span>
                           </div>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{appt.carDetails} • {appt.serviceType}</p>
                           <p className="text-xs font-bold mb-3 text-cyber-primary">Status: {appt.status}</p>
                           
                           {appt.status === 'Pending' && (
                               <div className="flex gap-2">
                                    <button onClick={() => handleWorkshopAction(appt.id, 'Accept')} className="flex-1 bg-cyber-primary text-white text-xs py-2 rounded-lg font-bold">Accept</button>
                                    <button onClick={() => handleWorkshopAction(appt.id, 'Decline')} className="flex-1 bg-red-500/20 text-red-500 text-xs py-2 rounded-lg font-bold">Decline</button>
                               </div>
                           )}
                           {appt.status === 'Confirmed' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleWorkshopAction(appt.id, 'Check-In')} className="flex-1 bg-green-500 text-white text-xs py-2 rounded-lg font-bold">Check In</button>
                                    <button onClick={() => handleWorkshopAction(appt.id, 'Reschedule')} className="flex-1 bg-gray-200 dark:bg-gray-700 text-slate-700 dark:text-white text-xs py-2 rounded-lg font-bold">Reschedule</button>
                                </div>
                           )}
                       </div>
                   ))}
               </div>
               
               <div className="glass-panel p-4 rounded-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Shop Wallet</h3>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500 text-sm">Available</span>
                        <span className="font-bold text-xl text-slate-900 dark:text-white">{safeUser.walletBalance} EGP</span>
                    </div>
                    <button onClick={() => setShowWorkshopWallet(true)} className="w-full py-3 border border-cyber-primary text-cyber-primary rounded-lg font-bold hover:bg-cyber-primary hover:text-white transition">View Wallet</button>
                </div>
           </div>
           
            <div className="p-4 glass-panel flex justify-around items-center shrink-0">
                <button className="text-cyber-primary flex flex-col items-center"><Calendar size={24}/><span className="text-[10px]">Bookings</span></button>
                <button className="text-gray-400 flex flex-col items-center" onClick={() => setShowWorkshopWallet(true)}><Wallet size={24}/><span className="text-[10px]">Wallet</span></button>
                <button className="text-gray-400 flex flex-col items-center" onClick={() => { setShowWorkshopProfile(true); setShowWorkshopWallet(false); }}><MapPin size={24}/><span className="text-[10px]">Profile</span></button>
                <button className="text-gray-400 flex flex-col items-center" onClick={() => navigate('/profile')}><User size={24}/><span className="text-[10px]">Account</span></button>
           </div>
           </>
          )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-cyber-900 rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Withdraw Funds</h2>
               <p className="text-sm text-gray-500 mb-6">Enter the amount you would like to withdraw to your bank account.</p>
               
               <div className="bg-slate-50 dark:bg-gray-700 p-4 rounded-xl flex justify-between items-center mb-6">
                 <div>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
                   <p className="font-bold text-lg text-slate-900 dark:text-white">{safeUser.walletBalance.toFixed(2)} EGP</p>
                 </div>
               </div>

               <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Amount (EGP)</label>
                 <input 
                   type="number" 
                   value={withdrawAmount}
                   onChange={(e) => setWithdrawAmount(e.target.value)}
                   className="w-full p-3 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl outline-none focus:border-cyber-primary"
                   placeholder="Enter amount"
                   min="1"
                   max={safeUser.walletBalance}
                 />
               </div>

               <button 
                 onClick={() => handleWorkshopWithdraw(Number(withdrawAmount))}
                 disabled={withdrawLoading || safeUser.walletBalance <= 0 || !withdrawAmount}
                 className="w-full bg-cyber-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-cyber-primary/30 hover:shadow-cyber-primary/50 transition-all disabled:opacity-50 flex justify-center items-center"
               >
                 {withdrawLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : 'Confirm Withdrawal'}
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
