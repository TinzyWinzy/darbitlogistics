import { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { deliveryApi } from '../services/api';
import { useDeliveries } from '../services/useDeliveries';
import { useParentBookings } from '../services/useParentBookings';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import ParentBookingDetails from './ParentBookingDetails';
import ConsignmentMonitor from './ConsignmentMonitor';
import ParentBookingForm from './ParentBookingForm';
import DeliveryDispatchForm from './DeliveryDispatchForm';
import CheckpointLoggerForm from './CheckpointLoggerForm';

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
    fetchDeliveries
  } = useDeliveries();
  
  const { 
    parentBookings, 
    loading: parentBookingsLoading, 
    error: parentBookingsError, 
    createParentBooking,
    fetchParentBookings,
    page: parentBookingsPage,
    setPage: setParentBookingsPage,
    pageSize: parentBookingsPageSize,
    setPageSize: setParentBookingsPageSize,
    total: parentBookingsTotal
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
  const customerNameRef = useRef();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [smsPreview, setSmsPreview] = useState('');
  
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedParentBooking, setSelectedParentBooking] = useState(null);
  const [showParentDetails, setShowParentDetails] = useState(false);
  const [showCreateParentBookingModal, setShowCreateParentBookingModal] = useState(false);

  const [deliveries, setLocalDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');

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
    setLoading(loadingDeliveries);
  }, [loadingDeliveries]);

  useEffect(() => {
    if (user) {
      setCreateForm(prevForm => ({ ...prevForm, operator: user.username }));
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
    const delivery = deliveries.find(d => d.trackingId === trackingId);
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

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/logout`, {}, { withCredentials: true });
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
      setFeedback('Logout failed');
    }
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

  return (
    <div className="container py-5">
      {/* Internal Use Only Banner */}
      <div className="bg-warning text-dark text-center py-1 small fw-bold mb-3" style={{ letterSpacing: '1px', borderRadius: '0.5rem' }}>
        INTERNAL USE ONLY
      </div>
      <h1 className="display-6 fw-bold mb-4" style={{ color: '#1F2120' }}>Morres Logistics - Operations Hub</h1>
      
      {/* Trigger button for Parent Booking Modal */}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 fw-bold mb-0" style={{ color: '#1F2120' }}>
              <span className="material-icons-outlined align-middle me-2" style={{ color: '#1F2120' }}>apps</span>
              Dashboard
          </h2>
          <button
              className="btn btn-primary fw-bold"
              style={{ background: '#1F2120', border: 'none', color: '#EBD3AD' }}
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
            selectedCustomerId={selectedCustomerId}
            selectedCustomerBookings={selectedCustomerBookings}
            onCustomerSelect={handleCustomerSelect}
            createDelivery={createDelivery}
            fetchParentBookings={fetchParentBookings}
            onSuccess={async () => {
              await fetchParentBookings();
              await fetchDeliveries();
            }}
            onFeedback={setFeedback}
            onReset={handleFormReset}
          />
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <ConsignmentMonitor
            parentBookings={parentBookings}
            deliveries={deliveries}
            loading={loading}
            error={error}
            selectedId={selectedId}
            onSelectDelivery={(id) => setSelectedId(selectedId === id ? null : id)}
            page={parentBookingsPage}
            setPage={setParentBookingsPage}
            pageSize={parentBookingsPageSize}
            setPageSize={setParentBookingsPageSize}
            total={parentBookingsTotal}
          />
          {/* Pagination Controls for Deliveries */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="small text-muted">
              {parentBookingsTotal > 0 && (
                <span>
                  Showing {Math.min((parentBookingsPage - 1) * parentBookingsPageSize + 1, parentBookingsTotal)}-
                  {Math.min(parentBookingsPage * parentBookingsPageSize, parentBookingsTotal)} of {parentBookingsTotal} deliveries
                </span>
              )}
            </div>
            <div className="btn-group" role="group" aria-label="Pagination controls">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setParentBookingsPage(parentBookingsPage - 1)}
                disabled={parentBookingsPage === 1}
                aria-label="Previous page"
              >
                &laquo; Prev
              </button>
              <span className="mx-2 align-self-center small">
                Page {parentBookingsPage} of {Math.max(1, Math.ceil(parentBookingsTotal / parentBookingsPageSize))}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setParentBookingsPage(parentBookingsPage + 1)}
                disabled={parentBookingsPage * parentBookingsPageSize >= parentBookingsTotal}
                aria-label="Next page"
              >
                Next &raquo;
              </button>
            </div>
            <div className="ms-3">
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', display: 'inline-block' }}
                value={parentBookingsPageSize}
                onChange={e => {
                  setParentBookingsPageSize(Number(e.target.value));
                  setParentBookingsPage(1);
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
              </h2>
              {selectedId && (() => {
                const sel = deliveries.find(d => d.trackingId === selectedId);
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
                deliveries={deliveries}
                user={user}
                onSubmitCheckpoint={handleUpdateCheckpoint}
                onSuccess={async () => {
                  await fetchParentBookings();
                  await fetchDeliveries();
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