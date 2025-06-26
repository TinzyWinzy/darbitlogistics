import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DeliveryTimeline({ delivery }) {
  return (
    <div className="timeline-item">
      <div className="timeline-line"></div>
      <div className="timeline-content">
        <h6 className="mb-1">Tracking ID: {delivery.trackingId}</h6>
        <div className="text-muted small">
          {delivery.containerCount} containers | {delivery.tonnage} tons
        </div>
        <div className="mt-2">
          {delivery.checkpoints.map((checkpoint, idx) => (
            <div key={idx} className="checkpoint">
              <span className="badge bg-secondary me-2">{new Date(checkpoint.timestamp).toLocaleDateString()}</span>
              {checkpoint.location} - {checkpoint.status}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ParentBookingDetails({ booking, onClose }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [milestoneNotifications, setMilestoneNotifications] = useState([]);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const data = await deliveryApi.getDeliveriesByParentId(booking.id);
        setDeliveries(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
        setLoading(false);
      }
    };

    const fetchMilestoneNotifications = async () => {
      try {
        const data = await deliveryApi.getMilestoneNotifications(booking.id);
        setMilestoneNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchDeliveries();
    fetchMilestoneNotifications();
  }, [booking.id]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedDeliveries = [...deliveries].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'tonnage':
        comparison = a.tonnage - b.tonnage;
        break;
      case 'status':
        comparison = a.currentStatus.localeCompare(b.currentStatus);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="modal-dialog modal-xl">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Booking Details: {booking.id}</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          {/* Summary Section */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Customer Information</h6>
                  <p className="mb-1">Name: {booking.customerName}</p>
                  <p className="mb-1">Phone: {booking.phoneNumber}</p>
                  <p className="mb-1">Total Tonnage: {booking.totalTonnage} tons</p>
                </div>
                <div className="col-md-6">
                  <h6>Shipping Details</h6>
                  <p className="mb-1">From: {booking.loading_point}</p>
                  <p className="mb-1">To: {booking.destination}</p>
                  <p className="mb-1">Mineral Type: {booking.mineral_type}</p>
                  <p className="mb-1">Mineral Grade: {booking.mineral_grade}</p>
                  <p className="mb-1">Deadline: {new Date(booking.deadline).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress and Milestones */}
          <div className="card mb-4">
            <div className="card-body">
              <h6>Progress & Milestones</h6>
              <div className="progress mb-3" style={{ height: '25px' }}>
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
              <div className="milestone-notifications">
                {milestoneNotifications.map((notification, idx) => (
                  <div key={idx} className="alert alert-info">
                    <small className="text-muted">{new Date(notification.timestamp).toLocaleString()}</small>
                    <p className="mb-0">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deliveries List */}
          <div className="card">
            <div className="card-body">
              <h6 className="d-flex justify-content-between align-items-center">
                Deliveries
                <div className="btn-group">
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => handleSort('createdAt')}
                    aria-label="Sort by date"
                  >
                    Date {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => handleSort('tonnage')}
                    aria-label="Sort by tonnage"
                  >
                    Tonnage {sortField === 'tonnage' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => handleSort('status')}
                    aria-label="Sort by status"
                  >
                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </h6>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="timeline mt-4">
                  {sortedDeliveries.map(delivery => (
                    <DeliveryTimeline key={delivery.trackingId} delivery={delivery} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => navigate(`/track/${booking.id}`)}
          >
            View Public Tracking
          </button>
        </div>
      </div>
    </div>
  );
} 