import { useState, useMemo, useRef, useEffect } from 'react';
import { useDeliveries } from '../services/useDeliveries';
import { scheduledReportApi } from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Select from 'react-select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import DeliveriesOverTimeChart from './DeliveriesOverTimeChart';
import TonnageByMineralChart from './TonnageByMineralChart';
import TopCustomersChart from './TopCustomersChart';
import { FaRegChartBar, FaRegListAlt, FaRegCalendarAlt, FaRegEnvelope, FaDownload, FaFileAlt, FaExclamationTriangle, FaFilter, FaSearch, FaUser, FaTruck, FaCalendar, FaEye, FaTrashAlt, FaPlay, FaPause, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function exportToCSV(deliveries, columns) {
  if (!deliveries.length) return;
  const headers = columns;
  const rows = deliveries.map(d => headers.map(h => d[h]));
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'deliveries.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key] || 'Unknown';
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
}

function sumBy(array, key) {
  return array.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
}

const COLORS = ['#FF6600', '#FF8533', '#FFBB28', '#FF8042', '#A28CFF', '#FF6F91', '#6FCF97', '#F2994A'];

// Responsive helper
function useIsMobile() {
  if (typeof window === 'undefined') return false;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// Helper to render a chart as a high-res PNG
async function chartToImage(chartRef, scale = 3) {
  if (!chartRef.current) return null;
  const node = chartRef.current;
  const width = node.offsetWidth * scale;
  const height = node.offsetHeight * scale;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.scale(scale, scale);
  // Use html2canvas for the chart only
  const imgCanvas = await html2canvas(node, { scale });
  return imgCanvas.toDataURL('image/png');
}

export default function Reports() {
  const { deliveries, loading } = useDeliveries();
  const [activeTab, setActiveTab] = useState('analytics');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customer, setCustomer] = useState([]); // multi-select
  const [mineral, setMineral] = useState([]); // multi-select
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [drilldown, setDrilldown] = useState(null); // for modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvColumns, setCsvColumns] = useState([
    'trackingId',
    'customerName',
    'currentStatus',
    'mineralType',
    'tonnage',
    'containerCount',
    'createdAt',
  ]);
  const allColumns = [
    { key: 'trackingId', label: 'Tracking ID' },
    { key: 'customerName', label: 'Customer' },
    { key: 'currentStatus', label: 'Status' },
    { key: 'mineralType', label: 'Mineral' },
    { key: 'tonnage', label: 'Tonnage' },
    { key: 'containerCount', label: 'Containers' },
    { key: 'createdAt', label: 'Created At' },
  ];
  const reportRef = useRef();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleRecipients, setScheduleRecipients] = useState('');
  const [scheduleType, setScheduleType] = useState('weekly');
  const [scheduleDay, setScheduleDay] = useState('Friday');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleReportType, setScheduleReportType] = useState('completed');
  const [scheduleColumns, setScheduleColumns] = useState([
    'trackingId',
    'customerName',
    'currentStatus',
    'mineralType',
    'tonnage',
    'containerCount',
    'createdAt',
  ]);
  const scheduleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const reportTypes = [
    { value: 'completed', label: 'Completed Loads' },
    { value: 'all', label: 'All Loads' },
    { value: 'filtered', label: 'Current Filtered View' },
  ];
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [deleteReport, setDeleteReport] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const notificationTimeout = useRef();

  function showNotification(type, message) {
    setNotification({ show: true, type, message });
    clearTimeout(notificationTimeout.current);
    notificationTimeout.current = setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3500);
  }

  // Fetch scheduled reports
  useEffect(() => {
    async function fetchScheduled() {
      setLoadingScheduled(true);
      try {
        const data = await scheduledReportApi.getAll();
        setScheduledReports(data);
      } catch (err) {
        setScheduledReports([]);
      }
      setLoadingScheduled(false);
    }
    fetchScheduled();
  }, []);

  async function handleScheduleSubmit() {
    setShowScheduleModal(false);
    const payload = {
      recipients: scheduleRecipients.split(',').map(e => e.trim()).filter(Boolean),
      schedule: scheduleType,
      dayOfWeek: scheduleDay,
      time: scheduleTime,
      reportType: scheduleReportType,
      columns: scheduleColumns,
      filters: scheduleReportType === 'filtered' ? {/* TODO: add current filters */} : undefined,
    };
    try {
      await scheduledReportApi.create(payload);
      showNotification('success', 'Scheduled report created!');
    } catch (err) {
      showNotification('danger', 'Failed to create scheduled report.');
    }
  }

  async function handleDeleteReport(id) {
    try {
      await scheduledReportApi.delete(id);
      setScheduledReports(scheduledReports.filter(r => r.id !== id));
      setDeleteReport(null);
      showNotification('success', 'Scheduled report deleted.');
    } catch (err) {
      showNotification('danger', 'Failed to delete scheduled report.');
    }
  }

  async function handlePauseResume(report) {
    try {
      await scheduledReportApi.update(report.id, { ...report, status: report.status === 'active' ? 'paused' : 'active' });
      setScheduledReports(scheduledReports.map(r => r.id === report.id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r));
      showNotification('info', `Report ${report.status === 'active' ? 'paused' : 'resumed'}.`);
    } catch (err) {
      showNotification('danger', 'Failed to update report status.');
    }
  }

  // Unique options
  const uniqueCustomers = useMemo(() => Array.from(new Set(deliveries.map(d => d.customerName))).filter(Boolean), [deliveries]);
  const uniqueMinerals = useMemo(() => Array.from(new Set(deliveries.map(d => d.mineralType))).filter(Boolean), [deliveries]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(deliveries.map(d => d.currentStatus))).filter(Boolean), [deliveries]);

  // Filtering logic
  const filtered = useMemo(() => {
    return deliveries.filter(d => {
      const matchesSearch = !search || (d.trackingId?.toLowerCase().includes(search.toLowerCase()) || d.customerName?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !status || d.currentStatus === status;
      const matchesCustomer = !customer.length || customer.includes(d.customerName);
      const matchesMineral = !mineral.length || mineral.includes(d.mineralType);
      const created = d.createdAt ? new Date(d.createdAt) : null;
      const matchesDateFrom = !dateFrom || (created && created >= new Date(dateFrom));
      const matchesDateTo = !dateTo || (created && created <= new Date(dateTo));
      return matchesSearch && matchesStatus && matchesCustomer && matchesMineral && matchesDateFrom && matchesDateTo;
    });
  }, [deliveries, search, status, customer, mineral, dateFrom, dateTo]);

  // Chart data: Deliveries over time (by month)
  const deliveriesOverTime = useMemo(() => {
    const byMonth = {};
    filtered.forEach(d => {
      if (!d.createdAt) return;
      const date = new Date(d.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { month: key, count: 0, tonnage: 0 };
      byMonth[key].count += 1;
      byMonth[key].tonnage += parseFloat(d.tonnage) || 0;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [filtered]);

  // Chart data: Tonnage by mineral
  const tonnageByMineral = useMemo(() => {
    const grouped = groupBy(filtered, 'mineralType');
    return Object.entries(grouped).map(([mineral, arr], i) => ({
      mineral,
      tonnage: sumBy(arr, 'tonnage'),
      color: COLORS[i % COLORS.length],
    }));
  }, [filtered]);

  // Chart data: Top customers (by tonnage)
  const topCustomers = useMemo(() => {
    const grouped = groupBy(filtered, 'customerName');
    return Object.entries(grouped)
      .map(([customer, arr]) => ({
        customer,
        tonnage: sumBy(arr, 'tonnage'),
      }))
      .sort((a, b) => b.tonnage - a.tonnage)
      .slice(0, 10);
  }, [filtered]);

  // Drilldown handler
  const handleDrilldown = (type, value) => {
    let details = [];
    if (type === 'mineral') {
      details = filtered.filter(d => d.mineralType === value);
    } else if (type === 'customer') {
      details = filtered.filter(d => d.customerName === value);
    } else if (type === 'month') {
      details = filtered.filter(d => d.createdAt && `${new Date(d.createdAt).getFullYear()}-${String(new Date(d.createdAt).getMonth() + 1).padStart(2, '0')}` === value);
    }
    setDrilldown({ type, value, details });
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    setShowPdfModal(false);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    // Branding: Add logo and title
    const logo = new window.Image();
            logo.src = '/logo.svg';
    await new Promise(res => { logo.onload = res; });
    pdf.addImage(logo, 'JPEG', 40, 20, 80, 40);
    pdf.setFontSize(22);
    pdf.text('Dar Logistics Report', 140, 50);
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 140, 70);

    // Add charts as images
    let y = 100;
    const chartImages = [];
    for (const key of Object.keys(chartRefs)) {
      const img = await chartToImage(chartRefs[key], 3);
      if (img) chartImages.push({ img, key });
    }
    for (const { img, key } of chartImages) {
      pdf.setFontSize(14);
      pdf.text(
        key === 'deliveriesOverTime' ? 'Deliveries Over Time' :
        key === 'tonnageByMineral' ? 'Tonnage by Mineral' :
        key === 'topCustomers' ? 'Top Customers (Tonnage)' : key,
        40, y + 20
      );
      pdf.addImage(img, 'PNG', 40, y + 30, 350, 180);
      y += 220;
    }

    // Add table using autoTable
    pdf.setFontSize(16);
    pdf.text('Deliveries Table', 40, y + 30);
    autoTable(pdf, {
      startY: y + 40,
      head: [allColumns.map(col => col.label)],
      body: filtered.map(d => allColumns.map(col => d[col.key])),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 33, 32] },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
      theme: 'grid',
    });
    pdf.save('darlog_report.pdf');
  };

  const isMobile = useIsMobile();
  // Pagination for mobile card view
  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 10;
  const mobileTotalPages = Math.ceil(filtered.length / mobilePageSize);
  const mobilePaged = isMobile ? filtered.slice((mobilePage - 1) * mobilePageSize, mobilePage * mobilePageSize) : filtered;

  // Pagination for mobile scheduled reports
  const [schedPage, setSchedPage] = useState(1);
  const schedPageSize = 10;
  const schedTotalPages = Math.ceil(scheduledReports.length / schedPageSize);
  const schedPaged = isMobile ? scheduledReports.slice((schedPage - 1) * schedPageSize, schedPage * schedPageSize) : scheduledReports;

  const chartRefs = {
    deliveriesOverTime: useRef(),
    tonnageByMineral: useRef(),
    topCustomers: useRef(),
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: <FaRegChartBar /> },
    { id: 'data', label: 'Data', icon: <FaRegListAlt /> },
    { id: 'scheduled', label: 'Scheduled Reports', icon: <FaRegCalendarAlt /> },
  ];

  return (
    <div className="reports-container">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === 'success' && <FaCheckCircle />}
              {notification.type === 'danger' && <FaTimesCircle />}
              {notification.type === 'info' && <FaExclamationTriangle />}
            </div>
            <div className="notification-message">
              <strong>{notification.type === 'success' ? 'Success' : notification.type === 'danger' ? 'Error' : 'Info'}</strong>
              <span>{notification.message}</span>
            </div>
            <button 
              className="notification-close" 
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="reports-header">
        <h1 className="reports-title">Reports & Analytics</h1>
        <p className="reports-subtitle">
          Comprehensive insights into your delivery operations with real-time analytics and export capabilities.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Deliveries Over Time</h3>
                  <p className="chart-subtitle">Monthly delivery trends and patterns</p>
                </div>
                <div className="chart-container" ref={chartRefs.deliveriesOverTime}>
                  <DeliveriesOverTimeChart data={deliveriesOverTime} onDrilldown={handleDrilldown} />
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Tonnage by Mineral</h3>
                  <p className="chart-subtitle">Distribution of cargo by mineral type</p>
                </div>
                <div className="chart-container" ref={chartRefs.tonnageByMineral}>
                  <TonnageByMineralChart data={tonnageByMineral} onDrilldown={handleDrilldown} />
                </div>
              </div>
              <div className="chart-card full-width">
                <div className="chart-header">
                  <h3 className="chart-title">Top Customers</h3>
                  <p className="chart-subtitle">Highest volume customers by tonnage</p>
                </div>
                <div className="chart-container" ref={chartRefs.topCustomers}>
                  <TopCustomersChart data={topCustomers} onDrilldown={handleDrilldown} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="data-section">
            {/* Filters */}
            <div className="filters-section">
              <div className="filters-grid">
                <div className="filter-item">
                  <FaSearch className="filter-icon" />
                  <input 
                    type="text" 
                    className="filter-input" 
                    placeholder="Search by tracking ID or customer" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                </div>
                                <div className="filter-item">
                  <FaFilter className="filter-icon" />
                  <select 
                    className="filter-select" 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                  >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
                </div>
                                <div className="filter-item">
                  <FaUser className="filter-icon" />
                <Select
                  isMulti
                  options={uniqueCustomers.map(c => ({ value: c, label: c }))}
                  value={customer.map(c => ({ value: c, label: c }))}
                  onChange={opts => setCustomer(opts.map(o => o.value))}
                  placeholder="Select customers"
                    className="react-select-container"
                    classNamePrefix="react-select"
                />
              </div>
                                <div className="filter-item">
                  <FaTruck className="filter-icon" />
                <Select
                  isMulti
                  options={uniqueMinerals.map(m => ({ value: m, label: m }))}
                  value={mineral.map(m => ({ value: m, label: m }))}
                  onChange={opts => setMineral(opts.map(o => o.value))}
                  placeholder="Select minerals"
                    className="react-select-container"
                    classNamePrefix="react-select"
                />
              </div>
                <div className="filter-item">
                  <FaCalendar className="filter-icon" />
                  <input 
                    type="date" 
                    className="filter-input" 
                    value={dateFrom} 
                    onChange={e => setDateFrom(e.target.value)} 
                  />
                </div>
                <div className="filter-item">
                  <FaCalendar className="filter-icon" />
                  <input 
                    type="date" 
                    className="filter-input" 
                    value={dateTo} 
                    onChange={e => setDateTo(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="export-actions">
                <button className="export-btn csv" onClick={() => setShowCsvModal(true)}>
                  <FaDownload className="btn-icon" />
                  Export CSV
                </button>
                <button className="export-btn pdf" onClick={() => setShowPdfModal(true)}>
                  <FaFileAlt className="btn-icon" />
                  Export PDF
                </button>
                <button className="export-btn schedule" onClick={() => setShowScheduleModal(true)}>
                  <FaRegEnvelope className="btn-icon" />
                  Schedule Report
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="data-table-container">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading delivery data...</p>
                </div>
              ) : (
                <>
                  {filtered.length === 0 ? (
                    <div className="no-data">
                      <FaRegListAlt className="no-data-icon" />
                      <h3>No deliveries found</h3>
                      <p>Try adjusting your filters or search criteria.</p>
                    </div>
                  ) : (
                    <>
                      {isMobile ? (
                        <div className="mobile-cards">
                          {mobilePaged.map(d => (
                            <DeliveryCard 
                              key={d.trackingId} 
                              delivery={d} 
                              onShowDetails={() => setDrilldown({ type: 'row', value: d.trackingId, details: [d] })} 
                            />
                          ))}
                          {mobileTotalPages > 1 && (
                            <div className="mobile-pagination">
                              <button 
                                className="pagination-btn" 
                                disabled={mobilePage === 1}
                                onClick={() => setMobilePage(mobilePage - 1)}
                              >
                                Previous
                              </button>
                              <span className="pagination-info">
                                Page {mobilePage} of {mobileTotalPages}
                              </span>
                              <button 
                                className="pagination-btn" 
                                disabled={mobilePage === mobileTotalPages}
                                onClick={() => setMobilePage(mobilePage + 1)}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Tracking ID</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Mineral</th>
                                <th>Tonnage</th>
                                <th>Containers</th>
                                <th>Created At</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map(d => (
                                <tr key={d.trackingId} className="table-row">
                                  <td>{d.trackingId}</td>
                                  <td>{d.customerName}</td>
                                  <td>
                                    <span className={`status-badge ${d.currentStatus?.toLowerCase()}`}>
                                      {d.currentStatus}
                                    </span>
                                  </td>
                                  <td>{d.mineralType}</td>
                                  <td>{d.tonnage}</td>
                                  <td>{d.containerCount}</td>
                                  <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}</td>
                                  <td>
                                    <button 
                                      className="action-btn view"
                                      onClick={() => setDrilldown({ type: 'row', value: d.trackingId, details: [d] })}
                                    >
                                      <FaEye />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === 'scheduled' && (
          <div className="scheduled-section">
            {loadingScheduled ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading scheduled reports...</p>
              </div>
            ) : (
              <>
                {scheduledReports.length === 0 ? (
                  <div className="no-data">
                    <FaRegCalendarAlt className="no-data-icon" />
                    <h3>No scheduled reports</h3>
                    <p>Create your first scheduled report to get started.</p>
                  </div>
                ) : (
                  <div className="scheduled-reports-grid">
                    {schedPaged.map(r => (
                      <div key={r.id} className="scheduled-report-card">
                        <div className="report-header">
                          <div className="report-info">
                            <h4 className="report-title">
                              {Array.isArray(r.recipients) ? r.recipients.join(', ') : r.recipients}
                            </h4>
                            <span className={`status-badge ${r.status}`}>{r.status}</span>
                          </div>
                          <div className="report-schedule">
                            <span className="schedule-info">{r.schedule_type} • {r.day_of_week} • {r.time}</span>
                          </div>
                        </div>
                        <div className="report-details">
                          <div className="detail-item">
                            <strong>Type:</strong> {r.report_type}
                          </div>
                          <div className="detail-item">
                            <strong>Last Run:</strong> {r.last_run ? new Date(r.last_run).toLocaleString() : '-'}
                          </div>
                          <div className="detail-item">
                            <strong>Next Run:</strong> {r.next_run ? new Date(r.next_run).toLocaleString() : '-'}
                          </div>
                        </div>
                        <div className="report-actions">
                                                      <button className="action-btn edit" onClick={() => setEditReport(r)}>
                              <FaFileAlt />
                            </button>
                          <button className="action-btn delete" onClick={() => setDeleteReport(r)}>
                            <FaTrashAlt />
                          </button>
                          <button 
                            className={`action-btn ${r.status === 'active' ? 'pause' : 'play'}`}
                            onClick={() => handlePauseResume(r)}
                          >
                            {r.status === 'active' ? <FaPause /> : <FaPlay />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {schedTotalPages > 1 && (
                      <div className="pagination">
                        <button 
                          className="pagination-btn" 
                          disabled={schedPage === 1}
                          onClick={() => setSchedPage(schedPage - 1)}
                        >
                          Previous
                        </button>
                        <span className="pagination-info">
                          Page {schedPage} of {schedTotalPages}
                        </span>
                        <button 
                          className="pagination-btn" 
                          disabled={schedPage === schedTotalPages}
                          onClick={() => setSchedPage(schedPage + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals - Outside tab content so they remain accessible */}
      {/* CSV Export Modal: full-screen on mobile */}
      {showCsvModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className={isMobile ? 'modal-dialog modal-fullscreen' : 'modal-dialog'}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Export CSV</h5>
                <button type="button" className="btn-close" onClick={() => setShowCsvModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Select columns to include in the CSV export:</p>
                <div className="d-flex flex-wrap gap-2">
                  {allColumns.map(col => (
                    <div key={col.key} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`csv-col-${col.key}`}
                        checked={csvColumns.includes(col.key)}
                        onChange={e => {
                          if (e.target.checked) {
                            setCsvColumns([...csvColumns, col.key]);
                          } else {
                            setCsvColumns(csvColumns.filter(k => k !== col.key));
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor={`csv-col-${col.key}`}>{col.label}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary w-100" style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => setShowCsvModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary w-100"
                  style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}}
                  onClick={() => {
                    setShowCsvModal(false);
                    exportToCSV(filtered, csvColumns);
                  }}
                  disabled={csvColumns.length === 0}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal: full-screen on mobile */}
      {showPdfModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className={isMobile ? 'modal-dialog modal-fullscreen' : 'modal-dialog'}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Export PDF</h5>
                <button type="button" className="btn-close" onClick={() => setShowPdfModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>This will export the current charts and table as a branded PDF report.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary w-100" style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => setShowPdfModal(false)}>Cancel</button>
                <button className="btn btn-primary w-100" style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}} onClick={handleExportPDF}>Export PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Email Report Modal: full-screen on mobile */}
      {showScheduleModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className={isMobile ? 'modal-dialog modal-fullscreen' : 'modal-dialog'}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Schedule Email Report</h5>
                <button type="button" className="btn-close" onClick={() => setShowScheduleModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Recipients (comma-separated emails)</label>
                  <input type="text" className="form-control" value={scheduleRecipients} onChange={e => setScheduleRecipients(e.target.value)} placeholder="e.g. manager@company.com, ceo@company.com" />
                </div>
                <div className="mb-2">
                  <label className="form-label">Schedule</label>
                  <select className="form-select" value={scheduleType} onChange={e => setScheduleType(e.target.value)}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Day</label>
                  <select className="form-select" value={scheduleDay} onChange={e => setScheduleDay(e.target.value)}>
                    {scheduleDays.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-control" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Report Type</label>
                  <select className="form-select" value={scheduleReportType} onChange={e => setScheduleReportType(e.target.value)}>
                    {reportTypes.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Columns</label>
                  <div className="d-flex flex-wrap gap-2">
                    {allColumns.map(col => (
                      <div key={col.key} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`schedule-col-${col.key}`}
                          checked={scheduleColumns.includes(col.key)}
                          onChange={e => {
                            if (e.target.checked) {
                              setScheduleColumns([...scheduleColumns, col.key]);
                            } else {
                              setScheduleColumns(scheduleColumns.filter(k => k !== col.key));
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor={`schedule-col-${col.key}`}>{col.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary w-100" style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button
                  className="btn btn-success w-100"
                  style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}}
                  onClick={handleScheduleSubmit}
                  disabled={!scheduleRecipients || scheduleColumns.length === 0}
                >
                  Schedule Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Modal: full-screen on mobile */}
      {drilldown && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className={isMobile ? 'modal-dialog modal-fullscreen' : 'modal-dialog modal-lg'}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{drilldown.type === 'row' ? 'Delivery Details' : `Details for ${drilldown.type}: ${drilldown.value}`}</h5>
                <button type="button" className="btn-close" onClick={() => setDrilldown(null)}></button>
              </div>
              <div className="modal-body">
                {drilldown.details.length === 0 ? <div>No details found.</div> : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Tracking ID</th>
                          <th>Customer</th>
                          <th>Status</th>
                          <th>Mineral</th>
                          <th>Tonnage</th>
                          <th>Containers</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drilldown.details.map(d => (
                          <tr key={d.trackingId}>
                            <td>{d.trackingId}</td>
                            <td>{d.customerName}</td>
                            <td>{d.currentStatus}</td>
                            <td>{d.mineralType}</td>
                            <td>{d.tonnage}</td>
                            <td>{d.containerCount}</td>
                            <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary w-100" style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => setDrilldown(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal: full-screen on mobile */}
      {deleteReport && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className={isMobile ? 'modal-dialog modal-fullscreen' : 'modal-dialog'}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Scheduled Report</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteReport(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this scheduled report?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary w-100" style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => setDeleteReport(null)}>Cancel</button>
                <button className="btn btn-danger w-100" style={isMobile ? { fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => handleDeleteReport(deleteReport.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal (reuse schedule modal, pre-fill with editReport) - implementation can be added as needed */}
      <style>{`
        /* CSS Custom Properties for Reports */
        :root {
          --primary-blue: #003366;
          --primary-orange: #FF6600;
          --accent-orange: #FF8533;
          --accent-blue: #0066CC;
          --background-gradient: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          --card-background: rgba(255, 255, 255, 0.1);
          --card-border: rgba(255, 255, 255, 0.2);
          --text-primary: #FFFFFF;
          --text-secondary: rgba(255, 255, 255, 0.8);
          --text-muted: rgba(255, 255, 255, 0.6);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --transition-slow: 0.3s ease;
          --border-radius: 16px;
          --border-radius-lg: 20px;
        }

        /* Main Container */
        .reports-container {
          min-height: 100vh;
          background: var(--background-gradient);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 40px 20px;
          color: var(--text-primary);
        }

        /* Header Section */
        .reports-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .reports-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 16px;
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .reports-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Tabs */
        .tabs-container {
          margin-bottom: 40px;
        }

        .tabs-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius);
          padding: 8px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }

        .tab-btn.active {
          background: var(--primary-orange);
          color: var(--text-primary);
        }

        .tab-icon {
          width: 16px;
          height: 16px;
        }

        .tab-label {
          font-size: 0.875rem;
        }

        /* Analytics Section */
        .analytics-section {
          margin-bottom: 40px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .chart-card {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          transition: var(--transition-slow);
        }

        .chart-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .chart-header {
          margin-bottom: 20px;
        }

        .chart-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .chart-subtitle {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .chart-container {
          width: 100%;
          height: 300px;
        }

        /* Data Section */
        .data-section {
          margin-bottom: 40px;
        }

        .filters-section {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          margin-bottom: 24px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .filter-item {
          position: relative;
        }

        .filter-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary-orange);
          width: 16px;
          height: 16px;
          z-index: 2;
        }

        .filter-input,
        .filter-select {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 12px 12px 12px 40px;
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: var(--transition-slow);
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: var(--primary-orange);
        }

        .filter-input::placeholder {
          color: var(--text-muted);
        }

        .export-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .export-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-slow);
          font-size: 0.875rem;
        }

        .export-btn.csv {
          background: var(--primary-orange);
          color: white;
        }

        .export-btn.pdf {
          background: var(--accent-blue);
          color: white;
        }

        .export-btn.schedule {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          border: 1px solid var(--card-border);
        }

        .export-btn:hover {
          transform: translateY(-2px);
        }

        .btn-icon {
          width: 14px;
          height: 14px;
        }

        /* Data Table */
        .data-table-container {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid var(--card-border);
        }

        .data-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.active,
        .status-badge.completed {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-badge.pending,
        .status-badge.in-transit {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .status-badge.cancelled,
        .status-badge.failed {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .action-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .action-btn.view {
          color: var(--primary-orange);
        }

        .action-btn.edit {
          color: var(--accent-blue);
        }

        .action-btn.delete {
          color: #ef4444;
        }

        .action-btn.play {
          color: #22c55e;
        }

        .action-btn.pause {
          color: #fbbf24;
        }

        /* Mobile Cards */
        .mobile-cards {
          padding: 20px;
        }

        .delivery-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          transition: var(--transition-slow);
        }

        .delivery-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .delivery-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .delivery-card-key {
          font-weight: 600;
          color: var(--text-primary);
        }

        .delivery-card-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
        }

        .delivery-card-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--card-border);
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        /* Scheduled Reports */
        .scheduled-section {
          margin-bottom: 40px;
        }

        .scheduled-reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .scheduled-report-card {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          transition: var(--transition-slow);
        }

        .scheduled-report-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .report-header {
          margin-bottom: 16px;
        }

        .report-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .report-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
        }

        .report-schedule {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .report-details {
          margin-bottom: 16px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .report-actions {
          display: flex;
          gap: 8px;
        }

        /* Loading and No Data */
        .loading-container,
        .no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid var(--primary-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-data-icon {
          width: 48px;
          height: 48px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .no-data h3 {
          margin-bottom: 8px;
          font-weight: 600;
        }

        .no-data p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        /* Notification Toast */
        .notification-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          min-width: 300px;
          max-width: 400px;
        }

        .notification-content {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-lg);
        }

        .notification-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .notification-toast.success .notification-icon {
          color: #22c55e;
        }

        .notification-toast.danger .notification-icon {
          color: #ef4444;
        }

        .notification-toast.info .notification-icon {
          color: #3b82f6;
        }

        .notification-message {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .notification-message strong {
          font-weight: 600;
        }

        .notification-message span {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .notification-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-close:hover {
          color: var(--text-primary);
        }

        /* Pagination */
        .pagination,
        .mobile-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
          padding: 16px;
        }

        .pagination-btn {
          background: var(--primary-orange);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-slow);
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--accent-orange);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        /* React Select Customization */
        .react-select-container .react-select__control {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid var(--card-border) !important;
          border-radius: 8px !important;
          min-height: 44px !important;
        }

        .react-select-container .react-select__control:hover {
          border-color: var(--primary-orange) !important;
        }

        .react-select-container .react-select__control--is-focused {
          border-color: var(--primary-orange) !important;
          box-shadow: 0 0 0 1px var(--primary-orange) !important;
        }

        .react-select-container .react-select__menu {
          background: var(--card-background) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid var(--card-border) !important;
          border-radius: 8px !important;
        }

        .react-select-container .react-select__option {
          background: transparent !important;
          color: var(--text-primary) !important;
        }

        .react-select-container .react-select__option--is-focused {
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .react-select-container .react-select__option--is-selected {
          background: var(--primary-orange) !important;
        }

        .react-select-container .react-select__single-value,
        .react-select-container .react-select__placeholder {
          color: var(--text-primary) !important;
        }

        .react-select-container .react-select__multi-value {
          background: var(--primary-orange) !important;
          border-radius: 6px !important;
        }

        .react-select-container .react-select__multi-value__label {
          color: white !important;
        }

        .react-select-container .react-select__multi-value__remove {
          color: white !important;
        }

        .react-select-container .react-select__multi-value__remove:hover {
          background: rgba(255, 255, 255, 0.2) !important;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .reports-container {
            padding: 20px 16px;
          }

          .reports-title {
            font-size: 2rem;
          }

          .tabs-nav {
            flex-direction: column;
            gap: 4px;
          }

          .tab-btn {
            justify-content: center;
            padding: 16px;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .export-actions {
            flex-direction: column;
          }

          .export-btn {
            justify-content: center;
          }

          .scheduled-reports-grid {
            grid-template-columns: 1fr;
          }

          .data-table {
            font-size: 0.875rem;
          }

          .data-table th,
          .data-table td {
            padding: 12px 8px;
          }
        }

        @media (max-width: 480px) {
          .reports-title {
            font-size: 1.75rem;
          }

          .chart-card {
            padding: 20px;
          }

          .filters-section {
            padding: 20px;
          }

          .notification-toast {
            left: 20px;
            right: 20px;
            min-width: auto;
          }
        }

        /* Accessibility */
        .tab-btn:focus,
        .export-btn:focus,
        .action-btn:focus,
        .pagination-btn:focus {
          outline: 2px solid var(--primary-orange);
          outline-offset: 2px;
        }

        /* Modal Styles */
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .modal-dialog {
          background: var(--card-background);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius-lg);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-fullscreen {
          width: 100vw;
          height: 100vh;
          max-width: none;
          max-height: none;
          border-radius: 0;
        }

        .modal-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid var(--card-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }

        .btn-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: var(--transition-slow);
        }

        .btn-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .modal-footer {
          padding: 24px;
          border-top: 1px solid var(--card-border);
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-control,
        .form-select {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 12px;
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: var(--transition-slow);
        }

        .form-control:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--primary-orange);
        }

        .form-control::placeholder {
          color: var(--text-muted);
        }

        .form-check {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .form-check-input {
          width: 16px;
          height: 16px;
          accent-color: var(--primary-orange);
        }

        .form-check-label {
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-slow);
          font-size: 0.875rem;
          text-decoration: none;
        }

        .btn-primary {
          background: var(--primary-orange);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-orange);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          border: 1px solid var(--card-border);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .w-100 {
          width: 100%;
        }

        .d-flex {
          display: flex;
        }

        .flex-wrap {
          flex-wrap: wrap;
        }

        .gap-2 {
          gap: 8px;
        }

        .mb-2 {
          margin-bottom: 8px;
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .chart-card:hover,
          .scheduled-report-card:hover,
          .export-btn:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

// DeliveryCard: minimal, inline, no bloat
function DeliveryCard({ delivery, onShowDetails }) {
  const [show, setShow] = useState(false);
  return (
    <div className="delivery-card">
      <div className="delivery-card-header">
        <span className="delivery-card-key">{delivery.trackingId}</span>
        <span className="delivery-card-status">{delivery.currentStatus}</span>
      </div>
      <div className="mb-1 text-muted small">{delivery.customerName}</div>
      <div className="d-flex flex-wrap gap-2 mb-2">
        <span className="badge bg-light text-dark border">Tonnage: {delivery.tonnage}</span>
        <span className="badge bg-light text-dark border">Containers: {delivery.containerCount}</span>
        <span className="badge bg-light text-dark border">{delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : ''}</span>
      </div>
      <button className="btn btn-outline-info w-100" style={{ fontSize: '1em', padding: '0.6em' }} onClick={() => setShow(s => !s)}>{show ? 'Hide Details' : 'Details'}</button>
      {show && (
        <div className="delivery-card-details">
          <div><strong>Mineral:</strong> {delivery.mineralType}</div>
          <div><strong>Status:</strong> {delivery.currentStatus}</div>
          <div><strong>Tracking ID:</strong> {delivery.trackingId}</div>
          <div><strong>Customer:</strong> {delivery.customerName}</div>
          <div><strong>Tonnage:</strong> {delivery.tonnage}</div>
          <div><strong>Containers:</strong> {delivery.containerCount}</div>
          <div><strong>Created At:</strong> {delivery.createdAt ? new Date(delivery.createdAt).toLocaleString() : ''}</div>
          <button className="btn btn-sm btn-outline-secondary mt-2 w-100" onClick={onShowDetails}>Full Delivery Info</button>
        </div>
      )}
    </div>
  );
} 