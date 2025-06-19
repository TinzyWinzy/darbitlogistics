import { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { deliveryApi } from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

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
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [search, setSearch] = useState('');
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
    vehicleCapacity: 30.00
  });
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');
  const navigate = useNavigate();
  const { setIsAuthenticated, isAuthenticated } = useContext(AuthContext);
  const customerNameRef = useRef();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [smsPreview, setSmsPreview] = useState('');
  const [parentBookings, setParentBookings] = useState([]);
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
  const [progressFilter, setProgressFilter] = useState('all');
  const [progressSort, setProgressSort] = useState('deadline');
  const [progressSortOrder, setProgressSortOrder] = useState('asc');
  const [selectedParentBooking, setSelectedParentBooking] = useState(null);
  const [showParentDetails, setShowParentDetails] = useState(false);

  // Add toCamel utility function at the top level
  const toCamel = d => ({
    trackingId: d.tracking_id,
    customerName: d.customer_name,
    phoneNumber: d.phone_number,
    currentStatus: d.current_status,
    checkpoints: d.checkpoints,
    driverDetails: d.driver_details,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    bookingReference: d.booking_reference,
    loadingPoint: d.loading_point,
    destination: d.destination,
    vehicleType: d.vehicle_type,
    vehicleCapacity: d.vehicle_capacity,
    tonnage: d.tonnage,
    containerCount: d.container_count,
    parentBookingId: d.parent_booking_id,
    isCompleted: d.is_completed,
    completionDate: d.completion_date,
    hasWeighbridgeCert: d.has_weighbridge_cert,
    weighbridgeRef: d.weighbridge_ref,
    tareWeight: d.tare_weight,
    netWeight: d.net_weight,
    samplingRequired: d.sampling_required,
    samplingStatus: d.sampling_status,
    environmentalIncident: d.environmental_incident,
    incidentDetails: d.incident_details,
    mineral_type: d.mineral_type,
    mineral_grade: d.mineral_grade
  });

  const parentBookingToCamel = d => ({
    id: d.parent_booking_id,
    customerName: d.customer_name,
    phoneNumber: d.phone_number,
    totalTonnage: d.total_tonnage,
    mineral_type: d.mineral_type,
    mineral_grade: d.mineral_grade,
    loadingPoint: d.loading_point,
    destination: d.destination,
    deadline: d.deadline,
    bookingCode: d.booking_code,
    status: d.status,
    remainingTonnage: d.remaining_tonnage,
    completionPercentage: d.completion_percentage,
    completedTonnage: d.completed_tonnage,
    totalDeliveries: d.total_deliveries,
    completedDeliveries: d.completed_deliveries,
    notes: d.notes,
  });

  // Add fetchDeliveries function
  const fetchDeliveries = async () => {
    try {
      const data = await deliveryApi.getAll();
      setDeliveries(data.map(toCamel));
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.response?.data?.error || 'Failed to fetch deliveries');
      setDeliveries([]);
      throw error;
    }
  };

  // Add fetchParentBookings function
  const fetchParentBookings = async () => {
    try {
      const data = await deliveryApi.getAllParentBookings();
      const camelCaseData = data.map(parentBookingToCamel);
      setParentBookings(camelCaseData);
      updateCustomersList(camelCaseData);
    } catch (error) {
      console.error('Failed to fetch parent bookings:', error);
      setError(error.response?.data?.error || 'Failed to fetch parent bookings');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        setLoading(true);
        setError(null);
        try {
          await Promise.all([
            fetchDeliveries(),
            fetchParentBookings()
          ]);
        } catch (error) {
          console.error('Error fetching data:', error);
          setError(error.response?.data?.error || 'Failed to fetch data');
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    };

    fetchData();
  }, [navigate, isAuthenticated, setIsAuthenticated]);

  const filteredDeliveries = deliveries
    .filter(d => d.trackingId) // Only include deliveries with a valid trackingId
    .filter(d => {
      const q = search.toLowerCase();
      return (
        d.customerName.toLowerCase().includes(q) ||
        d.trackingId.toLowerCase().includes(q) ||
        d.bookingReference.toLowerCase().includes(q) ||
        d.mineral_type.toLowerCase().includes(q) ||
        d.mineral_grade.toLowerCase().includes(q) ||
        d.destination.toLowerCase().includes(q) ||
        (d.currentStatus || '').toLowerCase().includes(q)
      );
    });

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
        parentBookingId: selectedBooking.id,
        customerName: selectedBooking.customerName,
        phoneNumber: selectedBooking.phoneNumber,
        currentStatus: createForm.currentStatus || 'Pending',
        loadingPoint: selectedBooking.loadingPoint,
        destination: selectedBooking.destination,
        mineral_type: selectedBooking.mineral_type,
        mineral_grade: selectedBooking.mineral_grade,
        containerCount: parseInt(createForm.containerCount),
        tonnage: parseFloat(createForm.tonnage),
        vehicleType: createForm.vehicleType || 'Standard Truck',
        vehicleCapacity: parseFloat(createForm.vehicleCapacity) || 30.00,
        driverDetails: {
          name: createForm.driverDetails.name.trim(),
          vehicleReg: createForm.driverDetails.vehicleReg.trim()
        }
      };

      const res = await deliveryApi.create(deliveryData);

      if (res.success) {
        setShowToast(true);
        setToastMsg(`Delivery created successfully! Tracking ID: ${res.trackingId}`);
        
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
          }
        });

        // Refresh data
        const [deliveriesData, bookingsData] = await Promise.all([
          deliveryApi.getAll(),
          deliveryApi.getAllParentBookings()
        ]);
        setDeliveries(deliveriesData.map(toCamel));
        const camelCaseBookings = bookingsData.map(parentBookingToCamel);
        setParentBookings(camelCaseBookings);
        updateCustomersList(camelCaseBookings);
      }
    } catch (error) {
      console.error('Create delivery error:', error);
      setCreateFeedback(error.response?.data?.error || 'Failed to create delivery');
    }
    setCreating(false);
  };

  const handleUpdateCheckpoint = async (trackingId, newCheckpoint, currentStatus) => {
    if (!trackingId || !newCheckpoint || !currentStatus) {
      setFeedback('All fields are required.');
      return;
    }

    const delivery = deliveries.find(d => d.trackingId === trackingId);
    if (!delivery) {
      setFeedback('Could not find the delivery to update.');
      return;
    }

    if (delivery.isCompleted && currentStatus !== 'Cancelled') {
      setFeedback('Cannot update completed delivery unless cancelling.');
      return;
    }
    
    // Create the full new checkpoint object
    const updatedCheckpoint = {
      ...newCheckpoint,
      timestamp: newCheckpoint.timestamp.toISOString(),
      coordinates: newCheckpoint.coordinates || null,
      hasIssue: newCheckpoint.hasIssue || false,
      issueDetails: newCheckpoint.hasIssue ? newCheckpoint.issueDetails : ''
    };

    // Combine old and new checkpoints
    const updatedCheckpoints = [...(delivery.checkpoints || []), updatedCheckpoint];

    try {
      setSubmitting(true);
      await deliveryApi.updateCheckpoint(trackingId, updatedCheckpoints, currentStatus);

      // Refresh deliveries
      const data = await deliveryApi.getAll();
      setDeliveries(data.map(toCamel));
      setFeedback('Checkpoint updated successfully!');
      
      // Send SMS notification
      if (delivery.currentStatus !== currentStatus) {
        const message = `Delivery ${trackingId} status updated to: ${currentStatus}. Location: ${newCheckpoint.location}`;
        try {
          await deliveryApi.sendInitialSms(delivery.phoneNumber, message);
        } catch (error) {
          console.error('Failed to send status update SMS:', error);
        }
      }
    } catch (error) {
      setFeedback(error.response?.data?.error || 'Failed to update checkpoint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await deliveryApi.logout();
    } catch {}
    navigate('/login');
  };

  const handleSendInitialSMS = async (trackingId, phone, status) => {
    setShowSmsPreview(false);
    setShowToast(true);
    setToastMsg('Sending SMS notification...');
    const message = `Welcome! Your delivery is created. Tracking ID: ${trackingId}. Status: ${status}`;
    try {
      await deliveryApi.sendInitialSms(phone, message);
      setToastMsg('SMS notification sent successfully!');
    } catch (error) {
      setToastMsg('SMS notification failed. You can try resending later.');
      console.error('SMS send error:', error);
    }
    setTimeout(() => setShowToast(false), 2500);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    
    const delivery = deliveries.find(d => d.trackingId === selectedId);
    if (!delivery) {
      setFeedback('No delivery selected.');
      setSubmitting(false);
      return;
    }

    if (!form.location || !form.operator || !form.status) {
      setFeedback('Location, Operator, and Status are required.');
      setSubmitting(false);
      return;
    }

    const checkpoint = {
      location: form.location.trim(),
      operator: form.operator.trim(),
      comment: form.comment.trim(),
      timestamp: form.timestamp,
      coordinates: form.coordinates.trim(),
      hasIssue: form.hasIssue,
      issueDetails: form.hasIssue ? form.issueDetails.trim() : ''
    };

    try {
      await handleUpdateCheckpoint(selectedId, checkpoint, form.status);
      // Reset form
      setForm({
        location: '',
        operator: '',
        comment: '',
        status: '',
        coordinates: '',
        timestamp: new Date(),
        hasIssue: false,
        issueDetails: ''
      });
      setSelectedId('');
    } catch (err) {
      setFeedback('Network error: ' + err.message);
    }
    setSubmitting(false);
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
        customerName: parentForm.customerName.trim(),
        phoneNumber: formattedPhone,
        totalTonnage: parseFloat(parentForm.totalTonnage),
        mineral_type: parentForm.mineral_type.trim(),
        mineral_grade: parentForm.mineral_grade?.trim() || 'Ungraded',
        moisture_content: parentForm.moisture_content ? parseFloat(parentForm.moisture_content) : null,
        particle_size: parentForm.particle_size?.trim() || null,
        loadingPoint: parentForm.loadingPoint.trim(),
        destination: parentForm.destination.trim(),
        deadline: deadline.toISOString(),
        requires_analysis: Boolean(parentForm.requires_analysis),
        special_handling_notes: parentForm.special_handling_notes?.trim() || null,
        environmental_concerns: parentForm.environmental_concerns?.trim() || null,
        notes: parentForm.notes?.trim() || null
      };

      console.log('Sending parent booking data:', parentBookingData);

      const res = await deliveryApi.createParentBooking(parentBookingData);
      
      if (res.success) {
        setShowToast(true);
        setToastMsg(`Parent booking created successfully! Booking Code: ${res.booking.booking_code}`);
        
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

        // Refresh parent bookings and update customers list
        const data = await deliveryApi.getAllParentBookings();
        setParentBookings(data);
        updateCustomersList(data);
      }
    } catch (error) {
      console.error('Create parent booking error:', error);
      setCreateFeedback(error.response?.data?.error || 'Failed to create parent booking');
    }
    setCreating(false);
  };

  const filteredAndSortedParentBookings = parentBookings
    .filter(booking => {
      switch (progressFilter) {
        case 'completed':
          return booking.completionPercentage === 100;
        case 'in-progress':
          return booking.completionPercentage > 0 && booking.completionPercentage < 100;
        case 'not-started':
          return booking.completionPercentage === 0;
        case 'overdue':
          return new Date(booking.deadline) < new Date();
        default:
          return true;
      }
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (progressSort) {
        case 'deadline':
          comparison = new Date(a.deadline) - new Date(b.deadline);
          break;
        case 'progress':
          comparison = a.completionPercentage - b.completionPercentage;
          break;
        case 'tonnage':
          comparison = a.totalTonnage - b.totalTonnage;
          break;
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        default:
          comparison = 0;
      }
      return progressSortOrder === 'asc' ? comparison : -comparison;
    });

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
        vehicleCapacity: 30.00
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
      }
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

  // Add useEffect to initialize customers list
  useEffect(() => {
    if (parentBookings.length > 0) {
      updateCustomersList(parentBookings);
    }
  }, [parentBookings]);

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
      <div className="checkpoint-history">
        <h6 className="mb-3">Checkpoint History</h6>
        <div className="timeline">
          {checkpoints.map((cp, index) => (
            <div key={index} className="checkpoint-item mb-3">
              <div className="d-flex justify-content-between">
                <strong>{cp.location}</strong>
                <small className="text-muted">
                  {new Date(cp.timestamp).toLocaleString()}
                </small>
              </div>
              <div>Status: <span className="badge bg-info">{cp.status}</span></div>
              <div>Operator: {cp.operator}</div>
              {cp.comment && <div className="text-muted">{cp.comment}</div>}
              {cp.hasIssue && (
                <div className="alert alert-warning mt-1 mb-0 py-1 px-2">
                  <small><strong>Issue:</strong> {cp.issueDetails}</small>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container py-5">
      <h1 className="display-6 fw-bold mb-4" style={{ color: '#D2691E' }}>Operator Dashboard</h1>
      
      {/* Parent Booking Form */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
            <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>add_box</span>
            Create Parent Booking
          </h2>
          <form onSubmit={handleCreateParentBooking} className="row g-3 align-items-end" autoComplete="off">
            <div className="col-md-3">
              <label className="form-label">Customer Name *</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={parentForm.customerName}
                onChange={e => setParentForm(prev => ({ ...prev, customerName: e.target.value }))}
                disabled={creating}
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Phone Number *</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                placeholder="e.g. 0771234567"
                value={parentForm.phoneNumber}
                onChange={e => setParentForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                disabled={creating}
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Total Tonnage *</label>
              <input 
                type="number" 
                className="form-control" 
                required 
                min="0.01"
                step="0.01"
                value={parentForm.totalTonnage}
                onChange={e => setParentForm(prev => ({ ...prev, totalTonnage: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Mineral Type *</label>
              <select 
                className="form-select"
                required
                value={parentForm.mineral_type}
                onChange={e => setParentForm(prev => ({ ...prev, mineral_type: e.target.value }))}
                disabled={creating}
              >
                <option value="">Select type...</option>
                <option value="Coal">Coal</option>
                <option value="Iron Ore">Iron Ore</option>
                <option value="Copper Ore">Copper Ore</option>
                <option value="Gold Ore">Gold Ore</option>
                <option value="Bauxite">Bauxite</option>
                <option value="Limestone">Limestone</option>
                <option value="Phosphate">Phosphate</option>
                <option value="Manganese">Manganese</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Mineral Grade</label>
              <select 
                className="form-select"
                value={parentForm.mineral_grade}
                onChange={e => setParentForm(prev => ({ ...prev, mineral_grade: e.target.value }))}
                disabled={creating}
              >
                <option value="Ungraded">Ungraded</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Low Grade">Low Grade</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Loading Point *</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={parentForm.loadingPoint}
                onChange={e => setParentForm(prev => ({ ...prev, loadingPoint: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Destination *</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={parentForm.destination}
                onChange={e => setParentForm(prev => ({ ...prev, destination: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Deadline *</label>
              <input 
                type="datetime-local" 
                className="form-control" 
                required
                min={new Date().toISOString().slice(0, 16)}
                value={parentForm.deadline || ''}
                onChange={e => setParentForm(prev => ({ ...prev, deadline: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Moisture Content (%)</label>
              <input 
                type="number" 
                className="form-control" 
                min="0"
                max="100"
                step="0.01"
                value={parentForm.moisture_content}
                onChange={e => setParentForm(prev => ({ ...prev, moisture_content: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Particle Size</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. 0-50mm"
                value={parentForm.particle_size}
                onChange={e => setParentForm(prev => ({ ...prev, particle_size: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-md-12">
              <div className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id="requires_analysis"
                  checked={parentForm.requires_analysis}
                  onChange={e => setParentForm(prev => ({ ...prev, requires_analysis: e.target.checked }))}
                  disabled={creating}
                />
                <label className="form-check-label" htmlFor="requires_analysis">
                  Requires Analysis
                </label>
              </div>
            </div>

            <div className="col-md-12">
              <label className="form-label">Special Handling Notes</label>
              <textarea 
                className="form-control" 
                rows="2"
                value={parentForm.special_handling_notes}
                onChange={e => setParentForm(prev => ({ ...prev, special_handling_notes: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label">Environmental Concerns</label>
              <textarea 
                className="form-control" 
                rows="2"
                value={parentForm.environmental_concerns}
                onChange={e => setParentForm(prev => ({ ...prev, environmental_concerns: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label">Notes</label>
              <textarea 
                className="form-control" 
                rows="2"
                value={parentForm.notes}
                onChange={e => setParentForm(prev => ({ ...prev, notes: e.target.value }))}
                disabled={creating}
              />
            </div>

            <div className="col-12">
              <button 
                type="submit" 
                className="btn btn-primary fw-bold" 
                style={{ background: '#D2691E', border: 'none' }} 
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Parent Booking'}
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

      {/* Progress Tracking Section with Filters */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h5 fw-bold mb-0" style={{ color: '#a14e13' }}>
                  <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>track_changes</span>
                  Delivery Progress
                </h2>
                <div className="d-flex gap-2">
                  {/* Filter Dropdown */}
                  <select 
                    className="form-select form-select-sm" 
                    value={progressFilter}
                    onChange={(e) => setProgressFilter(e.target.value)}
                  >
                    <option value="all">All Bookings</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="not-started">Not Started</option>
                    <option value="overdue">Overdue</option>
                  </select>

                  {/* Sort Dropdown */}
                  <select 
                    className="form-select form-select-sm" 
                    value={progressSort}
                    onChange={(e) => setProgressSort(e.target.value)}
                  >
                    <option value="deadline">Sort by Deadline</option>
                    <option value="progress">Sort by Progress</option>
                    <option value="tonnage">Sort by Tonnage</option>
                    <option value="customer">Sort by Customer</option>
                  </select>

                  {/* Sort Order Toggle */}
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => setProgressSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                  >
                    {progressSortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* Progress Cards */}
              <div className="row g-3">
                {filteredAndSortedParentBookings.map(booking => (
                  <div key={booking.id} className="col-12">
                    <div 
                      className="card mb-0 cursor-pointer" 
                      onClick={() => {
                        setSelectedParentBooking(booking);
                        setShowParentDetails(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="card-title mb-1">{booking.customerName}</h5>
                            <div className="text-muted small">
                              {booking.loadingPoint} → {booking.destination}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className={`badge ${getDeadlineBadgeClass(booking.deadline)}`}>
                              {getTimeLeft(booking.deadline)}
                            </div>
                          </div>
                        </div>

                        <div className="progress mb-2" style={{ height: '25px' }}>
                          <div 
                            className="progress-bar" 
                            role="progressbar"
                            style={{ 
                              width: `${booking.completionPercentage}%`,
                              backgroundColor: '#D2691E'
                            }}
                            aria-valuenow={booking.completionPercentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {booking.completionPercentage}%
                          </div>
                        </div>

                        <div className="row g-2 text-muted small">
                          <div className="col-md-4">
                            <strong>Total Tonnage:</strong> {booking.totalTonnage} tons
                          </div>
                          <div className="col-md-4">
                            <strong>Completed:</strong> {booking.completedTonnage} tons
                          </div>
                          <div className="col-md-4">
                            <strong>Deliveries:</strong> {booking.completedDeliveries}/{booking.totalDeliveries}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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
            <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>add_box</span>
            Create New Delivery
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
              <label className="form-label">Select Booking *</label>
              <select 
                className="form-select"
                value={createForm.selectedBookingId}
                onChange={(e) => handleBookingSelect(e.target.value)}
                disabled={creating || !createForm.customerId}
                required
              >
                <option value="">Choose booking...</option>
                {selectedCustomerBookings.map(booking => (
                  <option key={booking.id} value={booking.id}>
                    {booking.bookingCode} - {booking.mineral_type} ({booking.mineral_grade}) - {booking.remainingTonnage} tons remaining
                  </option>
                ))}
              </select>
            </div>

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
                {creating ? 'Creating...' : 'Create Delivery'}
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
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
                <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>list_alt</span>
                Active Deliveries
              </h2>
              <div className="input-group mb-3">
                <span className="input-group-text bg-white" style={{ color: '#D2691E' }}>
                  <span className="material-icons">search</span>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, tracking ID, or status..."
                  className="form-control"
                  disabled={loading}
                />
              </div>
              {loading ? (
                <Spinner />
              ) : error ? (
                <div className="alert alert-danger">Error: {error}</div>
              ) : filteredDeliveries.length === 0 ? (
                <div className="alert alert-warning">No deliveries found.</div>
              ) : (
                <ul className="list-group">
                  {filteredDeliveries.map((delivery) => (
                    <li
                      key={delivery.trackingId}
                      className={`list-group-item list-group-item-action ${selectedId === delivery.trackingId ? 'active' : ''}`}
                      style={selectedId === delivery.trackingId ? { background: '#e88a3a', color: '#fff', borderColor: '#e88a3a' } : { cursor: 'pointer' }}
                      onClick={() => setSelectedId(delivery.trackingId)}
                      tabIndex={0}
                      onKeyPress={e => { if (e.key === 'Enter') setSelectedId(delivery.trackingId); }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div>
                            <span className="fw-bold" style={{ color: selectedId === delivery.trackingId ? '#fff' : '#D2691E' }}>
                              {delivery.customerName}
                            </span>
                            <span className="text-muted small ms-2">({delivery.trackingId})</span>
                          </div>
                            <div className="text-muted small">Booking Ref: {delivery.bookingReference}</div>
                            <div className="text-muted small">
                              {delivery.containerCount} container(s) | {delivery.tonnage} tons | {delivery.mineral_type} ({delivery.mineral_grade})
                            </div>
                          <div className="text-muted small">
                            From: {delivery.loadingPoint} → To: {delivery.destination}
                          </div>
                          <div className="text-muted small">Phone: {delivery.phoneNumber}</div>
                        </div>
                        <span className="badge rounded-pill" style={{ background: '#D2691E', color: '#fff' }}>
                          {delivery.currentStatus}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
                <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>edit_location_alt</span>
                Update Checkpoint
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
                  <label className="form-label">Operator *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.operator}
                    onChange={e => setForm(prev => ({ ...prev, operator: e.target.value }))}
                    required
                    disabled={submitting}
                  />
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
                    {submitting ? 'Updating...' : 'Update Checkpoint'}
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
  if (daysUntilDeadline <= 3) return 'bg-warning';
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