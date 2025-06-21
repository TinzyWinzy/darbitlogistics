import { useEffect, useState, useContext, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { deliveryApi } from '../services/api';
import { useDeliveries } from '../services/useDeliveries';
import { useParentBookings } from '../services/useParentBookings';
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
  const { 
    deliveries, 
    loading: deliveriesLoading, 
    error: deliveriesError, 
    createDelivery, 
    updateCheckpoint 
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
  
  const [openBookingId, setOpenBookingId] = useState(null);
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
  const [showCreateParentBookingModal, setShowCreateParentBookingModal] = useState(false);

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
    mineralType: d.mineral_type,
    mineralGrade: d.mineral_grade
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (parentBookings.length > 0) {
      updateCustomersList(parentBookings);
    }
  }, [parentBookings]);

  const loading = deliveriesLoading || parentBookingsLoading;
  const error = deliveriesError || parentBookingsError;

  const filteredAndSortedParentBookings = useMemo(() => {
      const q = search.toLowerCase();

    const withDeliveries = parentBookings.map(booking => ({
      ...booking,
      deliveries: deliveries.filter(d => d.parentBookingId === booking.id)
    }));

    const searchFiltered = q ? withDeliveries.filter(booking => {
      if (
        (booking.customerName || '').toLowerCase().includes(q) ||
        (booking.bookingCode || '').toLowerCase().includes(q) ||
        (booking.destination || '').toLowerCase().includes(q) ||
        (booking.loadingPoint || '').toLowerCase().includes(q)
      ) {
        return true;
      }

      const hasMatchingDelivery = booking.deliveries.some(d =>
        (d.trackingId || '').toLowerCase().includes(q) ||
        (d.currentStatus || '').toLowerCase().includes(q) ||
        (d.driverDetails?.name || '').toLowerCase().includes(q) ||
        (d.driverDetails?.vehicleReg || '').toLowerCase().includes(q)
      );

      return hasMatchingDelivery;
    }) : withDeliveries;

    const progressFiltered = searchFiltered.filter(booking => {
      switch (progressFilter) {
        case 'completed':
          return booking.completionPercentage === 100;
        case 'in-progress':
          return booking.completionPercentage > 0 && booking.completionPercentage < 100;
        case 'not-started':
          return booking.completionPercentage === 0;
        case 'overdue':
          const isOverdue = new Date(booking.deadline) < new Date();
          return isOverdue && booking.completionPercentage < 100;
        default:
          return true;
      }
    });

    const sorted = progressFiltered.sort((a, b) => {
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

    return sorted;

  }, [search, parentBookings, deliveries, progressFilter, progressSort, progressSortOrder]);


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

      const res = await createDelivery(deliveryData);

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

        // Refresh parent bookings to update remaining tonnage
        await fetchParentBookings();
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
      status: currentStatus,
      timestamp: newCheckpoint.timestamp.toISOString(),
      coordinates: newCheckpoint.coordinates || null,
      hasIssue: newCheckpoint.hasIssue || false,
      issueDetails: newCheckpoint.hasIssue ? newCheckpoint.issueDetails : ''
    };

    // Combine old and new checkpoints
    const updatedCheckpoints = [...(delivery.checkpoints || []), updatedCheckpoint];

    try {
      setSubmitting(true);
      await updateCheckpoint(trackingId, updatedCheckpoints, currentStatus);
      
      // Refresh parent bookings to update progress
      await fetchParentBookings();

      setFeedback('Checkpoint logged successfully!');
      
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

      const res = await createParentBooking(parentBookingData);
      
      if (res.success) {
        setShowToast(true);
        setToastMsg(`Consignment logged successfully! Booking Code: ${res.booking.booking_code}`);
        
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
      <h1 className="display-6 fw-bold mb-4" style={{ color: '#D2691E' }}>Morres Logistics - Operations Hub</h1>
      
      {/* Trigger button for Parent Booking Modal */}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 fw-bold mb-0" style={{ color: '#a14e13' }}>
              <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>apps</span>
              Dashboard
          </h2>
          <button
              className="btn btn-primary fw-bold"
              style={{ background: '#D2691E', border: 'none' }}
              onClick={() => setShowCreateParentBookingModal(true)}
          >
              <span className="material-icons align-middle me-1">add_box</span>
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
            <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>add_box</span>
            Log New Consignment
          </h2>
                  <button type="button" className="btn-close" onClick={() => setShowCreateParentBookingModal(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleCreateParentBooking} className="row g-3" autoComplete="off">
                    <div className="col-md-6">
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
            
                    <div className="col-md-6">
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
            
                    <div className="col-md-6">
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

                    <div className="col-md-6">
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

                    <div className="col-md-6">
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

                    <div className="col-md-6">
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

                    <div className="col-md-6">
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

                    <div className="col-md-6">
              <label className="form-label">Deadline *</label>
                      <DatePicker
                        selected={parentForm.deadline}
                        onChange={date => setParentForm(prev => ({ ...prev, deadline: date }))}
                        showTimeSelect
                        dateFormat="yyyy-MM-dd HH:mm"
                className="form-control" 
                        minDate={new Date()}
                        placeholderText="Select deadline"
                required
                disabled={creating}
              />
            </div>

                    <div className="col-md-6">
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

                    <div className="col-md-6">
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

                    <div className="col-12 mt-4">
              <button 
                type="submit" 
                        className="btn btn-primary fw-bold w-100" 
                style={{ background: '#D2691E', border: 'none' }} 
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Log Consignment'}
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
            <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>add_box</span>
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
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
                <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>list_alt</span>
                Consignment & Load Monitoring
              </h2>
              
              {/* Search and Filter Controls */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                <div className="input-group flex-grow-1">
                <span className="input-group-text bg-white" style={{ color: '#D2691E' }}>
                  <span className="material-icons">search</span>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                    placeholder="Search consignments or loads..."
                  className="form-control"
                  disabled={loading}
                />
              </div>
                
                <select 
                  className="form-select form-select-sm" 
                  style={{ flexBasis: '150px' }}
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="not-started">Not Started</option>
                  <option value="overdue">Overdue</option>
                </select>

                <select 
                  className="form-select form-select-sm" 
                  style={{ flexBasis: '150px' }}
                  value={progressSort}
                  onChange={(e) => setProgressSort(e.target.value)}
                >
                  <option value="deadline">Sort: Deadline</option>
                  <option value="progress">Sort: Progress</option>
                  <option value="tonnage">Sort: Tonnage</option>
                  <option value="customer">Sort: Customer</option>
                </select>

                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={() => setProgressSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                >
                  {progressSortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {loading ? (
                <Spinner />
              ) : error ? (
                <div className="alert alert-danger">Error: {error}</div>
              ) : filteredAndSortedParentBookings.length === 0 ? (
                <div className="alert alert-warning">No consignments found.</div>
              ) : (
                <div className="accordion" id="bookingAccordion">
                  {filteredAndSortedParentBookings.map((booking) => (
                    <div className="accordion-item" key={booking.id}>
                      <h2 className="accordion-header" id={`heading-${booking.id}`}>
                        <button 
                          className={`accordion-button ${openBookingId !== booking.id ? 'collapsed' : ''}`} 
                          type="button" 
                          onClick={() => setOpenBookingId(openBookingId === booking.id ? null : booking.id)}
                        >
                          <div className="w-100 d-flex justify-content-between align-items-center pe-2">
                            <div>
                              <strong style={{ color: '#a14e13' }}>{booking.customerName}</strong>
                              <small className="text-muted ms-2">({booking.bookingCode})</small>
                            </div>
                            <span className={`badge ${getDeadlineBadgeClass(booking.deadline)}`}>
                              {getTimeLeft(booking.deadline)}
                            </span>
                          </div>
                        </button>
                      </h2>
                      <div 
                        id={`collapse-${booking.id}`} 
                        className={`accordion-collapse collapse ${openBookingId === booking.id ? 'show' : ''}`}
                      >
                        <div className="accordion-body">
                          {/* Progress Bar and Stats */}
                          <div className="progress mb-2" style={{ height: '20px' }}>
                            <div 
                              className="progress-bar" 
                              role="progressbar"
                              style={{ 
                                width: `${booking.completionPercentage}%`,
                                backgroundColor: '#D2691E'
                              }}
                            >
                              {booking.completionPercentage}%
                            </div>
                          </div>
                          <div className="row g-2 text-muted small mb-3">
                            <div className="col"><strong>Total:</strong> {booking.totalTonnage}t</div>
                            <div className="col"><strong>Completed:</strong> {booking.completedTonnage}t</div>
                            <div className="col"><strong>Loads:</strong> {booking.deliveries.length}</div>
                          </div>

                          {/* Deliveries List */}
                          {booking.deliveries.length > 0 ? (
                <ul className="list-group">
                              {booking.deliveries.map(delivery => (
                    <li
                      key={delivery.trackingId}  
                      className={`list-group-item list-group-item-action ${selectedId === delivery.trackingId ? 'active' : ''}`}
                      style={selectedId === delivery.trackingId ? { background: '#e88a3a', color: '#fff', borderColor: '#e88a3a' } : { cursor: 'pointer' }}
                      onClick={() => setSelectedId(delivery.trackingId)}
                    >
                                  <div className="d-flex justify-content-between">
                        <div>
                                      <strong>{delivery.trackingId}</strong>
                                      <div className='small text-muted'>{delivery.driverDetails.name} ({delivery.driverDetails.vehicleReg})</div>
                                      <div className='small text-muted'>{delivery.tonnage} tons</div>
                          </div>
                                    <span className="badge rounded-pill align-self-center" style={{ background: '#D2691E', color: '#fff' }}>
                          {delivery.currentStatus}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                          ) : (
                            <p className="text-muted text-center small mt-3">No loads dispatched for this consignment yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
                <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>edit_location_alt</span>
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