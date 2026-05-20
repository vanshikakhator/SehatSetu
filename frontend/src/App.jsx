import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import HealthWorkerDashboard from "./pages/HealthWorkerDashboard";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import OfflineChat from "./components/common/OfflineChat";

export default function App() {
  const { user, logout } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      {isOffline && (
        <div style={{ backgroundColor: '#ff9800', color: 'white', textAlign: 'center', padding: '10px', fontWeight: 'bold', zIndex: 9999, position: 'relative' }}>
          You are currently offline. Some features are available in offline mode.
        </div>
      )}
      {user && <OfflineChat user={user} />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/signin" element={<AuthPage mode="signin" />} />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard/patient" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard onLogout={logout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/doctor" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard onLogout={logout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/pharmacy" 
          element={
            <ProtectedRoute allowedRoles={['pharmacy']}>
              <PharmacyDashboard onLogout={logout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/worker" 
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <HealthWorkerDashboard onLogout={logout} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* Redirect /dashboard to specific dashboard based on role */}
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <Navigate to={`/dashboard/${user.role === 'worker' ? 'worker' : user.role}`} replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}