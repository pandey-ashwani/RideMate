import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScrollToHash } from './components/Common/ScrollToHash';

// Pages
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VehicleSearch from './pages/Customer/VehicleSearch';
import CustomerDashboard from './pages/Customer/CustomerDashboard';

// Owner Pages
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import ManageVehicles from './pages/Owner/ManageVehicles';
import BookingRequests from './pages/Owner/BookingRequests';
import OwnerEarnings from './pages/Owner/OwnerEarnings';
import OwnerProfile from './pages/Owner/OwnerProfile';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageUsers from './pages/Admin/ManageUsers';
import VerifyOwners from './pages/Admin/VerifyOwners';
import ManageListings from './pages/Admin/ManageListings';
import ViewAllBookings from './pages/Admin/ViewAllBookings';
import AdminPayments from './pages/Admin/AdminPayments';

// Role Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Save attempted redirect route if needed
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user's role isn't authorized, bounce back to public homepage
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/vehicles" element={<VehicleSearch />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Secure Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Owner Secure Routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/vehicles"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <ManageVehicles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/bookings"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <BookingRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/earnings"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerEarnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/profile"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin Secure Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verify-hosts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <VerifyOwners />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/listings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ViewAllBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPayments />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
