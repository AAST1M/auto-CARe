import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Settings, Calendar, Clock, MessageSquare, Truck, Wrench, Package, ChevronRight, Star, Navigation, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locationName, setSelectedWorkshop, workshops } = useAppContext();

  // If user is not fully loaded, fallback to default profile values
  const safeUser = user || { name: 'User', bookings: [] } as any;

  return (
    <div className="flex flex-col h-screen pb-24">
      {/* Header */}
      <div className="p-6 pt-12 flex justify-between items-center bg-gradient-to-b from-slate-100 dark:from-cyber-900 to-transparent">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Location</p>
          <div className="flex items-center gap-1 text-cyber-primary dark:text-cyber-accent">
            <MapPin size={16} />
            <span className="font-semibold text-sm truncate max-w-[150px]">{locationName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button aria-label="Settings" onClick={() => navigate('/settings')} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white hover:text-cyber-primary"><Settings size={20} /></button>
           <ThemeToggle />
           <div className="relative" onClick={() => navigate('/profile')}>
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-cyber-primary">
              <img src="https://picsum.photos/100/100" alt="Profile" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-slate-100 dark:border-cyber-900"></div>
          </div>
        </div>
      </div>

      <div className="px-6 flex-1 overflow-y-auto no-scrollbar space-y-8">
        
        {/* Upcoming Booking Card */}
        {safeUser.bookings && safeUser.bookings.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 border-l-4 border-cyber-primary relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="absolute top-0 right-0 p-2 bg-cyber-primary/10 rounded-bl-xl text-cyber-primary">
                   <Calendar size={16} />
               </div>
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Upcoming Appointment</h3>
               <div className="flex justify-between items-start">
                   <div>
                       <h4 className="text-lg font-bold text-slate-900 dark:text-white">{safeUser.bookings[0].serviceName}</h4>
                       <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={14}/> {safeUser.bookings[0].date}</p>
                   </div>
                   <span className="text-xs font-bold bg-green-500/20 text-green-500 px-3 py-1 rounded-full">{safeUser.bookings[0].status}</span>
               </div>
               <button onClick={() => navigate('/profile')} className="mt-4 w-full py-2 text-xs font-bold bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-cyber-primary hover:text-white transition-colors">View Details</button>
            </div>
        )}

        {/* Special Offer Banner */}
        <div className="relative rounded-2xl overflow-hidden h-40 shadow-lg group cursor-pointer" onClick={() => navigate('/chat')}>
          <img src="https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" alt="Promotional offer banner" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent p-6 flex flex-col justify-center text-white">
            <span className="bg-cyber-accent text-cyber-900 text-xs font-bold px-2 py-1 rounded w-fit mb-2">PROMO</span>
            <h3 className="text-2xl font-display font-bold">30% OFF</h3>
            <p className="text-gray-200 text-sm">On your first AI diagnostic check</p>
          </div>
        </div>

        {/* Core Services Grid */}
        <div>
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-cyber-primary rounded-full"></div> 
            Core Services
          </h3>
          <div className="grid grid-cols-3 gap-4">
             <button onClick={() => navigate('/chat')} className="flex flex-col items-center gap-2 group">
               <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center group-hover:bg-cyber-primary/20 group-hover:border-cyber-primary transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                 <MessageSquare className="text-cyber-primary dark:text-cyber-accent group-hover:scale-110 transition-transform" />
               </div>
               <span className="text-xs text-slate-600 dark:text-gray-300">AI Doctor</span>
             </button>
             <button onClick={() => navigate('/winch/negotiation')} className="flex flex-col items-center gap-2 group">
               <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center group-hover:bg-cyber-primary/20 group-hover:border-cyber-primary transition-all">
                 <Truck className="text-cyber-primary dark:text-cyber-accent group-hover:scale-110 transition-transform" />
               </div>
               <span className="text-xs text-slate-600 dark:text-gray-300">Winch</span>
             </button>
             <button onClick={() => navigate('/workshops')} className="flex flex-col items-center gap-2 group">
               <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center group-hover:bg-cyber-primary/20 group-hover:border-cyber-primary transition-all">
                 <Wrench className="text-cyber-primary dark:text-cyber-accent group-hover:scale-110 transition-transform" />
               </div>
               <span className="text-xs text-slate-600 dark:text-gray-300">Repair</span>
             </button>
          </div>
        </div>

        {/* Spare Parts Section */}
        <div className="bg-gradient-to-r from-slate-200 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 flex items-center justify-between shadow-lg border border-white/10" onClick={() => navigate('/spare-parts')}>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary">
                    <Package size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Spare Parts Market</h4>
                    <p className="text-xs text-gray-500">Find genuine parts nearby</p>
                </div>
            </div>
            <button aria-label="Go to Spare Parts Market" className="p-2 rounded-full bg-cyber-primary text-white"><ChevronRight size={20}/></button>
        </div>

        {/* Nearby Workshops */}
        <div>
          <div className="flex justify-between items-end mb-4">
             <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <div className="w-1 h-6 bg-cyber-success rounded-full"></div> 
              Verified Near You
            </h3>
            <button onClick={() => navigate('/workshops')} className="text-xs text-cyber-primary">See All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {workshops.slice(0, 3).map((shop: any) => (
              <div key={shop.id} className="min-w-[200px] glass-panel rounded-2xl overflow-hidden hover:border-cyber-primary/50 transition-colors" onClick={() => { setSelectedWorkshop(shop); navigate('/workshops/detail'); }}>
                <img src={shop.image || 'https://picsum.photos/400/200?random=' + shop.id} className="w-full h-24 object-cover" alt={`${shop.name} workshop`} />
                <div className="p-3">
                  <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">{shop.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span>{shop.rating || 'New'}</span>
                    <span>•</span>
                    <MapPin size={12} />
                    <span>{shop.distance || '1.2 km'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="absolute bottom-6 left-6 right-6 h-16 glass-panel rounded-full flex items-center justify-between px-6 neon-border z-50">
         <button className="text-cyber-primary flex flex-col items-center" onClick={() => navigate('/')}>
             <Navigation size={20} />
             <span className="text-[9px]">Home</span>
         </button>
         <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => navigate('/chat')}>
             <MessageSquare size={20} />
             <span className="text-[9px]">AI Doc</span>
         </button>
         <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => navigate('/winch/negotiation')}>
             <Truck size={20} />
             <span className="text-[9px]">Winch</span>
         </button>
         <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => navigate('/workshops')}>
             <Wrench size={20} />
             <span className="text-[9px]">Repair</span>
         </button>
         <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => navigate('/profile')}>
             <User size={20} />
             <span className="text-[9px]">Profile</span>
         </button>
      </div>
    </div>
  );
};
