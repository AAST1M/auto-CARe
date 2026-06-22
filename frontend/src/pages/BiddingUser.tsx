import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { io } from 'socket.io-client';

interface Bid {
  id: string;
  price: number;
  comment: string;
  status: string;
  workshopId: string;
  workshop: {
    name: string;
    rating: number;
    image?: string;
  };
}

interface RepairRequest {
  id: string;
  carDetails: string;
  issue: string;
  status: string;
  bids: Bid[];
}

interface BiddingUserProps {
  onBack: () => void;
}

export const BiddingUser: React.FC<BiddingUserProps> = ({ onBack }) => {
  const { token, user } = useAuth();
  const [activeRequest, setActiveRequest] = useState<RepairRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  
  // Form State
  const [carDetails, setCarDetails] = useState('');
  const [issue, setIssue] = useState('');

  // Socket
  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true });

    // Listen for new bids on our active request
    if (activeRequest) {
      socket.on(`new_bid_${activeRequest.id}`, (newBid: Bid) => {
        setBids(prev => {
          // Prevent duplicates
          if (prev.find(b => b.id === newBid.id)) return prev;
          return [...prev, newBid];
        });
      });
      
      socket.on(`bid_accepted_${activeRequest.id}`, () => {
         // Could show a success animation here
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [activeRequest]);

  // Load existing request (if any)
  useEffect(() => {
    fetch(`${API_URL}/api/bidding/my-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const openReq = data.find((req: RepairRequest) => req.status === 'Open');
      if (openReq) {
        setActiveRequest(openReq);
        setBids(openReq.bids || []);
      }
    })
    .catch(console.error);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/bidding/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ carDetails, issue })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRequest(data);
        setBids([]);
        const socket = io(API_URL, { withCredentials: true });
        socket.emit('new_repair_request', data);
        setTimeout(() => socket.disconnect(), 1000);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/bidding/accept-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bidId })
      });
      if (res.ok) {
        alert('Bid accepted! An appointment has been created.');
        setActiveRequest(null);
        
        const socket = io(API_URL, { withCredentials: true });
        socket.emit('bid_accepted', { repairRequestId: activeRequest!.id, bidId });
        setTimeout(() => socket.disconnect(), 1000);
        onBack();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900 overflow-y-auto pb-10">
      <div className="p-6 pt-12 flex items-center shadow-sm z-10 bg-white dark:bg-cyber-900 sticky top-0">
        <button aria-label="Back" onClick={onBack} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white mr-4">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Live Bidding Marketplace</h2>
      </div>

      <div className="p-6 max-w-lg mx-auto w-full">
        {!activeRequest ? (
          <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-cyber-800 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Post a Repair Request</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Describe your issue and watch mechanics bid for your job in real-time!</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Car Model & Year</label>
                <input required type="text" value={carDetails} onChange={e => setCarDetails(e.target.value)} placeholder="e.g. 2018 Toyota Corolla" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-cyber-900 border border-gray-200 dark:border-gray-700 focus:border-cyber-primary outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Describe the Issue</label>
                <textarea required rows={4} value={issue} onChange={e => setIssue(e.target.value)} placeholder="e.g. Grinding noise when braking..." className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-cyber-900 border border-gray-200 dark:border-gray-700 focus:border-cyber-primary outline-none transition-colors"></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-cyber-primary text-white font-bold rounded-xl shadow hover:bg-blue-600 transition-colors">Broadcast to Mechanics</button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
               <h3 className="font-bold text-xl mb-1">Your Request is Live! 🟢</h3>
               <p className="opacity-90 text-sm">Mechanics are reviewing your request.</p>
               <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <p className="font-semibold text-sm">{activeRequest.carDetails}</p>
                  <p className="text-xs opacity-80 mt-1">{activeRequest.issue}</p>
               </div>
            </div>

            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-primary"></span>
              </span>
              Live Bids ({bids.length})
            </h3>

            {bids.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-cyber-800 rounded-2xl border border-gray-100 dark:border-gray-700 opacity-60">
                <p>Waiting for the first bid...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bids.map(bid => (
                  <div key={bid.id} className="p-5 bg-white dark:bg-cyber-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow flex flex-col gap-4 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl overflow-hidden">
                            {bid.workshop?.image ? <img src={bid.workshop.image} alt="ws" className="w-full h-full object-cover" /> : '🔧'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{bid.workshop?.name || 'Workshop'}</p>
                            <p className="text-xs text-yellow-500 font-bold">⭐ {bid.workshop?.rating || 5.0}</p>
                          </div>
                       </div>
                       <div className="text-right">
                         <p className="text-2xl font-bold text-cyber-primary">{bid.price} <span className="text-sm">EGP</span></p>
                       </div>
                    </div>
                    {bid.comment && (
                      <div className="bg-slate-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                        "{bid.comment}"
                      </div>
                    )}
                    <button onClick={() => handleAcceptBid(bid.id)} className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition shadow">
                      Accept this Bid
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
