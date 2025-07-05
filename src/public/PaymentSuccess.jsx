import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../services/AuthContext';
import { deliveryApi } from '../services/api';

export default function PaymentSuccess() {
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState('pending'); // 'pending', 'active', 'timeout', 'error'
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let interval;
    let timeout;
    const poll = async () => {
      try {
        const subs = await deliveryApi.getMyAllSubscriptions?.();
        const active = subs && subs.find(sub => sub.status === 'active' && new Date(sub.end_date) > new Date());
        if (active) {
          setStatus('active');
          clearInterval(interval);
          clearTimeout(timeout);
        }
      } catch (err) {
        setError('Failed to check subscription status.');
      }
    };
    interval = setInterval(() => {
      setTimer(t => t + 3);
      poll();
    }, 3000);
    timeout = setTimeout(() => {
      setStatus('timeout');
      clearInterval(interval);
    }, 60000);
    poll();
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [user]);

  if (!user) return <div className="container py-5">Please log in to continue.</div>;

  return (
    <div className="container py-5 text-center">
      {status === 'pending' && (
        <>
          <h2 className="fw-bold mb-3">Thank you! Your payment is being processed…</h2>
          <div className="spinner-border text-success mb-3" role="status" />
          <p className="text-muted">This may take a few moments. Please do not close this page.</p>
        </>
      )}
      {status === 'active' && (
        <>
          <h2 className="fw-bold mb-3 text-success">Payment successful!</h2>
          <p>Your subscription is now active. You can return to your dashboard.</p>
          <button className="btn btn-primary fw-bold" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </>
      )}
      {status === 'timeout' && (
        <>
          <h2 className="fw-bold mb-3 text-danger">Payment not confirmed</h2>
          <p>We could not confirm your payment after 1 minute. Please contact support or try again.</p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Retry</button>
        </>
      )}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
} 