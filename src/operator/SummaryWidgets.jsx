import React from 'react';
import { FaUsers, FaTruck, FaCheckCircle, FaHourglassHalf, FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function SummaryWidgets({ activeLoads, completedLoads, pendingLoads, totalCustomers, analyticsTrends }) {
  return (
    <div className="row g-4 mb-4">
      <div className="col-6 col-md-3">
        <div className="card shadow-sm border-0 text-center py-3 position-relative" style={{ background: '#fffbe6' }} title="Currently active loads">
          <FaTruck className="fs-2 mb-2 text-warning" aria-label="Active Loads" />
          <div className="fw-bold fs-4" style={{ color: '#1F2120' }}>{activeLoads}
            <span className="ms-2">{analyticsTrends.total === 1 ? <FaArrowUp className="text-success" title="Up" /> : analyticsTrends.total === -1 ? <FaArrowDown className="text-danger" title="Down" /> : null}</span>
          </div>
          <div className="text-muted small">Active Loads</div>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="card shadow-sm border-0 text-center py-3 position-relative" style={{ background: '#e0ffe6' }} title="Loads delivered or completed">
          <FaCheckCircle className="fs-2 mb-2 text-success" aria-label="Completed Loads" />
          <div className="fw-bold fs-4" style={{ color: '#16a34a' }}>{completedLoads}
            <span className="ms-2">{analyticsTrends.completed === 1 ? <FaArrowUp className="text-success" title="Up" /> : analyticsTrends.completed === -1 ? <FaArrowDown className="text-danger" title="Down" /> : null}</span>
          </div>
          <div className="text-muted small">Completed Loads</div>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="card shadow-sm border-0 text-center py-3 position-relative" style={{ background: '#fff0e6' }} title="Loads not yet started or pending">
          <FaHourglassHalf className="fs-2 mb-2 text-warning" aria-label="Pending Loads" />
          <div className="fw-bold fs-4" style={{ color: '#d2691e' }}>{pendingLoads}
            <span className="ms-2">{analyticsTrends.pending === 1 ? <FaArrowUp className="text-success" title="Up" /> : analyticsTrends.pending === -1 ? <FaArrowDown className="text-danger" title="Down" /> : null}</span>
          </div>
          <div className="text-muted small">Pending Loads</div>
        </div>
      </div>
      <div className="col-6 col-md-3">
        <div className="card shadow-sm border-0 text-center py-3 position-relative" style={{ background: '#e6f0ff' }} title="Unique customers with bookings">
          <FaUsers className="fs-2 mb-2 text-primary" aria-label="Total Customers" />
          <div className="fw-bold fs-4" style={{ color: '#1e40af' }}>{totalCustomers}</div>
          <div className="text-muted small">Total Customers</div>
        </div>
      </div>
    </div>
  );
} 