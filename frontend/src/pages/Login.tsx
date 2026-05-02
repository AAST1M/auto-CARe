import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const { toggleTheme, isDarkMode } = useAppContext();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error connecting to backend');
    }
  };

  return (
    <div className="flex flex-col h-screen p-6 pt-20">
      <h2 className="text-3xl font-display font-bold mb-2">Welcome Back</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-10">Sign in to your dashboard.</p>
      
      <div className="space-y-4">
        <div className="glass-panel rounded-xl p-1">
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500" 
          />
        </div>
        <div className="glass-panel rounded-xl p-1">
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent p-4 outline-none text-slate-900 dark:text-white placeholder-gray-500" 
          />
        </div>
        
        <button 
          onClick={handleLogin}
          className="w-full mt-6 bg-gradient-to-r from-cyber-primary to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
