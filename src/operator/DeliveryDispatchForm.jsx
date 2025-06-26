import { useState } from 'react';

export default function DeliveryDispatchForm({
  customers,
  parentBookings,
  selectedCustomerId,
  selectedCustomerBookings,
  onCustomerSelect,
  createDelivery,
  fetchParentBookings,
  onSuccess,
  onFeedback,
  onReset
}) {
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
    setCreating(true);
    setCreateFeedback('');
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
      samplingStatus: createForm.samplingStatus || 'Not Sampled'
    };
    try {
      const res = await createDelivery(camelToSnake(deliveryData));
      if (res.success) {
        setCreateFeedback('Delivery created successfully!');
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
        if (onReset) onReset();
        if (fetchParentBookings) await fetchParentBookings();
        if (onSuccess) onSuccess(res);
      }
    } catch (error) {
      // Sentinel Zero: Handle quota/subscription errors gracefully
      if (error.response) {
        if (error.response.status === 403 && (error.response.data?.quotaExceeded || error.response.data?.error?.toLowerCase().includes('subscription'))) {
          setCreateFeedback(
            error.response.data.error ||
            'You have no active subscription or have exceeded your delivery quota. Please contact support or upgrade your plan.'
          );
        } else if (error.response.status === 401) {
          setCreateFeedback('Your session has expired. Please log in again.');
        } else {
          setCreateFeedback(error.response.data?.error || 'Failed to create delivery');
        }
      } else {
        setCreateFeedback('Failed to create delivery. Network or server error.');
      }
      if (onFeedback) onFeedback(error);
    }
    setCreating(false);
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3 align-items-end" autoComplete="off">
      <div className="col-md-4">
        <label className="form-label">Select Customer *</label>
        <select 
          className="form-select"
          value={selectedCustomerId}
          onChange={(e) => {
            onCustomerSelect(e.target.value);
            setCreateForm(prev => ({
              ...prev,
              customerId: e.target.value,
              selectedBookingId: '',
              tonnage: '',
              containerCount: '',
              vehicleType: 'Standard Truck',
              vehicleCapacity: 30.00,
              driverDetails: { name: '', vehicleReg: '' },
              loadingPoint: '',
              destination: '',
              environmentalIncidents: '',
              samplingStatus: ''
            }));
          }}
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
          onChange={(e) => {
            setCreateForm(prev => ({ ...prev, selectedBookingId: e.target.value }));
            handleBookingSelect(e.target.value);
          }}
          disabled={creating || !selectedCustomerId}
          required
        >
          <option value="">Choose consignment...</option>
          {selectedCustomerBookings.map((booking, idx) => (
            <option key={booking.id || idx} value={booking.id}>
              {booking.bookingCode} - {booking.mineral_type} ({booking.mineral_grade}) - {booking.remainingTonnage} tons available
            </option>
          ))}
        </select>
      </div>
      {createForm.selectedBookingId && (
        <div className="col-12 mt-2 mb-2">
          <div className="alert alert-light p-2" style={{ borderLeft: '3px solid #1F2120' }}>
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
          style={{ background: '#1F2120', border: 'none', color: '#EBD3AD' }} 
          disabled={creating || !createForm.selectedBookingId}
          aria-label="Dispatch load"
        >
          {creating ? 'Creating...' : 'Dispatch Load'}
        </button>
      </div>
      {createFeedback && (
        <div className={`mt-3 alert ${createFeedback.includes('success') ? 'alert-success' : 'alert-danger'}`}>
          {createFeedback}
        </div>
      )}
    </form>
  );
} 