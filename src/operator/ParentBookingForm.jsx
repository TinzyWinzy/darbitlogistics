import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function ParentBookingForm({
  show,
  onClose,
  onSuccess,
  createParentBooking,
  mineralTypes,
  mineralLocations
}) {
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
  const [suggestedLocations, setSuggestedLocations] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');

  const handleParentFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParentForm(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'mineral_type') {
        const locations = mineralLocations[value] || [];
        setSuggestedLocations(locations);
        newState.loadingPoint = locations.length > 0 ? locations[0] : '';
      }
      return newState;
    });
  };

  function validateZimPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return (
      cleaned.length === 9 && cleaned.startsWith('7') ||
      cleaned.length === 10 && cleaned.startsWith('07') ||
      cleaned.length === 12 && cleaned.startsWith('2637') ||
      cleaned.length === 13 && cleaned.startsWith('2637')
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateFeedback('');
    let formattedPhone = parentForm.phoneNumber;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '263' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7')) {
      formattedPhone = '263' + formattedPhone;
    }
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
    try {
      const res = await createParentBooking(parentBookingData);
      setCreateFeedback(res.success ? 'Consignment logged successfully!' : 'Submission complete.');
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
      setSuggestedLocations([]);
      if (onSuccess) onSuccess(res);
      if (onClose) onClose();
    } catch (error) {
      setCreateFeedback(error.response?.data?.error || 'Failed to create parent booking');
    }
    setCreating(false);
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3" autoComplete="off">
      <div className="col-md-6">
        <label className="form-label">Customer Name <span className="required-asterisk">*</span></label>
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
        <label className="form-label">Phone Number <span className="required-asterisk">*</span></label>
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
        <label className="form-label">Mineral Type <span className="required-asterisk">*</span></label>
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
        <label className="form-label">Total Tonnage <span className="required-asterisk">*</span></label>
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
        <label className="form-label">Deadline <span className="required-asterisk">*</span></label>
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
        <label className="form-label">Loading Point <span className="required-asterisk">*</span></label>
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
        <label className="form-label">Destination <span className="required-asterisk">*</span></label>
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
          style={{ background: '#1F2120', border: 'none', color: '#EBD3AD' }}
          disabled={creating}
          aria-label="Log consignment"
        >
          {creating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating...
            </>
          ) : 'Log Consignment'}
        </button>
      </div>
      {createFeedback && (
        <div className={`mt-3 alert ${createFeedback.includes('success') ? 'alert-success' : 'alert-danger'}`}>
          {createFeedback}
        </div>
      )}
      <style>{`
        .required-asterisk {
          color: #D2691E;
          font-weight: bold;
          margin-left: 0.1em;
        }
      `}</style>
    </form>
  );
} 