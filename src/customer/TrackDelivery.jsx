import { useState } from 'react';
import { deliveryApi } from '../services/api';

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

// Status Badge component
function StatusBadge({ status }) {
  return (
    <span className="badge rounded-pill" style={{ background: '#D2691E', color: '#fff' }}>
      {status}
    </span>
  );
}

// Status legend/info section
function StatusLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button
        className="btn btn-link p-0 align-baseline"
        style={{ color: '#1976d2', fontWeight: 500, textDecoration: 'underline', fontSize: '1em' }}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="status-legend"
        type="button"
      >
        <span role="img" aria-label="info">ℹ️</span> What do the statuses mean?
      </button>
      {open && (
        <div id="status-legend" className="card card-body mt-2" style={{ background: '#fffbe6', borderLeft: '4px solid #D2691E' }}>
          <ul className="mb-2" style={{ paddingLeft: 18 }}>
            <li><b>Pending</b>: Delivery is scheduled but not yet dispatched.</li>
            <li><b>At Mine</b>: Cargo is at the mine or origin point.</li>
            <li><b>In Transit</b>: Cargo is on the move to the next checkpoint.</li>
            <li><b>At Border</b>: Cargo is at a border crossing for customs clearance.</li>
            <li><b>At Port</b>: Cargo has reached the port for export/import.</li>
            <li><b>At Port of Destination</b>: Cargo has arrived at the destination port.</li>
            <li><b>At Warehouse</b>: Cargo is in storage at a warehouse.</li>
            <li><b>Delivered</b>: Delivery is complete and received by the customer.</li>
            <li><b>Cancelled</b>: Delivery was cancelled.</li>
          </ul>
          <div className="small text-muted">
            <b>Lost your tracking code?</b> Contact your operator or Morres Logistics support at <a href="mailto:marketing@morreslogistics.com">marketing@morreslogistics.com</a> to retrieve it.
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackDelivery() {
  const [trackingId, setTrackingId] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    setError('');
    setDelivery(null);

    try {
      const data = await deliveryApi.getById(trackingId);
      setDelivery(data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to find delivery');
      setDelivery(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const renderIcon = () => {
    if (!delivery) return null;
    if (delivery.currentStatus === 'Delivered') {
      return <span className="material-icons-outlined" style={{ color: '#198754', fontSize: '4rem' }}>task_alt</span>;
    }
    return <span className="material-icons-outlined" style={{ color: '#1F2120', fontSize: '4rem' }}>local_shipping</span>;
  };

  return (
    <div className="bg-gradient" style={{ minHeight: '90vh', background: 'linear-gradient(135deg, #EBD3AD 0%, #fffbe6 100%)' }} role="main">
      <div className="container py-5">
        <h1 className="display-6 fw-bold text-center mb-1" style={{ color: '#1F2120' }}>
          Track Your Consignment
        </h1>
        {/* Subtle Internal Use Only subtitle */}
        <div className="text-center text-warning small fw-semibold mb-3" style={{ letterSpacing: '0.5px', fontSize: '1em', opacity: 0.7 }}>
          Internal Use Only
        </div>
        <div className="d-flex justify-content-center mb-3">
          <StatusLegend />
        </div>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  {renderIcon()}
                  <p className="text-muted" style={{ fontSize: '1.08em' }}>Enter your tracking ID to see delivery status and updates</p>
                </div>

                <form onSubmit={handleSubmit} className="mb-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0" id="trackingId-label">
                      <span className="material-icons-outlined me-2">local_shipping</span>
                    </span>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                      placeholder="Enter tracking ID (e.g., ABC1234)"
                      className="form-control border-start-0"
                      maxLength="7"
                      style={{ boxShadow: 'none', fontSize: '1.08em', letterSpacing: '0.05em' }}
                      aria-label="Tracking ID"
                      aria-describedby="trackingId-label"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn text-white px-4"
                      style={{ background: '#1F2120', fontWeight: 500, fontSize: '1.08em' }}
                      aria-label="Track consignment"
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      ) : (
                        <span className="material-icons-outlined me-2">search</span>
                      )}
                      {loading ? 'Tracking...' : 'Track'}
                    </button>
                  </div>
                </form>

                {/* Internal Support Contact */}
                <div className="text-center text-muted small mb-4">
                  For delivery issues, contact: <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
                </div>
                {/* Operator/Internal Notes Placeholder */}
                <div className="card border-0 shadow-sm mb-4" style={{ background: '#fffbe6' }}>
                  <div className="card-body p-3">
                    <strong>Operator/Internal Notes:</strong>
                    <div className="text-muted small">(For internal updates, escalation, or comments. Coming soon.)</div>
                  </div>
                </div>

                {delivery && (
                  <div className="card shadow-sm mt-4 border-0" aria-live="polite">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h2 className="h5 mb-0" style={{ color: '#1F2120', fontWeight: 700, letterSpacing: '0.01em' }}>
                        <span className="material-icons-outlined align-middle me-2">receipt_long</span>
                        Tracking ID: {delivery.trackingId}
                      </h2>
                      <StatusBadge status={delivery.currentStatus} />
                    </div>
                    <div className="card-body">
                      {/* Consignment Details */}
                      <h3 className="h6 fw-bold mb-2" style={{ color: '#1F2120', letterSpacing: '0.01em' }}>Consignment Details</h3>
                      <div className="row text-muted small mb-3" style={{ fontSize: '1.05em' }}>
                        <div className="col-md-6 mb-2"><strong>Customer:</strong> {delivery.customerName}</div>
                        <div className="col-md-6 mb-2"><strong>Booking Ref:</strong> {delivery.bookingReference}</div>
                        <div className="col-md-6 mb-2"><strong>Route:</strong> {delivery.loadingPoint} &rarr; {delivery.destination}</div>
                        {(delivery.mineralType || delivery.mineralGrade) && (
                          <div className="col-md-6 mb-2"><strong>Mineral:</strong> {delivery.mineralType || 'N/A'}{delivery.mineralGrade ? ` (${delivery.mineralGrade})` : ''}</div>
                        )}
                        {!(delivery.mineralType || delivery.mineralGrade) && (
                          <div className="col-md-6 mb-2"><strong>Mineral:</strong> N/A</div>
                        )}
                        <div className="col-md-6 mb-2"><strong>Tonnage:</strong> {delivery.tonnage} tons</div>
                        <div className="col-md-6 mb-2"><strong>Container Count:</strong> {delivery.containerCount}</div>
                        {delivery.samplingStatus && (
                          <div className="col-md-6 mb-2"><strong>Sampling Status:</strong> {delivery.samplingStatus}</div>
                        )}
                      </div>

                      {/* Vehicle & Driver Details */}
                      <h3 className="h6 fw-bold mb-2" style={{ color: '#1F2120', letterSpacing: '0.01em' }}>Vehicle & Driver</h3>
                      <div className="row text-muted small mb-3" style={{ fontSize: '1.05em' }}>
                        {delivery.driverDetails && (
                          <>
                            <div className="col-md-6 mb-2"><strong>Driver:</strong> {delivery.driverDetails.name}</div>
                            <div className="col-md-6 mb-2"><strong>Vehicle Reg:</strong> {delivery.driverDetails.vehicleReg}</div>
                          </>
                        )}
                        <div className="col-md-6 mb-2"><strong>Vehicle Type:</strong> {delivery.vehicleType}</div>
                      </div>

                      {/* Environmental Incidents */}
                      {delivery.environmental_incidents && (
                        <>
                          <h3 className="h6 fw-bold" style={{ color: '#dc3545' }}>Important Updates</h3>
                          <div className="alert alert-danger p-2">
                            <strong className="d-block">Environmental Incident Reported:</strong>
                            <span className="small">{delivery.environmental_incidents}</span>
                          </div>
                        </>
                      )}
                      <hr />

                      <h3 className="h6 mt-4 fw-bold mb-3" style={{ color: '#1F2120', letterSpacing: '0.01em' }}>Tracking History</h3>
                      {delivery.checkpoints && delivery.checkpoints.length > 0 ? (
                        <div className="timeline-container mt-3" style={{ position: 'relative', paddingLeft: 24, borderLeft: '3px solid #D2691E' }}>
                          {delivery.checkpoints.slice().reverse().map((cp, index) => {
                            // Determine status color/icon
                            let dotColor = '#D2691E';
                            let icon = 'radio_button_unchecked';
                            if (cp.status === delivery.currentStatus) {
                              dotColor = '#1976d2';
                              icon = 'fiber_manual_record';
                            } else if (cp.status === 'Delivered') {
                              dotColor = '#198754';
                              icon = 'check_circle';
                            } else if (cp.hasIssue) {
                              dotColor = '#ffc107';
                              icon = 'warning';
                            }
                            return (
                              <div className="timeline-item d-flex mb-4" key={index} style={{ alignItems: 'flex-start', position: 'relative' }}>
                                <span className="material-icons-outlined" style={{ color: dotColor, fontSize: '2rem', position: 'absolute', left: -32, top: 0 }}>{icon}</span>
                                <div className="timeline-content flex-grow-1 ms-3" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(31,33,32,0.04)', padding: '0.7em 1em', minWidth: 0 }}>
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <strong className="text-dark" style={{ fontSize: '1.08em' }}>{cp.status}</strong>
                                    <small className="text-muted" style={{ fontSize: '0.98em' }}>{formatDate(cp.timestamp)}</small>
                                  </div>
                                  <div className="mb-1" style={{ fontSize: '1.02em' }}>{cp.location}</div>
                                  {cp.comment && (
                                    <p className="text-muted small mb-1 fst-italic">"{cp.comment}"</p>
                                  )}
                                  {cp.hasIssue && (
                                    <div className="alert alert-warning p-2 mt-2 mb-0">
                                      <strong className="d-block">
                                        <span className="material-icons-outlined align-middle small me-1">warning</span>
                                        Issue Reported:
                                      </strong>
                                      <span className="small">{cp.issueDetails}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-muted mt-3">No tracking history available yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 