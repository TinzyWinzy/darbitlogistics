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

  return (
    <div className="bg-gradient" style={{ minHeight: '90vh', background: 'linear-gradient(135deg, #e88a3a 0%, #fffbe6 100%)' }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <span style={{ fontSize: '2.5em' }} role="img" aria-label="tracking">🔍</span>
                  <h1 className="h3 fw-bold mt-3" style={{ color: '#D2691E' }}>Track Your Delivery</h1>
                  <p className="text-muted">Enter your tracking ID to see delivery status and updates</p>
                </div>

                <form onSubmit={handleSubmit} className="mb-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <span className="material-icons" style={{ color: '#D2691E' }}>local_shipping</span>
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
                        <span className="material-icons me-2">search</span>
                      )}
                      {loading ? 'Tracking...' : 'Track'}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <span className="material-icons me-2">error_outline</span>
                    <div>{error}</div>
                  </div>
                )}

                {loading && <Spinner />}

                {delivery && (
                  <div className="delivery-details">
                    <div className="border-bottom pb-4 mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h5 fw-bold mb-0" style={{ color: '#D2691E' }}>Delivery Details</h2>
                        <StatusBadge status={delivery.currentStatus} />
                      </div>
                      <div className="row g-3">
                        <div className="col-12 col-sm-6">
                          <div className="p-3 rounded" style={{ background: 'rgba(232, 138, 58, 0.1)' }}>
                            <div className="text-muted small">Tracking ID</div>
                            <div className="fw-bold">{delivery.trackingId}</div>
                          </div>
                        </div>
                        <div className="col-12 col-sm-6">
                          <div className="p-3 rounded" style={{ background: 'rgba(232, 138, 58, 0.1)' }}>
                            <div className="text-muted small">Customer</div>
                            <div className="fw-bold">{delivery.customerName}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="h5 fw-bold mb-4" style={{ color: '#D2691E' }}>
                        <span className="material-icons align-middle me-2">timeline</span>
                        Delivery Timeline
                      </h3>
                      <div className="timeline">
                        {delivery.checkpoints.map((checkpoint, idx) => (
                          <div key={checkpoint.timestamp} className="timeline-item pb-4">
                            <div className="position-relative">
                              <div className="timeline-line" style={{
                                position: 'absolute',
                                left: '15px',
                                top: '30px',
                                bottom: idx === delivery.checkpoints.length - 1 ? '0' : '-10px',
                                width: '2px',
                                background: idx === delivery.checkpoints.length - 1 ? 'transparent' : '#e88a3a'
                              }} />
                              <div className="d-flex">
                                <div className="timeline-icon me-3">
                                  <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                    style={{ 
                                      width: '32px', 
                                      height: '32px', 
                                      background: '#D2691E',
                                      color: 'white',
                                      fontSize: '14px',
                                      fontWeight: 'bold'
                                    }}>
                                    {delivery.checkpoints.length - idx}
                                  </div>
                                </div>
                                <div className="timeline-content flex-grow-1">
                                  <div className="card border-0 shadow-sm">
                                    <div className="card-body p-3">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h4 className="h6 fw-bold mb-0" style={{ color: '#D2691E' }}>{checkpoint.location}</h4>
                                        <small className="text-muted">{formatDate(checkpoint.timestamp)}</small>
                                      </div>
                                      <p className="text-muted small mb-1">{checkpoint.comment}</p>
                                      <small className="text-muted">Updated by: {checkpoint.operator}</small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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