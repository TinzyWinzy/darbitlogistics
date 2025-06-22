import { Link } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthContext } from '../App';

export default function Landing() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="bg-gradient" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e88a3a 0%, #fffbe6 100%)' }}>
      {/* Hero Section */}
      <section className="container py-5 my-5 text-center position-relative">
        <span style={{ fontSize: '3.5em', zIndex: 1, position: 'relative' }} role="img" aria-label="logo">🚚</span>
        <h1 className="display-4 fw-bold mb-3 mt-3" style={{ color: '#D2691E' }}>Morres Logistics</h1>
        <p className="lead mb-4 mx-auto" style={{ maxWidth: 600 }}>
          Reliable, real-time logistics tracking and SMS notifications for Zimbabwe and beyond. Empowering businesses and customers with transparency and speed.
        </p>
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 mb-4 mt-4">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-lg text-white px-5 py-3" style={{ background: '#D2691E' }}>Go to Dashboard</Link>
              <Link to="/track" className="btn btn-lg btn-outline-primary px-5 py-3" style={{ color: '#D2691E', borderColor: '#D2691E' }}>Track Delivery</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-lg text-white px-5 py-3" style={{ background: '#D2691E' }}>Login</Link>
              <Link to="/track" className="btn btn-lg btn-outline-primary px-5 py-3" style={{ color: '#D2691E', borderColor: '#D2691E' }}>Track Delivery</Link>
            </>
          )}
        </div>
      </section>

      {/* SLA/Trust Section */}
      <section className="container py-5 my-5">
        <div className="row g-4 justify-content-center">
          {[
            { icon: 'verified_user', title: '99.9% SMS Delivery Uptime', desc: "Our SMS notifications are delivered reliably and instantly, powered by Africa's Talking." },
            { icon: 'support_agent', title: '24/7 Support', desc: 'Our team is always available to help you with your logistics needs, day or night.' },
            { icon: 'security', title: 'Secure & Compliant', desc: 'We prioritize your data security and comply with all relevant regulations for peace of mind.' }
          ].map(({ icon, title, desc }) => (
            <div className="col-12 col-md-4" key={title}>
              <div className="card h-100 shadow-sm border-0 text-center p-4 py-5" style={{ background: 'rgba(255,255,255,0.95)' }}>
                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, background: '#e88a3a' }}>
                  <span className="material-icons-outlined fs-2" style={{ color: '#D2691E' }}>{icon}</span>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#a14e13' }}>{title}</h5>
                <p className="text-muted small mb-0">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-5 my-5">
        <h2 className="h3 fw-bold text-center mb-5" style={{ color: '#a14e13' }}>How It Works</h2>
        <div className="row justify-content-center align-items-center g-4">
          {[
            { icon: 'local_shipping', label: 'Dispatch', desc: 'Operator creates and dispatches a delivery.' },
            { icon: 'track_changes', label: 'Track', desc: 'Customer and operator track delivery in real time.' },
            { icon: 'sms', label: 'Notify', desc: 'SMS updates sent at every checkpoint.' }
          ].map(({ icon, label, desc }, idx, arr) => (
            <React.Fragment key={label}>
              <div className="col-12 col-md-3 text-center mb-4 mb-md-0">
                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: 56, height: 56, background: '#e88a3a' }}>
                  <span className="material-icons-outlined fs-3" style={{ color: '#D2691E' }}>{icon}</span>
                </div>
                <div className="fw-semibold mb-2" style={{ color: '#D2691E' }}>{label}</div>
                <div className="text-muted small mb-2">{desc}</div>
              </div>
              {idx < arr.length - 1 && (
                <div className="col-12 col-md-1 d-none d-md-flex justify-content-center align-items-center">
                  <span className="material-icons-outlined fs-2" style={{ color: '#a14e13' }}>arrow_forward</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Offerings/Features Section */}
      <section className="container py-5 my-5">
        <h2 className="h3 fw-bold text-center mb-5" style={{ color: '#a14e13' }}>Our Offerings</h2>
        <div className="row g-4 justify-content-center">
          {[
            { icon: 'dashboard_customize', title: 'Operator Dashboard', desc: 'Internal dashboard for operators to manage, update, and monitor all deliveries.' },
            { icon: 'api', title: 'API Integration', desc: 'Integrate with your own systems using our secure, documented API.' },
            { icon: 'support_agent', title: '24/7 Support', desc: 'Our support team is available around the clock.' }
          ].map(({ icon, title, desc }) => (
            <div className="col-12 col-md-4" key={title}>
              <div className="card h-100 shadow-sm border-0 text-center p-4 py-5" style={{ background: 'rgba(255,255,255,0.95)' }}>
                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, background: '#e88a3a' }}>
                  <span className="material-icons-outlined fs-3" style={{ color: '#D2691E' }}>{icon}</span>
                </div>
                <h5 className="fw-semibold mb-2" style={{ color: '#D2691E' }}>{title}</h5>
                <p className="text-muted small mb-0">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="container py-5 my-5">
        <div className="card border-0 shadow-sm mx-auto text-center p-4 py-5" style={{ maxWidth: 600, background: 'rgba(255,255,255,0.95)' }}>
          <span className="material-icons-outlined fs-2 mb-3" style={{ color: '#D2691E' }}>format_quote</span>
          <p className="fst-italic lead mb-3">"Morres made our logistics transparent and stress-free. We always know where our shipments are!"</p>
          <div className="fw-semibold" style={{ color: '#a14e13' }}>— Happy Customer</div>
        </div>
      </section>
    </div>
  );
} 