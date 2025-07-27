import React, { useState, useMemo, useEffect } from 'react';
import Spinner from '../components/Spinner';
import PaginationBar from '../components/PaginationBar';
import DeliveryProgressBar from '../components/DeliveryProgressBar';
import CheckpointLoggerForm from './CheckpointLoggerForm';
import { normalizeKeys } from '../services/normalizeKeys';

// Helper functions for deadline badges
function getDeadlineBadgeClass(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline < 0) return 'modern-badge-danger';
  if (daysUntilDeadline <= 3) return 'modern-badge-warning';
  return 'modern-badge-success';
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

// Add color map for custom statuses
const statusBadgeColors = {
  'Delayed': 'modern-badge-danger',
  'Awaiting Payment': 'modern-badge-warning',
  'In Customs': 'modern-badge-info',
  'Completed': 'modern-badge-success',
  'Active': 'modern-badge-info',
  '': 'modern-badge-secondary',
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

const ConsignmentMonitor = ({ parentBookings, loading, error, onSelectDelivery, user, onSubmitCheckpoint, onSuccess, onFeedback }) => {
  // Normalize parentBookings to camelCase
  const normalizedBookings = useMemo(() => normalizeKeys(parentBookings), [parentBookings]);
  // Internalize all control state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [progressFilter, setProgressFilter] = useState('all');
  const [progressSort, setProgressSort] = useState('deadline');
  const [progressSortOrder, setProgressSortOrder] = useState('asc');
  const [customStatusFilter, setCustomStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [openBookingId, setOpenBookingId] = useState(null);

  // Filtering, sorting, and pagination logic
  const filteredBookings = useMemo(() => {
    let filtered = normalizedBookings;
    if (search) {
      filtered = filtered.filter(b =>
        (b.customerName && b.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (b.trackingId && b.trackingId.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (progressFilter !== 'all') {
      filtered = filtered.filter(b => {
        if (progressFilter === 'completed') return b.status === 'Completed';
        if (progressFilter === 'in-progress') return b.status === 'Active' || b.status === 'In Transit';
        if (progressFilter === 'not-started') return b.status === 'Pending';
        if (progressFilter === 'overdue') return b.deadline && new Date(b.deadline) < new Date();
        return true;
      });
    }
    if (customStatusFilter !== 'all') {
      filtered = filtered.filter(b => b.customStatus === customStatusFilter);
    }
    // Sorting
    filtered = [...filtered].sort((a, b) => {
      let valA, valB;
      switch (progressSort) {
        case 'deadline':
          valA = a.deadline ? new Date(a.deadline) : new Date(0);
          valB = b.deadline ? new Date(b.deadline) : new Date(0);
          break;
        case 'progress':
          valA = a.progress || 0;
          valB = b.progress || 0;
          break;
        case 'tonnage':
          valA = a.tonnage || 0;
          valB = b.tonnage || 0;
          break;
        case 'customer':
          valA = a.customerName || '';
          valB = b.customerName || '';
          break;
        default:
          valA = 0; valB = 0;
      }
      if (valA < valB) return progressSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return progressSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [normalizedBookings, search, progressFilter, customStatusFilter, progressSort, progressSortOrder]);

  // Pagination
  const total = filteredBookings.length;
  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, page, pageSize]);

  // Selection handler
  const handleSelect = (id) => {
    setSelectedId(id === selectedId ? null : id);
    if (onSelectDelivery) onSelectDelivery(id === selectedId ? null : id);
  };

  // Reset page if filters/search change
  useEffect(() => { setPage(1); }, [search, progressFilter, customStatusFilter, progressSort, progressSortOrder]);

  return (
    <div className="modern-card glassmorphism-card" role="region" aria-labelledby="consignment-monitor-heading">
      {/* Strategic Operations Console Banner */}
      <div className="modern-card-header bg-warning text-dark text-center py-3 small fw-bold" style={{ letterSpacing: '1px', background: 'linear-gradient(135deg, var(--warning-yellow), #ffd54f)' }}>
        <span className="material-icons-outlined me-2">monitoring</span>
        STRATEGIC OPERATIONS CONSOLE
      </div>
      
      <div className="modern-card-body">
        <h2 id="consignment-monitor-heading" className="h5 fw-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
          <span className="material-icons-outlined align-middle me-2" style={{ color: 'var(--primary-orange)' }}>list_alt</span>
          Consignment & Load Monitoring
        </h2>

        {/* Modern Search and Filter Controls */}
        <div className="modern-card glassmorphism-card mb-4">
          <div className="modern-card-body">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label htmlFor="searchInput" className="modern-form-label">Search</label>
                <div className="input-group">
                  <span className="input-group-text glassmorphism-input" style={{ color: 'var(--primary-orange)' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '1.1em' }}>search</span>
                  </span>
                  <input
                    type="text"
                    id="searchInput"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search consignments or loads..."
                    className="modern-form-control glassmorphism-input"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="col-12 col-md-2">
                <label htmlFor="progressFilter" className="modern-form-label">Status</label>
                <select
                  id="progressFilter"
                  className="modern-form-control glassmorphism-input"
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
              
              <div className="col-12 col-md-2">
                <label htmlFor="customStatusFilter" className="modern-form-label">Custom Status</label>
                <select
                  id="customStatusFilter"
                  className="modern-form-control glassmorphism-input"
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
              
              <div className="col-12 col-md-2">
                <label htmlFor="progressSort" className="modern-form-label">Sort by</label>
                <select
                  id="progressSort"
                  className="modern-form-control glassmorphism-input"
                  value={progressSort}
                  onChange={e => { setProgressSort(e.target.value); setPage(1); }}
                >
                  <option value="deadline">Deadline</option>
                  <option value="progress">Progress</option>
                  <option value="tonnage">Tonnage</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              
              <div className="col-12 col-md-2">
                <label className="modern-form-label">Order</label>
                <button
                  className="btn-modern btn-modern-secondary w-100 glassmorphism-btn"
                  onClick={() => { setProgressSortOrder(order => order === 'asc' ? 'desc' : 'asc'); setPage(1); }}
                  aria-label="Toggle sort order"
                >
                  {progressSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary UI for pagination */}
        {total > 0 && (
          <div className="modern-badge modern-badge-info glassmorphism-badge mb-3">
            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>info</span>
            Showing {Math.min((page - 1) * pageSize + 1, total)}-
            {Math.min(page * pageSize, total)} of {total} consignments
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="modern-loading" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger modern-card glassmorphism-card">
            <span className="material-icons-outlined me-2">error_outline</span>
            Error: {error}
          </div>
        ) : paginatedBookings.length === 0 ? (
          <div className="alert alert-warning modern-card glassmorphism-card text-center py-5">
            <span className="material-icons-outlined mb-3" style={{ fontSize: '3rem', opacity: 0.5 }}>search_off</span>
            <h5>No consignments found</h5>
            <p className="text-muted">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <>
            <div className="accordion" id="bookingAccordion">
              {paginatedBookings.map((booking) => (
                <div
                  className="modern-accordion-item glassmorphism-card"
                  key={booking.id}
                >
                  <h2 className="accordion-header" id={`heading-${booking.id}`}>
                    <button
                      className={`accordion-button glassmorphism-btn ${openBookingId !== booking.id ? 'collapsed' : ''}`}
                      type="button"
                      onClick={() => setOpenBookingId(openBookingId === booking.id ? null : booking.id)}
                      aria-expanded={openBookingId === booking.id}
                      aria-controls={`collapse-${booking.id}`}
                    >
                      <div className="w-100 d-flex justify-content-between align-items-center pe-2">
                        <div>
                          <strong style={{ color: 'var(--primary-blue)', fontSize: '1.1em' }}>
                            {booking.customerName}
                          </strong>
                          <small className="text-muted ms-2" style={{ fontSize: '0.9em' }}>
                            ({booking.bookingCode})
                          </small>
                          <div className="text-muted small mt-1" style={{ fontSize: '0.9em' }}>
                            {booking.loadingPoint} &rarr; {booking.destination}
                          </div>
                        </div>
                        <span className={`modern-badge glassmorphism-badge ${getDeadlineBadgeClass(booking.deadline)}`}>
                          {getTimeLeft(booking.deadline)}
                        </span>
                      </div>
                    </button>
                  </h2>
                  
                  <div
                    id={`collapse-${booking.id}`}
                    className={`accordion-collapse collapse ${openBookingId === booking.id ? 'show' : ''}`}
                  >
                    <div className="modern-accordion-body">
                      {/* Consignment Progress Bar with label */}
                      <div className="mb-4">
                        <div className="fw-bold mb-2" style={{ fontSize: '1em', color: 'var(--primary-blue)' }}>
                          Consignment Progress: {booking.completionPercentage}% Complete
                        </div>
                        <div className="modern-progress glassmorphism-progress">
                          <div
                            className="modern-progress-bar"
                            role="progressbar"
                            style={{ 
                              width: `${booking.completionPercentage}%`,
                              background: 'linear-gradient(135deg, var(--primary-orange), var(--accent-orange))'
                            }}
                            aria-valuenow={booking.completionPercentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <span className="d-none d-md-inline" style={{ color: '#fff', fontWeight: 500 }}>
                              {booking.completionPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-md-3">
                          <div className="modern-card glassmorphism-card p-3 text-center">
                            <div className="fw-bold" style={{ color: 'var(--primary-blue)' }}>{booking.loadingPoint}</div>
                            <small className="text-muted">From</small>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="modern-card glassmorphism-card p-3 text-center">
                            <div className="fw-bold" style={{ color: 'var(--success-green)' }}>{booking.destination}</div>
                            <small className="text-muted">To</small>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="modern-card glassmorphism-card p-3 text-center">
                            <div className="fw-bold" style={{ color: 'var(--info-cyan)' }}>{booking.mineralType || 'N/A'}</div>
                            <small className="text-muted">Mineral</small>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="modern-card glassmorphism-card p-3 text-center">
                            <div className="fw-bold" style={{ color: 'var(--warning-yellow)' }}>{booking.totalTonnage}t</div>
                            <small className="text-muted">Total</small>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-md-4">
                          <div className="modern-card glassmorphism-card p-3 text-center">
                            <div className="fw-bold" style={{ color: 'var(--success-green)' }}>{booking.completedTonnage}t</div>
                            <small className="text-muted">Completed</small>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="modern-card glassmorphism-card p-3 text-center">
                            <div className="fw-bold" style={{ color: 'var(--primary-blue)' }}>{(booking.deliveries || []).length}</div>
                            <small className="text-muted">Loads</small>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="modern-card glassmorphism-card p-3 text-center">
                            <div className="fw-bold" style={{ color: 'var(--info-cyan)' }}>{booking.remainingTonnage}t</div>
                            <small className="text-muted">Remaining</small>
                          </div>
                        </div>
                      </div>

                      {/* Deliveries List */}
                      {(booking.deliveries || []).length > 0 ? (
                        <div className="modern-card glassmorphism-card">
                          <div className="modern-card-header">
                            <h6 className="mb-0">Dispatched Loads</h6>
                          </div>
                          <div className="modern-card-body p-0">
                            <ul className="list-group list-group-flush">
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
                                  padding: '1rem',
                                  transition: 'var(--transition-slow)',
                                  background: isSelected ? 'linear-gradient(135deg, var(--primary-blue), var(--accent-blue))' : 'rgba(255, 255, 255, 0.1)',
                                  backdropFilter: 'blur(20px)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '12px',
                                  margin: '0.5rem',
                                  ...(isSelected && {
                                    color: 'white',
                                    borderColor: 'var(--primary-orange)',
                                  })
                                };
                                const headerStyle = {
                                  color: isSelected ? 'white' : 'var(--primary-blue)',
                                  fontSize: '1em',
                                };

                                return (
                                  <li
                                    key={trackingId}
                                    className="list-group-item list-group-item-action glassmorphism-item"
                                    style={itemStyle}
                                    onClick={() => handleSelect(trackingId)}
                                  >
                                    {/* Modern Card Layout */}
                                    <div className="row align-items-center g-3">
                                      <div className="col-12 col-md-8">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <div>
                                            <strong className="d-block" style={headerStyle}>
                                              {trackingId}
                                            </strong>
                                            <small className={isSelected ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.9em' }}>
                                              {driverName} ({vehicleReg})
                                            </small>
                                          </div>
                                          <span className={`modern-badge glassmorphism-badge ${isCompleted ? 'modern-badge-success' : 'modern-badge-info'}`}>
                                            {currentStatus}
                                          </span>
                                        </div>
                                        
                                        {/* Delivery Status Progress Bar with label */}
                                        <div className="mb-2">
                                          <span className="small text-muted">Delivery Status: {currentStatus}</span>
                                          <DeliveryProgressBar status={currentStatus} />
                                        </div>
                                      </div>
                                      
                                      <div className="col-12 col-md-4">
                                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                                          <span className="modern-badge modern-badge-secondary glassmorphism-badge" title="Tonnage">
                                            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>scale</span>
                                            {tonnage.toLocaleString()}t
                                          </span>
                                          <span className="modern-badge modern-badge-secondary glassmorphism-badge" title="Containers">
                                            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>inventory_2</span>
                                            {containerCount}
                                          </span>
                                          <span className="modern-badge modern-badge-success glassmorphism-badge" title="Value">
                                            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>attach_money</span>
                                            ${value.toLocaleString()}
                                          </span>
                                          <span className="modern-badge modern-badge-danger glassmorphism-badge" title="Cost">
                                            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>money_off</span>
                                            ${cost.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Inline CheckpointLoggerForm below selected delivery */}
                                    {isSelected && (
                                      <div className="mt-3 slide-up">
                                        <CheckpointLoggerForm
                                          deliveries={booking.deliveries}
                                          user={user}
                                          onSubmitCheckpoint={onSubmitCheckpoint}
                                          onSuccess={onSuccess}
                                          onFeedback={onFeedback}
                                          selectedId={selectedId}
                                          setSelectedId={setSelectedId}
                                        />
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted py-4">
                          <span className="material-icons-outlined mb-3" style={{ fontSize: '3rem', opacity: 0.3 }}>local_shipping</span>
                          <p className="mb-0">No loads dispatched for this consignment yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="modern-card-header d-flex justify-content-between align-items-center glassmorphism-header">
                    <span className="text-muted small">
                      Last updated by: {booking.lastUpdatedBy || 'N/A'} on {booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : 'N/A'}
                    </span>
                    <button className="btn-modern btn-modern-secondary btn-sm glassmorphism-btn" disabled title="Flag for Review (internal)">
                      <span className="material-icons-outlined">flag</span>
                      Flag for Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <PaginationBar
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              total={total}
            />
          </>
        )}
        
        <div className="text-center text-muted small mt-4">
          <p className="mb-1">Need support?</p>
          <div className="d-flex justify-content-center gap-3">
            <a href="mailto:support@darlogistics.co.zw" className="text-decoration-none glassmorphism-link" style={{ color: 'var(--primary-orange)' }}>
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>email</span>
              support@darlogistics.co.zw
            </a>
            <a href="tel:+263781334474" className="text-decoration-none glassmorphism-link" style={{ color: 'var(--primary-orange)' }}>
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>phone</span>
              +263 781 334474
            </a>
          </div>
        </div>
      </div>

      {/* Modern Design Styles */}
      <style>{`
        .glassmorphism-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .glassmorphism-input {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: var(--dark-gray);
        }

        .glassmorphism-input:focus {
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 0.2rem rgba(255, 102, 0, 0.25);
          background: rgba(255, 255, 255, 0.15);
        }

        .glassmorphism-btn {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
          color: var(--dark-gray);
        }

        .glassmorphism-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .glassmorphism-badge {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }

        .glassmorphism-progress {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 10px;
          overflow: hidden;
        }

        .glassmorphism-item {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin: 0.5rem 0;
        }

        .glassmorphism-header {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glassmorphism-link {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .glassmorphism-link:hover {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .slide-up {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modern-accordion-item {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .accordion-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: none;
          color: var(--dark-gray);
          transition: all 0.3s ease;
        }

        .accordion-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .accordion-button:not(.collapsed) {
          background: rgba(255, 255, 255, 0.2);
          color: var(--primary-blue);
        }

        .modern-accordion-body {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        /* Text color fixes for better contrast */
        .modern-form-label {
          color: var(--dark-gray) !important;
        }

        .modern-card-body {
          color: var(--dark-gray);
        }

        .modern-card-body .text-muted {
          color: var(--dark-gray) !important;
        }

        .modern-accordion-body .text-muted {
          color: var(--dark-gray) !important;
        }

        .glassmorphism-item .text-muted {
          color: var(--dark-gray) !important;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .glassmorphism-card {
            margin: 0.5rem;
            border-radius: 12px;
          }

          .accordion-button {
            font-size: 0.9em;
            padding: 1rem;
          }

          .modern-badge {
            font-size: 0.8em;
            padding: 0.3rem 0.6rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ConsignmentMonitor;
