import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { deliveryApi, notificationApi, invoiceApi } from '../services/api';
import { useDeliveries } from '../services/useDeliveries';
import { useParentBookings } from '../services/useParentBookings';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import ParentBookingDetails from './ParentBookingDetails';
import ConsignmentMonitor from './ConsignmentMonitor';
import ParentBookingForm from './ParentBookingForm';
import DeliveryDispatchForm from './DeliveryDispatchForm';
import CheckpointLoggerForm from './CheckpointLoggerForm';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement, PointElement, LineElement, Title } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement, PointElement, LineElement, Title);
import { FaUsers, FaTruck, FaCheckCircle, FaHourglassHalf, FaBell, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaFileDownload, FaChartBar, FaEye, FaPlus, FaClipboardList } from 'react-icons/fa';
import { useRef } from 'react';
import SummaryWidgets from './SummaryWidgets';
import DashboardNotifications from './DashboardNotifications';
import DashboardAnalytics from './DashboardAnalytics';
import './Dashboard.mobile.css';

const mineralTypes = [
  'Agate', 'Adamite', 'Andalusite', 'Anhydrite', 'Angelisite', 'Anthophyllite', 'Antimony', 'Aragonite', 'Arucite', 'Arsenic',
  'Bauxite', 'Beryl', 'Bismuth', 'Bornite', 'Calcite', 'Chalcocite', 'Chalcopyrite', 'Chromite', 'Coal', 'Cobalt', 'Copper',
  'Copper Ore', 'Corundum', 'Corndian', 'Diamond', 'Dolomite', 'Fireclay', 'Galena', 'Galena (Lead)', 'Gold', 'Gold Ore', 'Graphite', 'Gypsum', 'Hematite',
  'Hematite (Iron ore)', 'Iron Ore', 'Jasper', 'Kaolinite Clay', 'Kyanite', 'Lead', 'Lepidolite', 'Limestone', 'Limonite Clay', 'Magnesite', 'Manganese',
  'Marble', 'Mercury', 'Modalite', 'Molybdenum', 'Monazite', 'Mtorolite', 'Muscovite', 'Nickel', 'Orthoclase', 'PGMs', 'Phosphate', 'Phyllite',
  'Platinum', 'Pollucite', 'Pyrite', 'Quartz', 'Rutile', 'Rutile (Titanium)', 'Scheelite', 'Schorl', 'Serpentine', 'Sillimanite', 'Silver', 'Slates',
  'Sphalerite', 'Tantalite-columbite', 'Titanium', 'Tungsten', 'Wolfram', 'Other'
];

