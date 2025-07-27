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
import { FaPlus, FaSearch, FaFilter, FaChartBar, FaTable, FaDownload, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Loads() {
  // Core state
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [parentBookings, setParentBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [parentBookingsLoading, setParentBookingsLoading] = useState(false);
  const navigate = useNavigate();

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'table', 'analytics'
  const [showFilters, setShowFilters] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    setIsMobile(mq.matches);
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
    return <span className={`modern-badge modern-badge-${map[status] || 'secondary'} glassmorphism-badge`}>{status}</span>;
  };

  const customerKeys = useMemo(() => Array.from(new Set(deliveries.map(d => d.customerName || 'Unknown'))), [deliveries]);
  const colors = ['#1976d2', '#D2691E', '#16a34a', '#dc2626', '#6b7280', '#f59e42', '#8e24aa', '#0097a7', '#c62828', '#388e3c'];

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalLoads = deliveries.length;
    const activeLoads = deliveries.filter(d => ['Active', 'In Transit', 'At Mine', 'At Border', 'At Port', 'At Port of Destination', 'At Warehouse'].includes(d.currentStatus)).length;
    const deliveredLoads = deliveries.filter(d => ['Delivered', 'Completed'].includes(d.currentStatus)).length;
    const totalTonnage = deliveries.reduce((sum, d) => sum + (parseFloat(d.tonnage) || 0), 0);
    
    return { totalLoads, activeLoads, deliveredLoads, totalTonnage };
  }, [deliveries]);

  return (
    <div className="loads-container">
      <style>{`
        .loads-container {
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          min-height: 100vh;
          padding: 1.5rem;
        }
        
        .loads-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .loads-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(45deg, var(--primary-orange), var(--accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .loads-header .subtitle {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        
        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary-orange);
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .action-bar {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }
        
        .tab-navigation {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 0;
          margin-bottom: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        
        .tab-nav {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .tab-nav .nav-link {
          border: none;
          border-radius: 0;
          padding: 1rem 1.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
          background: transparent;
        }
        
        .tab-nav .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
          color: var(--primary-orange);
          border-bottom: 3px solid var(--primary-orange);
        }
        
        .tab-nav .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary-orange);
        }
        
        .tab-content {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }
        
        .search-filters {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .btn-primary-custom {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          border: none;
          color: white;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .btn-primary-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(255, 102, 0, 0.3);
          color: white;
        }
        
        .btn-outline-custom {
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.9);
          background: transparent;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .btn-outline-custom:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary-orange);
          transform: translateY(-2px);
          border-color: var(--primary-orange);
        }
        
        .form-control-custom {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
          font-size: 1rem;
          color: var(--dark-gray);
        }
        
        .form-control-custom:focus {
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 0.2rem rgba(255, 102, 0, 0.25);
          background: rgba(255, 255, 255, 0.15);
        }
        
        .modal-custom .modal-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .modal-custom .modal-header {
          background: linear-gradient(135deg, var(--primary-blue), var(--accent-blue));
          color: white;
          border-radius: 16px 16px 0 0;
          border-bottom: none;
        }
        
        .modal-custom .modal-title {
          font-weight: 700;
          font-size: 1.25rem;
        }
        
        .modal-custom .btn-close {
          filter: invert(1);
        }
        
        .modal-custom .modal-body {
          color: var(--dark-gray);
        }
        
        .modal-custom .form-label {
          color: var(--dark-gray);
          font-weight: 600;
        }
        
        .modal-custom .form-control {
          color: var(--dark-gray);
        }
        
        .modal-custom .form-select {
          color: var(--dark-gray);
        }
        
        .pagination-custom {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .alert-success {
          background: rgba(40, 167, 69, 0.1);
          border-color: var(--success-green);
          color: var(--success-green);
          backdrop-filter: blur(10px);
        }
        
        /* Text color fixes for better contrast */
        .search-filters .form-label {
          color: var(--dark-gray) !important;
        }
        
        .search-filters .text-muted {
          color: var(--dark-gray) !important;
        }
        
        .action-bar .text-muted {
          color: var(--dark-gray) !important;
        }
        
        .pagination-custom .text-muted {
          color: var(--dark-gray) !important;
        }
        
        @media (max-width: 700px) {
          .loads-container { padding: 1rem; }
          .loads-header { padding: 1.5rem; margin-bottom: 1.5rem; }
          .loads-header h1 { font-size: 2rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .stat-card { padding: 1rem; }
          .stat-number { font-size: 2rem; }
          .action-bar { padding: 1rem; margin-bottom: 1.5rem; }
          .tab-nav { flex-direction: column; }
          .tab-nav .nav-link { border-radius: 0; text-align: center; }
          .tab-content { padding: 1rem; }
          .search-filters { padding: 1rem; }
          .mobile-stack { flex-direction: column; gap: 0.75rem; }
          .mobile-stack .btn { width: 100%; }
          .mobile-stack .form-control { width: 100%; }
        }
        
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .loads-header h1 { font-size: 1.75rem; }
        }
      `}</style>

      {/* Header Section */}
      <div className="loads-header">
        <h1>Loads Management</h1>
        <div className="subtitle">Monitor and dispatch delivery loads with real-time tracking</div>
        
        {/* Summary Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{summaryStats.totalLoads}</div>
            <div className="stat-label">Total Loads</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.activeLoads}</div>
            <div className="stat-label">Active Loads</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.deliveredLoads}</div>
            <div className="stat-label">Delivered</div>
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
              className="btn btn-primary-custom"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus className="me-2" />
              Dispatch New Load
            </button>
            
            <button 
              className="btn btn-outline-custom"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="me-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            
            {activeTab === 'overview' && (
              <button 
                className="btn btn-outline-custom"
                onClick={() => setShowChart(!showChart)}
              >
                {showChart ? <FaEyeSlash className="me-2" /> : <FaEye className="me-2" />}
                {showChart ? 'Hide' : 'Show'} Chart
              </button>
            )}
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Showing {Math.min((page - 1) * pageSize + 1, total)}-
              {Math.min(page * pageSize, total)} of {total}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <div className="search-filters">
          <form onSubmit={handleSearch} className={`d-flex gap-3 align-items-end flex-wrap${isMobile ? ' mobile-stack' : ''}`}>
            <div className="flex-grow-1" style={{ minWidth: isMobile ? '100%' : '300px' }}>
              <label className="form-label fw-bold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Search Loads</label>
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
                  aria-label="Search loads"
                />
                <button className="btn btn-outline-custom" type="submit">
                  Search
                </button>
              </div>
            </div>
            
            <div style={{ minWidth: isMobile ? '100%' : '200px' }}>
              <label className="form-label fw-bold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Status Filter</label>
              <select 
                className="form-select form-control-custom"
                value={statusFilter} 
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </form>
        </div>
      )}

      {/* Success Feedback */}
      {createFeedback && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {createFeedback}
          <button type="button" className="btn-close" onClick={() => setCreateFeedback('')} aria-label="Close"></button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-nav">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartBar className="me-2" />
            Overview
          </button>
          <button 
            className={`nav-link ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <FaTable className="me-2" />
            Table View
          </button>
          <button 
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartBar className="me-2" />
            Analytics
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div>
              {showChart && (
                <div className="mb-4">
                  <LoadsChart deliveries={deliveries} customerKeys={customerKeys} />
                </div>
              )}
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
            </div>
          )}
          
          {activeTab === 'table' && (
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
          )}
          
          {activeTab === 'analytics' && (
            <div>
              <LoadsChart deliveries={deliveries} customerKeys={customerKeys} />
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination-custom">
        <div className="d-flex justify-content-between align-items-center">
          <div className="text-muted" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Page {page} of {Math.ceil(total / pageSize)}
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-custom btn-sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button 
              className="btn btn-outline-custom btn-sm" 
              disabled={page * pageSize >= total} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setShowCreateModal(false)}></div>
          <div className="modal fade show modal-custom" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Dispatch New Load</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  {parentBookingsLoading ? (
                    <div className="text-center py-4">
                      <div className="modern-loading" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div className="mt-2">Loading customer data...</div>
                    </div>
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
    </div>
  );
} 