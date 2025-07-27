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
    <div className="min-vh-100" style={{ 
      background: 'linear-gradient(135deg, #003366 0%, #0066CC 100%)',
      color: 'white'
    }}>
      <div className="w-100" style={{ 
        padding: window.innerWidth <= 768 ? '40px 20px' : '80px 120px'
      }}>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <header className="help-center-header d-flex flex-column align-items-center mb-5 gap-3 text-center">
              <FaRegLightbulb size={48} style={{ color: '#FF6600' }} />
              <h2 className="fw-bold mb-0" style={{ color: 'white', fontSize: '2.5rem' }}>Dar Logistics Help Center</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem' }}>
                Get the support you need to make the most of our logistics platform
              </p>
            </header>

      {/* Quick Links as Gravity Cards (only for logged-in users) */}
      {user && (
        <section className="mb-5">
          <div className="p-4 rounded" style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px'
          }}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <FaRegArrowAltCircleRight style={{ color: '#FF6600', fontSize: '1.5rem' }} />
              <h3 className="mb-0" style={{ color: 'white', fontSize: '1.5rem' }}>Quick Links</h3>
            </div>
            <div className="row g-4">
              {quickLinks.map(link => (
                <div className="col-12 col-sm-6 col-md-4" key={link.to}>
                  <Link to={link.to} className="d-flex align-items-center gap-3 p-4 text-decoration-none h-100 rounded"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{link.icon}</span>
                    <div>
                      <div className="fw-bold">{link.label}</div>
                      {link.desc && <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>{link.desc}</div>}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Getting Started Card */}
      <section className="mb-5">
        <div className="p-5 text-center rounded" style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          maxWidth: 800,
          margin: '0 auto'
        }}>
          <div className="d-flex flex-column align-items-center gap-3 mb-4">
            <FaRegCheckCircle style={{ color: '#FF6600', fontSize: '1.5rem' }} />
            <h3 className="mb-0" style={{ color: 'white', fontSize: '1.5rem' }}>Getting Started: Step-by-Step</h3>
          </div>
          <ol className="ps-4 mb-0 text-start" style={{ maxWidth: 700, margin: '0 auto', color: 'rgba(255, 255, 255, 0.9)' }}>
            <li className="mb-2"><b>Sign In:</b> Log in with your operator or customer credentials. <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>(Contact admin if you need access.)</span></li>
            <li className="mb-2"><b>For Operators:</b> Go to <b>Operator Dashboard</b> → <b>New Delivery</b> to dispatch a load. Fill all required fields, double-check consignment and driver details, and submit.</li>
            <li className="mb-2"><b>For Customers:</b> Use your <b>tracking code</b> to follow your delivery in real time via the <b>Track Delivery</b> page.</li>
            <li className="mb-2"><b>Update Checkpoints:</b> Operators should log each checkpoint promptly for full visibility. <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>(Accurate logs = fewer support issues!)</span></li>
            <li className="mb-2"><b>Billing & Subscriptions:</b> Review your billing dashboard and manage your subscription plans as needed.</li>
          </ol>
          <div className="mt-4 d-flex align-items-center justify-content-center" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <FaRegLightbulb className="me-2" style={{ color: '#FF6600' }} />
            <span style={{ fontSize: '0.9rem' }}>Tip: Always keep your contact info up to date for SMS/email notifications.</span>
          </div>
        </div>
      </section>

      {/* FAQ as Gravity Cards */}
      <section className="mb-5">
        <div className="p-5 rounded" style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          maxWidth: 800,
          margin: '0 auto'
        }}>
          <div className="d-flex flex-column align-items-center gap-3 mb-4 text-center">
            <FaQuestionCircle style={{ color: '#FF6600', fontSize: '1.5rem' }} />
            <h3 className="mb-0" style={{ color: 'white', fontSize: '1.5rem' }}>Frequently Asked Questions</h3>
          </div>
          <div className="help-center-faq-list">
            <details className="mb-3 border-0 rounded p-3" style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px'
            }}>
              <summary className="fw-semibold pointer" style={{ color: 'white' }}><FaRegListAlt className="me-2" style={{ color: '#FF6600' }} />What is a Parent Booking?</summary>
              <p className="ms-4 mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>A Parent Booking groups multiple deliveries under a single contract or shipment, making it easier to manage large or recurring orders. Always select the correct parent booking to ensure accurate tracking and billing.</p>
            </details>
            <details className="mb-3 border-0 rounded p-3" style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px'
            }}>
              <summary className="fw-semibold pointer" style={{ color: 'white' }}><FaRegUser className="me-2" style={{ color: '#FF6600' }} />How do I receive SMS/email updates?</summary>
              <p className="ms-4 mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>You'll automatically receive notifications at every checkpoint if your phone number/email is registered with the delivery. Check your spam folder if you don't see updates.</p>
            </details>
            <details className="mb-3 border-0 rounded p-3" style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px'
            }}>
              <summary className="fw-semibold pointer" style={{ color: 'white' }}><FaRegClock className="me-2" style={{ color: '#FF6600' }} />Who can update delivery status?</summary>
              <p className="ms-4 mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Only authorized operators can update delivery checkpoints and status. Customers can track but not modify deliveries. If you need to update info, contact your operator.</p>
            </details>
            <details className="mb-3 border-0 rounded p-3" style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px'
            }}>
              <summary className="fw-semibold pointer" style={{ color: 'white' }}><FaRegEnvelope className="me-2" style={{ color: '#FF6600' }} />What if I forget my tracking code?</summary>
              <p className="ms-4 mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Contact your operator or Dar Logistics support to retrieve your tracking code. Always save your code for future reference.<br/>Support: <a href="mailto:support@darlogistics.co.zw" style={{ color: '#FF6600' }}>support@darlogistics.co.zw</a> | <a href="tel:+263781334474" style={{ color: '#FF6600' }}>+263 781 334474</a></p>
            </details>
            <details className="mb-3 border-0 rounded p-3" style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px'
            }}>
              <summary className="fw-semibold pointer" style={{ color: 'white' }}><FaRegPaperPlane className="me-2" style={{ color: '#FF6600' }} />How do I escalate an issue or get urgent help?</summary>
              <p className="ms-4 mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>If you have an urgent issue, email <a href="mailto:support@darlogistics.co.zw" style={{ color: '#FF6600' }}>support@darlogistics.co.zw</a> or use the feedback form below. For emergencies, call your assigned operator directly.<br/>Support: <a href="tel:+263781334474" style={{ color: '#FF6600' }}>+263 781 334474</a></p>
            </details>
          </div>
        </div>
      </section>

      {/* Feedback/Contact Form Card */}
      <section className="mb-5">
        <div className="p-5 rounded" style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          maxWidth: 600,
          margin: '0 auto'
        }}>
          <div className="d-flex flex-column align-items-center gap-3 mb-4 text-center">
            <FaRegEnvelope style={{ color: '#FF6600', fontSize: '1.5rem' }} />
            <h3 className="mb-0" style={{ color: 'white', fontSize: '1.5rem' }}>Still Need Help?</h3>
          </div>
          <form onSubmit={handleFeedbackSubmit} className="d-flex flex-column gap-3 align-items-center" style={{ maxWidth: 500, margin: '0 auto' }} aria-label="Help Center Feedback Form">
            <label htmlFor="feedback" className="fw-medium align-self-start" style={{ color: 'white' }}>Describe your issue or question:</label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={4}
              className="form-control"
              placeholder="Type your question or describe your issue..."
              required
              aria-required="true"
              style={{ 
                resize: 'vertical', 
                minHeight: 100,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            />
            <button
              type="submit"
              className="btn fw-bold px-5 py-3 align-self-start"
              style={{ 
                background: 'linear-gradient(135deg, #FF6600, #FF8533)',
                border: 'none',
                color: 'white',
                borderRadius: '12px'
              }}
              disabled={feedback.length === 0}
              aria-disabled={feedback.length === 0}
            >
              Send Message
            </button>
            {submitted && <span className="fw-medium mt-2" style={{ color: '#28a745' }}>Thank you! We'll get back to you soon.</span>}
          </form>
          <div className="mt-4 text-center" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
            Or email us directly at <a href="mailto:support@darlogistics.co.zw" style={{ color: '#FF6600' }}>support@darlogistics.co.zw</a> or call <a href="tel:+263781334474" style={{ color: '#FF6600' }}>+263 781 334474</a>
          </div>
        </div>
      </section>
          </div>
        </div>
      </div>
    </div>
  );
} 