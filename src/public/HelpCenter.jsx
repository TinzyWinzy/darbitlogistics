import React, { useState } from 'react';
import { FaQuestionCircle, FaRegLightbulb, FaRegEnvelope, FaRegCheckCircle, FaRegUser, FaRegClock, FaRegPaperPlane, FaRegListAlt, FaRegArrowAltCircleRight } from 'react-icons/fa';

export default function HelpCenter() {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFeedback('');
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="container" style={{ maxWidth: 700, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(31,33,32,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <FaRegLightbulb size={28} color="#1F2120" />
        <h2 style={{ margin: 0, color: '#1F2120', fontWeight: 700, letterSpacing: 0.5 }}>Morres Logistics Help Center</h2>
      </div>
      <hr style={{ border: 'none', borderTop: '2px solid #EBD3AD', margin: '1rem 0 2rem 0' }} />
      {/* Quick Links */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <FaRegArrowAltCircleRight color="#1976d2" />
          <h3 style={{ margin: 0, fontSize: '1.2em', color: '#1976d2' }}>Quick Links</h3>
        </div>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 16, listStyle: 'none', padding: 0, margin: 0 }}>
          <li><a href="/" style={{ color: '#1F2120', textDecoration: 'underline' }}>Home</a></li>
          <li><a href="/operator/dashboard" style={{ color: '#1F2120', textDecoration: 'underline' }}>Operator Dashboard</a></li>
          <li><a href="/customer/track" style={{ color: '#1F2120', textDecoration: 'underline' }}>Track Delivery</a></li>
          <li><a href="/BillingDashboard" style={{ color: '#1F2120', textDecoration: 'underline' }}>Billing</a></li>
          <li><a href="/SubscriptionPlans" style={{ color: '#1F2120', textDecoration: 'underline' }}>Subscription Plans</a></li>
        </ul>
      </section>
      {/* Getting Started */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <FaRegCheckCircle color="#1976d2" />
          <h3 style={{ margin: 0, fontSize: '1.2em', color: '#1976d2' }}>Getting Started: Step-by-Step</h3>
        </div>
        <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
          <li><b>Sign In:</b> Log in with your operator or customer credentials. <span style={{ color: '#888', fontSize: '0.95em' }}>(Contact admin if you need access.)</span></li>
          <li><b>For Operators:</b> Go to <b>Operator Dashboard</b> &rarr; <b>New Delivery</b> to dispatch a load. Fill all required fields, double-check consignment and driver details, and submit.</li>
          <li><b>For Customers:</b> Use your <b>tracking code</b> to follow your delivery in real time via the <b>Track Delivery</b> page.</li>
          <li><b>Update Checkpoints:</b> Operators should log each checkpoint promptly for full visibility. <span style={{ color: '#888', fontSize: '0.95em' }}>(Accurate logs = fewer support issues!)</span></li>
          <li><b>Billing & Subscriptions:</b> Review your billing dashboard and manage your subscription plans as needed.</li>
        </ol>
        <div style={{ marginTop: 10, color: '#444', fontSize: '0.97em' }}>
          <FaRegLightbulb style={{ marginRight: 4, color: '#EBD3AD' }} />
          <span>Tip: Always keep your contact info up to date for SMS/email notifications.</span>
        </div>
      </section>
      {/* FAQ */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <FaQuestionCircle color="#1976d2" />
          <h3 style={{ margin: 0, fontSize: '1.2em', color: '#1976d2' }}>Frequently Asked Questions</h3>
        </div>
        <details style={{ marginBottom: '1rem', border: '1px solid #EBD3AD', borderRadius: 6, padding: '0.5rem 1rem', background: '#fcf8f3' }}>
          <summary style={{ fontWeight: 600, color: '#1F2120', cursor: 'pointer', outline: 'none' }}><FaRegListAlt style={{ marginRight: 6, color: '#1976d2' }} />What is a Parent Booking?</summary>
          <p style={{ marginLeft: 24 }}>A Parent Booking groups multiple deliveries under a single contract or shipment, making it easier to manage large or recurring orders. Always select the correct parent booking to ensure accurate tracking and billing.</p>
        </details>
        <details style={{ marginBottom: '1rem', border: '1px solid #EBD3AD', borderRadius: 6, padding: '0.5rem 1rem', background: '#fcf8f3' }}>
          <summary style={{ fontWeight: 600, color: '#1F2120', cursor: 'pointer', outline: 'none' }}><FaRegUser style={{ marginRight: 6, color: '#1976d2' }} />How do I receive SMS/email updates?</summary>
          <p style={{ marginLeft: 24 }}>You'll automatically receive notifications at every checkpoint if your phone number/email is registered with the delivery. Check your spam folder if you don't see updates.</p>
        </details>
        <details style={{ marginBottom: '1rem', border: '1px solid #EBD3AD', borderRadius: 6, padding: '0.5rem 1rem', background: '#fcf8f3' }}>
          <summary style={{ fontWeight: 600, color: '#1F2120', cursor: 'pointer', outline: 'none' }}><FaRegClock style={{ marginRight: 6, color: '#1976d2' }} />Who can update delivery status?</summary>
          <p style={{ marginLeft: 24 }}>Only authorized operators can update delivery checkpoints and status. Customers can track but not modify deliveries. If you need to update info, contact your operator.</p>
        </details>
        <details style={{ marginBottom: '1rem', border: '1px solid #EBD3AD', borderRadius: 6, padding: '0.5rem 1rem', background: '#fcf8f3' }}>
          <summary style={{ fontWeight: 600, color: '#1F2120', cursor: 'pointer', outline: 'none' }}><FaRegEnvelope style={{ marginRight: 6, color: '#1976d2' }} />What if I forget my tracking code?</summary>
          <p style={{ marginLeft: 24 }}>Contact your operator or Morres Logistics support to retrieve your tracking code. Always save your code for future reference.</p>
        </details>
        <details style={{ marginBottom: '1rem', border: '1px solid #EBD3AD', borderRadius: 6, padding: '0.5rem 1rem', background: '#fcf8f3' }}>
          <summary style={{ fontWeight: 600, color: '#1F2120', cursor: 'pointer', outline: 'none' }}><FaRegPaperPlane style={{ marginRight: 6, color: '#1976d2' }} />How do I escalate an issue or get urgent help?</summary>
          <p style={{ marginLeft: 24 }}>If you have an urgent issue, email <a href="mailto:marketing@morreslogistics.com">marketing@morreslogistics.com</a> or use the feedback form below. For emergencies, call your assigned operator directly.</p>
        </details>
      </section>
      {/* Feedback/Contact Form */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <FaRegEnvelope color="#1976d2" />
          <h3 style={{ margin: 0, fontSize: '1.2em', color: '#1976d2' }}>Still Need Help?</h3>
        </div>
        <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
          <label htmlFor="feedback" style={{ fontWeight: 500 }}>Describe your issue or question:</label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            style={{ border: '1px solid #EBD3AD', borderRadius: 6, padding: 8, resize: 'vertical', fontSize: '1em' }}
            placeholder="Type your question or describe your issue..."
            required
          />
          <button
            type="submit"
            style={{
              background: '#1F2120',
              color: '#EBD3AD',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              padding: '0.5rem 1.25rem',
              alignSelf: 'flex-start',
              marginTop: 4,
              cursor: feedback.length === 0 ? 'not-allowed' : 'pointer',
              opacity: feedback.length === 0 ? 0.7 : 1
            }}
            disabled={feedback.length === 0}
          >
            Send Message
          </button>
          {submitted && <span style={{ color: '#1976d2', fontWeight: 500, marginTop: 4 }}>Thank you! We'll get back to you soon.</span>}
        </form>
        <div style={{ marginTop: 16, color: '#444', fontSize: '0.97em' }}>
          Or email us directly at <a href="mailto:marketing@morreslogistics.com">marketing@morreslogistics.com</a>
        </div>
      </section>
    </div>
  );
} 