import { useState, useMemo } from 'react';

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
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return sorted;
    return sorted.filter(c =>
      c.name.toLowerCase().includes(s) ||
      c.phone.toLowerCase().includes(s) ||
      (c.email && c.email.toLowerCase().includes(s))
    );
  }, [search, sorted]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Modal for details
  const [modal, setModal] = useState(null);

  // Columns for export
  const exportColumns = ['name', 'phone', 'email', 'bookings', 'loads', 'totalTonnage', 'lastBooking', 'lastLoad', 'status'];

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4" style={{ color: '#1F2120' }}>Customers</h2>
      <div className="mb-3 d-flex flex-wrap gap-2 align-items-end">
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: 240 }}
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <button className="btn btn-outline-primary" onClick={() => exportToCSV(filtered, exportColumns)}>Export CSV</button>
      </div>
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => { setSortKey('name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Name</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => { setSortKey('phone'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Phone</th>
                  <th>Email</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => { setSortKey('bookings'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Bookings</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => { setSortKey('loads'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Loads</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => { setSortKey('totalTonnage'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Total Tonnage</th>
                  <th>Last Booking</th>
                  <th>Last Load</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={10} className="text-center text-muted">No customers found.</td></tr>
                ) : (
                  paged.map(c => (
                    <tr key={c.id}>
                      <td>{highlight(c.name, search)}</td>
                      <td>{highlight(c.phone, search)}</td>
                      <td>{highlight(c.email || '-', search)}</td>
                      <td>{c.bookings.length}</td>
                      <td>{c.loads.length}</td>
                      <td>{c.totalTonnage.toFixed(2)}</td>
                      <td>{formatDate(c.lastBooking)}</td>
                      <td>{formatDate(c.lastLoad)}</td>
                      <td><span className={`badge bg-${c.status === 'active' ? 'success' : 'secondary'}`}>{c.status}</span></td>
                      <td><button className="btn btn-sm btn-outline-info" onClick={() => setModal(c)}>View Details</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-3">
              <ul className="pagination justify-content-center">
                <li className={`page-item${page === 1 ? ' disabled' : ''}`}><button className="page-link" onClick={() => setPage(page - 1)}>&laquo;</button></li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i + 1} className={`page-item${page === i + 1 ? ' active' : ''}`}><button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button></li>
                ))}
                <li className={`page-item${page === totalPages ? ' disabled' : ''}`}><button className="page-link" onClick={() => setPage(page + 1)}>&raquo;</button></li>
              </ul>
            </nav>
          )}
        </div>
      </div>
      {/* Details Modal */}
      {modal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Customer Details: {modal.name}</h5>
                <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body">
                <div><strong>Phone:</strong> {modal.phone}</div>
                <div><strong>Email:</strong> {modal.email || '-'}</div>
                <div><strong>Status:</strong> <span className={`badge bg-${modal.status === 'active' ? 'success' : 'secondary'}`}>{modal.status}</span></div>
                <div><strong>Total Bookings:</strong> {modal.bookings.length}</div>
                <div><strong>Total Loads:</strong> {modal.loads.length}</div>
                <div><strong>Total Tonnage:</strong> {modal.totalTonnage.toFixed(2)}</div>
                <div><strong>Last Booking:</strong> {formatDate(modal.lastBooking)}</div>
                <div><strong>Last Load:</strong> {formatDate(modal.lastLoad)}</div>
                <hr />
                <h6>Bookings</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-sm">
                    <thead><tr><th>Booking Ref</th><th>Created</th><th>Mineral</th><th>Tonnage</th></tr></thead>
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
                <h6>Loads</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead><tr><th>Tracking ID</th><th>Created</th><th>Status</th><th>Mineral</th><th>Tonnage</th></tr></thead>
                    <tbody>
                      {modal.loads.map(l => (
                        <tr key={l.trackingId}>
                          <td>{l.trackingId}</td>
                          <td>{formatDate(l.createdAt)}</td>
                          <td>{l.currentStatus}</td>
                          <td>{l.mineralType || '-'}</td>
                          <td>{l.tonnage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 