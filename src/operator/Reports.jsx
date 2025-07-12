import { useState, useMemo, useRef, useEffect } from 'react';
import { useDeliveries } from '../services/useDeliveries';
import { scheduledReportApi } from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Select from 'react-select';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    // Mock API call
    const payload = {
      recipients: scheduleRecipients.split(',').map(e => e.trim()).filter(Boolean),
      schedule: scheduleType,
      dayOfWeek: scheduleDay,
      time: scheduleTime,
      reportType: scheduleReportType,
      columns: scheduleColumns,
      filters: scheduleReportType === 'filtered' ? {/* TODO: add current filters */} : undefined,
    };
    // Replace with real API call
    await fetch('/api/reports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    alert('Scheduled report created!');
  }

  async function handleDeleteReport(id) {
    await scheduledReportApi.delete(id);
    setScheduledReports(scheduledReports.filter(r => r.id !== id));
    setDeleteReport(null);
  }

  async function handlePauseResume(report) {
    await scheduledReportApi.update(report.id, { ...report, status: report.status === 'active' ? 'paused' : 'active' });
    setScheduledReports(scheduledReports.map(r => r.id === report.id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r));
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
    const input = reportRef.current;
    if (!input) return;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    // Branding: Add logo and title
    const logo = new Image();
    logo.src = '/logo.jpg'; // Adjust path as needed
    await new Promise(res => { logo.onload = res; });
    pdf.addImage(logo, 'JPEG', 40, 20, 80, 40);
    pdf.setFontSize(22);
    pdf.text('Morres Logistics Report', 140, 50);
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 140, 70);
    // Add chart/table image
    pdf.addImage(imgData, 'PNG', 40, 80, 750, 400);
    pdf.save('morres_report.pdf');
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Reports</h2>
      <div className="mb-3 d-flex flex-wrap gap-2 align-items-end">
        <input type="text" className="form-control" style={{ maxWidth: 200 }} placeholder="Search by tracking ID or customer" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ maxWidth: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ minWidth: 200 }}>
          <Select
            isMulti
            options={uniqueCustomers.map(c => ({ value: c, label: c }))}
            value={customer.map(c => ({ value: c, label: c }))}
            onChange={opts => setCustomer(opts.map(o => o.value))}
            placeholder="Select customers"
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <Select
            isMulti
            options={uniqueMinerals.map(m => ({ value: m, label: m }))}
            value={mineral.map(m => ({ value: m, label: m }))}
            onChange={opts => setMineral(opts.map(o => o.value))}
            placeholder="Select minerals"
          />
        </div>
        <input type="date" className="form-control" style={{ maxWidth: 160 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="form-control" style={{ maxWidth: 160 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className="btn btn-primary ms-auto" onClick={() => setShowCsvModal(true)}>Export CSV</button>
        <button className="btn btn-outline-secondary" onClick={() => setShowPdfModal(true)}>Export PDF</button>
        <button className="btn btn-outline-success" onClick={() => setShowScheduleModal(true)}>Schedule Email Report</button>
      </div>
      {/* CSV Export Modal */}
      {showCsvModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className="modal-dialog">
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
                <button className="btn btn-secondary" onClick={() => setShowCsvModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
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
      {/* PDF Export Modal */}
      {showPdfModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Export PDF</h5>
                <button type="button" className="btn-close" onClick={() => setShowPdfModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>This will export the current charts and table as a branded PDF report.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPdfModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleExportPDF}>Export PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Schedule Email Report Modal */}
      {showScheduleModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className="modal-dialog">
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
                <button className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button
                  className="btn btn-success"
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
        {/* Charts Section */}
        <div className="row mb-4 g-3">
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Deliveries Over Time</h6>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deliveriesOverTime} onClick={e => e && e.activeLabel && handleDrilldown('month', e.activeLabel)}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#0088FE" name="Deliveries" />
                    <Bar dataKey="tonnage" fill="#00C49F" name="Tonnage" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Tonnage by Mineral</h6>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={tonnageByMineral}
                      dataKey="tonnage"
                      nameKey="mineral"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label
                      onClick={(_, i) => handleDrilldown('mineral', tonnageByMineral[i]?.mineral)}
                    >
                      {tonnageByMineral.map((entry, i) => <Cell key={entry.mineral} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Top Customers (Tonnage)</h6>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topCustomers} layout="vertical" onClick={e => e && e.activeLabel && handleDrilldown('customer', e.activeLabel)}>
                    <XAxis type="number" dataKey="tonnage" />
                    <YAxis type="category" dataKey="customer" width={90} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tonnage" fill="#FF8042" name="Tonnage" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        {/* Table Section */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            {loading ? <div className="p-4 text-center">Loading...</div> : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
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
                        <tr key={d.trackingId} style={{ cursor: 'pointer' }} onClick={() => setDrilldown({ type: 'row', value: d.trackingId, details: [d] })}>
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
            )}
          </div>
        </div>
      </div>
      {/* Drilldown Modal */}
      {drilldown && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
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
                <button className="btn btn-secondary" onClick={() => setDrilldown(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <hr className="my-5" />
      <h4 className="fw-bold mb-3">Scheduled Reports</h4>
      {loadingScheduled ? <div>Loading scheduled reports...</div> : (
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
                  <td>{r.recipients}</td>
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
      )}
      {/* Delete confirmation modal */}
      {deleteReport && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Scheduled Report</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteReport(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this scheduled report?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDeleteReport(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDeleteReport(deleteReport.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit modal (reuse schedule modal, pre-fill with editReport) - implementation can be added as needed */}
    </div>
  );
} 