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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6F91', '#6FCF97', '#F2994A'];

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
    logo.src = '/logo.jpg';
    await new Promise(res => { logo.onload = res; });
    pdf.addImage(logo, 'JPEG', 40, 20, 80, 40);
    pdf.setFontSize(22);
    pdf.text('Morres Logistics Report', 140, 50);
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
    pdf.save('morres_report.pdf');
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

  return (
    <div className="container py-5">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`toast show position-fixed top-0 end-0 m-4`} style={{ zIndex: 9999, minWidth: 220 }} role="alert" aria-live="assertive" aria-atomic="true">
          <div className={`toast-header bg-${notification.type} text-white`}>
            <strong className="me-auto">{notification.type === 'success' ? 'Success' : notification.type === 'danger' ? 'Error' : 'Info'}</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setNotification({ show: false, type: '', message: '' })} aria-label="Close"></button>
          </div>
          <div className="toast-body">{notification.message}</div>
        </div>
      )}
      <h2 className="fw-bold mb-4">Reports</h2>
      {/* Filters: stack vertically on mobile */}
      <div className={`mb-3 d-flex ${isMobile ? 'flex-column gap-2 align-items-stretch' : 'flex-wrap gap-2 align-items-end'}`}>        
        <input type="text" className="form-control" style={isMobile ? { width: '100%' } : { maxWidth: 200 }} placeholder="Search by tracking ID or customer" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={isMobile ? { width: '100%' } : { maxWidth: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={isMobile ? { width: '100%' } : { minWidth: 200 }}>
          <Select
            isMulti
            options={uniqueCustomers.map(c => ({ value: c, label: c }))}
            value={customer.map(c => ({ value: c, label: c }))}
            onChange={opts => setCustomer(opts.map(o => o.value))}
            placeholder="Select customers"
            styles={isMobile ? { container: base => ({ ...base, width: '100%' }) } : {}}
          />
        </div>
        <div style={isMobile ? { width: '100%' } : { minWidth: 200 }}>
          <Select
            isMulti
            options={uniqueMinerals.map(m => ({ value: m, label: m }))}
            value={mineral.map(m => ({ value: m, label: m }))}
            onChange={opts => setMineral(opts.map(o => o.value))}
            placeholder="Select minerals"
            styles={isMobile ? { container: base => ({ ...base, width: '100%' }) } : {}}
          />
        </div>
        <input type="date" className="form-control" style={isMobile ? { width: '100%' } : { maxWidth: 160 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="form-control" style={isMobile ? { width: '100%' } : { maxWidth: 160 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className="btn btn-primary" style={isMobile ? { width: '100%', fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => setShowCsvModal(true)}>Export CSV</button>
        <button className="btn btn-outline-secondary" style={isMobile ? { width: '100%', fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => setShowPdfModal(true)}>Export PDF</button>
        <button className="btn btn-outline-success" style={isMobile ? { width: '100%', fontSize: '1.1em', padding: '0.7em' } : {}} onClick={() => setShowScheduleModal(true)}>Schedule Email Report</button>
      </div>
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
      {/* Report Content for PDF Export */}
      <div ref={reportRef}>
        {/* Charts Section: single column on mobile */}
        <div className={isMobile ? 'mb-4' : 'row mb-4 g-3'}>
          {isMobile ? (
            <>
              <div className="mb-3">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <DeliveriesOverTimeChart data={deliveriesOverTime} onDrilldown={handleDrilldown} />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <TonnageByMineralChart data={tonnageByMineral} onDrilldown={handleDrilldown} />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <TopCustomersChart data={topCustomers} onDrilldown={handleDrilldown} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="col-md-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <DeliveriesOverTimeChart data={deliveriesOverTime} onDrilldown={handleDrilldown} />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <TonnageByMineralChart data={tonnageByMineral} onDrilldown={handleDrilldown} />
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <TopCustomersChart data={topCustomers} onDrilldown={handleDrilldown} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Data Section: Card/List on mobile, table on desktop */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            {loading ? <div className="p-4 text-center">Loading...</div> : (
              isMobile ? (
                filtered.length === 0 ? (
                  <div className="text-center text-muted py-4">No deliveries found.</div>
                ) : (
                  <>
                    <div>
                      {mobilePaged.map(d => (
                        <DeliveryCard key={d.trackingId} delivery={d} onShowDetails={() => setDrilldown({ type: 'row', value: d.trackingId, details: [d] })} />
                      ))}
                    </div>
                    {/* Mobile Pagination */}
                    {mobileTotalPages > 1 && (
                      <nav className="mt-2 position-sticky bottom-0 bg-white py-2" style={{ zIndex: 10 }}>
                        <ul className="pagination justify-content-center mb-0" style={{ fontSize: '1.2em' }}>
                          <li className={`page-item${mobilePage === 1 ? ' disabled' : ''}`}><button className="page-link" style={{ minWidth: 44, minHeight: 44 }} onClick={() => setMobilePage(mobilePage - 1)}>&laquo;</button></li>
                          {Array.from({ length: mobileTotalPages }, (_, i) => (
                            <li key={i + 1} className={`page-item${mobilePage === i + 1 ? ' active' : ''}`}><button className="page-link" style={{ minWidth: 44, minHeight: 44 }} onClick={() => setMobilePage(i + 1)}>{i + 1}</button></li>
                          ))}
                          <li className={`page-item${mobilePage === mobileTotalPages ? ' disabled' : ''}`}><button className="page-link" style={{ minWidth: 44, minHeight: 44 }} onClick={() => setMobilePage(mobilePage + 1)}>&raquo;</button></li>
                        </ul>
                      </nav>
                    )}
                  </>
                )
              ) : (
                <div className="table-responsive" style={isMobile ? { overflowX: 'auto' } : {}}>
                  <table className="table table-hover align-middle mb-0" style={isMobile ? { minWidth: 600, fontSize: '1em' } : {}}>
                    <thead className="table-light" style={isMobile ? { position: 'sticky', top: 0, zIndex: 2 } : {}}>
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
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-muted">No deliveries found.</td></tr>
                    ) : (
                      filtered.map(d => (
                          <tr key={d.trackingId} style={{ cursor: 'pointer', height: isMobile ? 56 : undefined }} onClick={() => setDrilldown({ type: 'row', value: d.trackingId, details: [d] })}>
                          <td>{d.trackingId}</td>
                          <td>{d.customerName}</td>
                          <td>{d.currentStatus}</td>
                          <td>{d.mineralType}</td>
                          <td>{d.tonnage}</td>
                          <td>{d.containerCount}</td>
                          <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              )
            )}
          </div>
        </div>
      </div>
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
      <hr className="my-5" />
      <h4 className="fw-bold mb-3">Scheduled Reports</h4>
      {loadingScheduled ? <div>Loading scheduled reports...</div> : (
        isMobile ? (
          schedPaged.length === 0 ? (
            <div className="text-center text-muted py-4">No scheduled reports.</div>
          ) : (
            <>
              <div>
                {schedPaged.map(r => (
                  <div key={r.id} className="delivery-card mb-3">
                    <div className="delivery-card-header">
                      <span className="delivery-card-key">{Array.isArray(r.recipients) ? r.recipients.join(', ') : r.recipients}</span>
                      <span className="delivery-card-status">{r.status}</span>
                    </div>
                    <div className="mb-1 text-muted small">{r.schedule_type} &bull; {r.day_of_week} &bull; {r.time}</div>
                    <div className="mb-1"><strong>Type:</strong> {r.report_type}</div>
                    <div className="mb-1"><strong>Last Run:</strong> {r.last_run ? new Date(r.last_run).toLocaleString() : '-'}</div>
                    <div className="mb-1"><strong>Next Run:</strong> {r.next_run ? new Date(r.next_run).toLocaleString() : '-'}</div>
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => setEditReport(r)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger flex-fill" onClick={() => setDeleteReport(r)}>Delete</button>
                      <button className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => handlePauseResume(r)}>{r.status === 'active' ? 'Pause' : 'Resume'}</button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Mobile Pagination for scheduled reports */}
              {schedTotalPages > 1 && (
                <nav className="mt-2 position-sticky bottom-0 bg-white py-2" style={{ zIndex: 10 }}>
                  <ul className="pagination justify-content-center mb-0" style={{ fontSize: '1.2em' }}>
                    <li className={`page-item${schedPage === 1 ? ' disabled' : ''}`}><button className="page-link" style={{ minWidth: 44, minHeight: 44 }} onClick={() => setSchedPage(schedPage - 1)}>&laquo;</button></li>
                    {Array.from({ length: schedTotalPages }, (_, i) => (
                      <li key={i + 1} className={`page-item${schedPage === i + 1 ? ' active' : ''}`}><button className="page-link" style={{ minWidth: 44, minHeight: 44 }} onClick={() => setSchedPage(i + 1)}>{i + 1}</button></li>
                    ))}
                    <li className={`page-item${schedPage === schedTotalPages ? ' disabled' : ''}`}><button className="page-link" style={{ minWidth: 44, minHeight: 44 }} onClick={() => setSchedPage(schedPage + 1)}>&raquo;</button></li>
                  </ul>
                </nav>
              )}
            </>
          )
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Recipients</th>
                  <th>Schedule</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th>Next Run</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduledReports.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted">No scheduled reports.</td></tr>
                ) : scheduledReports.map(r => (
                  <tr key={r.id}>
                    <td>{Array.isArray(r.recipients) ? r.recipients.join(', ') : r.recipients}</td>
                    <td>{r.schedule_type}</td>
                    <td>{r.day_of_week}</td>
                    <td>{r.time}</td>
                    <td>{r.report_type}</td>
                    <td>{r.status}</td>
                    <td>{r.last_run ? new Date(r.last_run).toLocaleString() : '-'}</td>
                    <td>{r.next_run ? new Date(r.next_run).toLocaleString() : '-'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setEditReport(r)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger me-1" onClick={() => setDeleteReport(r)}>Delete</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handlePauseResume(r)}>{r.status === 'active' ? 'Pause' : 'Resume'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
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
      {/* Mobile-specific styles */}
      <style>{`
        @media (max-width: 600px) {
          .modal-fullscreen { max-width: 100vw !important; margin: 0; }
        }
      `}</style>
      {/* DeliveryCard component for mobile list view */}
      {isMobile && (
        <style>{`
          .delivery-card { border: 1px solid #eee; border-radius: 8px; margin-bottom: 1rem; background: #fff; box-shadow: 0 1px 2px rgba(31,33,32,0.03); padding: 1rem; }
          .delivery-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
          .delivery-card-key { font-weight: bold; color: #1F2120; }
          .delivery-card-status { font-size: 0.97em; padding: 0.3em 0.7em; border-radius: 1em; background: #f3ede7; color: #333; }
          .delivery-card-details { font-size: 0.97em; margin-top: 0.7em; border-top: 1px solid #f3ede7; padding-top: 0.7em; }
        `}</style>
      )}
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