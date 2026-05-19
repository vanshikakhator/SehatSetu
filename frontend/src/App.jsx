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

export default function App() {
  const { user, logout } = useAuth();

  return (
    <Router>
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