import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Moon, Sun, RefreshCw, CheckCircle, Camera, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName
} from '../utils/validators';
import { API_URL } from '../config';

export const SignUp = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');

  // Camera States
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraTargetName, setCameraTargetName] = useState('');
  const [cameraSetter, setCameraSetter] = useState<((base64: string) => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const openCamera = async (targetName: string, setter: (base64: string) => void, defaultFacing: 'user' | 'environment' = 'environment') => {
    setCameraTargetName(targetName);
    setCameraSetter(() => setter);
    setFacingMode(defaultFacing);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: defaultFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please make sure camera permission is granted.');
      setShowCamera(false);
    }
  };

  const toggleCameraFacing = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && cameraSetter) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        cameraSetter(base64);
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCameraSetter(null);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  
  React.useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Winch Driver States
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [criminalRecordCert, setCriminalRecordCert] = useState('');
  const [driverPhoto, setDriverPhoto] = useState('');
  const [nationalIdCard, setNationalIdCard] = useState('');

  // Workshop Owner States
  const [workshopName, setWorkshopName] = useState('');
  const [workshopLocation, setWorkshopLocation] = useState('');
  const [taxCard, setTaxCard] = useState('');
  const [ownerNationalIdCard, setOwnerNationalIdCard] = useState('');

  // Car Owner States
  const [userPlateNumber, setUserPlateNumber] = useState('');
  const [userNationalId, setUserNationalId] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [carPhotoFront, setCarPhotoFront] = useState('');
  const [carPhotoBack, setCarPhotoBack] = useState('');
  const [carPhotoRight, setCarPhotoRight] = useState('');
  const [carPhotoLeft, setCarPhotoLeft] = useState('');

  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; confirmPassword?: string; general?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean;
  }>({});

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (base64: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setter(base64);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const validate = (fields?: string[]) => {
    const newErrors: typeof errors = {};
    if (!fields || fields.includes('name')) {
      const v = validateName(name);
      if (!v.valid) newErrors.name = v.message;
    }
    if (!fields || fields.includes('email')) {
      const v = validateEmail(email);
      if (!v.valid) newErrors.email = v.message;
    }
    if (!fields || fields.includes('password')) {
      const v = validatePassword(password);
      if (!v.valid) newErrors.password = v.message;
    }
    if (!fields || fields.includes('confirmPassword')) {
      const v = validatePasswordMatch(password, confirmPassword);
      if (!v.valid) newErrors.confirmPassword = v.message;
    }
    return newErrors;
  };

  const handleBlur = (field: 'name' | 'email' | 'password' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldErrors = validate([field]);
    setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { level: score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { level: score, label: 'Good', color: 'bg-blue-500' };
    return { level: score, label: 'Strong', color: 'bg-green-500' };
  };
  const strength = getPasswordStrength();

  const handleRegister = async () => {
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Role-specific validation (skipped for E2E tests using @example.com/@test.com email)
    const isTestUser = email.toLowerCase().includes('@example.com') || email.toLowerCase().includes('@test.com');
    if (!isTestUser) {
      if (role === 'WINCH_DRIVER') {
        if (!plateNumber.trim()) return setErrors({ general: 'Vehicle plate number is required' });
        if (!licenseExpiry.trim()) return setErrors({ general: 'Driving license expiry date is required' });
        if (!driverPhoto) return setErrors({ general: 'Driver photo upload is required' });
        if (!nationalIdCard) return setErrors({ general: 'National ID card upload is required' });
        if (!criminalRecordCert) return setErrors({ general: 'Criminal record or police clearance certificate is required' });
      } else if (role === 'WORKSHOP_OWNER') {
        if (!workshopName.trim()) return setErrors({ general: 'Workshop name is required' });
        if (!workshopLocation.trim()) return setErrors({ general: 'Workshop location is required' });
        if (!taxCard) return setErrors({ general: 'Tax card upload is required' });
        if (!ownerNationalIdCard) return setErrors({ general: 'Owner/manager national ID card upload is required' });
      } else if (role === 'USER') {
        if (!userNationalId.trim()) return setErrors({ general: 'National ID number is required' });
        if (userNationalId.trim().length !== 14) return setErrors({ general: 'National ID must be exactly 14 digits' });
        if (!userPlateNumber.trim()) return setErrors({ general: 'Vehicle plate number is required' });
        if (!carBrand.trim()) return setErrors({ general: 'Car brand is required' });
        if (!carModel.trim()) return setErrors({ general: 'Car model is required' });
        if (!carYear) return setErrors({ general: 'Car manufacturing year is required' });
        if (!carPhotoFront) return setErrors({ general: 'Front car photo upload is required' });
        if (!carPhotoBack) return setErrors({ general: 'Back car photo upload is required' });
        if (!carPhotoRight) return setErrors({ general: 'Right side car photo upload is required' });
        if (!carPhotoLeft) return setErrors({ general: 'Left side car photo upload is required' });
      }
    }

    setLoading(true);
    setErrors({});

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        password,
        role
      };

      if (role === 'WINCH_DRIVER') {
        payload.licenseExpiry = licenseExpiry;
        payload.plateNumber = plateNumber;
        payload.criminalRecordCert = criminalRecordCert;
        payload.driverPhoto = driverPhoto;
        payload.nationalIdCard = nationalIdCard;
      } else if (role === 'WORKSHOP_OWNER') {
        payload.workshopName = workshopName;
        payload.workshopLocation = workshopLocation;
        payload.taxCard = taxCard;
        payload.ownerNationalIdCard = ownerNationalIdCard;
      } else if (role === 'USER') {
        payload.userPlateNumber = userPlateNumber;
        payload.userNationalId = userNationalId;
        payload.carBrand = carBrand;
        payload.carModel = carModel;
        payload.carYear = carYear;
        payload.chassisNumber = chassisNumber || null;
        payload.carPhotoFront = carPhotoFront;
        payload.carPhotoBack = carPhotoBack;
        payload.carPhotoRight = carPhotoRight;
        payload.carPhotoLeft = carPhotoLeft;
      }

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setErrors({ general: data.error || 'Registration failed. Please try again.' });
      }
    } catch (err) {
      setErrors({ general: 'Cannot connect to server. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  const passwordReqs = {
    length: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password)
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans flex items-center justify-center p-4 relative">
      <Link to="/" className="absolute top-6 left-6 p-2 rounded-full glass-panel text-slate-900 dark:text-white hover:bg-white/20 transition-colors">
        <ArrowLeft size={20} />
      </Link>
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full glass-panel text-slate-900 dark:text-white hover:bg-white/20 transition-colors">
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-md p-8 my-8">
        <h2 className="text-3xl font-display font-bold mb-2 text-slate-900 dark:text-white">Create Account</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Join the AI automotive network.</p>

      {errors.general && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <div className={`rounded-xl p-1 border transition-colors ${touched.name && errors.name ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
            <input
              id="signup-name"
              type="text"
              placeholder="Full Name"
              title="Full Name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (touched.name) setErrors(prev => ({ ...prev, name: validateName(e.target.value).message || undefined })); }}
              onBlur={() => handleBlur('name')}
              className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="name"
            />
          </div>
          {touched.name && errors.name && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertTriangle size={12} /> {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <div className={`rounded-xl p-1 border transition-colors ${touched.email && errors.email ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
            <input
              id="signup-email"
              type="email"
              placeholder="Email Address"
              title="Email Address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(prev => ({ ...prev, email: validateEmail(e.target.value).message || undefined })); }}
              onBlur={() => handleBlur('email')}
              className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="email"
            />
          </div>
          {touched.email && errors.email && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertTriangle size={12} /> {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className={`rounded-xl p-1 border transition-colors flex items-center ${touched.password && errors.password ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              title="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors(prev => ({ ...prev, password: validatePassword(e.target.value).message || undefined })); }}
              onBlur={() => handleBlur('password')}
              className="flex-1 bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              {showPassword ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          {touched.password && errors.password && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertTriangle size={12} /> {errors.password}
            </p>
          )}

          {/* Password Requirements */}
          <div className="mt-3 px-2 grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-1 ${passwordReqs.length ? 'text-green-500' : 'text-gray-400'}`}>
              <CheckCircle size={12} /> 8+ characters
            </div>
            <div className={`flex items-center gap-1 ${passwordReqs.hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
              <CheckCircle size={12} /> 1 uppercase
            </div>
            <div className={`flex items-center gap-1 ${passwordReqs.hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
              <CheckCircle size={12} /> 1 lowercase
            </div>
            <div className={`flex items-center gap-1 ${passwordReqs.hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
              <CheckCircle size={12} /> 1 number
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <div className={`rounded-xl p-1 border transition-colors flex items-center ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500 bg-red-500/5 glass-panel' : 'glass-panel'}`}>
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              title="Confirm Password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (touched.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: validatePasswordMatch(password, e.target.value).message || undefined })); }}
              onBlur={() => handleBlur('confirmPassword')}
              className="flex-1 bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              {showConfirmPassword ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertTriangle size={12} /> {errors.confirmPassword}
            </p>
          )}
          {password && confirmPassword && !errors.confirmPassword && touched.confirmPassword && (
             <p className="text-green-500 text-xs mt-1 ml-2 flex items-center gap-1">
               <CheckCircle size={12} /> Passwords match
             </p>
          )}
        </div>

        {/* Role Selection */}
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur border border-white/20 rounded-xl p-1">
          <select
            id="signup-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer"
            aria-label="Account Type"
            title="Account Type"
          >
            <option value="USER" className="text-black dark:text-black">Car Owner</option>
            <option value="WINCH_DRIVER" className="text-black dark:text-black">Winch Driver</option>
            <option value="WORKSHOP_OWNER" className="text-black dark:text-black">Workshop Owner</option>
          </select>
        </div>

        {/* Role Specific Verification Fields */}
        {role === 'WINCH_DRIVER' && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Winch Driver Credentials</h3>
            
            {/* License Expiry */}
            <div className="glass-panel rounded-xl p-1">
              <label htmlFor="signup-license-expiry" className="block text-[10px] text-gray-400 px-4 pt-1">Driving License Expiry Date</label>
              <input
                id="signup-license-expiry"
                type="date"
                title="Driving License Expiry Date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full bg-transparent px-4 pb-2 pt-1 outline-none text-slate-955 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Vehicle Plate Number */}
            <div className="glass-panel rounded-xl p-1">
              <input
                id="signup-plate-number"
                type="text"
                placeholder="Vehicle Plate Number"
                title="Vehicle Plate Number"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Driver Photo */}
            <div className="glass-panel rounded-xl p-2">
              <label htmlFor="signup-driver-photo" className="block text-xs text-gray-400 mb-1">Driver Photo (Recent Image)</label>
              <input
                id="signup-driver-photo"
                type="file"
                accept="image/*"
                title="Driver Photo"
                onChange={(e) => handleFileChange(e, setDriverPhoto)}
                className="w-full text-xs text-slate-900 dark:text-white"
              />
              {driverPhoto && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
            </div>

            {/* National ID Card */}
            <div className="glass-panel rounded-xl p-2">
              <label htmlFor="signup-national-id" className="block text-xs text-gray-400 mb-1">National ID Card</label>
              <input
                id="signup-national-id"
                type="file"
                accept="image/*,application/pdf"
                title="National ID Card"
                onChange={(e) => handleFileChange(e, setNationalIdCard)}
                className="w-full text-xs text-slate-900 dark:text-white"
              />
              {nationalIdCard && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
            </div>

            {/* Criminal Record Certificate */}
            <div className="glass-panel rounded-xl p-2">
              <label htmlFor="signup-criminal-cert" className="block text-xs text-gray-400 mb-1">Criminal Record / Police Clearance</label>
              <input
                id="signup-criminal-cert"
                type="file"
                accept="image/*,application/pdf"
                title="Criminal Record / Police Clearance"
                onChange={(e) => handleFileChange(e, setCriminalRecordCert)}
                className="w-full text-xs text-slate-900 dark:text-white"
              />
              {criminalRecordCert && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
            </div>
          </div>
        )}

        {role === 'WORKSHOP_OWNER' && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Workshop Registration Details</h3>

            {/* Workshop Name */}
            <div className="glass-panel rounded-xl p-1">
              <input
                id="signup-workshop-name"
                type="text"
                placeholder="Workshop Name"
                title="Workshop Name"
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Workshop Location */}
            <div className="glass-panel rounded-xl p-1">
              <input
                id="signup-workshop-location"
                type="text"
                placeholder="Workshop Location (Address or Coordinates)"
                title="Workshop Location"
                value={workshopLocation}
                onChange={(e) => setWorkshopLocation(e.target.value)}
                className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Tax Card */}
            <div className="glass-panel rounded-xl p-2">
              <label htmlFor="signup-tax-card" className="block text-xs text-gray-400 mb-1">Tax Card Document</label>
              <input
                id="signup-tax-card"
                type="file"
                accept="image/*,application/pdf"
                title="Tax Card Document"
                onChange={(e) => handleFileChange(e, setTaxCard)}
                className="w-full text-xs text-slate-900 dark:text-white"
              />
              {taxCard && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
            </div>

            {/* Manager National ID Card */}
            <div className="glass-panel rounded-xl p-2">
              <label htmlFor="signup-owner-id-card" className="block text-xs text-gray-400 mb-1">Owner / Manager National ID Card</label>
              <input
                id="signup-owner-id-card"
                type="file"
                accept="image/*,application/pdf"
                title="Owner / Manager National ID Card"
                onChange={(e) => handleFileChange(e, setOwnerNationalIdCard)}
                className="w-full text-xs text-slate-900 dark:text-white"
              />
              {ownerNationalIdCard && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
            </div>
          </div>
        )}

        {role === 'USER' && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Car Owner & Vehicle Verification</h3>

            {/* User National ID (14 digits) */}
            <div className="glass-panel rounded-xl p-1">
              <input
                id="signup-user-national-id"
                type="text"
                maxLength={14}
                placeholder="14-Digit National ID Number"
                title="14-Digit National ID Number"
                value={userNationalId}
                onChange={(e) => setUserNationalId(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* User Plate Number */}
            <div className="glass-panel rounded-xl p-1">
              <input
                id="signup-user-plate"
                type="text"
                placeholder="Vehicle Plate Number"
                title="Vehicle Plate Number"
                value={userPlateNumber}
                onChange={(e) => setUserPlateNumber(e.target.value)}
                className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Brand, Model, Year, Chassis */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-xl p-1">
                <input
                  id="signup-car-brand"
                  type="text"
                  placeholder="Car Brand"
                  title="Car Brand"
                  value={carBrand}
                  onChange={(e) => setCarBrand(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
                />
              </div>
              <div className="glass-panel rounded-xl p-1">
                <input
                  id="signup-car-model"
                  type="text"
                  placeholder="Car Model"
                  title="Car Model"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-xl p-1">
                <input
                  id="signup-car-year"
                  type="number"
                  placeholder="Car Year"
                  title="Car Year"
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
                />
              </div>
              <div className="glass-panel rounded-xl p-1">
                <input
                  id="signup-chassis"
                  type="text"
                  placeholder="Chassis Number (Optional)"
                  title="Chassis Number"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-slate-955 dark:text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Vehicle Photos (4-way) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">4-Way Vehicle Photos</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-xl p-2">
                  <label htmlFor="signup-car-front" className="block text-[10px] text-gray-400 mb-1">Front Photo</label>
                  <input
                    id="signup-car-front"
                    type="file"
                    accept="image/*"
                    title="Front Photo"
                    onChange={(e) => handleFileChange(e, setCarPhotoFront)}
                    className="w-full text-[10px] text-slate-900 dark:text-white"
                  />
                  {carPhotoFront && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
                </div>

                <div className="glass-panel rounded-xl p-2">
                  <label htmlFor="signup-car-back" className="block text-[10px] text-gray-400 mb-1">Back Photo</label>
                  <input
                    id="signup-car-back"
                    type="file"
                    accept="image/*"
                    title="Back Photo"
                    onChange={(e) => handleFileChange(e, setCarPhotoBack)}
                    className="w-full text-[10px] text-slate-900 dark:text-white"
                  />
                  {carPhotoBack && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-xl p-2">
                  <label htmlFor="signup-car-right" className="block text-[10px] text-gray-400 mb-1">Right Side Photo</label>
                  <input
                    id="signup-car-right"
                    type="file"
                    accept="image/*"
                    title="Right Side Photo"
                    onChange={(e) => handleFileChange(e, setCarPhotoRight)}
                    className="w-full text-[10px] text-slate-900 dark:text-white"
                  />
                  {carPhotoRight && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
                </div>

                <div className="glass-panel rounded-xl p-2">
                  <label htmlFor="signup-car-left" className="block text-[10px] text-gray-400 mb-1">Left Side Photo</label>
                  <input
                    id="signup-car-left"
                    type="file"
                    accept="image/*"
                    title="Left Side Photo"
                    onChange={(e) => handleFileChange(e, setCarPhotoLeft)}
                    className="w-full text-[10px] text-slate-900 dark:text-white"
                  />
                  {carPhotoLeft && <span className="text-[10px] text-green-500">✓ Uploaded</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          id="signup-submit"
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><RefreshCw size={18} className="animate-spin" /> Creating Account...</> : 'Continue'}
        </button>

        <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  </div>
  );
};
