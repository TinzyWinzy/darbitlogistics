import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { FaChartBar, FaChartLine, FaChartArea, FaChartPie, FaCalendar, FaUsers, FaEye, FaEyeSlash, FaDownload } from 'react-icons/fa';

const chartTypes = [
  { key: 'bar', label: 'Bar', icon: FaChartBar },
  { key: 'line', label: 'Line', icon: FaChartLine },
  { key: 'area', label: 'Area', icon: FaChartArea },
  { key: 'pie', label: 'Pie', icon: FaChartPie }
];

const colors = ['#1976d2', '#D2691E', '#16a34a', '#dc2626', '#6b7280', '#f59e42', '#8e24aa', '#0097a7', '#c62828', '#388e3c'];

export default function LoadsChart({ deliveries, customerKeys }) {
  const [chartType, setChartType] = useState('bar');
  const [selectedCustomers, setSelectedCustomers] = useState(customerKeys);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    setIsMobile(mq.matches);
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Filter deliveries by date range and selected customers
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const date = d.createdAt ? new Date(d.createdAt) : null;
      const inRange = (!dateRange.from || (date && date >= new Date(dateRange.from))) &&
                      (!dateRange.to || (date && date <= new Date(dateRange.to)));
      const customerMatch = selectedCustomers.includes(d.customerName || 'Unknown');
      return inRange && customerMatch;
    });
  }, [deliveries, dateRange, selectedCustomers]);

  // Group data for charts
  const chartData = useMemo(() => {
    const grouped = {};
    filteredDeliveries.forEach(delivery => {
      const date = delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : 'Unknown';
      const customer = delivery.customerName || 'Unknown';
      if (!grouped[date]) grouped[date] = { date };
      grouped[date][customer] = (grouped[date][customer] || 0) + 1;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredDeliveries]);

  // Pie chart data: total per customer
  const pieData = useMemo(() => {
    const totals = {};
    filteredDeliveries.forEach(d => {
      const customer = d.customerName || 'Unknown';
      if (!totals[customer]) totals[customer] = 0;
      totals[customer]++;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [filteredDeliveries]);

  // Legend toggle
  const handleLegendClick = (customer) => {
    setSelectedCustomers(prev =>
      prev.includes(customer)
        ? prev.filter(c => c !== customer)
        : [...prev, customer]
    );
  };

  // Export chart data
  const handleExport = () => {
    const data = chartType === 'pie' ? pieData : chartData;
    const csv = [
      ['Date', 'Customer', 'Count'],
      ...data.flatMap(item => 
        chartType === 'pie' 
          ? [[item.name, item.value]]
          : Object.entries(item).filter(([key]) => key !== 'date').map(([customer, count]) => [item.date, customer, count])
      )
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loads-chart-${chartType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="loads-chart-container">
      <style>{`
        .loads-chart-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .chart-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chart-controls {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .control-row {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .control-label {
          font-weight: 600;
          color: var(--dark-gray);
          font-size: 0.9rem;
        }
        
        .chart-type-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .chart-type-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .chart-type-btn.active {
          background: var(--primary-orange);
          color: white;
          border-color: var(--primary-orange);
        }
        
        .chart-type-btn:not(.active) {
          background: rgba(255, 255, 255, 0.1);
          color: var(--dark-gray);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .chart-type-btn:not(.active):hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--primary-orange);
          color: var(--primary-orange);
        }
        
        .customer-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .customer-btn {
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
        }
        
        .customer-btn.active {
          background: var(--primary-orange);
          color: white;
          border-color: var(--primary-orange);
        }
        
        .customer-btn:not(.active) {
          background: rgba(255, 255, 255, 0.1);
          color: var(--dark-gray);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .customer-btn:not(.active):hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--primary-orange);
          color: var(--primary-orange);
        }
        
        .chart-content {
          padding: 1.5rem;
          min-height: 400px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }
        
        .chart-container {
          width: 100%;
          height: 350px;
        }
        
        .chart-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .chart-summary {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .summary-item {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          text-align: center;
          min-width: 120px;
        }
        
        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-orange);
        }
        
        .summary-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .btn-outline-custom {
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.9);
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
        
        @media (max-width: 700px) {
          .chart-header { padding: 1rem; }
          .chart-controls { padding: 1rem; }
          .chart-content { padding: 1rem; }
          .control-row { flex-direction: column; align-items: stretch; gap: 0.75rem; }
          .chart-type-buttons { justify-content: center; }
          .customer-filters { justify-content: center; }
          .chart-actions { flex-direction: column; gap: 1rem; align-items: stretch; }
          .chart-summary { justify-content: center; }
          .summary-item { min-width: 100px; }
        }
      `}</style>

      <div className="chart-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold" style={{ color: 'var(--primary-orange)' }}>
              Loads Analytics
            </h5>
            <p className="text-muted mb-0 small" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Visualize delivery patterns and customer distribution
            </p>
          </div>
          
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-custom btn-sm"
              onClick={() => setShowControls(!showControls)}
            >
              {showControls ? <FaEyeSlash className="me-1" /> : <FaEye className="me-1" />}
              {showControls ? 'Hide' : 'Show'} Controls
            </button>
            
            <button 
              className="btn btn-primary-custom btn-sm"
              onClick={handleExport}
            >
              <FaDownload className="me-1" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {showControls && (
        <div className="chart-controls">
          <div className="control-row">
            <div className="control-group">
              <label className="control-label">Chart Type</label>
              <div className="chart-type-buttons">
                {chartTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.key}
                      className={`chart-type-btn ${chartType === type.key ? 'active' : ''}`}
                      onClick={() => setChartType(type.key)}
                    >
                      <Icon />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="control-group">
              <label className="control-label">Date Range</label>
              <div className="d-flex gap-2">
                <input 
                  type="date" 
                  className="form-control form-control-custom"
                  value={dateRange.from} 
                  onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} 
                />
                <input 
                  type="date" 
                  className="form-control form-control-custom"
                  value={dateRange.to} 
                  onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} 
                />
              </div>
            </div>
            
            <div className="control-group">
              <label className="control-label">Customers</label>
              <div className="customer-filters">
                {customerKeys.map((customer, idx) => (
                  <button
                    key={customer}
                    className={`customer-btn ${selectedCustomers.includes(customer) ? 'active' : ''}`}
                    onClick={() => handleLegendClick(customer)}
                    title={customer}
                  >
                    {customer}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="chart-content">
        <div className="chart-actions">
          <div className="chart-summary">
            <div className="summary-item">
              <div className="summary-value">{filteredDeliveries.length}</div>
              <div className="summary-label">Total Loads</div>
            </div>
            <div className="summary-item">
              <div className="summary-value">{selectedCustomers.length}</div>
              <div className="summary-label">Customers</div>
            </div>
            <div className="summary-item">
              <div className="summary-value">{chartData.length}</div>
              <div className="summary-label">Date Points</div>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: isMobile ? 10 : 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="date" fontSize={isMobile ? 11 : 13} angle={isMobile ? -8 : -15} textAnchor="end" height={isMobile ? 30 : 50} interval={isMobile ? 0 : 'preserveEnd'} tick={{width: 60, overflow: 'hidden', textOverflow: 'ellipsis'}} stroke="rgba(255, 255, 255, 0.7)" />
                <YAxis allowDecimals={false} fontSize={isMobile ? 11 : 13} stroke="rgba(255, 255, 255, 0.7)" />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={isMobile ? 24 : 36} />
                {selectedCustomers.map((customer, idx) => (
                  <Bar
                    key={customer}
                    dataKey={customer}
                    stackId="a"
                    fill={colors[idx % colors.length]}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: isMobile ? 10 : 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="date" fontSize={isMobile ? 11 : 13} angle={isMobile ? -8 : -15} textAnchor="end" height={isMobile ? 30 : 50} interval={isMobile ? 0 : 'preserveEnd'} tick={{width: 60, overflow: 'hidden', textOverflow: 'ellipsis'}} stroke="rgba(255, 255, 255, 0.7)" />
                <YAxis allowDecimals={false} fontSize={isMobile ? 11 : 13} stroke="rgba(255, 255, 255, 0.7)" />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={isMobile ? 24 : 36} />
                {selectedCustomers.map((customer, idx) => (
                  <Line
                    key={customer}
                    dataKey={customer}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    isAnimationActive={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'area' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: isMobile ? 10 : 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="date" fontSize={isMobile ? 11 : 13} angle={isMobile ? -8 : -15} textAnchor="end" height={isMobile ? 30 : 50} interval={isMobile ? 0 : 'preserveEnd'} tick={{width: 60, overflow: 'hidden', textOverflow: 'ellipsis'}} stroke="rgba(255, 255, 255, 0.7)" />
                <YAxis allowDecimals={false} fontSize={isMobile ? 11 : 13} stroke="rgba(255, 255, 255, 0.7)" />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={isMobile ? 24 : 36} />
                {selectedCustomers.map((customer, idx) => (
                  <Area
                    key={customer}
                    dataKey={customer}
                    stroke={colors[idx % colors.length]}
                    fill={colors[idx % colors.length]}
                    fillOpacity={0.3}
                    isAnimationActive={true}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={isMobile ? 24 : 36} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 60 : 90}
                  label
                  isAnimationActive={true}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
} 