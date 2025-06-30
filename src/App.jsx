import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './operator/Dashboard';
import AdminDashboard from './operator/AdminDashboard';
import TrackDelivery from './customer/TrackDelivery';
import TrackParentBooking from './customer/TrackParentBooking.jsx';
import Navbar from './public/Navbar';
import Landing from './public/Landing';
import Offerings from './public/Offerings';
import Login from './public/Login';
import Footer from './public/Footer';
import './App.css'
import { useState, createContext, useEffect, useContext } from 'react';
import axios from 'axios';
import ParentBookingDetails from './operator/ParentBookingDetails';
import BillingDashboard from './public/BillingDashboard';
import SubscriptionPlans from './public/SubscriptionPlans';

export const AuthContext = createContext(null);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="d-flex justify-content-center p-5">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="d-flex justify-content-center p-5">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      let token = localStorage.getItem('jwt_token');
      if (!token) {
        // Try to refresh
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {}, { withCredentials: true });
          token = res.data.token;
          localStorage.setItem('jwt_token', token);
        } catch (err) {
          setUser(null);
          setLoading(false);
          return;
        }
      }
      // Now check /me with the (possibly new) token
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, loading }}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/track" element={<TrackDelivery />} />
          <Route path="/offerings" element={<Offerings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Landing />} />
          <Route path="/track-delivery" element={<TrackDelivery />} />
          <Route path="/track-booking" element={<TrackParentBooking />} />
          <Route path="/operator/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/parent-booking-details/:id" element={<ParentBookingDetails />} />
          <Route path="/billing" element={<BillingDashboard />} />
          <Route path="/plans" element={<SubscriptionPlans />} />
        </Routes>
        <Footer />
      </Router>
    </AuthContext.Provider>
  );
}
