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
    return <span className="material-icons-outlined" style={{ color: '#D2691E', fontSize: '4rem' }}>local_shipping</span>;
  };

  return (
    <div className="bg-gradient" style={{ minHeight: '90vh', background: 'linear-gradient(135deg, #e88a3a 0%, #fffbe6 100%)' }}>
      <div className="container py-5">
        <h1 className="display-6 fw-bold text-center mb-4" style={{ color: '#D2691E' }}>
          Track Your Consignment
        </h1>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  {renderIcon()}
                  <p className="text-muted">Enter your tracking ID to see delivery status and updates</p>
                </div>

                <form onSubmit={handleSubmit} className="mb-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <span className="material-icons-outlined me-2">local_shipping</span>
                    </span>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                      placeholder="Enter tracking ID (e.g., ABC1234)"
                      className="form-control border-start-0"
                      maxLength="7"
                      style={{ boxShadow: 'none' }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn text-white px-4"
                      style={{ background: '#D2691E' }}
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

                {delivery && (
                  <div className="card shadow-sm mt-4 border-0">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h2 className="h5 mb-0" style={{ color: '#a14e13' }}>
                        <span className="material-icons-outlined align-middle me-2">receipt_long</span>
                        Tracking ID: {delivery.trackingId}
                      </h2>
                      <StatusBadge status={delivery.currentStatus} />
                    </div>
                    <div className="card-body">
                      {/* Consignment Details */}
                      <h3 className="h6 fw-bold" style={{ color: '#a14e13' }}>Consignment Details</h3>
                      <div className="row text-muted small mb-3">
                        <div className="col-md-6 mb-2"><strong>Customer:</strong> {delivery.customerName}</div>
                        <div className="col-md-6 mb-2"><strong>Booking Ref:</strong> {delivery.bookingReference}</div>
                        <div className="col-md-6 mb-2"><strong>Route:</strong> {delivery.loadingPoint} &rarr; {delivery.destination}</div>
                        <div className="col-md-6 mb-2"><strong>Mineral:</strong> {delivery.mineralType} ({delivery.mineralGrade})</div>
                        <div className="col-md-6 mb-2"><strong>Tonnage:</strong> {delivery.tonnage} tons</div>
                        <div className="col-md-6 mb-2"><strong>Container Count:</strong> {delivery.containerCount}</div>
                        {delivery.samplingStatus && (
                          <div className="col-md-6 mb-2"><strong>Sampling Status:</strong> {delivery.samplingStatus}</div>
                        )}
                      </div>

                      {/* Vehicle & Driver Details */}
                      <h3 className="h6 fw-bold" style={{ color: '#a14e13' }}>Vehicle & Driver</h3>
                      <div className="row text-muted small mb-3">
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

                      <h3 className="h6 mt-4 fw-bold" style={{ color: '#a14e13' }}>Tracking History</h3>
                      {delivery.checkpoints && delivery.checkpoints.length > 0 ? (
                        <div className="timeline-container mt-3">
                          {delivery.checkpoints.slice().reverse().map((cp, index) => (
                            <div className="timeline-item" key={index}>
                              <div className="timeline-dot"></div>
                              <div className="timeline-content">
                                <div className="d-flex justify-content-between">
                                  <strong className="text-dark">{cp.status}</strong>
                                  <small className="text-muted">{formatDate(cp.timestamp)}</small>
                                </div>
                                <div className="mb-1">{cp.location}</div>
                                {cp.comment && (
                                  <p className="text-muted small mb-1 fst-italic">"{cp.comment}"</p>
                                )}
                                {cp.hasIssue && (
                                  <div className="alert alert-warning p-2 mt-2">
                                    <strong className="d-block">
                                      <span className="material-icons-outlined align-middle small me-1">warning</span>
                                      Issue Reported:
                                    </strong>
                                    <span className="small">{cp.issueDetails}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
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