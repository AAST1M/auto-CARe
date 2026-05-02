import React, { useEffect } from 'react';
import { ArrowLeft, CheckCircle, Activity, Calendar, Wallet, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const WorkshopDashboard = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { workshopAppointments, setWorkshopAppointments, carsInWorkshop, setCarsInWorkshop } = useAppContext();
  const [showWorkshopWallet, setShowWorkshopWallet] = React.useState(false);

  // Fallback
  const safeUser = user || { walletBalance: 0, shopName: 'My Workshop' } as any;

  useEffect(() => {
    // Fetch workshops and appointments from backend
    // fetch('http://localhost:5001/api/workshops')...
  }, []);

  const handleWorkshopAction = (id: string, action: string) => {
      setWorkshopAppointments(prev => prev.map(appt => {
          if (appt.id !== id) return appt;
          if (action === 'Check-In') {
              setUser({...safeUser, walletBalance: safeUser.walletBalance + appt.price});
              setCarsInWorkshop(prevCars => [...prevCars, { id: Date.now().toString(), model: appt.carDetails, plate: 'NEW 123', status: 'Diagnostics', progress: 0 }]);
              return { ...appt, status: 'Checked-In' as const };
          }
          if (action === 'Reschedule') { alert(`Rescheduling request sent for ${appt.customerName}`); return appt; }
          if (action === 'Accept') { return { ...appt, status: 'Confirmed' as const }; }
          if (action === 'Decline') { return { ...appt, status: 'Cancelled' as const }; }
          return appt;
      }));
  };

  const updateCarStatus = (id: string) => {
      setCarsInWorkshop(prev => prev.map(car => {
          if (car.id === id) {
              const newProgress = Math.min(100, car.progress + 25);
              let status = car.status;
              if (newProgress >= 25) status = 'Repairing';
              if (newProgress >= 75) status = 'Quality Check';
              if (newProgress >= 100) status = 'Ready';
              return { ...car, progress: newProgress, status };
          }
          return car;
      }));
  };

  const handleWorkshopWithdraw = () => {
      if (safeUser.walletBalance > 0) {
          alert(`Withdrawal request for ${safeUser.walletBalance} EGP sent to bank.`);
          setUser({...safeUser, walletBalance: 0});
      }
  };

  return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
          {showWorkshopWallet ? (
             <div className="flex-1 p-6 pt-12 flex flex-col">
                   <button onClick={() => setShowWorkshopWallet(false)} className="mb-6 w-fit text-slate-900 dark:text-white"><ArrowLeft /></button>
                   <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Shop Wallet</h2>
                   <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-blue-700 text-white mb-6">
                       <p className="text-sm opacity-80">Total Revenue</p>
                       <p className="text-4xl font-bold">{safeUser.walletBalance.toLocaleString()} EGP</p>
                   </div>
                   <button onClick={handleWorkshopWithdraw} className="mt-auto w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Withdraw Funds</button>
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
                       <img src="https://picsum.photos/100/100" />
                   </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                       <p className="text-xs text-gray-300">Active Bookings</p>
                       <p className="text-2xl font-bold">{workshopAppointments.filter(a => a.status !== 'Cancelled').length}</p>
                   </div>
                   <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                       <p className="text-xs text-gray-300">Cars in Shop</p>
                       <p className="text-2xl font-bold">{carsInWorkshop.length}</p>
                   </div>
               </div>
           </div>

           <div className="flex-1 p-6 space-y-6 overflow-y-auto">
               
               {/* Live Tracker */}
               <div>
                   <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Activity size={18} className="text-cyber-primary"/> Live Car Tracker</h3>
                   <div className="space-y-3">
                       {carsInWorkshop.map(car => (
                           <div key={car.id} className="glass-panel p-4 rounded-xl">
                               <div className="flex justify-between items-center mb-2">
                                   <span className="font-bold text-sm text-slate-900 dark:text-white">{car.model}</span>
                                   <span className="text-xs text-gray-500">{car.plate}</span>
                               </div>
                               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                   <div className="bg-cyber-primary h-2 rounded-full transition-all duration-500" style={{width: `${car.progress}%`}}></div>
                               </div>
                               <div className="flex justify-between items-center">
                                   <span className="text-xs font-bold text-cyber-primary">{car.status}</span>
                                   <button onClick={() => updateCarStatus(car.id)} className="text-xs bg-slate-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-cyber-primary hover:text-white transition">Update Status</button>
                               </div>
                           </div>
                       ))}
                       {carsInWorkshop.length === 0 && <p className="text-gray-500 text-sm">No cars currently being serviced.</p>}
                   </div>
               </div>

               <div>
                   <h3 className="font-bold text-slate-900 dark:text-white mb-3">Incoming Appointments</h3>
                   {workshopAppointments.map(appt => (
                       <div key={appt.id} className={`glass-panel p-4 rounded-xl border-l-4 mb-3 ${appt.status === 'Confirmed' ? 'border-yellow-500' : appt.status === 'Checked-In' ? 'border-green-500' : 'border-gray-500'}`}>
                           <div className="flex justify-between mb-2">
                               <span className="font-bold text-slate-900 dark:text-white">{appt.customerName}</span>
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
           
            <div className="p-4 glass-panel flex justify-around items-center">
                <button className="text-cyber-primary flex flex-col items-center"><Calendar size={24}/><span className="text-[10px]">Bookings</span></button>
                <button className="text-gray-400 flex flex-col items-center" onClick={() => setShowWorkshopWallet(true)}><Wallet size={24}/><span className="text-[10px]">Wallet</span></button>
                <button className="text-gray-400 flex flex-col items-center" onClick={() => navigate('/profile')}><User size={24}/><span className="text-[10px]">Profile</span></button>
           </div>
           </>
          )}
      </div>
  );
};
