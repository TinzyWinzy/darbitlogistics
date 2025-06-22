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

const mineralTypes = [
  'Agate', 'Adamite', 'Andalusite', 'Anhydrite', 'Angelisite', 'Anthophyllite', 'Antimony', 'Aragonite', 'Arucite', 'Arsenic',
  'Bauxite', 'Beryl', 'Bismuth', 'Bornite', 'Calcite', 'Chalcocite', 'Chalcopyrite', 'Chromite', 'Coal', 'Cobalt', 'Copper',
  'Copper Ore', 'Corundum', 'Diamond', 'Dolomite', 'Fireclay', 'Galena', 'Gold', 'Gold Ore', 'Graphite', 'Gypsum', 'Hematite',
  'Iron Ore', 'Jasper', 'Kaolinite Clay', 'Kyanite', 'Lead', 'Lepidolite', 'Limestone', 'Limonite Clay', 'Magnesite', 'Manganese',
  'Marble', 'Mercury', 'Molybdenum', 'Monazite', 'Mtorolite', 'Muscovite', 'Nickel', 'Orthoclase', 'PGMs', 'Phosphate', 'Phyllite',
  'Platinum', 'Pollucite', 'Pyrite', 'Quartz', 'Rutile', 'Scheelite', 'Schorl', 'Serpentine', 'Sillimanite', 'Silver', 'Slates',
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
      <div className="spinner-border" style={{ color: '#D2691E' }} role="status">
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
    setDeliveries
  } = useDeliveries();
  
  const { 
    parentBookings, 
    loading: parentBookingsLoading, 
    error: parentBookingsError, 
    createParentBooking,
    fetchParentBookings
  } = useParentBookings();

  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    location: '',
    operator: '',
    comment: '',
    status: '',
    coordinates: '',
    timestamp: new Date(),
    hasIssue: false,
    issueDetails: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
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
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');
  const navigate = useNavigate();
  const { setUser, user } = useContext(AuthContext);
  const customerNameRef = useRef();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [smsPreview, setSmsPreview] = useState('');
  
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [parentForm, setParentForm] = useState({
    customerName: '',
    phoneNumber: '',
    totalTonnage: '',
    mineral_type: 'Other',
    mineral_grade: 'Ungraded',
    moisture_content: '',
    particle_size: '',
    loadingPoint: '',
    destination: '',
    deadline: null,
    requires_analysis: false,
    special_handling_notes: '',
    environmental_concerns: '',
    notes: ''
  });
  const [selectedParentBooking, setSelectedParentBooking] = useState(null);
  const [showParentDetails, setShowParentDetails] = useState(false);
  const [showCreateParentBookingModal, setShowCreateParentBookingModal] = useState(false);
  const [suggestedLocations, setSuggestedLocations] = useState([]);

  const [deliveries, setLocalDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleParentFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setParentForm(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // When mineral type changes, update suggestions
      if (name === 'mineral_type') {
        const locations = mineralLocations[value] || [];
        setSuggestedLocations(locations);
        // Optional: auto-select the first location
        if (locations.length > 0) {
          newState.loadingPoint = locations[0];
        } else {
          newState.loadingPoint = '';
        }
      }
      
      return newState;
    });
  };

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
      setForm(prevForm => ({ ...prevForm, operator: user.username }));
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

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateFeedback('');

    try {
      if (!createForm.customerId) {
        setCreateFeedback('Please select a customer.');
        setCreating(false);
        return;
      }

      if (!createForm.selectedBookingId) {
        setCreateFeedback('Please select a booking.');
        setCreating(false);
        return;
      }

      const selectedBooking = parentBookings.find(b => b.id === createForm.selectedBookingId);
      
      if (!selectedBooking) {
        setCreateFeedback('Invalid booking selection.');
        setCreating(false);
        return;
      }

      if (!createForm.tonnage || createForm.tonnage <= 0) {
        setCreateFeedback('Tonnage must be greater than 0.');
        setCreating(false);
        return;
      }

      if (selectedBooking.remainingTonnage < createForm.tonnage) {
        setCreateFeedback(`Insufficient remaining tonnage. Available: ${selectedBooking.remainingTonnage} tons`);
        setCreating(false);
        return;
      }

      if (!createForm.containerCount || createForm.containerCount < 1) {
        setCreateFeedback('Container Count must be at least 1.');
        setCreating(false);
        return;
      }

      if (!createForm.driverDetails.name?.trim()) {
        setCreateFeedback('Driver Name is required.');
        setCreating(false);
        return;
      }

      if (!createForm.driverDetails.vehicleReg?.trim()) {
        setCreateFeedback('Vehicle Registration is required.');
        setCreating(false);
        return;
      }

      const deliveryData = {
        parent_booking_id: selectedBooking.id,
        customer_name: selectedBooking.customerName,
        phone_number: selectedBooking.phoneNumber,
        current_status: createForm.currentStatus || 'Pending',
        loading_point: selectedBooking.loadingPoint,
        destination: selectedBooking.destination,
        mineral_type: selectedBooking.mineral_type,
        mineral_grade: selectedBooking.mineral_grade,
        container_count: parseInt(createForm.containerCount),
        tonnage: parseFloat(createForm.tonnage),
        vehicle_type: createForm.vehicleType || 'Standard Truck',
        vehicle_capacity: parseFloat(createForm.vehicleCapacity) || 30.00,
        driver_details: {
          name: createForm.driverDetails.name.trim(),
          vehicleReg: createForm.driverDetails.vehicleReg.trim()
        },
        environmental_incidents: createForm.environmentalIncidents || null,
        sampling_status: createForm.samplingStatus || 'Not Sampled'
      };

      const res = await createDelivery(deliveryData);

      if (res.success) {
        setShowToast(true);
        setToastMsg(`Delivery created successfully! Tracking ID: ${res.trackingId}`);
        
        // Add new delivery to local state to trigger UI update
        const newDelivery = res.delivery;
        setLocalDeliveries(prev => [newDelivery, ...prev]);
        
        // Reset form
        setCreateForm({
          customerId: '',
          selectedBookingId: '',
          currentStatus: '',
          containerCount: '',
          tonnage: '',
          vehicleType: 'Standard Truck',
          vehicleCapacity: 30.00,
          driverDetails: {
            name: '',
            vehicleReg: ''
          },
          loadingPoint: '',
          destination: '',
          environmentalIncidents: '',
          samplingStatus: ''
        });

        // Refresh parent bookings to update remaining tonnage
        await fetchParentBookings();
      }
    } catch (error) {
      console.error('Create delivery error:', error);
      setCreateFeedback(error.response?.data?.error || 'Failed to create delivery');
    }
    setCreating(false);
  };

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
      
      setForm({
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

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback('');
    
    const delivery = deliveries.find(d => d.trackingId === selectedId);
    if (!delivery) {
      setFeedback('No delivery selected.');
      return;
    }

    if (!form.location || !form.status) {
      setFeedback('Location and Status are required.');
      return;
    }

    const checkpoint = {
      location: form.location.trim(),
      status: form.status,
      operator_id: user.id,
      operator_username: user.username,
      comment: form.comment.trim(),
      timestamp: form.timestamp.toISOString(),
      coordinates: form.coordinates.trim(),
      hasIssue: form.hasIssue,
      issueDetails: form.hasIssue ? form.issueDetails.trim() : ''
    };

    await handleUpdateCheckpoint(selectedId, checkpoint);
  }

  const handleCreateParentBooking = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateFeedback('');

    try {
      // Format phone number first
      let formattedPhone = parentForm.phoneNumber;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '263' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('7')) {
        formattedPhone = '263' + formattedPhone;
      }

      // Validate required fields
      if (!parentForm.customerName?.trim()) {
        setCreateFeedback('Customer Name is required.');
        setCreating(false);
        return;
      }

      if (!formattedPhone) {
        setCreateFeedback('Phone Number is required.');
        setCreating(false);
        return;
      }

      if (!validateZimPhone(formattedPhone)) {
        setCreateFeedback('Please enter a valid Zimbabwean phone number.');
        setCreating(false);
        return;
      }

      if (!parentForm.totalTonnage || parentForm.totalTonnage <= 0) {
        setCreateFeedback('Total tonnage must be greater than 0.');
        setCreating(false);
        return;
      }

      if (!parentForm.loadingPoint?.trim()) {
        setCreateFeedback('Loading Point is required.');
        setCreating(false);
        return;
      }

      if (!parentForm.destination?.trim()) {
        setCreateFeedback('Destination is required.');
        setCreating(false);
        return;
      }

      if (!parentForm.deadline) {
        setCreateFeedback('Deadline is required.');
        setCreating(false);
        return;
      }

      const deadline = new Date(parentForm.deadline);
      if (deadline <= new Date()) {
        setCreateFeedback('Deadline must be in the future.');
        setCreating(false);
        return;
      }

      // Validate mineral type
      if (!parentForm.mineral_type?.trim()) {
        setCreateFeedback('Mineral Type is required.');
        setCreating(false);
        return;
      }

      const parentBookingData = {
        customer_name: parentForm.customerName.trim(),
        phone_number: formattedPhone,
        total_tonnage: parseFloat(parentForm.totalTonnage),
        mineral_type: parentForm.mineral_type.trim(),
        mineral_grade: parentForm.mineral_grade?.trim() || 'Ungraded',
        moisture_content: parentForm.moisture_content ? parseFloat(parentForm.moisture_content) : null,
        particle_size: parentForm.particle_size?.trim() || null,
        loading_point: parentForm.loadingPoint.trim(),
        destination: parentForm.destination.trim(),
        deadline: deadline.toISOString(),
        requires_analysis: Boolean(parentForm.requires_analysis),
        special_handling_notes: parentForm.special_handling_notes?.trim() || null,
        environmental_concerns: parentForm.environmental_concerns?.trim() || null,
        notes: parentForm.notes?.trim() || null
      };

      console.log('Sending parent booking data:', parentBookingData);

      const res = await createParentBooking(parentBookingData);
      
      if (res.success) {
        setShowToast(true);
        setToastMsg(`Consignment logged successfully! Booking Code: ${res.booking.booking_code}`);
        setShowCreateParentBookingModal(false);
        
        // Reset form
        setParentForm({
          customerName: '',
          phoneNumber: '',
          totalTonnage: '',
          mineral_type: 'Other',
          mineral_grade: 'Ungraded',
          moisture_content: '',
          particle_size: '',
          loadingPoint: '',
          destination: '',
          deadline: null,
          requires_analysis: false,
          special_handling_notes: '',
          environmental_concerns: '',
          notes: ''
        });

        // The hook already refreshes the list, no need to do it here.
      }
    } catch (error) {
      console.error('Create parent booking error:', error);
      setCreateFeedback(error.response?.data?.error || 'Failed to create parent booking');
    }
    setCreating(false);
  };

  // Function to generate a unique booking code
  const generateBookingCode = () => {
    const prefix = 'MB'; // MB for Morres Booking
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  // Function to fetch unique customers from parent bookings
  const updateCustomersList = (bookings) => {
    const uniqueCustomers = bookings.reduce((acc, booking) => {
      if (!acc.find(c => c.name === booking.customerName)) {
        acc.push({
          id: booking.id,
          name: booking.customerName,
          phone: booking.phoneNumber
        });
      }
      return acc;
    }, []);
    setCustomers(uniqueCustomers);
  };

  // Update customer bookings when a customer is selected
  const handleCustomerSelect = (customerId) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) {
      setSelectedCustomerBookings([]);
      setCreateForm(prev => ({
        ...prev,
        customerId: '',
        selectedBookingId: '',
        tonnage: '',
        containerCount: '',
        vehicleType: 'Standard Truck',
        vehicleCapacity: 30.00,
        loadingPoint: '',
        destination: '',
        environmentalIncidents: '',
        samplingStatus: ''
      }));
      return;
    }

    const customerBookings = parentBookings.filter(
      booking => 
        booking.customerName === selectedCustomer.name && 
        booking.status === 'Active' &&
        booking.remainingTonnage > 0
    );

    setSelectedCustomerBookings(customerBookings);
    setCreateForm(prev => ({
      ...prev,
      customerId,
      selectedBookingId: '',
      tonnage: '',
      containerCount: '',
      vehicleType: 'Standard Truck',
      vehicleCapacity: 30.00,
      driverDetails: {
        name: '',
        vehicleReg: ''
      },
      loadingPoint: '',
      destination: '',
      environmentalIncidents: '',
      samplingStatus: ''
    }));
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
        <h6 className="mb-3 fw-bold" style={{ color: '#a14e13' }}>Audit Log</h6>
        <ul className="list-unstyled">
          {checkpoints.slice().reverse().map((cp, index) => (
            <li key={index} className="checkpoint-item mb-3 border-start border-3 ps-3" style={{ borderColor: '#D2691E' }}>
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

  return (
    <div className="container py-5">
      <h1 className="display-6 fw-bold mb-4" style={{ color: '#D2691E' }}>Morres Logistics - Operations Hub</h1>
      
      {/* Trigger button for Parent Booking Modal */}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 fw-bold mb-0" style={{ color: '#a14e13' }}>
              <span className="material-icons-outlined align-middle me-2" style={{ color: '#D2691E' }}>apps</span>
              Dashboard
          </h2>
          <button
              className="btn btn-primary fw-bold"
              style={{ background: '#D2691E', border: 'none' }}
              onClick={() => setShowCreateParentBookingModal(true)}
          >
              <span className="material-icons-outlined align-middle me-1">add_box</span>
              Log New Consignment
          </button>
      </div>
      
      {/* Parent Booking Form Modal */}
      {showCreateParentBookingModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="h5 fw-bold mb-0" style={{ color: '#a14e13' }}>
            <span className="material-icons-outlined align-middle me-2" style={{ color: '#D2691E' }}>add_box</span>
            Log New Consignment
          </h2>
                  <button type="button" className="btn-close" onClick={() => setShowCreateParentBookingModal(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleCreateParentBooking} className="row g-3" autoComplete="off">
                    <div className="col-md-6">
                      <label className="form-label">Customer Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="customerName"
                        placeholder="e.g., John Doe"
                        value={parentForm.customerName}
                        onChange={handleParentFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phoneNumber"
                        placeholder="e.g., 0772123456"
                        value={parentForm.phoneNumber}
                        onChange={handleParentFormChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Mineral Type</label>
                      <select
                        className="form-select"
                        name="mineral_type"
                        value={parentForm.mineral_type}
                        onChange={handleParentFormChange}
                        required
                      >
                        {mineralTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Mineral Grade</label>
                      <select
                        className="form-select"
                        name="mineral_grade"
                        value={parentForm.mineral_grade}
                        onChange={handleParentFormChange}
                      >
                        <option value="Ungraded">Ungraded</option>
                        <option value="Premium">Premium</option>
                        <option value="Standard">Standard</option>
                        <option value="Low Grade">Low Grade</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Total Tonnage</label>
                      <input
                        type="number"
                        className="form-control"
                        name="totalTonnage"
                        placeholder="e.g., 1000"
                        value={parentForm.totalTonnage}
                        onChange={handleParentFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Moisture Content (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="moisture_content"
                        placeholder="e.g., 12.5"
                        value={parentForm.moisture_content}
                        onChange={handleParentFormChange}
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Particle Size</label>
                      <input
                        type="text"
                        className="form-control"
                        name="particle_size"
                        placeholder="e.g., 10-50mm"
                        value={parentForm.particle_size}
                        onChange={handleParentFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Deadline</label>
                      <DatePicker
                        selected={parentForm.deadline}
                        onChange={date => setParentForm(prev => ({ ...prev, deadline: date }))}
                        className="form-control"
                        showTimeSelect
                        dateFormat="Pp"
                        placeholderText="Select deadline"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Loading Point</label>
                      <input
                        type="text"
                        className="form-control"
                        name="loadingPoint"
                        placeholder="e.g., Zimplats Mine"
                        value={parentForm.loadingPoint}
                        onChange={handleParentFormChange}
                        required
                        list="loading-point-suggestions"
                      />
                      <datalist id="loading-point-suggestions">
                        {suggestedLocations.map(loc => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Destination</label>
                      <input
                        type="text"
                        className="form-control"
                        name="destination"
                        placeholder="e.g., Durban Port"
                        value={parentForm.destination}
                        onChange={handleParentFormChange}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Special Handling Notes</label>
                      <textarea
                        className="form-control"
                        name="special_handling_notes"
                        placeholder="e.g., Fragile, keep dry"
                        value={parentForm.special_handling_notes}
                        onChange={handleParentFormChange}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Environmental Concerns</label>
                      <textarea
                        className="form-control"
                        name="environmental_concerns"
                        placeholder="e.g., Low dust emission required"
                        value={parentForm.environmental_concerns}
                        onChange={handleParentFormChange}
                      />
                    </div>
                    
                    <div className="col-12">
                      <label className="form-label">Other Notes</label>
                      <textarea
                        className="form-control"
                        name="notes"
                        placeholder="e.g., Call upon arrival"
                        value={parentForm.notes}
                        onChange={handleParentFormChange}
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="requires_analysis"
                          name="requires_analysis"
                          checked={parentForm.requires_analysis}
                          onChange={handleParentFormChange}
                        />
                        <label className="form-check-label" htmlFor="requires_analysis">Requires Analysis</label>
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary fw-bold w-100"
                        style={{ background: '#D2691E', border: 'none' }}
                        disabled={creating}
                      >
                        {creating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creating...
                          </>
                        ) : 'Log Consignment'}
                      </button>
                    </div>
                  </form>
                  {createFeedback && (
                    <div className={`mt-3 alert ${createFeedback.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                      {createFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setShowCreateParentBookingModal(false)}></div>
        </>
      )}

      {/* Parent Booking Details Modal */}
      {showParentDetails && selectedParentBooking && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
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
          <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
            <span className="material-icons-outlined align-middle me-2" style={{ color: '#D2691E' }}>add_box</span>
            Dispatch New Load
          </h2>
          <form onSubmit={handleCreateDelivery} className="row g-3 align-items-end" autoComplete="off">
            <div className="col-md-4">
              <label className="form-label">Select Customer *</label>
              <select 
                className="form-select"
                value={createForm.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                disabled={creating}
                required
              >
                <option value="">Choose customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Select Consignment *</label>
              <select 
                className="form-select"
                value={createForm.selectedBookingId}
                onChange={(e) => handleBookingSelect(e.target.value)}
                disabled={creating || !createForm.customerId}
                required
              >
                <option value="">Choose consignment...</option>
                {selectedCustomerBookings.map(booking => (
                  <option key={booking.id} value={booking.id}>
                    {booking.bookingCode} - {booking.mineral_type} ({booking.mineral_grade}) - {booking.remainingTonnage} tons available
                  </option>
                ))}
              </select>
            </div>

            {createForm.selectedBookingId && (
              <div className="col-12 mt-2 mb-2">
                <div className="alert alert-light p-2" style={{ borderLeft: '3px solid #D2691E' }}>
                  <small className="text-muted d-block">
                    <strong>Route:</strong> {createForm.loadingPoint} &rarr; {createForm.destination}
                  </small>
                </div>
              </div>
            )}

            <div className="col-md-4">
              <label className="form-label">Container Count *</label>
              <input 
                type="number" 
                className="form-control" 
                required 
                min="1"
                value={createForm.containerCount}
                onChange={e => setCreateForm(prev => ({ ...prev, containerCount: e.target.value }))}
                disabled={creating || !createForm.selectedBookingId}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Tonnage *</label>
              <input 
                type="number" 
                className="form-control" 
                required 
                min="0.01"
                step="0.01"
                value={createForm.tonnage}
                onChange={e => setCreateForm(prev => ({ ...prev, tonnage: e.target.value }))}
                disabled={creating || !createForm.selectedBookingId}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Driver Name *</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={createForm.driverDetails.name}
                onChange={e => setCreateForm(prev => ({
                  ...prev,
                  driverDetails: { ...prev.driverDetails, name: e.target.value }
                }))}
                disabled={creating || !createForm.selectedBookingId}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Vehicle Registration *</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={createForm.driverDetails.vehicleReg}
                onChange={e => setCreateForm(prev => ({
                  ...prev,
                  driverDetails: { ...prev.driverDetails, vehicleReg: e.target.value }
                }))}
                disabled={creating || !createForm.selectedBookingId}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Initial Status</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g., Pending"
                value={createForm.currentStatus}
                onChange={e => setCreateForm(prev => ({ ...prev, currentStatus: e.target.value }))}
                disabled={creating || !createForm.selectedBookingId}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Environmental Incidents</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Enter any environmental incidents"
                value={createForm.environmentalIncidents}
                onChange={e => setCreateForm(prev => ({ ...prev, environmentalIncidents: e.target.value }))}
                disabled={creating || !createForm.selectedBookingId}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Sampling Status</label>
              <select
                className="form-select"
                value={createForm.samplingStatus}
                onChange={e => setCreateForm(prev => ({ ...prev, samplingStatus: e.target.value }))}
                disabled={creating || !createForm.selectedBookingId}
              >
                <option value="">Select status...</option>
                <option value="Not Sampled">Not Sampled</option>
                <option value="Sampled">Sampled</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="col-12">
              <button 
                type="submit" 
                className="btn btn-primary fw-bold" 
                style={{ background: '#D2691E', border: 'none' }} 
                disabled={creating || !createForm.selectedBookingId}
              >
                {creating ? 'Creating...' : 'Dispatch Load'}
              </button>
            </div>
          </form>
          {createFeedback && (
            <div className={`mt-3 alert ${createFeedback.includes('success') ? 'alert-success' : 'alert-danger'}`}>
              {createFeedback}
            </div>
          )}
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
          />
        </div>
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
                <span className="material-icons-outlined align-middle me-2" style={{ color: '#D2691E' }}>edit_location_alt</span>
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
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.location}
                    onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div className="col-md-6">
                  <div className="form-floating mb-3">
                    <input 
                      type="text" 
                      className="form-control" 
                      id="operator" 
                      name="operator" 
                      value={form.operator}
                      readOnly
                      onChange={(e) => setForm({ ...form, operator: e.target.value })} 
                    />
                    <label htmlFor="operator" className="form-label">Operator</label>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    required
                    disabled={submitting}
                  >
                    <option value="">Select status...</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">GPS Coordinates</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.coordinates}
                    onChange={e => setForm(prev => ({ ...prev, coordinates: e.target.value }))}
                    placeholder="e.g., -17.824858, 31.053028"
                    disabled={submitting}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Comments</label>
                  <textarea
                    className="form-control"
                    value={form.comment}
                    onChange={e => setForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows="2"
                    disabled={submitting}
                  />
                </div>

                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="hasIssue"
                      checked={form.hasIssue}
                      onChange={e => setForm(prev => ({ ...prev, hasIssue: e.target.checked }))}
                      disabled={submitting}
                    />
                    <label className="form-check-label" htmlFor="hasIssue">
                      Report an issue at this checkpoint
                    </label>
                  </div>
                </div>

                {form.hasIssue && (
                  <div className="col-12">
                    <label className="form-label">Issue Details *</label>
                    <textarea
                      className="form-control"
                      value={form.issueDetails}
                      onChange={e => setForm(prev => ({ ...prev, issueDetails: e.target.value }))}
                      rows="2"
                      required
                      disabled={submitting}
                    />
                  </div>
                )}

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ background: '#D2691E', border: 'none' }}
                  >
                    {submitting ? 'Updating...' : 'Log Checkpoint'}
                  </button>
                </div>

                {feedback && (
                  <div className={`col-12 alert ${feedback.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                    {feedback}
                  </div>
                )}
              </form>

              {selectedId && deliveries.find(d => d.trackingId === selectedId) && (
                <div className="mt-4">
                  {renderCheckpointHistory(deliveries.find(d => d.trackingId === selectedId))}
                </div>
              )}
            </div>
          </div>
        </div>
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