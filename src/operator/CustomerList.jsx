import { useState, useMemo } from 'react';
import React from 'react';
import { FaSearch, FaDownload, FaEye, FaEyeSlash, FaFilter, FaTimes, FaUsers, FaPhone, FaEnvelope, FaCalendar, FaTruck, FaWeightHanging, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
}

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return <span>{text.slice(0, idx)}<mark>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</span>;
}

function exportToCSV(customers, columns) {
  if (!customers.length) return;
  const headers = columns;
  const rows = customers.map(c => headers.map(h => c[h]));
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'customers.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Responsive helper
function useIsMobile() {
  if (typeof window === 'undefined') return false;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

/**
 * CustomerList component
 * @param {Array} parentBookings - array of parent booking objects
 * @param {Array} deliveries - array of delivery objects (optional, for load count)
 */
export default function CustomerList({ parentBookings = [], deliveries = [] }) {
  // Build unique customers from parentBookings
  const customers = useMemo(() => {
    const map = new Map();
    parentBookings.forEach(booking => {
      const id = `${booking.customerName}|${booking.phoneNumber}`;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: booking.customerName,
          phone: booking.phoneNumber,
          email: booking.email || '',
          bookings: [],
          loads: [],
          totalTonnage: 0,
          lastBooking: null,
          lastLoad: null,
          status: 'inactive',
        });
      }
      const cust = map.get(id);
      cust.bookings.push(booking);
      if (!cust.lastBooking || new Date(booking.createdAt) > new Date(cust.lastBooking)) {
        cust.lastBooking = booking.createdAt;
      }
    });
    deliveries.forEach(delivery => {
      const id = `${delivery.customerName}|${delivery.phoneNumber}`;
      if (map.has(id)) {
        const cust = map.get(id);
        cust.loads.push(delivery);
        cust.totalTonnage += Number(delivery.tonnage) || 0;
        if (!cust.lastLoad || new Date(delivery.createdAt) > new Date(cust.lastLoad)) {
          cust.lastLoad = delivery.createdAt;
        }
      }
    });
    // Set status: active if last load or booking in last 30 days
    const now = new Date();
    map.forEach(cust => {
      const last = cust.lastLoad || cust.lastBooking;
      if (last && (now - new Date(last)) < 1000 * 60 * 60 * 24 * 30) {
        cust.status = 'active';
      }
    });
    return Array.from(map.values());
  }, [parentBookings, deliveries]);

  // Sorting
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const sorted = useMemo(() => {
    const arr = [...customers];
    arr.sort((a, b) => {
      let v1 = a[sortKey], v2 = b[sortKey];
      if (sortKey === 'totalTonnage' || sortKey === 'bookings' || sortKey === 'loads') {
        v1 = Number(v1); v2 = Number(v2);
      }
      if (v1 === undefined || v1 === null) v1 = '';
      if (v2 === undefined || v2 === null) v2 = '';
      if (v1 < v2) return sortDir === 'asc' ? -1 : 1;
      if (v1 > v2) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [customers, sortKey, sortDir]);

  // Search & filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const filtered = useMemo(() => {
    let result = sorted;
    
    // Search filter
    const s = search.trim().toLowerCase();
    if (s) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(s) ||
        c.phone.toLowerCase().includes(s) ||
        (c.email && c.email.toLowerCase().includes(s))
      );
    }
    
    // Status filter
    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter);
    }
    
    return result;
  }, [search, statusFilter, sorted]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Modal for details
  const [modal, setModal] = useState(null);

  // Columns for export
  const exportColumns = ['name', 'phone', 'email', 'bookings', 'loads', 'totalTonnage', 'lastBooking', 'lastLoad', 'status'];

  const isMobile = useIsMobile();

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalBookings = customers.reduce((sum, c) => sum + c.bookings.length, 0);
    const totalLoads = customers.reduce((sum, c) => sum + c.loads.length, 0);
    const totalTonnage = customers.reduce((sum, c) => sum + c.totalTonnage, 0);
    
    return { totalCustomers, activeCustomers, totalBookings, totalLoads, totalTonnage };
  }, [customers]);

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="customer-list-container">
      <style>{`
        :root {
          --primary-blue: #003366;
          --primary-orange: #FF6600;
          --accent-orange: #FF8533;
          --accent-blue: #0066CC;
          --text-primary: #1F2120;
          --text-secondary: #6c757d;
          --background-primary: #ffffff;
          --background-secondary: #f8f9fa;
          --border-color: #e9ecef;
          --shadow-light: 0 2px 8px rgba(0, 51, 102, 0.08);
          --shadow-medium: 0 4px 16px rgba(0, 51, 102, 0.12);
          --shadow-heavy: 0 8px 32px rgba(0, 51, 102, 0.15);
          --border-radius: 12px;
          --border-radius-sm: 8px;
          --spacing-xs: 0.5rem;
          --spacing-sm: 1rem;
          --spacing-md: 1.5rem;
          --spacing-lg: 2rem;
          --spacing-xl: 3rem;
        }

        .customer-list-container {
          background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-primary) 100%);
          min-height: 100vh;
          padding: var(--spacing-md);
        }
        
        .customer-header {
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          color: white;
          border-radius: var(--border-radius);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          box-shadow: var(--shadow-heavy);
        }
        
        .customer-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: var(--spacing-xs);
          background: linear-gradient(45deg, var(--primary-orange), var(--accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .customer-header .subtitle {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: var(--spacing-md);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--border-radius-sm);
          padding: var(--spacing-md);
          text-align: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-heavy);
        }
        
        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary-orange);
          margin-bottom: var(--spacing-xs);
        }
        
        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .action-bar {
          background: var(--background-primary);
          border-radius: var(--border-radius);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          box-shadow: var(--shadow-light);
          border: 1px solid var(--border-color);
        }
        
        .search-filters {
          background: var(--background-secondary);
          border-radius: var(--border-radius-sm);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          border: 1px solid var(--border-color);
        }
        
        .customer-table-container {
          background: var(--background-primary);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-light);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        
        .table-header {
          background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-primary) 100%);
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
        }
        
        .table-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }
        
        .table-content {
          overflow-x: auto;
          max-height: 600px;
        }
        
        .table-custom {
          margin: 0;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .table-custom th {
          background: var(--background-secondary);
          border-bottom: 2px solid var(--border-color);
          padding: var(--spacing-sm) 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          position: sticky;
          top: 0;
          z-index: 10;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .table-custom th:hover {
          background: #e9ecef;
        }
        
        .table-custom td {
          padding: var(--spacing-sm) 0.75rem;
          border-bottom: 1px solid #f1f3f4;
          vertical-align: middle;
        }
        
        .table-custom tbody tr:hover {
          background: var(--background-secondary);
        }
        
        .sort-icon {
          margin-left: var(--spacing-xs);
          opacity: 0.5;
        }
        
        .sort-icon.active {
          opacity: 1;
          color: var(--primary-blue);
        }
        
        .status-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .btn-custom {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        
        .btn-custom:hover {
          transform: translateY(-1px);
        }
        
        .customer-card {
          background: var(--background-primary);
          border-radius: var(--border-radius-sm);
          box-shadow: var(--shadow-light);
          border: 1px solid var(--border-color);
          margin-bottom: var(--spacing-sm);
          padding: var(--spacing-md);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .customer-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }
        
        .customer-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-sm);
        }
        
        .customer-details h5 {
          margin-bottom: var(--spacing-xs);
          color: var(--text-primary);
        }
        
        .customer-meta {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        
        .customer-stats {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
          margin-bottom: var(--spacing-sm);
        }
        
        .stat-badge {
          background: var(--background-secondary);
          color: var(--text-primary);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid var(--border-color);
        }
        
        .empty-state {
          text-align: center;
          padding: var(--spacing-xl) var(--spacing-sm);
          color: var(--text-secondary);
        }
        
        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: var(--spacing-sm);
          opacity: 0.5;
        }
        
        .pagination-custom {
          background: var(--background-primary);
          border-radius: var(--border-radius-sm);
          padding: var(--spacing-sm);
          box-shadow: var(--shadow-light);
          border: 1px solid var(--border-color);
          margin-top: var(--spacing-sm);
        }
        
        .modal-custom .modal-content {
          border-radius: var(--border-radius);
          border: none;
          box-shadow: var(--shadow-heavy);
        }
        
        .modal-custom .modal-header {
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          color: white;
          border-radius: var(--border-radius) var(--border-radius) 0 0;
          border-bottom: none;
        }
        
        .modal-custom .modal-title {
          font-weight: 700;
          font-size: 1.25rem;
        }
        
        .modal-custom .btn-close {
          filter: invert(1);
        }
        
        @media (max-width: 700px) {
          .customer-list-container { padding: var(--spacing-sm); }
          .customer-header { padding: var(--spacing-md); margin-bottom: var(--spacing-md); }
          .customer-header h1 { font-size: 2rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .stat-card { padding: var(--spacing-sm); }
          .stat-number { font-size: 2rem; }
          .action-bar { padding: var(--spacing-sm); margin-bottom: var(--spacing-md); }
          .search-filters { padding: var(--spacing-sm); }
          .table-header { padding: var(--spacing-sm); }
          .table-controls { flex-direction: column; align-items: stretch; }
          .table-controls .btn { width: 100%; }
          .customer-card { padding: var(--spacing-sm); }
          .customer-info { flex-direction: column; gap: var(--spacing-sm); }
          .customer-stats { justify-content: center; }
        }
        
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .customer-header h1 { font-size: 1.75rem; }
        }
      `}</style>

      {/* Header Section */}
      <div className="customer-header">
        <h1>Customer Management</h1>
        <div className="subtitle">Monitor customer relationships, bookings, and delivery history</div>
        
        {/* Summary Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{summaryStats.totalCustomers}</div>
            <div className="stat-label">Total Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.activeCustomers}</div>
            <div className="stat-label">Active Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.totalBookings}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.totalLoads}</div>
            <div className="stat-label">Total Loads</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.totalTonnage.toFixed(1)}</div>
            <div className="stat-label">Total Tonnage</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <button 
              className="btn btn-outline-custom"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="me-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            
            <button 
              className="btn btn-primary-custom"
              onClick={() => exportToCSV(filtered, exportColumns)}
            >
              <FaDownload className="me-2" />
              Export CSV
            </button>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">
              Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}-
              {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <div className="search-filters">
          <form onSubmit={e => { e.preventDefault(); setPage(1); }} className={`d-flex gap-3 align-items-end flex-wrap${isMobile ? ' mobile-stack' : ''}`}>
            <div className="flex-grow-1" style={{ minWidth: isMobile ? '100%' : '300px' }}>
              <label className="form-label fw-bold">Search Customers</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Search by name, phone, or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search customers"
                />
                {search && (
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => setSearch('')}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ minWidth: isMobile ? '100%' : '200px' }}>
              <label className="form-label fw-bold">Status Filter</label>
              <select 
                className="form-select form-control-custom"
                value={statusFilter} 
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="d-flex align-items-end">
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={clearFilters}
              >
                <FaTimes className="me-1" />
                Clear All
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Table/Cards */}
      <div className="customer-table-container">
        <div className="table-header">
          <div className="table-controls">
            <div className="d-flex align-items-center gap-3">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                <FaUsers className="me-2" />
                Customer List
              </h5>
              <span className="badge bg-secondary">
                {filtered.length} customers
              </span>
            </div>
          </div>
        </div>

        <div className="table-content">
          {isMobile ? (
            <div className="p-3">
              {paged.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <div className="fw-bold mb-2">No customers found</div>
                  <div className="text-muted">Try adjusting your search or filters</div>
                </div>
              ) : (
                paged.map(c => (
                  <div key={c.id} className="customer-card">
                    <div className="customer-info">
                      <div className="customer-details">
                        <h5>{highlight(c.name, search)}</h5>
                        <div className="customer-meta">
                          <div><FaPhone className="me-1" />{highlight(c.phone, search)}</div>
                          {c.email && <div><FaEnvelope className="me-1" />{highlight(c.email, search)}</div>}
                        </div>
                      </div>
                      <span className={`badge bg-${c.status === 'active' ? 'success' : 'secondary'} status-badge`}>
                        {c.status}
                      </span>
                    </div>
                    
                    <div className="customer-stats">
                      <span className="stat-badge">
                        <FaCalendar className="me-1" />
                        {c.bookings.length} Bookings
                      </span>
                      <span className="stat-badge">
                        <FaTruck className="me-1" />
                        {c.loads.length} Loads
                      </span>
                      <span className="stat-badge">
                        <FaWeightHanging className="me-1" />
                        {c.totalTonnage.toFixed(1)} tons
                      </span>
                    </div>
                    
                    <button 
                      className="btn btn-outline-primary btn-custom w-100"
                      onClick={() => setModal(c)}
                    >
                      <FaEye className="me-2" />
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <table className="table table-custom">
              <thead>
                <tr>
                  <th onClick={() => { setSortKey('name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="d-flex align-items-center">
                      Name
                      <span className={`sort-icon ${sortKey === 'name' ? 'active' : ''}`}>
                        {sortKey === 'name' ? (
                          sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort />
                        )}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => { setSortKey('phone'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="d-flex align-items-center">
                      Phone
                      <span className={`sort-icon ${sortKey === 'phone' ? 'active' : ''}`}>
                        {sortKey === 'phone' ? (
                          sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort />
                        )}
                      </span>
                    </div>
                  </th>
                  <th>Email</th>
                  <th onClick={() => { setSortKey('bookings'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="d-flex align-items-center">
                      Bookings
                      <span className={`sort-icon ${sortKey === 'bookings' ? 'active' : ''}`}>
                        {sortKey === 'bookings' ? (
                          sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort />
                        )}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => { setSortKey('loads'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="d-flex align-items-center">
                      Loads
                      <span className={`sort-icon ${sortKey === 'loads' ? 'active' : ''}`}>
                        {sortKey === 'loads' ? (
                          sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort />
                        )}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => { setSortKey('totalTonnage'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="d-flex align-items-center">
                      Total Tonnage
                      <span className={`sort-icon ${sortKey === 'totalTonnage' ? 'active' : ''}`}>
                        {sortKey === 'totalTonnage' ? (
                          sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />
                        ) : (
                          <FaSort />
                        )}
                      </span>
                    </div>
                  </th>
                  <th>Last Booking</th>
                  <th>Last Load</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="fw-bold mb-2">No customers found</div>
                      <div className="text-muted">Try adjusting your search or filters</div>
                    </td>
                  </tr>
                ) : (
                  paged.map(c => (
                    <tr key={c.id}>
                      <td>
                        <span className="fw-bold text-primary">{highlight(c.name, search)}</span>
                      </td>
                      <td>{highlight(c.phone, search)}</td>
                      <td>{highlight(c.email || '-', search)}</td>
                      <td>
                        <span className="badge bg-info">{c.bookings.length}</span>
                      </td>
                      <td>
                        <span className="badge bg-warning">{c.loads.length}</span>
                      </td>
                      <td>
                        <span className="fw-bold">{c.totalTonnage.toFixed(1)} tons</span>
                      </td>
                      <td>{formatDate(c.lastBooking)}</td>
                      <td>{formatDate(c.lastLoad)}</td>
                      <td>
                        <span className={`badge bg-${c.status === 'active' ? 'success' : 'secondary'} status-badge`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline-primary btn-custom btn-sm"
                          onClick={() => setModal(c)}
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-custom">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted">
              Page {page} of {totalPages}
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-custom btn-sm" 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button 
                className="btn btn-outline-custom btn-sm" 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {modal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setModal(null)}></div>
          <div className="modal fade show modal-custom" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaUsers className="me-2" />
                    Customer Details: {modal.name}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">Customer Information</h6>
                      <div className="row g-2">
                        <div className="col-6"><strong>Name:</strong></div>
                        <div className="col-6">{modal.name}</div>
                        <div className="col-6"><strong>Phone:</strong></div>
                        <div className="col-6">{modal.phone}</div>
                        <div className="col-6"><strong>Email:</strong></div>
                        <div className="col-6">{modal.email || '-'}</div>
                        <div className="col-6"><strong>Status:</strong></div>
                        <div className="col-6">
                          <span className={`badge bg-${modal.status === 'active' ? 'success' : 'secondary'}`}>
                            {modal.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">Activity Summary</h6>
                      <div className="row g-2">
                        <div className="col-6"><strong>Total Bookings:</strong></div>
                        <div className="col-6">{modal.bookings.length}</div>
                        <div className="col-6"><strong>Total Loads:</strong></div>
                        <div className="col-6">{modal.loads.length}</div>
                        <div className="col-6"><strong>Total Tonnage:</strong></div>
                        <div className="col-6">{modal.totalTonnage.toFixed(1)} tons</div>
                        <div className="col-6"><strong>Last Booking:</strong></div>
                        <div className="col-6">{formatDate(modal.lastBooking)}</div>
                        <div className="col-6"><strong>Last Load:</strong></div>
                        <div className="col-6">{formatDate(modal.lastLoad)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <hr />
                  
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">Bookings History</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Booking Ref</th>
                              <th>Created</th>
                              <th>Mineral</th>
                              <th>Tonnage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modal.bookings.map(b => (
                              <tr key={b.id || b.bookingReference}>
                                <td>{b.bookingReference || b.id}</td>
                                <td>{formatDate(b.createdAt)}</td>
                                <td>{b.mineralType || '-'}</td>
                                <td>{b.totalTonnage || b.tonnage || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">Loads History</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Tracking ID</th>
                              <th>Created</th>
                              <th>Status</th>
                              <th>Tonnage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modal.loads.map(l => (
                              <tr key={l.trackingId}>
                                <td>{l.trackingId}</td>
                                <td>{formatDate(l.createdAt)}</td>
                                <td>{l.currentStatus}</td>
                                <td>{l.tonnage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setModal(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 