const mineralLocations = {
  'Agate': ['Battlefields'],
  'Adamite': ['Sanyati mine'],
  'Angelisite': ['Sanyati mine'],
  'Andalusite': ['Karoi'],
  'Anhydrite': ['Norah mine'],
  'Anthophyllite': ['Sanyati'],
  'Arucite': ['Ethel Mine', 'Mutorashanga'],
  'Aragonite': ['Mangula Mine', 'Mhangura'],
  'Antimony': ['Kadoma'],
  'Arsenic': ['Kadoma'],
  'Beryl': ['Hurungwe'],
  'Bornite': ['Mangula Mine'],
  'Bismuth': ['Kadoma'],
  'Coal': ['Strange\'s deposits', 'Mashambanzou'],
  'Cobalt': ['Great dyke', 'Mhangura mines'],
  'Copper': ['Mangula Mine', 'Mhangura', 'Great Dyke'],
  'Chalcocite': ['Mangula Mine', 'Mhangura'],
  'Calcite': ['Miriam Mine (Norah Mine)', 'Mhangura'],
  'Corundum': ['Chegutu area'],
  'Chromite': ['Mutorashanga', 'Ngezi', 'Great Dyke'],
  'Dolomite': ['Sanyati mine', 'Tengwe'],
  'Gold': ['Kadoma', 'Chegutu', 'Chinhoyi', 'Karoi', 'Banket', 'Zimplats'],
  'Gypsum': ['Sanyati'],
  'Galena (Lead)': ['Hurungwe', 'Kadoma'],
  'Graphite': ['Hurungwe', 'Makonde', 'Sanyati'],
  'Fireclay': ['Mac farm Kadoma'],
  'Hematite (Iron ore)': ['Miriam mine(Sanyati district)'],
  'Jasper': ['Battlefields'],
  'Kaolinite Clay': ['St Annes mine', 'Mwami', 'Kadoma'],
  'Kyanite': ['Hurungwe'],
  'Corndian': ['Battlefields'],
  'Limonite Clay': ['Sanyati mine', 'Kadoma'],
  'Limestone': ['Chidamoyo-hurungwe area', 'Makonde', 'Chegutu'],
  'Muscovite': ['Hurungwe'],
  'Manganese': ['Makonde', 'Kadoma'],
  'Molybdenum': ['Makonde'],
  'Mercury': ['Kadoma', 'Battlefields'],
  'Mtorolite': ['Mutorashanga area'],
  'Magnesite': ['Kadoma'],
  'Modalite': ['Karoi', 'Mwami'],
  'Monazite': ['Hurungwe', 'Sanyati'],
  'Lepidolite': ['Hurungwe'],
  'Slates': ['Makonde'],
  'Phyllite': ['Hurungwe'],
  'Nickel': ['Great Dyke', 'Mhangura', 'Makonde', 'Sanyati'],
  'Sphalerite': ['Zinc'],
  'Pollucite': ['Hurungwe'],
  'Orthoclase': ['Hurungwe district'],
  'Platinum/PGMs': ['Makwiro'],
  'Pyrite': ['Mangula mine', 'Sanyati'],
  'Quartz': ['Mwami', 'Karoi district'],
  'Rutile (Titanium)': ['Hurungwe'],
  'Sillimanite': ['Hurungwe'],
  'Schorl': ['Ethel mine Mtorashanga', 'Mwami karoi'],
  'Serpentine': ['Great dyke'],
  'Silver': ['All gold mines'],
  'Scheelite': ['Kadoma', 'Battlefields'],
  'Tungsten': ['Hurungwe', 'Makonde', 'Sanyati'],
  'Tantalite-columbite': ['Hurungwe'],
  'Wolfram': ['Hurungwe'],
};

