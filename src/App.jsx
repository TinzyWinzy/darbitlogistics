import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import HelpCenter from './public/HelpCenter';
import WelcomeModal from './public/WelcomeModal';
import PaymentSuccess from './public/PaymentSuccess';
import { Suspense } from 'react';
import Sidebar from './public/Sidebar';
import Loads from './operator/Loads';
import CustomerList from './operator/CustomerList';
import { useDeliveries } from './services/useDeliveries';
import { useParentBookings } from './services/useParentBookings';
import Reports from './operator/Reports';

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

function AppLayout({ sidebarOpen, setSidebarOpen }) {
  const { user } = useContext(AuthContext);
  const isAuthenticated = !!user;
  const location = useLocation();
  const sidebarRoutes = [
    '/dashboard', '/loads', '/customers', '/reports', '/billing', '/admin/dashboard'
  ];
  const showSidebar = isAuthenticated && sidebarRoutes.some(route => location.pathname.startsWith(route));

  // Use the same hooks as Dashboard to get parentBookings and deliveries
  const deliveriesData = useDeliveries();
  const parentBookingsData = useParentBookings();

  return (
    <div className="app-flex-layout d-flex">
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      <main className="flex-grow-1">
        <Routes>
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/loads" element={
                  <ProtectedRoute>
                    <Loads />
                  </ProtectedRoute>
                } />
                <Route path="/customers" element={
                  <ProtectedRoute>
                    <CustomerList parentBookings={parentBookingsData.parentBookings} deliveries={deliveriesData.deliveries} />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={<Reports />} />
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                <Route path="/track" element={<TrackDelivery />} />
                <Route path="/offerings" element={<Offerings />} />
                <Route path="/login" element={
                  isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
                } />
                <Route path="/" element={<Landing />} />
                <Route path="/track-delivery" element={<TrackDelivery />} />
                <Route path="/track-booking" element={<TrackParentBooking />} />
                <Route path="/operator/dashboard" element={<Dashboard />} />
                <Route path="/parent-booking-details/:id" element={<ParentBookingDetails />} />
                <Route path="/billing" element={<BillingDashboard />} />
                <Route path="/plans" element={<SubscriptionPlans />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>
        <Footer />
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // for mobile

  // Add these states to hold user-specific data at the top level
  const [deliveries, setDeliveries] = useState([]);
  const [parentBookings, setParentBookings] = useState([]);

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

  // Clear all user-specific state on logout or user change
  useEffect(() => {
    if (!user) {
      setDeliveries([]);
      setParentBookings([]);
      // Add any other user-specific state resets here
    }
  }, [user]);

  const isAuthenticated = !!user;

  return (
    <>
      <AuthContext.Provider value={{ user, setUser, isAuthenticated, loading }}>
        <Router>
          <WelcomeModal />
          <Navbar onHamburgerClick={() => setSidebarOpen(o => !o)} />
          <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </Router>
      </AuthContext.Provider>
    </>
  );
}
