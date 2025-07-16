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
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
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
import InvoiceHistory from './components/InvoiceHistory';
import { processOutbox } from './services/api';
import { sendPushNotification } from './services/api';
import { jwtDecode as jwt_decode } from 'jwt-decode';
import Profile from './public/Profile';
import Settings from './public/Settings';

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
    <div className="d-flex flex-nowrap min-vh-100 w-100">
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      <main className="flex-grow-1 container-fluid p-0">
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
                <Route path="/invoices" element={
                  <ProtectedRoute>
                    <InvoiceHistory />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
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
  // Sync notification state
  const [syncMsg, setSyncMsg] = useState('');
  const [showSyncToast, setShowSyncToast] = useState(false);
  // Add push subscription state
  const [pushSubscription, setPushSubscription] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      let token = localStorage.getItem('jwt_token');
      const cachedUser = localStorage.getItem('user_profile');
      // If offline and cached user/token exist, allow offline login only if token is not expired
      if (!navigator.onLine && cachedUser && token) {
        try {
          const decoded = jwt_decode(token);
          if (decoded.exp && Date.now() < decoded.exp * 1000) {
            setUser(JSON.parse(cachedUser));
            setLoading(false);
            return;
          } else {
            // Token expired
            setUser(null);
            localStorage.removeItem('user_profile');
            localStorage.removeItem('jwt_token');
            setLoading(false);
            return;
          }
        } catch (e) {
          // Invalid token
          setUser(null);
          localStorage.removeItem('user_profile');
          localStorage.removeItem('jwt_token');
          setLoading(false);
          return;
        }
      }
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
        localStorage.setItem('user_profile', JSON.stringify(data)); // Cache user profile
      } catch (error) {
        setUser(null);
        localStorage.removeItem('user_profile');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Try to get the push subscription on mount
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setPushSubscription(sub);
        });
      });
    }
  }, []);

  // On logout, clear cached user profile
  useEffect(() => {
    if (!user) {
      setDeliveries([]);
      setParentBookings([]);
      localStorage.removeItem('user_profile');
      // Add any other user-specific state resets here
    }
  }, [user]);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Helper to show sync notification and send push
    function handleSyncResult({ success, failed, total }) {
      if (total === 0) return;
      let msg = '';
      if (success && !failed) {
        msg = `All ${success} offline deliveries synced successfully.`;
      } else if (success && failed) {
        msg = `${success} deliveries synced, ${failed} failed.`;
      } else if (failed && !success) {
        msg = `Failed to sync ${failed} offline deliveries.`;
      }
      setSyncMsg(msg);
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 3500);
      // Send push notification if subscribed
      if (pushSubscription && msg) {
        sendPushNotification(pushSubscription, { title: 'Morres Logistics', body: msg });
      }
    }
    // On app start, try to process outbox
    processOutbox(handleSyncResult);
    // On network reconnect, process outbox and send push
    function handleOnline() {
      processOutbox(handleSyncResult);
      if (pushSubscription) {
        sendPushNotification(pushSubscription, { title: 'Morres Logistics', body: 'App is back online.' });
      }
    }
    // On network offline, send push
    function handleOffline() {
      if (pushSubscription) {
        sendPushNotification(pushSubscription, { title: 'Morres Logistics', body: 'App is offline.' });
      }
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pushSubscription]);

  useEffect(() => {
    if (sidebarOpen && window.innerWidth <= 991) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Sync Toast Notification */}
      {showSyncToast && (
        <div className="toast show position-fixed top-0 end-0 m-4" style={{zIndex:9999, minWidth: '220px'}} role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">Sync</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowSyncToast(false)} aria-label="Close"></button>
          </div>
          <div className="toast-body">{syncMsg}</div>
        </div>
      )}
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
