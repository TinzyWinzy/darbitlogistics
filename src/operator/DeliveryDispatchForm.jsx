import { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';

// Simple InfoIcon component with tooltip
function InfoIcon({ text }) {
  return (
    <span
      tabIndex={0}
      style={{ marginLeft: 6, color: '#1976d2', cursor: 'pointer', fontSize: '1.1em', verticalAlign: 'middle' }}
      title={text}
      aria-label={text}
    >
      ℹ️
    </span>
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
    currentStatus: 'Pending', // <-- set default to 'Pending'
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
    value: '', // <-- add value field
    cost: ''   // <-- add cost field
  });
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');
  const [selectedCustomerBookings, setSelectedCustomerBookings] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    setIsMobile(mq.matches);
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
      value: '', // <-- add value field
      cost: ''   // <-- add cost field
    }));
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
      console.error('Invalid booking selection:', {
        selectedBookingId: createForm.selectedBookingId,
        availableIds: parentBookings.map(b => b.id)
      });
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
      value: createForm.value !== '' ? parseFloat(createForm.value) : 0, // <-- add value
      cost: createForm.cost !== '' ? parseFloat(createForm.cost) : 0     // <-- add cost
    };
    try {
      const res = await createDelivery(camelToSnake(deliveryData));
      if (res.success) {
        setCreateFeedback('Delivery dispatched successfully!');
        setToastMsg('Delivery dispatched successfully!');
        setToastType('success');
        setShowToast(true);
        setCreateForm({
          customerId: '',
          selectedBookingId: '',
          currentStatus: 'Pending', // <-- reset to 'Pending' after submit
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
          value: '', // <-- add value field
          cost: ''   // <-- add cost field
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
        @media (max-width: 700px) {
          .mobile-dispatch-form .form-label { font-size: 1.05em; }
          .mobile-dispatch-form .form-control, .mobile-dispatch-form .form-select, .mobile-dispatch-form textarea {
            font-size: 1.08em;
            min-height: 2.5em;
            padding: 0.7em 1em;
          }
          .mobile-dispatch-form .row.g-3 { gap: 0.5rem 0 !important; }
          .mobile-dispatch-form .col-md-4, .mobile-dispatch-form .col-md-3, .mobile-dispatch-form .col-12 { flex: 0 0 100%; max-width: 100%; }
          .mobile-dispatch-form .col-12.d-flex { flex-direction: column; gap: 0.5rem !important; }
          .mobile-dispatch-form .btn { width: 100%; font-size: 1.1em; padding: 0.9em 0; }
          .mobile-dispatch-form .sticky-submit { position: sticky; bottom: 0; background: #fff; z-index: 10; box-shadow: 0 -2px 8px rgba(31,33,32,0.07); padding-bottom: 1em; }
        }
      `}</style>
      {/* Toast/Snackbar Feedback */}
      {showToast && (
        <div className={`toast show position-fixed bottom-0 end-0 m-4 bg-${toastType}`} style={{zIndex:9999, minWidth: '220px'}} role="alert" aria-live="assertive" aria-atomic="true">
          <div className={`toast-header text-white bg-${toastType}`}> 
            <strong className="me-auto">{toastType === 'success' ? 'Success' : 'Error'}</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)} aria-label="Close"></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}
      <form onSubmit={handleSubmit} className={`row g-3 align-items-end${isMobile ? ' mobile-dispatch-form' : ''}`} autoComplete="off">
        <div className="col-md-4">
          <label className="form-label">
            <span className="fw-bold text-danger">*</span> Select Customer
            <InfoIcon text="Choose the client for this delivery. Customers are registered with their name and phone number." />
          </label>
          <select 
            className="form-select"
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
        </div>
        <div className="col-md-4">
          <label className="form-label">
            <span className="fw-bold text-danger">*</span> Select Consignment
            <InfoIcon text="A consignment (parent booking) groups multiple deliveries under one contract. Choose the relevant booking for this load." />
          </label>
          {/* In the dropdown, show only concise info */}
          <select 
            className="form-select"
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
        </div>
        {/* Show more meta for selected consignment below, similar to route */}
        {createForm.selectedBookingId && (() => {
          const selected = sortedCustomerBookings.find(b => (b.id || b.bookingCode || b.booking_code) === createForm.selectedBookingId);
          if (!selected) return null;
          const grade = selected.mineralGrade || selected.mineral_grade || '';
          const date = selected.bookingDate || selected.booking_date || '';
          const value = selected.value ? `₦${Number(selected.value).toLocaleString()}` : null;
          const cost = selected.cost ? `$${Number(selected.cost).toLocaleString()}` : null;
          return (
            <div className="col-12 mt-2 mb-2">
              <div className="alert alert-light p-2" style={{ borderLeft: '3px solid #1F2120' }}>
                <small className="text-muted d-block">
                  <strong>Route:</strong> {createForm.loadingPoint} &rarr; {createForm.destination}
                </small>
                <div className="mt-2" style={{ fontSize: '0.97em', color: '#444' }}>
                  <div><strong>Grade:</strong> {grade || <span className="text-muted">Not specified</span>}</div>
                  {date && <div><strong>Booked:</strong> {new Date(date).toLocaleDateString()}</div>}
                  {value && <div><strong>Value:</strong> {value}</div>}
                  {cost && <div><strong>Cost:</strong> {cost}</div>}
                </div>
              </div>
            </div>
          );
        })()}
        <div className="col-md-3">
          <label className="form-label">
            <span className="fw-bold text-danger">*</span> Tonnage
            <InfoIcon text="Weight of the load in metric tons." />
          </label>
          <input
            type="number"
            className="form-control"
            value={createForm.tonnage}
            onChange={e => setCreateForm(prev => ({ ...prev, tonnage: e.target.value }))}
            required
            aria-label="Tonnage"
            min={0.1}
            step={0.01}
            disabled={creating}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">
            <span className="fw-bold text-danger">*</span> Container Count
            <InfoIcon text="Number of containers for this load." />
          </label>
          <input
            type="number"
            className="form-control"
            value={createForm.containerCount}
            onChange={e => setCreateForm(prev => ({ ...prev, containerCount: e.target.value }))}
            required
            aria-label="Container count"
            min={1}
            step={1}
            disabled={creating}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">
            <span className="fw-bold text-danger">*</span> Driver Name
            <InfoIcon text="Name of the driver assigned to this load." />
          </label>
          <input
            type="text"
            className="form-control"
            value={createForm.driverDetails.name}
            onChange={e => setCreateForm(prev => ({ ...prev, driverDetails: { ...prev.driverDetails, name: e.target.value } }))}
            required
            aria-label="Driver name"
            disabled={creating}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">
            <span className="fw-bold text-danger">*</span> Vehicle Reg
            <InfoIcon text="Vehicle registration number." />
          </label>
          <input
            type="text"
            className="form-control"
            value={createForm.driverDetails.vehicleReg}
            onChange={e => setCreateForm(prev => ({ ...prev, driverDetails: { ...prev.driverDetails, vehicleReg: e.target.value } }))}
            required
            aria-label="Vehicle registration"
            disabled={creating}
          />
        </div>
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
          <label className="form-label">Cost (USD)</label>
          <input
            type="number"
            className="form-control"
            value={createForm.cost}
            onChange={e => setCreateForm(prev => ({ ...prev, cost: e.target.value }))}
            min="0"
            step="0.01"
            placeholder="Enter cost (required)"
            required
            disabled={creating || !createForm.selectedBookingId}
          />
        </div>
        {/* Submit button row: sticky and full-width on mobile */}
        <div className={`col-12 d-flex align-items-center gap-3${isMobile ? ' sticky-submit' : ''}`}>
          <button
            type="submit"
            className="btn fw-bold"
            style={{
              background: '#1F2120',
              color: '#EBD3AD',
              border: 'none',
              borderRadius: '0.5rem',
              padding: isMobile ? '0.9em 0' : '0.5rem 1.25rem',
              opacity: creating ? 0.7 : 1,
              cursor: creating ? 'not-allowed' : 'pointer',
              minWidth: isMobile ? '100%' : '160px',
              width: isMobile ? '100%' : undefined,
              fontSize: isMobile ? '1.1em' : undefined
            }}
            disabled={creating}
            aria-label="Dispatch load"
          >
            {creating ? <><FaSpinner className="me-2 fa-spin" /> Dispatching...</> : 'Dispatch Load'}
          </button>
          {createFeedback && <span className={`text-${createFeedback.includes('success') ? 'success' : 'danger'}`}>{createFeedback}</span>}
        </div>
      </form>
    </>
  );
} 