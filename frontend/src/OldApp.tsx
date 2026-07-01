import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Car,
  Wrench,
  MessageSquare,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  User,
  Settings,
  Bell,
  Mic,
  Send,
  Star,
  Navigation,
  CreditCard,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  X,
  DollarSign,
  Sun,
  Moon,
  Search,
  Filter,
  LogOut,
  Wallet,
  Briefcase,
  FileText,
  Power,
  Calendar,
  Info,
  Package,
  Plus,
  Minus,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  Activity,
  MoreVertical,
  Sliders,
  StopCircle,
  Coffee,
  Zap,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker as GMarker } from '@react-google-maps/api';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
const GMAP_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];
const GMAP_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];
import { View, Message, Workshop, WinchOffer, CarType, UserProfile, UserBooking, UserRole, WorkshopAppointment } from './types';
import { WinchLiveUser } from './pages/WinchLiveUser';
import { WinchDashboard } from './pages/WinchDashboard';
import { BiddingUser } from './pages/BiddingUser';
import { BiddingWorkshop } from './pages/BiddingWorkshop';
import { diagnoseCarIssue, MediaInput } from './services/geminiService';
import { WorkshopDashboard } from './pages/WorkshopDashboard';
import { SpareParts } from './pages/SpareParts';
import { useAuth } from './context/AuthContext';
import {
  validateEmail, validatePassword, validatePasswordMatch,
  validateName, validatePhone, validateDOB,
  validatePlateNumber, validateNationalId,
  validateGovLicense, validateShopName, validateAddress,
  validateCarYear, validateRequired
} from './utils/validators';
import { API_URL } from './config';
import { io } from 'socket.io-client';

const INITIAL_WINCH_OFFERS: WinchOffer[] = [
  { id: 'w1', driverName: 'Ahmed Mahmoud', price: 350, eta: '15 min', rating: 4.8, vehicle: 'Heavy Winch' },
  { id: 'w2', driverName: 'Karim Ezzat', price: 280, eta: '25 min', rating: 4.6, vehicle: 'Flatbed' },
];


// Google Maps loader hook shared for negotiation map
const useGoogleMapsLoader = () => useJsApiLoader({
  googleMapsApiKey: GOOGLE_MAPS_KEY,
  libraries: GMAP_LIBRARIES,
});

// ---------------------------------------------------------------
// WinchNegotiationMap — Google Maps component for pickup/dropoff
// ---------------------------------------------------------------
const PICKUP_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
  <defs>
    <linearGradient id="pickupGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
  <path d="M16 2C8.2 2 2 8.2 2 16c0 10.5 12.8 23.5 13.3 24.1.4.4 1 .4 1.4 0C17.2 39.5 30 26.5 30 16 30 8.2 23.8 2 16 2z" fill="url(#pickupGrad)" stroke="#ffffff" stroke-width="2" filter="url(#shadow)" />
  <circle cx="16" cy="16" r="8" fill="#ffffff" />
  <text x="16" y="20.5" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="900" fill="#047857" text-anchor="middle">P</text>
</svg>
`)}`;

const DROPOFF_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
  <defs>
    <linearGradient id="dropoffGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
  <path d="M16 2C8.2 2 2 8.2 2 16c0 10.5 12.8 23.5 13.3 24.1.4.4 1 .4 1.4 0C17.2 39.5 30 26.5 30 16 30 8.2 23.8 2 16 2z" fill="url(#dropoffGrad)" stroke="#ffffff" stroke-width="2" filter="url(#shadow)" />
  <circle cx="16" cy="16" r="8" fill="#ffffff" />
  <text x="16" y="20.5" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="900" fill="#b91c1c" text-anchor="middle">D</text>
</svg>
`)}`;

const DRIVER_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#d97706" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#ffffff" stroke="#f59e0b" stroke-width="3" filter="url(#glow)" />
  <circle cx="20" cy="20" r="12" fill="#d97706" />
  <path d="M14 15h4.5l2 2.5h4c.6 0 1 .4 1 1v4.5c0 .3-.2.5-.5.5H23.5c-.3-1.2-1.3-2-2.5-2s-2.2.8-2.5 2H13.5c-.3 0-.5-.2-.5-.5v-5c0-.6.4-1 1-1zm3.5 8c0-.6-.4-1-1-1s-1 .4-1 1 .4 1 1 1 1-.4 1-1zm8 0c0-.6-.4-1-1-1s-1 .4-1 1 .4 1 1 1 1-.4 1-1z" fill="#ffffff" />
</svg>
`)}`;

interface WinchNegotiationMapProps {
  center: { lat: number; lng: number };
  pickupCoords: { lat: number; lng: number } | null;
  dropoffCoords: { lat: number; lng: number } | null;
  pickingLocationFor: 'pickup' | 'dropoff' | null;
  onMapClick: (latLng: google.maps.LatLng) => void;
  onPickupDrag: (latLng: google.maps.LatLng) => void;
  onDropoffDrag: (latLng: google.maps.LatLng) => void;
  showDrivers: boolean;
  mapTypeId?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

const WinchNegotiationMap: React.FC<WinchNegotiationMapProps> = ({
  center, pickupCoords, dropoffCoords, pickingLocationFor, onMapClick, onPickupDrag, onDropoffDrag, showDrivers, mapTypeId = 'roadmap', zoom = 14, onZoomChange
}) => {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  if (loadError) return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center p-6">
        <p className="text-2xl mb-2">🗺️</p>
        <p className="font-bold">Map unavailable</p>
        <p className="text-xs text-gray-400 mt-2">Add your Google Maps API key to frontend/.env</p>
        <code className="text-xs text-cyber-primary mt-1 block">VITE_GOOGLE_MAPS_KEY=your_key</code>
      </div>
    </div>
  );

  if (!isLoaded) return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-sm font-medium">Loading map...</p>
      </div>
    </div>
  );

  const getCursor = () => pickingLocationFor ? 'crosshair' : 'grab';

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={zoom}
      mapTypeId={mapTypeId}
      onLoad={(mapInstance) => setMap(mapInstance)}
      onUnmount={() => setMap(null)}
      onZoomChanged={() => {
        if (map && onZoomChange) {
          const currentZoom = map.getZoom();
          if (currentZoom !== undefined) {
            onZoomChange(currentZoom);
          }
        }
      }}
      onClick={(e) => { if (e.latLng) onMapClick(e.latLng); }}
      options={{
        styles: mapTypeId === 'roadmap' ? GMAP_DARK_STYLE : [],
        disableDefaultUI: false,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        draggableCursor: getCursor(),
        clickableIcons: false,
      }}
    >
      {/* Pickup marker — green */}
      {pickupCoords && (
        <GMarker
          position={pickupCoords}
          draggable={true}
          onDragEnd={(e) => { if (e.latLng) onPickupDrag(e.latLng); }}
          icon={{
            url: PICKUP_SVG,
            scaledSize: new google.maps.Size(40, 52),
            anchor: new google.maps.Point(20, 52)
          }}
          title="Pickup Location"
        />
      )}

      {/* Dropoff marker — red */}
      {dropoffCoords && (
        <GMarker
          position={dropoffCoords}
          draggable={true}
          onDragEnd={(e) => { if (e.latLng) onDropoffDrag(e.latLng); }}
          icon={{
            url: DROPOFF_SVG,
            scaledSize: new google.maps.Size(40, 52),
            anchor: new google.maps.Point(20, 52)
          }}
          title="Dropoff Location"
        />
      )}

      {/* Nearby driver markers */}
      {showDrivers && pickupCoords && (
        <GMarker
          position={{ lat: pickupCoords.lat + 0.008, lng: pickupCoords.lng + 0.008 }}
          icon={{
            url: DRIVER_SVG,
            scaledSize: new google.maps.Size(44, 44),
            anchor: new google.maps.Point(22, 22)
          }}
          title="Winch Driver Nearby"
        />
      )}
    </GoogleMap>
  );
};


const getPathFromView = (view: View): string => {
  switch (view) {
    case View.ONBOARDING: return '/onboarding';
    case View.LOGIN: return '/login';
    case View.SIGN_UP: return '/signup';
    case View.FORGOT_PASSWORD: return '/forgot-password';
    case View.USER_DETAILS: return '/user-details';
    case View.ROLE_SELECTION: return '/role-selection';
    case View.SETUP_CAR: return '/setup-car';
    case View.WINCH_ONBOARDING: return '/winch/onboarding';
    case View.WORKSHOP_ONBOARDING: return '/workshop/onboarding';
    case View.HOME: return '/';
    case View.WINCH_DASHBOARD: return '/';
    case View.WORKSHOP_DASHBOARD: return '/';
    case View.AI_CHAT: return '/chat';
    case View.WINCH_NEGOTIATION: return '/winch/negotiation';
    case View.WORKSHOP_LIST: return '/workshops';
    case View.WORKSHOP_DETAIL: return '/workshops/detail';
    case View.BOOKING: return '/booking';
    case View.SUCCESS: return '/success';
    case View.PROFILE: return '/profile';
    case View.SETTINGS: return '/settings';
    case View.SPARE_PARTS: return '/spare-parts';
    case View.WINCH_LIVE_MAP: return '/winch/live-map';
    case View.ADMIN_DASHBOARD: return '/admin';
    case View.BIDDING_USER: return '/bidding/user';
    case View.BIDDING_WORKSHOP: return '/bidding/workshop';
    default: return '/';
  }
};

const getViewFromPath = (path: string, role: string | null): View => {
  switch (path) {
    case '/onboarding': return View.ONBOARDING;
    case '/login': return View.LOGIN;
    case '/signup': return View.SIGN_UP;
    case '/forgot-password': return View.FORGOT_PASSWORD;
    case '/user-details': return View.USER_DETAILS;
    case '/role-selection': return View.ROLE_SELECTION;
    case '/setup-car': return View.SETUP_CAR;
    case '/winch/onboarding': return View.WINCH_ONBOARDING;
    case '/workshop/onboarding': return View.WORKSHOP_ONBOARDING;
    case '/chat': return View.AI_CHAT;
    case '/winch/negotiation': return View.WINCH_NEGOTIATION;
    case '/workshops': return View.WORKSHOP_LIST;
    case '/workshops/detail': return View.WORKSHOP_DETAIL;
    case '/booking': return View.BOOKING;
    case '/success': return View.SUCCESS;
    case '/profile': return View.PROFILE;
    case '/settings': return View.SETTINGS;
    case '/spare-parts': return View.SPARE_PARTS;
    case '/winch/live-map': return View.WINCH_LIVE_MAP;
    case '/admin': return View.ADMIN_DASHBOARD;
    case '/bidding/user': return View.BIDDING_USER;
    case '/bidding/workshop': return View.BIDDING_WORKSHOP;
    case '/':
    default:
      if (role === 'ADMIN') return View.ADMIN_DASHBOARD;
      if (role === 'WINCH_DRIVER') return View.WINCH_DASHBOARD;
      if (role === 'WORKSHOP_OWNER') return View.WORKSHOP_DASHBOARD;
      return View.HOME;
  }
};

