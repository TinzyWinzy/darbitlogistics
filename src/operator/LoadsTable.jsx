import React, { useState, useMemo, useEffect } from 'react';

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
          <div key={delivery.trackingId} className="loads-card p-3 shadow-sm border position-relative">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <span className="fw-bold">{delivery.trackingId}</span>
                <span className={`badge bg-${statusMap[delivery.currentStatus] || 'secondary'} ms-2`} style={{fontSize:'0.95em'}}>{delivery.currentStatus}</span>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={() => toggleExpand(delivery.trackingId)} aria-label="Expand row">{expanded[delivery.trackingId] ? 'Hide' : 'Details'}</button>
            </div>
            <div><b>Customer:</b> {delivery.customerName}</div>
            <div><b>Consignment:</b> {delivery.parentBookingId}</div>
            <div><b>Tonnage:</b> {delivery.tonnage}</div>
            <div><b>Containers:</b> {delivery.containerCount}</div>
            <div><b>Driver:</b> {delivery.driverDetails?.name}</div>
            <div><b>Created:</b> {delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : ''}</div>
            {expanded[delivery.trackingId] && (
              <div className="mt-2 bg-light p-2 rounded">
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
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-body p-0">
        <div className="d-flex flex-wrap align-items-center gap-3 p-3 pb-0">
          <form className="d-flex gap-2 flex-wrap" onSubmit={e => { e.preventDefault(); }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by customer, tracking ID, status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <select className="form-select form-select-sm" style={{ width: 120 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {Object.keys(statusMap).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" className="form-control form-control-sm" style={{ width: 120 }} value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} />
            <input type="date" className="form-control form-control-sm" style={{ width: 120 }} value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} />
          </form>
          <button className="btn btn-sm btn-outline-success ms-auto" onClick={handleExport}>Export CSV</button>
        </div>
        {isMobile ? (
          renderMobileCards()
        ) : (
          <div className="table-responsive" style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table className="table table-hover align-middle mb-0 loads-table" style={{ minWidth: 900 }}>
              <thead className="table-light sticky-top" style={{ top: 0, zIndex: 2 }}>
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => {
                        if (sortKey === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                        else { setSortKey(col.key); setSortDir('asc'); }
                      }}
                    >
                      {col.label}
                      {sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center text-muted py-5">
                      <div className="mb-2" style={{ fontSize: '2rem' }}>&#128230;</div>
                      <div>No loads found. Try adjusting your search or filters.</div>
                    </td>
                  </tr>
                ) : (
                  sorted.map(delivery => (
                    <React.Fragment key={delivery.trackingId}>
                      <tr>
                        <td>{delivery.trackingId}</td>
                        <td>{delivery.customerName}</td>
                        <td>{delivery.parentBookingId}</td>
                        <td><span className={`badge bg-${statusMap[delivery.currentStatus] || 'secondary'}`}>{delivery.currentStatus}</span></td>
                        <td>{delivery.tonnage}</td>
                        <td>{delivery.containerCount}</td>
                        <td>{delivery.driverDetails?.name}</td>
                        <td>{delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : ''}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => toggleExpand(delivery.trackingId)} aria-label="Expand row">{expanded[delivery.trackingId] ? 'Hide' : 'Details'}</button>
                        </td>
                      </tr>
                      {expanded[delivery.trackingId] && (
                        <tr className="bg-light">
                          <td colSpan={columns.length + 1}>
                            <div className="p-3">
                              <strong>Tracking ID:</strong> {delivery.trackingId}<br />
                              <strong>Customer:</strong> {delivery.customerName}<br />
                              <strong>Consignment:</strong> {delivery.parentBookingId}<br />
                              <strong>Status:</strong> {delivery.currentStatus}<br />
                              <strong>Tonnage:</strong> {delivery.tonnage}<br />
                              <strong>Containers:</strong> {delivery.containerCount}<br />
                              <strong>Driver:</strong> {delivery.driverDetails?.name}<br />
                              <strong>Created At:</strong> {delivery.createdAt ? new Date(delivery.createdAt).toLocaleString() : ''}<br />
                              <strong>Last Updated:</strong> {delivery.updatedAt ? new Date(delivery.updatedAt).toLocaleString() : ''}<br />
                              {/* Add more details as needed */}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 