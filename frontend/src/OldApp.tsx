import React, { useState, useEffect, useRef } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { View, Message, Workshop, WinchOffer, CarType, UserProfile, UserBooking, UserRole, WorkshopAppointment } from './types';
import { WinchLiveUser } from './pages/WinchLiveUser';
import { diagnoseCarIssue, MediaInput } from './services/geminiService';
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

const App: React.FC = () => {
  const authContext = useAuth();
  const { user: authUser, token } = authContext;

  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/workshops`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setWorkshops(data); });
  }, []);

  // --- App State ---
  const [view, setView] = useState<View>(() => {
    const localToken = localStorage.getItem('token');
    if (localToken && authUser) {
      if (authUser.role === 'ADMIN') return View.ADMIN_DASHBOARD;
      if (authUser.role === 'WINCH_DRIVER') return View.WINCH_DASHBOARD;
      if (authUser.role === 'WORKSHOP_OWNER') return View.WORKSHOP_DASHBOARD;
      return View.HOME;
    }
    return View.ONBOARDING;
  });
  const [history, setHistory] = useState<View[]>(() => {
    const localToken = localStorage.getItem('token');
    if (localToken && authUser) {
      if (authUser.role === 'ADMIN') return [View.ADMIN_DASHBOARD];
      if (authUser.role === 'WINCH_DRIVER') return [View.WINCH_DASHBOARD];
      if (authUser.role === 'WORKSHOP_OWNER') return [View.WORKSHOP_DASHBOARD];
      return [View.HOME];
    }
    return [View.ONBOARDING];
  });

  // Admin Dashboard State
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'transactions' | 'users'>('overview');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminTxFilter, setAdminTxFilter] = useState<'all' | 'workshop' | 'winch'>('all');

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
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    if (authContext.user?.role === 'ADMIN' && (view === View.ADMIN_DASHBOARD || view === View.HOME)) {
      fetchAdminData();
    }
  }, [authContext.user, view]);

  // Sync authUser to user state
  const [locationName, setLocationName] = useState('Locating...');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);

  // User Profile State
  const [user, setUser] = useState<UserProfile>({
    name: authUser?.name || '',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    gender: authUser?.gender || '',
    dob: authUser?.dob || '',
    role: authUser?.role || null,
    walletBalance: authUser?.walletBalance || 0,
    bookings: authUser?.bookings || []
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
  const [winchStatus, setWinchStatus] = useState<'idle' | 'searching' | 'negotiating' | 'confirmed'>('idle');
  const [liveBookingId, setLiveBookingId] = useState<string | null>(null);
  const [activeOffers, setActiveOffers] = useState<WinchOffer[]>([]);
  const winchSocketRef = useRef<ReturnType<typeof io> | null>(null);
  const winchSocketIdRef = useRef<string>('');

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
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Booking State
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00 AM');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

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
        name: authUser.name || prev.name,
        email: authUser.email || prev.email,
        phone: authUser.phone || prev.phone,
        gender: authUser.gender || prev.gender,
        dob: authUser.dob || prev.dob,
        role: authUser.role || prev.role,
        walletBalance: authUser.walletBalance ?? prev.walletBalance,
        bookings: authUser.bookings || prev.bookings
      }));

      setView(currentView => {
        if (currentView === View.ONBOARDING || currentView === View.LOGIN || currentView === View.SIGN_UP) {
          if (authUser.role === 'ADMIN') return View.ADMIN_DASHBOARD;
          if (authUser.role === 'WINCH_DRIVER') return View.WINCH_DASHBOARD;
          if (authUser.role === 'WORKSHOP_OWNER') return View.WORKSHOP_DASHBOARD;
          return View.HOME;
        }
        return currentView;
      });
    }
  }, [authUser]);

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
            date: appt.time,
            status: appt.status || 'Pending',
            price: `${appt.price}.00 EGP`
          }));
          setUser(prev => ({ ...prev, bookings: mappedBookings }));
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
    // Auto scroll chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Geolocation Logic
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Simulated Reverse Geocode for demo
          setLocationName('Smart Village, Cairo (GPS)');
        },
        (error) => {
          console.error("Error getting location", error);
          setLocationName('Location Unavailable');
        }
      );
    } else {
      setLocationName('GPS Not Supported');
    }
  }, []);

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
    // Simulation of incoming request for Winch Dashboard
    // Only receive requests if Online AND Not Busy
    if (isWinchOnline && !isWinchBusy && !activeWinchRequest) {
      const timeout = setTimeout(() => {
        setActiveWinchRequest({
          id: 'wr1',
          car: 'Toyota Corolla (2020)',
          distance: '5km',
          issue: 'Breakdown',
          price: 350,
          userCounterOffer: null
        });
        setWinchRequestTimer(30);
      }, 5001); // 5s delay to find a request
      return () => clearTimeout(timeout);
    }
  }, [isWinchOnline, isWinchBusy, activeWinchRequest]);

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
  const navigate = (newView: View) => {
    setHistory([...history, newView]);
    setView(newView);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setView(newHistory[newHistory.length - 1]);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Logic Functions ---

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

    // Call Gemini Service
    const responseText = await diagnoseCarIssue(userMsg.text, media);

    setIsTyping(false);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText }]);
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
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const base64 = await blobToBase64(blob);
          handleSendMessage({ mimeType: 'audio/webm', data: base64 });
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
  const requestWinch = () => {
    setWinchStatus('searching');
    setActiveOffers([]);

    // Connect socket
    const socket = io(API_URL, { withCredentials: true });
    winchSocketRef.current = socket;

    socket.on('connect', () => {
      winchSocketIdRef.current = socket.id ?? '';
      if (user?.id) socket.emit('register_user', user.id);
      // Ask for current online drivers
      socket.emit('get_drivers');
    });

    // Receive list of online drivers
    socket.on('drivers_updated', (drivers: any[]) => {
      if (drivers.length > 0) {
        const mapped: WinchOffer[] = drivers.map((d: any) => ({
          id: d.socketId,
          driverName: d.driverName,
          price: d.price || 500,
          eta: '~10 min',
          rating: 4.8,
          vehicle: d.vehicle || 'Winch Truck',
          status: 'pending' as const,
          driverId: d.driverId,
          driverSocketId: d.socketId,
        }));
        setActiveOffers(mapped);
        setWinchStatus('negotiating');
      } else {
        // No drivers online yet — keep searching
        setWinchStatus('searching');
      }
    });

    // Driver accepted → booking created on server
    socket.on('booking_confirmed', (data: { bookingId: string; driverName: string; vehicle: string; price: number }) => {
      setLiveBookingId(data.bookingId);
      setWinchStatus('confirmed');
      navigate(View.WINCH_LIVE_MAP);
    });

    // Driver declined
    socket.on('request_declined', (data: { message: string }) => {
      alert(data.message);
      // Refresh driver list
      socket.emit('get_drivers');
      setWinchStatus('negotiating');
    });

    // Driver became unavailable
    socket.on('driver_unavailable', (data: { message: string }) => {
      alert(data.message);
      socket.emit('get_drivers');
    });
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
    if (!socket) return;
    // Send counter offer — server will forward to driver (driver sees updated price)
    // For now we update locally and resend the request
    alert(`Counter offer of ${offer.price} EGP sent to driver. Waiting...`);
  };

  const handleAcceptOffer = (offer: WinchOffer) => {
    const socket = winchSocketRef.current;
    if (!socket || !user?.id) return;
    setWinchStatus('searching'); // show searching while driver confirms

    socket.emit('request_driver', {
      customerId: user.id,
      customerName: user.name || 'Customer',
      driverSocketId: (offer as any).driverSocketId || offer.id,
      car: `${user.carBrand || 'My'} ${user.carModel || 'Car'}`,
      issue: 'Breakdown assistance',
      price: offer.price,
      lat: 30.0444,
      lng: 31.2357,
    });
  };

  // Workshop Booking Logic
  const handleConfirmBooking = async () => {
    if (selectedWorkshop) {
      const dates = ['Mon 12', 'Tue 13', 'Wed 14'];
      const dateStr = `${dates[selectedDateIndex]} - ${selectedTimeSlot}`;
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
            time: dateStr,
            carDetails: carInfo,
            price: priceVal
          })
        });

        if (!response.ok) {
          throw new Error('Failed to book appointment on backend');
        }

        await fetchAppointments();
        navigate(View.SUCCESS);
      } catch (error) {
        console.error('Error booking appointment:', error);
        alert('Could not book appointment. Please try again.');
      }
    }
  };

  // Winch Dashboard Logic (Driver Side)
  const handleWinchAccept = () => {
    if (activeWinchRequest) {
      setUser(prev => ({ ...prev, walletBalance: prev.walletBalance + activeWinchRequest.price }));
      alert(`Accepted! Request assigned. +${activeWinchRequest.price} EGP (Pending completion)`);
      setActiveWinchRequest(null);
    }
  };

  const handleWinchDecline = () => {
    setActiveWinchRequest(null);
  };

  const handleWinchDriverNegotiate = (newPrice: number) => {
    // Driver sets a new price in response to a counter
    setActiveWinchRequest((prev: any) => ({ ...prev, price: newPrice, userCounterOffer: null }));
    alert(`You proposed ${newPrice} EGP. Waiting for user...`);
    // Simulate user accept after delay
    setTimeout(() => {
      handleWinchAccept(); // User accepted
    }, 2000);
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
  const handleWorkshopAction = async (id: string, action: 'Check-In' | 'Reschedule' | 'Accept' | 'Decline') => {
    const tokenVal = localStorage.getItem('token');
    if (!tokenVal) return;

    let newStatus: string | null = null;
    if (action === 'Accept') newStatus = 'Confirmed';
    if (action === 'Decline') newStatus = 'Cancelled';
    if (action === 'Check-In') newStatus = 'Checked-In';

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
    if (user.walletBalance > 0) {
      alert(`Withdrawal request for ${user.walletBalance} EGP sent to bank.`);
      setUser(prev => ({ ...prev, walletBalance: 0 }));
    }
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
      const yv = validateCarYear(user.carYear || '');
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
                onBlur={() => { setCarTouched(p => ({ ...p, year: true })); setCarErrors(p => ({ ...p, year: validateCarYear(user.carYear || '').message || undefined })); }}
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
            <button onClick={() => navigate(View.PROFILE)} className="mt-4 w-full py-2 text-xs font-bold bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-cyber-primary hover:text-white transition-colors">View Details</button>
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
            <button onClick={() => navigate(View.AI_CHAT)} className="flex flex-col items-center gap-2 group">
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
            <button onClick={() => navigate(View.WORKSHOP_LIST)} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center group-hover:bg-cyber-primary/20 group-hover:border-cyber-primary transition-all">
                <Wrench className="text-cyber-primary dark:text-cyber-accent group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs text-slate-600 dark:text-gray-300">Repair</span>
            </button>
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
            {workshops.map(shop => (
              <div key={shop.id} className="min-w-[200px] glass-panel rounded-2xl overflow-hidden hover:border-cyber-primary/50 transition-colors" onClick={() => { setSelectedWorkshop(shop); navigate(View.WORKSHOP_DETAIL); }}>
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
            ))}
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

  const renderSpareParts = () => (
    <div className="flex flex-col h-screen p-6 pt-12">
      <button onClick={goBack} className="mb-6 w-fit text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
      <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-6">Spare Parts</h2>
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
        <Package size={64} className="text-cyber-primary/50" />
        <p className="text-gray-500">Search for specific parts or upload a photo of the broken part for AI identification.</p>
        <button className="bg-cyber-primary text-white px-6 py-2 rounded-xl font-bold">Upload Photo</button>
      </div>
      <div className="mt-8">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Categories</h3>
        <div className="grid grid-cols-2 gap-4">
          {['Brakes', 'Engine', 'Suspension', 'Electric'].map(cat => (
            <div key={cat} className="glass-panel p-4 rounded-xl text-center text-slate-700 dark:text-gray-300 font-bold hover:border-cyber-primary cursor-pointer border border-transparent">
              {cat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWinchNegotiation = () => {
    return (
      <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900 relative">
        {/* Map Background (Simulated) */}
        <div className="absolute inset-0 bg-slate-200 dark:bg-gray-800 opacity-50 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
          {/* Radar Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-cyber-primary/30 rounded-full animate-ping"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-cyber-primary dark:bg-cyber-accent rounded-full shadow-[0_0_20px_rgba(6,182,212,1)] z-10"></div>

          {/* Simulated Winch Drivers moving */}
          {activeOffers.length > 0 && (
            <div className="absolute top-[40%] left-[60%] w-8 h-8 text-yellow-500 dark:text-yellow-400 animate-pulse transition-all duration-1000">
              <Truck />
            </div>
          )}
        </div>

        {/* Top Controls */}
        <div className="relative z-10 p-4 pt-12 flex justify-between">
          <button onClick={() => { setWinchStatus('idle'); goBack(); }} className="p-3 glass-panel rounded-full text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{locationName !== 'Locating...' ? 'GPS Active' : 'Locating...'}</span>
          </div>
        </div>

        {/* Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-3xl p-6 pb-10 z-20 border-t border-cyber-primary/30 min-h-[350px]">
          <div className="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>

          {winchStatus === 'idle' && (
            <div className="text-center">
              <h3 className="text-2xl font-display font-bold mb-2 text-slate-900 dark:text-white">Request Winch</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Negotiate prices in real-time with nearby drivers.</p>
              <button onClick={requestWinch} className="w-full bg-cyber-primary py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse text-white">Broadcast Request</button>
            </div>
          )}

          {winchStatus === 'searching' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-bold animate-pulse text-slate-900 dark:text-white">Looking for online drivers...</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Connecting to nearby winch drivers</p>
              <button onClick={() => { setWinchStatus('idle'); winchSocketRef.current?.disconnect(); }} className="mt-6 text-xs text-red-400 underline">Cancel</button>
            </div>
          )}

          {winchStatus === 'negotiating' && activeOffers.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🚛</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Drivers Online</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">There are no winch drivers available right now. Please try again shortly.</p>
              <button onClick={requestWinch} className="bg-cyber-primary text-white px-6 py-3 rounded-xl font-bold">Try Again</button>
            </div>
          )}

          {winchStatus === 'negotiating' && (
            <div className="space-y-4">
              <h3 className="font-bold text-cyber-primary dark:text-cyber-accent mb-2">{activeOffers.length} Driver{activeOffers.length !== 1 ? 's' : ''} Available Nearby</h3>
              {activeOffers.map(offer => (
                <div key={offer.id} className="bg-white/50 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{offer.driverName}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{offer.vehicle} • {offer.rating} ★</p>
                      <p className="text-xs text-cyber-primary mt-1">ETA: {offer.eta}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${offer.status === 'rejected' ? 'text-red-500 line-through' : 'text-slate-900 dark:text-white'}`}>{offer.price} EGP</span>
                    </div>
                  </div>

                  {offer.status !== 'accepted' && offer.status !== 'rejected' && (
                    <div className="flex items-center justify-between mt-4 bg-slate-200 dark:bg-black/40 rounded-lg p-2">
                      <button onClick={() => adjustOfferPrice(offer.id, -10)} className="p-2 rounded hover:bg-white/10 text-slate-900 dark:text-white" title="Decrease Offer" aria-label="Decrease Offer"><Minus size={16} /></button>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Adjust Offer</span>
                      <button onClick={() => adjustOfferPrice(offer.id, 10)} className="p-2 rounded hover:bg-white/10 text-slate-900 dark:text-white" title="Increase Offer" aria-label="Increase Offer"><Plus size={16} /></button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-3">
                    {offer.status === 'rejected' ? (
                      <span className="text-red-500 text-xs font-bold">Offer Rejected</span>
                    ) : offer.status === 'accepted' ? (
                      <button onClick={() => handleAcceptOffer(offer)} className="w-full bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold">Accept Deal</button>
                    ) : (
                      <>
                        <button className="bg-red-500/20 text-red-500 p-2 rounded-lg hover:bg-red-500/40" title="Reject Offer" aria-label="Reject Offer"><X size={20} /></button>
                        <button onClick={() => handleCounterOffer(offer.id)} className="bg-cyber-primary/20 text-cyber-primary dark:text-cyber-accent text-xs px-4 rounded-lg border border-cyber-primary/30 hover:bg-cyber-primary/30 font-bold">
                          Counter
                        </button>
                        <button onClick={() => handleAcceptOffer(offer)} className="bg-green-500 text-white p-2 px-4 rounded-lg hover:bg-green-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]" title="Accept Offer" aria-label="Accept Offer">
                          <CheckCircle size={20} />
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
    const dates = ['Mon 12', 'Tue 13', 'Wed 14'];
    const timeSlots = ['09:00 AM', '11:00 AM', '02:00 PM'];

    return (
      <div className="flex flex-col h-screen p-6 pt-12">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={goBack} className="glass-panel p-2 rounded-full text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Checkout</h2>
        </div>

        <div className="flex-1 space-y-6">
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
                  onClick={() => setSelectedDateIndex(i)}
                  className={`p-4 rounded-xl glass-panel min-w-[80px] flex flex-col items-center gap-1 transition-all ${selectedDateIndex === i ? 'border-cyber-primary bg-cyber-primary/20 ring-2 ring-cyber-primary/50' : ''}`}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">{day.split(' ')[0]}</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{day.split(' ')[1]}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => setSelectedTimeSlot(time)}
                  className={`glass-panel py-2 rounded-lg text-sm transition-all ${selectedTimeSlot === time ? 'border-cyber-primary text-cyber-primary bg-cyber-primary/10' : 'text-gray-400'}`}
                >
                  {time}
                </button>
              ))}
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
          className="w-full bg-gradient-to-r from-cyber-primary to-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] mt-6"
        >
          Confirm Booking
        </button>
      </div>
    );
  }

  // --- NEW DASHBOARDS (Functional) ---

  const renderWinchDashboard = () => (
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
          <button onClick={handleWinchWithdraw} className="mt-auto w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Request Withdrawal</button>
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1"><MapPin size={14} /> {activeWinchRequest.distance} away • {activeWinchRequest.issue}</p>

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

  const renderWorkshopDashboard = () => (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-cyber-900">
      {showWorkshopWallet ? (
        <div className="flex-1 p-6 pt-12 flex flex-col">
          <button onClick={() => setShowWorkshopWallet(false)} className="mb-6 w-fit text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
          <h2 className="text-2xl font-bold font-display mb-6 text-slate-900 dark:text-white">Shop Wallet</h2>
          <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-cyber-primary to-blue-700 text-white mb-6">
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-4xl font-bold">{user.walletBalance.toLocaleString()} EGP</p>
          </div>
          <button onClick={handleWorkshopWithdraw} className="mt-auto w-full py-4 bg-cyber-primary text-white rounded-xl font-bold shadow-lg">Withdraw Funds</button>
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

            {/* Live Tracker */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Activity size={18} className="text-cyber-primary" /> Live Car Tracker</h3>
              <div className="space-y-3">
                {carsInWorkshop.map(car => (
                  <div key={car.id} className="glass-panel p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{car.model}</span>
                      <span className="text-xs text-gray-500">{car.plate}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div className={`bg-cyber-primary h-2 rounded-full transition-all duration-500 w-[${car.progress}%]`} />
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
                <span className="font-bold text-xl text-slate-900 dark:text-white">{user.walletBalance} EGP</span>
              </div>
              <button onClick={() => setShowWorkshopWallet(true)} className="w-full py-3 border border-cyber-primary text-cyber-primary rounded-lg font-bold hover:bg-cyber-primary hover:text-white transition">View Wallet</button>
            </div>
          </div>

          <div className="p-4 glass-panel flex justify-around items-center">
            <button className="text-cyber-primary flex flex-col items-center"><Calendar size={24} /><span className="text-[10px]">Bookings</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => setShowWorkshopWallet(true)}><Wallet size={24} /><span className="text-[10px]">Wallet</span></button>
            <button className="text-gray-400 flex flex-col items-center" onClick={() => navigate(View.PROFILE)}><User size={24} /><span className="text-[10px]">Profile</span></button>
          </div>
        </>
      )}
    </div>
  );

  const renderAIChat = () => (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-black">
      <div className="p-4 pt-12 glass-panel shadow-lg z-10 flex items-center gap-4">
        <button onClick={goBack} className="p-2 rounded-full hover:bg-white/10 text-slate-900 dark:text-white" title="Go Back" aria-label="Go Back"><ArrowLeft /></button>
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Auto-Care AI
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </h2>
          <p className="text-xs text-green-500">Online • Diagnostics Mode</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
              ? 'bg-cyber-primary text-white rounded-br-none'
              : 'glass-panel text-slate-800 dark:text-gray-200 rounded-bl-none border border-cyber-primary/30'
              }`}>
              {msg.text}
            </div>
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
          onMouseDown={toggleRecording}
          onMouseUp={toggleRecording}
          onTouchStart={toggleRecording}
          onTouchEnd={toggleRecording}
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
    const filteredWorkshops = workshops.filter(w =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'All' || w.services?.some(s => s.includes(filterCategory)) || w.specialty.includes(filterCategory))
    );

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
              <p className="font-bold text-sm mb-2 text-slate-900 dark:text-white">Filter by Category:</p>
              <div className="flex flex-wrap gap-2">
                {['All', 'European', 'Electric', 'Body & Paint', 'Transmission'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${filterCategory === cat ? 'bg-cyber-primary text-white' : 'bg-slate-200 dark:bg-gray-700 text-gray-500'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All', 'Mechanical', 'Electrical', 'Bodywork', 'Tires'].map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat === 'All' ? 'All' : cat)} className="px-4 py-2 glass-panel rounded-lg text-sm font-bold text-gray-500 hover:text-cyber-primary hover:border-cyber-primary transition-colors border border-transparent whitespace-nowrap">
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {filteredWorkshops.map(shop => (
            <div key={shop.id} onClick={() => { setSelectedWorkshop(shop); navigate(View.WORKSHOP_DETAIL); }} className="glass-panel p-4 rounded-2xl flex gap-4 hover:border-cyber-primary transition-all cursor-pointer group">
              <img src={shop.image} className="w-24 h-24 rounded-xl object-cover" alt={shop.name} title={shop.name} />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-cyber-primary transition-colors">{shop.name}</h3>
                  <span className="text-xs bg-cyber-primary/20 text-cyber-primary px-2 py-1 rounded font-bold">{shop.rating} ★</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{shop.specialty} • {shop.distance}</p>
                <div className="flex flex-wrap gap-1">
                  {shop.services?.slice(0, 2).map(s => (
                    <span key={s} className="text-[10px] bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{s}</span>
                  ))}
                  {shop.services && shop.services.length > 2 && <span className="text-[10px] bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">+{shop.services.length - 2}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWorkshopDetail = () => {
    if (!selectedWorkshop) return null;
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
                {selectedWorkshop.services?.map(s => (
                  <span key={s} className="px-3 py-1 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 rounded-full text-sm">{s}</span>
                ))}
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

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-100 dark:from-black to-transparent">
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
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-700 border-2 border-cyber-primary overflow-hidden">
            <img src="https://picsum.photos/100/100" alt="Profile" title="Profile" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name || 'User'}</h3>
            <p className="text-gray-500 text-sm">{user.email || 'user@example.com'}</p>
            <span className="text-xs bg-cyber-primary/20 text-cyber-primary px-2 py-0.5 rounded mt-1 inline-block">Free Member</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Car size={18} /> My Vehicle</h4>
            <button className="text-xs text-cyber-primary" onClick={() => setEditingVehicle(v => !v)}>{editingVehicle ? 'Cancel' : 'Edit'}</button>
          </div>
          {editingVehicle ? (
            <div className="space-y-3">
              <input
                className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
                placeholder="Car Brand (e.g. Toyota)"
                value={vehicleBrand}
                onChange={e => setVehicleBrand(e.target.value)}
              />
              <input
                className="w-full bg-slate-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white border border-gray-600 focus:outline-none focus:border-cyber-primary"
                placeholder="Car Model (e.g. Corolla)"
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
            </div>
          )) : (
            <p className="text-center text-gray-500 py-4">No bookings yet.</p>
          )}
        </div>
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
        <div className="px-6 flex gap-2 mb-6">
          <button
            onClick={() => { setAdminActiveTab('overview'); setAdminSearch(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${adminActiveTab === 'overview' ? 'bg-cyber-primary text-white shadow-lg' : 'glass-panel text-slate-600 dark:text-gray-400'}`}
          >
            Overview
          </button>
          <button
            onClick={() => { setAdminActiveTab('transactions'); setAdminSearch(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${adminActiveTab === 'transactions' ? 'bg-cyber-primary text-white shadow-lg' : 'glass-panel text-slate-600 dark:text-gray-400'}`}
          >
            Transactions
          </button>
          <button
            onClick={() => { setAdminActiveTab('users'); setAdminSearch(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${adminActiveTab === 'users' ? 'bg-cyber-primary text-white shadow-lg' : 'glass-panel text-slate-600 dark:text-gray-400'}`}
          >
            Users
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
                  <p className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
                    {adminStats ? Number(Object.values(adminStats.users).reduce((a: any, b: any) => a + b, 0)) : 0}
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border-l-4 border-cyan-500">
                  <div className="text-cyan-500 mb-2"><Activity size={20} /></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">System Status</p>
                  <p className="text-xl font-bold mt-1 text-cyan-500 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    {adminStats ? adminStats.systemHealth : 'Active'}
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
                    <div className="bg-cyber-primary h-full rounded-full" style={{ width: `${(adminStats?.workshops || 0) * 10}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Truck size={16} className="text-cyan-500" /> Winch Drivers
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{adminStats?.users.WINCH_DRIVER || 0}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(adminStats?.users.WINCH_DRIVER || 0) * 10}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Calendar size={16} className="text-purple-500" /> Active Appointments
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{adminStats?.activeAppointments || 0}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(adminStats?.activeAppointments || 0) * 10}%` }}></div>
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
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{u.name || 'No Name'}</h4>
                      <p className="text-xs text-gray-500">{u.email}</p>
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
        </div>
      </div>
    );
  };

  // --- MAIN RENDER SWITCH ---

  return (
    <div className={`h-full ${isDarkMode ? 'dark' : ''}`}>
      <div className="font-sans text-slate-900 dark:text-white max-w-md mx-auto h-full overflow-hidden shadow-2xl relative bg-slate-50 dark:bg-black transition-colors duration-300">
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
        {view === View.WINCH_DASHBOARD && user.role === UserRole.WINCH_DRIVER && renderWinchDashboard()}
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
        {view === View.WINCH_LIVE_MAP && liveBookingId && <WinchLiveUser bookingId={liveBookingId} onBack={() => setView(View.HOME)} />}
        {/* Admin: only render if user has ADMIN role */}
        {view === View.ADMIN_DASHBOARD && (authUser?.role === 'ADMIN' || user.role === UserRole.ADMIN) && renderAdminDashboard()}
        {view === View.ADMIN_DASHBOARD && authUser?.role !== 'ADMIN' && user.role !== UserRole.ADMIN && renderHome()}
      </div>
    </div>
  );
};

export default App;