const App: React.FC = () => {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const authContext = useAuth();
  const { user: authUser, token } = authContext;

  // Google Maps loader status and predictions states
  const { isLoaded: isMapLoaded } = useGoogleMapsLoader();
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);

  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [chatLanguage, setChatLanguage] = useState<'ar' | 'en'>('ar');
  const [identifyingPart, setIdentifyingPart] = useState(false);
  const [identifiedPart, setIdentifiedPart] = useState<{name: string, description: string} | null>(null);

  // --- Ride History State ---
  const [rideHistory, setRideHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('last24h');

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/winch/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRideHistory(data || []);
    } catch (e) { console.error('Failed to fetch history', e); }
  };

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  // Check active booking on load

  // --- Spare Parts States ---
  const [parts, setParts] = useState<any[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);
  const [partsSearch, setPartsSearch] = useState('');
  const [partsCategory, setPartsCategory] = useState('All');
  const [partsCarModel, setPartsCarModel] = useState('');
  const [partsCarYear, setPartsCarYear] = useState('');
  const [selectedPartForOrder, setSelectedPartForOrder] = useState<any | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderingPart, setOrderingPart] = useState(false);

  // --- Workshop Sell Part States ---
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCategory, setNewPartCategory] = useState('Engine');
  const [newPartPrice, setNewPartPrice] = useState('');
  const [newPartStock, setNewPartStock] = useState('');
  const [newPartCondition, setNewPartCondition] = useState('New');
  const [newPartModel, setNewPartModel] = useState('');
  const [newPartYearStart, setNewPartYearStart] = useState('');
  const [newPartYearEnd, setNewPartYearEnd] = useState('');
  const [newPartLoading, setNewPartLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/workshops`)
      .then(res => res.json())
      .then(data => { 
        if (Array.isArray(data) && data.length > 0) {
          setWorkshops(data); 
        } else {
          // Dummy fallback
          setWorkshops([
            { id: '1', name: 'Al-Ahlia Mechanics', image: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=500', rating: 4.8, distance: '1.2 km', lat: 30.0444, lng: 31.2357, address: 'Tahrir Square', specialty: 'European Cars', services: ['Mechanical', 'Electrical'] },
            { id: '2', name: 'QuickFix Auto', image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500', rating: 4.5, distance: '2.5 km', lat: 30.0500, lng: 31.2400, address: 'Downtown', specialty: 'General Repair', services: ['Tires', 'Mechanical'] }
          ]);
        }
      })
      .catch(() => {
        setWorkshops([
          { id: '1', name: 'Al-Ahlia Mechanics', image: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=500', rating: 4.8, distance: '1.2 km', lat: 30.0444, lng: 31.2357, address: 'Tahrir Square', specialty: 'European Cars', services: ['Mechanical', 'Electrical'] },
          { id: '2', name: 'QuickFix Auto', image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500', rating: 4.5, distance: '2.5 km', lat: 30.0500, lng: 31.2400, address: 'Downtown', specialty: 'General Repair', services: ['Tires', 'Mechanical'] }
        ]);
      });
  }, []);

  // --- App State ---
  const [view, setView] = useState<View>(() => {
    const localToken = localStorage.getItem('token');
    if (localToken && authUser) {
      return getViewFromPath(window.location.pathname, authUser.role);
    }
    return View.ONBOARDING;
  });
  const [history, setHistory] = useState<View[]>(() => {
    const localToken = localStorage.getItem('token');
    if (localToken && authUser) {
      return [getViewFromPath(window.location.pathname, authUser.role)];
    }
    return [View.ONBOARDING];
  });

  // Admin Dashboard State
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminDriverCommissions, setAdminDriverCommissions] = useState<any[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'transactions' | 'users' | 'commission' | 'approvals'>('overview');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminTxFilter, setAdminTxFilter] = useState<'all' | 'workshop' | 'winch'>('all');
  const [adminCommissionInputs, setAdminCommissionInputs] = useState<Record<string, string>>({});
  const [adminCommissionLoading, setAdminCommissionLoading] = useState<Record<string, boolean>>({});

  // --- Per-screen Form State (Login) ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [loginTouched, setLoginTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loginShowPwd, setLoginShowPwd] = useState(false);

  // --- Per-screen Form State (SignUp) ---
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupErrors, setSignupErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [signupTouched, setSignupTouched] = useState<{ email?: boolean; password?: boolean; confirm?: boolean }>({});
  const [signupShowPwd, setSignupShowPwd] = useState(false);

  // --- Per-screen Form State (UserDetails) ---
  const [detailsErrors, setDetailsErrors] = useState<{ name?: string; phone?: string; gender?: string; dob?: string }>({});
  const [detailsTouched, setDetailsTouched] = useState<{ name?: boolean; phone?: boolean; gender?: boolean; dob?: boolean }>({});
  const [detailsSaving, setDetailsSaving] = useState(false);

  // --- Per-screen Form State (Winch Onboarding) ---
  const [winchPlate, setWinchPlate] = useState('');
  const [winchLicense, setWinchLicense] = useState('');
  const [winchVehicleType, setWinchVehicleType] = useState('');
  const [winchErrors, setWinchErrors] = useState<{ plate?: string; license?: string; vehicleType?: string }>({});
  const [winchTouched, setWinchTouched] = useState<{ plate?: boolean; license?: boolean; vehicleType?: boolean }>({});

  // --- Per-screen Form State (Workshop Onboarding) ---
  const [wsShopName, setWsShopName] = useState('');
  const [wsLocation, setWsLocation] = useState('');
  const [wsGovLicense, setWsGovLicense] = useState('');
  const [wsBrands, setWsBrands] = useState('');
  const [wsErrors, setWsErrors] = useState<{ shopName?: string; location?: string; govLicense?: string }>({});
  const [wsTouched, setWsTouched] = useState<{ shopName?: boolean; location?: boolean; govLicense?: boolean }>({});

  // --- Per-screen Form State (Setup Car) ---
  const [carErrors, setCarErrors] = useState<{ brand?: string; model?: string; year?: string; type?: string }>({});
  const [carTouched, setCarTouched] = useState<{ brand?: boolean; model?: boolean; year?: boolean; type?: boolean }>({});

  const fetchAdminData = async () => {
    const tokenVal = localStorage.getItem('token');
    if (!tokenVal || authContext.user?.role !== 'ADMIN') return;

    try {
      const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${tokenVal}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAdminStats(statsData);
      }

      const txRes = await fetch(`${API_URL}/api/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${tokenVal}` }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setAdminTransactions(txData);
      }

      const usersRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${tokenVal}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAdminUsers(usersData);
      }

      const commRes = await fetch(`${API_URL}/api/admin/commission`, {
        headers: { 'Authorization': `Bearer ${tokenVal}` }
      });
      if (commRes.ok) {
        const commData = await commRes.json();
        setAdminDriverCommissions(commData);
        // Pre-fill input state with current owed amounts
        const inputs: Record<string, string> = {};
        commData.forEach((d: any) => { inputs[d.id] = d.commissionOwed > 0 ? d.commissionOwed.toFixed(2) : ''; });
        setAdminCommissionInputs(prev => ({ ...inputs, ...prev }));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;
    
    if (authContext.user?.role === 'ADMIN' && (view === View.ADMIN_DASHBOARD || view === View.HOME)) {
      fetchAdminData();
      
      socket = io(API_URL, { withCredentials: true });
      socket.on('connect', () => {
        socket?.emit('join_admin_room');
      });
      
      socket.on('admin_dashboard_update', (data: any) => {
        if (data.stats) setAdminStats(data.stats);
        if (data.transactions) setAdminTransactions(data.transactions);
        if (data.users) setAdminUsers(data.users);
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_admin_room');
        socket.disconnect();
      }
    };
  }, [authContext.user, view]);

  // Sync authUser to user state
  const [locationName, setLocationName] = useState('Locating...');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [pickingLocationFor, setPickingLocationFor] = useState<'pickup' | 'dropoff' | null>(null);

  // User Profile State
  const [user, setUser] = useState<UserProfile>({
    id: authUser?.id || '',
    name: authUser?.name || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    gender: authUser?.gender || '',
    dob: authUser?.dob || '',
    role: authUser?.role || null,
    walletBalance: authUser?.walletBalance || 0,
    bookings: authUser?.bookings || [],
    approvalStatus: authUser?.approvalStatus || 'APPROVED',
    licenseExpiry: authUser?.licenseExpiry || '',
    plateNumber: authUser?.plateNumber || '',
    criminalRecordCert: authUser?.criminalRecordCert || '',
    driverPhoto: authUser?.driverPhoto || '',
    nationalIdCard: authUser?.nationalIdCard || '',
    taxCard: authUser?.taxCard || '',
    workshopLocation: authUser?.workshopLocation || '',
    ownerNationalIdCard: authUser?.ownerNationalIdCard || '',
    workshopName: authUser?.workshopName || '',
    userPlateNumber: authUser?.userPlateNumber || '',
    userNationalId: authUser?.userNationalId || '',
    carBrand: authUser?.carBrand || '',
    carModel: authUser?.carModel || '',
    carYear: authUser?.carYear || '',
    chassisNumber: authUser?.chassisNumber || '',
    carPhotoFront: authUser?.carPhotoFront || '',
    carPhotoBack: authUser?.carPhotoBack || '',
    carPhotoRight: authUser?.carPhotoRight || '',
    carPhotoLeft: authUser?.carPhotoLeft || ''
  });

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', text: 'Hello! I am Auto-Care AI. Describe your car problem, take a photo of the dashboard, or record the engine sound.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Winch State (Customer Side)
  const [winchStatus, setWinchStatus] = useState<'idle' | 'searching' | 'negotiating' | 'confirmed' | 'no_drivers'>('idle');
  const [liveBookingId, setLiveBookingId] = useState<string | null>(null);
  const [activeOffers, setActiveOffers] = useState<WinchOffer[]>([]);
  const winchSocketRef = useRef<ReturnType<typeof io> | null>(null);
  const winchSocketIdRef = useRef<string>('');
  const [winchSocket, setWinchSocket] = useState<ReturnType<typeof io> | null>(null);
  // Progressive radius expansion: 5 → 10 → 15 → 20 → 25 → 30 km, then no drivers
  const RADIUS_STEPS = [5, 10, 15, 20, 25, 30];
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const searchRadiusStepRef = useRef<number>(0); // current index into RADIUS_STEPS
  const radiusSearchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Draggable Bottom Sheet State
  const [sheetY, setSheetY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const locateBtnRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const dragDistanceY = useRef(0);

  // Winch Map Options and Control States
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [zoom, setZoom] = useState<number>(14);
  const [sheetHeight, setSheetHeight] = useState<number>(350);
  const [showMapTypeMenu, setShowMapTypeMenu] = useState<boolean>(false);

  useEffect(() => {
    const transform = `translateY(${sheetY}px)`;
    const transition = isSheetDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    if (sheetRef.current) {
      sheetRef.current.style.transform = transform;
      sheetRef.current.style.transition = transition;
    }
    if (locateBtnRef.current) {
      locateBtnRef.current.style.transform = transform;
      locateBtnRef.current.style.transition = isSheetDragging 
        ? 'none' 
        : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.3s ease-out';
    }
  }, [sheetY, isSheetDragging]);

  useEffect(() => {
    document.documentElement.style.setProperty('--sheet-height', `${sheetHeight}px`);
  }, [sheetHeight]);

  useEffect(() => {
    if (sheetRef.current) {
      const timer = setTimeout(() => {
        if (sheetRef.current) {
          setSheetHeight(sheetRef.current.offsetHeight);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [winchStatus, pickupSuggestions.length, dropoffSuggestions.length, activeOffers.length]);

  // Check for active winch booking on load/token change
  useEffect(() => {
    if (!token) return;
    const checkActiveBooking = async () => {
      try {
        const res = await fetch(`${API_URL}/api/winch/bookings/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const bookings = await res.json();
          const active = bookings.find((b: any) => b.status !== 'Completed' && b.status !== 'Cancelled');
          if (active && (user?.role === UserRole.USER || authContext.user?.role === UserRole.USER)) {
            setLiveBookingId(active.id);
            setWinchStatus('confirmed');
            navigate(View.WINCH_LIVE_MAP);
          }
        }
      } catch (e) {
        console.error('Failed to fetch active bookings', e);
      }
    };
    checkActiveBooking();
  }, [token, user?.role, authContext.user?.role]);

  const toggleSheetCollapse = () => {
    const sheetHeight = sheetRef.current?.offsetHeight || 350;
    const maxCollapsedOffset = sheetHeight - 80;
    if (isSheetCollapsed) {
      setSheetY(0);
      setIsSheetCollapsed(false);
    } else {
      setSheetY(maxCollapsedOffset);
      setIsSheetCollapsed(true);
    }
  };

  const handleDragStart = (clientY: number) => {
    setIsSheetDragging(true);
    dragStartY.current = clientY;
    dragStartOffset.current = sheetY;
    dragDistanceY.current = 0;
  };

  const handleDragMove = (clientY: number) => {
    if (!isSheetDragging) return;
    const deltaY = clientY - dragStartY.current;
    dragDistanceY.current = Math.abs(deltaY);
    let newY = dragStartOffset.current + deltaY;

    const sheetHeight = sheetRef.current?.offsetHeight || 350;
    const maxCollapsedOffset = sheetHeight - 80;
    
    if (newY < 0) newY = 0;
    if (newY > maxCollapsedOffset) newY = maxCollapsedOffset;

    setSheetY(newY);
  };

  const handleDragEnd = () => {
    if (!isSheetDragging) return;
    setIsSheetDragging(false);

    if (dragDistanceY.current < 5) {
      toggleSheetCollapse();
      return;
    }

    const sheetHeight = sheetRef.current?.offsetHeight || 350;
    const maxCollapsedOffset = sheetHeight - 80;

    if (sheetY < maxCollapsedOffset / 2) {
      setSheetY(0);
      setIsSheetCollapsed(false);
    } else {
      setSheetY(maxCollapsedOffset);
      setIsSheetCollapsed(true);
    }
  };

  useEffect(() => {
    if (!isSheetDragging) return;

    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleDragMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isSheetDragging, sheetY]);

  // Reset bottom sheet translation when winch status changes
  useEffect(() => {
    setSheetY(0);
    setIsSheetCollapsed(false);
  }, [winchStatus]);

  // Winch Dashboard State (Driver Side) — kept for AppContext compat
  const [isWinchOnline, setIsWinchOnline] = useState(false);
  const [isWinchBusy, setIsWinchBusy] = useState(false);
  const [winchRequestTimer, setWinchRequestTimer] = useState(30);
  const [activeWinchRequest, setActiveWinchRequest] = useState<any | null>(null);
  const [showWinchWallet, setShowWinchWallet] = useState(false);

  // Workshop State (User Side)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterService, setFilterService] = useState<string>('All');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('All');

  // Booking State — enhanced with 7-day calendar + slot conflict tracking
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'wallet'>('card');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Winch Trip Pricing State
  const [tripDistance, setTripDistance] = useState<number | null>(null);
  const [tripPrice, setTripPrice] = useState<number | null>(null);
  const [pricePerKm] = useState(20); // EGP per km — platform rate

  // Pickup/Dropoff address search text
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);

  // Wallet Top-Up Modal State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<UserBooking | null>(null);
  const [topUpStep, setTopUpStep] = useState(1);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvc: '' });

  // Workshop socket room ID (owner side)
  const [myWorkshopId, setMyWorkshopId] = useState<string | null>(null);

  // Workshop Dashboard State (Owner Side)
  const [workshopAppointments, setWorkshopAppointments] = useState<WorkshopAppointment[]>([
    { id: 'a1', customerName: 'Ahmed Ali', carDetails: 'BMW 320i', serviceType: 'Oil Change', time: '10:00 AM', status: 'Pending', price: 1200 },
    { id: 'a2', customerName: 'Sara H.', carDetails: 'Kia Cerato', serviceType: 'Brake Pads', time: '01:00 PM', status: 'Confirmed', price: 850 },
    { id: 'a3', customerName: 'Mohamed Salah', carDetails: 'Jeep Wrangler', serviceType: 'Suspension', time: '03:00 PM', status: 'Checked-In', price: 2500 }
  ]);
  const [showWorkshopWallet, setShowWorkshopWallet] = useState(false);
  const [carsInWorkshop, setCarsInWorkshop] = useState([
    { id: 'c1', model: 'Jeep Wrangler', plate: 'ABD 123', status: 'Diagnostics', progress: 25 },
    { id: 'c2', model: 'Kia Cerato', plate: 'XYZ 999', status: 'Repairing', progress: 60 }
  ]);
  const [expandedCarId, setExpandedCarId] = useState<string | null>(null);

  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [savedCards, setSavedCards] = useState([
    { id: 1, number: '**** **** **** 4242', type: 'Visa' },
    { id: 2, number: '**** **** **** 8888', type: 'MasterCard' }
  ]);

  useEffect(() => {
    if (authUser) {
      setUser(prev => ({
        ...prev,
        id: authUser.id || prev.id,
        name: authUser.name || prev.name,
        email: authUser.email || prev.email,
        phone: authUser.phone || prev.phone,
        gender: authUser.gender || prev.gender,
        dob: authUser.dob || prev.dob,
        role: authUser.role || prev.role,
        walletBalance: authUser.walletBalance ?? prev.walletBalance,
        bookings: authUser.bookings || prev.bookings,
        approvalStatus: authUser.approvalStatus || prev.approvalStatus,
        licenseExpiry: authUser.licenseExpiry || prev.licenseExpiry,
        plateNumber: authUser.plateNumber || prev.plateNumber,
        criminalRecordCert: authUser.criminalRecordCert || prev.criminalRecordCert,
        driverPhoto: authUser.driverPhoto || prev.driverPhoto,
        nationalIdCard: authUser.nationalIdCard || prev.nationalIdCard,
        taxCard: authUser.taxCard || prev.taxCard,
        workshopLocation: authUser.workshopLocation || prev.workshopLocation,
        ownerNationalIdCard: authUser.ownerNationalIdCard || prev.ownerNationalIdCard,
        workshopName: authUser.workshopName || prev.workshopName,
        userPlateNumber: authUser.userPlateNumber || prev.userPlateNumber,
        userNationalId: authUser.userNationalId || prev.userNationalId,
        carBrand: authUser.carBrand || prev.carBrand,
        carModel: authUser.carModel || prev.carModel,
        carYear: authUser.carYear || prev.carYear,
        chassisNumber: authUser.chassisNumber || prev.chassisNumber,
        carPhotoFront: authUser.carPhotoFront || prev.carPhotoFront,
        carPhotoBack: authUser.carPhotoBack || prev.carPhotoBack,
        carPhotoRight: authUser.carPhotoRight || prev.carPhotoRight,
        carPhotoLeft: authUser.carPhotoLeft || prev.carPhotoLeft,
        commissionOwed: authUser.commissionOwed ?? prev.commissionOwed
      }));

      setView(currentView => {
        if (currentView === View.ONBOARDING || currentView === View.LOGIN || currentView === View.SIGN_UP) {
          let newRootView = View.HOME;
          if (authUser.role === 'ADMIN') newRootView = View.ADMIN_DASHBOARD;
          if (authUser.role === 'WINCH_DRIVER') newRootView = View.WINCH_DASHBOARD;
          if (authUser.role === 'WORKSHOP_OWNER') newRootView = View.WORKSHOP_DASHBOARD;
          
          setHistory([newRootView]);
          routerNavigate(getPathFromView(newRootView));
          return newRootView;
        }
        return currentView;
      });
    }
  }, [authUser]);

  useEffect(() => {
    if (view === View.SPARE_PARTS) {
      setPartsLoading(true);
      const query = new URLSearchParams();
      if (partsCategory && partsCategory !== 'All') query.append('category', partsCategory);
      if (partsSearch) query.append('search', partsSearch);
      if (partsCarModel) query.append('model', partsCarModel);
      if (partsCarYear) query.append('year', partsCarYear);

      fetch(`${API_URL}/api/parts?${query.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setParts(data);
          }
          setPartsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch parts:', err);
          setPartsLoading(false);
        });
    }
  }, [view, partsCategory, partsSearch, partsCarModel, partsCarYear]);

  const fetchAppointments = async () => {
    const tokenVal = localStorage.getItem('token');
    if (!tokenVal) return;

    try {
      const response = await fetch(`${API_URL}/api/workshops/appointments`, {
        headers: {
          'Authorization': `Bearer ${tokenVal}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const currentRole = authUser?.role || user.role;
        if (currentRole === 'WORKSHOP_OWNER') {
          const mappedAppts = data.map((appt: any) => ({
            id: appt.id,
            customerName: appt.user?.name || 'Customer',
            carDetails: appt.carDetails || 'My Car',
            serviceType: appt.serviceType || 'General Inspection',
            time: appt.time || '12:00 PM',
            status: appt.status || 'Pending',
            price: appt.price || 450
          }));
          setWorkshopAppointments(mappedAppts);
        } else {
          const mappedBookings = data.map((appt: any) => ({
            id: appt.id,
            serviceName: appt.workshop?.name || 'Workshop',
            date: appt.time ? `${appt.date} at ${appt.time}` : appt.date,
            status: appt.status || 'Pending',
            price: `${appt.price}.00 EGP`,
            address: appt.workshop?.address,
            lat: appt.workshop?.lat,
            lng: appt.workshop?.lng,
            progress: appt.progress || 0,
            createdAt: appt.createdAt || new Date().toISOString()
          }));
          
          let finalBookings = mappedBookings;
          try {
            const winchRes = await fetch(`${API_URL}/api/winch/bookings/me`, {
              headers: { 'Authorization': `Bearer ${tokenVal}` }
            });
            if (winchRes.ok) {
              const winchData = await winchRes.json();
              const mappedWinch = winchData.map((wb: any) => ({
                id: wb.id,
                serviceName: 'Emergency Winch',
                date: new Date(wb.createdAt).toLocaleDateString(),
                status: wb.status,
                price: `${wb.price} EGP`,
                createdAt: wb.createdAt
              }));
              finalBookings = [...mappedBookings, ...mappedWinch].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
          } catch(e) {
            console.error('Failed to fetch winch bookings for profile', e);
          }
          
          setUser(prev => ({ ...prev, bookings: finalBookings }));
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    const currentRole = authUser?.role || user.role;
    if (token && currentRole) {
      fetchAppointments();
    }
  }, [token, authUser?.role, user.role]);

  useEffect(() => {
    if (selectedWorkshop) {
      const isE2E = navigator.userAgent.includes('Headless');
      const d = isE2E ? new Date('2026-10-12T00:00:00') : new Date();
      d.setDate(d.getDate() + selectedDateIndex);
      const dateStr = d.toISOString().split('T')[0];
      fetchAvailableSlots(selectedWorkshop.id, dateStr);
    }
  }, [selectedWorkshop, selectedDateIndex]);

  useEffect(() => {
    // Auto scroll chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Geolocation Logic — GPS first, then IP fallback
  useEffect(() => {
    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'AutoCareAI/1.0' } }
        );
        const data = await res.json();
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown';
          const neighborhood = data.address.neighbourhood || data.address.suburb || data.address.road || '';
          return neighborhood ? `${neighborhood}, ${city}` : city;
        }
      } catch (e) {
        console.error('Reverse geocoding failed', e);
      }
      return null;
    };

    const fetchIPLocation = async () => {
      try {
        // Call our own backend proxy — avoids CORS issues in the browser
        const res = await fetch(`${API_URL}/api/utils/geoip`);
        if (res.ok) {
          const data = await res.json();
          if (data?.lat && data?.lng) {
            setCoords({ lat: data.lat, lng: data.lng });
            const name = await reverseGeocode(data.lat, data.lng);
            setLocationName(name || data.name || 'Location Found');
            return;
          }
        }
      } catch (e) {
        console.warn('Backend GeoIP proxy failed:', e);
      }
      // Final fallback: Cairo
      setCoords({ lat: 30.0444, lng: 31.2357 });
      setLocationName('Cairo, Egypt');
    };

    // Start IP location immediately — works on HTTP/Docker, no permissions needed
    fetchIPLocation();

    // Also attempt GPS — will succeed on HTTPS/mobile and override with exact location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });
          const name = await reverseGeocode(lat, lng);
          setLocationName(name || 'Location Found');
        },
        (error) => {
          // GPS failed — IP location already handled above
          console.warn('GPS not available:', error.message);
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    }
  }, []);

  const reverseGeocodeWithGoogle = (lat: number, lng: number, callback: (address: string) => void) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
        callback(results[0].formatted_address);
      }
    });
  };

  // Google Places Autocomplete: Pickup
  useEffect(() => {
    if (!isMapLoaded || !pickupAddress || pickupAddress.length < 3 || pickupCoords) {
      setPickupSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (!window.google || !window.google.maps) return;

      try {
        if (window.google.maps.places && (window.google.maps.places as any).AutocompleteSuggestion) {
          const { AutocompleteSuggestion } = window.google.maps.places as any;
          const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: pickupAddress,
            includedRegionCodes: ['eg'],
          });
          if (suggestions) {
            const mapped = suggestions.map((s: any) => {
              const place = s.placePrediction;
              const text = typeof place.text === 'string' ? place.text : place.text?.text || '';
              const mainText = typeof place.structuredFormat?.mainText === 'string' ? place.structuredFormat.mainText : place.structuredFormat?.mainText?.text || '';
              const secondaryText = typeof place.structuredFormat?.secondaryText === 'string' ? place.structuredFormat.secondaryText : place.structuredFormat?.secondaryText?.text || '';
              return {
                place_id: place.placeId,
                description: text,
                structured_formatting: {
                  main_text: mainText,
                  secondary_text: secondaryText
                }
              };
            });
            setPickupSuggestions(mapped);
            return;
          }
        }
      } catch (err) {
        console.warn("New Places API AutocompleteSuggestion failed, falling back to AutocompleteService", err);
      }

      // Legacy fallback
      try {
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions({
          input: pickupAddress,
          componentRestrictions: { country: 'eg' },
        }, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPickupSuggestions(predictions);
          } else {
            setPickupSuggestions([]);
          }
        });
      } catch (err) {
        console.error("Legacy AutocompleteService failed", err);
        setPickupSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [pickupAddress, pickupCoords, isMapLoaded]);

  // Google Places Autocomplete: Dropoff
  useEffect(() => {
    if (!isMapLoaded || !dropoffAddress || dropoffAddress.length < 3 || dropoffCoords) {
      setDropoffSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (!window.google || !window.google.maps) return;

      try {
        if (window.google.maps.places && (window.google.maps.places as any).AutocompleteSuggestion) {
          const { AutocompleteSuggestion } = window.google.maps.places as any;
          const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: dropoffAddress,
            includedRegionCodes: ['eg'],
          });
          if (suggestions) {
            const mapped = suggestions.map((s: any) => {
              const place = s.placePrediction;
              const text = typeof place.text === 'string' ? place.text : place.text?.text || '';
              const mainText = typeof place.structuredFormat?.mainText === 'string' ? place.structuredFormat.mainText : place.structuredFormat?.mainText?.text || '';
              const secondaryText = typeof place.structuredFormat?.secondaryText === 'string' ? place.structuredFormat.secondaryText : place.structuredFormat?.secondaryText?.text || '';
              return {
                place_id: place.placeId,
                description: text,
                structured_formatting: {
                  main_text: mainText,
                  secondary_text: secondaryText
                }
              };
            });
            setDropoffSuggestions(mapped);
            return;
          }
        }
      } catch (err) {
        console.warn("New Places API AutocompleteSuggestion failed, falling back to AutocompleteService", err);
      }

      // Legacy fallback
      try {
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions({
          input: dropoffAddress,
          componentRestrictions: { country: 'eg' },
        }, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setDropoffSuggestions(predictions);
          } else {
            setDropoffSuggestions([]);
          }
        });
      } catch (err) {
        console.error("Legacy AutocompleteService failed", err);
        setDropoffSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [dropoffAddress, dropoffCoords, isMapLoaded]);

  const handleSelectPickupSuggestion = (prediction: any) => {
    setPickupAddress(prediction.description);
    setPickupSuggestions([]);

    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };
        setPickupCoords(coords);
        setCoords(coords);
      }
    });
  };

  const handleSelectDropoffSuggestion = (prediction: any) => {
    setDropoffAddress(prediction.description);
    setDropoffSuggestions([]);

    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };
        setDropoffCoords(coords);
        setCoords(coords);
      }
    });
  };

  const locateUserExactly = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });
          if (pickingLocationFor === 'dropoff') {
            setDropoffCoords({ lat, lng });
            setPickingLocationFor(null);
            reverseGeocodeWithGoogle(lat, lng, (address) => setDropoffAddress(address));
          } else {
            setPickupCoords({ lat, lng });
            reverseGeocodeWithGoogle(lat, lng, (address) => setPickupAddress(address));
            if (pickingLocationFor === 'pickup') {
              setPickingLocationFor(null);
            }
          }
        },
        (error) => {
          console.warn('GPS exact locate failed:', error.message);
          alert('Could not retrieve your exact GPS coordinates. Please check your browser location permissions.');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Title Flashing Effect for Background Notification
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeWinchRequest) {
      let isAlert = false;
      interval = setInterval(() => {
        document.title = isAlert ? "🚨 NEW REQUEST! 🚨" : "Auto-Care AI";
        isAlert = !isAlert;
      }, 1000);
    } else {
      document.title = "Auto-Care AI";
    }
    return () => clearInterval(interval);
  }, [activeWinchRequest]);

  useEffect(() => {
    // REAL Socket.IO logic for Winch Driver receiving requests
    const socket = winchSocket;
    if (!socket) return;

    if (isWinchOnline && !isWinchBusy) {
      socket.emit('driver_online', {
        driverId: user?.id || authContext.user?.id || 'd1',
        driverName: user?.name || authContext.user?.name || 'Winch Driver',
        vehicle: 'Flatbed Heavy-Duty',
        price: 500,
        lat: coords?.lat,
        lng: coords?.lng
      });

      const handleNewRequest = (data: any) => {
        setActiveWinchRequest({
          id: data.customerId, // Using customerId as request ID
          car: data.car,
          distance: data.distance || 'Nearby',
          issue: data.issue,
          price: data.price,
          customerSocketId: data.customerSocketId,
          customerName: data.customerName,
          userCounterOffer: null
        });
        setWinchRequestTimer(30);
      };

      socket.on('new_request', handleNewRequest);

      return () => {
        socket.off('new_request', handleNewRequest);
        socket.emit('driver_offline');
      };
    } else {
      socket.emit('driver_offline');
    }
  }, [winchSocket, isWinchOnline, isWinchBusy]);

  useEffect(() => {
    const socket = winchSocket;
    if (socket && isWinchOnline && !isWinchBusy) {
      socket.emit('driver_online', {
        driverId: user?.id || authContext.user?.id || 'd1',
        driverName: user?.name || authContext.user?.name || 'Winch Driver',
        vehicle: 'Flatbed Heavy-Duty',
        price: 500,
        lat: coords?.lat,
        lng: coords?.lng
      });
    }
  }, [winchSocket, isWinchOnline, isWinchBusy, coords, user?.id, authContext.user?.id, user?.name, authContext.user?.name]);

  useEffect(() => {
    // Winch Timer countdown
    if (activeWinchRequest && winchRequestTimer > 0) {
      const timer = setInterval(() => setWinchRequestTimer(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (winchRequestTimer === 0 && activeWinchRequest) {
      setActiveWinchRequest(null); // Timeout logic
    }
  }, [winchRequestTimer, activeWinchRequest]);


  // --- Navigation Helpers ---
  useEffect(() => {
    const newView = getViewFromPath(location.pathname, authContext.user?.role || user.role);
    if (newView !== view) {
      setView(newView);
      setHistory(prev => {
        if (prev.length > 1 && prev[prev.length - 2] === newView) {
          return prev.slice(0, -1);
        } else {
          return [...prev, newView];
        }
      });
    }
  }, [location.pathname, authContext.user?.role, user.role, view]);

  const navigate = (newView: View) => {
    setHistory([...history, newView]);
    setView(newView);
    routerNavigate(getPathFromView(newView));
  };

  const goBack = () => {
    if (history.length > 1) {
      routerNavigate(-1);
    } else {
      const currentRole = authContext.user?.role || user.role;
      let defaultView = View.HOME;
      if (currentRole === 'WINCH_DRIVER') defaultView = View.WINCH_DASHBOARD;
      if (currentRole === 'WORKSHOP_OWNER') defaultView = View.WORKSHOP_DASHBOARD;
      if (currentRole === 'ADMIN') defaultView = View.ADMIN_DASHBOARD;
      
      if (view !== defaultView) {
        navigate(defaultView);
      }
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Utility Functions ---

  // --- Utility Functions ---

  // Helper to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // remove data:mime;base64,
      };
      reader.readAsDataURL(blob);
    });
  };

  // Chat & AI Multimodal Logic
  const handleSendMessage = async (media?: MediaInput) => {
    if (!input.trim() && !media) return;

    let displayText = input;
    if (media) displayText = media.mimeType.startsWith('image') ? `[Image Sent] ${input}` : `[Audio Sent] ${input}`;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: displayText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: 'user', content: userMsg.text, mediaType: media?.mimeType, mediaData: media?.data })
      }).catch(console.error);
    }
    setIsTyping(true);

    // Call Gemini Service
    const aiData = await diagnoseCarIssue(userMsg.text, media, chatLanguage);
    const cleanText = aiData.reply.trim();

    setIsTyping(false);
    
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: cleanText, action: aiData.action }]);

    if (token) {
      fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: 'model', content: cleanText })
      }).catch(console.error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await blobToBase64(file);
      handleSendMessage({ mimeType: file.type, data: base64 });
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type: actualMimeType });
          const base64 = await blobToBase64(blob);
          handleSendMessage({ mimeType: actualMimeType, data: base64 });
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic error:", err);
        alert("Could not access microphone. Check permissions.");
      }
    }
  };

  // Winch Request Logic (Customer Side) — Real Socket.IO
  useEffect(() => {
    if (winchSocketRef.current) {
      if (!winchSocket) {
        setWinchSocket(winchSocketRef.current);
      }
    } else {
      // Setup global socket for winch features
      const socket = io(API_URL, { withCredentials: true });
      winchSocketRef.current = socket;
      setWinchSocket(socket);
      
      socket.on('connect', () => {
        const userId = user?.id || authContext.user?.id;
        if (userId) socket.emit('register_user', userId);
      });

      socket.on('booking_started', (data: { bookingId: string }) => {
        setLiveBookingId(data.bookingId);
        setIsWinchBusy(true); // driver view
        navigate(View.WINCH_LIVE_MAP);
      });

      socket.on('booking_completed', () => {
        // Refresh profile and wallet
        authContext.refreshUser();
        
        const currentRole = user?.role || authContext.user?.role;
        if (currentRole === 'WINCH_DRIVER') {
          alert('Your ride is completed!');
          setLiveBookingId(null);
          setIsWinchBusy(false);
          setWinchStatus('idle');
          setActiveWinchRequest(null);
          navigate(View.WINCH_DASHBOARD);
        } else {
          // For customer, let WinchLiveUser handle displaying the receipt modal.
          // Once they click "Done" in the receipt, WinchLiveUser calls onBack() which sets liveBookingId to null and view to HOME.
          setIsWinchBusy(false);
          setWinchStatus('idle');
          setActiveWinchRequest(null);
        }
      });
    }
  }, [user, isWinchOnline, winchSocket, authContext.user]);

  // Reactive register_user emit when user changes
  useEffect(() => {
    const socket = winchSocket;
    const userId = user?.id || authContext.user?.id;
    if (socket && userId) {
      socket.emit('register_user', userId);
    }
  }, [user?.id, authContext.user?.id, winchSocket]);

  // Listen for user appointment updates
  useEffect(() => {
    if (winchSocket) {
      const handleApptUpdate = (updated: any) => {
        setWorkshopAppointments(prev => prev.map(a => a.id === updated.id ? { ...a, status: updated.status, progress: updated.progress } : a));
        // Only alert the user if they are not the workshop owner (workshop owners already get updates)
        const currentRole = user?.role || authContext.user?.role;
        if (currentRole !== 'WORKSHOP_OWNER') {
          alert(`🚗 Workshop Update: Your car is now in ${updated.status}!`);
        }
      };

      winchSocket.on('appointment_updated', handleApptUpdate);

      return () => {
        winchSocket.off('appointment_updated', handleApptUpdate);
      };
    }
  }, [winchSocket, user?.role, authContext.user?.role]);

  // Workshop Real-time Socket.IO synchronization
  useEffect(() => {
    const socket = winchSocket;
    const currentRole = user?.role || authContext.user?.role;
    
    if (socket && currentRole === 'WORKSHOP_OWNER' && token) {
      // Fetch my workshop details to get workshop ID
      const loadMyWorkshop = async () => {
        try {
          const res = await fetch(`${API_URL}/api/workshops`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const list = await res.json();
            const mine = list.find((w: any) => w.ownerId === (user?.id || authContext.user?.id));
            if (mine) {
              setMyWorkshopId(mine.id);
              socket.emit('join_workshop_room', mine.id);
              console.log(`Joined workshop room: workshop_${mine.id}`);
            }
          }
        } catch (err) {
          console.log('Error loading owner workshop details:', err);
        }
      };

      loadMyWorkshop();

      // Listen for real-time bookings
      socket.on('new_booking', (newBooking: any) => {
        console.log('Received real-time booking event:', newBooking);
        alert(`🔔 New Booking Received: ${newBooking.customerName} - ${newBooking.serviceType} at ${newBooking.time}`);
        
        // Map to display structure
        const mappedBooking = {
          id: newBooking.id,
          customerName: newBooking.customerName || 'Customer',
          carDetails: newBooking.carDetails || 'Car',
          serviceType: newBooking.serviceType || 'Inspection',
          time: `${newBooking.date} ${newBooking.time}`,
          status: newBooking.status || 'Pending',
          price: newBooking.price || 450
        };

        setWorkshopAppointments(prev => [mappedBooking, ...prev]);
        fetchAppointments(); // also pull full sync to be sure
      });

      socket.on('appointment_updated', (updated: any) => {
        setWorkshopAppointments(prev => prev.map(a => a.id === updated.id ? { ...a, status: updated.status } : a));
      });

      return () => {
        if (myWorkshopId) {
          socket.emit('leave_workshop_room', myWorkshopId);
        }
        socket.off('new_booking');
        socket.off('appointment_updated');
      };
    }
  }, [winchSocket, user?.role, authContext.user?.role, token, myWorkshopId]);

  // Cancel any ongoing radius expansion timer
  const cancelRadiusSearch = () => {
    if (radiusSearchTimerRef.current) {
      clearInterval(radiusSearchTimerRef.current);
      radiusSearchTimerRef.current = null;
    }
    searchRadiusStepRef.current = 0;
    setSearchRadius(RADIUS_STEPS[0]);
  };

  const requestWinch = () => {
    setWinchStatus('searching');
    setActiveOffers([]);
    navigate(View.WINCH_NEGOTIATION);

    const socket = winchSocketRef.current;
    if (!socket) return;

    // Clean up old listeners
    socket.off('drivers_updated');
    socket.off('booking_confirmed');
    socket.off('request_declined');
    socket.off('driver_unavailable');
    socket.off('driver_countered');
    cancelRadiusSearch();

    const userLat = pickupCoords?.lat || coords?.lat;
    const userLng = pickupCoords?.lng || coords?.lng;

    // ── Core poll function — emits get_drivers with proximity data ──────────
    const pollDrivers = (radiusKm: number) => {
      socket.emit('get_drivers', userLat && userLng ? { lat: userLat, lng: userLng, radius: radiusKm } : undefined);
    };

    // ── Progressive radius expansion logic ───────────────────────────────────
    const startProgressiveSearch = () => {
      searchRadiusStepRef.current = 0;
      const initialRadius = RADIUS_STEPS[0];
      setSearchRadius(initialRadius);
      pollDrivers(initialRadius);

      // Every 60 seconds, expand radius to next step
      radiusSearchTimerRef.current = setInterval(() => {
        const nextStep = searchRadiusStepRef.current + 1;

        if (nextStep >= RADIUS_STEPS.length) {
          // Exhausted all radius steps → no drivers
          clearInterval(radiusSearchTimerRef.current!);
          radiusSearchTimerRef.current = null;
          searchRadiusStepRef.current = 0;
          setSearchRadius(RADIUS_STEPS[0]);
          setWinchStatus('no_drivers');
          return;
        }

        searchRadiusStepRef.current = nextStep;
        const nextRadius = RADIUS_STEPS[nextStep];
        setSearchRadius(nextRadius);
        pollDrivers(nextRadius);
      }, 60_000);
    };

    // ── Listen for driver list updates ───────────────────────────────────────
    socket.on('drivers_updated', (drivers: any[]) => {
      if (drivers.length > 0) {
        // Found drivers — stop expanding
        cancelRadiusSearch();
        const mapped: WinchOffer[] = drivers.map((d: any) => ({
          id: d.socketId,
          driverName: d.driverName,
          price: tripPrice || d.price || 500,
          eta: d.distanceStr ? `~${Math.ceil(((d.distanceKm ?? 5) / 30) * 60)} min` : '~10 min',
          rating: 4.8,
          vehicle: d.vehicle || 'Winch Truck',
          status: 'pending' as const,
          driverId: d.driverId,
          driverSocketId: d.socketId,
          distance: d.distanceStr,
        }));
        setActiveOffers(mapped);
        setWinchStatus('negotiating');
      }
      // If 0 drivers, keep searching — the interval will expand radius
    });

    socket.on('booking_confirmed', (data: { bookingId: string; driverName: string; vehicle: string; price: number }) => {
      cancelRadiusSearch();
      setLiveBookingId(data.bookingId);
      setWinchStatus('confirmed');
      navigate(View.WINCH_LIVE_MAP);
    });

    // booking_completed is handled globally now

    socket.on('request_declined', (data: { message: string }) => {
      alert(data.message);
      // Re-poll at the current radius level
      pollDrivers(RADIUS_STEPS[searchRadiusStepRef.current]);
      setWinchStatus('searching');
    });

    socket.on('driver_unavailable', (data: { message: string }) => {
      alert(data.message);
      pollDrivers(RADIUS_STEPS[searchRadiusStepRef.current]);
    });

    socket.on('driver_countered', (data: { driverId: string; price: number; driverName?: string; vehicle?: string; eta?: string }) => {
      cancelRadiusSearch(); // stop the progressive search loop
      setActiveOffers(prev => {
        const exists = prev.find(o => o.id === data.driverId || (o as any).driverSocketId === data.driverId);
        if (exists) {
          // Update price on existing offer
          return prev.map(o =>
            (o.id === data.driverId || (o as any).driverSocketId === data.driverId)
              ? { ...o, price: data.price }
              : o
          );
        }
        // No existing offer — add as new offer from this driver
        return [...prev, {
          id: data.driverId,
          driverName: data.driverName || 'Driver',
          price: data.price,
          eta: data.eta || '~10 min',
          rating: 4.8,
          vehicle: data.vehicle || 'Winch Truck',
          status: 'pending' as const,
          driverId: data.driverId,
          driverSocketId: data.driverId,
        }];
      });
      setWinchStatus('negotiating'); // switch user to the negotiating screen
      alert('A driver has sent you a price offer! Review it below.');
    });

    // Kick off the progressive search
    startProgressiveSearch();
  };

  const adjustOfferPrice = (offerId: string, delta: number) => {
    setActiveOffers(prev => prev.map(offer => {
      if (offer.id === offerId) {
        return { ...offer, price: Math.max(100, offer.price + delta) };
      }
      return offer;
    }));
  };

  const handleCounterOffer = (offerId: string) => {
    const offer = activeOffers.find(o => o.id === offerId);
    if (!offer) return;
    const socket = winchSocketRef.current;
    const userId = user?.id || authContext.user?.id;
    if (!socket || !userId) return;

    socket.emit('customer_counter_offer', {
      driverSocketId: (offer as any).driverSocketId || offer.id,
      customerId: userId,
      price: offer.price,
    });

    alert(`Counter offer of ${offer.price} EGP sent to driver. Waiting for their response...`);
  };

  const handleRejectOffer = (offerId: string) => {
    setActiveOffers(prev => prev.map(offer => {
      if (offer.id === offerId) {
        return { ...offer, status: 'rejected' };
      }
      return offer;
    }));
  };

  const handleAcceptOffer = (offer: WinchOffer) => {
    const socket = winchSocketRef.current;
    const userId = user?.id || authContext.user?.id;
    if (!socket || !userId) return;
    setWinchStatus('searching'); // show searching while driver confirms

    const carName = [user.carYear, user.carBrand, user.carModel].filter(Boolean).join(' ') || 'My Car';

    // ── Always get a fresh GPS fix before sending to the driver ──────────────
    const sendRequest = (pickLat: number, pickLng: number) => {
      // Persist as current coords so all subsequent operations use the real location
      setCoords({ lat: pickLat, lng: pickLng });
      if (!pickupCoords) setPickupCoords({ lat: pickLat, lng: pickLng });

      socket.emit('request_driver', {
        customerId: userId,
        customerName: user.name || authContext.user?.name || 'Customer',
        driverSocketId: (offer as any).driverSocketId || offer.id,
        car: carName,
        issue: `Winch from ${pickupAddress || 'current location'} to ${dropoffAddress || 'destination'} (${tripDistance || 0} km)`,
        price: offer.price,
        lat: pickLat,
        lng: pickLng,
        pickupLat: pickLat,
        pickupLng: pickLng,
        dropoffLat: dropoffCoords?.lat,
        dropoffLng: dropoffCoords?.lng,
        pickupAddress,
        dropoffAddress,
        tripDistance
      });
    };

    const bestKnownLat = pickupCoords?.lat || coords?.lat;
    const bestKnownLng = pickupCoords?.lng || coords?.lng;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendRequest(pos.coords.latitude, pos.coords.longitude),
        () => {
          // GPS denied/timeout — use best available coords
          if (bestKnownLat && bestKnownLng) {
            sendRequest(bestKnownLat, bestKnownLng);
          } else {
            alert('Could not get your location. Please pin your pickup location on the map first.');
            setWinchStatus('negotiating');
          }
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
      );
    } else if (bestKnownLat && bestKnownLng) {
      sendRequest(bestKnownLat, bestKnownLng);
    } else {
      alert('Location not available. Please pin your pickup location on the map first.');
      setWinchStatus('negotiating');
    }
  };


  // Workshop Booking Logic
  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot) {
      alert("Please select a time slot for your appointment.");
      return;
    }
    if (selectedWorkshop) {
      const isE2E = navigator.userAgent.includes('Headless');
      const d = isE2E ? new Date('2026-10-12T00:00:00') : new Date();
      d.setDate(d.getDate() + selectedDateIndex);
      const bookingDate = d.toISOString().split('T')[0];

      const priceVal = selectedWorkshop.priceEstimate === '$$' ? 450 : 850;
      const carInfo = `${user.carBrand || 'My Car'} ${user.carModel || ''}`;

      try {
        const tokenVal = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/workshops/${selectedWorkshop.id}/book`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenVal}`
          },
          body: JSON.stringify({
            serviceType: 'General Inspection',
            date: bookingDate,
            time: selectedTimeSlot,
            carDetails: carInfo,
            price: priceVal,
            paymentMethod: paymentMethod
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to book appointment on backend');
        }

        await fetchAppointments();
        navigate(View.SUCCESS);
      } catch (error: any) {
        console.error('Error booking appointment:', error);
        alert(error.message || 'Could not book appointment. Please try again.');
      }
    }
  };

  // Winch Dashboard Logic (Driver Side)
  const handleWinchAccept = () => {
    const socket = winchSocketRef.current;
    if (activeWinchRequest && socket && user) {
      socket.emit('accept_request', {
        customerSocketId: (activeWinchRequest as any).customerSocketId,
        customerId: activeWinchRequest.id,
        driverId: user.id,
        driverName: user.name || 'Winch Driver',
        vehicle: 'Flatbed Heavy-Duty',
        price: activeWinchRequest.price,
      });
      setActiveWinchRequest(null);
      setIsWinchBusy(true);
      // Let backend trigger 'booking_started'
    }
  };

  const handleWinchDecline = () => {
    const socket = winchSocketRef.current;
    if (activeWinchRequest && socket) {
      socket.emit('decline_request', { customerSocketId: (activeWinchRequest as any).customerSocketId });
    }
    setActiveWinchRequest(null);
  };


  const handleWinchWithdraw = () => {
    if (user.walletBalance > 0) {
      alert(`Withdrawal request for ${user.walletBalance} EGP sent to your bank.`);
      setUser(prev => ({ ...prev, walletBalance: 0 }));
    } else {
      alert("Insufficient funds.");
    }
  };

  // Workshop Dashboard Logic (Owner Side)
  const handleWorkshopAction = async (id: string, action: 'Check-In' | 'Reschedule' | 'Accept' | 'Decline' | 'Complete') => {
    const tokenVal = localStorage.getItem('token');
    if (!tokenVal) return;

    let newStatus: string | null = null;
    if (action === 'Accept') newStatus = 'Confirmed';
    if (action === 'Decline') newStatus = 'Cancelled';
    if (action === 'Check-In') newStatus = 'Checked-In';
    if (action === 'Complete') newStatus = 'Completed';

    if (newStatus) {
      try {
        const response = await fetch(`${API_URL}/api/workshops/appointments/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenVal}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) {
          throw new Error('Failed to update status on backend');
        }
      } catch (error) {
        console.error('Error updating appointment status:', error);
        alert('Could not update status. Please try again.');
        return;
      }
    }

    setWorkshopAppointments(prev => prev.map(appt => {
      if (appt.id !== id) return appt;

      if (action === 'Check-In') {
        // Add to wallet & Start Tracking
        setUser(userPrev => ({ ...userPrev, walletBalance: userPrev.walletBalance + appt.price }));
        setCarsInWorkshop(prevCars => [...prevCars, { id: Date.now().toString(), model: appt.carDetails, plate: 'NEW 123', status: 'Diagnostics', progress: 0 }]);
        return { ...appt, status: 'Checked-In' as const };
      }
      if (action === 'Reschedule') {
        alert(`Rescheduling request sent for ${appt.customerName}`);
        return appt;
      }
      if (action === 'Accept') {
        return { ...appt, status: 'Confirmed' as const };
      }
      if (action === 'Decline') {
        return { ...appt, status: 'Cancelled' as const };
      }
      if (action === 'Complete') {
        return { ...appt, status: 'Completed' as const };
      }
      return appt;
    }));
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
        // Also update locally for instant feedback
        setWorkshopAppointments(prev => prev.map(a => 
          a.id === id ? { ...a, progress: newProgress, status: newProgress >= 100 ? 'Ready' : a.status === 'Checked-In' && newProgress >= 25 ? 'Repairing' : a.status === 'Repairing' && newProgress >= 75 ? 'Quality Check' : a.status } : a
        ));
      } else {
        throw new Error('Failed to update progress');
      }
    } catch (err) {
      alert('Could not update status. Please try again.');
    }
  };

  const handleWorkshopWithdraw = () => {
    if (user.walletBalance > 0) {
      alert(`Withdrawal request for ${user.walletBalance} EGP sent to bank.`);
      setUser(prev => ({ ...prev, walletBalance: 0 }));
    }
  };

  // ── Wallet Top-Up Handler ─────────────────────────────────────────────────────
  const handleTopUp = async (amount: number) => {
    const tokenVal = localStorage.getItem('token');
    if (!tokenVal) return;
    setTopUpLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenVal}` },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, walletBalance: data.newBalance }));
        authContext.refreshUser();
        setShowTopUpModal(false);
        setTopUpAmount('');
        alert(`✅ ${amount} EGP added to your wallet!`);
      } else {
        const err = await res.json();
        alert(err.error || 'Top-up failed');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setTopUpLoading(false);
    }
  };

  // ── Fetch Available Booking Slots ──────────────────────────────────────────────
  const fetchAvailableSlots = async (workshopId: string, dateStr: string) => {
    setSlotsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workshops/${workshopId}/available-slots?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.bookedSlots || []);
      }
    } catch {
      setBookedSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const fallbackToBackendPricing = async (pickup: {lat: number, lng: number}, drop: {lat: number, lng: number}) => {
    try {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/wallet/calculate-trip-price`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(tokenVal && { 'Authorization': `Bearer ${tokenVal}` })
        },
        body: JSON.stringify({ pickupLat: pickup.lat, pickupLng: pickup.lng, dropLat: drop.lat, dropLng: drop.lng, ratePerKm: 20 })
      });
      if (res.ok) {
        const data = await res.json();
        setTripDistance(data.distanceKm);
        setTripPrice(Math.max(150, data.price));
      }
    } catch {
      // silent fail
    }
  };

  const calculateTripPrice = async (pickup: {lat: number, lng: number}, drop: {lat: number, lng: number}) => {
    try {
      if (window.google && window.google.maps) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: pickup,
            destination: drop,
            travelMode: window.google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result && result.routes[0]) {
              const distanceMeters = result.routes[0].legs[0].distance?.value || 0;
              const distanceKm = distanceMeters / 1000;
              const price = Math.max(150, Math.ceil(distanceKm * 20));
              setTripDistance(Math.round(distanceKm * 10) / 10);
              setTripPrice(price);
            } else {
              fallbackToBackendPricing(pickup, drop);
            }
          }
        );
      } else {
        fallbackToBackendPricing(pickup, drop);
      }
    } catch {
      fallbackToBackendPricing(pickup, drop);
    }
  };

  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      calculateTripPrice(pickupCoords, dropoffCoords);
    } else {
      setTripDistance(null);
      setTripPrice(null);
    }
  }, [pickupCoords, dropoffCoords]);

  // ── Top-Up Modal Renderer ──────────────────────────────────────────────────────
  const renderTopUpModal = () => (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm" id="topup-modal">
      <div className="w-full max-w-md bg-white dark:bg-cyber-900 rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
        <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Add Funds</h3>
        <p className="text-sm text-gray-500 mb-6">Choose a preset amount or enter a custom value</p>

        {/* Quick select amounts */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[50, 100, 200, 500].map(amt => (
            <button
              key={amt}
              onClick={() => setTopUpAmount(String(amt))}
              className={`py-3 rounded-xl font-bold text-sm transition-all border ${topUpAmount === String(amt) ? 'bg-cyber-primary text-white border-cyber-primary' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-slate-700 dark:text-white hover:border-cyber-primary'}`}
            >
              {amt} EGP
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <input
            type="number"
            placeholder="Custom amount..."
            value={topUpAmount}
            onChange={e => setTopUpAmount(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyber-primary text-sm"
            id="topup-amount-input"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">EGP</span>
        </div>

        <button
          onClick={() => {
            const amt = Number(topUpAmount);
            if (amt > 0) handleTopUp(amt);
          }}
          disabled={topUpLoading || !topUpAmount || Number(topUpAmount) <= 0}
          className="w-full py-4 bg-gradient-to-r from-cyber-primary to-blue-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
          id="confirm-topup-btn"
        >
          {topUpLoading ? 'Processing...' : `Add ${topUpAmount ? `${topUpAmount} EGP` : 'Funds'}`}
        </button>

        <button
          onClick={() => { setShowTopUpModal(false); setTopUpAmount(''); }}
          className="w-full mt-3 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderBookingDetailsModal = () => {
    if (!selectedBookingForDetails) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm" id="booking-details-modal">
        <div className="w-full max-w-md bg-white dark:bg-cyber-900 rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
          <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-4">Appointment Details</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <span className="text-gray-500 text-sm">Service</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedBookingForDetails.serviceName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <span className="text-gray-500 text-sm">Date & Time</span>
              <span className="font-medium text-slate-900 dark:text-white">{selectedBookingForDetails.date}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <span className="text-gray-500 text-sm">Status</span>
              <span className="font-bold text-cyber-primary">{selectedBookingForDetails.status}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <span className="text-gray-500 text-sm">Price</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedBookingForDetails.price}</span>
            </div>
            {selectedBookingForDetails.address && (
              <div className="flex flex-col border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-gray-500 text-sm mb-1">Location</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">{selectedBookingForDetails.address}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedBookingForDetails(null)}
            className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  };


  // --- Render Functions (Screens) ---


  const renderThemeToggle = (extraClasses = "") => (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full glass-panel text-cyber-primary hover:bg-cyber-primary/10 transition-colors ${extraClasses}`}
      title="Toggle Theme"
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );

  const renderOnboarding = () => (
    <div className={`flex flex-col h-screen bg-cover bg-center transition-all duration-500 ${isDarkMode ? "bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80')]" : "bg-[url('https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&q=80')]"}`}>
      <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-cyber-900 via-cyber-900/90 to-cyber-900/40' : 'from-slate-100 via-slate-100/90 to-slate-100/40'}`} />

      {renderThemeToggle("absolute top-6 right-6 z-50")}

      <div className="relative z-10 flex flex-col items-center justify-end h-full p-8 pb-12">
        <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-cyber-accent flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)] animate-float">
          <Car className="text-white w-10 h-10" />
        </div>
        <h1 className={`text-4xl font-display font-bold mb-2 text-center neon-text ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Auto-Care AI</h1>
        <p className={`text-center mb-8 font-light ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
          Experience the future of automotive care.
        </p>
        <button
          onClick={() => navigate(View.LOGIN)}
          className="w-full bg-cyber-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2"
        >
          Get Started <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  // --- AUTHENTICATION FLOWS ---

  const renderLogin = () => {
    const validateLoginForm = () => {
      const errs: { email?: string; password?: string } = {};
      const ev = validateEmail(loginEmail);
      if (!ev.valid) errs.email = ev.message;
      const pv = { valid: loginPassword.length > 0, message: loginPassword ? '' : 'Password is required' };
      if (!pv.valid) errs.password = pv.message;
      return errs;
    };

    const handleLoginSubmit = async () => {
      setLoginTouched({ email: true, password: true });
      const errs = validateLoginForm();
      setLoginErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setLoginLoading(true);
      setLoginError('');
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
        });
        const data = await res.json();
        if (res.ok) {
          authContext.login(data.token, data.user);
          // Role-based redirect is handled by the useEffect watching authUser
        } else {
          setLoginError(data.error || 'Login failed. Please try again.');
        }
      } catch {
        setLoginError('Cannot connect to server. Please check your connection.');
      } finally {
        setLoginLoading(false);
      }
    };

    const loginFormValid = Object.keys(validateLoginForm()).length === 0;

    return (
      <div className="flex flex-col h-screen p-6 pt-20">
        {renderThemeToggle("absolute top-6 right-6 z-50")}
        <button onClick={goBack} className="absolute top-6 left-6 p-2 rounded-full glass-panel text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft size={20} /></button>

        <h2 className="text-3xl font-display font-bold mb-2">Welcome Back</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Sign in to your dashboard.</p>

        {loginError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 mb-4 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Email */}
          <div>
            <div className={`rounded-xl p-1 border transition-colors ${loginTouched.email && loginErrors.email ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input
                type="email"
                placeholder="Email Address"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (loginTouched.email) setLoginErrors(prev => ({ ...prev, email: validateEmail(e.target.value).message || undefined }));
                }}
                onBlur={() => { setLoginTouched(p => ({ ...p, email: true })); setLoginErrors(p => ({ ...p, email: validateEmail(loginEmail).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
                autoComplete="email"
              />
            </div>
            {loginTouched.email && loginErrors.email && (
              <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {loginErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className={`rounded-xl p-1 border transition-colors flex items-center ${loginTouched.password && loginErrors.password ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input
                type={loginShowPwd ? 'text' : 'password'}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onBlur={() => { setLoginTouched(p => ({ ...p, password: true })); setLoginErrors(p => ({ ...p, password: loginPassword ? undefined : 'Password is required' })); }}
                className="flex-1 bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
              />
              <button type="button" onClick={() => setLoginShowPwd(!loginShowPwd)} className="pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label={loginShowPwd ? 'Hide password' : 'Show password'}>
                {loginShowPwd ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            {loginTouched.password && loginErrors.password && (
              <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {loginErrors.password}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={() => navigate(View.FORGOT_PASSWORD)} className="text-sm text-cyber-primary">Forgot Password?</button>
          </div>

          <button
            onClick={handleLoginSubmit}
            disabled={loginLoading}
            className="w-full mt-6 bg-gradient-to-r from-cyber-primary to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loginLoading ? <><RefreshCw size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>

          <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
            Don't have an account? <button onClick={() => navigate(View.SIGN_UP)} className="text-cyber-primary font-bold">Sign Up</button>
          </p>
        </div>
      </div>
    );
  };

  const renderSignUp = () => {
    const validateSignupForm = () => {
      const errs: { email?: string; password?: string; confirm?: string } = {};
      const ev = validateEmail(signupEmail);
      if (!ev.valid) errs.email = ev.message;
      const pv = validatePassword(signupPassword);
      if (!pv.valid) errs.password = pv.message;
      const cv = validatePasswordMatch(signupPassword, signupConfirm);
      if (!cv.valid) errs.confirm = cv.message;
      return errs;
    };

    const handleSignupSubmit = async () => {
      setSignupTouched({ email: true, password: true, confirm: true });
      const errs = validateSignupForm();
      setSignupErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setSignupLoading(true);
      setSignupError('');
      try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: signupEmail.trim(), password: signupPassword, role: 'USER' })
        });
        const data = await res.json();
        if (res.ok) {
          authContext.login(data.token, data.user);
          navigate(View.USER_DETAILS);
        } else {
          setSignupError(data.error || 'Registration failed. Please try again.');
        }
      } catch {
        setSignupError('Cannot connect to server.');
      } finally {
        setSignupLoading(false);
      }
    };

    const signupFormValid = Object.keys(validateSignupForm()).length === 0;

    return (
      <div className="flex flex-col h-screen p-6 pt-20 overflow-y-auto">
        {renderThemeToggle("absolute top-6 right-6 z-50")}
        <button onClick={goBack} className="absolute top-6 left-6 p-2 rounded-full glass-panel text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft size={20} /></button>

        <h2 className="text-3xl font-display font-bold mb-2">Create Account</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Join the AI automotive network.</p>

        {signupError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 mb-4 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{signupError}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Email */}
          <div>
            <div className={`rounded-xl p-1 border ${signupTouched.email && signupErrors.email ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input
                type="email" placeholder="Email Address" value={signupEmail}
                onChange={(e) => { setSignupEmail(e.target.value); if (signupTouched.email) setSignupErrors(p => ({ ...p, email: validateEmail(e.target.value).message || undefined })); }}
                onBlur={() => { setSignupTouched(p => ({ ...p, email: true })); setSignupErrors(p => ({ ...p, email: validateEmail(signupEmail).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {signupTouched.email && signupErrors.email && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {signupErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className={`rounded-xl p-1 border flex items-center ${signupTouched.password && signupErrors.password ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input
                type={signupShowPwd ? 'text' : 'password'} placeholder="Password (min 8 chars, 1 uppercase, 1 number)" value={signupPassword}
                onChange={(e) => { setSignupPassword(e.target.value); if (signupTouched.password) setSignupErrors(p => ({ ...p, password: validatePassword(e.target.value).message || undefined })); }}
                onBlur={() => { setSignupTouched(p => ({ ...p, password: true })); setSignupErrors(p => ({ ...p, password: validatePassword(signupPassword).message || undefined })); }}
                className="flex-1 bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
              <button type="button" onClick={() => setSignupShowPwd(!signupShowPwd)} className="pr-4 text-gray-400" aria-label={signupShowPwd ? 'Hide password' : 'Show password'}>
                {signupShowPwd ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            {signupTouched.password && signupErrors.password && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {signupErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <div className={`rounded-xl p-1 border ${signupTouched.confirm && signupErrors.confirm ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input
                type="password" placeholder="Confirm Password" value={signupConfirm}
                onChange={(e) => { setSignupConfirm(e.target.value); if (signupTouched.confirm) setSignupErrors(p => ({ ...p, confirm: validatePasswordMatch(signupPassword, e.target.value).message || undefined })); }}
                onBlur={() => { setSignupTouched(p => ({ ...p, confirm: true })); setSignupErrors(p => ({ ...p, confirm: validatePasswordMatch(signupPassword, signupConfirm).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {signupTouched.confirm && signupErrors.confirm && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {signupErrors.confirm}</p>}
            {signupTouched.confirm && !signupErrors.confirm && signupConfirm && <p className="text-green-500 text-xs mt-1 ml-2 flex items-center gap-1"><CheckCircle size={12} /> Passwords match</p>}
          </div>

          <button
            onClick={handleSignupSubmit}
            disabled={signupLoading || !signupFormValid}
            className="w-full mt-6 bg-gradient-to-r from-cyber-primary to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {signupLoading ? <><RefreshCw size={18} className="animate-spin" /> Creating Account...</> : 'Continue'}
          </button>
        </div>
        <p className="mt-auto text-center text-gray-500 dark:text-gray-400 pb-6">
          Already have an account? <button onClick={() => navigate(View.LOGIN)} className="text-cyber-primary font-bold">Sign In</button>
        </p>
      </div>
    );
  };

  const renderForgotPassword = () => (
    <div className="flex flex-col h-screen p-6 pt-20">
      <button onClick={goBack} className="absolute top-6 left-6 p-2 rounded-full glass-panel text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft size={20} /></button>
      <h2 className="text-3xl font-display font-bold mb-2">Reset Password</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-10">Enter your email to receive a reset link.</p>

      <div className="glass-panel rounded-xl p-1 mb-6">
        <input type="email" placeholder="Email Address" className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500" />
      </div>

      <button
        onClick={() => { alert('Reset link sent!'); navigate(View.LOGIN); }}
        className="w-full bg-cyber-primary text-white font-bold py-4 rounded-xl shadow-lg"
      >
        Send Reset Link
      </button>
    </div>
  );

  const renderUserDetails = () => {
    const validateDetails = () => {
      const errs: { name?: string; phone?: string; gender?: string; dob?: string } = {};
      const nv = validateName(user.name);
      if (!nv.valid) errs.name = nv.message;
      const phv = validatePhone(user.phone);
      if (!phv.valid) errs.phone = phv.message;
      if (!user.gender) errs.gender = 'Please select your gender';
      const dobv = validateDOB(user.dob);
      if (!dobv.valid) errs.dob = dobv.message;
      return errs;
    };

    const handleSaveDetails = async () => {
      setDetailsTouched({ name: true, phone: true, gender: true, dob: true });
      const errs = validateDetails();
      setDetailsErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setDetailsSaving(true);
      try {
        const tokenVal = localStorage.getItem('token');
        if (tokenVal) {
          await fetch(`${API_URL}/api/auth/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenVal}` },
            body: JSON.stringify({ name: user.name, phone: user.phone, gender: user.gender, dob: user.dob })
          });
        }
      } catch { /* continue even if patch fails */ }
      setDetailsSaving(false);
      navigate(View.ROLE_SELECTION);
    };

    const detailsFormValid = Object.keys(validateDetails()).length === 0;

    return (
      <div className="flex flex-col h-screen p-6 pt-12 overflow-y-auto">
        <button onClick={goBack} className="mb-6 w-10 h-10 flex items-center justify-center rounded-full glass-panel text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-display font-bold mb-2">Personal Details</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Please complete your profile. All fields are required.</p>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <div className={`rounded-xl p-1 border ${detailsTouched.name && detailsErrors.name ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="text" placeholder="Full Name *" value={user.name}
                onChange={(e) => { setUser({ ...user, name: e.target.value }); if (detailsTouched.name) setDetailsErrors(p => ({ ...p, name: validateName(e.target.value).message || undefined })); }}
                onBlur={() => { setDetailsTouched(p => ({ ...p, name: true })); setDetailsErrors(p => ({ ...p, name: validateName(user.name).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {detailsTouched.name && detailsErrors.name && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {detailsErrors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <div className={`rounded-xl p-1 border ${detailsTouched.phone && detailsErrors.phone ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="tel" placeholder="Egyptian Phone Number * (e.g. 01012345678)" value={user.phone}
                onChange={(e) => { setUser({ ...user, phone: e.target.value }); if (detailsTouched.phone) setDetailsErrors(p => ({ ...p, phone: validatePhone(e.target.value).message || undefined })); }}
                onBlur={() => { setDetailsTouched(p => ({ ...p, phone: true })); setDetailsErrors(p => ({ ...p, phone: validatePhone(user.phone).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {detailsTouched.phone && detailsErrors.phone && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {detailsErrors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <div className={`rounded-xl p-1 border ${detailsTouched.gender && detailsErrors.gender ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
                <select value={user.gender}
                  onChange={(e) => { setUser({ ...user, gender: e.target.value as any }); setDetailsTouched(p => ({ ...p, gender: true })); setDetailsErrors(p => ({ ...p, gender: e.target.value ? undefined : 'Required' })); }}
                  onBlur={() => { setDetailsTouched(p => ({ ...p, gender: true })); setDetailsErrors(p => ({ ...p, gender: user.gender ? undefined : 'Required' })); }}
                  className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white appearance-none" title="Gender" aria-label="Gender"
                >
                  <option value="" disabled>Gender *</option>
                  <option value="Male" className="text-black">Male</option>
                  <option value="Female" className="text-black">Female</option>
                  <option value="Other" className="text-black">Other</option>
                </select>
              </div>
              {detailsTouched.gender && detailsErrors.gender && <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1"><AlertTriangle size={12} /> {detailsErrors.gender}</p>}
            </div>

            {/* DOB */}
            <div>
              <div className={`rounded-xl p-1 border ${detailsTouched.dob && detailsErrors.dob ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
                <input type="date" value={user.dob}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  onChange={(e) => { setUser({ ...user, dob: e.target.value }); if (detailsTouched.dob) setDetailsErrors(p => ({ ...p, dob: validateDOB(e.target.value).message || undefined })); }}
                  onBlur={() => { setDetailsTouched(p => ({ ...p, dob: true })); setDetailsErrors(p => ({ ...p, dob: validateDOB(user.dob).message || undefined })); }}
                  className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
                  title="Date of Birth (must be 18+)" aria-label="Date of Birth"
                />
              </div>
              {detailsTouched.dob && detailsErrors.dob && <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1"><AlertTriangle size={12} /> {detailsErrors.dob}</p>}
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveDetails}
          disabled={detailsSaving || !detailsFormValid}
          className="w-full mt-8 bg-cyber-primary text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {detailsSaving ? <><RefreshCw size={18} className="animate-spin" /> Saving...</> : 'Next Step'}
        </button>
      </div>
    );
  };

  const renderRoleSelection = () => (
    <div className="flex flex-col h-screen p-6 pt-12">
      <h2 className="text-2xl font-display font-bold mb-2 text-center">Choose Your Path</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">How will you use Auto-Care AI?</p>

      <div className="space-y-4 flex-1">
        <button
          onClick={() => { setUser({ ...user, role: UserRole.USER }); navigate(View.SETUP_CAR); }}
          className="w-full glass-panel p-6 rounded-2xl flex items-center gap-4 hover:border-cyber-primary transition-all group text-left"
        >
          <div className="w-16 h-16 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary group-hover:scale-110 transition-transform">
            <User size={32} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Car Owner</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">I need diagnostics & services.</p>
          </div>
        </button>

        <button
          onClick={() => { setUser({ ...user, role: UserRole.WINCH_DRIVER, walletBalance: 1250 }); navigate(View.WINCH_ONBOARDING); }}
          className="w-full glass-panel p-6 rounded-2xl flex items-center gap-4 hover:border-cyber-primary transition-all group text-left"
        >
          <div className="w-16 h-16 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary group-hover:scale-110 transition-transform">
            <Truck size={32} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Winch Driver</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">I want to receive rescue orders.</p>
          </div>
        </button>

        <button
          onClick={() => { setUser({ ...user, role: UserRole.WORKSHOP_OWNER, walletBalance: 45001 }); navigate(View.WORKSHOP_ONBOARDING); }}
          className="w-full glass-panel p-6 rounded-2xl flex items-center gap-4 hover:border-cyber-primary transition-all group text-left"
        >
          <div className="w-16 h-16 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary group-hover:scale-110 transition-transform">
            <Briefcase size={32} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Workshop Owner</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">I want to list my garage.</p>
          </div>
        </button>
      </div>
    </div>
  );

  // --- ROLE SPECIFIC ONBOARDING ---

  const renderWinchOnboarding = () => {
    const validateWinch = () => {
      const errs: { plate?: string; license?: string; vehicleType?: string } = {};
      const pv = validatePlateNumber(winchPlate);
      if (!pv.valid) errs.plate = pv.message;
      const lv = validateNationalId(winchLicense);
      if (!lv.valid) errs.license = lv.message;
      if (!winchVehicleType) errs.vehicleType = 'Please select a winch type';
      return errs;
    };

    const handleCompleteWinch = () => {
      setWinchTouched({ plate: true, license: true, vehicleType: true });
      const errs = validateWinch();
      setWinchErrors(errs);
      if (Object.keys(errs).length > 0) return;
      setUser({ ...user, winchPlateNumber: winchPlate, driverLicense: winchLicense, vehicleType: winchVehicleType });
      navigate(View.WINCH_DASHBOARD);
    };

    const winchFormValid = Object.keys(validateWinch()).length === 0;

    return (
      <div className="flex flex-col h-screen p-6 overflow-y-auto">
        <button onClick={goBack} className="mt-6 mb-4 w-fit text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
        <h2 className="text-2xl font-display font-bold mb-2">Winch Registration</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">All fields are required to complete registration.</p>

        <div className="space-y-4">
          {/* Plate Number */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Vehicle Plate Number *</label>
            <div className={`rounded-xl p-1 border ${winchTouched.plate && winchErrors.plate ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="text" placeholder="e.g. ABC 1234" value={winchPlate}
                onChange={(e) => { setWinchPlate(e.target.value.toUpperCase()); if (winchTouched.plate) setWinchErrors(p => ({ ...p, plate: validatePlateNumber(e.target.value).message || undefined })); }}
                onBlur={() => { setWinchTouched(p => ({ ...p, plate: true })); setWinchErrors(p => ({ ...p, plate: validatePlateNumber(winchPlate).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500 uppercase"
                maxLength={8}
              />
            </div>
            {winchTouched.plate && winchErrors.plate && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {winchErrors.plate}</p>}
            {!winchErrors.plate && winchPlate && <p className="text-green-500 text-xs mt-1 ml-2 flex items-center gap-1"><CheckCircle size={12} /> Valid plate format</p>}
          </div>

          {/* National ID / License */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">National ID (14 digits) *</label>
            <div className={`rounded-xl p-1 border ${winchTouched.license && winchErrors.license ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="text" placeholder="14-digit National ID" value={winchLicense}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 14); setWinchLicense(v); if (winchTouched.license) setWinchErrors(p => ({ ...p, license: validateNationalId(v).message || undefined })); }}
                onBlur={() => { setWinchTouched(p => ({ ...p, license: true })); setWinchErrors(p => ({ ...p, license: validateNationalId(winchLicense).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
                inputMode="numeric"
              />
            </div>
            {winchTouched.license && winchErrors.license && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {winchErrors.license}</p>}
            {winchLicense && winchLicense.length === 14 && !winchErrors.license && <p className="text-green-500 text-xs mt-1 ml-2 flex items-center gap-1"><CheckCircle size={12} /> Valid ID</p>}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Winch Type *</label>
            <div className={`rounded-xl p-1 border ${winchTouched.vehicleType && winchErrors.vehicleType ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <select value={winchVehicleType}
                onChange={(e) => { setWinchVehicleType(e.target.value); setWinchTouched(p => ({ ...p, vehicleType: true })); setWinchErrors(p => ({ ...p, vehicleType: e.target.value ? undefined : 'Please select a winch type' })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white appearance-none" title="Winch Type" aria-label="Winch Type"
              >
                <option value="">Select Winch Type</option>
                <option value="Flatbed" className="text-black">Flatbed</option>
                <option value="Wheel-Lift" className="text-black">Wheel-Lift</option>
                <option value="Integrated" className="text-black">Integrated</option>
                <option value="Heavy-Duty" className="text-black">Heavy-Duty</option>
              </select>
            </div>
            {winchTouched.vehicleType && winchErrors.vehicleType && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {winchErrors.vehicleType}</p>}
          </div>

          <div className="glass-panel p-6 rounded-2xl border-dashed border-2 border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyber-primary transition-colors">
            <FileText className="text-cyber-primary" />
            <p className="text-sm text-gray-500">Upload License Photo (optional)</p>
          </div>
        </div>

        <button
          onClick={handleCompleteWinch}
          disabled={!winchFormValid}
          className="w-full mt-8 bg-cyber-primary text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Complete Registration
        </button>

        {!winchFormValid && winchTouched.plate && (
          <p className="text-center text-xs text-gray-500 mt-3">Please fill in all required fields correctly to continue.</p>
        )}
      </div>
    );
  };

  const renderWorkshopOnboarding = () => {
    const validateWorkshop = () => {
      const errs: { shopName?: string; location?: string; govLicense?: string } = {};
      const snv = validateShopName(wsShopName);
      if (!snv.valid) errs.shopName = snv.message;
      const lv = validateAddress(wsLocation);
      if (!lv.valid) errs.location = lv.message;
      const glv = validateGovLicense(wsGovLicense);
      if (!glv.valid) errs.govLicense = glv.message;
      return errs;
    };

    const handleOpenWorkshop = () => {
      setWsTouched({ shopName: true, location: true, govLicense: true });
      const errs = validateWorkshop();
      setWsErrors(errs);
      if (Object.keys(errs).length > 0) return;
      setUser({ ...user, shopName: wsShopName, shopLocation: wsLocation, govLicense: wsGovLicense, sparePartsBrands: wsBrands });
      navigate(View.WORKSHOP_DASHBOARD);
    };

    const wsFormValid = Object.keys(validateWorkshop()).length === 0;

    return (
      <div className="flex flex-col h-screen p-6 overflow-y-auto">
        <button onClick={goBack} className="mt-6 mb-4 w-fit text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
        <h2 className="text-2xl font-display font-bold mb-2">Workshop Registration</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">All fields marked * are required.</p>

        <div className="space-y-4">
          {/* Shop Name */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Workshop Name *</label>
            <div className={`rounded-xl p-1 border ${wsTouched.shopName && wsErrors.shopName ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="text" placeholder="e.g. Vision Motors" value={wsShopName}
                onChange={(e) => { setWsShopName(e.target.value); if (wsTouched.shopName) setWsErrors(p => ({ ...p, shopName: validateShopName(e.target.value).message || undefined })); }}
                onBlur={() => { setWsTouched(p => ({ ...p, shopName: true })); setWsErrors(p => ({ ...p, shopName: validateShopName(wsShopName).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {wsTouched.shopName && wsErrors.shopName && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {wsErrors.shopName}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Location / Address *</label>
            <div className={`rounded-xl p-1 border ${wsTouched.location && wsErrors.location ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="text" placeholder="e.g. Building 12, Smart Village, Giza" value={wsLocation}
                onChange={(e) => { setWsLocation(e.target.value); if (wsTouched.location) setWsErrors(p => ({ ...p, location: validateAddress(e.target.value).message || undefined })); }}
                onBlur={() => { setWsTouched(p => ({ ...p, location: true })); setWsErrors(p => ({ ...p, location: validateAddress(wsLocation).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {wsTouched.location && wsErrors.location && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {wsErrors.location}</p>}
          </div>

          {/* Government License */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Government License Number * (6–20 chars)</label>
            <div className={`rounded-xl p-1 border ${wsTouched.govLicense && wsErrors.govLicense ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="text" placeholder="e.g. LIC-2024-00123" value={wsGovLicense}
                onChange={(e) => { setWsGovLicense(e.target.value); if (wsTouched.govLicense) setWsErrors(p => ({ ...p, govLicense: validateGovLicense(e.target.value).message || undefined })); }}
                onBlur={() => { setWsTouched(p => ({ ...p, govLicense: true })); setWsErrors(p => ({ ...p, govLicense: validateGovLicense(wsGovLicense).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {wsTouched.govLicense && wsErrors.govLicense && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {wsErrors.govLicense}</p>}
          </div>

          {/* Spare Parts Brands (optional) */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Spare Part Brands (optional)</label>
            <div className="glass-panel rounded-xl p-1">
              <textarea placeholder="e.g. Bosch, NGK, Monroe..." value={wsBrands}
                onChange={(e) => setWsBrands(e.target.value)}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500 h-24 resize-none"
              />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-dashed border-2 border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyber-primary transition-colors">
            <FileText className="text-cyber-primary" />
            <p className="text-sm text-gray-500">Upload Gov License Photo (optional)</p>
          </div>
        </div>

        <button
          onClick={handleOpenWorkshop}
          disabled={!wsFormValid}
          className="w-full mt-8 bg-cyber-primary text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Open Workshop
        </button>

        {!wsFormValid && wsTouched.shopName && (
          <p className="text-center text-xs text-gray-500 mt-3">Please fill in all required fields correctly to continue.</p>
        )}
      </div>
    );
  };

  // --- EXISTING SCREENS (Modified) ---

  const renderSetupCar = () => {
    const validateCar = () => {
      const errs: { brand?: string; model?: string; year?: string; type?: string } = {};
      const bv = validateRequired(user.carBrand || '', 'Car brand');
      if (!bv.valid) errs.brand = bv.message;
      const mv = validateRequired(user.carModel || '', 'Car model');
      if (!mv.valid) errs.model = mv.message;
      const yv = validateCarYear(String(user.carYear || ''));
      if (!yv.valid) errs.year = yv.message;
      if (!user.carType) errs.type = 'Please select a car type';
      return errs;
    };

    const handleCompleteCar = () => {
      setCarTouched({ brand: true, model: true, year: true, type: true });
      const errs = validateCar();
      setCarErrors(errs);
      if (Object.keys(errs).length > 0) return;
      navigate(View.HOME);
    };

    const carFormValid = Object.keys(validateCar()).length === 0;

    return (
      <div className="flex flex-col h-screen p-6">
        <div className="flex items-center gap-4 mb-8 pt-4">
          <button onClick={goBack} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-bold font-display">Add Your Car</h2>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="glass-panel p-6 rounded-2xl border-dashed border-2 border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-4 hover:border-cyber-primary transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-cyber-800 flex items-center justify-center">
              <Car size={32} className="text-cyber-primary" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Scan License / Drag Photo</p>
          </div>

          {/* Car Brand */}
          <div>
            <div className={`rounded-xl p-1 border ${carTouched.brand && carErrors.brand ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="text" placeholder="Car Brand * (e.g. Toyota)" value={user.carBrand || ''}
                onChange={(e) => { setUser({ ...user, carBrand: e.target.value }); if (carTouched.brand) setCarErrors(p => ({ ...p, brand: e.target.value.trim() ? undefined : 'Car brand is required' })); }}
                onBlur={() => { setCarTouched(p => ({ ...p, brand: true })); setCarErrors(p => ({ ...p, brand: (user.carBrand || '').trim() ? undefined : 'Car brand is required' })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {carTouched.brand && carErrors.brand && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {carErrors.brand}</p>}
          </div>

          {/* Car Model */}
          <div>
            <div className={`rounded-xl p-1 border ${carTouched.model && carErrors.model ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="text" placeholder="Model * (e.g. Corolla)" value={user.carModel || ''}
                onChange={(e) => { setUser({ ...user, carModel: e.target.value }); if (carTouched.model) setCarErrors(p => ({ ...p, model: e.target.value.trim() ? undefined : 'Car model is required' })); }}
                onBlur={() => { setCarTouched(p => ({ ...p, model: true })); setCarErrors(p => ({ ...p, model: (user.carModel || '').trim() ? undefined : 'Car model is required' })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {carTouched.model && carErrors.model && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {carErrors.model}</p>}
          </div>

          {/* Car Year */}
          <div>
            <div className={`rounded-xl p-1 border ${carTouched.year && carErrors.year ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
              <input type="number" placeholder="Year * (1970 – present)" value={user.carYear || ''}
                min={1970} max={new Date().getFullYear() + 1}
                onChange={(e) => { setUser({ ...user, carYear: e.target.value }); if (carTouched.year) setCarErrors(p => ({ ...p, year: validateCarYear(e.target.value).message || undefined })); }}
                onBlur={() => { setCarTouched(p => ({ ...p, year: true })); setCarErrors(p => ({ ...p, year: validateCarYear(String(user.carYear || '')).message || undefined })); }}
                className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              />
            </div>
            {carTouched.year && carErrors.year && <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {carErrors.year}</p>}
          </div>

          {/* Car Type */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">Car Type *</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(CarType).map((type) => (
                <button key={type}
                  onClick={() => { setUser({ ...user, carType: type }); setCarTouched(p => ({ ...p, type: true })); setCarErrors(p => ({ ...p, type: undefined })); }}
                  className={`p-4 rounded-xl glass-panel text-center transition-all ${user.carType === type
                    ? 'border-cyber-accent bg-cyber-primary/20 text-cyber-primary font-bold ring-1 ring-cyber-primary'
                    : 'text-gray-500 dark:text-gray-400 hover:border-cyber-primary/50'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {carTouched.type && carErrors.type && <p className="text-red-500 text-xs mt-2 ml-2 flex items-center gap-1"><AlertTriangle size={12} /> {carErrors.type}</p>}
          </div>
        </div>

        <button
          onClick={handleCompleteCar}
          disabled={!carFormValid}
          className="w-full bg-cyber-primary py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(59,130,246,0.4)] mt-4 text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Complete Setup
        </button>

        {!carFormValid && Object.keys(carTouched).length > 0 && (
          <p className="text-center text-xs text-gray-500 mt-2">Please fill in all required fields to continue.</p>
        )}
      </div>
    );
  };

  const renderHome = () => (
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
          <button onClick={() => navigate(View.SETTINGS)} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white hover:text-cyber-primary" title="Settings" aria-label="Settings"><Settings size={20} /></button>
          {renderThemeToggle()}
          <div className="relative" onClick={() => navigate(View.PROFILE)}>
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-cyber-primary">
              <img src="https://picsum.photos/100/100" alt="Profile" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-slate-100 dark:border-cyber-900"></div>
          </div>
        </div>
      </div>

      <div className="px-6 flex-1 overflow-y-auto no-scrollbar space-y-8">

        {/* Upcoming Booking Card */}
        {user.bookings.length > 0 && (
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-cyber-primary relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 p-2 bg-cyber-primary/10 rounded-bl-xl text-cyber-primary">
              <Calendar size={16} />
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Upcoming Appointment</h3>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{user.bookings[0].serviceName}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1"><Clock size={14} /> {user.bookings[0].date}</p>
              </div>
              <span className="text-xs font-bold bg-green-500/20 text-green-500 px-3 py-1 rounded-full">{user.bookings[0].status}</span>
            </div>

            {['Checked-In', 'Repairing', 'Quality Check'].includes(user.bookings[0].status) && (
              <div className="mt-4 bg-slate-100 dark:bg-black/20 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mb-2">
                  <span>Live Progress</span>
                  <span>{user.bookings[0].progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <style>{`
                    #progress-bar-${user.bookings[0].id} {
                      width: ${user.bookings[0].progress}%;
                    }
                  `}</style>
                  <div id={`progress-bar-${user.bookings[0].id}`} className="bg-cyber-primary h-2.5 rounded-full transition-all duration-700 relative">
                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xs text-cyber-primary font-bold mt-2 text-center">
                  {user.bookings[0].status === 'Checked-In' ? 'Car is ready for diagnostics' :
                   user.bookings[0].status === 'Repairing' ? 'Engineer is actively working on your car' :
                   'Final inspections underway'}
                </p>
              </div>
            )}

            <button onClick={() => setSelectedBookingForDetails(user.bookings[0])} className="mt-4 w-full py-2 text-xs font-bold bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-cyber-primary hover:text-white transition-colors">View Details</button>
          </div>
        )}

        {/* Special Offer Banner */}
        <div className="relative rounded-2xl overflow-hidden h-40 shadow-lg group cursor-pointer" onClick={() => navigate(View.AI_CHAT)}>
          <img src="https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&q=80" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" alt="AI Diagnostics Banner" title="AI Diagnostics Banner" />
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
            <button data-testid="ai-chat-btn" onClick={() => navigate(View.AI_CHAT)} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center group-hover:bg-cyber-primary/20 group-hover:border-cyber-primary transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                <MessageSquare className="text-cyber-primary dark:text-cyber-accent group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs text-slate-600 dark:text-gray-300">AI Doctor</span>
            </button>
            <button onClick={() => navigate(View.WINCH_NEGOTIATION)} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center group-hover:bg-cyber-primary/20 group-hover:border-cyber-primary transition-all">
                <Truck className="text-cyber-primary dark:text-cyber-accent group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs text-slate-600 dark:text-gray-300">Winch</span>
            </button>
            <button data-testid="repair-btn" onClick={() => navigate(View.WORKSHOP_LIST)} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center group-hover:bg-cyber-primary/20 group-hover:border-cyber-primary transition-all">
                <Wrench className="text-cyber-primary dark:text-cyber-accent group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs text-slate-600 dark:text-gray-300">Repair</span>
            </button>
          </div>
        </div>

        {/* Live Bidding System Banner */}
        <div 
          className="relative rounded-2xl overflow-hidden h-32 shadow-lg group cursor-pointer border border-cyber-primary/30" 
          onClick={() => navigate(View.BIDDING_USER)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-cyber-900 opacity-90"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
          <div className="absolute inset-0 p-5 flex items-center justify-between">
            <div className="text-white">
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded w-fit mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                LIVE BIDS
              </span>
              <h3 className="text-lg font-bold">Mechanic Bidding</h3>
              <p className="text-xs text-blue-200 mt-1 max-w-[200px]">Post your issue and get live competitive prices from workshops.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="text-cyber-accent" size={24} />
            </div>
          </div>
        </div>

        {/* Spare Parts Section */}
        <div className="bg-gradient-to-r from-slate-200 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 flex items-center justify-between shadow-lg border border-white/10" onClick={() => navigate(View.SPARE_PARTS)}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary">
              <Package size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Spare Parts Market</h4>
              <p className="text-xs text-gray-500">Find genuine parts nearby</p>
            </div>
          </div>
          <button className="p-2 rounded-full bg-cyber-primary text-white" title="Go to Spare Parts Market" aria-label="Go to Spare Parts Market"><ChevronRight size={20} /></button>
        </div>

        {/* Nearby Workshops */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <div className="w-1 h-6 bg-cyber-success rounded-full"></div>
              Verified Near You
            </h3>
            <button onClick={() => navigate(View.WORKSHOP_LIST)} className="text-xs text-cyber-primary">See All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {workshops.map(shop => {
              const isNew = shop.createdAt && new Date().getTime() - new Date(shop.createdAt).getTime() < 24 * 60 * 60 * 1000;
              return (
              <div key={shop.id} className="min-w-[200px] glass-panel rounded-2xl overflow-hidden hover:border-cyber-primary/50 transition-colors relative" onClick={() => { setSelectedWorkshop(shop); navigate(View.WORKSHOP_DETAIL); }}>
                {isNew && (
                  <div className="absolute top-2 right-2 bg-cyber-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10 shadow-lg neon-border">NEW</div>
                )}
                <img src={shop.image} className="w-full h-24 object-cover" alt={shop.name} title={shop.name} />
                <div className="p-3">
                  <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">{shop.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span>{shop.rating}</span>
                    <span>•</span>
                    <MapPin size={12} />
                    <span>{shop.distance}</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Bar - UPDATED */}
      <div className="absolute bottom-6 left-6 right-6 h-16 glass-panel rounded-full flex items-center justify-between px-6 neon-border z-50">
        <button className="text-cyber-primary flex flex-col items-center" onClick={() => navigate(View.HOME)}>
          <Navigation size={20} />
          <span className="text-[9px]">Home</span>
        </button>
        <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => navigate(View.AI_CHAT)}>
          <MessageSquare size={20} />
          <span className="text-[9px]">AI Doc</span>
        </button>
        <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => navigate(View.WINCH_NEGOTIATION)}>
          <Truck size={20} />
          <span className="text-[9px]">Winch</span>
        </button>
        <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => setShowHistory(true)}>
          <Clock size={20} />
          <span className="text-[9px]">History</span>
        </button>
        <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => navigate(View.WORKSHOP_LIST)}>
          <Wrench size={20} />
          <span className="text-[9px]">Repair</span>
        </button>
        <button className="text-gray-400 hover:text-cyber-primary transition-colors flex flex-col items-center" onClick={() => navigate(View.PROFILE)}>
          <User size={20} />
          <span className="text-[9px]">Profile</span>
        </button>
      </div>
    </div>
  );

  const renderSpareParts = () => {
    const CATEGORIES = ['All', 'Engine', 'Brakes', 'Tires', 'Batteries', 'Accessories', 'Oil', 'Body'];

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIdentifyingPart(true);
      setIdentifiedPart(null);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const tokenVal = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/gemini/identify-part`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(tokenVal ? { 'Authorization': `Bearer ${tokenVal}` } : {})
            },
            body: JSON.stringify({
              media: {
                mimeType: file.type,
                data: base64Data
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            setIdentifiedPart({ name: data.partName, description: data.description });
            setPartsSearch(data.partName);
          } else {
            alert('Failed to identify part. Please try again.');
          }
        } catch (error) {
          console.error('Error identifying part:', error);
          alert('Network error. Please try again.');
        } finally {
          setIdentifyingPart(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    };

    const handleOrder = async () => {
      if (!selectedPartForOrder || !user) return;
      
      const totalPrice = selectedPartForOrder.price * orderQuantity;
      if (user.walletBalance < totalPrice) {
        alert(`Insufficient balance. You need ${totalPrice} EGP but have ${user.walletBalance} EGP.`);
        return;
      }

      setOrderingPart(true);
      try {
        const tokenVal = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/parts/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenVal}`
          },
          body: JSON.stringify({
            partId: selectedPartForOrder.id,
            quantity: orderQuantity
          })
        });

        if (res.ok) {
          alert(`Successfully ordered ${orderQuantity}x ${selectedPartForOrder.name}!`);
          setSelectedPartForOrder(null);
          setOrderQuantity(1);
          
          if (authContext.refreshUser) {
            await authContext.refreshUser();
          }
          
          // Re-fetch parts list to update stock dynamically
          const query = new URLSearchParams();
          if (partsCategory && partsCategory !== 'All') query.append('category', partsCategory);
          if (partsSearch) query.append('search', partsSearch);
          if (partsCarModel) query.append('model', partsCarModel);
          if (partsCarYear) query.append('year', partsCarYear);

          const partsRes = await fetch(`${API_URL}/api/parts?${query.toString()}`);
          if (partsRes.ok) {
            const partsData = await partsRes.json();
            setParts(partsData);
          }
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to place order.');
        }
      } catch (err) {
        console.error(err);
        alert('Network error while placing order.');
      } finally {
        setOrderingPart(false);
      }
    };

    return (
      <div className="flex flex-col h-screen p-6 pt-12 overflow-y-auto bg-slate-100 dark:bg-cyber-900 pb-24">
        <div className="flex justify-between items-center mb-6">
          <button onClick={goBack} className="text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
          {user && (
            <div className="bg-cyber-primary/10 text-cyber-primary font-bold px-3 py-1.5 rounded-full text-xs border border-cyber-primary/20" id="user-wallet-display">
              Wallet: {user.walletBalance.toLocaleString()} EGP
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-4">Spare Parts Market</h2>
        
        <div className="space-y-3 mb-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search parts by name..." 
              value={partsSearch}
              id="part-search-input"
              onChange={(e) => setPartsSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-gray-400 py-3 pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-cyber-primary outline-none"
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Car Model (e.g. Honda Civic)" 
                value={partsCarModel}
                id="part-model-filter"
                onChange={(e) => setPartsCarModel(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-gray-400 py-2.5 px-4 rounded-xl text-xs focus:ring-2 focus:ring-cyber-primary outline-none"
              />
            </div>
            <div className="relative">
              <input 
                type="number" 
                placeholder="Year (e.g. 2020)" 
                value={partsCarYear}
                id="part-year-filter"
                onChange={(e) => setPartsCarYear(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-gray-400 py-2.5 px-4 rounded-xl text-xs focus:ring-2 focus:ring-cyber-primary outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto py-2 mb-6 hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setPartsCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
                partsCategory === cat 
                  ? 'bg-cyber-primary text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 mb-8">
          <Package size={48} className="text-cyber-primary/80" />
          <p className="text-sm text-gray-500">Search for specific parts or upload a photo of the broken part for AI identification.</p>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            aria-label="Upload photo of broken part"
            title="Upload photo of broken part"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={identifyingPart}
            className="bg-cyber-primary text-white px-6 py-2.5 rounded-xl font-bold w-full disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {identifyingPart ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Identifying...</> : 'Identify Part via AI'}
          </button>
          
          {identifiedPart && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-left w-full" id="ai-identified-banner">
              <h4 className="font-bold text-green-600 dark:text-green-400 mb-1">Identified: {identifiedPart.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">{identifiedPart.description}</p>
              <button 
                onClick={() => { setIdentifiedPart(null); setPartsSearch(''); }}
                className="mt-2 text-xs text-cyber-primary font-bold hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
        
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">
          {partsSearch ? `Matching Parts (${parts.length})` : 'Available in Stock'}
        </h3>
        
        {partsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : parts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No matching parts found in stock.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-20">
            {parts.map(part => (
              <div 
                key={part.id} 
                className="glass-panel rounded-xl overflow-hidden shadow-lg border border-white/5 flex flex-col bg-white dark:bg-slate-800"
              >
                <div className="h-32 bg-gray-100 dark:bg-gray-700 relative">
                  <img src={part.image || 'https://picsum.photos/400/300?car-part'} alt={part.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {part.condition}
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">{part.name}</h4>
                  <p className="text-[10px] text-gray-500 mb-1">Stock: {part.stock}</p>
                  
                  {part.compatibilityModel && (
                    <p className="text-[10px] text-blue-500 dark:text-blue-400 mb-2">
                      Fits: {part.compatibilityModel} {part.compatibilityYearStart ? `(${part.compatibilityYearStart}${part.compatibilityYearEnd ? `-${part.compatibilityYearEnd}` : '+'})` : ''}
                    </p>
                  )}

                  <div className="mt-auto flex justify-between items-center">
                    <span className="font-bold text-cyber-primary text-sm">{part.price} EGP</span>
                    <button 
                      onClick={() => { setSelectedPartForOrder(part); setOrderQuantity(1); }}
                      className="bg-slate-900 dark:bg-white text-white dark:text-black p-1.5 rounded-lg hover:bg-cyber-primary dark:hover:bg-cyber-primary hover:text-white dark:hover:text-white transition-colors" 
                      aria-label="Buy"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buy Modal */}
        {selectedPartForOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="purchase-modal">
            <div className="bg-white dark:bg-cyber-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-slideUp">
              <div className="relative h-44">
                <img src={selectedPartForOrder.image || 'https://picsum.photos/400/300?car-part'} alt={selectedPartForOrder.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedPartForOrder(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md font-bold text-lg"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6">
                <span className="text-[10px] font-bold text-cyber-primary uppercase tracking-wider">{selectedPartForOrder.category}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedPartForOrder.name}</h3>
                
                {selectedPartForOrder.compatibilityModel && (
                  <p className="text-xs text-blue-500 mt-1">
                    Compatible: {selectedPartForOrder.compatibilityModel} {selectedPartForOrder.compatibilityYearStart ? `(${selectedPartForOrder.compatibilityYearStart}-${selectedPartForOrder.compatibilityYearEnd || 'Present'})` : ''}
                  </p>
                )}

                <div className="flex justify-between items-center mt-4 mb-4">
                  <span className="text-sm font-medium text-slate-500">Unit Price:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedPartForOrder.price} EGP</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-gray-800 rounded-xl mb-4">
                  <span className="font-bold text-xs text-slate-700 dark:text-gray-300">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                      className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 shadow flex items-center justify-center text-slate-900 dark:text-white font-bold animate-click"
                      id="decrease-qty-btn"
                    >-</button>
                    <span className="font-bold text-sm w-4 text-center text-slate-900 dark:text-white" id="order-qty-display">{orderQuantity}</span>
                    <button 
                      onClick={() => setOrderQuantity(Math.min(selectedPartForOrder.stock, orderQuantity + 1))}
                      disabled={orderQuantity >= selectedPartForOrder.stock}
                      className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 shadow flex items-center justify-center text-slate-900 dark:text-white font-bold disabled:opacity-50"
                      id="increase-qty-btn"
                    >+</button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-gray-500">Total Price</span>
                  <span className="text-xl font-bold text-cyber-primary" id="total-price-display">
                    {selectedPartForOrder.price * orderQuantity} EGP
                  </span>
                </div>

                {selectedPartForOrder.stock === 0 ? (
                  <button disabled className="w-full py-3.5 rounded-xl font-bold bg-gray-300 dark:bg-gray-700 text-gray-500 flex justify-center items-center gap-2">
                    Out of Stock
                  </button>
                ) : (
                  <button 
                    onClick={handleOrder}
                    disabled={orderingPart}
                    className="w-full py-3.5 rounded-xl font-bold bg-cyber-primary text-white shadow-lg flex justify-center items-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-75"
                    id="confirm-purchase-btn"
                  >
                    {orderingPart ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Confirm Purchase'
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

  const renderWinchNegotiation = () => {
    return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900 relative">
        {/* Google Maps Background */}
        <div className="absolute inset-0 z-0">
          <WinchNegotiationMap
            center={coords || { lat: 30.0444, lng: 31.2357 }}
            pickupCoords={pickupCoords}
            dropoffCoords={dropoffCoords}
            pickingLocationFor={pickingLocationFor}
            onMapClick={(latLng) => {
              const lat = latLng.lat();
              const lng = latLng.lng();
              if (pickingLocationFor === 'pickup') {
                setPickupCoords({ lat, lng });
                setPickingLocationFor(null);
                reverseGeocodeWithGoogle(lat, lng, (address) => setPickupAddress(address));
              } else if (pickingLocationFor === 'dropoff') {
                setDropoffCoords({ lat, lng });
                setPickingLocationFor(null);
                reverseGeocodeWithGoogle(lat, lng, (address) => setDropoffAddress(address));
              }
            }}
            onPickupDrag={(latLng) => {
              const lat = latLng.lat();
              const lng = latLng.lng();
              setPickupCoords({ lat, lng });
              reverseGeocodeWithGoogle(lat, lng, (address) => setPickupAddress(address));
            }}
            onDropoffDrag={(latLng) => {
              const lat = latLng.lat();
              const lng = latLng.lng();
              setDropoffCoords({ lat, lng });
              reverseGeocodeWithGoogle(lat, lng, (address) => setDropoffAddress(address));
            }}
            showDrivers={winchStatus !== 'idle' && activeOffers.length > 0}
            mapTypeId={mapTypeId}
            zoom={zoom}
            onZoomChange={(newZoom) => setZoom(newZoom)}
          />
        </div>

        {/* Top Controls */}
        <div className="relative z-10 p-4 pt-12 flex justify-between pointer-events-none">
          <button onClick={() => { setWinchStatus('idle'); setPickingLocationFor(null); goBack(); }} className="p-3 glass-panel rounded-full text-slate-900 dark:text-white pointer-events-auto" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
          {pickingLocationFor && (
            <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 pointer-events-auto bg-cyber-primary text-white">
              <span className="text-sm font-bold">Tap on map to select {pickingLocationFor}</span>
            </div>
          )}
        </div>

        {/* Floating Map Controls */}
        {winchStatus !== 'confirmed' && (
          <div 
            ref={locateBtnRef}
            className="absolute right-4 z-30 flex flex-col gap-2 pointer-events-auto floating-map-controls"
          >
            {/* Map Type Flyout Menu */}
            {showMapTypeMenu && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700/80 rounded-2xl p-2 shadow-2xl flex gap-1 items-center animate-in slide-in-from-right-4 fade-in duration-200 pointer-events-auto min-w-[280px]">
                {[
                  { id: 'roadmap', label: 'Default', icon: '🗺️' },
                  { id: 'satellite', label: 'Satellite', icon: '🛰️' },
                  { id: 'terrain', label: 'Terrain', icon: '⛰️' },
                  { id: 'hybrid', label: 'Hybrid', icon: '🌐' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setMapTypeId(type.id);
                      setShowMapTypeMenu(false);
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
                      mapTypeId === type.id
                        ? 'bg-cyber-primary text-white font-bold shadow-md shadow-cyber-primary/30 scale-105'
                        : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{type.icon}</span>
                    <span className="text-[10px] tracking-wide">{type.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Map Type Toggle Button */}
            <button 
              onClick={() => setShowMapTypeMenu(!showMapTypeMenu)} 
               className={`p-3.5 rounded-full shadow-xl border transition-all flex items-center justify-center pointer-events-auto ${
                 showMapTypeMenu 
                   ? 'bg-cyber-primary text-white border-cyber-primary scale-105 shadow-cyber-primary/20' 
                   : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:text-cyber-primary dark:hover:text-cyber-primary border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95'
               }`}
              title="Change map type"
              aria-label="Change map type"
            >
              <Layers className="w-5 h-5" />
            </button>

            {/* Zoom In Button */}
            <button 
              onClick={() => setZoom(prev => Math.min(prev + 1, 20))} 
              className="p-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:text-cyber-primary dark:hover:text-cyber-primary hover:scale-105 active:scale-95 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center pointer-events-auto"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Zoom Out Button */}
            <button 
              onClick={() => setZoom(prev => Math.max(prev - 1, 1))} 
              className="p-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:text-cyber-primary dark:hover:text-cyber-primary hover:scale-105 active:scale-95 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center pointer-events-auto"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <Minus className="w-5 h-5" />
            </button>

            {/* Locate User Button */}
            <button 
              onClick={locateUserExactly} 
              className="p-3.5 bg-white dark:bg-slate-800 text-cyber-primary hover:scale-105 active:scale-95 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center pointer-events-auto"
              title="Pin my exact location"
              aria-label="Pin my exact location"
            >
              <Navigation className="w-5 h-5 transform rotate-45" />
            </button>
          </div>
        )}

        {/* Bottom Sheet */}
        <div 
          ref={sheetRef}
          className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-3xl p-6 pb-10 z-20 border-t border-cyber-primary/30 max-h-[60vh] overflow-y-auto select-none"
        >
          <div 
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handleDragStart(e.touches[0].clientY);
              }
            }}
            className="w-full py-4 -mt-4 mb-2 flex justify-center cursor-grab active:cursor-grabbing select-none group pointer-events-auto"
            title="Drag or click to collapse/expand"
          >
            <div className="w-16 h-1.5 bg-gray-400 dark:bg-gray-600 group-hover:bg-cyber-primary rounded-full transition-colors duration-200"></div>
          </div>

          {winchStatus !== 'searching' && (
            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-4">Request Winch</h3>
          )}

          {winchStatus === 'idle' && (() => {
            const COMMON_EGYPT_LOCATIONS = [
              { name: 'Heliopolis, Cairo', lat: 30.0911, lng: 31.3235 },
              { name: 'Maadi, Cairo', lat: 29.9602, lng: 31.2569 },
              { name: 'Zamalek, Cairo', lat: 30.0617, lng: 31.2201 },
              { name: 'Fifth Settlement, New Cairo', lat: 30.0074, lng: 31.4913 },
              { name: 'Pyramids, Giza', lat: 29.9792, lng: 31.1342 },
              { name: 'Nasr City, Cairo', lat: 30.0583, lng: 31.3361 },
              { name: 'Downtown, Cairo', lat: 30.0444, lng: 31.2357 },
              { name: 'Stanley, Alexandria', lat: 31.2336, lng: 29.9489 },
            ];

            const pickupMatches = !isMapLoaded
              ? (pickupAddress.length > 1 && !pickupCoords ? COMMON_EGYPT_LOCATIONS.filter(l => l.name.toLowerCase().includes(pickupAddress.toLowerCase())) : [])
              : [];
            const dropoffMatches = !isMapLoaded
              ? (dropoffAddress.length > 1 && !dropoffCoords ? COMMON_EGYPT_LOCATIONS.filter(l => l.name.toLowerCase().includes(dropoffAddress.toLowerCase())) : [])
              : [];

            return (
              <div className="flex flex-col gap-4">
                
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPickingLocationFor('pickup')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${pickingLocationFor === 'pickup' ? 'bg-cyber-primary text-white border-cyber-primary' : 'bg-transparent text-slate-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    Pickup Location
                  </button>
                  <button 
                    onClick={() => setPickingLocationFor('dropoff')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${pickingLocationFor === 'dropoff' ? 'bg-cyber-primary text-white border-cyber-primary' : 'bg-transparent text-slate-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    Dropoff Location
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Pickup Search */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          ref={pickupInputRef}
                          id="winch-pickup-search"
                          type="text"
                          placeholder="Enter pickup address..."
                          value={pickupAddress}
                          onChange={(e) => {
                            setPickupAddress(e.target.value);
                            if (pickupCoords) setPickupCoords(null);
                          }}
                          className={`w-full p-4 pl-11 rounded-xl border outline-none text-sm transition bg-white dark:bg-gray-800 text-slate-900 dark:text-white ${pickupCoords ? 'border-green-500 focus:ring-2 focus:ring-green-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyber-primary/20'}`}
                        />
                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 ${pickupCoords ? 'text-green-500' : 'text-cyber-primary'}`} size={18} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          locateUserExactly();
                        }}
                        className="px-4 bg-white dark:bg-gray-800 text-cyber-primary hover:text-blue-600 dark:hover:text-cyber-primary border border-gray-200 dark:border-gray-700 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                        title="Auto-detect current location"
                        aria-label="Auto-detect current location"
                      >
                        <Navigation className="w-5 h-5 transform rotate-45" />
                      </button>
                    </div>

                    {/* Google Autocomplete Suggestions */}
                    {isMapLoaded && pickupSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                        {pickupSuggestions.map(loc => (
                          <button
                            key={loc.place_id}
                            onClick={() => handleSelectPickupSuggestion(loc)}
                            className="w-full text-left p-3 hover:bg-cyber-primary/10 text-sm font-medium border-b border-gray-100 dark:border-gray-700/50 flex items-start gap-3 transition-colors"
                          >
                            <MapPin className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" size={16} />
                            <div className="text-left">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">{loc.structured_formatting?.main_text || loc.description}</div>
                              {loc.structured_formatting?.secondary_text && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{loc.structured_formatting.secondary_text}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Local Fallback Suggestions */}
                    {!isMapLoaded && pickupMatches.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                        {pickupMatches.map(loc => (
                          <button
                            key={loc.name}
                            onClick={() => {
                              const coords = { lat: loc.lat, lng: loc.lng };
                              setPickupCoords(coords);
                              setCoords(coords);
                              setPickupAddress(loc.name);
                            }}
                            className="w-full text-left p-3 hover:bg-cyber-primary/10 text-sm font-medium text-slate-800 dark:text-white border-b border-gray-100 dark:border-gray-700/50"
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dropoff Search */}
                  <div className="relative">
                    <div className="relative">
                      <input
                        ref={dropoffInputRef}
                        id="winch-dropoff-search"
                        type="text"
                        placeholder="Enter dropoff destination..."
                        value={dropoffAddress}
                        onChange={(e) => {
                          setDropoffAddress(e.target.value);
                          if (dropoffCoords) setDropoffCoords(null);
                        }}
                        className={`w-full p-4 pl-11 rounded-xl border outline-none text-sm transition bg-white dark:bg-gray-800 text-slate-900 dark:text-white ${dropoffCoords ? 'border-green-500 focus:ring-2 focus:ring-green-500/20' : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyber-primary/20'}`}
                      />
                      <Navigation className={`absolute left-4 top-1/2 -translate-y-1/2 ${dropoffCoords ? 'text-green-500' : 'text-blue-500'}`} size={18} />
                    </div>

                    {/* Google Autocomplete Suggestions */}
                    {isMapLoaded && dropoffSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                        {dropoffSuggestions.map(loc => (
                          <button
                            key={loc.place_id}
                            onClick={() => handleSelectDropoffSuggestion(loc)}
                            className="w-full text-left p-3 hover:bg-cyber-primary/10 text-sm font-medium border-b border-gray-100 dark:border-gray-700/50 flex items-start gap-3 transition-colors"
                          >
                            <MapPin className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" size={16} />
                            <div className="text-left">
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">{loc.structured_formatting?.main_text || loc.description}</div>
                              {loc.structured_formatting?.secondary_text && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{loc.structured_formatting.secondary_text}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Local Fallback Suggestions */}
                    {!isMapLoaded && dropoffMatches.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                        {dropoffMatches.map(loc => (
                          <button
                            key={loc.name}
                            onClick={() => {
                              const coords = { lat: loc.lat, lng: loc.lng };
                              setDropoffCoords(coords);
                              setCoords(coords);
                              setDropoffAddress(loc.name);
                            }}
                            className="w-full text-left p-3 hover:bg-cyber-primary/10 text-sm font-medium text-slate-800 dark:text-white border-b border-gray-100 dark:border-gray-700/50"
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {tripDistance !== null && tripPrice !== null && (
                  <div className="glass-panel p-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-cyber-primary/20 space-y-2 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Trip Distance:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{tripDistance} km</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Rate:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{pricePerKm} EGP/km</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-800" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">Estimated Price:</span>
                      <span className="font-bold text-lg text-cyber-primary dark:text-cyber-accent">{tripPrice} EGP</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={requestWinch} 
                  disabled={!pickupCoords || !dropoffCoords}
                  className={`w-full py-4 rounded-xl font-bold mt-4 ${(!pickupCoords || !dropoffCoords) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-cyber-primary shadow-[0_0_20px_rgba(59,130,246,0.6)] text-white'}`}
                >
                  Find Winch Drivers
                </button>
              </div>
            );
          })()}

          {winchStatus === 'searching' && (
            <div className="flex flex-col items-center py-8 text-center">
              {/* Animated pulse rings representing radar sweep */}
              <div className="relative flex items-center justify-center mb-6 w-24 h-24">
                <div className="absolute w-24 h-24 rounded-full border-2 border-cyber-primary/30 animate-ping-custom-1" />
                <div className="absolute w-16 h-16 rounded-full border-2 border-cyber-primary/50 animate-ping-custom-2" />
                <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Locating drivers nearby...</h3>
              <div className="flex items-center gap-2 mt-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                <p className="text-cyber-primary font-bold text-sm">Searching within {searchRadius} km</p>
                {searchRadius < 30 && <p className="text-gray-400 text-xs">(expanding if no results)</p>}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-6 max-w-xs">
                {searchRadius <= 5
                  ? 'Looking for the closest winch drivers in your area.'
                  : searchRadius <= 15
                  ? `No drivers found within ${searchRadius - 5} km. Expanding search...`
                  : `Expanding search to find any available winch nearby.`}
              </p>
              {/* Progress steps */}
              <div className="flex items-center gap-1 mb-6">
                {[5, 10, 15, 20, 25, 30].map((step, idx) => (
                  <div key={step} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${searchRadius >= step ? 'bg-cyber-primary scale-125' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    {idx < 5 && <div className={`w-4 h-0.5 ${searchRadius > step ? 'bg-cyber-primary' : 'bg-gray-300 dark:bg-gray-600'}`} />}
                  </div>
                ))}
              </div>
              <button onClick={() => { cancelRadiusSearch(); setWinchStatus('idle'); }} className="text-xs text-red-400 underline">Cancel</button>
            </div>
          )}

          {winchStatus === 'no_drivers' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Winches Nearby</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 max-w-xs">
                We searched up to <span className="font-bold text-cyber-primary">30 km</span> from your location and couldn't find any available winch drivers right now.
              </p>
              <p className="text-gray-400 text-xs mb-6">Please try again in a few minutes.</p>
              <button onClick={requestWinch} className="bg-cyber-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-colors">
                Try Again
              </button>
              <button onClick={() => { cancelRadiusSearch(); setWinchStatus('idle'); }} className="mt-3 text-xs text-gray-400 underline">
                Go Back
              </button>
            </div>
          )}


          {winchStatus === 'negotiating' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">{activeOffers.length} Driver{activeOffers.length !== 1 ? 's' : ''} Available Nearby</h3>
                <button onClick={() => setWinchStatus('idle')} className="text-xs text-red-500 underline">Cancel Request</button>
              </div>
              
              {activeOffers.map(offer => (
                <div key={offer.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{offer.driverName}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{offer.vehicle} • {offer.rating} <Star className="inline w-3 h-3 text-yellow-500 fill-yellow-500" /></p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-cyber-primary font-bold">ETA: {offer.eta}</p>
                        {offer.distance && (
                          <span className="text-xs bg-cyber-primary/10 text-cyber-primary px-2 py-0.5 rounded-full font-medium">
                            📍 {offer.distance} away
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${offer.status === 'rejected' ? 'text-red-500 line-through' : 'text-slate-900 dark:text-white'}`}>{offer.price} EGP</span>
                    </div>
                  </div>

                  {offer.status !== 'accepted' && offer.status !== 'rejected' && (
                    <div className="flex items-center justify-between mt-4 bg-slate-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                      <button onClick={() => adjustOfferPrice(offer.id, -20)} className="p-2 rounded bg-white dark:bg-gray-800 shadow text-slate-900 dark:text-white" title="Decrease Offer" aria-label="Decrease Offer"><Minus size={16} /></button>
                      <div className="text-center">
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">Offer Price</span>
                        <span className="text-xs text-gray-500">Tap + / -</span>
                      </div>
                      <button onClick={() => adjustOfferPrice(offer.id, 20)} className="p-2 rounded bg-white dark:bg-gray-800 shadow text-slate-900 dark:text-white" title="Increase Offer" aria-label="Increase Offer"><Plus size={16} /></button>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {offer.status === 'rejected' ? (
                      <span className="w-full text-center text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">Offer Rejected</span>
                    ) : offer.status === 'accepted' ? (
                      <button onClick={() => handleAcceptOffer(offer)} className="w-full bg-green-500 text-white py-3 rounded-lg text-sm font-bold shadow-lg animate-pulse">Proceed to Payment</button>
                    ) : (
                      <>
                        <button onClick={() => handleRejectOffer(offer.id)} className="flex-1 bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 py-3 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors">
                          Reject
                        </button>
                        <button onClick={() => handleCounterOffer(offer.id)} className="flex-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 py-3 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors">
                          Send Offer
                        </button>
                        <button onClick={() => handleAcceptOffer(offer)} className="flex-1 bg-cyber-primary text-white py-3 rounded-lg font-bold text-sm shadow-md hover:bg-blue-600 transition-colors">
                          Accept
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderBooking = () => {
    if (!selectedWorkshop) return null;
    
    // 7-day rolling calendar
    const dates = Array.from({ length: 7 }, (_, i) => {
      const isE2E = navigator.userAgent.includes('Headless');
      const d = isE2E ? new Date('2026-10-12T00:00:00') : new Date();
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      return { label: `${dayName} ${dayNum}`, dateStr, dayName, dayNum, month };
    });

    const ALL_HOURLY_SLOTS = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    return (
      <div className="flex flex-col h-screen p-6 pt-12">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={goBack} className="glass-panel p-2 rounded-full text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Checkout</h2>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
          <div className="glass-panel p-4 rounded-xl flex gap-4 items-center">
            <img src={selectedWorkshop.image} className="w-16 h-16 rounded-lg object-cover" alt={selectedWorkshop.name} title={selectedWorkshop.name} />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{selectedWorkshop.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selectedWorkshop.specialty}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Date & Time</h4>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {dates.map((day, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDateIndex(i);
                    setSelectedTimeSlot('');
                  }}
                  className={`p-4 rounded-xl glass-panel min-w-[80px] flex flex-col items-center gap-1 transition-all ${selectedDateIndex === i ? 'border-cyber-primary bg-cyber-primary/20 ring-2 ring-cyber-primary/50' : ''}`}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">{day.dayName}</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{day.dayNum}</span>
                  <span className="text-[10px] text-gray-400">{day.month}</span>
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {slotsLoading ? (
                <div className="col-span-3 text-center text-xs text-gray-500 py-4">Loading available slots...</div>
              ) : (
                ALL_HOURLY_SLOTS.map(time => {
                  const isBooked = bookedSlots.includes(time);
                  return (
                    <button
                      key={time}
                      disabled={isBooked}
                      onClick={() => setSelectedTimeSlot(time)}
                      className={`glass-panel py-3 rounded-xl text-sm transition-all flex flex-col items-center justify-center border ${
                        isBooked ? 'bg-red-500/10 text-red-500/40 border-red-500/20 cursor-not-allowed line-through' :
                        selectedTimeSlot === time ? 'border-cyber-primary text-cyber-primary bg-cyber-primary/10 ring-2 ring-cyber-primary/30 font-bold' :
                        'border-gray-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 hover:border-cyber-primary/50'
                      }`}
                    >
                      <span className="font-medium">{time}</span>
                      {isBooked && <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight mt-0.5">Booked</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Payment Method</h4>
            <div
              onClick={() => setPaymentMethod('card')}
              className={`glass-panel p-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${paymentMethod === 'card' ? 'border-cyber-primary bg-cyber-primary/10' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="text-cyber-primary" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Visa **** 4242</span>
                  <span className="text-xs text-gray-500">Expires 12/26</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border border-cyber-primary p-0.5 flex items-center justify-center`}>
                {paymentMethod === 'card' && <div className="w-2 h-2 bg-cyber-primary rounded-full"></div>}
              </div>
            </div>

            <div
              onClick={() => setPaymentMethod('cash')}
              className={`glass-panel p-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${paymentMethod === 'cash' ? 'border-cyber-primary bg-cyber-primary/10' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="text-green-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Cash on Delivery</span>
              </div>
              <div className={`w-4 h-4 rounded-full border border-cyber-primary p-0.5 flex items-center justify-center`}>
                {paymentMethod === 'cash' && <div className="w-2 h-2 bg-cyber-primary rounded-full"></div>}
              </div>
            </div>

            <div
              onClick={() => {
                if (user.walletBalance >= 470) setPaymentMethod('wallet');
              }}
              className={`glass-panel p-4 rounded-xl flex items-center justify-between border transition-all ${user.walletBalance < 470 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyber-primary/50'} ${paymentMethod === 'wallet' ? 'border-cyber-primary bg-cyber-primary/10' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Wallet className="text-cyber-primary" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Digital Wallet</span>
                  <span className="text-xs text-gray-500">Balance: {user.walletBalance} EGP</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border border-cyber-primary p-0.5 flex items-center justify-center`}>
                {paymentMethod === 'wallet' && <div className="w-2 h-2 bg-cyber-primary rounded-full"></div>}
              </div>
            </div>
          </div>

          <div className="mt-auto glass-panel p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-sm text-slate-700 dark:text-gray-400">
              <span>Service Fee</span>
              <span>450.00 EGP</span>
            </div>
            <div className="flex justify-between text-sm text-slate-700 dark:text-gray-400">
              <span>Booking Fee</span>
              <span>20.00 EGP</span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-700 pt-2 flex justify-between font-bold text-lg text-cyber-primary dark:text-cyber-accent">
              <span>Total</span>
              <span>470.00 EGP</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirmBooking}
          disabled={!selectedTimeSlot}
          className={`w-full font-bold py-4 rounded-xl mt-6 transition-all ${
            selectedTimeSlot 
              ? 'bg-gradient-to-r from-cyber-primary to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Confirm Booking
        </button>
      </div>
    );
  }

  // --- NEW DASHBOARDS (Functional) ---

  const renderPendingLockScreen = (message: string, isRejected: boolean = false) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-black font-sans p-6 text-center">
      <div className="w-full max-w-md p-8 glass-panel rounded-2xl border border-white/20 shadow-2xl relative overflow-hidden flex flex-col items-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isRejected ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'}`}>
          <AlertTriangle size={32} className={isRejected ? '' : 'animate-pulse'} />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">
          {isRejected ? 'Account Rejected' : 'Verification Pending'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message}
        </p>
        <button
          onClick={async () => {
            try {
              await authContext.refreshUser();
            } catch (err) {
              console.error(err);
            }
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-md hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
        >
          <RefreshCw size={16} /> Check Status
        </button>
      </div>
    </div>
  );

  const renderWinchDashboard = () => {
    if (user.approvalStatus === 'PENDING') {
      return renderPendingLockScreen(
        'Your winch driver registration is being verified by our administration team. You will be able to go online and accept bookings as soon as your papers are approved.',
        false
      );
    }
    if (user.approvalStatus === 'REJECTED') {
      return renderPendingLockScreen(
        'Your registration details were rejected by the administrator. Please contact support to resolve this issue.',
        true
      );
    }
    return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      {showWinchWallet ? (
        <div className="flex-1 p-6 pt-12 flex flex-col">
          <button onClick={() => setShowWinchWallet(false)} className="mb-6 w-fit text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
          <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Wallet</h2>
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-blue-700 text-white mb-6">
            <p className="text-sm opacity-80">Total Balance</p>
            <p className="text-4xl font-bold">{user.walletBalance.toLocaleString()} EGP</p>
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
          <div className="mt-auto flex flex-col gap-3">
            <button 
              onClick={() => setShowTopUpModal(true)} 
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg"
              id="winch-topup-btn"
            >
              Add Funds (Top Up)
            </button>
            <button onClick={handleWinchWithdraw} className="w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Request Withdrawal</button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-6 pt-12 bg-cyber-900 text-white pb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold font-display">Winch Command</h2>
                <p className="text-gray-400 text-sm">Welcome back, {user.name}</p>
              </div>
              <div onClick={() => navigate(View.PROFILE)} className="w-10 h-10 rounded-full bg-gray-700 border border-cyber-primary overflow-hidden">
                <img src="https://picsum.photos/100/100" alt="Profile" title="Profile" />
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
                <p className="text-xl font-bold text-cyber-primary">{user.walletBalance} EGP</p>
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
                <p className="text-sm text-slate-950 dark:text-gray-200 mb-1 font-semibold">Customer: {activeWinchRequest.customerName || 'Customer'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1"><MapPin size={14} /> {activeWinchRequest.distance} away • {activeWinchRequest.issue}</p>

                <div className="bg-slate-100 dark:bg-black/20 p-3 rounded-lg mb-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Offer: {activeWinchRequest.price} EGP</p>
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
                <span className="font-bold text-xl text-slate-900 dark:text-white">{user.walletBalance} EGP</span>
              </div>
              <button onClick={() => setShowWinchWallet(true)} className="w-full py-3 border border-cyber-primary text-cyber-primary rounded-lg font-bold hover:bg-cyber-primary hover:text-white transition">View Details</button>
            </div>
          </div>

          <div className="p-4 glass-panel flex justify-around items-center">
            <button className="text-cyber-primary flex flex-col items-center"><Truck size={24} /><span className="text-[10px]">Requests</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => setShowWinchWallet(true)}><Wallet size={24} /><span className="text-[10px]">Wallet</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => navigate(View.PROFILE)}><User size={24} /><span className="text-[10px]">Profile</span></button>
          </div>
        </>
      )}
    </div>
  );
};

  const renderWorkshopDashboard = () => {
    if (user.approvalStatus === 'PENDING') {
      return renderPendingLockScreen(
        'Your workshop owner registration is being verified by our administration team. You will be able to bid on local repair requests and list spare parts once approved.',
        false
      );
    }
    if (user.approvalStatus === 'REJECTED') {
      return renderPendingLockScreen(
        'Your workshop registration was rejected by the administrator. Please contact support to resolve this issue.',
        true
      );
    }
    return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      {showWorkshopWallet ? (
        <div className="flex-1 p-6 pt-12 flex flex-col">
          <button onClick={() => setShowWorkshopWallet(false)} className="mb-6 w-fit text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
          <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Shop Wallet</h2>
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-blue-700 text-white mb-6">
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-4xl font-bold">{user.walletBalance.toLocaleString()} EGP</p>
          </div>
          <div className="mt-auto flex flex-col gap-3">
            <button 
              onClick={() => setShowTopUpModal(true)} 
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg"
              id="workshop-topup-btn"
            >
              Add Funds (Top Up)
            </button>
            <button onClick={handleWorkshopWithdraw} className="w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Withdraw Funds</button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-6 pt-12 bg-gradient-to-r from-gray-900 to-cyber-900 text-white pb-8 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold font-display">{user.shopName || 'My Workshop'}</h2>
                <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Verified Partner</p>
              </div>
              <div onClick={() => navigate(View.PROFILE)} className="w-10 h-10 rounded-full bg-gray-700 border border-cyber-primary overflow-hidden">
                <img src="https://picsum.photos/100/100" alt="Profile" title="Profile" />
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

            {/* Live Job Board (Bidding) */}
            <div>
              <button 
                onClick={() => navigate(View.BIDDING_WORKSHOP)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl flex items-center justify-between shadow-lg mb-6 hover:shadow-xl transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Activity size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold">Live Job Board</h3>
                    <p className="text-xs opacity-80">Bid on nearby repair requests</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
              </button>
            </div>

            {/* Live Tracker */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Activity size={18} className="text-cyber-primary" /> Live Car Tracker</h3>
              <div className="space-y-3">
                {workshopAppointments.filter(a => ['Checked-In', 'Repairing', 'Quality Check', 'Ready'].includes(a.status)).map(car => (
                  <div key={car.id} className="glass-panel p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{car.carDetails || 'Your Car'}</span>
                      <span className="text-xs text-gray-500">{car.workshop?.name || 'Workshop'}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <style>{`
                        #progress-bar-${car.id} {
                          width: ${car.progress || 0}%;
                        }
                      `}</style>
                      <div id={`progress-bar-${car.id}`} className="bg-cyber-primary h-2 rounded-full transition-all duration-500" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-cyber-primary">{car.status}</span>
                      {car.status !== 'Completed' && (
                        <button 
                          onClick={() => {
                            if (car.progress && car.progress >= 100 || car.status === 'Ready') {
                              handleWorkshopAction(car.id, 'Complete');
                            } else {
                              updateCarStatus(car.id, car.progress || 0);
                            }
                          }} 
                          className="text-xs bg-slate-200 dark:bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-cyber-primary hover:text-white transition font-bold"
                        >
                          {(car.progress || 0) < 25 ? 'Start Repair' : 
                           (car.progress || 0) < 75 ? 'Start Quality Check' : 
                           (car.progress || 0) < 100 ? 'Mark Ready' : 'Mark Claimed (Done)'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {workshopAppointments.filter(a => ['Checked-In', 'Repairing', 'Quality Check', 'Ready'].includes(a.status)).length === 0 && <p className="text-gray-500 text-sm">No cars currently being serviced.</p>}
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
                <span className="font-bold text-xl text-slate-900 dark:text-white">{user.walletBalance} EGP</span>
              </div>
              <button onClick={() => setShowWorkshopWallet(true)} className="w-full py-3 border border-cyber-primary text-cyber-primary rounded-lg font-bold hover:bg-cyber-primary hover:text-white transition">View Wallet</button>
            </div>

            <div className="glass-panel p-4 rounded-xl">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Spare Parts Inventory</h3>
              <p className="text-xs text-gray-500 mb-4">Add and manage compatible auto spare parts listed under your workshop.</p>
              <button 
                onClick={() => {
                  setNewPartName('');
                  setNewPartCategory('Engine');
                  setNewPartPrice('');
                  setNewPartStock('');
                  setNewPartCondition('New');
                  setNewPartModel('');
                  setNewPartYearStart('');
                  setNewPartYearEnd('');
                  setShowAddPartModal(true);
                }} 
                className="w-full py-3 bg-cyber-primary text-white rounded-lg font-bold shadow-md hover:bg-blue-600 transition flex items-center justify-center gap-2"
                id="open-add-part-modal-btn"
              >
                <Plus size={18} /> Sell a Spare Part
              </button>
            </div>
          </div>

          <div className="p-4 glass-panel flex justify-around items-center">
            <button className="text-cyber-primary flex flex-col items-center"><Calendar size={24} /><span className="text-[10px]">Bookings</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => setShowWorkshopWallet(true)}><Wallet size={24} /><span className="text-[10px]">Wallet</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => navigate(View.PROFILE)}><User size={24} /><span className="text-[10px]">Profile</span></button>
          </div>
        </>
      )}

      {showAddPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="add-part-modal">
          <div className="bg-white dark:bg-cyber-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowAddPartModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-950 dark:text-gray-400 dark:hover:text-white text-xl font-bold"
              id="close-add-part-modal-btn"
            >
              ×
            </button>
            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-4">Sell a Spare Part</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newPartName || !newPartCategory || !newPartPrice) {
                alert('Please fill out all required fields.');
                return;
              }
              setNewPartLoading(true);
              try {
                const tokenVal = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/parts`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenVal}`
                  },
                  body: JSON.stringify({
                    name: newPartName,
                    category: newPartCategory,
                    price: parseFloat(newPartPrice),
                    stock: parseInt(newPartStock) || 1,
                    condition: newPartCondition,
                    compatibilityModel: newPartModel || null,
                    compatibilityYearStart: newPartYearStart ? parseInt(newPartYearStart) : null,
                    compatibilityYearEnd: newPartYearEnd ? parseInt(newPartYearEnd) : null,
                  })
                });

                if (res.ok) {
                  alert('Spare part listed successfully!');
                  setShowAddPartModal(false);
                } else {
                  const errorData = await res.json();
                  alert(errorData.error || 'Failed to list spare part.');
                }
              } catch (err) {
                console.error(err);
                alert('Network error while listing spare part.');
              } finally {
                setNewPartLoading(false);
              }
            }} className="space-y-4 text-left">
              <div>
                <label htmlFor="new-part-name" className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Part Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Front Control Arm"
                  value={newPartName}
                  id="new-part-name"
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyber-primary outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-part-category" className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Category *</label>
                  <select 
                    value={newPartCategory}
                    id="new-part-category"
                    aria-label="Category"
                    title="Category"
                    onChange={(e) => setNewPartCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyber-primary outline-none text-sm"
                  >
                    {['Engine', 'Brakes', 'Tires', 'Batteries', 'Accessories', 'Oil', 'Body'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-part-condition" className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Condition</label>
                  <select 
                    value={newPartCondition}
                    id="new-part-condition"
                    aria-label="Condition"
                    title="Condition"
                    onChange={(e) => setNewPartCondition(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyber-primary outline-none text-sm"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-part-price" className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Price (EGP) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 1500"
                    value={newPartPrice}
                    id="new-part-price"
                    onChange={(e) => setNewPartPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyber-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-part-stock" className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Stock Qty *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 5"
                    value={newPartStock}
                    id="new-part-stock"
                    onChange={(e) => setNewPartStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyber-primary outline-none text-sm"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="block text-xs font-bold text-blue-500 dark:text-blue-400 mb-2">Car Compatibility Details (Optional)</span>
                <div>
                  <label htmlFor="new-part-model" className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Compatible Car Model</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Honda Civic"
                    value={newPartModel}
                    id="new-part-model"
                    onChange={(e) => setNewPartModel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyber-primary outline-none text-sm mb-3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="new-part-year-start" className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Compatible From Year</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 2019"
                      value={newPartYearStart}
                      id="new-part-year-start"
                      onChange={(e) => setNewPartYearStart(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyber-primary outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-part-year-end" className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Compatible To Year</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 2022"
                      value={newPartYearEnd}
                      id="new-part-year-end"
                      onChange={(e) => setNewPartYearEnd(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyber-primary outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={newPartLoading}
                className="w-full py-3 rounded-xl font-bold bg-cyber-primary text-white shadow-lg flex justify-center items-center gap-2 hover:bg-blue-600 transition disabled:opacity-75 text-sm"
                id="submit-new-part-btn"
              >
                {newPartLoading ? 'Listing Part...' : 'List Spare Part'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  }

  const renderAIChat = () => (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-black">
      <div className="p-4 pt-12 glass-panel shadow-lg z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-full hover:bg-white/10 text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              Auto-Care AI
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h2>
            <p className="text-xs text-green-500">Online • Diagnostics Mode</p>
          </div>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 shadow-inner">
          <button onClick={() => setChatLanguage('ar')} className={`px-3 py-1 text-sm rounded-md transition-all ${chatLanguage === 'ar' ? 'bg-cyber-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>عربي</button>
          <button onClick={() => setChatLanguage('en')} className={`px-3 py-1 text-sm rounded-md transition-all ${chatLanguage === 'en' ? 'bg-cyber-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>EN</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                ? 'bg-cyber-primary text-white rounded-br-none'
                : 'glass-panel text-slate-800 dark:text-gray-200 rounded-bl-none border border-cyber-primary/30'
                }`}>
                {msg.text}
              </div>
            </div>
            {msg.action === 'WINCH' && (
               <button onClick={() => { setWinchStatus('idle'); navigate(View.WINCH_NEGOTIATION); }} className="mt-2 text-sm bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600 transition-colors">Request Emergency Winch</button>
            )}
            {msg.action === 'WORKSHOP' && (
               <button onClick={() => navigate(View.WORKSHOP_LIST)} className="mt-2 text-sm bg-cyber-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors">Find Nearby Workshops</button>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass-panel p-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
              <div className="w-2 h-2 bg-cyber-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyber-primary rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-cyber-primary rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 glass-panel m-4 rounded-2xl flex items-center gap-2">
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} title="Upload Image" aria-label="Upload Image" />
        <button onClick={() => fileInputRef.current?.click()} className="p-3 text-cyber-primary hover:bg-cyber-primary/10 rounded-full transition-colors" title="Upload Image" aria-label="Upload Image">
          <Camera size={20} />
        </button>
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-cyber-primary hover:bg-cyber-primary/10'}`}
          title="Voice Input"
          aria-label="Voice Input"
        >
          {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isRecording ? "Recording audio..." : "Describe the issue..."}
          className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-gray-500"
        />
        <button onClick={() => handleSendMessage()} className="p-3 bg-cyber-primary text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform" title="Send Message" aria-label="Send Message">
          <Send size={20} />
        </button>
      </div>
    </div>
  );

  const renderWorkshopList = () => {
    const filteredWorkshops = workshops.filter(w => {
      let servicesList: string[] = [];
      if (Array.isArray(w.services)) {
        servicesList = w.services;
      } else if (typeof w.services === 'string') {
        try { servicesList = JSON.parse(w.services); } catch { servicesList = (w.services as string).split(',').map(s => s.trim()); }
      }
      
      const matchesSearch = !searchTerm || (w.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService = filterService === 'All' || servicesList.some(s => s.toLowerCase().includes(filterService.toLowerCase()));
      const matchesSpecialty = filterSpecialty === 'All' || (w.specialty || '').toLowerCase().includes(filterSpecialty.toLowerCase());

      return matchesSearch && matchesService && matchesSpecialty;
    });

    return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-black relative">
        <div className="p-6 pt-12 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={goBack} className="p-2 glass-panel rounded-full text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Find Workshop</h2>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="flex-1 glass-panel p-3 rounded-xl flex items-center gap-2">
              <Search className="text-gray-400" size={20} />
              <input
                placeholder="Search name or service..."
                className="bg-transparent outline-none text-slate-900 dark:text-white flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setShowFilter(!showFilter)} className={`p-3 glass-panel rounded-xl ${showFilter ? 'bg-cyber-primary text-white' : 'text-cyber-primary'}`} title="Toggle Filters" aria-label="Toggle Filters"><Filter size={20} /></button>
          </div>

          {showFilter && (
            <div className="mb-4 glass-panel p-4 rounded-xl animate-float">
              <p className="font-bold text-sm mb-2 text-slate-900 dark:text-white">Car Specialty:</p>
              <div className="flex flex-wrap gap-2">
                {['All', 'German Cars', 'Korean Cars', 'Japanese Cars', 'American Cars', 'European Cars'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterSpecialty(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterSpecialty === cat ? 'bg-cyber-primary text-white' : 'bg-slate-200 dark:bg-gray-700 text-gray-500'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All', 'Oil Change', 'Brake Pads', 'Suspension', 'Engine work', 'Mechanical', 'Electrical'].map(cat => (
              <button key={cat} onClick={() => setFilterService(cat)} className={`px-4 py-2 glass-panel rounded-lg text-sm font-bold transition-colors border whitespace-nowrap ${filterService === cat ? 'border-cyber-primary text-cyber-primary' : 'border-transparent text-gray-500 hover:text-cyber-primary hover:border-cyber-primary'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {/* Online & Working Workshops Section */}
          <div className="mb-6">
            <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Online & Working
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {filteredWorkshops
                .filter(shop => {
                  const isNew = shop.createdAt && new Date().getTime() - new Date(shop.createdAt).getTime() < 24 * 60 * 60 * 1000;
                  // For demo purposes, we consider new workshops and some others as 'Online'
                  return isNew || Number(shop.id.replace(/\D/g, '')) % 2 !== 0; 
                })
                .slice(0, 5)
                .map(shop => {
                  const isNew = shop.createdAt && new Date().getTime() - new Date(shop.createdAt).getTime() < 24 * 60 * 60 * 1000;
                  return (
                    <div key={`online-${shop.id}`} onClick={() => { setSelectedWorkshop(shop); navigate(View.WORKSHOP_DETAIL); }} className="min-w-[160px] glass-panel rounded-2xl overflow-hidden hover:border-cyber-primary/50 transition-colors relative cursor-pointer flex-shrink-0">
                      {isNew && (
                        <div className="absolute top-2 right-2 bg-cyber-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10 shadow-lg neon-border">NEW</div>
                      )}
                      <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow-lg">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        ONLINE
                      </div>
                      <img src={shop.image} className="w-full h-20 object-cover" alt={shop.name} />
                      <div className="p-3">
                        <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">{shop.name}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{shop.specialty}</p>
                      </div>
                    </div>
                  );
              })}
              {filteredWorkshops.length === 0 && (
                 <p className="text-gray-500 text-xs">No online workshops currently.</p>
              )}
            </div>
          </div>

          <h3 className="font-display font-bold text-lg mb-2 text-slate-900 dark:text-white">All Workshops</h3>
          {filteredWorkshops.map(shop => {
            const isNew = shop.createdAt && new Date().getTime() - new Date(shop.createdAt).getTime() < 24 * 60 * 60 * 1000;
            return (

            <div key={shop.id} onClick={() => { setSelectedWorkshop(shop); navigate(View.WORKSHOP_DETAIL); }} className="glass-panel p-4 rounded-2xl flex gap-4 hover:border-cyber-primary transition-all cursor-pointer group relative">
              {isNew && (
                <div className="absolute top-2 left-2 bg-cyber-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10 shadow-lg neon-border">NEW</div>
              )}
              <img src={shop.image} className="w-24 h-24 rounded-xl object-cover" alt={shop.name} title={shop.name} />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-cyber-primary transition-colors">{shop.name}</h3>
                  <span className="text-xs bg-cyber-primary/20 text-cyber-primary px-2 py-1 rounded font-bold">{shop.rating} ★</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{shop.specialty} • {shop.distance}</p>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    let sList: string[] = [];
                    if (Array.isArray(shop.services)) sList = shop.services;
                    else if (typeof shop.services === 'string') {
                      try { sList = JSON.parse(shop.services); } catch { sList = (shop.services as string).split(',').map(s => s.trim()); }
                    }
                    return (
                      <>
                        {sList.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-[10px] bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{s}</span>
                        ))}
                        {sList.length > 2 && <span className="text-[10px] bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">+{sList.length - 2}</span>}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWorkshopDetail = () => {
    if (!selectedWorkshop) {
      return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-black items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-cyber-primary/10 text-cyber-primary flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Workshop Selected</h2>
          <p className="text-gray-500 mb-8">Please select a workshop from the directory to view its details and book an appointment.</p>
          <button 
            onClick={() => navigate(View.WORKSHOP_LIST)}
            className="bg-cyber-primary text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 transition-all"
          >
            Browse Workshops
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-64 z-0">
          <img src={selectedWorkshop.image} className="w-full h-full object-cover" alt={selectedWorkshop.name} title={selectedWorkshop.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100 dark:from-black via-transparent to-transparent"></div>
          <button onClick={goBack} className="absolute top-6 left-6 p-2 rounded-full glass-panel text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
        </div>

        <div className="flex-1 mt-56 z-10 px-6 overflow-y-auto pb-24">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">{selectedWorkshop.name}</h2>
            <span className="text-xl font-bold text-cyber-primary">{selectedWorkshop.priceEstimate}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
            <MapPin size={16} className="text-cyber-primary" /> {selectedWorkshop.address}
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 glass-panel p-3 rounded-xl text-center">
              <span className="block font-bold text-lg text-slate-900 dark:text-white">{selectedWorkshop.rating}</span>
              <span className="text-xs text-gray-500">Rating</span>
            </div>
            <div className="flex-1 glass-panel p-3 rounded-xl text-center">
              <span className="block font-bold text-lg text-slate-900 dark:text-white">15</span>
              <span className="text-xs text-gray-500">Reviews</span>
            </div>
            <div className="flex-1 glass-panel p-3 rounded-xl text-center">
              <span className="block font-bold text-lg text-slate-900 dark:text-white">1.2km</span>
              <span className="text-xs text-gray-500">Distance</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">About</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{selectedWorkshop.description}</p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Services</h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  let sList: string[] = [];
                  if (Array.isArray(selectedWorkshop.services)) sList = selectedWorkshop.services;
                  else if (typeof selectedWorkshop.services === 'string') {
                    try { sList = JSON.parse(selectedWorkshop.services); } catch { sList = (selectedWorkshop.services as string).split(',').map(s => s.trim()); }
                  }
                  return sList.map((s: string) => (
                    <span key={s} className="px-3 py-1 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 rounded-full text-sm">{s}</span>
                  ));
                })()}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Working Hours</h3>
              <div className="glass-panel p-4 rounded-xl flex items-center gap-3 text-sm text-gray-500">
                <Clock size={18} className="text-cyber-primary" /> {selectedWorkshop.hours}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-slate-100 dark:from-black to-transparent">
          <button onClick={() => navigate(View.BOOKING)} className="w-full bg-cyber-primary text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-[1.02] transition-transform">
            Book Appointment
          </button>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="flex flex-col h-screen items-center justify-center p-8 text-center bg-slate-100 dark:bg-black">
      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-pulse">
        <CheckCircle className="text-green-500 w-12 h-12" />
      </div>
      <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">Booking Confirmed!</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-10">Your request has been sent successfully. You can track it in your profile.</p>
      <button onClick={() => navigate(View.HOME)} className="w-full bg-cyber-primary text-white font-bold py-4 rounded-xl mb-4">
        Back to Home
      </button>
      <button onClick={() => navigate(View.PROFILE)} className="text-cyber-primary font-bold">
        View My Bookings
      </button>
    </div>
  );

  const [editingVehicle, setEditingVehicle] = React.useState(false);
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [profileName, setProfileName] = React.useState(user.name);
  const [profileEmail, setProfileEmail] = React.useState(user.email);
  const [profilePhone, setProfilePhone] = React.useState(user.phone || '');
  const [profileGender, setProfileGender] = React.useState(user.gender || '');
  const [profileDob, setProfileDob] = React.useState(user.dob || '');
  const [vehicleBrand, setVehicleBrand] = React.useState(user.carBrand || '');
  const [vehicleModel, setVehicleModel] = React.useState(user.carModel || '');
  const [vehicleLicense, setVehicleLicense] = React.useState('ABC 123');

  const renderProfile = () => (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-black">
      <div className="p-6 pt-12 flex items-center gap-4">
        <button onClick={goBack} className="p-2 glass-panel rounded-full text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">My Profile</h2>
        <div className="ml-auto p-2 glass-panel rounded-full text-slate-900 dark:text-white"><Settings size={20} onClick={() => navigate(View.SETTINGS)} /></div>
      </div>

      <div className="px-6 pb-6 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gray-700 border-2 border-cyber-primary overflow-hidden">
            <img src="https://picsum.photos/100/100" alt="Profile" title="Profile" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name || 'User'}</h3>
                <p className="text-gray-500 text-sm">{user.email || 'user@example.com'}</p>
                <span className="text-xs bg-cyber-primary/20 text-cyber-primary px-2 py-0.5 rounded mt-1 inline-block">Free Member</span>
              </div>
              <button className="text-xs text-cyber-primary" onClick={() => setEditingProfile(v => !v)}>
                {editingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {editingProfile && (
          <div className="glass-panel p-4 rounded-xl mb-6 space-y-3">
            <input
              className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
              placeholder="Name"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
            />
            <input
              className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-500 border border-gray-600 focus:outline-none cursor-not-allowed"
              placeholder="Email"
              value={profileEmail}
              disabled
            />
            <input
              aria-label="Phone Number"
              className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
              placeholder="Phone"
              value={profilePhone}
              onChange={e => setProfilePhone(e.target.value)}
            />
            <select
              aria-label="Gender"
              title="Gender"
              className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
              value={profileGender}
              onChange={e => setProfileGender(e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              aria-label="Date of Birth"
              className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
              type="date"
              placeholder="Date of Birth"
              value={profileDob}
              onChange={e => setProfileDob(e.target.value)}
            />
            <button
              className="w-full bg-cyber-primary text-white text-sm font-bold py-2 rounded-lg"
              onClick={async () => {
                const tokenVal = localStorage.getItem('token');
                if (!tokenVal) return;
                try {
                  const res = await fetch(`${API_URL}/api/auth/me`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${tokenVal}`
                    },
                    body: JSON.stringify({
                      name: profileName,
                      phone: profilePhone,
                      gender: profileGender,
                      dob: profileDob
                    })
                  });
                  if (res.ok) {
                    const updatedUser = await res.json();
                    setUser(prev => ({ ...prev, ...updatedUser }));
                    authContext.login(tokenVal, updatedUser); // sync context
                    setEditingProfile(false);
                  }
                } catch (err) {
                  console.error('Failed to update profile', err);
                }
              }}
            >
              Save Profile
            </button>
          </div>
        )}

        {/* Wallet Balance & Top Up Card */}
        <div className="glass-panel p-5 rounded-2xl mb-6 flex justify-between items-center bg-gradient-to-br from-blue-900/10 to-indigo-900/10 border border-cyber-primary/25 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-primary/5 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Wallet Balance</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{user.walletBalance.toLocaleString()} EGP</p>
          </div>
          <button 
            onClick={() => setShowTopUpModal(true)} 
            className="px-4 py-2.5 bg-gradient-to-r from-cyber-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            id="profile-topup-btn"
          >
            <Plus size={14} /> Add Funds
          </button>
        </div>
        
        {/* Winch Commission Debt Card inside Profile */}
        {user.role === UserRole.WINCH_DRIVER && (user.commissionOwed || 0) > 0 && (
          <div className="glass-panel p-5 rounded-2xl mb-6 border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
              <span className="font-bold text-sm">Outstanding Commission Debt</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs">Unpaid Platform Dues</span>
              <span className="font-bold text-red-600 dark:text-red-400">{(user.commissionOwed || 0).toFixed(2)} EGP</span>
            </div>
            <button
              onClick={async () => {
                if (user.walletBalance < (user.commissionOwed || 0)) {
                  alert('Insufficient wallet balance to settle outstanding debt. Please top up first.');
                  return;
                }
                try {
                  const tokenVal = localStorage.getItem('token');
                  const res = await fetch(`${API_URL}/api/wallet/settle-commission`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${tokenVal || ''}`
                    }
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    alert(data.message);
                    await authContext.refreshUser();
                    
                    const resMe = await fetch(`${API_URL}/api/auth/me`, {
                      headers: { 'Authorization': `Bearer ${tokenVal || ''}` }
                    });
                    if (resMe.ok) {
                      const freshUser = await resMe.json();
                      setUser(prev => ({ ...prev, walletBalance: freshUser.walletBalance, commissionOwed: freshUser.commissionOwed }));
                    }
                  } else {
                    alert(data.error || 'Failed to settle commission debt.');
                  }
                } catch (err) {
                  console.error('Error settling commission debt:', err);
                  alert('Error settling commission debt.');
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition"
            >
              Settle Commission Debt
            </button>
          </div>
        )}

        <div className="glass-panel p-4 rounded-xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Car size={18} /> {user?.role === UserRole.WINCH_DRIVER ? 'My Winch' : 'My Vehicle'}</h4>
            <button className="text-xs text-cyber-primary" onClick={() => setEditingVehicle(v => !v)}>{editingVehicle ? 'Cancel' : 'Edit'}</button>
          </div>
          {editingVehicle ? (
            <div className="space-y-3">
              <input
                className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
                placeholder={user?.role === UserRole.WINCH_DRIVER ? 'Winch Brand (e.g. Mercedes)' : 'Car Brand (e.g. Toyota)'}
                value={vehicleBrand}
                onChange={e => setVehicleBrand(e.target.value)}
              />
              <input
                className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
                placeholder={user?.role === UserRole.WINCH_DRIVER ? 'Winch Type (e.g. Flatbed)' : 'Car Model (e.g. Corolla)'}
                value={vehicleModel}
                onChange={e => setVehicleModel(e.target.value)}
              />
              <input
                className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
                placeholder="License Plate (e.g. ABC 123)"
                value={vehicleLicense}
                onChange={e => setVehicleLicense(e.target.value)}
              />
              <button
                className="w-full bg-cyber-primary text-white text-sm font-bold py-2 rounded-lg"
                onClick={() => setEditingVehicle(false)}
              >
                Save Vehicle
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-gray-700 flex items-center justify-center">
                <Car className="text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{vehicleBrand} {vehicleModel}</p>
                <p className="text-xs text-gray-500">License: {vehicleLicense}</p>
              </div>
            </div>
          )}
        </div>

        {user?.role === 'USER' && (
          <>
            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Recent Bookings</h4>
            <div className="space-y-4">
              {user.bookings.length > 0 ? user.bookings.map(booking => (
                <div key={booking.id} className="glass-panel p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white">{booking.serviceName}</h5>
                      <p className="text-xs text-gray-500">{booking.date}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${booking.status === 'Confirmed' ? 'bg-green-500/20 text-green-500' :
                      booking.status === 'Completed' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>{booking.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                    <span className="text-gray-500">Total Paid</span>
                    <span className="font-bold text-slate-900 dark:text-white">{booking.price}</span>
                  </div>
                  {['Checked-In', 'Repairing', 'Quality Check'].includes(booking.status) && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mb-1">
                        <span>Progress</span>
                        <span>{booking.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <style>{`
                          #progress-bar-${booking.id} {
                            width: ${booking.progress}%;
                          }
                        `}</style>
                        <div id={`progress-bar-${booking.id}`} className="bg-cyber-primary h-2 rounded-full transition-all duration-500" />
                      </div>
                      <div className="text-xs text-cyber-primary font-bold mt-1 text-center animate-pulse">
                        {booking.status === 'Checked-In' ? 'Car is ready for diagnostics' :
                         booking.status === 'Repairing' ? 'Engineer is working on your car' :
                         'Final inspections underway'}
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-center text-gray-500 py-4">No bookings yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-black p-6 pt-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={goBack} className="p-2 glass-panel rounded-full text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Settings</h2>
      </div>

      {showPaymentSettings ? (
        <div className="flex-1 space-y-4 animate-float">
          <div onClick={() => setShowPaymentSettings(false)} className="cursor-pointer text-sm text-cyber-primary mb-4 flex items-center gap-2"><ArrowLeft size={16} /> Back to Settings</div>
          <h3 className="font-bold text-slate-900 dark:text-white">Saved Cards</h3>
          {savedCards.map(card => (
            <div key={card.id} className="glass-panel p-4 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CreditCard className="text-gray-500" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{card.type}</p>
                  <p className="text-xs text-gray-500">{card.number}</p>
                </div>
              </div>
              <button onClick={() => setSavedCards(prev => prev.filter(c => c.id !== card.id))} className="text-red-500 text-xs">Remove</button>
            </div>
          ))}
          <button onClick={() => setSavedCards(prev => [...prev, { id: Date.now(), number: '**** **** **** 0000', type: 'New Card' }])} className="w-full py-4 border border-dashed border-gray-500 rounded-xl text-gray-500 font-bold flex items-center justify-center gap-2">
            <Plus size={20} /> Add New Card
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-gray-700 rounded-lg text-slate-900 dark:text-white">
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Dark Mode</span>
            </div>
            <div
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-cyber-primary' : 'bg-gray-400'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`}></div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-gray-700 rounded-lg text-slate-900 dark:text-white"><Bell size={20} /></div>
              <span className="font-bold text-slate-900 dark:text-white">Notifications</span>
            </div>
            <div
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${notificationsEnabled ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`}></div>
            </div>
          </div>

          <div onClick={() => setShowPaymentSettings(true)} className="glass-panel p-4 rounded-xl flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-gray-700 rounded-lg text-slate-900 dark:text-white"><CreditCard size={20} /></div>
              <span className="font-bold text-slate-900 dark:text-white">Payment Methods</span>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-gray-700 rounded-lg text-slate-900 dark:text-white"><ShieldCheck size={20} /></div>
              <span className="font-bold text-slate-900 dark:text-white">Privacy & Security</span>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </div>

          <button
            onClick={() => { authContext.logout(); navigate(View.ONBOARDING); }}
            className="w-full p-4 glass-panel rounded-xl flex items-center justify-center gap-2 text-red-500 font-bold mt-8 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );

  const renderAdminDashboard = () => {
    const filteredTx = adminTransactions.filter(tx => {
      const matchesSearch =
        tx.customerName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        tx.providerName.toLowerCase().includes(adminSearch.toLowerCase());

      const matchesType =
        adminTxFilter === 'all' ||
        (adminTxFilter === 'workshop' && tx.type === 'Workshop Booking') ||
        (adminTxFilter === 'winch' && tx.type === 'Winch Ride');

      return matchesSearch && matchesType;
    });

    const filteredUsers = adminUsers.filter(u =>
      (u.name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(adminSearch.toLowerCase())
    );

    const handleLogout = () => {
      authContext.logout();
      navigate(View.LOGIN);
    };

    return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900 text-slate-900 dark:text-white">
        {/* Admin Header */}
        <div className="p-6 pt-12 flex justify-between items-center bg-gradient-to-b from-slate-200 dark:from-gray-950 to-transparent">
          <div>
            <span className="text-xs text-cyber-primary font-bold uppercase tracking-wider">Control Panel</span>
            <h2 className="text-2xl font-bold font-display">Admin Dashboard</h2>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition-colors flex items-center gap-1 text-xs font-bold"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="px-6 flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setAdminActiveTab('overview'); setAdminSearch(''); }}
            className={`flex-shrink-0 flex-1 py-3 text-xs font-bold rounded-xl transition-all ${adminActiveTab === 'overview' ? 'bg-cyber-primary text-white shadow-lg' : 'glass-panel text-slate-600 dark:text-gray-400'}`}
          >
            Overview
          </button>
          <button
            onClick={() => { setAdminActiveTab('transactions'); setAdminSearch(''); }}
            className={`flex-shrink-0 flex-1 py-3 text-xs font-bold rounded-xl transition-all ${adminActiveTab === 'transactions' ? 'bg-cyber-primary text-white shadow-lg' : 'glass-panel text-slate-600 dark:text-gray-400'}`}
          >
            Transactions
          </button>
          <button
            onClick={() => { setAdminActiveTab('users'); setAdminSearch(''); }}
            className={`flex-shrink-0 flex-1 py-3 text-xs font-bold rounded-xl transition-all ${adminActiveTab === 'users' ? 'bg-cyber-primary text-white shadow-lg' : 'glass-panel text-slate-600 dark:text-gray-400'}`}
          >
            Users
          </button>
          <button
            onClick={() => { setAdminActiveTab('commission'); setAdminSearch(''); }}
            className={`flex-shrink-0 flex-1 py-3 text-xs font-bold rounded-xl transition-all relative ${adminActiveTab === 'commission' ? 'bg-amber-500 text-white shadow-lg' : 'glass-panel text-slate-600 dark:text-gray-400'}`}
          >
            Commission
            {adminStats?.pendingCommissionDrivers > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {adminStats.pendingCommissionDrivers}
              </span>
            )}
          </button>
          <button
            onClick={() => { setAdminActiveTab('approvals'); setAdminSearch(''); }}
            className={`flex-shrink-0 flex-1 py-3 text-xs font-bold rounded-xl transition-all relative ${adminActiveTab === 'approvals' ? 'bg-purple-600 text-white shadow-lg' : 'glass-panel text-slate-600 dark:text-gray-400'}`}
          >
            Approvals
            {adminUsers.filter(u => u.approvalStatus === 'PENDING').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {adminUsers.filter(u => u.approvalStatus === 'PENDING').length}
              </span>
            )}
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto no-scrollbar space-y-6">
          {adminActiveTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-2xl border-l-4 border-cyber-primary">
                  <div className="text-cyber-primary mb-2"><DollarSign size={20} /></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total Volume</p>
                  <p className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
                    {adminStats ? `${adminStats.revenue.toLocaleString()} EGP` : '0 EGP'}
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border-l-4 border-green-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="text-green-500 mb-2"><Wallet size={20} /></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Commissions (10%)</p>
                  <p className="text-xl font-bold mt-1 text-green-500">
                    {adminStats ? `${adminStats.commission.toLocaleString()} EGP` : '0 EGP'}
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border-l-4 border-purple-500">
                  <div className="text-purple-500 mb-2"><User size={20} /></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Platform Users</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {adminStats ? Number(Object.values(adminStats.users).reduce((a: any, b: any) => a + b, 0)) : 0}
                    </p>
                    {adminStats?.onlineUsersCount !== undefined && (
                      <p className="text-xs font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        {adminStats.onlineUsersCount} Live
                      </p>
                    )}
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-2xl border-l-4 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <div className="text-amber-500 mb-2"><Truck size={20} /></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Pending Commission</p>
                  <p className="text-xl font-bold mt-1 text-amber-500">
                    {adminStats?.pendingCommissionTotal ? `${adminStats.pendingCommissionTotal.toFixed(0)} EGP` : '0 EGP'}
                  </p>
                  {adminStats?.pendingCommissionDrivers > 0 && (
                    <p className="text-[10px] text-red-500 mt-0.5">{adminStats.pendingCommissionDrivers} driver(s) blocked</p>
                  )}
                </div>

                <div className="glass-panel p-4 rounded-2xl border-l-4 border-cyan-500">
                  <div className="text-cyan-500 mb-2"><Activity size={20} /></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">System Status</p>
                  <p className="text-xl font-bold mt-1 text-cyan-500 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    {adminStats ? adminStats.systemHealth : 'Active'}
                  </p>
                </div>

                <div onClick={() => setAdminActiveTab('approvals')} className="glass-panel p-4 rounded-2xl border-l-4 border-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.1)] cursor-pointer hover:bg-purple-500/5 transition-colors">
                  <div className="text-purple-600 mb-2"><CheckCircle size={20} /></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Pending Approvals</p>
                  <p className="text-xl font-bold mt-1 text-purple-600 flex items-center gap-2">
                    {adminUsers.filter(u => u.approvalStatus === 'PENDING').length} User(s)
                    {adminUsers.filter(u => u.approvalStatus === 'PENDING').length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                  </p>
                </div>
              </div>

              {/* Platform Activity */}
              <div className="glass-panel p-4 rounded-2xl">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Platform Activity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Briefcase size={16} className="text-cyber-primary" /> Active Garages
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{adminStats?.workshops || 0}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`bg-cyber-primary h-full rounded-full ${
                      (adminStats?.workshops || 0) * 10 >= 100 ? 'w-full' :
                      (adminStats?.workshops || 0) * 10 >= 80 ? 'w-4/5' :
                      (adminStats?.workshops || 0) * 10 >= 60 ? 'w-3/5' :
                      (adminStats?.workshops || 0) * 10 >= 40 ? 'w-2/5' :
                      (adminStats?.workshops || 0) * 10 >= 20 ? 'w-1/5' :
                      (adminStats?.workshops || 0) * 10 > 0 ? 'w-[10%]' : 'w-0'
                    }`}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Truck size={16} className="text-cyan-500" /> Winch Drivers
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{adminStats?.users.WINCH_DRIVER || 0}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`bg-cyan-500 h-full rounded-full ${
                      (adminStats?.users.WINCH_DRIVER || 0) * 10 >= 100 ? 'w-full' :
                      (adminStats?.users.WINCH_DRIVER || 0) * 10 >= 80 ? 'w-4/5' :
                      (adminStats?.users.WINCH_DRIVER || 0) * 10 >= 60 ? 'w-3/5' :
                      (adminStats?.users.WINCH_DRIVER || 0) * 10 >= 40 ? 'w-2/5' :
                      (adminStats?.users.WINCH_DRIVER || 0) * 10 >= 20 ? 'w-1/5' :
                      (adminStats?.users.WINCH_DRIVER || 0) * 10 > 0 ? 'w-[10%]' : 'w-0'
                    }`}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Calendar size={16} className="text-purple-500" /> Active Appointments
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{adminStats?.activeAppointments || 0}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`bg-purple-500 h-full rounded-full ${
                      (adminStats?.activeAppointments || 0) * 10 >= 100 ? 'w-full' :
                      (adminStats?.activeAppointments || 0) * 10 >= 80 ? 'w-4/5' :
                      (adminStats?.activeAppointments || 0) * 10 >= 60 ? 'w-3/5' :
                      (adminStats?.activeAppointments || 0) * 10 >= 40 ? 'w-2/5' :
                      (adminStats?.activeAppointments || 0) * 10 >= 20 ? 'w-1/5' :
                      (adminStats?.activeAppointments || 0) * 10 > 0 ? 'w-[10%]' : 'w-0'
                    }`}></div>
                  </div>
                </div>
              </div>

              {/* User Breakdown */}
              <div className="glass-panel p-4 rounded-2xl">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">User Type Distribution</h3>
                {adminStats && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-slate-700 dark:text-gray-400">
                      <span>Customers</span>
                      <span className="font-bold text-slate-900 dark:text-white">{adminStats.users.USER}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700 dark:text-gray-400">
                      <span>Winch Drivers</span>
                      <span className="font-bold text-slate-900 dark:text-white">{adminStats.users.WINCH_DRIVER}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700 dark:text-gray-400">
                      <span>Workshop Owners</span>
                      <span className="font-bold text-slate-900 dark:text-white">{adminStats.users.WORKSHOP_OWNER}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700 dark:text-gray-400">
                      <span>Admins</span>
                      <span className="font-bold text-slate-900 dark:text-white">{adminStats.users.ADMIN}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── COMMISSION TAB ─────────────────────────────────────────────── */}
          {adminActiveTab === 'commission' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Summary Banner */}
              {adminStats?.pendingCommissionDrivers > 0 ? (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
                  <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Platform Outstanding</p>
                  <p className="text-3xl font-bold">{adminStats.pendingCommissionTotal?.toFixed(2)} <span className="text-lg">EGP</span></p>
                  <p className="text-xs opacity-80 mt-1">{adminStats.pendingCommissionDrivers} driver(s) have unpaid cash-ride commission</p>
                </div>
              ) : (
                <div className="glass-panel p-4 rounded-2xl text-center">
                  <p className="text-green-500 font-bold text-lg">✅ All Clear</p>
                  <p className="text-sm text-gray-500">No pending commission debts</p>
                </div>
              )}

              {/* Drivers Table */}
              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider">All Winch Drivers</h3>
                  <button onClick={fetchAdminData} className="text-xs text-cyber-primary font-bold">↻ Refresh</button>
                </div>

                {adminDriverCommissions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No winch drivers found.</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {adminDriverCommissions.map((driver) => {
                      const isLoading = adminCommissionLoading[driver.id];
                      const inputVal = adminCommissionInputs[driver.id] ?? (driver.commissionOwed > 0 ? driver.commissionOwed.toFixed(2) : '');
                      return (
                        <div key={driver.id} className={`p-4 ${driver.hasDebt ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-slate-900 dark:text-white">{driver.name || 'Unnamed Driver'}</p>
                                {driver.hasDebt && (
                                  <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">BLOCKED</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{driver.email}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{driver.totalRides} rides · Wallet: {driver.walletBalance?.toFixed(2)} EGP</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">Owes</p>
                              <p className={`text-lg font-bold ${driver.hasDebt ? 'text-red-500' : 'text-green-500'}`}>
                                {driver.commissionOwed.toFixed(2)} EGP
                              </p>
                            </div>
                          </div>

                          {/* Admin set-amount control */}
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={inputVal}
                              onChange={(e) => setAdminCommissionInputs(prev => ({ ...prev, [driver.id]: e.target.value }))}
                              placeholder="Set commission amount"
                              aria-label={`Set commission for ${driver.name}`}
                              title={`Set commission amount for ${driver.name}`}
                              className="flex-1 bg-slate-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none border border-transparent focus:border-amber-500"
                            />
                            <button
                              disabled={isLoading}
                              onClick={async () => {
                                const amount = parseFloat(inputVal);
                                if (isNaN(amount) || amount < 0) return;
                                setAdminCommissionLoading(prev => ({ ...prev, [driver.id]: true }));
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`${API_URL}/api/admin/users/${driver.id}/commission`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ commissionOwed: amount })
                                  });
                                  if (res.ok) {
                                    await fetchAdminData();
                                  } else {
                                    const err = await res.json();
                                    alert(err.error || 'Failed to update commission');
                                  }
                                } finally {
                                  setAdminCommissionLoading(prev => ({ ...prev, [driver.id]: false }));
                                }
                              }}
                              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                            >
                              {isLoading ? <span className="animate-spin w-3 h-3 border border-white/30 border-t-white rounded-full" /> : null}
                              Set Amount
                            </button>
                            {driver.hasDebt && (
                              <button
                                disabled={isLoading}
                                onClick={async () => {
                                  setAdminCommissionLoading(prev => ({ ...prev, [driver.id]: true }));
                                  try {
                                    const token = localStorage.getItem('token');
                                    await fetch(`${API_URL}/api/admin/users/${driver.id}/commission`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({ commissionOwed: 0 })
                                    });
                                    await fetchAdminData();
                                  } finally {
                                    setAdminCommissionLoading(prev => ({ ...prev, [driver.id]: false }));
                                  }
                                }}
                                className="px-3 py-2 bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                Clear Debt
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {adminActiveTab === 'transactions' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Search and Filters */}
              <div className="flex gap-2">
                <div className="flex-1 glass-panel p-3 rounded-xl flex items-center gap-2">
                  <Search className="text-gray-400" size={18} />
                  <input
                    placeholder="Search customer or shop..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="bg-transparent outline-none text-slate-900 dark:text-white flex-1 text-sm placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setAdminTxFilter('all')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all ${adminTxFilter === 'all' ? 'bg-cyber-primary text-white' : 'glass-panel text-slate-500 dark:text-gray-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setAdminTxFilter('workshop')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all ${adminTxFilter === 'workshop' ? 'bg-cyber-primary text-white' : 'glass-panel text-slate-500 dark:text-gray-400'}`}
                >
                  Workshops
                </button>
                <button
                  onClick={() => setAdminTxFilter('winch')}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all ${adminTxFilter === 'winch' ? 'bg-cyber-primary text-white' : 'glass-panel text-slate-500 dark:text-gray-400'}`}
                >
                  Winch Rides
                </button>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                {filteredTx.length > 0 ? filteredTx.map((tx, idx) => (
                  <div key={tx.id || idx} className="glass-panel p-4 rounded-xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.type === 'Winch Ride' ? 'bg-cyan-500/20 text-cyan-500' : 'bg-cyber-primary/20 text-cyber-primary'}`}>
                          {tx.type}
                        </span>
                        <h4 className="font-bold text-sm mt-2 text-slate-900 dark:text-white">{tx.providerName}</h4>
                        <p className="text-xs text-gray-500 mt-1">Client: {tx.customerName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{tx.amount} EGP</p>
                        <p className="text-[10px] text-green-500 font-bold mt-1">Comm: +{tx.commission.toFixed(1)} EGP</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-6 text-sm">No transactions found.</p>
                )}
              </div>
            </div>
          )}

          {adminActiveTab === 'users' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Search Bar */}
              <div className="glass-panel p-3 rounded-xl flex items-center gap-2">
                <Search className="text-gray-400" size={18} />
                <input
                  placeholder="Search user name or email..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="bg-transparent outline-none text-slate-900 dark:text-white flex-1 text-sm placeholder-gray-500"
                />
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.length > 0 ? filteredUsers.map((u, idx) => (
                  <div key={u.id || idx} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{u.name || 'No Name'}</h4>
                        {u.isOnline ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Offline
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{u.email}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-red-500/20 text-red-500' :
                        u.role === 'WINCH_DRIVER' ? 'bg-cyan-500/20 text-cyan-500' :
                          u.role === 'WORKSHOP_OWNER' ? 'bg-purple-500/20 text-purple-500' :
                            'bg-gray-500/20 text-gray-500'
                        }`}>
                        {u.role}
                      </span>
                      {(u.role === 'WINCH_DRIVER' || u.role === 'WORKSHOP_OWNER') && (
                        <p className="text-xs text-gray-500 mt-2 font-bold">{u.walletBalance.toLocaleString()} EGP</p>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-6 text-sm">No users found.</p>
                )}
              </div>
            </div>
          )}

          {adminActiveTab === 'approvals' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Pending Provider Approvals</h3>
              <div className="space-y-4 pb-12">
                {adminUsers.filter(u => u.approvalStatus === 'PENDING').length > 0 ? (
                  adminUsers.filter(u => u.approvalStatus === 'PENDING').map((u, idx) => (
                    <div key={u.id || idx} className="glass-panel p-6 rounded-2xl space-y-4 border border-white/10 shadow-lg relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            u.role === 'WINCH_DRIVER' ? 'bg-cyan-500/20 text-cyan-500' : 'bg-purple-500/20 text-purple-500'
                          }`}>
                            {u.role === 'WINCH_DRIVER' ? 'Winch Driver' : 'Workshop Owner'}
                          </span>
                          <h4 className="font-bold text-base mt-2 text-slate-900 dark:text-white">{u.name || 'No Name'}</h4>
                          <p className="text-xs text-gray-500 mt-1">{u.email}</p>
                          <p className="text-xs text-gray-500">{u.phone}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                          Pending
                        </span>
                      </div>

                      {/* Submitted Details & Document Previews */}
                      <div className="bg-slate-50 dark:bg-black/40 rounded-xl p-4 space-y-3 text-xs">
                        {u.role === 'WINCH_DRIVER' ? (
                          <>
                            <p className="text-slate-700 dark:text-gray-300"><strong>License Expiry:</strong> {u.licenseExpiry}</p>
                            <p className="text-slate-700 dark:text-gray-300"><strong>Vehicle Plate:</strong> {u.plateNumber}</p>
                            
                            <div className="grid grid-cols-3 gap-2 pt-2">
                              {u.driverPhoto && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 block font-semibold text-center">Driver Photo</span>
                                  <img src={u.driverPhoto} alt="Driver" className="w-full h-16 object-cover rounded border border-white/20 cursor-pointer" onClick={() => window.open(u.driverPhoto, '_blank')} />
                                </div>
                              )}
                              {u.nationalIdCard && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 block font-semibold text-center">National ID</span>
                                  <img src={u.nationalIdCard} alt="National ID" className="w-full h-16 object-cover rounded border border-white/20 cursor-pointer" onClick={() => window.open(u.nationalIdCard, '_blank')} />
                                </div>
                              )}
                              {u.criminalRecordCert && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 block font-semibold text-center">Clearance Cert</span>
                                  <img src={u.criminalRecordCert} alt="Criminal Record" className="w-full h-16 object-cover rounded border border-white/20 cursor-pointer" onClick={() => window.open(u.criminalRecordCert, '_blank')} />
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-slate-700 dark:text-gray-300"><strong>Workshop Name:</strong> {u.workshopName}</p>
                            <p className="text-slate-700 dark:text-gray-300"><strong>Workshop Location:</strong> {u.workshopLocation}</p>
                            
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              {u.taxCard && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 block font-semibold text-center">Tax Card</span>
                                  <img src={u.taxCard} alt="Tax Card" className="w-full h-16 object-cover rounded border border-white/20 cursor-pointer" onClick={() => window.open(u.taxCard, '_blank')} />
                                </div>
                              )}
                              {u.ownerNationalIdCard && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 block font-semibold text-center">Manager ID</span>
                                  <img src={u.ownerNationalIdCard} alt="Manager ID" className="w-full h-16 object-cover rounded border border-white/20 cursor-pointer" onClick={() => window.open(u.ownerNationalIdCard, '_blank')} />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_URL}/api/admin/users/${u.id}/approve`, {
                                method: 'PATCH',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (res.ok) {
                                fetchAdminData();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_URL}/api/admin/users/${u.id}/reject`, {
                                method: 'PATCH',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (res.ok) {
                                fetchAdminData();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-12 text-sm">No pending approvals found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- MAIN RENDER SWITCH ---

  return (
    <div className={`h-full ${isDarkMode ? 'dark' : ''}`}>
      <div className="font-sans text-slate-900 dark:text-white max-w-md mx-auto h-full overflow-hidden shadow-2xl relative bg-slate-50 dark:bg-black transition-colors duration-300">
        
        {/* ── HISTORY MODAL ─────────────────────────────────────────────────── */}
        {showHistory && (
          <div className="absolute inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-cyber-900 overflow-hidden">
            <div className="p-6 pt-12 flex items-center justify-between shadow-sm bg-white dark:bg-cyber-900 shrink-0">
              <button aria-label="Back" onClick={() => setShowHistory(false)} className="p-2 rounded-full glass-panel text-slate-900 dark:text-white"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Rides</h2>
              <div className="w-10"></div>
            </div>
            
            <div className="p-4 flex gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
              {rideHistory.filter(h => {
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
                      <p className="text-xs text-gray-500">Driver: {trip.driverName}</p>
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
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Pickup</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Dropoff</div>
                    </div>
                  </div>
                </div>
              ))}
              {rideHistory.length === 0 && (
                <div className="text-center py-10 text-gray-500">No rides found for this period.</div>
              )}
            </div>
          </div>
        )}

        {/* Onboarding & Auth */}
        {view === View.ONBOARDING && renderOnboarding()}
        {view === View.LOGIN && renderLogin()}
        {view === View.SIGN_UP && renderSignUp()}
        {view === View.FORGOT_PASSWORD && renderForgotPassword()}
        {view === View.USER_DETAILS && renderUserDetails()}
        {view === View.ROLE_SELECTION && renderRoleSelection()}

        {/* Specific Onboarding */}
        {view === View.SETUP_CAR && renderSetupCar()}
        {view === View.WINCH_ONBOARDING && renderWinchOnboarding()}
        {view === View.WORKSHOP_ONBOARDING && renderWorkshopOnboarding()}

        {/* Dashboards */}
        {view === View.HOME && renderHome()}
        {view === View.WINCH_DASHBOARD && user.role === UserRole.WINCH_DRIVER && <WinchDashboard />}
        {view === View.WINCH_DASHBOARD && user.role !== UserRole.WINCH_DRIVER && renderHome()}
        {view === View.WORKSHOP_DASHBOARD && user.role === UserRole.WORKSHOP_OWNER && renderWorkshopDashboard()}
        {view === View.WORKSHOP_DASHBOARD && user.role !== UserRole.WORKSHOP_OWNER && renderHome()}

        {/* Features */}
        {view === View.AI_CHAT && renderAIChat()}
        {view === View.WINCH_NEGOTIATION && renderWinchNegotiation()}
        {view === View.WORKSHOP_LIST && renderWorkshopList()}
        {view === View.WORKSHOP_DETAIL && renderWorkshopDetail()}
        {view === View.BOOKING && renderBooking()}
        {view === View.SUCCESS && renderSuccess()}
        {view === View.PROFILE && renderProfile()}
        {view === View.SETTINGS && renderSettings()}
        {view === View.SPARE_PARTS && renderSpareParts()}
        {view === View.WINCH_LIVE_MAP && liveBookingId && <WinchLiveUser bookingId={liveBookingId} onBack={() => { setLiveBookingId(null); navigate(user.role === UserRole.WINCH_DRIVER ? View.WINCH_DASHBOARD : View.HOME); }} />}
        {/* Admin: only render if user has ADMIN role */}
        {view === View.ADMIN_DASHBOARD && (authUser?.role === 'ADMIN' || user.role === UserRole.ADMIN) && renderAdminDashboard()}
        {view === View.ADMIN_DASHBOARD && authUser?.role !== 'ADMIN' && user.role !== UserRole.ADMIN && renderHome()}
        
        {view === View.BIDDING_USER && <BiddingUser onBack={() => navigate(View.HOME)} />}
        {view === View.BIDDING_WORKSHOP && <BiddingWorkshop onBack={() => navigate(View.WORKSHOP_DASHBOARD)} />}

        {/* Global Wallet Top Up Modal Overlay */}
        {showTopUpModal && renderTopUpModal()}
        {renderBookingDetailsModal()}
      </div>
    </div>
  );
};

export default App;