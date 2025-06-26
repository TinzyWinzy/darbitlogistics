import { Link } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthContext } from '../App';

export default function Landing() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="bg-gradient" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EBD3AD 0%, #fffbe6 100%)' }} role="main">
      {/* Internal Use Only Banner for staff */}
      {isAuthenticated && (
        <div className="bg-warning text-dark text-center py-1 small fw-bold mb-3" style={{ letterSpacing: '1px', borderRadius: '0.5rem' }}>
          INTERNAL USE ONLY
        </div>
      )}
      {/* Hero Section */}
      <section className="container py-5 my-5 text-center position-relative">
        <span style={{ fontSize: '3.5em', zIndex: 1, position: 'relative' }} role="img" aria-label="Morres Logistics logo">🚚</span>
        <h1 className="display-4 fw-bold mb-3 mt-3" style={{ color: '#1F2120' }}>Morres Logistics</h1>
        <p className="lead mb-4 mx-auto" style={{ maxWidth: 600 }}>
          Reliable, real-time logistics tracking and SMS notifications for Zimbabwe and beyond. Empowering businesses and customers with transparency and speed.
        </p>
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 gap-md-4 mb-4 mt-4">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-lg text-white px-5 py-3" style={{ background: '#1F2120', color: '#EBD3AD' }} aria-label="Go to Dashboard">Go to Dashboard</Link>
              <Link to="/track" className="btn btn-lg btn-outline-primary px-5 py-3" style={{ color: '#1F2120', borderColor: '#1F2120' }} aria-label="Track Delivery">Track Delivery</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-lg text-white px-5 py-3" style={{ background: '#1F2120', color: '#EBD3AD' }} aria-label="Login">Login</Link>
              <Link to="/track" className="btn btn-lg btn-outline-primary px-5 py-3" style={{ color: '#1F2120', borderColor: '#1F2120' }} aria-label="Track Delivery">Track Delivery</Link>
            </>
          )}
        </div>
      </section>

      {/* SLA/Trust Section */}
      <section className="container py-5 my-5">
        <div className="row g-4 g-md-5 justify-content-center">
          {[
            { icon: 'verified_user', title: '99.9% SMS Delivery Uptime', desc: "Our SMS notifications are delivered reliably and instantly, powered by Africa's Talking." },
            { icon: 'support_agent', title: '24/7 Support', desc: 'Our team is always available to help you with your logistics needs, day or night.' },
            { icon: 'security', title: 'Secure & Compliant', desc: 'We prioritize your data security and comply with all relevant regulations for peace of mind.' }
          ].map(({ icon, title, desc }) => (
            <div className="col-12 col-md-4" key={title}>
              <div className="card h-100 shadow-sm border-0 text-center p-4 py-5" style={{ background: 'rgba(255,255,255,0.95)', minHeight: 280 }}>
                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, background: '#EBD3AD' }}>
                  <span className="material-icons-outlined fs-2" style={{ color: '#1F2120' }}>{icon}</span>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#1F2120' }}>{title}</h5>
                <p className="text-muted small mb-0">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-5 my-5">
        <h2 className="h3 fw-bold text-center mb-5" style={{ color: '#1F2120' }}>How It Works</h2>
        <div className="row justify-content-center align-items-center g-4 g-md-5">
          {[
            { icon: 'local_shipping', label: 'Dispatch', desc: 'Operator creates and dispatches a delivery.' },
            { icon: 'track_changes', label: 'Track', desc: 'Customer and operator track delivery in real time.' },
            { icon: 'sms', label: 'Notify', desc: 'SMS updates sent at every checkpoint.' }
          ].map(({ icon, label, desc }, idx, arr) => (
            <React.Fragment key={label}>
              <div className="col-12 col-md-3 text-center mb-4 mb-md-0">
                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: 56, height: 56, background: '#EBD3AD' }}>
                  <span className="material-icons-outlined fs-3" style={{ color: '#1F2120' }}>{icon}</span>
                </div>
                <div className="fw-semibold mb-2" style={{ color: '#1F2120' }}>{label}</div>
                <div className="text-muted small mb-2">{desc}</div>
              </div>
              {idx < arr.length - 1 && (
                <div className="col-12 col-md-1 d-none d-md-flex justify-content-center align-items-center">
                  <span className="material-icons-outlined fs-2" style={{ color: '#1F2120' }}>arrow_forward</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Offerings/Features Section */}
      <section className="container py-5 my-5">
        <h2 className="h3 fw-bold text-center mb-5" style={{ color: '#1F2120' }}>Our Offerings</h2>
        <div className="row g-4 g-md-5 justify-content-center">
          {[
            { icon: 'dashboard_customize', title: 'Operator Dashboard', desc: 'Internal dashboard for operators to manage, update, and monitor all deliveries.' },
            { icon: 'api', title: 'API Integration', desc: 'Integrate with your own systems using our secure, documented API.' },
            { icon: 'support_agent', title: '24/7 Support', desc: 'Our support team is available around the clock.' }
          ].map(({ icon, title, desc }) => (
            <div className="col-12 col-md-4" key={title}>
              <div className="card h-100 shadow-sm border-0 text-center p-4 py-5" style={{ background: 'rgba(255,255,255,0.95)', minHeight: 260 }}>
                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, background: '#EBD3AD' }}>
                  <span className="material-icons-outlined fs-3" style={{ color: '#1F2120' }}>{icon}</span>
                </div>
                <h5 className="fw-semibold mb-2" style={{ color: '#1F2120' }}>{title}</h5>
                <p className="text-muted small mb-0">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="container py-5 my-5">
        <div className="card border-0 shadow-sm mx-auto text-center p-4 py-5" style={{ maxWidth: 600, background: 'rgba(255,255,255,0.95)' }}>
          <span className="material-icons-outlined fs-2 mb-3" style={{ color: '#1F2120' }}>format_quote</span>
          <p className="fst-italic lead mb-3">"Morres made our logistics transparent and stress-free. We always know where our shipments are!"</p>
          <div className="fw-semibold" style={{ color: '#1F2120' }}>— Happy Customer</div>
        </div>
      </section>

      {/* Footer Support Contact & Disclaimer */}
      <div className="container text-center text-muted small mt-5 mb-3">
        This portal is for Morres Logistics staff and clients. For support: <a href="mailto:info@morres.com" style={{ color: '#1F2120' }}>info@morres.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
      </div>
    </div>
  );
} 