import React, { useState, useMemo, useEffect } from 'react';
import { FaDownload, FaSort, FaSortUp, FaSortDown, FaEye, FaEyeSlash, FaFilter, FaSearch, FaTimes } from 'react-icons/fa';

function exportToCSV(rows, columns) {
  const header = columns.map(col => col.label).join(',');
  const csvRows = rows.map(row =>
    columns.map(col => {
      let val = row[col.key];
      if (typeof val === 'string') val = '"' + val.replace(/"/g, '""') + '"';
      return val;
    }).join(',')
  );
  return [header, ...csvRows].join('\n');
}

const columns = [
  { key: 'trackingId', label: 'Tracking ID' },
  { key: 'customerName', label: 'Customer' },
  { key: 'parentBookingId', label: 'Consignment' },
  { key: 'currentStatus', label: 'Status' },
  { key: 'tonnage', label: 'Tonnage' },
  { key: 'containerCount', label: 'Containers' },
  { key: 'driver', label: 'Driver' },
  { key: 'createdAt', label: 'Created At' }
];

const statusMap = {
  'Pending': 'secondary',
  'Active': 'primary',
  'In Transit': 'info',
  'Delivered': 'success',
  'Completed': 'success',
  'Cancelled': 'danger',
  'At Mine': 'warning',
  'At Border': 'warning',
  'At Port': 'info',
  'At Port of Destination': 'info',
  'At Warehouse': 'secondary',
  'Not Started': 'secondary'
};

export default function LoadsTable({
  deliveries,
  customers,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  search,
  setSearch
}) {
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [expanded, setExpanded] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    setIsMobile(mq.matches);
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Filtering
  const filtered = useMemo(() => {
    return deliveries.filter(d => {
      const date = d.createdAt ? new Date(d.createdAt) : null;
      const inRange = (!dateRange.from || (date && date >= new Date(dateRange.from))) &&
                      (!dateRange.to || (date && date <= new Date(dateRange.to)));
      const statusMatch = !statusFilter || d.currentStatus === statusFilter;
      const searchMatch = !search ||
        d.trackingId?.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        d.parentBookingId?.toLowerCase().includes(search.toLowerCase());
      return inRange && statusMatch && searchMatch;
    });
  }, [deliveries, dateRange, statusFilter, search]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let vA = a[sortKey], vB = b[sortKey];
      if (sortKey === 'createdAt') {
        vA = vA ? new Date(vA) : 0;
        vB = vB ? new Date(vB) : 0;
      }
      if (vA === undefined || vA === null) return 1;
      if (vB === undefined || vB === null) return -1;
      if (vA < vB) return sortDir === 'asc' ? -1 : 1;
      if (vA > vB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // CSV Export
  const handleExport = () => {
    const rows = sorted.map(d => ({
      ...d,
      driver: d.driverDetails?.name || ''
    }));
    const csv = exportToCSV(rows, columns);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Row expansion
  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateRange({ from: '', to: '' });
  };

  // Card view for mobile
  const renderMobileCards = () => (
    <div className="d-flex flex-column gap-3 mt-3">
      {sorted.length === 0 ? (
        <div className="text-center text-muted py-5">
          <div className="mb-2" style={{ fontSize: '2rem' }}>&#128230;</div>
          <div>No loads found. Try adjusting your search or filters.</div>
        </div>
      ) : (
        sorted.map(delivery => (
          <div key={delivery.trackingId} className="loads-card p-3 shadow-sm border position-relative glassmorphism-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <span className="fw-bold" style={{ color: 'var(--primary-orange)' }}>{delivery.trackingId}</span>
                <span className={`modern-badge modern-badge-${statusMap[delivery.currentStatus] || 'secondary'} glassmorphism-badge ms-2`} style={{fontSize:'0.95em'}}>{delivery.currentStatus}</span>
              </div>
              <button className="btn btn-sm btn-outline-custom" onClick={() => toggleExpand(delivery.trackingId)} aria-label="Expand row">{expanded[delivery.trackingId] ? 'Hide' : 'Details'}</button>
            </div>
            <div><b>Customer:</b> {delivery.customerName}</div>
            <div><b>Consignment:</b> {delivery.parentBookingId}</div>
            <div><b>Tonnage:</b> {delivery.tonnage}</div>
            <div><b>Containers:</b> {delivery.containerCount}</div>
            <div><b>Driver:</b> {delivery.driverDetails?.name}</div>
            <div><b>Created:</b> {delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : ''}</div>
            {expanded[delivery.trackingId] && (
              <div className="mt-2 glassmorphism-item p-2 rounded">
                <div><b>Last Updated:</b> {delivery.updatedAt ? new Date(delivery.updatedAt).toLocaleString() : ''}</div>
                {/* Add more details as needed */}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="loads-table-container">
      <style>{`
        .loads-table-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .table-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .table-controls {
          display: flex;
          justify-content: between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .table-filters {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .filter-row {
          display: flex;
          gap: 1rem;
          align-items: end;
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .filter-label {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
        }
        
        .table-content {
          overflow-x: auto;
          max-height: 600px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }
        
        .table-custom {
          margin: 0;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .table-custom th {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          padding: 1rem 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          position: sticky;
          top: 0;
          z-index: 10;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .table-custom th:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        .table-custom td {
          padding: 1rem 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          vertical-align: middle;
          color: var(--dark-gray);
        }
        
        .table-custom tbody tr:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .table-custom tbody tr.expanded-row {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .sort-icon {
          margin-left: 0.5rem;
          opacity: 0.5;
          color: var(--dark-gray);
        }
        
        .sort-icon.active {
          opacity: 1;
          color: var(--primary-orange);
        }
        
        .status-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .btn-table {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .btn-table:hover {
          transform: translateY(-1px);
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--dark-gray);
        }
        
        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        
        .btn-outline-custom {
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: var(--dark-gray);
          background: transparent;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .btn-outline-custom:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary-orange);
          border-color: var(--primary-orange);
        }
        
        .btn-primary-custom {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          border: none;
          color: white;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .btn-primary-custom:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
        }
        
        .form-control-custom {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          color: var(--dark-gray);
          transition: all 0.2s ease;
        }
        
        .form-control-custom:focus {
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 0.2rem rgba(255, 102, 0, 0.25);
          background: rgba(255, 255, 255, 0.15);
        }
        
        .glassmorphism-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .glassmorphism-badge {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }
        
        .glassmorphism-item {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
        
        /* Text color fixes for better contrast */
        .table-custom td strong,
        .table-custom td b {
          color: var(--dark-gray);
        }
        
        .table-custom td .text-muted {
          color: var(--dark-gray) !important;
        }
        
        .expanded-row {
          color: var(--dark-gray);
        }
        
        .expanded-row strong,
        .expanded-row b {
          color: var(--dark-gray);
        }
        
        .loads-card {
          color: var(--dark-gray);
        }
        
        .loads-card strong,
        .loads-card b {
          color: var(--dark-gray);
        }
        
        .loads-card .text-muted {
          color: var(--dark-gray) !important;
        }
        
        @media (max-width: 700px) {
          .table-header { padding: 1rem; }
          .table-filters { padding: 1rem; }
          .filter-row { flex-direction: column; gap: 0.75rem; }
          .filter-group { width: 100%; }
          .table-controls { flex-direction: column; align-items: stretch; }
          .table-controls .btn { width: 100%; }
          .loads-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            margin-bottom: 1rem;
          }
        }
      `}</style>

      <div className="table-header">
        <div className="table-controls">
          <div className="d-flex align-items-center gap-3">
            <h5 className="mb-0 fw-bold" style={{ color: 'var(--primary-orange)' }}>
              Loads Table
            </h5>
            <span className="modern-badge modern-badge-secondary glassmorphism-badge">
              {sorted.length} of {filtered.length}
            </span>
          </div>
          
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-custom btn-sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <FaFilter className="me-1" />
              {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
            </button>
            
            <button 
              className="btn btn-primary-custom btn-sm"
              onClick={handleExport}
            >
              <FaDownload className="me-1" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="table-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'var(--primary-orange)' }}>
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Search by customer, tracking ID, status..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button 
                    className="btn btn-outline-custom" 
                    onClick={() => setSearch('')}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select 
                className="form-select form-control-custom"
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {Object.keys(statusMap).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input 
                type="date" 
                className="form-control form-control-custom"
                value={dateRange.from} 
                onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} 
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input 
                type="date" 
                className="form-control form-control-custom"
                value={dateRange.to} 
                onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} 
              />
            </div>
            
            <div className="filter-group d-flex align-items-end">
              <button 
                className="btn btn-outline-custom btn-sm"
                onClick={clearFilters}
              >
                <FaTimes className="me-1" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-content">
        {isMobile ? (
          renderMobileCards()
        ) : (
          <table className="table table-custom">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => {
                      if (sortKey === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                      else { setSortKey(col.key); setSortDir('asc'); }
                    }}
                  >
                    <div className="d-flex align-items-center">
                      {col.label}
                      <span className={`sort-icon ${sortKey === col.key ? 'active' : ''}`}>
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div className="fw-bold mb-2">No loads found</div>
                    <div className="text-muted">Try adjusting your search or filters</div>
                  </td>
                </tr>
              ) : (
                sorted.map(delivery => (
                  <React.Fragment key={delivery.trackingId}>
                    <tr>
                      <td>
                        <span className="fw-bold" style={{ color: 'var(--primary-orange)' }}>{delivery.trackingId}</span>
                      </td>
                      <td>{delivery.customerName}</td>
                      <td>
                        <span className="text-muted">{delivery.parentBookingId}</span>
                      </td>
                      <td>
                        <span className={`modern-badge modern-badge-${statusMap[delivery.currentStatus] || 'secondary'} glassmorphism-badge status-badge`}>
                          {delivery.currentStatus}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold">{delivery.tonnage} tons</span>
                      </td>
                      <td>
                        <span className="modern-badge modern-badge-info glassmorphism-badge">{delivery.containerCount}</span>
                      </td>
                      <td>
                        <span className="text-muted">{delivery.driverDetails?.name || 'N/A'}</span>
                      </td>
                      <td>
                        {delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : ''}
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline-custom btn-table btn-sm"
                          onClick={() => toggleExpand(delivery.trackingId)}
                        >
                          {expanded[delivery.trackingId] ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </td>
                    </tr>
                    {expanded[delivery.trackingId] && (
                      <tr className="expanded-row">
                        <td colSpan={columns.length + 1}>
                          <div className="p-3">
                            <div className="row">
                              <div className="col-md-6">
                                <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-orange)' }}>Load Details</h6>
                                <div className="row g-2">
                                  <div className="col-6"><strong>Tracking ID:</strong></div>
                                  <div className="col-6">{delivery.trackingId}</div>
                                  <div className="col-6"><strong>Customer:</strong></div>
                                  <div className="col-6">{delivery.customerName}</div>
                                  <div className="col-6"><strong>Consignment:</strong></div>
                                  <div className="col-6">{delivery.parentBookingId}</div>
                                  <div className="col-6"><strong>Status:</strong></div>
                                  <div className="col-6">
                                    <span className={`modern-badge modern-badge-${statusMap[delivery.currentStatus] || 'secondary'} glassmorphism-badge`}>
                                      {delivery.currentStatus}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-orange)' }}>Transport Details</h6>
                                <div className="row g-2">
                                  <div className="col-6"><strong>Tonnage:</strong></div>
                                  <div className="col-6">{delivery.tonnage} tons</div>
                                  <div className="col-6"><strong>Containers:</strong></div>
                                  <div className="col-6">{delivery.containerCount}</div>
                                  <div className="col-6"><strong>Driver:</strong></div>
                                  <div className="col-6">{delivery.driverDetails?.name || 'N/A'}</div>
                                  <div className="col-6"><strong>Vehicle:</strong></div>
                                  <div className="col-6">{delivery.driverDetails?.vehicleReg || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                            <div className="row">
                              <div className="col-md-6">
                                <div className="row g-2">
                                  <div className="col-6"><strong>Created:</strong></div>
                                  <div className="col-6">{delivery.createdAt ? new Date(delivery.createdAt).toLocaleString() : ''}</div>
                                  <div className="col-6"><strong>Updated:</strong></div>
                                  <div className="col-6">{delivery.updatedAt ? new Date(delivery.updatedAt).toLocaleString() : ''}</div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="row g-2">
                                  <div className="col-6"><strong>Value:</strong></div>
                                  <div className="col-6">{delivery.value ? `$${Number(delivery.value).toLocaleString()}` : 'N/A'}</div>
                                  <div className="col-6"><strong>Cost:</strong></div>
                                  <div className="col-6">{delivery.cost ? `$${Number(delivery.cost).toLocaleString()}` : 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 