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
import SendOneDelivery from './public/SendOneDelivery';
import './App.css'
import './styles/modern-design.css'
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

// Import new redesigned components
import PaymentScreen from './components/PaymentScreen';
import BookingScreen from './components/BookingScreen';
import TrackingScreen from './components/TrackingScreen';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="modern-loading" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
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
    return (
      <div className="loading-container">
        <div className="modern-loading" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
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
    <div className="app-container">
      {/* Animated Background for authenticated pages */}
      {isAuthenticated && (
        <div className="background-animation">
          <div className="floating-sphere sphere-1"></div>
          <div className="floating-sphere sphere-2"></div>
          <div className="floating-sphere sphere-3"></div>
          <div className="floating-sphere sphere-4"></div>
        </div>
      )}
      
      {/* Navbar - positioned outside sidebar but inside app container */}
      <Navbar onHamburgerClick={() => setSidebarOpen(o => !o)} />
      
      <div className="d-flex flex-nowrap min-vh-100 w-100">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className="flex-grow-1 w-100 p-0" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
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
                  <Route path="/send-one-delivery" element={<SendOneDelivery />} />
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
                  
                  {/* New Redesigned Component Routes */}
                  <Route path="/payment" element={
                    <ProtectedRoute>
                      <PaymentScreen />
                    </ProtectedRoute>
                  } />
                  <Route path="/booking" element={
                    <ProtectedRoute>
                      <BookingScreen />
                    </ProtectedRoute>
                  } />
                  <Route path="/tracking" element={
                    <ProtectedRoute>
                      <TrackingScreen />
                    </ProtectedRoute>
                  } />
          </Routes>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // for mobile sidebar nav only
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
        sendPushNotification(pushSubscription, { title: 'Dar Logistics', body: msg });
      }
    }
    // On app start, try to process outbox
    processOutbox(handleSyncResult);
    // On network reconnect, process outbox and send push
    function handleOnline() {
      processOutbox(handleSyncResult);
      if (pushSubscription) {
        sendPushNotification(pushSubscription, { title: 'Dar Logistics', body: 'App is back online.' });
      }
    }
    // On network offline, send push
    function handleOffline() {
      if (pushSubscription) {
        sendPushNotification(pushSubscription, { title: 'Dar Logistics', body: 'App is offline.' });
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
        <div className="toast show position-fixed top-0 end-0 m-4 glassmorphism-toast" style={{zIndex:9999, minWidth: '280px'}} role="alert" aria-live="assertive" aria-atomic="true">
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
          <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </Router>
      </AuthContext.Provider>

      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
        }
        
        .app-container {
          min-height: 100vh;
          width: 100vw;
          max-width: 100vw;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        /* Loading Container */
        .loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
        }

        .modern-loading {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid var(--primary-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Animated Background for authenticated pages */
        .background-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        /* Navbar positioning for landing page */
        .navbar {
          position: relative;
          z-index: 1000;
        }

        .floating-sphere {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: float 8s ease-in-out infinite;
        }

        .sphere-1 {
          width: 200px;
          height: 200px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }

        .sphere-2 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .sphere-3 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          left: 15%;
          animation-delay: 4s;
        }

        .sphere-4 {
          width: 120px;
          height: 120px;
          bottom: 40%;
          right: 5%;
          animation-delay: 6s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        /* Glassmorphism Toast */
        .glassmorphism-toast {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
        }

        /* Color Variables */
        :root {
          --primary-blue: #003366;
          --accent-blue: #0066CC;
          --primary-orange: #FF6600;
          --accent-orange: #FF8533;
          --success-green: #28a745;
          --warning-yellow: #ffc107;
          --danger-red: #dc3545;
          --info-cyan: #17a2b8;
          --light-gray: #f8f9fa;
          --dark-gray: #343a40;
          --white: #ffffff;
          --black: #000000;
          --transition-slow: 0.3s ease;
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        /* Global Button Styles */
        .btn-primary {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          border: none;
          color: var(--white);
          transition: var(--transition-slow);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .btn-outline-primary {
          color: var(--primary-orange);
          border-color: var(--primary-orange);
        }

        .btn-outline-primary:hover {
          background: var(--primary-orange);
          border-color: var(--primary-orange);
        }

        /* Card Styles */
        .card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
        }

        /* Form Controls */
        .form-control:focus {
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 0.2rem rgba(255, 102, 0, 0.25);
        }

        /* Alert Styles */
        .alert-success {
          background: rgba(40, 167, 69, 0.1);
          border-color: var(--success-green);
          color: var(--success-green);
        }

        .alert-warning {
          background: rgba(255, 193, 7, 0.1);
          border-color: var(--warning-yellow);
          color: var(--warning-yellow);
        }

        .alert-danger {
          background: rgba(220, 53, 69, 0.1);
          border-color: var(--danger-red);
          color: var(--danger-red);
        }

        .alert-info {
          background: rgba(23, 162, 184, 0.1);
          border-color: var(--info-cyan);
          color: var(--info-cyan);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .app-container {
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          }
        }
      `}</style>
    </>
  );
}
