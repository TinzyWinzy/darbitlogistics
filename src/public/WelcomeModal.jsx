import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show if not dismissed before
    if (!localStorage.getItem('morres_welcome_dismissed')) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('morres_welcome_dismissed', '1');
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.35)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, maxWidth: 420, width: '90%', padding: '2rem 1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', position: 'relative'
      }}>
        <button onClick={handleClose} aria-label="Close welcome modal" style={{
          position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888'
        }}>&times;</button>
        <h2 style={{ marginBottom: 12 }}>Welcome to Morres Logistics!</h2>
        <p style={{ marginBottom: 16 }}>Your partner in efficient, reliable, and sustainable logistics. Here's how to get started:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li><b>Create a Delivery:</b> Use the Operator Dashboard to dispatch new shipments.</li>
          <li><b>Track Progress:</b> Enter your tracking code to see real-time updates.</li>
          <li><b>Receive SMS Alerts:</b> Get notified at every checkpoint.</li>
        </ul>
        <div style={{ marginBottom: 16 }}>
          <Link to="/help" onClick={handleClose} style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 500 }}>Learn more in the Help Center</Link>
        </div>
        <button onClick={handleClose} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.5rem', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
          Get Started
        </button>
      </div>
    </div>
  );
} 