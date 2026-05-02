import React, { useEffect } from 'react';
import { ArrowLeft, MapPin, Truck, Wallet, User, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const WinchDashboard = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { 
      isWinchOnline, setIsWinchOnline, 
      activeWinchRequest, setActiveWinchRequest,
      winchRequestTimer
  } = useAppContext();
  const [showWinchWallet, setShowWinchWallet] = React.useState(false);

  const safeUser = user || { walletBalance: 0, name: 'Driver' } as any;

  const handleWinchAccept = () => {
      if (activeWinchRequest) {
        setUser({...safeUser, walletBalance: safeUser.walletBalance + activeWinchRequest.price});
        alert(`Accepted! Request assigned. +${activeWinchRequest.price} EGP (Pending completion)`);
        setActiveWinchRequest(null);
      }
  };

  const handleWinchDecline = () => {
      setActiveWinchRequest(null);
  };
  
  const handleWinchDriverNegotiate = (newPrice: number) => {
      setActiveWinchRequest((prev: any) => ({...prev, price: newPrice, userCounterOffer: null})); 
      alert(`You proposed ${newPrice} EGP. Waiting for user...`);
      setTimeout(() => {
          handleWinchAccept();
      }, 2000);
  };

  const handleWinchWithdraw = () => {
      if (safeUser.walletBalance > 0) {
          alert(`Withdrawal request for ${safeUser.walletBalance} EGP sent to your bank.`);
          setUser({...safeUser, walletBalance: 0});
      } else {
          alert("Insufficient funds.");
      }
  };

  return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
           {showWinchWallet ? (
               <div className="flex-1 p-6 pt-12 flex flex-col">
                   <button onClick={() => setShowWinchWallet(false)} className="mb-6 w-fit text-slate-900 dark:text-white"><ArrowLeft /></button>
                   <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Wallet</h2>
                   <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-blue-700 text-white mb-6">
                       <p className="text-sm opacity-80">Total Balance</p>
                       <p className="text-4xl font-bold">{safeUser.walletBalance.toLocaleString()} EGP</p>
                   </div>
                   <div className="space-y-4">
                       <h3 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                       <div className="glass-panel p-4 rounded-xl flex justify-between items-center">
                           <div>
                               <p className="font-bold text-slate-900 dark:text-white">Completed Ride</p>
                               <p className="text-xs text-gray-500">Today, 10:23 AM</p>
                           </div>
                           <span className="text-green-500 font-bold">+350 EGP</span>
                       </div>
                   </div>
                   <button onClick={handleWinchWithdraw} className="mt-auto w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Request Withdrawal</button>
               </div>
           ) : (
            <>
           <div className="p-6 pt-12 bg-cyber-900 text-white pb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
               <div className="relative z-10 flex justify-between items-start">
                   <div>
                       <h2 className="text-2xl font-bold font-display">Winch Command</h2>
                       <p className="text-gray-400 text-sm">Welcome back, {safeUser.name}</p>
                   </div>
                   <div onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gray-700 border border-cyber-primary overflow-hidden">
                       <img src="https://picsum.photos/100/100" />
                   </div>
               </div>

               <div className="mt-8 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                       <div onClick={() => setIsWinchOnline(!isWinchOnline)} className={`w-14 h-8 rounded-full relative transition-colors duration-300 cursor-pointer ${isWinchOnline ? 'bg-green-500' : 'bg-gray-600'}`}>
                           <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${isWinchOnline ? 'left-7' : 'left-1'}`}></div>
                       </div>
                       <span className="font-bold">{isWinchOnline ? 'Online' : 'Offline'}</span>
                   </div>
                   <div className="text-right">
                       <p className="text-xs text-gray-400">Today's Earnings</p>
                       <p className="text-xl font-bold text-cyber-primary">{safeUser.walletBalance} EGP</p>
                   </div>
               </div>
           </div>

           <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Active Request Card */}
                {isWinchOnline && activeWinchRequest ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border-l-4 border-cyber-primary animate-pulse relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 bg-red-500 text-white text-[10px] font-bold rounded-bl-lg">
                            {winchRequestTimer}s
                        </div>
                        <div className="flex justify-between items-start mb-2">
                             <span className="bg-cyber-primary/20 text-cyber-primary text-xs font-bold px-2 py-1 rounded">NEW REQUEST</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{activeWinchRequest.car}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1"><MapPin size={14}/> {activeWinchRequest.distance} away • {activeWinchRequest.issue}</p>
                        
                        {/* Driver Negotiation Controls */}
                        <div className="bg-slate-100 dark:bg-black/20 p-3 rounded-lg mb-4">
                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Offer: {activeWinchRequest.price} EGP</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleWinchDriverNegotiate(activeWinchRequest.price + 50)} className="flex-1 py-2 text-xs bg-cyber-primary/20 text-cyber-primary rounded hover:bg-cyber-primary/30 border border-cyber-primary/30">Counter +50</button>
                                <button onClick={() => handleWinchDriverNegotiate(activeWinchRequest.price - 20)} className="flex-1 py-2 text-xs bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 border border-red-500/30">Counter -20</button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                             <button onClick={handleWinchDecline} className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-lg font-bold text-slate-700 dark:text-white hover:bg-red-500 hover:text-white transition">Decline</button>
                             <button onClick={handleWinchAccept} className="flex-1 bg-cyber-primary text-white py-2 rounded-lg font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition">Accept</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <div className={`mx-auto w-fit mb-2 p-4 rounded-full ${isWinchOnline ? 'bg-green-500/10 text-green-500 animate-pulse' : 'bg-gray-500/10'}`}>
                             <Power size={32} />
                        </div>
                        <p>{isWinchOnline ? 'Searching for requests...' : 'Go online to receive requests'}</p>
                    </div>
                )}

                <div className="glass-panel p-4 rounded-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Wallet</h3>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500 text-sm">Available Balance</span>
                        <span className="font-bold text-xl text-slate-900 dark:text-white">{safeUser.walletBalance} EGP</span>
                    </div>
                    <button onClick={() => setShowWinchWallet(true)} className="w-full py-3 border border-cyber-primary text-cyber-primary rounded-lg font-bold hover:bg-cyber-primary hover:text-white transition">View Details</button>
                </div>
           </div>
           
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
