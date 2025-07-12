import React, { useState } from 'react';

export default function AddonPurchase() {
  const [mode, setMode] = useState('deliveries'); // 'deliveries' or 'sms'
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    const endpoint = mode === 'deliveries' ? '/api/addons/purchase-deliveries' : '/api/addons/purchase-sms';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(quantity) }),
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
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <h2 className="fw-bold mb-4 text-center">Buy Add-Ons</h2>
      <div className="d-flex justify-content-center mb-3">
        <button className={`btn me-2 ${mode === 'deliveries' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('deliveries')} disabled={loading}>Buy Deliveries</button>
        <button className={`btn ${mode === 'sms' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('sms')} disabled={loading}>Buy SMS</button>
      </div>
      <form onSubmit={handleSubmit} className="card shadow p-4 border-0">
        <div className="mb-3">
          <label className="form-label">{mode === 'deliveries' ? 'Number of Deliveries' : 'Number of SMS'}</label>
          <input type="number" className="form-control" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} required disabled={loading} />
          <div className="form-text">
            {mode === 'deliveries' ? '$0.25 per delivery' : '$2 per 100 SMS'}
          </div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">Redirecting to payment...</div>}
        <button type="submit" className="btn btn-success w-100 fw-bold" disabled={loading}>
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );
} 