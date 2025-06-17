import { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

// Spinner component
function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-4">
      <div className="spinner-border" style={{ color: '#D2691E' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function OperatorDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ location: '', operator: '', comment: '', status: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [createForm, setCreateForm] = useState({
    customerName: '',
    phoneNumber: '',
    currentStatus: '',
    driverName: '',
    vehicleReg: '',
  });
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);
  const customerNameRef = useRef();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [smsPreview, setSmsPreview] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          setIsAuthenticated(false);
          navigate('/login');
        } else {
          setIsAuthenticated(true);
        }
      });
  }, []);

  useEffect(() => {
    async function fetchDeliveries() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:3000/deliveries', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch deliveries');
        const data = await res.json();
        setDeliveries(data);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchDeliveries();
  }, []);

  const filteredDeliveries = deliveries.filter(d => {
    const q = search.toLowerCase();
    return (
      d.customerName.toLowerCase().includes(q) ||
      d.trackingId.toLowerCase().includes(q) ||
      (d.currentStatus || '').toLowerCase().includes(q)
    );
  });

  function generateTrackingId() {
    // Simple unique code: 3 letters + 4 digits
    const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
    const digits = Math.floor(1000 + Math.random() * 9000);
    return letters + digits;
  }

  function validateZimPhone(phone) {
    // Accepts +2637..., 07..., 7... (Zimbabwe mobile)
    const cleaned = phone.replace(/\D/g, '');
    return (
      cleaned.length === 9 && cleaned.startsWith('7') ||
      cleaned.length === 10 && cleaned.startsWith('07') ||
      cleaned.length === 12 && cleaned.startsWith('2637') ||
      cleaned.length === 13 && cleaned.startsWith('2637')
    );
  }

  async function handleCreateDelivery(e) {
    e.preventDefault();
    setCreating(true);
    setCreateFeedback('');
    const trackingId = generateTrackingId();
    if (!validateZimPhone(createForm.phoneNumber)) {
      setCreateFeedback('Error: Invalid Zimbabwean phone number.');
      setCreating(false);
      return;
    }
    const body = {
      trackingId,
      customerName: createForm.customerName,
      phoneNumber: createForm.phoneNumber,
      currentStatus: createForm.currentStatus,
      checkpoints: [],
      driverDetails: { name: createForm.driverName, vehicleReg: createForm.vehicleReg },
    };
    try {
      const res = await fetch('http://localhost:3000/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        setCreateFeedback('Error: ' + (errData.error || 'Failed to create delivery'));
      } else {
        setCreateFeedback('');
        setShowToast(true);
        setToastMsg('Delivery created! Tracking ID: ' + trackingId);
        setShowSmsPreview(true);
        setSmsPreview(`Welcome! Your delivery is created. Tracking ID: ${trackingId}. Status: ${createForm.currentStatus}`);
        setCreateForm({ customerName: '', phoneNumber: '', currentStatus: '', driverName: '', vehicleReg: '' });
        // Refresh deliveries
        const res2 = await fetch('http://localhost:3000/deliveries', { credentials: 'include' });
        const data = await res2.json();
        setDeliveries(data);
        setTimeout(() => {
          setShowToast(false);
        }, 3500);
        // Auto-focus first field
        setTimeout(() => {
          customerNameRef.current && customerNameRef.current.focus();
        }, 100);
      }
    } catch (err) {
      setCreateFeedback('Network error: ' + err.message);
    }
    setCreating(false);
  }

  async function handleSendInitialSMS(trackingId, phone, status) {
    setShowSmsPreview(false);
    setShowToast(true);
    setToastMsg('Sending SMS...');
    const message = `Welcome! Your delivery is created. Tracking ID: ${trackingId}. Status: ${status}`;
    try {
      const res = await fetch('http://localhost:3000/send-initial-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message }),
      });
      if (!res.ok) {
        setToastMsg('Failed to send SMS');
      } else {
        setToastMsg('Initial SMS sent!');
      }
      setTimeout(() => setShowToast(false), 2500);
    } catch {
      setToastMsg('Network error sending SMS');
      setTimeout(() => setShowToast(false), 2500);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    const delivery = deliveries.find(d => d.trackingId === selectedId);
    if (!delivery) {
      setFeedback('No delivery selected.');
      setSubmitting(false);
      return;
    }
    const checkpoint = {
      location: form.location,
      operator: form.operator,
      comment: form.comment,
    };
    try {
      const res = await fetch('http://localhost:3000/updateCheckpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trackingId: selectedId,
          checkpoint,
          currentStatus: form.status,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setFeedback('Error: ' + (errData.error || 'Failed to update checkpoint'));
      } else {
        setFeedback('Checkpoint updated successfully!');
        // Refresh deliveries
        const res2 = await fetch('http://localhost:3000/deliveries', { credentials: 'include' });
        const data = await res2.json();
        setDeliveries(data);
        setForm({ location: '', operator: '', comment: '', status: '' });
        setSelectedId('');
      }
    } catch (err) {
      setFeedback('Network error: ' + err.message);
    }
    setSubmitting(false);
  }

  async function handleLogout() {
    await fetch('http://localhost:3000/logout', { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
    navigate('/login');
  }

  return (
    <div className="container py-5">
      <h1 className="display-6 fw-bold mb-4" style={{ color: '#D2691E' }}>Operator Dashboard</h1>
      {/* Create Delivery Form */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
            <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>add_box</span>
            Create New Delivery
          </h2>
          <form onSubmit={handleCreateDelivery} className="row g-3 align-items-end" autoComplete="off">
            <div className="col-md-3">
              <label className="form-label">Customer Name</label>
              <input ref={customerNameRef} type="text" className="form-control" required value={createForm.customerName} onChange={e => setCreateForm(f => ({ ...f, customerName: e.target.value }))} disabled={creating} tabIndex={1} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-control" required value={createForm.phoneNumber} onChange={e => setCreateForm(f => ({ ...f, phoneNumber: e.target.value }))} disabled={creating} tabIndex={2} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Initial Status</label>
              <input type="text" className="form-control" required value={createForm.currentStatus} onChange={e => setCreateForm(f => ({ ...f, currentStatus: e.target.value }))} disabled={creating} tabIndex={3} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Driver Name</label>
              <input type="text" className="form-control" value={createForm.driverName} onChange={e => setCreateForm(f => ({ ...f, driverName: e.target.value }))} disabled={creating} tabIndex={4} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Vehicle Reg</label>
              <input type="text" className="form-control" value={createForm.vehicleReg} onChange={e => setCreateForm(f => ({ ...f, vehicleReg: e.target.value }))} disabled={creating} tabIndex={5} />
            </div>
            <div className="col-12 col-md-auto">
              <button type="submit" className="btn btn-primary fw-bold" style={{ background: '#D2691E', border: 'none' }} disabled={creating} tabIndex={6}>Create</button>
            </div>
          </form>
          {createFeedback && <div className={`mt-3 alert alert-danger`}>{createFeedback}</div>}
          {showToast && (
            <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999, minWidth: 250, background: '#fffbe6', border: '1px solid #D2691E' }}>
              <div className="toast-body d-flex align-items-center justify-content-between">
                <span>{toastMsg}
                  {toastMsg.includes('Tracking ID:') && (
                    <button className="btn btn-sm btn-outline-secondary ms-2" style={{ fontSize: 12 }} onClick={() => {
                      const id = toastMsg.split('Tracking ID: ')[1];
                      navigator.clipboard.writeText(id);
                    }}>Copy</button>
                  )}
                </span>
                <button type="button" className="btn-close ms-2" aria-label="Close" onClick={() => setShowToast(false)}></button>
              </div>
            </div>
          )}
          {showSmsPreview && (
            <div className="alert alert-info mt-3">
              <div className="mb-2">Preview SMS to customer:</div>
              <div className="mb-2"><code>{smsPreview}</code></div>
              <button className="btn btn-sm btn-success me-2" onClick={() => handleSendInitialSMS(toastMsg.split('Tracking ID: ')[1], createForm.phoneNumber, createForm.currentStatus)}>Send SMS</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowSmsPreview(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
                <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>list_alt</span>
                Active Deliveries
              </h2>
              <div className="input-group mb-3">
                <span className="input-group-text bg-white" style={{ color: '#D2691E' }}>
                  <span className="material-icons">search</span>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, tracking ID, or status..."
                  className="form-control"
                  disabled={loading}
                />
              </div>
              {loading ? (
                <Spinner />
              ) : error ? (
                <div className="alert alert-danger">Error: {error}</div>
              ) : filteredDeliveries.length === 0 ? (
                <div className="alert alert-warning">No deliveries found.</div>
              ) : (
                <ul className="list-group">
                  {filteredDeliveries.map((delivery) => (
                    <li
                      key={delivery.trackingId}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedId === delivery.trackingId ? 'active' : ''}`}
                      style={selectedId === delivery.trackingId ? { background: '#e88a3a', color: '#fff', borderColor: '#e88a3a' } : { cursor: 'pointer' }}
                      onClick={() => setSelectedId(delivery.trackingId)}
                      tabIndex={0}
                      onKeyPress={e => { if (e.key === 'Enter') setSelectedId(delivery.trackingId); }}
                    >
                      <div>
                        <span className="fw-bold" style={{ color: selectedId === delivery.trackingId ? '#fff' : '#D2691E' }}>{delivery.customerName}</span>
                        <span className="text-muted small ms-2">({delivery.trackingId})</span>
                        <div className="text-muted small">Phone: {delivery.phoneNumber}</div>
                      </div>
                      <span className="badge rounded-pill" style={{ background: '#D2691E', color: '#fff' }}>{delivery.currentStatus}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3" style={{ color: '#a14e13' }}>
                <span className="material-icons align-middle me-2" style={{ color: '#D2691E' }}>edit_location_alt</span>
                Update Checkpoint
              </h2>
              {selectedId && (() => {
                const sel = deliveries.find(d => d.trackingId === selectedId);
                if (!sel) return null;
                return (
                  <div className="alert alert-info mb-3 p-2">
                    <div><strong>Tracking ID:</strong> {sel.trackingId}</div>
                    <div><strong>Customer:</strong> {sel.customerName}</div>
                    <div><strong>Phone:</strong> {sel.phoneNumber}</div>
                    <div><strong>Status:</strong> {sel.currentStatus}</div>
                  </div>
                );
              })()}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <div className="mb-2 d-flex gap-2 flex-wrap">
                    {[
                      { label: 'Mine', status: 'At Mine' },
                      { label: 'Border', status: 'At Border' },
                      { label: 'Port', status: 'At Port' },
                      { label: 'Port of Destination', status: 'At Port of Destination' },
                      { label: 'Warehouse', status: 'At Warehouse' },
                    ].map(({ label, status }) => (
                      <button
                        type="button"
                        key={label}
                        className="btn btn-sm btn-outline-primary fw-bold"
                        style={{ color: '#D2691E', borderColor: '#D2691E' }}
                        onClick={() => {
                          setForm(f => ({ ...f, location: label, status }));
                        }}
                        disabled={submitting || loading}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="form-control" required disabled={submitting || loading} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Operator</label>
                  <input type="text" value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} className="form-control" required disabled={submitting || loading} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Comment</label>
                  <input type="text" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} className="form-control" disabled={submitting || loading} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <input type="text" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="form-control" disabled={submitting || loading} />
                </div>
                <button type="submit" disabled={submitting || !selectedId || loading} className="btn w-100 text-white fw-bold" style={{ background: '#D2691E' }}>{submitting ? <span><Spinner /> Updating...</span> : 'Update Checkpoint'}</button>
              </form>
              {feedback && <div className={`mt-3 alert ${feedback.includes('success') ? 'alert-success' : 'alert-danger'}`}>{feedback}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 