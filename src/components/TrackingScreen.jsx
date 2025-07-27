import React, { useState, useEffect } from 'react';

const TrackingScreen = () => {
  const [trackingData, setTrackingData] = useState({
    id: '#568999856921',
    status: 'Transit',
    kmsRemaining: 12,
    estimatedTime: '25 mins',
    driver: {
      name: 'Cameron Williamson',
      id: 'A54 3571',
      avatar: 'CW'
    }
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackingData(prev => ({
        ...prev,
        kmsRemaining: Math.max(0, prev.kmsRemaining - 0.1),
        estimatedTime: `${Math.max(0, Math.floor(prev.kmsRemaining * 2))} mins`
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCall = () => {
    // Implement call functionality
    console.log('Calling driver...');
  };

  return (
    <div className="tracking-screen-container">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-sphere sphere-1"></div>
        <div className="floating-sphere sphere-2"></div>
        <div className="floating-sphere sphere-3"></div>
        <div className="floating-sphere sphere-4"></div>
      </div>

      {/* Header */}
      <div className="container py-4">
        <div className="tracking-header">
          <button className="header-button">
            <i className="bi bi-arrow-left"></i>
          </button>
          <h1 className="header-title">Tracking Shipment</h1>
          <button className="header-button">
            <i className="bi bi-three-dots"></i>
          </button>
        </div>

        {/* Map View */}
        <div className="map-card">
          <div className="map-container">
            {/* Mock Map Background */}
            <div className="map-background">
              {/* Route Line */}
              <svg className="route-svg" viewBox="0 0 400 300">
                <path
                  d="M50 150 Q200 50 350 150"
                  stroke="url(#routeGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="10,5"
                  className="route-path"
                />
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF6600" />
                    <stop offset="100%" stopColor="#FF8533" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Truck Icon */}
              <div className="truck-icon">
                <span className="truck-emoji">🚛</span>
              </div>

              {/* Destination Pin */}
              <div className="destination-pin">
                <div className="pin-outer">
                  <div className="pin-inner"></div>
                </div>
              </div>

              {/* Location Labels */}
              <div className="location-label location-start">
                <span>Linciomdre</span>
              </div>
              <div className="location-label location-end">
                <span>Angle Fly Preserve</span>
              </div>
              <div className="location-label location-center">
                <span>Mesozoic Reservoir Area</span>
              </div>
            </div>

            {/* Map Controls */}
            <div className="map-controls">
              <button className="map-control-button">
                <i className="bi bi-search"></i>
              </button>
              <button className="map-control-button">
                <i className="bi bi-arrows-fullscreen"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Tracking Details Card */}
        <div className="tracking-details-card">
          <div className="tracking-details-body">
            {/* Tracking ID */}
            <div className="tracking-id-section">
              <div>
                <small className="tracking-label">Tracking ID</small>
                <h5 className="tracking-id">{trackingData.id}</h5>
              </div>
              <div className="tracking-status-section">
                <div className={`status-badge ${trackingData.status === 'Transit' ? 'status-transit' : 'status-delivered'}`}>
                  {trackingData.status}
                </div>
                <div className="status-spinner"></div>
              </div>
            </div>

            {/* Progress Info */}
            <div className="progress-section">
              <div className="progress-card">
                <small className="progress-label">Kms Remaining</small>
                <h4 className="progress-value">{trackingData.kmsRemaining.toFixed(1)} km</h4>
              </div>
              <div className="progress-card">
                <small className="progress-label">Estimated Time</small>
                <h4 className="progress-value">{trackingData.estimatedTime}</h4>
              </div>
            </div>

            {/* Driver Information */}
            <div className="driver-section">
              <div className="driver-info">
                <div className="driver-avatar">
                  <span className="driver-initials">{trackingData.driver.avatar}</span>
                </div>
                <div className="driver-details">
                  <h6 className="driver-name">{trackingData.driver.name}</h6>
                  <small className="driver-id">ID: {trackingData.driver.id}</small>
                </div>
              </div>
              <button
                onClick={handleCall}
                className="call-button"
              >
                <i className="bi bi-telephone"></i>
              </button>
            </div>

            {/* Expandable Details */}
            <div className="expandable-section">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="expand-button"
              >
                <span className="expand-text">View Details</span>
                <i className={`bi bi-chevron-down expand-icon ${isExpanded ? 'expanded' : ''}`}></i>
              </button>

              {isExpanded && (
                <div className="expanded-details">
                  <div className="details-grid">
                    <div className="detail-card">
                      <small className="detail-label">Vehicle</small>
                      <strong className="detail-value">Cargo Truck - ABC123</strong>
                    </div>
                    <div className="detail-card">
                      <small className="detail-label">Current Speed</small>
                      <strong className="detail-value">65 km/h</strong>
                    </div>
                    <div className="detail-card full-width">
                      <small className="detail-label">Last Update</small>
                      <strong className="detail-value">2 minutes ago</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-button">
            <i className="bi bi-share"></i>
            Share
          </button>
          <button className="action-button">
            <i className="bi bi-exclamation-triangle"></i>
            Report
          </button>
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
        .tracking-screen-container {
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 10;
        }

        .header-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--white);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-slow);
          backdrop-filter: blur(10px);
        }

        .header-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .header-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: var(--white);
        }

        /* Map Styles */
        .map-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          margin-bottom: 2rem;
          overflow: hidden;
          position: relative;
          z-index: 10;
        }

        .map-container {
          position: relative;
          height: 300px;
        }

        .map-background {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--primary-orange) 0%, var(--accent-orange) 100%);
        }

        .route-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .route-path {
          animation: dash 2s linear infinite;
        }

        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }

        .truck-icon {
          position: absolute;
          width: 32px;
          height: 32px;
          background: var(--warning-yellow);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: moveTruck 20s linear infinite;
        }

        .truck-emoji {
          font-size: 1rem;
        }

        @keyframes moveTruck {
          0% { left: 12.5%; top: 50%; transform: translateY(-50%); }
          25% { left: 50%; top: 16.67%; transform: translateY(-50%); }
          50% { left: 87.5%; top: 50%; transform: translateY(-50%); }
          100% { left: 12.5%; top: 50%; transform: translateY(-50%); }
        }

        .destination-pin {
          position: absolute;
          right: 32px;
          top: 50%;
          transform: translateY(-50%);
        }

        .pin-outer {
          width: 24px;
          height: 24px;
          background: var(--danger-red);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pin-inner {
          width: 8px;
          height: 8px;
          background: var(--white);
          border-radius: 50%;
        }

        .location-label {
          position: absolute;
          background: rgba(0, 0, 0, 0.75);
          color: var(--white);
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .location-start {
          top: 1rem;
          left: 1rem;
        }

        .location-end {
          top: 1rem;
          right: 1rem;
        }

        .location-center {
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
        }

        .map-controls {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .map-control-button {
          background: rgba(0, 0, 0, 0.75);
          color: var(--white);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .map-control-button:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        /* Tracking Details Styles */
        .tracking-details-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          margin-bottom: 2rem;
          position: relative;
          z-index: 10;
        }

        .tracking-details-body {
          padding: 1.5rem;
        }

        .tracking-id-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .tracking-label {
          color: rgba(255, 255, 255, 0.7);
          display: block;
          margin-bottom: 0.25rem;
        }

        .tracking-id {
          font-weight: 700;
          margin: 0;
          color: var(--white);
        }

        .tracking-status-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-transit {
          background: rgba(255, 193, 7, 0.2);
          color: var(--warning-yellow);
          border: 1px solid rgba(255, 193, 7, 0.3);
        }

        .status-delivered {
          background: rgba(40, 167, 69, 0.2);
          color: var(--success-green);
          border: 1px solid rgba(40, 167, 69, 0.3);
        }

        .status-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid var(--primary-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Progress Section */
        .progress-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .progress-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          padding: 1rem;
          backdrop-filter: blur(10px);
        }

        .progress-label {
          color: rgba(255, 255, 255, 0.7);
          display: block;
          margin-bottom: 0.25rem;
        }

        .progress-value {
          font-weight: 700;
          margin: 0;
          color: var(--white);
        }

        .progress-card:first-child .progress-value {
          color: var(--warning-yellow);
        }

        /* Driver Section */
        .driver-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.5rem;
        }

        .driver-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .driver-avatar {
          width: 48px;
          height: 48px;
          background: var(--warning-yellow);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .driver-initials {
          color: var(--white);
          font-weight: 700;
        }

        .driver-name {
          font-weight: 700;
          margin: 0 0 0.25rem 0;
          color: var(--white);
        }

        .driver-id {
          color: rgba(255, 255, 255, 0.7);
        }

        .call-button {
          width: 48px;
          height: 48px;
          background: var(--warning-yellow);
          border: none;
          border-radius: 50%;
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .call-button:hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-lg);
        }

        /* Expandable Section */
        .expandable-section {
          margin-top: 1.5rem;
        }

        .expand-button {
          width: 100%;
          background: none;
          border: none;
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: var(--transition-slow);
        }

        .expand-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
        }

        .expand-text {
          font-size: 0.875rem;
        }

        .expand-icon {
          transition: transform 0.3s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .expanded-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .detail-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          padding: 1rem;
          backdrop-filter: blur(10px);
        }

        .detail-card.full-width {
          grid-column: 1 / -1;
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.7);
          display: block;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          color: var(--white);
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .action-button {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--white);
          padding: 1rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: var(--transition-slow);
          backdrop-filter: blur(10px);
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .tracking-header {
            margin-bottom: 1.5rem;
          }
          
          .tracking-details-body {
            padding: 1rem;
          }
          
          .tracking-id-section {
            flex-direction: column;
            align-items: start;
            gap: 1rem;
          }
          
          .progress-section {
            grid-template-columns: 1fr;
          }
          
          .driver-section {
            flex-direction: column;
            gap: 1rem;
            align-items: start;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default TrackingScreen; 