export enum View {
  ONBOARDING = 'ONBOARDING',
  LOGIN = 'LOGIN',
  SIGN_UP = 'SIGN_UP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  USER_DETAILS = 'USER_DETAILS',
  ROLE_SELECTION = 'ROLE_SELECTION',
  
  // Specific Onboarding
  SETUP_CAR = 'SETUP_CAR', // User
  WINCH_ONBOARDING = 'WINCH_ONBOARDING', // Winch
  WORKSHOP_ONBOARDING = 'WORKSHOP_ONBOARDING', // Workshop

  // Dashboards
  HOME = 'HOME', // User Dashboard
  WINCH_DASHBOARD = 'WINCH_DASHBOARD',
  WORKSHOP_DASHBOARD = 'WORKSHOP_DASHBOARD',

  // Features
  AI_CHAT = 'AI_CHAT',
  WINCH_NEGOTIATION = 'WINCH_NEGOTIATION',
  WORKSHOP_LIST = 'WORKSHOP_LIST',
  WORKSHOP_DETAIL = 'WORKSHOP_DETAIL',
  BOOKING = 'BOOKING',
  SUCCESS = 'SUCCESS',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  SPARE_PARTS = 'SPARE_PARTS'
}

export enum UserRole {
  USER = 'USER',
  WINCH_DRIVER = 'WINCH_DRIVER',
  WORKSHOP_OWNER = 'WORKSHOP_OWNER'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface Workshop {
  id: string;
  name: string;
  rating: number;
  distance: string;
  image: string;
  specialty: string;
  priceEstimate: string;
  address?: string;
  hours?: string;
  services?: string[];
  description?: string;
}

export interface WinchOffer {
  id: string;
  driverName: string;
  price: number;
  eta: string;
  rating: number;
  vehicle: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

export enum CarType {
  SEDAN = 'Sedan',
  SUV = 'SUV',
  HATCHBACK = 'Hatchback',
  TRUCK = 'Truck'
}

export interface UserBooking {
  id: string;
  serviceName: string; // Workshop Name or Winch
  date: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled' | 'Pending' | 'In Progress';
  price: string;
}

export interface WorkshopAppointment {
    id: string;
    customerName: string;
    carDetails: string;
    serviceType: string;
    time: string;
    status: 'Pending' | 'Confirmed' | 'Checked-In' | 'Completed' | 'Cancelled';
    price: number;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  role: UserRole | null;
  walletBalance: number; // For Drivers/Owners
  
  // User Specific
  carBrand?: string;
  carModel?: string;
  carYear?: string;
  carType?: string;
  bookings: UserBooking[];

  // Winch Specific
  winchPlateNumber?: string;
  driverLicense?: string;
  vehicleType?: string;

  // Workshop Specific
  shopName?: string;
  shopLocation?: string;
  govLicense?: string;
  sparePartsBrands?: string;
}