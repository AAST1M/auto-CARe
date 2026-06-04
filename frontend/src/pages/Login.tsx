import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { validateEmail, validatePassword } from '../utils/validators';
import { API_URL } from '../config';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    const emailV = validateEmail(email);
    const passV = validatePassword(password);
    if (!emailV.valid) newErrors.email = emailV.message;
    if (!passV.valid) newErrors.password = passV.message;
    return newErrors;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const newErrors = validate();
    setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
  };

  const isFormValid = !validate().email && !validate().password && email && password;

  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setErrors({ general: data.error || 'Login failed. Please try again.' });
      }
    } catch (err) {
      setErrors({ general: 'Cannot connect to server. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 pt-20 bg-slate-50 dark:bg-black">
      <Link to="/" className="absolute top-6 left-6 p-2 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur border border-white/20 text-slate-700 dark:text-white hover:bg-white/20 transition-colors">
        <ArrowLeft size={20} />
      </Link>

      <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Welcome Back</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-10">Sign in to your dashboard.</p>

      {/* General Error Banner */}
      {errors.general && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Email */}
        <div>
          <div className={`rounded-xl p-1 border transition-colors ${touched.email && errors.email ? 'border-red-500 bg-red-500/5' : 'bg-white/10 dark:bg-white/5 backdrop-blur border-white/20'}`}>
            <input
              id="login-email"
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
              <AlertCircle size={12} /> {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className={`rounded-xl p-1 border transition-colors flex items-center ${touched.password && errors.password ? 'border-red-500 bg-red-500/5' : 'bg-white/10 dark:bg-white/5 backdrop-blur border-white/20'}`}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors(prev => ({ ...prev, password: validatePassword(e.target.value).message || undefined })); }}
              onBlur={() => handleBlur('password')}
              className="flex-1 bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.password && errors.password && (
            <p className="text-red-500 text-xs mt-1 ml-2 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.password}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button type="button" className="text-sm text-blue-500 hover:text-blue-400 transition-colors">
            Forgot Password?
          </button>
        </div>

        <button
          id="login-submit"
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Loader size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
        </button>

        <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};
