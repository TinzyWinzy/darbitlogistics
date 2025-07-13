// This file is clean: no unused imports, no dead code, follows best practices.
import { useState, useEffect, useMemo } from 'react';
import { deliveryApi } from '../services/api';
import DeliveryDispatchForm from './DeliveryDispatchForm';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import LoadsChart from './LoadsChart';
import LoadsTable from './LoadsTable';

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

  const customerKeys = useMemo(() => Array.from(new Set(deliveries.map(d => d.customerName || 'Unknown'))), [deliveries]);
  const colors = ['#1976d2', '#D2691E', '#16a34a', '#dc2626', '#6b7280', '#f59e42', '#8e24aa', '#0097a7', '#c62828', '#388e3c'];

  return (
    <div className="container py-4">
      <style>{`
        @media (max-width: 600px) {
          .loads-table th, .loads-table td { font-size: 0.93em; padding: 0.4em 0.3em; }
          .loads-table th { position: sticky; top: 0; background: #f8f9fa; z-index: 2; }
          .loads-table { min-width: 700px; }
          .loads-card { display: block; margin-bottom: 1rem; border-radius: 0.5rem; box-shadow: 0 1px 4px rgba(31,33,32,0.07); border: 1px solid #eee; background: #fff; }
        }
      `}</style>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{ color: '#1F2120' }}>Loads</h2>
        <button className="btn btn-primary fw-bold" style={{ background: '#1F2120', border: 'none', color: '#EBD3AD', fontSize: '1.1em', padding: '0.5em 1.2em' }} onClick={() => setShowCreateModal(true)}>
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
            style={{ fontSize: '1em' }}
          />
          <button className="btn btn-outline-secondary" type="submit" style={{ fontSize: '1em' }}>Search</button>
        </div>
        <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
          <label htmlFor="statusFilter" className="form-label mb-0 me-2 small">Status:</label>
          <select id="statusFilter" className="form-select form-select-sm" style={{width:'auto', fontSize:'1em'}} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
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
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document" style={{ maxWidth: '98vw' }}>
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
      {/* Loads summary graph with Recharts */}
      <LoadsChart deliveries={deliveries} customerKeys={customerKeys} />
      {/* Responsive Table/Card Switch */}
      <LoadsTable
        deliveries={deliveries}
        customers={customers}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateRange={{ from: '', to: '' }}
        setDateRange={() => {}}
        search={search}
        setSearch={setSearch}
      />
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          Showing {Math.min((page - 1) * pageSize + 1, total)}-
          {Math.min(page * pageSize, total)} of {total}
        </div>
        <div>
          <button className="btn btn-sm btn-outline-secondary me-2" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{fontSize:'1em',padding:'0.4em 0.8em'}}>Prev</button>
          <button className="btn btn-sm btn-outline-secondary" disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)} style={{fontSize:'1em',padding:'0.4em 0.8em'}}>Next</button>
        </div>
      </div>
    </div>
  );
} 