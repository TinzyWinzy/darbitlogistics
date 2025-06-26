import { useState } from 'react';

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
    timestamp: new Date(),
    hasIssue: false,
    issueDetails: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

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

  const statusIcons = {
    'Pending': 'hourglass_empty',
    'At Mine': 'terrain',
    'In Transit': 'local_shipping',
    'At Border': 'flag',
    'At Port': 'anchor',
    'At Port of Destination': 'location_on',
    'At Warehouse': 'warehouse',
    'Delivered': 'check_circle',
    'Cancelled': 'cancel',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback('');
    setSubmitting(true);
    const delivery = deliveries.find(d => d.trackingId === selectedId);
    if (!delivery) {
      setFeedback('No delivery selected.');
      setSubmitting(false);
      return;
    }
    if (!form.location || !form.status) {
      setFeedback('Location and Status are required.');
      setSubmitting(false);
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
    try {
      await onSubmitCheckpoint(selectedId, checkpoint);
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
      setSelectedId && setSelectedId('');
      if (onSuccess) onSuccess();
    } catch (error) {
      // Sentinel Zero: Handle quota/subscription errors gracefully
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
    <div className="card shadow-sm border-0 mb-3" style={{ background: '#f8f9fa' }}>
      <div className="card-header bg-light d-flex align-items-center" style={{ borderBottom: '1px solid #eee' }}>
        <span className="material-icons-outlined me-2" style={{ color: '#1F2120' }}>edit_location_alt</span>
        <h5 className="mb-0 fw-bold" style={{ color: '#1F2120' }}>Log Delivery Checkpoint</h5>
      </div>
      <form onSubmit={handleSubmit} className="card-body row g-4" aria-label="Checkpoint Logger Form">
        <div className="col-12 col-md-6">
          <div className="form-floating mb-2">
            <input
              type="text"
              className="form-control"
              id="locationInput"
              placeholder="Location"
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
              required
              aria-required="true"
            />
            <label htmlFor="locationInput">Location *</label>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="form-floating mb-2">
            <select
              className="form-select"
              id="statusSelect"
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              required
              aria-required="true"
            >
              <option value="">Select status...</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <label htmlFor="statusSelect">Status *</label>
            {form.status && (
              <span className="position-absolute top-50 end-0 translate-middle-y me-3" style={{ pointerEvents: 'none' }}>
                <span className="material-icons-outlined" style={{ color: '#D2691E' }}>{statusIcons[form.status]}</span>
              </span>
            )}
          </div>
        </div>
        <div className="col-12">
          <div className="form-floating mb-2">
            <textarea
              className="form-control"
              id="commentInput"
              placeholder="Comment"
              value={form.comment}
              onChange={e => setForm(prev => ({ ...prev, comment: e.target.value }))}
              style={{ minHeight: '60px' }}
            />
            <label htmlFor="commentInput">Comment</label>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="form-floating mb-2">
            <input
              type="text"
              className="form-control"
              id="coordinatesInput"
              placeholder="Coordinates"
              value={form.coordinates}
              onChange={e => setForm(prev => ({ ...prev, coordinates: e.target.value }))}
            />
            <label htmlFor="coordinatesInput">Coordinates</label>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="form-floating mb-2">
            <input
              type="datetime-local"
              className="form-control"
              id="timestampInput"
              placeholder="Timestamp"
              value={form.timestamp.toISOString().slice(0,16)}
              onChange={e => setForm(prev => ({ ...prev, timestamp: new Date(e.target.value) }))}
            />
            <label htmlFor="timestampInput">Timestamp</label>
          </div>
        </div>
        <div className="col-12">
          <div className="form-check d-flex align-items-center mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="hasIssue"
              checked={form.hasIssue}
              onChange={e => setForm(prev => ({ ...prev, hasIssue: e.target.checked }))}
              aria-describedby="hasIssueHelp"
            />
            <label className="form-check-label ms-2" htmlFor="hasIssue">
              Issue at this checkpoint?
            </label>
            <span className="material-icons-outlined ms-2 text-muted" style={{ fontSize: '1.1rem' }} title="Check if there was a problem or delay at this checkpoint." aria-label="Info">info</span>
          </div>
        </div>
        {form.hasIssue && (
          <div className="col-12">
            <div className="form-floating mb-2">
              <textarea
                className="form-control"
                id="issueDetailsInput"
                placeholder="Issue Details"
                value={form.issueDetails}
                onChange={e => setForm(prev => ({ ...prev, issueDetails: e.target.value }))}
                style={{ minHeight: '60px' }}
              />
              <label htmlFor="issueDetailsInput">Issue Details</label>
            </div>
          </div>
        )}
        <div className="col-12 mt-2">
          <button
            type="submit"
            className="btn fw-bold w-100"
            style={{ background: '#1F2120', color: '#EBD3AD', fontSize: '1.15rem', boxShadow: '0 2px 8px rgba(31,33,32,0.08)' }}
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
          <div className={`mt-3 alert ${feedback.includes('success') ? 'alert-success' : 'alert-danger'} d-flex align-items-center`} role="alert">
            <span className="material-icons-outlined me-2" style={{ fontSize: '1.3rem' }}>
              {feedback.includes('success') ? 'check_circle' : 'error_outline'}
            </span>
            <span>{feedback}</span>
          </div>
        )}
      </form>
    </div>
  );
} 