import React, { useState, useMemo } from 'react';

// Helper functions for deadline badges
function getDeadlineBadgeClass(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline < 0) return 'bg-danger';
  if (daysUntilDeadline <= 3) return 'bg-warning text-dark';
  return 'bg-success';
}

function getTimeLeft(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  
  if (diff <= 0) return 'EXPIRED';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${days}d ${hours}h`;
}

function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-4">
      <div className="spinner-border" style={{ color: '#D2691E' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

const ConsignmentMonitor = ({ parentBookings, deliveries, loading, error, selectedId, onSelectDelivery }) => {
  const [search, setSearch] = useState('');
  const [openBookingId, setOpenBookingId] = useState(null);
  const [progressFilter, setProgressFilter] = useState('all');
  const [progressSort, setProgressSort] = useState('deadline');
  const [progressSortOrder, setProgressSortOrder] = useState('asc');

  const filteredAndSortedParentBookings = useMemo(() => {
    const q = search.toLowerCase();

    const withDeliveries = parentBookings.map(booking => ({
      ...booking,
      deliveries: deliveries.filter(d => d.parentBookingId === booking.id)
    }));

    const searchFiltered = q ? withDeliveries.filter(booking => {
      if (
        (booking.customerName || '').toLowerCase().includes(q) ||
        (booking.bookingCode || '').toLowerCase().includes(q) ||
        (booking.destination || '').toLowerCase().includes(q) ||
        (booking.loadingPoint || '').toLowerCase().includes(q)
      ) {
        return true;
      }

      const hasMatchingDelivery = booking.deliveries.some(d =>
        (d.trackingId || '').toLowerCase().includes(q) ||
        (d.currentStatus || '').toLowerCase().includes(q) ||
        (d.driverDetails?.name || '').toLowerCase().includes(q) ||
        (d.driverDetails?.vehicleReg || '').toLowerCase().includes(q)
      );

      return hasMatchingDelivery;
    }) : withDeliveries;

    const progressFiltered = searchFiltered.filter(booking => {
      switch (progressFilter) {
        case 'completed':
          return booking.completionPercentage === 100;
        case 'in-progress':
          return booking.completionPercentage > 0 && booking.completionPercentage < 100;
        case 'not-started':
          return booking.completionPercentage === 0;
        case 'overdue':
          const isOverdue = new Date(booking.deadline) < new Date();
          return isOverdue && booking.completionPercentage < 100;
        default:
          return true;
      }
    });

    const sorted = progressFiltered.sort((a, b) => {
      let comparison = 0;
      switch (progressSort) {
        case 'deadline':
          comparison = new Date(a.deadline) - new Date(b.deadline);
          break;
        case 'progress':
          comparison = a.completionPercentage - b.completionPercentage;
          break;
        case 'tonnage':
          comparison = a.totalTonnage - b.totalTonnage;
          break;
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        default:
          comparison = 0;
      }
      return progressSortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [search, parentBookings, deliveries, progressFilter, progressSort, progressSortOrder]);

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
          <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>list_alt</span>
          Consignment & Load Monitoring
        </h2>
        
        {/* Search and Filter Controls */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <div className="input-group flex-grow-1">
            <span className="input-group-text bg-white" style={{ color: '#D2691E' }}>
              <span className="material-icons">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search consignments or loads..."
              className="form-control"
              disabled={loading}
            />
          </div>
          
          <select 
            className="form-select form-select-sm" 
            style={{ flexBasis: '150px' }}
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="not-started">Not Started</option>
            <option value="overdue">Overdue</option>
          </select>

          <select 
            className="form-select form-select-sm" 
            style={{ flexBasis: '150px' }}
            value={progressSort}
            onChange={(e) => setProgressSort(e.target.value)}
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="progress">Sort: Progress</option>
            <option value="tonnage">Sort: Tonnage</option>
            <option value="customer">Sort: Customer</option>
          </select>

          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={() => setProgressSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
          >
            {progressSortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="alert alert-danger">Error: {error}</div>
        ) : filteredAndSortedParentBookings.length === 0 ? (
          <div className="alert alert-warning">No consignments found matching your criteria.</div>
        ) : (
          <div className="accordion" id="bookingAccordion">
            {filteredAndSortedParentBookings.map((booking) => (
              <div className="accordion-item" key={booking.id}>
                <h2 className="accordion-header" id={`heading-${booking.id}`}>
                  <button 
                    className={`accordion-button ${openBookingId !== booking.id ? 'collapsed' : ''}`} 
                    type="button" 
                    onClick={() => setOpenBookingId(openBookingId === booking.id ? null : booking.id)}
                  >
                    <div className="w-100 d-flex justify-content-between align-items-center pe-2">
                      <div>
                        <strong style={{ color: '#a14e13' }}>{booking.customerName}</strong>
                        <small className="text-muted ms-2">({booking.bookingCode})</small>
                      </div>
                      <span className={`badge ${getDeadlineBadgeClass(booking.deadline)}`}>
                        {getTimeLeft(booking.deadline)}
                      </span>
                    </div>
                  </button>
                </h2>
                <div 
                  id={`collapse-${booking.id}`} 
                  className={`accordion-collapse collapse ${openBookingId === booking.id ? 'show' : ''}`}
                >
                  <div className="accordion-body">
                    {/* Progress Bar and Stats */}
                    <div className="progress mb-2" style={{ height: '20px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar"
                        style={{ 
                          width: `${booking.completionPercentage}%`,
                          backgroundColor: '#D2691E'
                        }}
                      >
                        {booking.completionPercentage}%
                      </div>
                    </div>
                    <div className="row g-2 text-muted small mb-3">
                      <div className="col"><strong>Total:</strong> {booking.totalTonnage}t</div>
                      <div className="col"><strong>Completed:</strong> {booking.completedTonnage}t</div>
                      <div className="col"><strong>Loads:</strong> {booking.deliveries.length}</div>
                    </div>

                    {/* Deliveries List */}
                    {booking.deliveries.length > 0 ? (
                      <ul className="list-group list-group-flush">
                        {booking.deliveries.map(delivery => (
                          <li
                            key={delivery.trackingId}  
                            className={`list-group-item list-group-item-action p-3 ${selectedId === delivery.trackingId ? 'active' : ''}`}
                            style={selectedId === delivery.trackingId ? { background: '#D269-1E', color: '#fff', borderColor: '#D2691E' } : { cursor: 'pointer' }}
                            onClick={() => onSelectDelivery(delivery.trackingId)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong className="d-block" style={{ color: '#a14e13' }}>{delivery.trackingId}</strong>
                                <small className="text-muted">{delivery.driverDetails.name} ({delivery.driverDetails.vehicleReg})</small>
                              </div>
                              <span className={`badge rounded-pill align-self-center fs-6 ${delivery.isCompleted ? 'bg-success' : 'bg-info'}`}>
                                {delivery.currentStatus}
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-top d-flex justify-content-between text-muted small">
                              <span>
                                <span className="material-icons-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>scale</span>
                                {' '}{delivery.tonnage}t
                              </span>
                              <span>
                                <span className="material-icons-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>local_shipping</span>
                                {' '}{delivery.vehicleType}
                              </span>
                              <span>
                                <span className="material-icons-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>diamond</span>
                                {' '}{delivery.mineralType || 'N/A'}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted text-center small mt-3">No loads dispatched for this consignment yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsignmentMonitor;
