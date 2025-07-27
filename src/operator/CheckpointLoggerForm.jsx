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
    operatorId: user?.id || '',
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
    if (!form.operatorId) {
      errors.operatorId = 'Operator is required.';
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
      operator_id: user?.id || '', // Always use user.id as operatorId
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
        operatorId: user?.id || '',
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
    <div className="modern-card slide-up" onClick={e => e.stopPropagation()}>
      <div className="modern-card-header d-flex align-items-center">
        <span className="material-icons-outlined me-2" style={{ color: 'var(--brand-primary)' }}>edit_location_alt</span>
        <h5 className="mb-0 fw-bold" style={{ color: 'var(--brand-primary)', fontSize: '1.1em' }}>
          Log Delivery Checkpoint
        </h5>
      </div>
      
      <div className="modern-card-body">
        <form onSubmit={handleSubmit} className="row g-4" aria-label="Checkpoint Logger Form">
          {/* Location Input */}
          <div className="col-md-6">
            <label htmlFor="locationInput" className="modern-form-label">
              Location <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`modern-form-control${fieldErrors.location ? ' is-invalid' : ''}`}
              id="locationInput"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              aria-required="true"
              autoComplete="off"
              placeholder="Enter checkpoint location"
            />
            {fieldErrors.location && (
              <div className="invalid-feedback">{fieldErrors.location}</div>
            )}
          </div>

          {/* Status Select */}
          <div className="col-md-6">
            <label htmlFor="statusSelect" className="modern-form-label">
              Status <span className="text-danger">*</span>
            </label>
            <select
              className={`modern-form-control${fieldErrors.status ? ' is-invalid' : ''}`}
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
            {fieldErrors.status && (
              <div className="invalid-feedback">{fieldErrors.status}</div>
            )}
          </div>

          {/* Operator Input */}
          <div className="col-md-6">
            <label htmlFor="operatorSelect" className="modern-form-label">
              Operator <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="modern-form-control"
              id="operatorSelect"
              name="operatorId"
              value={user?.username || ''}
              onChange={handleChange}
              disabled
              aria-disabled="true"
              style={{ backgroundColor: 'var(--gray-100)' }}
            />
            {fieldErrors.operatorId && (
              <div className="invalid-feedback">{fieldErrors.operatorId}</div>
            )}
          </div>

          {/* Coordinates Input */}
          <div className="col-md-6">
            <label htmlFor="coordinatesInput" className="modern-form-label">
              Coordinates
            </label>
            <input
              type="text"
              className="modern-form-control"
              id="coordinatesInput"
              name="coordinates"
              value={form.coordinates}
              onChange={handleChange}
              autoComplete="off"
              placeholder="Latitude, Longitude (optional)"
            />
          </div>

          {/* Timestamp Input */}
          <div className="col-md-6">
            <label htmlFor="timestampInput" className="modern-form-label">
              Timestamp
            </label>
            <input
              type="datetime-local"
              className="modern-form-control"
              id="timestampInput"
              name="timestamp"
              value={form.timestamp}
              onChange={handleChange}
            />
          </div>

          {/* Issue Checkbox */}
          <div className="col-12">
            <div className="modern-card p-3" style={{ backgroundColor: 'var(--gray-50)' }}>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasIssue"
                  name="hasIssue"
                  checked={form.hasIssue}
                  onChange={handleChange}
                />
                <label className="form-check-label fw-semibold" htmlFor="hasIssue">
                  <span className="material-icons-outlined me-2" style={{ color: 'var(--warning)' }}>warning</span>
                  Report an issue at this checkpoint?
                </label>
              </div>
            </div>
          </div>

          {/* Issue Details */}
          {form.hasIssue && (
            <div className="col-12 slide-up">
              <label htmlFor="issueDetailsInput" className="modern-form-label">
                Issue Details <span className="text-danger">*</span>
              </label>
              <textarea
                className="modern-form-control"
                id="issueDetailsInput"
                name="issueDetails"
                value={form.issueDetails}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the issue in detail..."
                required={form.hasIssue}
              />
            </div>
          )}

          {/* Comment Input */}
          <div className="col-12">
            <label htmlFor="commentInput" className="modern-form-label">
              Additional Comments
            </label>
            <textarea
              className="modern-form-control"
              id="commentInput"
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={3}
              autoComplete="off"
              placeholder="Add any additional notes or observations..."
            />
          </div>

          {/* Submit Button */}
          <div className="col-12">
            <button
              type="submit"
              className="btn-modern btn-modern-primary w-100"
              disabled={submitting}
              aria-label="Log Checkpoint"
            >
              {submitting ? (
                <>
                  <div className="modern-loading me-2" role="status" aria-hidden="true"></div>
                  Logging Checkpoint...
                </>
              ) : (
                <>
                  <span className="material-icons-outlined">add_location_alt</span>
                  Log Checkpoint
                </>
              )}
            </button>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className="col-12">
              <div
                className={`alert ${feedback.includes('success') ? 'alert-success' : 'alert-danger'} modern-card d-flex align-items-center`}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                <span className="material-icons-outlined me-2" style={{ fontSize: '1.2rem' }}>
                  {feedback.includes('success') ? 'check_circle' : 'error_outline'}
                </span>
                <span>{feedback}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 