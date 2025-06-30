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
    <div className="card shadow-sm border-0 mb-3" style={{ background: '#f8f9fa', padding: '0.7rem 0.5rem' }}>
      <div className="card-header bg-light d-flex align-items-center" style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0.7rem' }}>
        <span className="material-icons-outlined me-2" style={{ color: '#1F2120' }}>edit_location_alt</span>
        <h5 className="mb-0 fw-bold" style={{ color: '#1F2120', fontSize: '1.08em' }}>Log Delivery Checkpoint</h5>
      </div>
      <form onSubmit={handleSubmit} className="card-body row g-3" aria-label="Checkpoint Logger Form" style={{ padding: '0.7rem 0.5rem' }}>
        <div className="col-12 col-md-6">
          <div className="form-floating mb-1">
            <input
              type="text"
              className="form-control"
              id="locationInput"
              placeholder="Location"
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
              required
              aria-required="true"
              style={{ fontSize: '0.97em', padding: '0.5em 0.7em' }}
            />
            <label htmlFor="locationInput" style={{ fontSize: '0.95em' }}>Location *</label>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="form-floating mb-1">
            <select
              className="form-select"
              id="statusSelect"
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              required
              aria-required="true"
              style={{ fontSize: '0.97em', padding: '0.5em 0.7em' }}
            >
              <option value="">Select status...</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <label htmlFor="statusSelect" style={{ fontSize: '0.95em' }}>Status *</label>
            {form.status && (
              <span className="position-absolute top-50 end-0 translate-middle-y me-3" style={{ pointerEvents: 'none' }}>
                <span className="material-icons-outlined" style={{ color: '#D2691E' }}>{statusIcons[form.status]}</span>
              </span>
            )}
          </div>
        </div>
        <div className="col-12">
          <div className="form-floating mb-1">
            <textarea
              className="form-control"
              id="commentInput"
              placeholder="Comment"
              value={form.comment}
              onChange={e => setForm(prev => ({ ...prev, comment: e.target.value }))}
              style={{ minHeight: '54px', fontSize: '0.97em', padding: '0.5em 0.7em' }}
            />
            <label htmlFor="commentInput" style={{ fontSize: '0.95em' }}>Comment</label>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="form-floating mb-1">
            <input
              type="text"
              className="form-control"
              id="coordinatesInput"
              placeholder="Coordinates"
              value={form.coordinates}
              onChange={e => setForm(prev => ({ ...prev, coordinates: e.target.value }))}
              style={{ fontSize: '0.97em', padding: '0.5em 0.7em' }}
            />
            <label htmlFor="coordinatesInput" style={{ fontSize: '0.95em' }}>Coordinates</label>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="form-floating mb-1">
            <input
              type="datetime-local"
              className="form-control"
              id="timestampInput"
              placeholder="Timestamp"
              value={form.timestamp.toISOString().slice(0,16)}
              onChange={e => setForm(prev => ({ ...prev, timestamp: new Date(e.target.value) }))}
              style={{ fontSize: '0.97em', padding: '0.5em 0.7em' }}
            />
            <label htmlFor="timestampInput" style={{ fontSize: '0.95em' }}>Timestamp</label>
          </div>
        </div>
        <div className="col-12">
          <div className="form-check d-flex align-items-center mb-1" style={{ fontSize: '0.96em' }}>
            <input
              className="form-check-input"
              type="checkbox"
              id="hasIssue"
              checked={form.hasIssue}
              onChange={e => setForm(prev => ({ ...prev, hasIssue: e.target.checked }))}
              aria-describedby="hasIssueHelp"
            />
            <label className="form-check-label ms-2" htmlFor="hasIssue" style={{ fontSize: '0.95em' }}>
              Issue at this checkpoint?
            </label>
            <span className="material-icons-outlined ms-2 text-muted" style={{ fontSize: '1.05rem' }} title="Check if there was a problem or delay at this checkpoint." aria-label="Info">info</span>
          </div>
        </div>
        {form.hasIssue && (
          <div className="col-12">
            <div className="form-floating mb-1">
              <textarea
                className="form-control"
                id="issueDetailsInput"
                placeholder="Issue Details"
                value={form.issueDetails}
                onChange={e => setForm(prev => ({ ...prev, issueDetails: e.target.value }))}
                style={{ minHeight: '54px', fontSize: '0.97em', padding: '0.5em 0.7em' }}
              />
              <label htmlFor="issueDetailsInput" style={{ fontSize: '0.95em' }}>Issue Details</label>
            </div>
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
            style={{ fontSize: '0.97em', padding: '0.5em 0.7em' }}
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
      <style>{`
        .form-control, .form-select, .btn, .form-check-input {
          border-radius: 5px !important;
          border-color: #D2691E !important;
        }
        .form-control:focus-visible, .form-select:focus-visible, .btn:focus-visible, .form-check-input:focus-visible {
          outline: 2px solid #D2691E !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 2px #EBD3AD !important;
          z-index: 2;
        }
        .form-floating > label {
          color: #7c6a4d !important;
        }
        .btn:disabled, .btn[disabled] {
          background: #e5e1db !important;
          color: #bbb !important;
          border-color: #D2691E !important;
        }
        @media (max-width: 600px) {
          .card-body.row.g-3 {
            padding: 0.5rem 0.2rem !important;
          }
          .form-floating {
            margin-bottom: 0.7rem !important;
          }
          .btn.w-100 {
            font-size: 1rem !important;
            padding: 0.5em 0.5em !important;
          }
        }
        .btn.w-100:not(:disabled):hover, .btn.w-100:not(:disabled):focus-visible {
          background: #D2691E !important;
          color: #fff !important;
          box-shadow: 0 2px 8px rgba(210,105,30,0.13) !important;
          border-color: #D2691E !important;
        }
      `}</style>
    </div>
  );
} 