// Modern Spinner component
function ModernSpinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="modern-loading" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function OperatorDashboard() {
  const { 
    deliveries: initialDeliveries, 
    loading: loadingDeliveries, 
    error: deliveriesError, 
    createDelivery,
    setDeliveries,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    fetchDeliveries,
    pendingDeliveries,
    hasPendingSync
  } = useDeliveries();
  
  const { 
    parentBookings, 
    loading: parentBookingsLoading, 
    error: parentBookingsError, 
    createParentBooking,
    fetchParentBookings
  } = useParentBookings();

  const [selectedId, setSelectedId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerBookings, setSelectedCustomerBookings] = useState([]);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    selectedBookingId: '',
    currentStatus: '',
    driverDetails: {
      name: '',
      vehicleReg: ''
    },
    containerCount: '',
    tonnage: '',
    vehicleType: 'Standard Truck',
    vehicleCapacity: 30.00,
    loadingPoint: '',
    destination: '',
    environmentalIncidents: '',
    samplingStatus: ''
  });
  const navigate = useNavigate();
  const { setUser, user } = useContext(AuthContext);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeout = useRef();
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [smsPreview, setSmsPreview] = useState('');
  
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedParentBooking, setSelectedParentBooking] = useState(null);
  const [showParentDetails, setShowParentDetails] = useState(false);
  const [showCreateParentBookingModal, setShowCreateParentBookingModal] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localDeliveries, setLocalDeliveries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [activeChartTab, setActiveChartTab] = useState('bar');

  // Add tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Responsive container class
  const [containerClass, setContainerClass] = useState(window.innerWidth <= 600 ? 'container-fluid py-5 px-0' : 'container py-5 px-2 px-md-4');
  useEffect(() => {
    function handleResize() {
      setContainerClass(window.innerWidth <= 600 ? 'container-fluid py-5 px-0' : 'container py-5 px-2 px-md-4');
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    notificationApi.getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  // Dismiss notification (mark as read)
  const dismissNotification = useCallback(async (id) => {
    await notificationApi.markNotificationRead(id);
    setNotifications(n => n.filter(notif => notif.id !== id));
    setToastMsg('Notification dismissed');
    setShowToast(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setShowToast(false), 2500);
  }, []);

  const markAllNotificationsRead = async () => {
    await Promise.all(notifications.map(n => notificationApi.markNotificationRead(n.id)));
    setNotifications([]);
    setToastMsg('All notifications marked as read');
    setShowToast(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setShowToast(false), 2500);
  };

  // Fetch analytics on mount
  useEffect(() => {
    setLoadingAnalytics(true);
    deliveryApi.getAnalytics?.().then(setAnalytics).finally(() => setLoadingAnalytics(false));
  }, []);

  // Fetch invoices on mount
  useEffect(() => {
    setLoadingInvoices(true);
    invoiceApi.getInvoices().then(setInvoices).finally(() => setLoadingInvoices(false));
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (parentBookings.length > 0) {
      updateCustomersList(parentBookings);
    }
  }, [parentBookings]);

  useEffect(() => {
    if (initialDeliveries) {
      setLocalDeliveries(initialDeliveries);
    }
  }, [initialDeliveries]);

  useEffect(() => {
    if (user) {
      setCreateForm(prevForm => ({ ...prevForm, operator: user.username }));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLocalDeliveries([]);
      setCustomers([]);
      setSelectedCustomerBookings([]);
      setNotifications([]);
      setAnalytics(null);
      setInvoices([]);
      setSelectedId('');
      setSelectedParentId(null);
      setSelectedParentBooking(null);
      setShowParentDetails(false);
      setShowCreateParentBookingModal(false);
      setFeedback('');
      setSubmitting(false);
      setShowToast(false);
      setToastMsg('');
      setShowSmsPreview(false);
      setSmsPreview('');
      setActiveChartTab('bar');
      setActiveTab('overview'); // Reset tab
    }
  }, [user]);

  const error = deliveriesError || parentBookingsError;

  function generateTrackingId() {
    const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
    const digits = Math.floor(1000 + Math.random() * 9000);
    return letters + digits;
  }

  function validateZimPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return (
      cleaned.length === 9 && cleaned.startsWith('7') ||
      cleaned.length === 10 && cleaned.startsWith('07') ||
      cleaned.length === 12 && cleaned.startsWith('2637') ||
      cleaned.length === 13 && cleaned.startsWith('2637')
    );
  }

  const handleUpdateCheckpoint = async (trackingId, newCheckpoint) => {
    const delivery = localDeliveries.find(d => d.trackingId === trackingId);
    if (!delivery) {
      setFeedback('Could not find the delivery to update.');
      return;
    }

    if (delivery.isCompleted && newCheckpoint.status !== 'Cancelled') {
      setFeedback('Cannot update a completed delivery unless cancelling.');
      return;
    }
    
    const updatedCheckpoints = [...(delivery.checkpoints || []), newCheckpoint];

    try {
      setSubmitting(true);
      const res = await deliveryApi.updateCheckpoint(trackingId, {
        checkpoints: updatedCheckpoints,
        currentStatus: newCheckpoint.status
      });
      
      setLocalDeliveries(prev => prev.map(d => 
        d.trackingId === trackingId
          ? { 
              ...d, 
              checkpoints: res.checkpoints, 
              currentStatus: newCheckpoint.status,
              isCompleted: res.isCompleted,
              completionDate: res.completionDate,
              updatedAt: new Date().toISOString()
            }
          : d
      ));
      
      await fetchParentBookings();
      setFeedback('Checkpoint logged successfully!');
      
      setCreateForm({
        location: '',
        operator: user?.username || '',
        comment: '',
        status: '',
        coordinates: '',
        timestamp: new Date(),
        hasIssue: false,
        issueDetails: ''
      });
      setSelectedId('');

    } catch (error) {
      setFeedback(error.response?.data?.error || 'Failed to update checkpoint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    navigate('/login');
  };

  // Function to fetch unique customers from parent bookings
  const updateCustomersList = (bookings) => {
    const uniqueCustomers = bookings.reduce((acc, booking) => {
      const compositeId = `${booking.customerName}|${booking.phoneNumber}`;
      if (!acc.find(c => c.id === compositeId)) {
        acc.push({
          id: compositeId,
          name: booking.customerName,
          phone: booking.phoneNumber
        });
      }
      return acc;
    }, []);
    setCustomers(uniqueCustomers);
  };

  // Update customer bookings when a customer is selected
  const handleCustomerSelect = (compositeId) => {
    setSelectedCustomerId(compositeId);
    const [customerName, phoneNumber] = compositeId.split('|');
    const customerBookings = parentBookings.filter(
      booking =>
        booking.customerName === customerName &&
        booking.phoneNumber === phoneNumber &&
        booking.status === 'Active' &&
        booking.remainingTonnage > 0
    );
    setSelectedCustomerBookings(customerBookings);
  };

  // Update form when a booking is selected
  const handleBookingSelect = (bookingId) => {
    const selectedBooking = parentBookings.find(b => b.id === bookingId);
    if (selectedBooking) {
      const selectedCustomer = customers.find(c => c.name === selectedBooking.customerName);
      setCreateForm(prev => ({
        ...prev,
        selectedBookingId: bookingId,
        loadingPoint: selectedBooking.loadingPoint,
        destination: selectedBooking.destination,
        mineral_type: selectedBooking.mineral_type,
        mineral_grade: selectedBooking.mineral_grade,
        currentStatus: 'Pending',
        driverDetails: {
          ...prev.driverDetails
        }
      }));
    }
  };

  // Add delivery status options
  const statusOptions = [
    'Pending',
    'At Mine',
    'In Transit',
    'At Border',
    'At Port',
    'At Port of Destination',
    'At Warehouse',
    'Delivered',
    'Cancelled'
  ];

  // Function to render checkpoint history
  const renderCheckpointHistory = (delivery) => {
    const checkpoints = delivery.checkpoints || [];
    if (checkpoints.length === 0) {
      return <p className="text-muted">No checkpoints recorded yet.</p>;
    }

    return (
      <div className="checkpoint-history mt-3">
        <h6 className="mb-3 fw-bold" style={{ color: 'var(--primary-orange)' }}>Audit Log</h6>
        <ul className="list-unstyled">
          {checkpoints.slice().reverse().map((cp, index) => (
            <li key={index} className="checkpoint-item mb-3 border-start border-3 ps-3 glassmorphism-card" style={{ borderColor: 'var(--primary-orange)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <strong className="text-dark">{cp.location}</strong>
                <span className={`modern-badge ${cp.hasIssue ? 'modern-badge-danger' : 'modern-badge-info'}`}>{cp.status}</span>
              </div>
              <small className="text-muted d-block">
                {new Date(cp.timestamp).toLocaleString()} by <strong>{cp.operator || cp.operator_username || 'System'}</strong>
              </small>
              {cp.comment && <p className="mb-0 mt-1 fst-italic">"{cp.comment}"</p>}
              {cp.hasIssue && (
                <div className="alert alert-warning mt-1 mb-0 py-1 px-2">
                  <small><strong>Issue Reported:</strong> {cp.issueDetails}</small>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Add this handler to reset selects after form submission
  const handleFormReset = () => {
    setSelectedCustomerId('');
    setSelectedCustomerBookings([]);
  };

  // Compute summary stats
  const activeLoads = localDeliveries.filter(d => d.currentStatus?.toLowerCase() === 'active').length;
  const completedLoads = localDeliveries.filter(d => d.currentStatus?.toLowerCase() === 'delivered' || d.currentStatus?.toLowerCase() === 'completed').length;
  const pendingLoads = localDeliveries.filter(d => d.currentStatus?.toLowerCase() === 'pending' || d.currentStatus?.toLowerCase() === 'not started').length;
  const totalCustomers = Array.isArray(parentBookings)
    ? new Set(parentBookings.map(b => b.customerName || b.customer_id)).size
    : 0;

  // Dummy trend data for analytics (replace with real trend logic if available)
  const analyticsTrends = {
    total: 1, // 1 = up, -1 = down, 0 = flat
    completed: -1,
    pending: 0
  };

  return (
    <div className={`dashboard-container ${containerClass} fade-in`}>
      {/* Offline Sync Alert */}
      {hasPendingSync && (
        <div className="alert alert-warning d-flex align-items-center glassmorphism-card" role="alert">
          <FaExclamationTriangle className="me-2" />
          <span>
            You have offline deliveries pending sync. They will be sent automatically when you reconnect.
          </span>
        </div>
      )}

      {/* Modern Toast/Snackbar Feedback */}
      {showToast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4 slide-up glassmorphism-toast" style={{zIndex:9999, minWidth: '280px'}} role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header bg-primary text-white">
            <strong className="me-auto">Info</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)} aria-label="Close"></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="glassmorphism-card mb-4">
        <div className="card-header-glass">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              <div className="widget-icon bg-primary text-white me-3">
                <FaTruck />
              </div>
              <div>
                <h1 className="h3 fw-bold mb-1 gradient-text">
                  Dar Logistics - Operations Hub
                </h1>
                <p className="text-muted mb-0">Manage deliveries, track consignments, and monitor operations</p>
              </div>
            </div>
            <button
              className="btn-modern btn-modern-primary"
              onClick={() => setShowCreateParentBookingModal(true)}
              aria-label="Log new consignment"
            >
              <FaFileDownload />
              Log New Consignment
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Operations Console Banner */}
      <div className="glassmorphism-banner bg-warning text-dark text-center py-2 small fw-bold mb-4">
        <FaTruck className="me-2" />
        STRATEGIC OPERATIONS CONSOLE
      </div>

      {/* Modern Tab Navigation */}
      <div className="glassmorphism-card mb-4">
        <div className="card-header-glass">
          <ul className="nav nav-tabs nav-fill border-0" id="dashboardTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''} d-flex align-items-center gap-2`}
                onClick={() => setActiveTab('overview')}
                type="button"
                role="tab"
                aria-controls="overview-tab"
                aria-selected={activeTab === 'overview'}
              >
                <FaChartBar />
                <span className="d-none d-sm-inline">Overview</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'dispatch' ? 'active' : ''} d-flex align-items-center gap-2`}
                onClick={() => setActiveTab('dispatch')}
                type="button"
                role="tab"
                aria-controls="dispatch-tab"
                aria-selected={activeTab === 'dispatch'}
              >
                <FaPlus />
                <span className="d-none d-sm-inline">Dispatch</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'monitor' ? 'active' : ''} d-flex align-items-center gap-2`}
                onClick={() => setActiveTab('monitor')}
                type="button"
                role="tab"
                aria-controls="monitor-tab"
                aria-selected={activeTab === 'monitor'}
              >
                <FaEye />
                <span className="d-none d-sm-inline">Monitor</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'reports' ? 'active' : ''} d-flex align-items-center gap-2`}
                onClick={() => setActiveTab('reports')}
                type="button"
                role="tab"
                aria-controls="reports-tab"
                aria-selected={activeTab === 'reports'}
              >
                <FaClipboardList />
                <span className="d-none d-sm-inline">Reports</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content" id="dashboardTabContent">
        
        {/* Overview Tab */}
        <div className={`tab-pane fade ${activeTab === 'overview' ? 'show active' : ''}`} id="overview-tab" role="tabpanel" aria-labelledby="overview-tab">
          {/* Summary Widgets Row */}
          <SummaryWidgets
            activeLoads={activeLoads}
            completedLoads={completedLoads}
            pendingLoads={pendingLoads}
            totalCustomers={totalCustomers}
            analyticsTrends={analyticsTrends}
          />

          {/* Notifications/Alerts Area */}
          <DashboardNotifications
            notifications={notifications}
            onDismiss={dismissNotification}
            onMarkAllRead={markAllNotificationsRead}
            showToast={showToast}
            toastMsg={toastMsg}
            setShowToast={setShowToast}
          />

          {/* Dashboard Analytics Section */}
          <div className="row">
            <div className="col-12 mb-4">
              <DashboardAnalytics
                analytics={analytics}
                loadingAnalytics={loadingAnalytics}
                activeChartTab={activeChartTab}
                setActiveChartTab={setActiveChartTab}
              />
            </div>
          </div>
        </div>

        {/* Dispatch Tab */}
        <div className={`tab-pane fade ${activeTab === 'dispatch' ? 'show active' : ''}`} id="dispatch-tab" role="tabpanel" aria-labelledby="dispatch-tab">
          {/* Modern Create Delivery Form */}
          <div className="glassmorphism-card mb-4">
            <div className="card-header-glass">
              <h2 className="h5 fw-bold mb-0 gradient-text">
                <FaTruck className="me-2" />
                Dispatch New Load
              </h2>
            </div>
            <div className="card-body-glass">
              <DeliveryDispatchForm
                customers={customers}
                parentBookings={parentBookings}
                createDelivery={createDelivery}
                fetchParentBookings={fetchParentBookings}
                onSuccess={async () => {
                  await fetchParentBookings();
                  await fetchDeliveries();
                }}
                onFeedback={setFeedback}
              />
            </div>
          </div>
        </div>

        {/* Monitor Tab */}
        <div className={`tab-pane fade ${activeTab === 'monitor' ? 'show active' : ''}`} id="monitor-tab" role="tabpanel" aria-labelledby="monitor-tab">
          {/* Consignment Monitor */}
          <div className="row g-4">
            <div className="col-12">
              <ConsignmentMonitor
                parentBookings={parentBookings}
                loading={parentBookingsLoading}
                error={parentBookingsError}
                onSelectDelivery={setSelectedId}
                user={user}
                onSubmitCheckpoint={handleUpdateCheckpoint}
                onSuccess={async () => {
                  await fetchParentBookings();
                  await fetchDeliveries();
                  setToastMsg('Checkpoint logged successfully!');
                  setShowToast(true);
                  clearTimeout(toastTimeout.current);
                  toastTimeout.current = setTimeout(() => setShowToast(false), 2500);
                }}
                onFeedback={setFeedback}
              />

              {/* Pagination Controls for Deliveries */}
              <div className="d-flex justify-content-between align-items-center mt-4 dashboard-pagination-controls">
                <div className="small text-muted">
                  {parentBookings.length > 0 && (
                    <span>
                      Showing {Math.min((page - 1) * pageSize + 1, total)}-
                      {Math.min(page * pageSize, total)} of {total} deliveries
                    </span>
                  )}
                </div>
                <div className="btn-group" role="group" aria-label="Pagination controls">
                  <button
                    className="btn-modern btn-modern-secondary"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    &laquo; Prev
                  </button>
                  <span className="mx-3 align-self-center small">
                    Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                  </span>
                  <button
                    className="btn-modern btn-modern-secondary"
                    onClick={() => setPage(page + 1)}
                    disabled={page * pageSize >= total}
                    aria-label="Next page"
                  >
                    Next &raquo;
                  </button>
                </div>
                <div className="ms-3">
                  <select
                    className="form-control-modern"
                    style={{ width: 'auto', display: 'inline-block' }}
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    aria-label="Select page size"
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size} / page</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Tab */}
        <div className={`tab-pane fade ${activeTab === 'reports' ? 'show active' : ''}`} id="reports-tab" role="tabpanel" aria-labelledby="reports-tab">
          <div className="glassmorphism-card">
            <div className="card-header-glass">
              <h3 className="h5 fw-bold mb-0 gradient-text">
                <FaClipboardList className="me-2" />
                Detailed Reports & Analytics
              </h3>
            </div>
            <div className="card-body-glass">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="glassmorphism-card">
                    <div className="card-header-glass">
                      <h6 className="mb-0">Delivery Performance</h6>
                    </div>
                    <div className="card-body-glass">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Active Deliveries</span>
                        <span className="fw-bold text-primary">{activeLoads}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Completed Deliveries</span>
                        <span className="fw-bold text-success">{completedLoads}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Pending Deliveries</span>
                        <span className="fw-bold text-warning">{pendingLoads}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="glassmorphism-card">
                    <div className="card-header-glass">
                      <h6 className="mb-0">Customer Overview</h6>
                    </div>
                    <div className="card-body-glass">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Total Customers</span>
                        <span className="fw-bold text-info">{totalCustomers}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Active Consignments</span>
                        <span className="fw-bold text-primary">{parentBookings.filter(b => b.status === 'Active').length}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Total Bookings</span>
                        <span className="fw-bold text-secondary">{parentBookings.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Analytics Charts */}
              {analytics && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="glassmorphism-card">
                      <div className="card-header-glass">
                        <h6 className="mb-0">Advanced Analytics</h6>
                      </div>
                      <div className="card-body-glass">
                        <DashboardAnalytics
                          analytics={analytics}
                          loadingAnalytics={loadingAnalytics}
                          activeChartTab={activeChartTab}
                          setActiveChartTab={setActiveChartTab}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parent Booking Form Modal */}
      {showCreateParentBookingModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="parentBookingModalLabel" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down" role="document">
            <div className="modal-content glassmorphism-card">
              <div className="card-header-glass">
                <h5 className="modal-title" id="parentBookingModalLabel">Log New Consignment</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCreateParentBookingModal(false)}></button>
              </div>
              <div className="card-body-glass" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
                <ParentBookingForm
                  onClose={() => setShowCreateParentBookingModal(false)}
                  onSuccess={fetchParentBookings}
                  createParentBooking={createParentBooking}
                  mineralTypes={mineralTypes}
                  mineralLocations={mineralLocations}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Booking Details Modal */}
      {showParentDetails && selectedParentBooking && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-backdrop fade show" onClick={() => setShowParentDetails(false)}></div>
          <ParentBookingDetails 
            booking={selectedParentBooking} 
            onClose={() => setShowParentDetails(false)} 
          />
        </div>
      )}

      {/* Internal Support Contact */}
      <div className="text-center text-muted small mt-5 glassmorphism-card p-3">
        <p className="mb-1">Need help? Contact our support team</p>
        <div className="d-flex justify-content-center gap-3">
          <a href="mailto:support@darlogistics.co.zw" className="text-decoration-none" style={{ color: 'var(--primary-orange)' }}>
            <FaBell className="me-1" />
            support@darlogistics.co.zw
          </a>
          <a href="tel:+263781334474" className="text-decoration-none" style={{ color: 'var(--primary-orange)' }}>
            <FaTruck className="me-1" />
            +263 781 334474
          </a>
        </div>
      </div>

      <style>{`
        /* CSS Custom Properties for Dashboard */
        :root {
          --primary-blue: #003366;
          --primary-orange: #FF6600;
          --accent-orange: #FF8533;
          --accent-blue: #0066CC;
          --danger-red: #dc3545;
          --info-cyan: #17a2b8;
          --success-green: #28a745;
          --warning-yellow: #ffc107;
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-size-2xl: 1.5rem;
          --font-size-3xl: 1.875rem;
          --font-size-4xl: 2.25rem;
          --space-1: 0.25rem;
          --space-2: 0.5rem;
          --space-3: 0.75rem;
          --space-4: 1rem;
          --space-5: 1.25rem;
          --space-6: 1.5rem;
          --space-8: 2rem;
          --space-10: 2.5rem;
          --radius-sm: 0.375rem;
          --radius-md: 0.5rem;
          --radius-lg: 0.75rem;
          --radius-xl: 1rem;
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --transition-slow: 0.3s ease;
        }

        .dashboard-container {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          color: white;
        }

        /* Enhanced Glassmorphism Cards */
        .glassmorphism-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .glassmorphism-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .card-header-glass {
          background: rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 1.5rem;
          border-radius: 16px 16px 0 0;
          backdrop-filter: blur(10px);
        }

        .card-body-glass {
          padding: 1.5rem;
        }

        /* Enhanced Glassmorphism Banner */
        .glassmorphism-banner {
          background: rgba(255, 193, 7, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 12px;
          letter-spacing: 1px;
          font-weight: 600;
        }

        /* Enhanced Glassmorphism Toast */
        .glassmorphism-toast {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        /* Enhanced Gradient Text */
        .gradient-text {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }

        /* Enhanced Widget Icon */
        .widget-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          box-shadow: 0 4px 16px rgba(255, 102, 0, 0.3);
        }

        /* Enhanced Modern Buttons */
        .btn-modern {
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          font-size: var(--font-size-base);
        }

        .btn-modern-primary {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          color: white;
          box-shadow: 0 4px 16px rgba(255, 102, 0, 0.3);
        }

        .btn-modern-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 102, 0, 0.4);
        }

        .btn-modern-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .btn-modern-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        /* Enhanced Form Controls */
        .form-control-modern {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          padding: 12px 16px;
          font-size: var(--font-size-base);
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .form-control-modern:focus {
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 0.2rem rgba(255, 102, 0, 0.25);
          background: rgba(255, 255, 255, 0.15);
          outline: none;
        }

        .form-control-modern::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Enhanced Navigation Tabs */
        .nav-tabs {
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-tabs .nav-link {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          margin: 0 4px;
          transition: all 0.3s ease;
          padding: 12px 20px;
          font-weight: 500;
          font-size: var(--font-size-base);
        }

        .nav-tabs .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateY(-1px);
        }

        .nav-tabs .nav-link.active {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          color: white;
          box-shadow: 0 4px 16px rgba(255, 102, 0, 0.3);
        }

        /* Enhanced Checkpoint History */
        .checkpoint-item {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          border-left: 4px solid var(--primary-orange);
          transition: all 0.3s ease;
        }

        .checkpoint-item:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateX(4px);
        }

        /* Enhanced Modern Badges */
        .modern-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modern-badge-danger {
          background: rgba(220, 53, 69, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(220, 53, 69, 0.3);
        }

        .modern-badge-info {
          background: rgba(23, 162, 184, 0.2);
          color: #4ecdc4;
          border: 1px solid rgba(23, 162, 184, 0.3);
        }

        .modern-badge-success {
          background: rgba(40, 167, 69, 0.2);
          color: #51cf66;
          border: 1px solid rgba(40, 167, 69, 0.3);
        }

        .modern-badge-warning {
          background: rgba(255, 193, 7, 0.2);
          color: #ffd43b;
          border: 1px solid rgba(255, 193, 7, 0.3);
        }

        /* Enhanced Animations */
        .slide-up {
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Enhanced Responsive Design */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }
          
          .glassmorphism-card {
            margin-bottom: 1rem;
          }
          
          .card-header-glass,
          .card-body-glass {
            padding: 1rem;
          }

          .btn-modern {
            padding: 14px 20px;
            font-size: var(--font-size-base);
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .nav-tabs .nav-link {
            padding: 10px 16px;
            font-size: var(--font-size-sm);
          }

          .widget-icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 0.5rem;
          }

          .card-header-glass,
          .card-body-glass {
            padding: 0.75rem;
          }

          .btn-modern {
            padding: 12px 16px;
            font-size: var(--font-size-sm);
          }
        }

        /* Enhanced Typography */
        .dashboard-container h1,
        .dashboard-container h2,
        .dashboard-container h3,
        .dashboard-container h4,
        .dashboard-container h5,
        .dashboard-container h6 {
          color: white;
          font-weight: 600;
        }

        .dashboard-container p {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        .dashboard-container .text-muted {
          color: rgba(255, 255, 255, 0.6) !important;
        }

        /* Enhanced Modal Styling */
        .modal-content.glassmorphism-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* Enhanced Pagination Controls */
        .dashboard-pagination-controls {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem;
          margin-top: 1rem;
        }

        /* Enhanced Loading Spinner */
        .modern-loading {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid var(--primary-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Helper functions for deadline badges
function getDeadlineBadgeClass(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline < 0) return 'modern-badge-danger';
  if (daysUntilDeadline <= 3) return 'modern-badge-warning';
  return 'modern-badge-success';
}

function getTimeLeft(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  
  if (diff <= 0) return 'EXPIRED';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${days}d ${hours}h`;
}

// Add this utility function near other utility functions
function addHoursToDate(date, hours) {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
} 