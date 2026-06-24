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
  WINCH_LIVE_MAP = 'WINCH_LIVE_MAP',
  BOOKING = 'BOOKING',
  SUCCESS = 'SUCCESS',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  SPARE_PARTS = 'SPARE_PARTS',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  BIDDING_USER = 'BIDDING_USER',
  BIDDING_WORKSHOP = 'BIDDING_WORKSHOP'
}

export enum UserRole {
  USER = 'USER',
  WINCH_DRIVER = 'WINCH_DRIVER',
  WORKSHOP_OWNER = 'WORKSHOP_OWNER',
  ADMIN = 'ADMIN'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  action?: 'WINCH' | 'WORKSHOP' | 'ASK_MOBILITY' | string | null;
}

export interface Workshop {
  id: string;
  name: string;
  rating: number;
  distance: string;
  image: string;
  specialty: string;
  priceEstimate?: string;
  address?: string;
  hours?: string;
  services?: string[];
  lat?: number;
  lng?: number;
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
  id?: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  role: UserRole | null;
  walletBalance: number; // For Drivers/Owners
  approvalStatus?: string;
  
  // User/Customer Specific
  carBrand?: string;
  carModel?: string;
  carYear?: string | number;
  carType?: string;
  userPlateNumber?: string;
  userNationalId?: string;
  chassisNumber?: string;
  carPhotoFront?: string;
  carPhotoBack?: string;
  carPhotoRight?: string;
  carPhotoLeft?: string;
  bookings: UserBooking[];

  // Winch Specific
  winchPlateNumber?: string;
  driverLicense?: string;
  vehicleType?: string;
  licenseExpiry?: string;
  plateNumber?: string;
  criminalRecordCert?: string;
  driverPhoto?: string;
  nationalIdCard?: string;

  // Workshop Specific
  shopName?: string;
  shopLocation?: string;
  govLicense?: string;
  sparePartsBrands?: string;
  taxCard?: string;
  workshopLocation?: string;
  ownerNationalIdCard?: string;
  workshopName?: string;
}

export interface WinchBooking {
  id: string;
  userId: string;
  driverName: string;
  vehicle: string;
  price: number;
  status: string;
  createdAt: string;
}

export interface SparePart {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  condition: string;
  image?: string;
  workshopId?: string;
  workshop?: { name: string };
  compatibilityModel?: string;
  compatibilityYearStart?: number;
  compatibilityYearEnd?: number;
  createdAt: string;
}

export interface PartOrder {
  id: string;
  userId: string;
  partId: string;
  quantity: number;
  totalPrice: number;
  status: string;
  part: SparePart;
  createdAt: string;
}