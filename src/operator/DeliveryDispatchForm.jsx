import { useState, useEffect } from 'react';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTruck, FaUsers } from 'react-icons/fa';

// Enhanced InfoIcon component with better tooltip
function InfoIcon({ text, type = 'info' }) {
  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅'
  };
  
  return (
    <span
      tabIndex={0}
      style={{ 
        marginLeft: 6, 
        color: type === 'info' ? '#17a2b8' : type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#28a745',
        cursor: 'pointer', 
        fontSize: '1.1em', 
        verticalAlign: 'middle' 
      }}
      title={text}
      aria-label={text}
    >
      {iconMap[type]}
    </span>
  );
}

// Validation feedback component
function ValidationFeedback({ isValid, message, show }) {
  if (!show) return null;
  
  return (
    <div className={`validation-feedback ${isValid ? 'valid-feedback' : 'invalid-feedback'} d-block`}>
      <div className="d-flex align-items-center">
        {isValid ? <FaCheckCircle className="me-2" /> : <FaExclamationTriangle className="me-2" />}
        {message}
      </div>
    </div>
  );
}

export default function DeliveryDispatchForm({
  customers,
  parentBookings,
  createDelivery,
  fetchParentBookings,
  onSuccess,
  onFeedback
}) {
  const [createForm, setCreateForm] = useState({
    customerId: '',
    selectedBookingId: '',
    currentStatus: 'Pending',
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
    samplingStatus: '',
    value: '',
    cost: ''
  });

  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');
  const [selectedCustomerBookings, setSelectedCustomerBookings] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // Enhanced validation state
  const [validation, setValidation] = useState({
    customerId: { isValid: true, message: '', show: false },
    selectedBookingId: { isValid: true, message: '', show: false },
    tonnage: { isValid: true, message: '', show: false },
    containerCount: { isValid: true, message: '', show: false },
    driverName: { isValid: true, message: '', show: false },
    vehicleReg: { isValid: true, message: '', show: false },
    cost: { isValid: true, message: '', show: false }
  });

  // Mobile detection with enhanced breakpoints
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 700);
      setIsTablet(width > 700 && width <= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Real-time validation
  const validateField = (field, value) => {
    const newValidation = { ...validation };
    
    switch (field) {
      case 'customerId':
        newValidation.customerId = {
          isValid: !!value,
          message: value ? 'Customer selected' : 'Please select a customer',
          show: true
        };
        break;
      case 'selectedBookingId':
        newValidation.selectedBookingId = {
          isValid: !!value,
          message: value ? 'Consignment selected' : 'Please select a consignment',
          show: true
        };
        break;
      case 'tonnage':
        const tonnage = parseFloat(value);
        newValidation.tonnage = {
          isValid: tonnage > 0,
          message: tonnage > 0 ? 'Valid tonnage' : 'Tonnage must be greater than 0',
          show: true
        };
        break;
      case 'containerCount':
        const count = parseInt(value);
        newValidation.containerCount = {
          isValid: count >= 1,
          message: count >= 1 ? 'Valid container count' : 'Container count must be at least 1',
          show: true
        };
        break;
      case 'driverName':
        newValidation.driverName = {
          isValid: value.trim().length >= 2,
          message: value.trim().length >= 2 ? 'Valid driver name' : 'Driver name must be at least 2 characters',
          show: true
        };
        break;
      case 'vehicleReg':
        newValidation.vehicleReg = {
          isValid: value.trim().length >= 3,
          message: value.trim().length >= 3 ? 'Valid vehicle registration' : 'Vehicle registration must be at least 3 characters',
          show: true
        };
        break;
      case 'cost':
        const cost = parseFloat(value);
        newValidation.cost = {
          isValid: cost >= 0,
          message: cost >= 0 ? 'Valid cost' : 'Cost must be 0 or greater',
          show: true
        };
        break;
    }
    
    setValidation(newValidation);
  };

  const handleCustomerSelect = (customerId) => {
    setCreateForm(prev => ({
      ...prev,
      customerId,
      selectedBookingId: '',
      tonnage: '',
      containerCount: '',
      vehicleType: 'Standard Truck',
      vehicleCapacity: 30.00,
      driverDetails: { name: '', vehicleReg: '' },
      loadingPoint: '',
      destination: '',
      environmentalIncidents: '',
      samplingStatus: '',
      value: '',
      cost: ''
    }));
    
    validateField('customerId', customerId);
    
    // Filter bookings for this customer
    const [customerName, phoneNumber] = customerId.split('|');
    const bookings = parentBookings.filter(
      booking =>
        booking.customerName === customerName &&
        booking.phoneNumber === phoneNumber &&
        booking.status === 'Active' &&
        booking.remainingTonnage > 0
    );
    setSelectedCustomerBookings(bookings);
  };

  const handleBookingSelect = (bookingId) => {
    const selectedBooking = parentBookings.find(b => b.id === bookingId);
    if (selectedBooking) {
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
      
      validateField('selectedBookingId', bookingId);
    }
  };

  // Utility to convert camelCase keys to snake_case, but skip driverDetails/driver_details object
  function camelToSnake(obj) {
    if (Array.isArray(obj)) return obj.map(camelToSnake);
    if (obj !== null && typeof obj === 'object') {
      // If this is the driverDetails object, do not convert its keys
      if (
        (Object.keys(obj).includes('vehicleReg') && Object.keys(obj).includes('name')) ||
        (Object.keys(obj).includes('vehicle_reg') && Object.keys(obj).includes('name'))
      ) {
        return obj;
      }
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
          k.replace(/([A-Z])/g, '_$1').toLowerCase(),
          camelToSnake(v)
        ])
      );
    }
    return obj;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreateFeedback('');
    setShowToast(false);
    setCreating(true);
    
    // Validate all required fields
    const requiredFields = [
      { field: 'customerId', value: createForm.customerId, name: 'Customer' },
      { field: 'selectedBookingId', value: createForm.selectedBookingId, name: 'Consignment' },
      { field: 'tonnage', value: createForm.tonnage, name: 'Tonnage' },
      { field: 'containerCount', value: createForm.containerCount, name: 'Container Count' },
      { field: 'driverName', value: createForm.driverDetails.name, name: 'Driver Name' },
      { field: 'vehicleReg', value: createForm.driverDetails.vehicleReg, name: 'Vehicle Registration' },
      { field: 'cost', value: createForm.cost, name: 'Cost' }
    ];
    
    let hasErrors = false;
    requiredFields.forEach(({ field, value, name }) => {
      validateField(field, value);
      if (!value || (field === 'tonnage' && parseFloat(value) <= 0) || 
          (field === 'containerCount' && parseInt(value) < 1) ||
          (field === 'driverName' && value.trim().length < 2) ||
          (field === 'vehicleReg' && value.trim().length < 3) ||
          (field === 'cost' && parseFloat(value) < 0)) {
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setCreateFeedback('Please fix the validation errors before submitting.');
      setCreating(false);
      return;
    }
    
    const selectedBooking = parentBookings.find(b => b.id === createForm.selectedBookingId);
    if (!selectedBooking) {
      console.error('Invalid booking selection:', {
        selectedBookingId: createForm.selectedBookingId,
        availableIds: parentBookings.map(b => b.id)
      });
      setCreateFeedback('Invalid booking selection.');
      setCreating(false);
      return;
    }
    
    if (selectedBooking.remainingTonnage < createForm.tonnage) {
      setCreateFeedback(`Insufficient remaining tonnage. Available: ${selectedBooking.remainingTonnage} tons`);
      setCreating(false);
      return;
    }
    
    // Extract customerName and phoneNumber from customerId
    const [customerName, phoneNumber] = createForm.customerId.split('|');
    const deliveryData = {
      parentBookingId: selectedBooking.id,
      customerName,
      phoneNumber,
      currentStatus: createForm.currentStatus || 'Pending',
      loadingPoint: selectedBooking.loadingPoint,
      destination: selectedBooking.destination,
      mineralType: selectedBooking.mineral_type,
      mineralGrade: selectedBooking.mineral_grade,
      containerCount: parseInt(createForm.containerCount),
      tonnage: parseFloat(createForm.tonnage),
      vehicleType: createForm.vehicleType || 'Standard Truck',
      vehicleCapacity: parseFloat(createForm.vehicleCapacity) || 30.00,
      driverDetails: {
        name: createForm.driverDetails.name.trim(),
        vehicleReg: createForm.driverDetails.vehicleReg.trim()
      },
      environmentalIncidents: createForm.environmentalIncidents || null,
      samplingStatus: createForm.samplingStatus || 'Not Sampled',
      value: createForm.value !== '' ? parseFloat(createForm.value) : 0,
      cost: createForm.cost !== '' ? parseFloat(createForm.cost) : 0
    };
    
    try {
      const res = await createDelivery(camelToSnake(deliveryData));
      if (res.success) {
        setCreateFeedback('Delivery dispatched successfully!');
        setToastMsg('Delivery dispatched successfully!');
        setToastType('success');
        setShowToast(true);
        
        // Reset form
        setCreateForm({
          customerId: '',
          selectedBookingId: '',
          currentStatus: 'Pending',
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
          samplingStatus: '',
          value: '',
          cost: ''
        });
        
        // Reset validation
        setValidation({
          customerId: { isValid: true, message: '', show: false },
          selectedBookingId: { isValid: true, message: '', show: false },
          tonnage: { isValid: true, message: '', show: false },
          containerCount: { isValid: true, message: '', show: false },
          driverName: { isValid: true, message: '', show: false },
          vehicleReg: { isValid: true, message: '', show: false },
          cost: { isValid: true, message: '', show: false }
        });
        
        setSelectedCustomerBookings([]);
        if (fetchParentBookings) await fetchParentBookings();
        if (onSuccess) onSuccess(res);
      }
    } catch (err) {
      setCreateFeedback(err.response?.data?.error || 'Failed to dispatch delivery.');
      setToastMsg(err.response?.data?.error || 'Failed to dispatch delivery.');
      setToastType('danger');
      setShowToast(true);
      if (onFeedback) onFeedback(err.response?.data?.error || 'Failed to dispatch delivery.');
    } finally {
      setCreating(false);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  // Sort consignments by remaining tonnage (descending)
  const sortedCustomerBookings = (selectedCustomerBookings || []).slice().sort((a, b) => {
    const tA = Number(a.remainingTonnage || a.remaining_tonnage || 0);
    const tB = Number(b.remainingTonnage || b.remaining_tonnage || 0);
    return tB - tA;
  });

  return (
    <>
      <style>{`
        .enhanced-dispatch-form {
          color: var(--dark-gray);
        }

        .enhanced-dispatch-form .form-label { 
          font-weight: 600; 
          color: var(--dark-gray); 
          margin-bottom: 0.5rem; 
        }

        .enhanced-dispatch-form .form-control, 
        .enhanced-dispatch-form .form-select, 
        .enhanced-dispatch-form textarea {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
          font-size: 1rem;
          color: var(--dark-gray);
          backdrop-filter: blur(10px);
        }

        .enhanced-dispatch-form .form-control::placeholder,
        .enhanced-dispatch-form .form-select option {
          color: rgba(0, 0, 0, 0.6);
        }

        .enhanced-dispatch-form .form-control:focus,
        .enhanced-dispatch-form .form-select:focus {
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 0.2rem rgba(255, 102, 0, 0.25);
          background: rgba(255, 255, 255, 0.15);
          outline: none;
        }

        .enhanced-dispatch-form .form-control.is-valid {
          border-color: #28a745;
          background: rgba(40, 167, 69, 0.1);
        }

        .enhanced-dispatch-form .form-control.is-invalid {
          border-color: #dc3545;
          background: rgba(220, 53, 69, 0.1);
        }

        .validation-feedback {
          font-size: 0.875rem;
          margin-top: 0.25rem;
          color: var(--dark-gray);
        }

        .valid-feedback {
          color: #51cf66 !important;
        }

        .invalid-feedback {
          color: #ff6b6b !important;
        }

        .enhanced-dispatch-form .btn-submit {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          border: none;
          border-radius: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          color: white;
          box-shadow: 0 4px 16px rgba(255, 102, 0, 0.3);
        }

        .enhanced-dispatch-form .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 102, 0, 0.4);
        }

        .enhanced-dispatch-form .btn-submit:disabled {
          opacity: 0.6;
          transform: none;
          cursor: not-allowed;
        }

        .enhanced-dispatch-form .form-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }

        .enhanced-dispatch-form .form-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .enhanced-dispatch-form .form-section-title {
          color: var(--dark-gray);
          font-weight: 700;
          margin-bottom: 1rem;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .enhanced-dispatch-form .alert {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: var(--dark-gray);
        }

        .enhanced-dispatch-form .alert-light {
          background: rgba(255, 255, 255, 0.1);
          border-left: 4px solid var(--primary-orange);
        }

        .enhanced-dispatch-form .alert-light .text-muted {
          color: var(--dark-gray) !important;
        }

        .enhanced-dispatch-form .alert-light small {
          color: var(--dark-gray) !important;
        }

        /* Toast styling */
        .toast {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .enhanced-dispatch-form .text-muted {
          color: var(--dark-gray) !important;
        }

        .enhanced-dispatch-form .text-danger {
          color: #dc3545 !important;
        }

        .enhanced-dispatch-form .text-success {
          color: #28a745 !important;
        }

        .enhanced-dispatch-form .text-warning {
          color: #ffc107 !important;
        }

        .enhanced-dispatch-form .text-info {
          color: #17a2b8 !important;
        }

        @media (max-width: 700px) {
          .enhanced-dispatch-form .form-label { 
            font-size: 1.05em; 
          }

          .enhanced-dispatch-form .form-control, 
          .enhanced-dispatch-form .form-select, 
          .enhanced-dispatch-form textarea {
            font-size: 1.08em;
            min-height: 2.5em;
            padding: 0.7em 1em;
          }

          .enhanced-dispatch-form .row.g-3 { 
            gap: 0.5rem 0 !important; 
          }

          .enhanced-dispatch-form .col-md-4, 
          .enhanced-dispatch-form .col-md-3, 
          .enhanced-dispatch-form .col-12 { 
            flex: 0 0 100%; 
            max-width: 100%; 
          }

          .enhanced-dispatch-form .col-12.d-flex { 
            flex-direction: column; 
            gap: 0.5rem !important; 
          }

          .enhanced-dispatch-form .btn { 
            width: 100%; 
            font-size: 1.1em; 
            padding: 0.9em 0; 
          }

          .enhanced-dispatch-form .sticky-submit { 
            position: sticky; 
            bottom: 0; 
            background: rgba(0, 51, 102, 0.9);
            backdrop-filter: blur(20px);
            z-index: 10; 
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2); 
            padding: 1rem;
            border-radius: 16px 16px 0 0;
          }

          .enhanced-dispatch-form .form-section {
            padding: 1rem;
            margin-bottom: 1rem;
          }
        }
      `}</style>
      
      {/* Toast/Snackbar Feedback */}
      {showToast && (
        <div className={`toast show position-fixed bottom-0 end-0 m-4`} style={{zIndex:9999, minWidth: '220px'}} role="alert" aria-live="assertive" aria-atomic="true">
          <div className={`toast-header text-white ${toastType === 'success' ? 'bg-success' : 'bg-danger'}`}> 
            <strong className="me-auto">{toastType === 'success' ? 'Success' : 'Error'}</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)} aria-label="Close"></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={`row g-3 align-items-end enhanced-dispatch-form${isMobile ? ' mobile-dispatch-form' : ''}`} autoComplete="off">
        
        {/* Customer & Consignment Selection Section */}
        <div className="col-12">
          <div className="form-section">
            <h6 className="form-section-title">
              <FaInfoCircle />
              Customer & Consignment Details
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">
                  <span className="fw-bold text-danger">*</span> Select Customer
                  <InfoIcon text="Choose the client for this delivery. Customers are registered with their name and phone number." />
                </label>
                <select 
                  className={`form-select ${validation.customerId.show ? (validation.customerId.isValid ? 'is-valid' : 'is-invalid') : ''}`}
                  value={createForm.customerId}
                  onChange={(e) => {
                    handleCustomerSelect(e.target.value);
                  }}
                  disabled={creating}
                  required
                  aria-label="Select customer"
                >
                  <option value="">Choose customer...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
                <ValidationFeedback 
                  isValid={validation.customerId.isValid}
                  message={validation.customerId.message}
                  show={validation.customerId.show}
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">
                  <span className="fw-bold text-danger">*</span> Select Consignment
                  <InfoIcon text="A consignment (parent booking) groups multiple deliveries under one contract. Choose the relevant booking for this load." />
                </label>
                <select 
                  className={`form-select ${validation.selectedBookingId.show ? (validation.selectedBookingId.isValid ? 'is-valid' : 'is-invalid') : ''}`}
                  value={createForm.selectedBookingId}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, selectedBookingId: e.target.value }));
                    handleBookingSelect(e.target.value);
                  }}
                  disabled={creating || !createForm.customerId}
                  required
                  aria-label="Select consignment"
                >
                  <option value="" disabled>
                    {sortedCustomerBookings.length === 0 ? 'No consignments available for this customer' : 'Select a consignment...'}
                  </option>
                  {sortedCustomerBookings.map(booking => {
                    const code = booking.bookingCode || booking.booking_code || 'N/A';
                    const mineral = booking.mineralType || booking.mineral_type || '';
                    const tons = booking.remainingTonnage || booking.remaining_tonnage || 0;
                    return (
                      <option key={booking.id || code} value={booking.id || code}>
                        {`${code} – ${tons} tons${mineral ? ' – ' + mineral : ''}`}
                      </option>
                    );
                  })}
                </select>
                <ValidationFeedback 
                  isValid={validation.selectedBookingId.isValid}
                  message={validation.selectedBookingId.message}
                  show={validation.selectedBookingId.show}
                />
              </div>
            </div>
            
            {/* Show more meta for selected consignment */}
            {createForm.selectedBookingId && (() => {
              const selected = sortedCustomerBookings.find(b => (b.id || b.bookingCode || b.booking_code) === createForm.selectedBookingId);
              if (!selected) return null;
              const grade = selected.mineralGrade || selected.mineral_grade || '';
              const date = selected.bookingDate || selected.booking_date || '';
              const value = selected.value ? `₦${Number(selected.value).toLocaleString()}` : null;
              const cost = selected.cost ? `$${Number(selected.cost).toLocaleString()}` : null;
              return (
                <div className="col-12 mt-3">
                  <div className="alert alert-light p-3">
                    <small className="text-muted d-block mb-2">
                      <strong>Route:</strong> {createForm.loadingPoint} &rarr; {createForm.destination}
                    </small>
                    <div className="row g-2" style={{ fontSize: '0.95em', color: 'rgba(255, 255, 255, 0.8)' }}>
                      <div className="col-md-3"><strong>Grade:</strong> {grade || <span className="text-muted">Not specified</span>}</div>
                      {date && <div className="col-md-3"><strong>Booked:</strong> {new Date(date).toLocaleDateString()}</div>}
                      {value && <div className="col-md-3"><strong>Value:</strong> {value}</div>}
                      {cost && <div className="col-md-3"><strong>Cost:</strong> {cost}</div>}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Load Details Section */}
        <div className="col-12">
          <div className="form-section">
            <h6 className="form-section-title">
              <FaTruck />
              Load Details
            </h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">
                  <span className="fw-bold text-danger">*</span> Tonnage
                  <InfoIcon text="Weight of the load in metric tons." />
                </label>
                <input
                  type="number"
                  className={`form-control ${validation.tonnage.show ? (validation.tonnage.isValid ? 'is-valid' : 'is-invalid') : ''}`}
                  value={createForm.tonnage}
                  onChange={e => {
                    setCreateForm(prev => ({ ...prev, tonnage: e.target.value }));
                    validateField('tonnage', e.target.value);
                  }}
                  required
                  aria-label="Tonnage"
                  min={0.1}
                  step={0.01}
                  disabled={creating}
                  placeholder="Enter tonnage"
                />
                <ValidationFeedback 
                  isValid={validation.tonnage.isValid}
                  message={validation.tonnage.message}
                  show={validation.tonnage.show}
                />
              </div>
              
              <div className="col-md-4">
                <label className="form-label">
                  <span className="fw-bold text-danger">*</span> Container Count
                  <InfoIcon text="Number of containers for this load." />
                </label>
                <input
                  type="number"
                  className={`form-control ${validation.containerCount.show ? (validation.containerCount.isValid ? 'is-valid' : 'is-invalid') : ''}`}
                  value={createForm.containerCount}
                  onChange={e => {
                    setCreateForm(prev => ({ ...prev, containerCount: e.target.value }));
                    validateField('containerCount', e.target.value);
                  }}
                  required
                  aria-label="Container count"
                  min={1}
                  step={1}
                  disabled={creating}
                  placeholder="Enter container count"
                />
                <ValidationFeedback 
                  isValid={validation.containerCount.isValid}
                  message={validation.containerCount.message}
                  show={validation.containerCount.show}
                />
              </div>
              
              <div className="col-md-4">
                <label className="form-label">
                  <span className="fw-bold text-danger">*</span> Cost (USD)
                  <InfoIcon text="Total cost for this delivery in USD." />
                </label>
                <input
                  type="number"
                  className={`form-control ${validation.cost.show ? (validation.cost.isValid ? 'is-valid' : 'is-invalid') : ''}`}
                  value={createForm.cost}
                  onChange={e => {
                    setCreateForm(prev => ({ ...prev, cost: e.target.value }));
                    validateField('cost', e.target.value);
                  }}
                  min="0"
                  step="0.01"
                  placeholder="Enter cost (required)"
                  required
                  disabled={creating || !createForm.selectedBookingId}
                />
                <ValidationFeedback 
                  isValid={validation.cost.isValid}
                  message={validation.cost.message}
                  show={validation.cost.show}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Driver & Vehicle Section */}
        <div className="col-12">
          <div className="form-section">
            <h6 className="form-section-title">
              <FaUsers />
              Driver & Vehicle Information
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">
                  <span className="fw-bold text-danger">*</span> Driver Name
                  <InfoIcon text="Name of the driver assigned to this load." />
                </label>
                <input
                  type="text"
                  className={`form-control ${validation.driverName.show ? (validation.driverName.isValid ? 'is-valid' : 'is-invalid') : ''}`}
                  value={createForm.driverDetails.name}
                  onChange={e => {
                    setCreateForm(prev => ({ ...prev, driverDetails: { ...prev.driverDetails, name: e.target.value } }));
                    validateField('driverName', e.target.value);
                  }}
                  required
                  aria-label="Driver name"
                  disabled={creating}
                  placeholder="Enter driver name"
                />
                <ValidationFeedback 
                  isValid={validation.driverName.isValid}
                  message={validation.driverName.message}
                  show={validation.driverName.show}
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">
                  <span className="fw-bold text-danger">*</span> Vehicle Registration
                  <InfoIcon text="Vehicle registration number." />
                </label>
                <input
                  type="text"
                  className={`form-control ${validation.vehicleReg.show ? (validation.vehicleReg.isValid ? 'is-valid' : 'is-invalid') : ''}`}
                  value={createForm.driverDetails.vehicleReg}
                  onChange={e => {
                    setCreateForm(prev => ({ ...prev, driverDetails: { ...prev.driverDetails, vehicleReg: e.target.value } }));
                    validateField('vehicleReg', e.target.value);
                  }}
                  required
                  aria-label="Vehicle registration"
                  disabled={creating}
                  placeholder="Enter vehicle registration"
                />
                <ValidationFeedback 
                  isValid={validation.vehicleReg.isValid}
                  message={validation.vehicleReg.message}
                  show={validation.vehicleReg.show}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="col-12">
          <div className="form-section">
            <h6 className="form-section-title">
              <FaInfoCircle />
              Additional Details
            </h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-select"
                  value={createForm.currentStatus}
                  onChange={e => setCreateForm(prev => ({ ...prev, currentStatus: e.target.value }))}
                  disabled={creating || !createForm.selectedBookingId}
                  aria-label="Initial Status"
                >
                  <option value="Pending">Pending</option>
                  <option value="At Mine">At Mine</option>
                  <option value="In Transit">In Transit</option>
                  <option value="At Border">At Border</option>
                  <option value="At Port">At Port</option>
                  <option value="At Port of Destination">At Port of Destination</option>
                  <option value="At Warehouse">At Warehouse</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="col-md-4">
                <label className="form-label">Value (USD)</label>
                <input
                  type="number"
                  className="form-control"
                  value={createForm.value}
                  onChange={e => setCreateForm(prev => ({ ...prev, value: e.target.value }))}
                  min="0"
                  step="0.01"
                  placeholder="Enter value (optional)"
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
                <label className="form-label">Environmental Incidents</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter any environmental incidents or special notes"
                  value={createForm.environmentalIncidents}
                  onChange={e => setCreateForm(prev => ({ ...prev, environmentalIncidents: e.target.value }))}
                  disabled={creating || !createForm.selectedBookingId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit button row: sticky and full-width on mobile */}
        <div className={`col-12 d-flex align-items-center gap-3${isMobile ? ' sticky-submit' : ''}`}>
          <button
            type="submit"
            className="btn btn-submit fw-bold"
            style={{
              padding: isMobile ? '0.9em 0' : '0.75rem 2rem',
              opacity: creating ? 0.7 : 1,
              cursor: creating ? 'not-allowed' : 'pointer',
              minWidth: isMobile ? '100%' : '180px',
              width: isMobile ? '100%' : undefined,
              fontSize: isMobile ? '1.1em' : '1rem'
            }}
            disabled={creating}
            aria-label="Dispatch load"
          >
            {creating ? <><FaSpinner className="me-2 fa-spin" /> Dispatching...</> : 'Dispatch Load'}
          </button>
          {createFeedback && (
            <div className={`alert alert-${createFeedback.includes('success') ? 'success' : 'danger'} mb-0 py-2 px-3`}>
              {createFeedback}
            </div>
          )}
        </div>
      </form>
    </>
  );
} 