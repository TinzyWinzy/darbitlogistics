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

// Improved Pagination Bar Component
function PaginationBar({ page, setPage, pageSize, setPageSize, total }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const getPageNumbers = () => {
    const delta = 2;
    let start = Math.max(1, page - delta);
    let end = Math.min(totalPages, page + delta);
    if (page <= delta) end = Math.min(1 + 2 * delta, totalPages);
    if (page > totalPages - delta) start = Math.max(1, totalPages - 2 * delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const baseBtnStyle = {
    border: '1px solid #D2691E',
    borderRadius: 4,
    padding: '0.3em 0.7em',
    minWidth: 32,
    margin: '0 2px',
    fontSize: '0.95em',
    boxShadow: 'none',
    transition: 'background 0.2s, color 0.2s',
    fontWeight: 500,
    outline: 'none',
    background: '#fff',
    color: '#1F2120',
    cursor: 'pointer',
  };
  const disabledBtnStyle = {
    ...baseBtnStyle,
    background: '#faf9f7',
    color: '#bbb',
    cursor: 'not-allowed',
  };
  const activeBtnStyle = {
    ...baseBtnStyle,
    background: '#D2691E',
    color: '#fff',
    fontWeight: 700,
  };

  return (
    <nav
      className="pagination-bar"
      role="navigation"
      aria-label="Pagination"
      style={{
        display: 'flex',
        gap: 0,
        justifyContent: 'center',
        margin: '0.5rem 0 0.5rem 0',
        background: '#fffbe6',
        borderRadius: 6,
        boxShadow: 'none',
        padding: '0.2em 0.2em',
      }}
    >
      <button
        className="pagination-btn"
        onClick={() => setPage(1)}
        disabled={page === 1}
        aria-label="First page"
        style={page === 1 ? disabledBtnStyle : baseBtnStyle}
      >«</button>
      <button
        className="pagination-btn"
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        style={page === 1 ? disabledBtnStyle : baseBtnStyle}
      >‹</button>
      {getPageNumbers().map(p => (
        <button
          key={p}
          className="pagination-btn"
          onClick={() => setPage(p)}
          aria-label={`Go to page ${p}`}
          aria-current={p === page ? "page" : undefined}
          style={p === page ? activeBtnStyle : baseBtnStyle}
        >{p}</button>
      ))}
      <button
        className="pagination-btn"
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        style={page === totalPages ? disabledBtnStyle : baseBtnStyle}
      >›</button>
      <button
        className="pagination-btn"
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages}
        aria-label="Last page"
        style={page === totalPages ? disabledBtnStyle : baseBtnStyle}
      >»</button>
      <div className="ms-2">
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto', display: 'inline-block', fontSize: '0.95em', padding: '0.2em 0.5em' }}
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          aria-label="Select page size"
        >
          {[5, 10, 20, 50, 100].map(size => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
      </div>
    </nav>
  );
}

// Add color map for custom statuses
const statusBadgeColors = {
  'Delayed': 'bg-danger',
  'Awaiting Payment': 'bg-warning text-dark',
  'In Customs': 'bg-info',
  'Completed': 'bg-success',
  'Active': 'bg-primary',
  '': 'bg-secondary',
};

// Progress steps for delivery status
const DELIVERY_STATUS_STEPS = [
  'Pending',
  'At Mine',
  'In Transit',
  'At Border',
  'At Port',
  'At Port of Destination',
  'At Warehouse',
  'Delivered',
  'Cancelled'
];

function DeliveryProgressBar({ status }) {
  const idx = DELIVERY_STATUS_STEPS.indexOf(status);
  const percent = idx === -1 ? 0 : Math.round((idx / (DELIVERY_STATUS_STEPS.length - 1)) * 100);
  let barColor = '#1F2120';
  if (status === 'Delivered') barColor = '#198754'; // Bootstrap green
  else if (status === 'Cancelled') barColor = '#dc3545'; // Bootstrap red
  return (
    <div className="progress" style={{ height: 8, background: '#f3ede7', marginBottom: 6 }} title={`Status: ${status} (${idx + 1}/${DELIVERY_STATUS_STEPS.length})`}>
      <div
        className="progress-bar"
        role="progressbar"
        style={{ width: `${percent}%`, backgroundColor: barColor, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
      </div>
    </div>
  );
}

const ConsignmentMonitor = ({ parentBookings, loading, error, selectedId, onSelectDelivery, page, setPage, pageSize, setPageSize, total, search, setSearch, progressFilter, setProgressFilter, progressSort, setProgressSort, progressSortOrder, setProgressSortOrder, customStatusFilter, setCustomStatusFilter }) => {
  const [openBookingId, setOpenBookingId] = useState(null);

  return (
    <div className="card shadow-sm border-0 mb-4" role="region" aria-labelledby="consignment-monitor-heading">
      {/* Strategic Operations Console Banner */}
      <div className="bg-warning text-dark text-center py-1 small fw-bold" style={{ letterSpacing: '1px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}>
        STRATEGIC OPERATIONS CONSOLE
      </div>
      <div className="card-body">
        <h2 id="consignment-monitor-heading" className="h5 fw-bold mb-3" style={{ color: '#1F2120' }}>
          <span className="material-icons-outlined align-middle me-2" style={{ color: '#1F2120' }}>list_alt</span>
          Consignment & Load Monitoring
        </h2>
        {/* Search and Filter Controls */}
        <div
          className="d-flex flex-wrap align-items-center gap-2 mb-2"
          style={{
            rowGap: '0.3rem',
            columnGap: '0.7rem',
            fontSize: '0.97em',
            padding: '0.3rem 0.2rem',
            borderRadius: 6,
            background: '#f8f8f6',
            boxShadow: 'none',
            flexDirection: 'row',
          }}
        >
          <div className="input-group flex-grow-1" style={{ minWidth: 180, maxWidth: 320 }}>
            <span className="input-group-text bg-white" style={{ color: '#1F2120', padding: '0.2em 0.6em', fontSize: '1em' }}>
              <span className="material-icons-outlined" style={{ fontSize: '1.1em' }}>search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search consignments or loads..."
              className="form-control"
              disabled={loading}
              style={{ fontSize: '0.97em', padding: '0.3em 0.6em' }}
            />
          </div>
          <div className="d-flex align-items-center gap-1" style={{ minWidth: 120 }}>
            <label htmlFor="progressFilter" className="form-label text-muted mb-0 small" style={{ fontSize: '0.95em' }}>Status:</label>
            <select
              id="progressFilter"
              className="form-select form-select-sm"
              style={{ flexBasis: '100px', fontSize: '0.95em', padding: '0.2em 0.5em' }}
              value={progressFilter}
              onChange={e => { setProgressFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="not-started">Not Started</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="d-flex align-items-center gap-1" style={{ minWidth: 120 }}>
            <label htmlFor="customStatusFilter" className="form-label text-muted mb-0 small" style={{ fontSize: '0.95em' }}>Custom Status:</label>
            <select
              id="customStatusFilter"
              className="form-select form-select-sm"
              style={{ flexBasis: '100px', fontSize: '0.95em', padding: '0.2em 0.5em' }}
              value={customStatusFilter}
              onChange={e => { setCustomStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All</option>
              <option value="Delayed">Delayed</option>
              <option value="Awaiting Payment">Awaiting Payment</option>
              <option value="In Customs">In Customs</option>
              <option value="Completed">Completed</option>
              <option value="Active">Active</option>
            </select>
          </div>
          <div className="d-flex align-items-center gap-1" style={{ minWidth: 120 }}>
            <label htmlFor="progressSort" className="form-label text-muted mb-0 small" style={{ fontSize: '0.95em' }}>Sort by:</label>
            <select
              id="progressSort"
              className="form-select form-select-sm"
              style={{ flexBasis: '100px', fontSize: '0.95em', padding: '0.2em 0.5em' }}
              value={progressSort}
              onChange={e => { setProgressSort(e.target.value); setPage(1); }}
            >
              <option value="deadline">Deadline</option>
              <option value="progress">Progress</option>
              <option value="tonnage">Tonnage</option>
              <option value="customer">Customer</option>
            </select>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => { setProgressSortOrder(order => order === 'asc' ? 'desc' : 'asc'); setPage(1); }}
              aria-label="Toggle sort order"
              style={{ padding: '0.2em 0.5em', fontSize: '1em', marginLeft: 2 }}
            >
              {progressSortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        {/* Responsive stacking for small screens */}
        <style>{`
          @media (max-width: 600px) {
            .d-flex.flex-wrap.align-items-center.gap-2.mb-2 {
              flex-direction: column !important;
              align-items: stretch !important;
              row-gap: 0.5rem !important;
              column-gap: 0 !important;
            }
            .input-group.flex-grow-1 {
              max-width: 100% !important;
            }
          }
        `}</style>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="alert alert-danger">Error: {error}</div>
        ) : parentBookings.length === 0 ? (
          <div className="alert alert-warning">No consignments found matching your criteria.</div>
        ) : (
          <>
            <div className="accordion" id="bookingAccordion" style={{ background: '#f7f7f5', borderRadius: 8, padding: '0.5rem 0.2rem' }}>
              {parentBookings.map((booking) => (
                <div
                  className="accordion-item mb-2 p-2"
                  key={booking.id}
                  style={{
                    borderRadius: '0.4rem',
                    border: '1px solid #eee',
                    background: '#fff',
                    marginBottom: 6,
                    boxShadow: '0 1px 2px rgba(31,33,32,0.03)',
                    padding: '0.5rem 0.7rem',
                  }}
                >
                  <h2 className="accordion-header" id={`heading-${booking.id}`}
                    style={{ fontSize: '1.05em', marginBottom: 0 }}>
                    <button
                      className={`accordion-button ${openBookingId !== booking.id ? 'collapsed' : ''}`}
                      type="button"
                      onClick={() => setOpenBookingId(openBookingId === booking.id ? null : booking.id)}
                      aria-expanded={openBookingId === booking.id}
                      aria-controls={`collapse-${booking.id}`}
                      style={{
                        padding: '0.4em 0.7em',
                        fontSize: '1em',
                        background: '#f9f9f7',
                        borderRadius: '0.3rem',
                        minHeight: 0,
                      }}
                    >
                      <div className="w-100 d-flex justify-content-between align-items-center pe-2">
                        <div>
                          <strong style={{ color: '#1F2120', fontSize: '1em' }}>{booking.customerName}</strong>
                          <small className="text-muted ms-2" style={{ fontSize: '0.93em' }}>({booking.bookingCode})</small>
                          <div className="text-muted small mt-1" style={{ fontSize: '0.92em' }}>
                            {booking.loadingPoint} &rarr; {booking.destination}
                          </div>
                        </div>
                        <span className={`badge ${getDeadlineBadgeClass(booking.deadline)}`} style={{ fontSize: '0.93em', padding: '0.35em 0.7em' }}>
                          {getTimeLeft(booking.deadline)}
                        </span>
                      </div>
                    </button>
                  </h2>
                  <div
                    id={`collapse-${booking.id}`}
                    className={`accordion-collapse collapse ${openBookingId === booking.id ? 'show' : ''}`}
                  >
                    <div className="accordion-body" style={{ padding: '0.7em 0.5em 0.5em 0.5em', fontSize: '0.97em' }}>
                      {/* Progress Bar and Stats */}
                      <div className="progress mb-1" style={{ height: '16px', background: '#f3ede7' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${booking.completionPercentage}%`,
                            backgroundColor: '#D2691E',
                            fontSize: '0.93em',
                            padding: 0,
                          }}
                        >
                          {booking.completionPercentage}%
                        </div>
                      </div>
                      <div className="row g-2 text-muted small mb-2" style={{ fontSize: '0.92em' }}>
                        <div className="col"><strong>From:</strong> {booking.loadingPoint}</div>
                        <div className="col"><strong>To:</strong> {booking.destination}</div>
                        <div className="col"><strong>Mineral:</strong> {booking.mineralType || 'N/A'}</div>
                      </div>
                      <div className="row g-2 text-muted small mb-2" style={{ fontSize: '0.92em' }}>
                        <div className="col"><strong>Total:</strong> {booking.totalTonnage}t</div>
                        <div className="col"><strong>Completed:</strong> {booking.completedTonnage}t</div>
                        <div className="col"><strong>Loads:</strong> {(booking.deliveries || []).length}</div>
                      </div>

                      {/* Deliveries List */}
                      {(booking.deliveries || []).length > 0 ? (
                        <ul className="list-group list-group-flush" style={{ marginTop: 2 }}>
                          {(booking.deliveries || []).map((delivery, index) => {
                            // Normalize fields for both camelCase and snake_case
                            const trackingId = delivery.trackingId || delivery.tracking_id || index;
                            const driverDetails = delivery.driverDetails || delivery.driver_details || {};
                            const driverName = driverDetails.name || 'N/A';
                            const vehicleReg = driverDetails.vehicleReg || driverDetails.vehicle_reg || 'N/A';
                            const currentStatus = delivery.currentStatus || delivery.current_status || 'Pending';
                            const isCompleted = delivery.isCompleted ?? delivery.is_completed ?? false;
                            const tonnage = Number(delivery.tonnage || 0);
                            const containerCount = Number(delivery.containerCount ?? delivery.container_count ?? 0);
                            const value = Number(delivery.value ?? 0);
                            const cost = Number(delivery.cost ?? 0);
                            const customStatus = delivery.customStatus || delivery.custom_status || '';

                            const isSelected = selectedId === trackingId;
                            const itemStyle = {
                              cursor: 'pointer',
                              fontSize: '0.96em',
                              padding: '0.5em 0.7em',
                              ...(isSelected && {
                                backgroundColor: '#1F2120',
                                color: '#EBD3AD',
                                borderColor: '#1F2120',
                              })
                            };
                            const headerStyle = {
                              color: isSelected ? '#EBD3AD' : '#1F2120',
                              fontSize: '1em',
                            };

                            return (
                              <li
                                key={trackingId}
                                className="list-group-item list-group-item-action p-2"
                                style={itemStyle}
                                onClick={() => onSelectDelivery(trackingId)}
                              >
                                {/* Modern Card Layout */}
                                <div className="row align-items-center g-2">
                                  <div className="col-12 col-md-8">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <strong className="d-block" style={headerStyle}>{trackingId}</strong>
                                        <small className={isSelected ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.92em' }}>
                                          {driverName} ({vehicleReg})
                                        </small>
                                      </div>
                                      <span className={`badge rounded-pill align-self-center fs-6 ${isCompleted ? 'bg-success' : 'bg-info'}`} style={{ fontSize: '0.93em', padding: '0.3em 0.7em' }}>
                                        {currentStatus}
                                      </span>
                                    </div>
                                    {/* Progress Bar for Delivery Status */}
                                    <DeliveryProgressBar status={currentStatus} />
                                  </div>
                                  <div className="col-12 col-md-4">
                                    <div className="d-flex flex-wrap gap-2 justify-content-end">
                                      <span className="badge bg-light text-dark border" title="Tonnage" style={{ fontSize: '0.92em' }}>
                                        <span className="material-icons-outlined align-middle" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>scale</span> {tonnage.toLocaleString()}t
                                      </span>
                                      <span className="badge bg-light text-dark border" title="Containers" style={{ fontSize: '0.92em' }}>
                                        <span className="material-icons-outlined align-middle" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>inventory_2</span> {containerCount}
                                      </span>
                                      <span className="badge bg-light text-success border" title="Value" style={{ fontSize: '0.92em' }}>
                                        <span className="material-icons-outlined align-middle" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>attach_money</span> ${value.toLocaleString()}
                                      </span>
                                      <span className="badge bg-light text-danger border" title="Cost" style={{ fontSize: '0.92em' }}>
                                        <span className="material-icons-outlined align-middle" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>money_off</span> ${cost.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* Old meta row can be removed or left for redundancy */}
                                {/* <div className={`mt-2 pt-2 border-top d-flex justify-content-between small ${isSelected ? 'text-white-50 border-top-light' : 'text-muted'}`} style={{ fontSize: '0.91em' }}>
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
                                  <span className="badge ms-2" style={{ fontSize: '0.93em', padding: '0.3em 0.7em', background: statusBadgeColors[delivery.customStatus] || 'bg-secondary' }} title={delivery.customStatus}>
                                    {delivery.customStatus || 'N/A'}
                                  </span>
                                  <span className="ms-2 text-success" title="Value">${delivery.value?.toLocaleString() || '0'}</span>
                                  <span className="ms-2 text-danger" title="Cost">${delivery.cost?.toLocaleString() || '0'}</span>
                                </div> */}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-muted text-center small mt-2" style={{ fontSize: '0.92em' }}>No loads dispatched for this consignment yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-1" style={{ fontSize: '0.91em' }}>
                    <span className="text-muted small">Last updated by: {booking.lastUpdatedBy || 'N/A'} on {booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : 'N/A'}</span>
                    <button className="btn btn-outline-danger btn-sm" style={{ fontSize: '0.82rem', padding: '0.2em 0.6em' }} disabled title="Flag for Review (internal)">
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
