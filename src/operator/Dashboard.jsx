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
  const [form, setForm] = useState({ location: '', operator: '', comment: '', status: '' });
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

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await deliveryApi.getAll();
        setDeliveries(data);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.response?.data?.error || 'Failed to fetch deliveries');
        setDeliveries([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDeliveries();
    } else {
      navigate('/login');
    }
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
        setDeliveries(deliveriesData);
        setParentBookings(bookingsData);
        updateCustomersList(bookingsData);
      }
    } catch (error) {
      console.error('Create delivery error:', error);
      setCreateFeedback(error.response?.data?.error || 'Failed to create delivery');
    }
    setCreating(false);
  };

  const handleUpdateCheckpoint = async (trackingId, checkpoint, currentStatus) => {
    if (!trackingId || !checkpoint || !currentStatus) {
      setFeedback('All fields are required.');
      return;
    }
    try {
      await deliveryApi.updateCheckpoint(trackingId, checkpoint, currentStatus);
      // Refresh deliveries
      const data = await deliveryApi.getAll();
      setDeliveries(data);
    } catch (error) {
      setFeedback(error.response?.data?.error || 'Failed to update checkpoint');
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
    const checkpoint = {
      location: form.location,
      operator: form.operator,
      comment: form.comment,
    };
    if (!form.location || !form.operator || !form.status) {
      setFeedback('Location, Operator, and Status are required.');
      setSubmitting(false);
      return;
    }
    if (!form.status) {
      setFeedback('Status is required.');
      setSubmitting(false);
      return;
    }
    try {
      await handleUpdateCheckpoint(selectedId, checkpoint, form.status);
      setFeedback('Checkpoint updated successfully!');
      setForm({ location: '', operator: '', comment: '', status: '' });
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

      const parentBookingData = {
        customerName: parentForm.customerName.trim(),
        phoneNumber: formattedPhone,
        totalTonnage: parseFloat(parentForm.totalTonnage),
        mineral_type: parentForm.mineral_type.trim(),
        mineral_grade: parentForm.mineral_grade.trim(),
        moisture_content: parentForm.moisture_content,
        particle_size: parentForm.particle_size,
        loadingPoint: parentForm.loadingPoint.trim(),
        destination: parentForm.destination.trim(),
        deadline: parentForm.deadline.toISOString(),
        requires_analysis: parentForm.requires_analysis || false,
        special_handling_notes: parentForm.special_handling_notes?.trim(),
        environmental_concerns: parentForm.environmental_concerns?.trim(),
        notes: parentForm.notes?.trim()
      };

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
          return booking.completion_percentage === 100;
        case 'in-progress':
          return booking.completion_percentage > 0 && booking.completion_percentage < 100;
        case 'not-started':
          return booking.completion_percentage === 0;
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
          comparison = a.completion_percentage - b.completion_percentage;
          break;
        case 'tonnage':
          comparison = a.total_tonnage - b.total_tonnage;
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
    const customerBookings = parentBookings.filter(
      booking => booking.customerName === customers.find(c => c.id === customerId)?.name
    );
    setSelectedCustomerBookings(customerBookings);
    setCreateForm(prev => ({
      ...prev,
      customerId,
      selectedBookingId: '',
      tonnage: '',
      containerCount: '',
      vehicleType: 'Standard Truck',
      vehicleCapacity: 30.00
    }));
  };

  // Update form when a booking is selected
  const handleBookingSelect = (bookingId) => {
    const selectedBooking = parentBookings.find(b => b.id === bookingId);
    if (selectedBooking) {
      setCreateForm(prev => ({
        ...prev,
        selectedBookingId: bookingId,
        loadingPoint: selectedBooking.loadingPoint,
        destination: selectedBooking.destination,
        mineral_type: selectedBooking.mineral_type,
        mineral_grade: selectedBooking.mineral_grade
      }));
    }
  };

  // Add useEffect to initialize customers list
  useEffect(() => {
    if (parentBookings.length > 0) {
      updateCustomersList(parentBookings);
    }
  }, [parentBookings]);

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
                className="form-control"
                required
                value={parentForm.mineral_type}
                onChange={e => setParentForm(prev => ({ ...prev, mineral_type: e.target.value }))}
                disabled={creating}
              >
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
              <label className="form-label">Mineral Grade *</label>
              <select
                className="form-control"
                required
                value={parentForm.mineral_grade}
                onChange={e => setParentForm(prev => ({ ...prev, mineral_grade: e.target.value }))}
                disabled={creating}
              >
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Low Grade">Low Grade</option>
                <option value="Mixed">Mixed</option>
                <option value="Ungraded">Ungraded</option>
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
              <DatePicker
                selected={parentForm.deadline}
                onChange={(date) => setParentForm(prev => ({ ...prev, deadline: date }))}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={new Date()}
                className="form-control"
                placeholderText="Select deadline date and time"
                required
                disabled={creating}
                customInput={
                  <input
                    style={{
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  />
                }
              />
            </div>
            <div className="col-12">
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
                              width: `${booking.completion_percentage}%`,
                              backgroundColor: '#D2691E'
                            }}
                            aria-valuenow={booking.completion_percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {booking.completion_percentage}%
                          </div>
                        </div>

                        <div className="row g-2 text-muted small">
                          <div className="col-md-4">
                            <strong>Total Tonnage:</strong> {booking.total_tonnage} tons
                          </div>
                          <div className="col-md-4">
                            <strong>Completed:</strong> {booking.completed_tonnage} tons
                          </div>
                          <div className="col-md-4">
                            <strong>Deliveries:</strong> {booking.completed_deliveries}/{booking.total_deliveries}
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
                            {delivery.containerCount} container(s) | {delivery.tonnage} tons | {delivery.commodity}
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
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <div className="mb-2 d-flex gap-2 flex-wrap">
                    {[
                      { label: 'Mine', status: 'At Mine' },
                      { label: 'Border', status: 'At Border' },
                      { label: 'Port', status: 'At Port' },
                      { label: 'Port of Destination', status: 'At Port of Destination' },
                      { label: 'Warehouse', status: 'At Warehouse' },
                    ].map(({ label, status }) => (
                      <button
                        type="button"
                        key={label}
                        className="btn btn-sm btn-outline-primary fw-bold"
                        style={{ color: '#D2691E', borderColor: '#D2691E' }}
                        onClick={() => {
                          setForm(f => ({ ...f, location: label, status }));
                        }}
                        disabled={submitting || loading}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="form-control" required disabled={submitting || loading} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Operator</label>
                  <input type="text" value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} className="form-control" required disabled={submitting || loading} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Comment</label>
                  <input type="text" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} className="form-control" disabled={submitting || loading} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <input type="text" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="form-control" disabled={submitting || loading} />
                </div>
                <button type="submit" disabled={submitting || !selectedId || loading} className="btn w-100 text-white fw-bold" style={{ background: '#D2691E' }}>{submitting ? <span><Spinner /> Updating...</span> : 'Update Checkpoint'}</button>
              </form>
              {feedback && <div className={`mt-3 alert ${feedback.includes('success') ? 'alert-success' : 'alert-danger'}`}>{feedback}</div>}
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