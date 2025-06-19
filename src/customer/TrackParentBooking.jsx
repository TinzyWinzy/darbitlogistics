import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { deliveryApi } from '../services/api';

function Spinner() {
  return (
    <div className="d-flex justify-content-center py-4">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

function DeliveryCard({ delivery }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="card-title">Tracking ID: {delivery.trackingId}</h6>
            <p className="card-text text-muted mb-2">
              {delivery.containerCount} containers | {delivery.tonnage} tons
            </p>
          </div>
          <span className={`badge ${delivery.is_completed ? 'bg-success' : 'bg-warning'}`}>
            {delivery.currentStatus}
          </span>
        </div>
        <div className="timeline small mt-3">
          {delivery.checkpoints.map((checkpoint, idx) => (
            <div key={idx} className="checkpoint-item">
              <div className="checkpoint-date">
                {new Date(checkpoint.timestamp).toLocaleDateString()}
              </div>
              <div className="checkpoint-content">
                <strong>{checkpoint.location}</strong>
                <div>{checkpoint.comment}</div>
              </div>
            </div>
          ))}
        </div>
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
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!booking) return <div className="alert alert-warning">Booking not found</div>;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Header Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h1 className="h3 mb-0">{booking.customerName}</h1>
                  <p className="text-muted mb-0">Booking ID: {booking.id}</p>
                </div>
                <div className="text-end">
                  <div className={`badge ${timeLeft === 'EXPIRED' ? 'bg-danger' : 'bg-warning'} mb-2`}>
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
                  <span>Overall Progress</span>
                  <span>{booking.completion_percentage}%</span>
                </div>
                <div className="progress" style={{ height: '25px' }}>
                  <div 
                    className="progress-bar" 
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
                  <div className="card bg-light">
                    <div className="card-body py-2">
                      <div className="small text-muted">Total Tonnage</div>
                      <div className="h5 mb-0">
                        {booking.completed_tonnage} / {booking.total_tonnage} tons
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body py-2">
                      <div className="small text-muted">Deliveries</div>
                      <div className="h5 mb-0">
                        {booking.completed_deliveries} / {booking.total_deliveries} completed
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="card bg-light">
                    <div className="card-body py-2">
                      <div className="small text-muted">Route</div>
                      <div className="h5 mb-0">
                        {booking.loadingPoint} → {booking.destination}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deliveries Section */}
          <h2 className="h5 mb-3">Individual Deliveries</h2>
          {deliveries.map(delivery => (
            <DeliveryCard key={delivery.trackingId} delivery={delivery} />
          ))}
        </div>
      </div>
    </div>
  );
} 