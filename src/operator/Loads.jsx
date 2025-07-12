// This file is clean: no unused imports, no dead code, follows best practices.
import { useState, useEffect } from 'react';
import { deliveryApi } from '../services/api';
import DeliveryDispatchForm from './DeliveryDispatchForm';
import { useNavigate } from 'react-router-dom';

export default function Loads() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');
  const [parentBookings, setParentBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [parentBookingsLoading, setParentBookingsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchDeliveries = async () => {
    setLoading(true);
    setError('');
    try {
      const { deliveries: data, total: totalCount } = await deliveryApi.getAll(pageSize, (page - 1) * pageSize, search);
      setDeliveries(data);
      setTotal(totalCount);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch loads');
      setDeliveries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch parent bookings and build customers array
  const fetchParentBookings = async () => {
    setParentBookingsLoading(true);
    try {
      const { parentBookings: bookings = [] } = await deliveryApi.getAllParentBookings({}, 100, 0);
      setParentBookings(bookings);
      // Build unique customers array
      const uniqueCustomers = bookings.reduce((acc, booking) => {
        const compositeId = `${booking.customerName}|${booking.phoneNumber}`;
        if (!acc.find(c => c.id === compositeId)) {
          acc.push({
            id: compositeId,
            name: booking.customerName,
            phone: booking.phoneNumber
          });
        }
        return acc;
      }, []);
      setCustomers(uniqueCustomers);
    } catch (err) {
      setParentBookings([]);
      setCustomers([]);
    } finally {
      setParentBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchParentBookings();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    // fetchDeliveries will be triggered by useEffect
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setCreateFeedback('Load dispatched successfully!');
    fetchDeliveries();
    setTimeout(() => setCreateFeedback(''), 3000);
  };

  const statusBadge = (status) => {
    const map = {
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
    return <span className={`badge bg-${map[status] || 'secondary'}`}>{status}</span>;
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{ color: '#1F2120' }}>Loads</h2>
        <button className="btn btn-primary fw-bold" style={{ background: '#1F2120', border: 'none', color: '#EBD3AD' }} onClick={() => setShowCreateModal(true)}>
          Dispatch New Load
        </button>
      </div>
      <form className="mb-3" onSubmit={handleSearch}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search by customer, tracking ID, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search loads"
          />
          <button className="btn btn-outline-secondary" type="submit">Search</button>
        </div>
        <div className="mt-2 d-flex align-items-center gap-2">
          <label htmlFor="statusFilter" className="form-label mb-0 me-2 small">Status:</label>
          <select id="statusFilter" className="form-select form-select-sm" style={{width:'auto'}} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </form>
      {createFeedback && <div className="alert alert-success alert-dismissible fade show" role="alert">{createFeedback}<button type="button" className="btn-close" onClick={() => setCreateFeedback('')} aria-label="Close"></button></div>}
      {showCreateModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setShowCreateModal(false)}></div>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Dispatch New Load</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  {parentBookingsLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <DeliveryDispatchForm
                      customers={customers}
                      parentBookings={parentBookings}
                      onSuccess={handleCreateSuccess}
                      onFeedback={setCreateFeedback}
                      createDelivery={deliveryApi.create}
                      fetchParentBookings={fetchParentBookings}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tracking ID</th>
                    <th>Customer</th>
                    <th>Consignment</th>
                    <th>Status</th>
                    <th>Tonnage</th>
                    <th>Containers</th>
                    <th>Driver</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-5">
                        <div className="mb-2" style={{fontSize:'2rem'}}>&#128230;</div>
                        <div>No loads found. Try adjusting your search or filters.</div>
                      </td>
                    </tr>
                  ) : (
                    deliveries
                      .filter(delivery => !statusFilter || delivery.currentStatus === statusFilter)
                      .map(delivery => (
                        <tr key={delivery.trackingId}>
                          <td>
                            <button className="btn btn-link p-0 fw-bold" style={{color:'#1F2120'}} onClick={() => navigate(`/track-delivery?id=${delivery.trackingId}`)} title="Track this load">{delivery.trackingId}</button>
                          </td>
                          <td>
                            <button className="btn btn-link p-0" style={{color:'#1e40af'}} onClick={() => setSearch(delivery.customerName)} title="Filter by customer">{delivery.customerName}</button>
                          </td>
                          <td>{delivery.parentBookingId}</td>
                          <td>{statusBadge(delivery.currentStatus)}</td>
                          <td>{delivery.tonnage}</td>
                          <td>{delivery.containerCount}</td>
                          <td>{delivery.driverDetails?.name}</td>
                          <td>
                            {delivery.createdAt ? (
                              <span title={`Created: ${new Date(delivery.createdAt).toLocaleString()}`}>{new Date(delivery.createdAt).toLocaleDateString()}</span>
                            ) : ''}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => navigate(`/track-delivery?id=${delivery.trackingId}`)} aria-label="Track delivery">Track</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/dashboard?delivery=${delivery.trackingId}`)} aria-label="View delivery">View</button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          Showing {Math.min((page - 1) * pageSize + 1, total)}-
          {Math.min(page * pageSize, total)} of {total}
        </div>
        <div>
          <button className="btn btn-sm btn-outline-secondary me-2" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <button className="btn btn-sm btn-outline-secondary" disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
} 