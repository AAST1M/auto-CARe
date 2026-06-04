import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader, CheckCircle } from 'lucide-react';
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

  const fieldClass = (field: 'name' | 'email' | 'password' | 'confirmPassword') =>
    `rounded-xl p-1 border transition-colors ${touched[field] && errors[field]
      ? 'border-red-500 bg-red-500/5'
      : touched[field] && !errors[field] && (field === 'name' ? name : field === 'email' ? email : field === 'password' ? password : confirmPassword)
        ? 'border-green-500 bg-green-500/5'
        : 'bg-white/10 dark:bg-white/5 backdrop-blur border-white/20'
    }`;

  return (
    <div className="flex flex-col min-h-screen p-6 pt-20 bg-slate-50 dark:bg-black overflow-y-auto">
      <Link to="/login" className="absolute top-6 left-6 p-2 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur border border-white/20 text-slate-700 dark:text-white hover:bg-white/20 transition-colors">
        <ArrowLeft size={20} />
      </Link>

      <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Create Account</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Join the AI automotive network.</p>

      {/* General Error Banner */}
      {errors.general && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <div className={fieldClass('name')}>
            <input
              id="signup-name"
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (touched.name) handleBlur('name'); }}
              onBlur={() => handleBlur('name')}
              className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="name"
            />
          </div>
          {touched.name && errors.name && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <div className={fieldClass('email')}>
            <input
              id="signup-email"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (touched.email) handleBlur('email'); }}
              onBlur={() => handleBlur('email')}
              className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="email"
            />
          </div>
          {touched.email && errors.email && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className={`${fieldClass('password')} flex items-center`}>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min 8 chars, 1 uppercase, 1 number)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (touched.password) handleBlur('password'); }}
              onBlur={() => handleBlur('password')}
              className="flex-1 bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Password strength */}
          {password && (
            <div className="mt-2 px-1">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-500">{strength.label && `Password strength: ${strength.label}`}</p>
            </div>
          )}
          {touched.password && errors.password && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className={`${fieldClass('confirmPassword')} flex items-center`}>
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (touched.confirmPassword) handleBlur('confirmPassword'); }}
              onBlur={() => handleBlur('confirmPassword')}
              className="flex-1 bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.confirmPassword}
            </p>
          )}
          {touched.confirmPassword && !errors.confirmPassword && confirmPassword && (
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
          disabled={loading || !isFormValid}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Loader size={18} className="animate-spin" /> Creating Account...</> : 'Create Account'}
        </button>

        <p className="mt-4 text-center text-gray-500 dark:text-gray-400 pb-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
};
