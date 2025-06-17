import { useState } from 'react';

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

export default function TrackDelivery() {
  const [trackingId, setTrackingId] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDelivery(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/deliveries/${trackingId}`);
      if (!res.ok) {
        setError('Delivery not found.');
      } else {
        const data = await res.json();
        setDelivery(data);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="container py-5">
      <h1 className="display-6 fw-bold mb-4 text-center" style={{ color: '#D2691E' }}>Track Your Delivery</h1>
      <div className="row justify-content-center mb-4">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm border-0 p-4">
            <h2 className="h5 fw-bold mb-3 text-center" style={{ color: '#a14e13' }}>
              <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>search</span>
              Enter Tracking ID
            </h2>
            <form onSubmit={handleSearch} className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-white" style={{ color: '#D2691E' }}>
                  <span className="material-icons">search</span>
                </span>
                <input
                  type="text"
                  value={trackingId}
                  onChange={e => setTrackingId(e.target.value)}
                  placeholder="Tracking ID"
                  className="form-control"
                  required
                  disabled={loading}
                />
                <button type="submit" className="btn text-white fw-bold" style={{ background: '#D2691E' }} disabled={loading}>Search</button>
              </div>
            </form>
            {loading && <Spinner />}
            {error && <div className="alert alert-danger">Error: {error}</div>}
          </div>
        </div>
      </div>
      {delivery && (
        <div className="row justify-content-center mb-4">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h2 className="h5 fw-bold mb-2" style={{ color: '#a14e13' }}>
                  <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>local_shipping</span>
                  Current Status
                </h2>
                <div className="d-flex align-items-center mb-2">
                  <span className="material-icons me-2" style={{ color: '#D2691E' }}>flag</span>
                  <span className="fw-bold me-2" style={{ color: '#D2691E' }}>{delivery.currentStatus}</span>
                  <span className="badge rounded-pill" style={{ background: '#D2691E', color: '#fff' }}>{delivery.currentStatus}</span>
                </div>
                <div className="text-muted small mb-1">Last updated: {delivery.checkpoints?.length ? new Date(delivery.checkpoints[delivery.checkpoints.length-1].timestamp).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h2 className="h6 fw-bold mb-3" style={{ color: '#a14e13' }}>
                  <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>timeline</span>
                  Checkpoint Timeline
                </h2>
                {delivery.checkpoints && delivery.checkpoints.length > 0 ? (
                  <ul className="list-group">
                    {delivery.checkpoints.map((cp, idx) => (
                      <li key={idx} className="list-group-item d-flex align-items-start gap-2">
                        <span className="material-icons align-middle mt-1" style={{ color: '#D2691E' }}>place</span>
                        <div>
                          <div className="fw-semibold" style={{ color: '#D2691E' }}>{cp.location}</div>
                          <div className="text-muted small">{new Date(cp.timestamp).toLocaleString()}</div>
                          <div className="text-muted small">Operator: {cp.operator}</div>
                          {cp.comment && <div className="text-muted small">Comment: {cp.comment}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="alert alert-warning mt-2">No checkpoints yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {!loading && !error && !delivery && (
        <div className="text-center text-muted mt-5">Enter a tracking ID to view delivery status.</div>
      )}
    </div>
  );
} 