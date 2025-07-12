import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
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

export default function CheckpointLoggerForm({
  deliveries,
  user,
  onSubmitCheckpoint,
  onSuccess,
  onFeedback,
  selectedId,
  setSelectedId
}) {
  const [form, setForm] = useState({
    location: '',
    operator: user?.username || '',
    comment: '',
    status: '',
    coordinates: '',
    timestamp: '',
    hasIssue: false,
    issueDetails: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Set default timestamp on mount and reset
  useEffect(() => {
    setForm(f => ({ ...f, timestamp: new Date().toISOString().slice(0, 16) }));
  }, [selectedId]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');
    setSubmitting(true);
    setFieldErrors({});
    const delivery = deliveries.find(d => d.trackingId === selectedId);
    let errors = {};
    if (!delivery) {
      setFeedback('No delivery selected.');
      setSubmitting(false);
      return;
    }
    if (!form.location) {
      errors.location = 'Location is required.';
    }
    if (!form.status) {
      errors.status = 'Status is required.';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }
    const checkpoint = {
      location: form.location.trim(),
      status: form.status,
      operator_id: user.id,
      operator_username: user.username,
      comment: form.comment.trim(),
      timestamp: new Date(form.timestamp).toISOString(),
      coordinates: form.coordinates.trim(),
      hasIssue: form.hasIssue,
      issueDetails: form.hasIssue ? form.issueDetails.trim() : ''
    };
    try {
      await onSubmitCheckpoint(selectedId, checkpoint);
      setFeedback('Checkpoint logged successfully!');
      setForm({
        location: '',
        operator: user?.username || '',
        comment: '',
        status: '',
        coordinates: '',
        timestamp: new Date().toISOString().slice(0, 16),
        hasIssue: false,
        issueDetails: ''
      });
      setSelectedId && setSelectedId('');
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.response) {
        if (
          error.response.status === 403 &&
          (error.response.data?.quotaExceeded || error.response.data?.error?.toLowerCase().includes('subscription'))
        ) {
          setFeedback(
            error.response.data.error ||
            'You have no active subscription or have exceeded your SMS quota. Please contact support or upgrade your plan.'
          );
        } else if (error.response.status === 401) {
          setFeedback('Your session has expired. Please log in again.');
        } else {
          setFeedback(error.response.data?.error || 'Failed to update checkpoint');
        }
      } else {
        setFeedback('Failed to update checkpoint. Network or server error.');
      }
      if (onFeedback) onFeedback(error);
    }
    setSubmitting(false);
  };

  return (
    <div className="card shadow-sm border-0 mb-3 bg-light p-3">
      <div className="card-header bg-white d-flex align-items-center border-bottom pb-2 mb-2">
        <span className="material-icons-outlined me-2" style={{ color: '#1F2120' }}>edit_location_alt</span>
        <h5 className="mb-0 fw-bold" style={{ color: '#1F2120', fontSize: '1.08em' }}>Log Delivery Checkpoint</h5>
      </div>
      <form onSubmit={handleSubmit} className="row g-3" aria-label="Checkpoint Logger Form">
        <div className="col-md-6">
          <label htmlFor="locationInput" className="form-label fw-semibold">Location <span className="text-danger">*</span></label>
          <input
            type="text"
            className={`form-control${fieldErrors.location ? ' is-invalid' : ''}`}
            id="locationInput"
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            aria-required="true"
            autoComplete="off"
          />
          {fieldErrors.location && <div className="invalid-feedback">{fieldErrors.location}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="statusSelect" className="form-label fw-semibold">Status <span className="text-danger">*</span></label>
          <select
            className={`form-select${fieldErrors.status ? ' is-invalid' : ''}`}
            id="statusSelect"
            name="status"
            value={form.status}
            onChange={handleChange}
            required
            aria-required="true"
          >
            <option value="">Select status...</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {fieldErrors.status && <div className="invalid-feedback">{fieldErrors.status}</div>}
        </div>
        <div className="col-12">
          <label htmlFor="commentInput" className="form-label">Comment</label>
          <textarea
            className="form-control"
            id="commentInput"
            name="comment"
            value={form.comment}
            onChange={handleChange}
            rows={3}
            autoComplete="off"
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="coordinatesInput" className="form-label">Coordinates</label>
          <input
            type="text"
            className="form-control"
            id="coordinatesInput"
            name="coordinates"
            value={form.coordinates}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="timestampInput" className="form-label">Timestamp</label>
          <input
            type="datetime-local"
            className="form-control"
            id="timestampInput"
            name="timestamp"
            value={form.timestamp}
            onChange={handleChange}
          />
        </div>
        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="hasIssue"
              name="hasIssue"
              checked={form.hasIssue}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="hasIssue">
              Issue at this checkpoint?
            </label>
          </div>
        </div>
        {form.hasIssue && (
          <div className="col-12">
            <label htmlFor="issueDetailsInput" className="form-label">Issue Details</label>
            <textarea
              className="form-control"
              id="issueDetailsInput"
              name="issueDetails"
              value={form.issueDetails}
              onChange={handleChange}
              rows={2}
            />
          </div>
        )}
        <div className="col-12 mt-2">
          <button
            type="submit"
            className="btn fw-bold w-100"
            style={{ background: '#1F2120', color: '#EBD3AD', fontSize: '1.08rem', boxShadow: '0 2px 8px rgba(31,33,32,0.08)', padding: '0.5em 0.7em' }}
            disabled={submitting}
            aria-label="Log Checkpoint"
          >
            {submitting ? (
              <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Logging...</span>
            ) : (
              <span><span className="material-icons-outlined align-middle me-2">add_location_alt</span>Log Checkpoint</span>
            )}
          </button>
        </div>
        {feedback && (
          <div
            className={`mt-2 alert ${feedback.includes('success') ? 'alert-success' : 'alert-danger'} d-flex align-items-center`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <span className="material-icons-outlined me-2" style={{ fontSize: '1.15rem' }}>
              {feedback.includes('success') ? 'check_circle' : 'error_outline'}
            </span>
            <span>{feedback}</span>
          </div>
        )}
      </form>
    </div>
  );
} 