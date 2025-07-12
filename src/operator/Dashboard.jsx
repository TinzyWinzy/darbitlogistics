import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
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
import { FaUsers, FaTruck, FaCheckCircle, FaHourglassHalf, FaBell, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaFileDownload } from 'react-icons/fa';
import { useRef } from 'react';

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

// Spinner component
function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-4">
      <div className="spinner-border" style={{ color: '#1F2120' }} role="status">
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
      // ...add any other user-specific state resets here
    }
  }, [user]);

  const error = deliveriesError || parentBookingsError;

  function generateTrackingId() {
    // Simple unique code: 3 letters + 4 digits
    const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
    const digits = Math.floor(1000 + Math.random() * 9000);
    return letters + digits;
  }

  function validateZimPhone(phone) {
    // Accepts +2637..., 07..., 7... (Zimbabwe mobile)
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
        <h6 className="mb-3 fw-bold" style={{ color: '#1F2120' }}>Audit Log</h6>
        <ul className="list-unstyled">
          {checkpoints.slice().reverse().map((cp, index) => (
            <li key={index} className="checkpoint-item mb-3 border-start border-3 ps-3" style={{ borderColor: '#1F2120' }}>
              <div className="d-flex justify-content-between align-items-center">
                <strong className="text-dark">{cp.location}</strong>
                <span className={`badge ${cp.hasIssue ? 'bg-danger' : 'bg-secondary'}`}>{cp.status}</span>
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
    <div className="container py-5">
      {hasPendingSync && (
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <FaExclamationTriangle className="me-2" />
          <span>
            You have offline deliveries pending sync. They will be sent automatically when you reconnect.
          </span>
        </div>
      )}
      {/* Toast/Snackbar Feedback */}
      {showToast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{zIndex:9999, minWidth: '220px'}} role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header bg-primary text-white">
            <strong className="me-auto">Info</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)} aria-label="Close"></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}
      {/* Summary Widgets Row */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 text-center py-3 position-relative" style={{ background: '#fffbe6' }} title="Currently active loads">
            <FaTruck className="fs-2 mb-2 text-warning" aria-label="Active Loads" />
            <div className="fw-bold fs-4" style={{ color: '#1F2120' }}>{activeLoads}
              <span className="ms-2">{analyticsTrends.total === 1 ? <FaArrowUp className="text-success" title="Up" /> : analyticsTrends.total === -1 ? <FaArrowDown className="text-danger" title="Down" /> : null}</span>
            </div>
            <div className="text-muted small">Active Loads</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 text-center py-3 position-relative" style={{ background: '#e0ffe6' }} title="Loads delivered or completed">
            <FaCheckCircle className="fs-2 mb-2 text-success" aria-label="Completed Loads" />
            <div className="fw-bold fs-4" style={{ color: '#16a34a' }}>{completedLoads}
              <span className="ms-2">{analyticsTrends.completed === 1 ? <FaArrowUp className="text-success" title="Up" /> : analyticsTrends.completed === -1 ? <FaArrowDown className="text-danger" title="Down" /> : null}</span>
            </div>
            <div className="text-muted small">Completed Loads</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 text-center py-3 position-relative" style={{ background: '#fff0e6' }} title="Loads not yet started or pending">
            <FaHourglassHalf className="fs-2 mb-2 text-warning" aria-label="Pending Loads" />
            <div className="fw-bold fs-4" style={{ color: '#d2691e' }}>{pendingLoads}
              <span className="ms-2">{analyticsTrends.pending === 1 ? <FaArrowUp className="text-success" title="Up" /> : analyticsTrends.pending === -1 ? <FaArrowDown className="text-danger" title="Down" /> : null}</span>
            </div>
            <div className="text-muted small">Pending Loads</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 text-center py-3 position-relative" style={{ background: '#e6f0ff' }} title="Unique customers with bookings">
            <FaUsers className="fs-2 mb-2 text-primary" aria-label="Total Customers" />
            <div className="fw-bold fs-4" style={{ color: '#1e40af' }}>{totalCustomers}</div>
            <div className="text-muted small">Total Customers</div>
          </div>
        </div>
      </div>
      {/* Notifications/Alerts Area */}
      {notifications.length > 0 && (
        <div className="mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light d-flex align-items-center">
              <FaBell className="me-2 text-warning" />
              <span className="fw-bold">Notifications</span>
              <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={markAllNotificationsRead} aria-label="Mark all as read">Mark all as read</button>
            </div>
            <ul className="list-group list-group-flush">
              {notifications.map(n => (
                <li key={n.id} className="list-group-item d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <span className="me-3">
                      {n.type === 'warning' ? <FaExclamationTriangle className="text-warning" title="Warning" /> : <FaBell className="text-info" title="Info" />}
                    </span>
                    <span>{n.message}</span>
                    <span className="text-muted small ms-3">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary ms-2" aria-label="Dismiss notification" onClick={() => dismissNotification(n.id)}>&times;</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Analytics Charts */}
      <div className="mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-light fw-bold d-flex align-items-center">
            <span>Dashboard Analytics</span>
            <ul className="nav nav-tabs ms-auto" style={{ borderBottom: 'none' }}>
              <li className="nav-item">
                <button className={`nav-link${activeChartTab === 'bar' ? ' active' : ''}`} onClick={() => setActiveChartTab('bar')} type="button">Bar</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link${activeChartTab === 'pie' ? ' active' : ''}`} onClick={() => setActiveChartTab('pie')} type="button">Pie</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link${activeChartTab === 'line' ? ' active' : ''}`} onClick={() => setActiveChartTab('line')} type="button">Line</button>
              </li>
            </ul>
          </div>
          <div className="card-body">
            {loadingAnalytics ? <Spinner /> : analytics ? (
              <>
                {activeChartTab === 'bar' && (
                  <Bar
                    data={{
                      labels: ['Total', 'Completed', 'Pending'],
                      datasets: [{
                        label: 'Deliveries',
                        data: [analytics.totalDeliveries, analytics.completedDeliveries, analytics.pendingDeliveries],
                        backgroundColor: ['#1e40af', '#16a34a', '#d2691e']
                      }]
                    }}
                    options={{ responsive: true, plugins: { legend: { display: false } } }}
                    height={80}
                  />
                )}
                {activeChartTab === 'pie' && (
                  <Pie
                    data={{
                      labels: ['Completed', 'Pending', 'Other'],
                      datasets: [{
                        label: 'Deliveries by Status',
                        data: [analytics.completedDeliveries, analytics.pendingDeliveries, Math.max(0, (analytics.totalDeliveries - analytics.completedDeliveries - analytics.pendingDeliveries))],
                        backgroundColor: ['#16a34a', '#d2691e', '#1e40af']
                      }]
                    }}
                    options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
                  />
                )}
                {activeChartTab === 'line' && (
                  <Line
                    data={{
                      labels: analytics.monthlyLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                      datasets: [{
                        label: 'Deliveries per Month',
                        data: analytics.monthlyData || Array(12).fill(0),
                        fill: false,
                        borderColor: '#1e40af',
                        backgroundColor: '#1e40af',
                        tension: 0.3
                      }]
                    }}
                    options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                    height={80}
                  />
                )}
              </>
            ) : <div className="text-muted">No analytics data.</div>}
          </div>
        </div>
      </div>
      {/* Strategic Operations Console Banner */}
      <div className="bg-warning text-dark text-center py-1 small fw-bold mb-3" style={{ letterSpacing: '1px', borderRadius: '0.5rem' }}>
        STRATEGIC OPERATIONS CONSOLE
      </div>
      <h1 className="display-6 fw-bold mb-4" style={{ color: '#1F2120' }}>Morres Logistics - Operations Hub</h1>
      
      {/* Trigger button for Parent Booking Modal */}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 fw-bold mb-0" style={{ color: '#1F2120' }}>
              <span className="material-icons-outlined align-middle me-2" style={{ color: '#1F2120' }}>apps</span>
              Dashboard
          </h2>
          <button
              className="btn fw-bold"
              style={{ background: '#1F2120', border: 'none', color: '#EBD3AD', borderRadius: '0.5rem', padding: '0.5rem 1.25rem' }}
              onClick={() => setShowCreateParentBookingModal(true)}
              aria-label="Log new consignment"
          >
              <span className="material-icons-outlined align-middle me-1">add_box</span>
              Log New Consignment
          </button>
      </div>
      
      {/* Parent Booking Form Modal */}
      {showCreateParentBookingModal && (
        <ParentBookingForm
          show={showCreateParentBookingModal}
          onClose={() => setShowCreateParentBookingModal(false)}
          onSuccess={fetchParentBookings}
          createParentBooking={createParentBooking}
          mineralTypes={mineralTypes}
          mineralLocations={mineralLocations}
        />
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

      {/* Modified Create Delivery Form */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h2 className="h5 fw-bold mb-3" style={{ color: '#1F2120' }}>
            <span className="material-icons-outlined align-middle me-2" style={{ color: '#1F2120' }}>add_box</span>
            Dispatch New Load
          </h2>
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
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <ConsignmentMonitor
            parentBookings={parentBookings}
            loading={parentBookingsLoading}
            error={parentBookingsError}
            onSelectDelivery={setSelectedId}
          />
          {/* Highlight selected consignment visually (handled in ConsignmentMonitor if possible) */}
          {/* Pagination Controls for Deliveries */}
          <div className="d-flex justify-content-between align-items-center mt-3">
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
                className="btn fw-bold"
                style={{ background: '#fff', border: '1px solid #1F2120', color: '#1F2120', borderRadius: '0.5rem', padding: '0.5rem 1.25rem' }}
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                &laquo; Prev
              </button>
              <span className="mx-2 align-self-center small">
                Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <button
                className="btn fw-bold"
                style={{ background: '#fff', border: '1px solid #1F2120', color: '#1F2120', borderRadius: '0.5rem', padding: '0.5rem 1.25rem' }}
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total}
                aria-label="Next page"
              >
                Next &raquo;
              </button>
            </div>
            <div className="ms-3">
              <select
                className="form-select form-select-sm"
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
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3" style={{ color: '#1F2120' }}>
                <span className="material-icons-outlined align-middle me-2" style={{ color: '#1F2120' }}>edit_location_alt</span>
                Log Checkpoint
                <span className="ms-2" title="Log the current status and location of a load">
                  <span className="badge bg-info">?</span>
                </span>
              </h2>
              {selectedId && (() => {
                const sel = localDeliveries.find(d => d.trackingId === selectedId);
                if (!sel) return null;
                return (
                  <div className="alert alert-info mb-3 p-2">
                    <div><strong>Tracking ID:</strong> {sel.trackingId}</div>
                    <div><strong>Customer:</strong> {sel.customerName}</div>
                    <div><strong>Phone:</strong> {sel.phoneNumber}</div>
                    <div><strong>Status:</strong> {sel.currentStatus}</div>
                  </div>
                );
              })()}
              <CheckpointLoggerForm
                deliveries={localDeliveries}
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
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Internal Support Contact */}
      <div className="text-center text-muted small mt-5">
        For support: <a href="mailto:info@morres.com" style={{ color: '#1F2120' }}>info@morres.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
      </div>
    </div>
  );
}

// Helper functions for deadline badges
function getDeadlineBadgeClass(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline < 0) return 'bg-danger';
  if (daysUntilDeadline <= 3) return 'bg-warning text-dark';
  return 'bg-success';
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