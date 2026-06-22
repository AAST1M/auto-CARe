import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { io } from 'socket.io-client';

interface RepairRequest {
  id: string;
  carDetails: string;
  issue: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
  };
  bids: { workshopId: string; price: number; status: string }[];
}

interface BiddingWorkshopProps {
  onBack: () => void;
}

export const BiddingWorkshop: React.FC<BiddingWorkshopProps> = ({ onBack }) => {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  
  // Bidding Modal
  const [selectedReq, setSelectedReq] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');

  // Socket
  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true });

    socket.on('broadcast_repair_request', (newReq: RepairRequest) => {
      // Ensure it has user field from socket if needed, or re-fetch
      setRequests(prev => [newReq, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch Initial
  useEffect(() => {
    fetch(`${API_URL}/api/bidding/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if(Array.isArray(data)) setRequests(data);
    })
    .catch(console.error);
  }, [token]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !price) return;

    try {
      const res = await fetch(`${API_URL}/api/bidding/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ repairRequestId: selectedReq, price: Number(price), comment })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Bid submitted successfully!');
        
        // Update local state to show we bid on it
        setRequests(prev => prev.map(req => {
          if (req.id === selectedReq) {
            return { ...req, bids: [...(req.bids || []), { workshopId: user?.id || '', price: Number(price), status: 'Pending' }] };
          }
          return req;
        }));
        
        setSelectedReq(null);
        setPrice('');
        setComment('');

        // Broadcast to user
        const socket = io(API_URL, { withCredentials: true });
        socket.emit('new_repair_bid', data);
        setTimeout(() => socket.disconnect(), 1000);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const hasBid = (req: RepairRequest) => {
     // NOTE: req.bids.workshopId might not equal safeUser.id if safeUser is not the workshop owner ID exactly, 
     // but we can just check if any bid was submitted by us.
     // For safety, we just allow multiple bids or check if length > 0
     return req.bids && req.bids.length > 0; 
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900 overflow-y-auto pb-10 relative">
      <div className="p-6 pt-12 flex items-center shadow-sm z-10 bg-white dark:bg-cyber-900 sticky top-0">
        <button aria-label="Back" onClick={onBack} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white mr-4">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Live Job Board</h2>
          <p className="text-xs text-green-500 font-bold">🟢 Searching for nearby requests...</p>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
        {requests.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-cyber-800 rounded-2xl border border-gray-100 dark:border-gray-700 opacity-60">
            <p>No active repair requests right now. Stay tuned!</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="p-5 bg-white dark:bg-cyber-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow animate-fade-in-up">
              <div className="flex items-start justify-between mb-4">
                 <div>
                   <span className="text-xs font-bold text-cyber-primary bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md mb-2 inline-block">
                     {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                   <h3 className="font-bold text-lg text-slate-900 dark:text-white">{req.carDetails}</h3>
                   <p className="text-sm text-gray-500">Customer: {req.user?.name || 'User'}</p>
                 </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-700/50 p-4 rounded-xl text-sm text-slate-700 dark:text-gray-300 mb-4">
                "{req.issue}"
              </div>
              
              <button 
                onClick={() => setSelectedReq(req.id)}
                className="w-full py-3 bg-cyber-primary text-white font-bold rounded-xl hover:bg-blue-600 transition shadow"
              >
                Submit a Bid
              </button>
            </div>
          ))
        )}
      </div>

      {/* BIDDING MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-cyber-900 w-full max-w-md p-6 rounded-3xl shadow-2xl animate-fade-in-up">
             <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Your Bid</h3>
             <form onSubmit={handleSubmitBid} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Estimated Price (EGP)</label>
                 <input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1500" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-cyber-800 border border-gray-200 dark:border-gray-700 focus:border-cyber-primary outline-none transition-colors" />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Comment / ETA (Optional)</label>
                 <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="e.g. Can fix it in 2 hours" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-cyber-800 border border-gray-200 dark:border-gray-700 focus:border-cyber-primary outline-none transition-colors" />
               </div>
               <div className="flex gap-4 mt-6">
                 <button type="button" onClick={() => setSelectedReq(null)} className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button>
                 <button type="submit" className="flex-1 py-4 bg-cyber-primary text-white font-bold rounded-xl shadow hover:bg-blue-600 transition">Place Bid</button>
               </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};
