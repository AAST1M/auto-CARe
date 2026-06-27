import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, ShoppingCart, Tag, Package, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';
import { SparePart, View } from '../types';
import { useAuth } from '../context/AuthContext';

interface SparePartsProps {
  onBack: () => void;
  onNavigate?: (view: View) => void;
}

const CATEGORIES = ['All', 'Engine', 'Brakes', 'Tires', 'Batteries', 'Accessories', 'Oil', 'Body'];

export const SpareParts: React.FC<SparePartsProps> = ({ onBack }) => {
  const { user, refreshUser } = useAuth();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchParts(true);
  }, [category, search]);

  const fetchParts = async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setNextCursor(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const query = new URLSearchParams();
      if (category !== 'All') query.append('category', category);
      if (search) query.append('search', search);
      query.append('take', '6'); // load 6 parts at a time for demonstration
      
      const currentCursor = reset ? null : nextCursor;
      if (currentCursor) query.append('cursor', currentCursor);

      const res = await fetch(`${API_URL}/api/parts?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        
        if (data.length === 6) {
          setNextCursor(data[data.length - 1].id);
        } else {
          setNextCursor(null); // No more pages
        }

        if (reset) {
          setParts(data);
        } else {
          setParts(prev => [...prev, ...data]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch parts', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleOrder = async () => {
    if (!selectedPart || !user) return;
    
    const totalPrice = selectedPart.price * orderQuantity;
    if (user.walletBalance < totalPrice) {
      alert(`Insufficient balance. You need ${totalPrice} EGP but have ${user.walletBalance} EGP.`);
      return;
    }

    setOrdering(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/parts/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partId: selectedPart.id,
          quantity: orderQuantity
        })
      });

      if (res.ok) {
        alert(`Successfully ordered ${orderQuantity}x ${selectedPart.name}!`);
        setSelectedPart(null);
        setOrderQuantity(1);
        fetchParts(); // Refresh stock
        if (refreshUser) await refreshUser(); // Update wallet balance
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to place order.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while placing order.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      {/* Header */}
      <div className="p-6 pt-12 bg-cyber-900 text-white rounded-b-3xl shadow-lg relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="glass-panel p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Go Back" title="Go Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold font-display">Spare Parts</h2>
            <p className="text-sm text-gray-400">Find exactly what your car needs</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search parts by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-panel bg-white/10 border-cyber-primary/30 text-white placeholder-gray-400 py-3 pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-cyber-primary outline-none"
          />
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto py-4 hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                category === cat 
                  ? 'bg-cyber-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                  : 'glass-panel bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="font-bold text-slate-900 dark:text-white">Available Items</h3>
          {user && (
            <div className="text-sm font-bold text-cyber-primary">
              Wallet: {user.walletBalance} EGP
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : parts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-bold text-lg">No parts found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {parts.map(part => (
                <div 
                  key={part.id} 
                  onClick={() => setSelectedPart(part)}
                  className="glass-panel bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700"
                >
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                    <img src={part.image || 'https://picsum.photos/400/300?car-part'} alt={part.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md">
                      {part.condition}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-cyber-primary font-bold mb-1">{part.category}</p>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{part.name}</h4>
                    <div className="flex justify-between items-end mt-2">
                      <span className="font-bold text-slate-900 dark:text-white">{part.price} <span className="text-[10px]">EGP</span></span>
                      <span className={`text-[10px] font-bold ${part.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {part.stock > 0 ? `${part.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {nextCursor && (
              <div className="flex justify-center mt-6 mb-8">
                <button
                  onClick={() => fetchParts(false)}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-cyber-primary/10 text-cyber-primary font-bold rounded-full hover:bg-cyber-primary/20 transition-colors"
                >
                  {loadingMore ? 'Loading...' : 'Load More Parts'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedPart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-cyber-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-slideUp sm:animate-fadeIn">
            <div className="relative h-48">
              <img src={selectedPart.image || 'https://picsum.photos/400/300?car-part'} alt={selectedPart.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedPart(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-cyber-primary uppercase tracking-wider">{selectedPart.category}</span>
                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">{selectedPart.name}</h3>
                  {selectedPart.workshop && (
                     <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                       <Tag size={12}/> Seller: {selectedPart.workshop.name}
                     </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{selectedPart.price}</div>
                  <div className="text-xs text-gray-500">EGP / unit</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-gray-800 rounded-xl mb-6">
                <span className="font-bold text-slate-700 dark:text-gray-300">Quantity</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow flex items-center justify-center text-slate-900 dark:text-white font-bold"
                  >-</button>
                  <span className="font-bold text-lg w-4 text-center text-slate-900 dark:text-white">{orderQuantity}</span>
                  <button 
                    onClick={() => setOrderQuantity(Math.min(selectedPart.stock, orderQuantity + 1))}
                    disabled={orderQuantity >= selectedPart.stock}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow flex items-center justify-center text-slate-900 dark:text-white font-bold disabled:opacity-50"
                  >+</button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-gray-500">Total Price</span>
                <span className="text-2xl font-bold text-cyber-primary">
                  {selectedPart.price * orderQuantity} EGP
                </span>
              </div>

              {selectedPart.stock === 0 ? (
                <button disabled className="w-full py-4 rounded-xl font-bold bg-gray-300 dark:bg-gray-700 text-gray-500 flex justify-center items-center gap-2">
                  <AlertCircle size={20} /> Out of Stock
                </button>
              ) : (
                <button 
                  onClick={handleOrder}
                  disabled={ordering || !user || user.walletBalance < (selectedPart.price * orderQuantity)}
                  className="w-full py-4 rounded-xl font-bold bg-cyber-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] flex justify-center items-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ordering ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : !user || user.walletBalance < (selectedPart.price * orderQuantity) ? (
                    <><AlertCircle size={20} /> Insufficient Balance</>
                  ) : (
                    <><ShoppingCart size={20} /> Buy Now</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
