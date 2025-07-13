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

const chartTypes = [
  { key: 'bar', label: 'Bar' },
  { key: 'line', label: 'Line' },
  { key: 'area', label: 'Area' },
  { key: 'pie', label: 'Pie' }
];

const colors = ['#1976d2', '#D2691E', '#16a34a', '#dc2626', '#6b7280', '#f59e42', '#8e24aa', '#0097a7', '#c62828', '#388e3c'];

export default function LoadsChart({ deliveries, customerKeys }) {
  const [chartType, setChartType] = useState('bar');
  const [selectedCustomers, setSelectedCustomers] = useState(customerKeys);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  // Mobile detection
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

  return (
    <div className="card shadow-sm border-0 mb-4 p-3">
      <style>{`
        @media (max-width: 700px) {
          .mobile-chart-controls { flex-direction: column !important; align-items: stretch !important; gap: 0.4em !important; }
          .mobile-chart-row { display: flex; flex-direction: row; gap: 0.5em; align-items: center; margin-bottom: 0.5em; }
          .mobile-chart-row + .mobile-chart-row { border-top: 1px solid #eee; padding-top: 0.5em; }
          .mobile-chart-type-group, .mobile-chart-date-group, .mobile-chart-customer-group { width: 100%; }
          .mobile-chart-customer-scroll { overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
          .mobile-chart-customer-scroll button { display: inline-block; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.3em; }
          .mobile-chart-controls .btn, .mobile-chart-controls input, .mobile-chart-controls select { font-size: 1.08em; min-height: 2.5em; }
          .mobile-chart-scroll { overflow-x: auto; }
          .mobile-chart-container { height: 220px !important; min-width: 480px; }
        }
      `}</style>
      <div className={`d-flex flex-wrap align-items-center gap-3 mb-3${isMobile ? ' mobile-chart-controls' : ''}`} style={isMobile ? {overflowX:'auto'} : {}}>
        {isMobile ? (
          <>
            <div className="mobile-chart-row mobile-chart-type-group">
              <div className="btn-group w-100" role="group" aria-label="Chart type toggle">
                {chartTypes.map(type => (
                  <button
                    key={type.key}
                    className={`btn btn-sm ${chartType === type.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setChartType(type.key)}
                    style={{fontSize:'1.08em', minHeight:'2.5em'}}>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mobile-chart-row mobile-chart-date-group">
              <label className="form-label mb-0 me-2 small">From:</label>
              <input type="date" className="form-control form-control-sm" style={{width:'100%',fontSize:'1.08em',minHeight:'2.5em'}} value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} />
              <label className="form-label mb-0 ms-2 me-2 small">To:</label>
              <input type="date" className="form-control form-control-sm" style={{width:'100%',fontSize:'1.08em',minHeight:'2.5em'}} value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} />
            </div>
            <div className="mobile-chart-row mobile-chart-customer-group">
              <span className="form-label mb-0 me-2 small">Customers:</span>
              <div className="mobile-chart-customer-scroll" style={{width:'100%'}}>
                {customerKeys.map((customer, idx) => (
                  <button
                    key={customer}
                    className={`btn btn-sm ${selectedCustomers.includes(customer) ? 'btn-info' : 'btn-outline-info'}`}
                    style={{background: selectedCustomers.includes(customer) ? colors[idx % colors.length] : undefined, color: selectedCustomers.includes(customer) ? '#fff' : undefined, fontSize:'1.08em',minHeight:'2.5em',marginBottom:'0.3em',maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'inline-block'}}
                    onClick={() => handleLegendClick(customer)}
                    title={customer}
                  >
                    {customer}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="btn-group" role="group" aria-label="Chart type toggle">
              {chartTypes.map(type => (
                <button
                  key={type.key}
                  className={`btn btn-sm ${chartType === type.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setChartType(type.key)}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 me-2 small">From:</label>
              <input type="date" className="form-control form-control-sm" style={{width:120}} value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} />
              <label className="form-label mb-0 ms-2 me-2 small">To:</label>
              <input type="date" className="form-control form-control-sm" style={{width:120}} value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} />
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="form-label mb-0 me-2 small">Customers:</span>
              {customerKeys.map((customer, idx) => (
                <button
                  key={customer}
                  className={`btn btn-sm ${selectedCustomers.includes(customer) ? 'btn-info' : 'btn-outline-info'}`}
                  style={{background: selectedCustomers.includes(customer) ? colors[idx % colors.length] : undefined, color: selectedCustomers.includes(customer) ? '#fff' : undefined}}
                  onClick={() => handleLegendClick(customer)}
                >
                  {customer}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className={isMobile ? 'mobile-chart-scroll' : ''} style={isMobile ? { width: '100vw', overflowX: 'auto' } : {}}>
        <div className={isMobile ? 'mobile-chart-container' : ''} style={isMobile ? {height:220,minWidth:480} : {width:'100%',height:300}}>
          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: isMobile ? 10 : 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={isMobile ? 11 : 13} angle={isMobile ? -8 : -15} textAnchor="end" height={isMobile ? 30 : 50} interval={isMobile ? 0 : 'preserveEnd'} tick={{width: 60, overflow: 'hidden', textOverflow: 'ellipsis'}} />
                <YAxis allowDecimals={false} fontSize={isMobile ? 11 : 13} />
                <Tooltip cursor={{ fill: '#f3f3f3' }} />
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={isMobile ? 11 : 13} angle={isMobile ? -8 : -15} textAnchor="end" height={isMobile ? 30 : 50} interval={isMobile ? 0 : 'preserveEnd'} tick={{width: 60, overflow: 'hidden', textOverflow: 'ellipsis'}} />
                <YAxis allowDecimals={false} fontSize={isMobile ? 11 : 13} />
                <Tooltip cursor={{ fill: '#f3f3f3' }} />
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={isMobile ? 11 : 13} angle={isMobile ? -8 : -15} textAnchor="end" height={isMobile ? 30 : 50} interval={isMobile ? 0 : 'preserveEnd'} tick={{width: 60, overflow: 'hidden', textOverflow: 'ellipsis'}} />
                <YAxis allowDecimals={false} fontSize={isMobile ? 11 : 13} />
                <Tooltip cursor={{ fill: '#f3f3f3' }} />
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
                <Tooltip />
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