import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
  FaQuestionCircle, FaRegLightbulb, FaRegEnvelope, FaRegCheckCircle, FaRegUser,
  FaRegClock, FaRegPaperPlane, FaRegListAlt, FaRegArrowAltCircleRight, FaTachometerAlt, FaBoxOpen, FaCreditCard
} from 'react-icons/fa';

export default function HelpCenter() {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { user } = useContext(AuthContext);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFeedback('');
    setTimeout(() => setSubmitted(false), 2500);
  };

  // Define quick links for logged-in users only
  const quickLinks = [
    { to: '/dashboard', icon: <FaTachometerAlt className="text-primary" />, label: 'Operator Dashboard', desc: 'Manage and dispatch deliveries.' },
    { to: '/track', icon: <FaBoxOpen className="text-success" />, label: 'Track Delivery', desc: 'Track your shipment in real time.' },
    { to: '/billing', icon: <FaCreditCard className="text-warning" />, label: 'Billing', desc: 'View and manage your billing.' },
    { to: '/plans', icon: <FaRegListAlt className="text-info" />, label: 'Subscription Plans', desc: 'Manage your subscription.' },
  ];

  return (
    <div className="help-center-container container py-4">
      <header className="help-center-header d-flex align-items-center mb-3 gap-3">
        <FaRegLightbulb size={32} className="text-primary" />
        <h2 className="mb-0 fw-bold">Morres Logistics Help Center</h2>
      </header>
      <hr className="help-center-divider my-3" />

      {/* Quick Links as Gravity Cards (only for logged-in users) */}
      {user && (
        <section className="mb-4">
          <div className="gravity-card mb-3 p-3" style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '1.2rem', boxShadow: '0 4px 24px rgba(31,33,32,0.08)' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <FaRegArrowAltCircleRight className="text-primary fs-3" />
              <h3 className="mb-0 fs-5 text-primary">Quick Links</h3>
            </div>
            <div className="row g-3">
              {quickLinks.map(link => (
                <div className="col-12 col-sm-6 col-md-4" key={link.to}>
                  <Link to={link.to} className="gravity-card d-flex align-items-center gap-3 p-3 text-decoration-none h-100"
                    style={{
                      background: 'rgba(255,255,255,0.97)',
                      borderRadius: '1rem',
                      boxShadow: '0 2px 8px rgba(31,33,32,0.08)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      color: '#1F2120',
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'none'}
                  >
                    <span className="fs-2">{link.icon}</span>
                    <div>
                      <div className="fw-bold">{link.label}</div>
                      {link.desc && <div className="small text-muted">{link.desc}</div>}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Getting Started Card */}
      <section className="mb-4">
        <div className="gravity-card p-4" style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '1.2rem', boxShadow: '0 4px 24px rgba(31,33,32,0.08)' }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <FaRegCheckCircle className="text-primary fs-3" />
            <h3 className="mb-0 fs-5 text-primary">Getting Started: Step-by-Step</h3>
          </div>
          <ol className="ps-3 mb-0">
            <li><b>Sign In:</b> Log in with your operator or customer credentials. <span className="text-muted small">(Contact admin if you need access.)</span></li>
            <li><b>For Operators:</b> Go to <b>Operator Dashboard</b> → <b>New Delivery</b> to dispatch a load. Fill all required fields, double-check consignment and driver details, and submit.</li>
            <li><b>For Customers:</b> Use your <b>tracking code</b> to follow your delivery in real time via the <b>Track Delivery</b> page.</li>
            <li><b>Update Checkpoints:</b> Operators should log each checkpoint promptly for full visibility. <span className="text-muted small">(Accurate logs = fewer support issues!)</span></li>
            <li><b>Billing & Subscriptions:</b> Review your billing dashboard and manage your subscription plans as needed.</li>
          </ol>
          <div className="mt-2 text-secondary small d-flex align-items-center">
            <FaRegLightbulb className="me-1 text-warning" />
            <span>Tip: Always keep your contact info up to date for SMS/email notifications.</span>
          </div>
        </div>
      </section>

      {/* FAQ as Gravity Cards */}
      <section className="mb-4">
        <div className="gravity-card p-4" style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '1.2rem', boxShadow: '0 4px 24px rgba(31,33,32,0.08)' }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <FaQuestionCircle className="text-primary fs-3" />
            <h3 className="mb-0 fs-5 text-primary">Frequently Asked Questions</h3>
          </div>
          <div className="help-center-faq-list">
            <details className="mb-2 border-0 rounded p-2 bg-light-subtle gravity-card" style={{ boxShadow: '0 2px 8px rgba(31,33,32,0.08)' }}>
              <summary className="fw-semibold text-dark pointer"><FaRegListAlt className="me-2 text-primary" />What is a Parent Booking?</summary>
              <p className="ms-4">A Parent Booking groups multiple deliveries under a single contract or shipment, making it easier to manage large or recurring orders. Always select the correct parent booking to ensure accurate tracking and billing.</p>
            </details>
            <details className="mb-2 border-0 rounded p-2 bg-light-subtle gravity-card" style={{ boxShadow: '0 2px 8px rgba(31,33,32,0.08)' }}>
              <summary className="fw-semibold text-dark pointer"><FaRegUser className="me-2 text-primary" />How do I receive SMS/email updates?</summary>
              <p className="ms-4">You'll automatically receive notifications at every checkpoint if your phone number/email is registered with the delivery. Check your spam folder if you don't see updates.</p>
            </details>
            <details className="mb-2 border-0 rounded p-2 bg-light-subtle gravity-card" style={{ boxShadow: '0 2px 8px rgba(31,33,32,0.08)' }}>
              <summary className="fw-semibold text-dark pointer"><FaRegClock className="me-2 text-primary" />Who can update delivery status?</summary>
              <p className="ms-4">Only authorized operators can update delivery checkpoints and status. Customers can track but not modify deliveries. If you need to update info, contact your operator.</p>
            </details>
            <details className="mb-2 border-0 rounded p-2 bg-light-subtle gravity-card" style={{ boxShadow: '0 2px 8px rgba(31,33,32,0.08)' }}>
              <summary className="fw-semibold text-dark pointer"><FaRegEnvelope className="me-2 text-primary" />What if I forget my tracking code?</summary>
              <p className="ms-4">Contact your operator or Morres Logistics support to retrieve your tracking code. Always save your code for future reference.<br/>Support: <a href="mailto:jackfeng@morres.com">jackfeng@morres.com</a> | <a href="tel:+263788888886">+263 78 888 8886</a></p>
            </details>
            <details className="mb-2 border-0 rounded p-2 bg-light-subtle gravity-card" style={{ boxShadow: '0 2px 8px rgba(31,33,32,0.08)' }}>
              <summary className="fw-semibold text-dark pointer"><FaRegPaperPlane className="me-2 text-primary" />How do I escalate an issue or get urgent help?</summary>
              <p className="ms-4">If you have an urgent issue, email <a href="mailto:jackfeng@morres.com">jackfeng@morres.com</a> or use the feedback form below. For emergencies, call your assigned operator directly.<br/>Support: <a href="tel:+263788888886">+263 78 888 8886</a></p>
            </details>
          </div>
        </div>
      </section>

      {/* Feedback/Contact Form Card */}
      <section className="mb-4">
        <div className="gravity-card p-4" style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '1.2rem', boxShadow: '0 4px 24px rgba(31,33,32,0.08)' }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <FaRegEnvelope className="text-primary fs-3" />
            <h3 className="mb-0 fs-5 text-primary">Still Need Help?</h3>
          </div>
          <form onSubmit={handleFeedbackSubmit} className="d-flex flex-column gap-2" style={{ maxWidth: 420 }} aria-label="Help Center Feedback Form">
            <label htmlFor="feedback" className="fw-medium">Describe your issue or question:</label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
              className="form-control"
              placeholder="Type your question or describe your issue..."
              required
              aria-required="true"
            />
            <button
              type="submit"
              className="btn btn-dark fw-bold px-4 mt-1 align-self-start"
              style={{ background: '#1F2120', color: '#EBD3AD' }}
              disabled={feedback.length === 0}
              aria-disabled={feedback.length === 0}
            >
              Send Message
            </button>
            {submitted && <span className="text-primary fw-medium mt-1">Thank you! We'll get back to you soon.</span>}
          </form>
          <div className="mt-3 text-secondary small">
            Or email us directly at <a href="mailto:jackfeng@morres.com">jackfeng@morres.com</a> or call <a href="tel:+263788888886">+263 78 888 8886</a>
          </div>
        </div>
      </section>
    </div>
  );
} 