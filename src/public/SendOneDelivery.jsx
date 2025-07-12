import React, { useState } from 'react';

export default function SendOneDelivery() {
  const [form, setForm] = useState({
    customer_name: '',
    phone_number: '',
    loading_point: '',
    destination: '',
    tonnage: '',
    container_count: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/public/send-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.paynowUrl) {
        setSuccess(true);
        window.location.href = data.paynowUrl;
      } else {
        setError(data.error || 'Failed to initiate payment.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <h2 className="fw-bold mb-4 text-center">Send One Delivery</h2>
      <form onSubmit={handleSubmit} className="card shadow p-4 border-0">
        <div className="mb-3">
          <label className="form-label">Your Name</label>
          <input type="text" className="form-control" name="customer_name" value={form.customer_name} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input type="tel" className="form-control" name="phone_number" value={form.phone_number} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Loading Point</label>
          <input type="text" className="form-control" name="loading_point" value={form.loading_point} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Destination</label>
          <input type="text" className="form-control" name="destination" value={form.destination} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Tonnage</label>
          <input type="number" className="form-control" name="tonnage" value={form.tonnage} onChange={handleChange} min="0.1" step="0.1" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Container Count</label>
          <input type="number" className="form-control" name="container_count" value={form.container_count} onChange={handleChange} min="1" required />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">Redirecting to payment...</div>}
        <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={loading}>
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );
} 