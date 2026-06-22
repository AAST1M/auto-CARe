import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OldApp from './OldApp';

/** Shows nothing while auth is being checked — prevents flash to /login */
const AuthLoading = () => (
  <div className="flex items-center justify-center h-screen bg-black">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return <AuthLoading />;
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading, user } = useAuth();
  if (isLoading) return <AuthLoading />;
  // Redirect already-authenticated users away from login/signup
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute><SignUp /></PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute><ForgotPassword /></PublicRoute>
      } />
      <Route path="/reset-password" element={
        <PublicRoute><ResetPassword /></PublicRoute>
      } />
      {/*
        OldApp is the main app shell.
        It handles all sub-views (HOME, WINCH_DASHBOARD, ADMIN_DASHBOARD, etc.)
        and performs role-based redirects internally after auth loads.
      */}
      <Route path="*" element={
        <PrivateRoute>
          <OldApp />
        </PrivateRoute>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
