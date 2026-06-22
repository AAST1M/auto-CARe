import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { API_URL } from '../config';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let response = await originalFetch(input, init);
  
  const urlStr = input.toString();
  if (response.status === 401 && !urlStr.includes('/api/auth/login') && !urlStr.includes('/api/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await originalFetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include' // Important for sending the HTTP-only cookie!
        });
        
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.token;
          localStorage.setItem('token', newToken);
          isRefreshing = false;
          onRefreshed(newToken);
          
          // Retry original request
          const newInit = { ...init, headers: { ...init?.headers, 'Authorization': `Bearer ${newToken}` } };
          return originalFetch(input, newInit);
        } else {
          // Refresh failed, user is logged out
          isRefreshing = false;
          localStorage.removeItem('token');
          window.location.href = '/'; 
        }
      } catch(e) {
        isRefreshing = false;
      }
    } else {
      // Wait for refresh to finish, then retry
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          const newInit = { ...init, headers: { ...init?.headers, 'Authorization': `Bearer ${newToken}` } };
          resolve(originalFetch(input, newInit));
        });
      });
    }
  }
  return response;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true); // starts true to prevent flash before token validation

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(storedToken);
          } else {
            // Token is invalid or expired — clear it
            logout();
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Don't log out on network error, just proceed without user
        }
      }
      setIsLoading(false);
    };
    fetchMe();
  }, []); // Only run once on mount

  const login = (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
