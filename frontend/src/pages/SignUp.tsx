import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Moon, Sun, RefreshCw, CheckCircle } from 'lucide-react';
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
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; confirmPassword?: string; general?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean;
  }>({});

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

  const isFormValid = Object.keys(validate()).length === 0;

  // Password strength indicator
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

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role })
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

      <div className="w-full max-w-md p-8">
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
