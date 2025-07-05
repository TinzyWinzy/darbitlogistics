import React from 'react';

export default function HelpCenter() {
  return (
    <div className="container" style={{ maxWidth: 700, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>How to Use Morres Logistics</h2>
      <section style={{ marginBottom: '2rem' }}>
        <h3>Getting Started</h3>
        <ul>
          <li><b>Create a Delivery:</b> Go to the Operator Dashboard and click "New Delivery".</li>
          <li><b>Track a Delivery:</b> Use the tracking code to follow progress in real time.</li>
          <li><b>Update Checkpoints:</b> Operators log each checkpoint for full visibility.</li>
        </ul>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h3>Frequently Asked Questions</h3>
        <details style={{ marginBottom: '1rem' }}>
          <summary><b>What is a Parent Booking?</b></summary>
          <p style={{ marginLeft: 16 }}>A Parent Booking groups multiple deliveries under a single contract or shipment, making it easier to manage large or recurring orders.</p>
        </details>
        <details style={{ marginBottom: '1rem' }}>
          <summary><b>How do I receive SMS updates?</b></summary>
          <p style={{ marginLeft: 16 }}>You'll automatically receive SMS notifications at every checkpoint if your phone number is registered with the delivery.</p>
        </details>
        <details style={{ marginBottom: '1rem' }}>
          <summary><b>Who can update delivery status?</b></summary>
          <p style={{ marginLeft: 16 }}>Only authorized operators can update delivery checkpoints and status. Customers can track but not modify deliveries.</p>
        </details>
        <details style={{ marginBottom: '1rem' }}>
          <summary><b>What if I forget my tracking code?</b></summary>
          <p style={{ marginLeft: 16 }}>Contact your operator or Morres Logistics support to retrieve your tracking code.</p>
        </details>
      </section>
      <section>
        <h3>Need More Help?</h3>
        <p>Contact support at <a href="mailto:marketing@morreslogistics.com">marketing@morreslogistics.com</a></p>
      </section>
    </div>
  );
} 