import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, Message, WinchOffer, Workshop, WorkshopAppointment, View } from '../types';
import { API_URL } from '../config';

interface AppContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  locationName: string;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  winchStatus: 'idle' | 'searching' | 'negotiating' | 'confirmed';
  setWinchStatus: React.Dispatch<React.SetStateAction<'idle' | 'searching' | 'negotiating' | 'confirmed'>>;
  activeOffers: WinchOffer[];
  setActiveOffers: React.Dispatch<React.SetStateAction<WinchOffer[]>>;
  isWinchOnline: boolean;
  setIsWinchOnline: React.Dispatch<React.SetStateAction<boolean>>;
  activeWinchRequest: any | null;
  setActiveWinchRequest: React.Dispatch<React.SetStateAction<any | null>>;
  winchRequestTimer: number;
  setWinchRequestTimer: React.Dispatch<React.SetStateAction<number>>;
  selectedWorkshop: Workshop | null;
  setSelectedWorkshop: React.Dispatch<React.SetStateAction<Workshop | null>>;
  workshopAppointments: WorkshopAppointment[];
  setWorkshopAppointments: React.Dispatch<React.SetStateAction<WorkshopAppointment[]>>;
  carsInWorkshop: any[];
  setCarsInWorkshop: React.Dispatch<React.SetStateAction<any[]>>;
  workshops: Workshop[];
  setWorkshops: React.Dispatch<React.SetStateAction<Workshop[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [locationName, setLocationName] = useState('Locating...');
  
  const [user, setUser] = useState<UserProfile>({
    name: '', email: '', phone: '', gender: '', dob: '', role: null, walletBalance: 0, bookings: []
  });

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', text: 'Hello! I am Auto-Care AI. Describe your car problem, take a photo of the dashboard, or record the engine sound.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const [winchStatus, setWinchStatus] = useState<'idle' | 'searching' | 'negotiating' | 'confirmed'>('idle');
  const [activeOffers, setActiveOffers] = useState<WinchOffer[]>([]);
  const [isWinchOnline, setIsWinchOnline] = useState(false);
  const [activeWinchRequest, setActiveWinchRequest] = useState<any | null>(null);
  const [winchRequestTimer, setWinchRequestTimer] = useState(30);

  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [workshopAppointments, setWorkshopAppointments] = useState<WorkshopAppointment[]>([]);
  const [carsInWorkshop, setCarsInWorkshop] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    fetch(`${API_URL}/api/workshops`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setWorkshops(data);
      })
      .catch(err => console.error('Error fetching workshops:', err));
  }, []);

  return (
    <AppContext.Provider value={{
      isDarkMode, toggleTheme, locationName,
      user, setUser, messages, setMessages, isTyping, setIsTyping,
      winchStatus, setWinchStatus, activeOffers, setActiveOffers,
      isWinchOnline, setIsWinchOnline, activeWinchRequest, setActiveWinchRequest,
      winchRequestTimer, setWinchRequestTimer,
      selectedWorkshop, setSelectedWorkshop,
      workshopAppointments, setWorkshopAppointments,
      carsInWorkshop, setCarsInWorkshop,
      workshops, setWorkshops
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
