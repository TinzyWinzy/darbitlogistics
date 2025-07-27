import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { deliveryApi } from '../services/api';

function Spinner() {
  return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

function StatusLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 mx-auto"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="status-legend"
        type="button"
        style={{ fontSize: '0.9rem', fontWeight: '500' }}
      >
        <i className="bi bi-info-circle"></i>
        What do the statuses mean?
      </button>
      {open && (
        <div id="status-legend" className="card mt-3 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fff9c4 0%, #fffde7 100%)' }}>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <h6 className="fw-bold mb-3 text-primary">Delivery Status Guide</h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>Pending</span>
                    <small>Delivery is scheduled but not yet dispatched</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-info rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>At Mine</span>
                    <small>Cargo is at the mine or origin point</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>In Transit</span>
                    <small>Cargo is on the move to the next checkpoint</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-warning rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>At Border</span>
                    <small>Cargo is at a border crossing for customs clearance</small>
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul className="list-unstyled mb-0">
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>At Port</span>
                    <small>Cargo has reached the port for export/import</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>At Port of Destination</span>
                    <small>Cargo has arrived at the destination port</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-dark rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>At Warehouse</span>
                    <small>Cargo is in storage at a warehouse</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-success rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>Delivered</span>
                    <small>Delivery is complete and received by the customer</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.7rem', minWidth: '60px' }}>Cancelled</span>
                    <small>Delivery was cancelled</small>
                  </li>
                </ul>
              </div>
            </div>
            <hr className="my-3" />
            <div className="text-center">
              <small className="text-muted">
                <strong>Lost your tracking code?</strong> Contact Dar Logistics support at{' '}
                <a href="mailto:support@darlogistics.co.zw" className="text-decoration-none">support@darlogistics.co.zw</a>
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveryCard({ delivery }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-success';
      case 'In Transit': return 'bg-primary';
      case 'At Mine': return 'bg-info';
      case 'At Border': return 'bg-warning';
      case 'At Port': return 'bg-secondary';
      case 'At Warehouse': return 'bg-dark';
      case 'Cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-3">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 className="fw-bold mb-2">
              <i className="bi bi-receipt me-2 text-primary"></i>
              Tracking ID: {delivery.trackingId}
            </h6>
            <p className="text-muted mb-0 small">
              {delivery.containerCount} containers | {delivery.tonnage} tons
            </p>
          </div>
          <span className={`badge ${getStatusColor(delivery.currentStatus)} rounded-pill px-3 py-2`}>
            {delivery.currentStatus}
          </span>
        </div>
        
        {delivery.checkpoints && delivery.checkpoints.length > 0 && (
          <div className="mt-3">
            <h6 className="fw-bold mb-3 text-dark">
              <i className="bi bi-clock-history me-2 text-primary"></i>
              Recent Updates
            </h6>
            <div className="position-relative">
              {/* Timeline line */}
              <div className="position-absolute start-0 top-0 bottom-0" style={{ left: '20px', width: '2px', background: 'linear-gradient(to bottom, #dee2e6 0%, #6c757d 100%)' }}></div>
              
              {delivery.checkpoints.slice(-3).reverse().map((checkpoint, idx) => (
                <div className="position-relative mb-3" key={idx}>
                  {/* Timeline dot */}
                  <div className="position-absolute start-0" style={{ left: '12px', top: '8px' }}>
                    <i className="bi bi-circle-fill fs-6" style={{ color: '#0d6efd', background: 'white', borderRadius: '50%' }}></i>
                  </div>
                  
                  {/* Content */}
                  <div className="ms-5">
                    <div className="bg-light rounded-3 p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0 small">{checkpoint.status}</h6>
                        <small className="text-muted">{new Date(checkpoint.timestamp).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-2 small">{checkpoint.location}</p>
                      {checkpoint.comment && (
                        <p className="text-muted small mb-0 fst-italic">"{checkpoint.comment}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackParentBooking() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingData = await deliveryApi.getParentBooking(id);
        setBooking(bookingData);
        
        const deliveriesData = await deliveryApi.getDeliveriesByParentId(id);
        setDeliveries(deliveriesData);
      } catch (err) {
        setError(err.message || 'Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  useEffect(() => {
    if (!booking?.deadline) return;

    const updateTimer = () => {
      const now = new Date();
      const deadline = new Date(booking.deadline);
      const diff = deadline - now;
      
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, [booking?.deadline]);

  if (loading) return <Spinner />;
  if (error) return (
    <div className="container py-5">
      <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-exclamation-triangle"></i>
        {error}
      </div>
    </div>
  );
  if (!booking) return (
    <div className="container py-5">
      <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
        <i className="bi bi-exclamation-triangle"></i>
        Booking not found
      </div>
    </div>
  );

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="container py-5">
        {/* Header Section */}
        <div className="text-center mb-5">
          <div className="mb-3">
            <i className="bi bi-boxes text-primary" style={{ fontSize: '3rem' }}></i>
          </div>
          <h1 className="display-5 fw-bold text-dark mb-2">
            Track Your Parent Booking
          </h1>
          <p className="text-muted fs-5">
            Monitor all deliveries in your booking package
          </p>
        </div>

        {/* Status Legend */}
        <div className="d-flex justify-content-center mb-4">
          <StatusLegend />
        </div>

        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            {/* Header Card */}
            <div className="card border-0 shadow-lg rounded-4 mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <h2 className="h3 fw-bold mb-1">{booking.customerName}</h2>
                    <p className="text-muted mb-0">Booking ID: {booking.id}</p>
                  </div>
                  <div className="text-end">
                    <div className={`badge ${timeLeft === 'EXPIRED' ? 'bg-danger' : 'bg-warning'} rounded-pill px-3 py-2 mb-2`}>
                      {timeLeft}
                    </div>
                    <div className="text-muted small">
                      Deadline: {new Date(booking.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-bold">Overall Progress</span>
                    <span className="fw-bold">{booking.completion_percentage}%</span>
                  </div>
                  <div className="progress" style={{ height: '25px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar"
                      style={{ width: `${booking.completion_percentage}%` }}
                      aria-valuenow={booking.completion_percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {booking.completion_percentage}% Complete
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="bg-light rounded-3 p-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-box text-primary"></i>
                        <small className="text-muted">Total Tonnage</small>
                      </div>
                      <h4 className="fw-bold mb-0">
                        {booking.completed_tonnage} / {booking.total_tonnage} tons
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light rounded-3 p-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-truck text-primary"></i>
                        <small className="text-muted">Deliveries</small>
                      </div>
                      <h4 className="fw-bold mb-0">
                        {booking.completed_deliveries} / {booking.total_deliveries} completed
                      </h4>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="bg-light rounded-3 p-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-geo-alt text-primary"></i>
                        <small className="text-muted">Route</small>
                      </div>
                      <h4 className="fw-bold mb-0">
                        {booking.loadingPoint} → {booking.destination}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deliveries Section */}
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-header bg-white border-0 p-4">
                <h3 className="h5 fw-bold mb-0">
                  <i className="bi bi-list-ul me-2 text-primary"></i>
                  Individual Deliveries
                </h3>
              </div>
              <div className="card-body p-4">
                {deliveries.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-2">No deliveries found for this booking.</p>
                  </div>
                ) : (
                  deliveries.map(delivery => (
                    <DeliveryCard key={delivery.trackingId} delivery={delivery} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="text-center text-muted small mt-4">
          Need help? Contact us at{' '}
          <a href="mailto:support@darlogistics.co.zw" className="text-decoration-none">support@darlogistics.co.zw</a>
          {' '}or call{' '}
          <a href="tel:+263781334474" className="text-decoration-none">+263 781 334474</a>
        </div>
      </div>
    </div>
  );
} 