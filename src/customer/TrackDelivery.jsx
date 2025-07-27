import { useState } from 'react';
import { deliveryApi } from '../services/api';

// Enhanced Spinner component with system design
function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="modern-spinner" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

// Enhanced Status Badge component with system colors
function StatusBadge({ status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'status-success';
      case 'In Transit': return 'status-primary';
      case 'At Mine': return 'status-info';
      case 'At Border': return 'status-warning';
      case 'At Port': return 'status-secondary';
      case 'At Warehouse': return 'status-dark';
      case 'Cancelled': return 'status-danger';
      default: return 'status-secondary';
    }
  };

  return (
    <span className={`status-badge ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}

// Enhanced Status legend/info section with glassmorphism
function StatusLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="status-legend-container">
      <button
        className="status-legend-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="status-legend"
        type="button"
      >
        <i className="bi bi-info-circle"></i>
        What do the statuses mean?
      </button>
      {open && (
        <div id="status-legend" className="status-legend-content">
          <div className="status-legend-body">
            <div className="row g-3">
              <div className="col-md-6">
                <h6 className="status-legend-title">Delivery Status Guide</h6>
                <ul className="status-list">
                  <li className="status-item">
                    <span className="status-badge status-secondary">Pending</span>
                    <small>Delivery is scheduled but not yet dispatched</small>
                  </li>
                  <li className="status-item">
                    <span className="status-badge status-info">At Mine</span>
                    <small>Cargo is at the mine or origin point</small>
                  </li>
                  <li className="status-item">
                    <span className="status-badge status-primary">In Transit</span>
                    <small>Cargo is on the move to the next checkpoint</small>
                  </li>
                  <li className="status-item">
                    <span className="status-badge status-warning">At Border</span>
                    <small>Cargo is at a border crossing for customs clearance</small>
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul className="status-list">
                  <li className="status-item">
                    <span className="status-badge status-secondary">At Port</span>
                    <small>Cargo has reached the port for export/import</small>
                  </li>
                  <li className="status-item">
                    <span className="status-badge status-secondary">At Port of Destination</span>
                    <small>Cargo has arrived at the destination port</small>
                  </li>
                  <li className="status-item">
                    <span className="status-badge status-dark">At Warehouse</span>
                    <small>Cargo is in storage at a warehouse</small>
                  </li>
                  <li className="status-item">
                    <span className="status-badge status-success">Delivered</span>
                    <small>Delivery is complete and received by the customer</small>
                  </li>
                  <li className="status-item">
                    <span className="status-badge status-danger">Cancelled</span>
                    <small>Delivery was cancelled</small>
                  </li>
                </ul>
              </div>
            </div>
            <hr className="status-legend-divider" />
            <div className="status-legend-footer">
              <small>
                <strong>Lost your tracking code?</strong> Contact Dar Logistics support at{' '}
                <a href="mailto:support@darlogistics.co.zw" className="support-link">support@darlogistics.co.zw</a>
              </small>
            </div>
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

  return (
    <div className="tracking-container">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-sphere sphere-1"></div>
        <div className="floating-sphere sphere-2"></div>
        <div className="floating-sphere sphere-3"></div>
        <div className="floating-sphere sphere-4"></div>
      </div>

      <div className="container py-5">
        {/* Header Section */}
        <div className="tracking-header">
          <div className="tracking-icon">
            <i className="bi bi-truck"></i>
          </div>
          <h1 className="tracking-title">
            Track Your Consignment
          </h1>
          <p className="tracking-subtitle">
            Enter your tracking ID to monitor your delivery in real-time
          </p>
        </div>

        {/* Status Legend */}
        <div className="d-flex justify-content-center mb-4">
          <StatusLegend />
        </div>

        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6">
            {/* Search Form */}
            <div className="tracking-form-card">
              <div className="tracking-form-body">
                <form onSubmit={handleSubmit} className="tracking-form">
                  <div className="tracking-input-group">
                    <span className="tracking-input-icon">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                      placeholder="Enter tracking ID (e.g., ABC1234)"
                      className="tracking-input"
                      maxLength="7"
                      aria-label="Tracking ID"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="tracking-button"
                    >
                      {loading ? (
                        <>
                          <span className="tracking-spinner"></span>
                          Tracking...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-search me-2"></i>
                          Track
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="tracking-error">
                    <i className="bi bi-exclamation-triangle"></i>
                    {error}
                  </div>
                )}

                {/* Support Contact */}
                <div className="tracking-support">
                  Need help? Contact us at{' '}
                  <a href="mailto:support@darlogistics.co.zw" className="support-link">support@darlogistics.co.zw</a>
                  {' '}or call{' '}
                  <a href="tel:+263781334474" className="support-link">+263 781 334474</a>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            {delivery && (
              <div className="delivery-details-card" aria-live="polite">
                <div className="delivery-header">
                  <div>
                    <h2 className="delivery-title">
                      <i className="bi bi-receipt me-2"></i>
                      Tracking ID: {delivery.trackingId}
                    </h2>
                    <p className="delivery-subtitle">Last updated: {delivery.updatedAt ? formatDate(delivery.updatedAt) : 'N/A'}</p>
                  </div>
                  <StatusBadge status={delivery.currentStatus} />
                </div>
                
                <div className="delivery-body">
                  {/* Consignment Details */}
                  <div className="delivery-section">
                    <div className="row g-4 mb-4">
                      <div className="col-md-6">
                        <h5 className="section-title">
                          <i className="bi bi-box me-2"></i>
                          Consignment Details
                        </h5>
                        <div className="row g-3">
                          <div className="col-6">
                            <div className="detail-card">
                              <small className="detail-label">Customer</small>
                              <strong className="detail-value">{delivery.customerName}</strong>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="detail-card">
                              <small className="detail-label">Booking Ref</small>
                              <strong className="detail-value">{delivery.bookingReference}</strong>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="detail-card">
                              <small className="detail-label">Tonnage</small>
                              <strong className="detail-value">{delivery.tonnage} tons</strong>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="detail-card">
                              <small className="detail-label">Containers</small>
                              <strong className="detail-value">{delivery.containerCount}</strong>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="detail-card">
                              <small className="detail-label">Route</small>
                              <strong className="detail-value">{delivery.loadingPoint} → {delivery.destination}</strong>
                            </div>
                          </div>
                          {(delivery.mineralType || delivery.mineralGrade) && (
                            <div className="col-12">
                              <div className="detail-card">
                                <small className="detail-label">Mineral</small>
                                <strong className="detail-value">
                                  {delivery.mineralType || 'N/A'}
                                  {delivery.mineralGrade ? ` (${delivery.mineralGrade})` : ''}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <h5 className="section-title">
                          <i className="bi bi-truck me-2"></i>
                          Vehicle & Driver
                        </h5>
                        <div className="row g-3">
                          {delivery.driverDetails && (
                            <>
                              <div className="col-6">
                                <div className="detail-card">
                                  <small className="detail-label">Driver</small>
                                  <strong className="detail-value">{delivery.driverDetails.name}</strong>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="detail-card">
                                  <small className="detail-label">Vehicle Reg</small>
                                  <strong className="detail-value">{delivery.driverDetails.vehicleReg}</strong>
                                </div>
                              </div>
                            </>
                          )}
                          <div className="col-12">
                            <div className="detail-card">
                              <small className="detail-label">Vehicle Type</small>
                              <strong className="detail-value">{delivery.vehicleType}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Environmental Incidents */}
                  {delivery.environmental_incidents && (
                    <div className="environmental-alert">
                      <i className="bi bi-exclamation-triangle"></i>
                      <div>
                        <h6 className="alert-title">Environmental Incident Reported</h6>
                        <p className="alert-message">{delivery.environmental_incidents}</p>
                      </div>
                    </div>
                  )}

                  {/* Tracking History */}
                  <div className="tracking-history">
                    <h5 className="section-title">
                      <i className="bi bi-clock-history me-2"></i>
                      Tracking History
                    </h5>
                    
                    {delivery.checkpoints && delivery.checkpoints.length > 0 ? (
                      <div className="timeline-container">
                        {/* Timeline line */}
                        <div className="timeline-line"></div>
                        
                        {delivery.checkpoints.slice().reverse().map((cp, index) => {
                          const isCurrent = cp.status === delivery.currentStatus;
                          const isCompleted = cp.status === 'Delivered';
                          const hasIssue = cp.hasIssue;
                          
                          let dotColor = '#6c757d';
                          let dotIcon = 'bi-circle';
                          let stepBg = 'rgba(255, 255, 255, 0.1)';
                          
                          if (isCurrent) {
                            dotColor = '#FF6600';
                            dotIcon = 'bi-circle-fill';
                            stepBg = 'rgba(255, 102, 0, 0.1)';
                          } else if (isCompleted) {
                            dotColor = '#28a745';
                            dotIcon = 'bi-check-circle-fill';
                            stepBg = 'rgba(40, 167, 69, 0.1)';
                          } else if (hasIssue) {
                            dotColor = '#ffc107';
                            dotIcon = 'bi-exclamation-triangle-fill';
                            stepBg = 'rgba(255, 193, 7, 0.1)';
                          }
                          
                          return (
                            <div className="timeline-item" key={index}>
                              {/* Timeline dot */}
                              <div className="timeline-dot">
                                <i className={`bi ${dotIcon}`} style={{ color: dotColor }}></i>
                              </div>
                              
                              {/* Content */}
                              <div className="timeline-content">
                                <div className="timeline-card" style={{ background: stepBg }}>
                                  <div className="timeline-card-body">
                                    <div className="timeline-header">
                                      <h6 className="timeline-status">{cp.status}</h6>
                                      <small className="timeline-time">{formatDate(cp.timestamp)}</small>
                                    </div>
                                    <p className="timeline-location">{cp.location}</p>
                                    {cp.comment && (
                                      <p className="timeline-comment">"{cp.comment}"</p>
                                    )}
                                    {cp.hasIssue && (
                                      <div className="timeline-issue">
                                        <div className="issue-content">
                                          <i className="bi bi-exclamation-triangle"></i>
                                          <div>
                                            <strong className="issue-title">Issue Reported:</strong>
                                            <small className="issue-details">{cp.issueDetails}</small>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-history">
                        <i className="bi bi-clock"></i>
                        <p>No tracking history available yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Design Styles */}
      <style>{`
        /* CSS Custom Properties */
        :root {
          --primary-blue: #003366;
          --primary-orange: #FF6600;
          --accent-orange: #FF8533;
          --accent-blue: #0066CC;
          --success-green: #28a745;
          --warning-yellow: #ffc107;
          --danger-red: #dc3545;
          --info-cyan: #17a2b8;
          --white: #ffffff;
          --black: #000000;
          --transition-slow: 0.3s ease;
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        /* Container Styles */
        .tracking-container {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          color: var(--white);
          position: relative;
          overflow-x: hidden;
        }

        /* Animated Background */
        .background-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .floating-sphere {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: float 8s ease-in-out infinite;
        }

        .sphere-1 {
          width: 200px;
          height: 200px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }

        .sphere-2 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .sphere-3 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          left: 15%;
          animation-delay: 4s;
        }

        .sphere-4 {
          width: 120px;
          height: 120px;
          bottom: 40%;
          right: 5%;
          animation-delay: 6s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        /* Header Styles */
        .tracking-header {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
          z-index: 10;
        }

        .tracking-icon {
          margin-bottom: 1rem;
        }

        .tracking-icon i {
          font-size: 3rem;
          color: var(--primary-orange);
        }

        .tracking-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--white);
        }

        .tracking-subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Modern Spinner */
        .modern-spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid var(--primary-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Status Badge Styles */
        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-success {
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.3);
        }

        .status-primary {
          background: rgba(255, 102, 0, 0.2);
          color: var(--primary-orange);
          border: 1px solid rgba(255, 102, 0, 0.3);
        }

        .status-info {
          background: rgba(23, 162, 184, 0.2);
          color: var(--info-cyan);
          border: 1px solid rgba(23, 162, 184, 0.3);
        }

        .status-warning {
          background: rgba(255, 193, 7, 0.2);
          color: var(--warning-yellow);
          border: 1px solid rgba(255, 193, 7, 0.3);
        }

        .status-secondary {
          background: rgba(108, 117, 125, 0.2);
          color: #6c757d;
          border: 1px solid rgba(108, 117, 125, 0.3);
        }

        .status-dark {
          background: rgba(52, 58, 64, 0.2);
          color: var(--dark-gray);
          border: 1px solid rgba(52, 58, 64, 0.3);
        }

        .status-danger {
          background: rgba(220, 53, 69, 0.2);
          color: var(--danger-red);
          border: 1px solid rgba(220, 53, 69, 0.3);
        }

        /* Status Legend Styles */
        .status-legend-container {
          margin-bottom: 2rem;
        }

        .status-legend-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--white);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: var(--transition-slow);
          backdrop-filter: blur(10px);
        }

        .status-legend-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .status-legend-content {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          margin-top: 1rem;
          padding: 1.5rem;
        }

        .status-legend-title {
          font-weight: 600;
          color: var(--primary-orange);
          margin-bottom: 1rem;
        }

        .status-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .status-item {
          display: flex;
          align-items: start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .status-item small {
          color: rgba(255, 255, 255, 0.8);
        }

        .status-legend-divider {
          border-color: rgba(255, 255, 255, 0.2);
          margin: 1rem 0;
        }

        .status-legend-footer {
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
        }

        .support-link {
          color: var(--primary-orange);
          text-decoration: none;
        }

        .support-link:hover {
          text-decoration: underline;
        }

        /* Form Styles */
        .tracking-form-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          margin-bottom: 2rem;
          position: relative;
          z-index: 10;
        }

        .tracking-form-body {
          padding: 2rem;
        }

        .tracking-form {
          margin-bottom: 1.5rem;
        }

        .tracking-input-group {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .tracking-input-icon {
          padding: 1rem;
          background: var(--primary-orange);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tracking-input {
          flex: 1;
          padding: 1rem;
          background: transparent;
          border: none;
          color: var(--white);
          font-size: 1.1rem;
          outline: none;
        }

        .tracking-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .tracking-button {
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          border: none;
          color: var(--white);
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-slow);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tracking-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .tracking-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tracking-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid var(--white);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        .tracking-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.3);
          border-radius: 0.5rem;
          color: var(--danger-red);
          margin-bottom: 1rem;
        }

        .tracking-support {
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        /* Delivery Details Styles */
        .delivery-details-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          position: relative;
          z-index: 10;
        }

        .delivery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .delivery-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--white);
        }

        .delivery-subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .delivery-body {
          padding: 1.5rem;
        }

        .section-title {
          font-weight: 600;
          color: var(--primary-orange);
          margin-bottom: 1rem;
        }

        .detail-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          padding: 1rem;
          backdrop-filter: blur(10px);
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.7);
          display: block;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          color: var(--white);
        }

        .environmental-alert {
          display: flex;
          align-items: start;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .environmental-alert i {
          color: var(--warning-yellow);
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .alert-title {
          font-weight: 600;
          color: var(--warning-yellow);
          margin-bottom: 0.25rem;
        }

        .alert-message {
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        /* Timeline Styles */
        .tracking-history {
          margin-top: 2rem;
        }

        .timeline-container {
          position: relative;
        }

        .timeline-line {
          position: absolute;
          left: 20px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
        }

        .timeline-item {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .timeline-dot {
          position: absolute;
          left: 12px;
          top: 8px;
          width: 24px;
          height: 24px;
          background: var(--white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .timeline-dot i {
          font-size: 1rem;
        }

        .timeline-content {
          margin-left: 3rem;
        }

        .timeline-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          backdrop-filter: blur(10px);
        }

        .timeline-card-body {
          padding: 1rem;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.5rem;
        }

        .timeline-status {
          font-weight: 600;
          color: var(--white);
          margin: 0;
        }

        .timeline-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .timeline-location {
          color: var(--white);
          margin-bottom: 0.5rem;
        }

        .timeline-comment {
          color: rgba(255, 255, 255, 0.8);
          font-style: italic;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .timeline-issue {
          padding: 0.5rem;
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 0.25rem;
        }

        .issue-content {
          display: flex;
          align-items: start;
          gap: 0.5rem;
        }

        .issue-content i {
          color: var(--warning-yellow);
          flex-shrink: 0;
        }

        .issue-title {
          display: block;
          font-size: 0.8rem;
          color: var(--warning-yellow);
        }

        .issue-details {
          color: rgba(255, 255, 255, 0.9);
        }

        .no-history {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .no-history i {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .tracking-title {
            font-size: 2rem;
          }
          
          .tracking-form-body {
            padding: 1.5rem;
          }
          
          .delivery-header {
            flex-direction: column;
            align-items: start;
            gap: 1rem;
          }
          
          .timeline-content {
            margin-left: 2rem;
          }
        }
      `}</style>
    </div>
  );
} 