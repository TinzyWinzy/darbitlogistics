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

const ConsignmentMonitor = ({ parentBookings, deliveries, loading, error, selectedId, onSelectDelivery, page = 1, setPage, pageSize = 20, setPageSize, total = 0 }) => {
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

  // Only show the current page of parent bookings
  const pagedParentBookings = filteredAndSortedParentBookings.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card shadow-sm border-0 mb-4" role="region" aria-labelledby="consignment-monitor-heading">
      {/* Internal Use Only Banner */}
      <div className="bg-warning text-dark text-center py-1 small fw-bold" style={{ letterSpacing: '1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}>
        INTERNAL USE ONLY
      </div>
      <div className="card-body">
        <h2 id="consignment-monitor-heading" className="h5 fw-bold mb-3" style={{ color: '#1F2120' }}>
          <span className="material-icons-outlined align-middle me-2" style={{ color: '#1F2120' }}>list_alt</span>
          Consignment & Load Monitoring
        </h2>
        
        {/* Search and Filter Controls */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <div className="input-group flex-grow-1">
            <span className="input-group-text bg-white" style={{ color: '#1F2120' }}>
              <span className="material-icons-outlined">search</span>
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
          
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="progressFilter" className="form-label text-muted mb-0 small">Status:</label>
            <select 
              id="progressFilter"
              className="form-select form-select-sm" 
              style={{ flexBasis: '150px' }}
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="not-started">Not Started</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label htmlFor="progressSort" className="form-label text-muted mb-0 small">Sort by:</label>
            <select 
              id="progressSort"
              className="form-select form-select-sm" 
              style={{ flexBasis: '150px' }}
              value={progressSort}
              onChange={(e) => setProgressSort(e.target.value)}
            >
              <option value="deadline">Deadline</option>
              <option value="progress">Progress</option>
              <option value="tonnage">Tonnage</option>
              <option value="customer">Customer</option>
            </select>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={() => setProgressSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
              aria-label="Toggle sort order"
            >
              {progressSortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="alert alert-danger">Error: {error}</div>
        ) : filteredAndSortedParentBookings.length === 0 ? (
          <div className="alert alert-warning">No consignments found matching your criteria.</div>
        ) : (
          <>
            {/* Pagination Controls for Parent Bookings */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="small text-muted">
                {total > 0 && (
                  <span>
                    Showing {Math.min((page - 1) * pageSize + 1, total)}-
                    {Math.min(page * pageSize, total)} of {total} consignments
                  </span>
                )}
              </div>
              <div className="btn-group" role="group" aria-label="Pagination controls">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  &laquo; Prev
                </button>
                <span className="mx-2 align-self-center small">
                  Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                </span>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= total}
                  aria-label="Next page"
                >
                  Next &raquo;
                </button>
              </div>
              <div className="ms-3">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', display: 'inline-block' }}
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="Select page size"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size} / page</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="accordion" id="bookingAccordion">
              {pagedParentBookings.map((booking) => (
                <div className="accordion-item mb-3 p-2" key={booking.id} style={{ borderRadius: '0.5rem', border: '1px solid #eee', background: '#fcfcfc' }}>
                  <h2 className="accordion-header" id={`heading-${booking.id}`}>
                    <button 
                      className={`accordion-button ${openBookingId !== booking.id ? 'collapsed' : ''}`} 
                      type="button" 
                      onClick={() => setOpenBookingId(openBookingId === booking.id ? null : booking.id)}
                      aria-expanded={openBookingId === booking.id}
                      aria-controls={`collapse-${booking.id}`}
                    >
                      <div className="w-100 d-flex justify-content-between align-items-center pe-2">
                        <div>
                          <strong style={{ color: '#1F2120' }}>{booking.customerName}</strong>
                          <small className="text-muted ms-2">({booking.bookingCode})</small>
                          <div className="text-muted small mt-1">
                            {booking.loadingPoint} &rarr; {booking.destination}
                          </div>
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
                        <div className="col"><strong>From:</strong> {booking.loadingPoint}</div>
                        <div className="col"><strong>To:</strong> {booking.destination}</div>
                      </div>
                      <div className="row g-2 text-muted small mb-3">
                        <div className="col"><strong>Total:</strong> {booking.totalTonnage}t</div>
                        <div className="col"><strong>Completed:</strong> {booking.completedTonnage}t</div>
                        <div className="col"><strong>Loads:</strong> {booking.deliveries.length}</div>
                      </div>

                      {/* Deliveries List */}
                      {booking.deliveries.length > 0 ? (
                        <ul className="list-group list-group-flush">
                          {booking.deliveries.map(delivery => {
                            const isSelected = selectedId === delivery.trackingId;
                            const itemStyle = {
                              cursor: 'pointer',
                              ...(isSelected && {
                                backgroundColor: '#1F2120',
                                color: '#EBD3AD',
                                borderColor: '#1F2120'
                              })
                            };
                            const headerStyle = {
                              color: isSelected ? '#EBD3AD' : '#1F2120'
                            };

                            return (
                              <li
                                key={delivery.trackingId}
                                className="list-group-item list-group-item-action p-3"
                                style={itemStyle}
                                onClick={() => onSelectDelivery(delivery.trackingId)}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong className="d-block" style={headerStyle}>{delivery.trackingId}</strong>
                                    <small className={isSelected ? 'text-white-50' : 'text-muted'}>
                                      {delivery.driverDetails.name} ({delivery.driverDetails.vehicleReg})
                                    </small>
                                  </div>
                                  <span className={`badge rounded-pill align-self-center fs-6 ${delivery.isCompleted ? 'bg-success' : 'bg-info'}`}>
                                    {delivery.currentStatus}
                                  </span>
                                </div>
                                <div className={`mt-2 pt-2 border-top d-flex justify-content-between small ${isSelected ? 'text-white-50 border-top-light' : 'text-muted'}`}>
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
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-muted text-center small mt-3">No loads dispatched for this consignment yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-muted small">Last updated by: {booking.lastUpdatedBy || 'N/A'} on {booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : 'N/A'}</span>
                    <button className="btn btn-outline-danger btn-sm" style={{ fontSize: '0.85rem' }} disabled title="Flag for Review (internal)">
                      <span className="material-icons-outlined align-middle" style={{ fontSize: '1rem' }}>flag</span> Flag for Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="mt-4 text-center text-muted small">
          For support: <a href="mailto:info@morres.com" style={{ color: '#1F2120' }}>info@morres.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
        </div>
      </div>
    </div>
  );
};

export default ConsignmentMonitor;
