import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../App';

export default function Offerings() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="container py-5" role="main">
      {/* Internal Use Only Banner for staff */}
      {isAuthenticated && (
        <div className="bg-warning text-dark text-center py-1 small fw-bold mb-3" style={{ letterSpacing: '1px', borderRadius: '0.5rem' }}>
          INTERNAL USE ONLY
        </div>
      )}
      <section className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-3" style={{ color: '#1F2120' }}>Our Offerings</h1>
        <p className="lead text-muted mb-4 mx-auto" style={{ maxWidth: 600 }}>
          Morres Logistics delivers a seamless, transparent, and reliable logistics experience for businesses and customers alike.
        </p>
      </section>
      <section>
        <div className="row g-4 g-md-5 justify-content-center">
          {[
            { icon: 'track_changes', title: 'Real-Time Tracking', desc: 'Track your shipments and deliveries in real time, from dispatch to arrival, with instant updates.' },
            { icon: 'sms', title: 'SMS Notifications', desc: "Automatic SMS updates keep your customers informed at every checkpoint, powered by Africa's Talking." },
            { icon: 'dashboard_customize', title: 'Operator Dashboard', desc: 'Internal dashboard for operators to manage, update, and monitor all deliveries efficiently.' },
            { icon: 'api', title: 'API Integration', desc: 'Integrate with your own systems using our secure, documented API for seamless logistics automation.' },
            { icon: 'security', title: 'Secure Data', desc: 'Your data is protected with industry-standard security and compliance best practices.' },
            { icon: 'support_agent', title: '24/7 Support', desc: 'Our support team is available around the clock to assist you with any logistics needs.' }
          ].map(({ icon, title, desc }) => (
            <div className="col-12 col-md-4" key={title}>
              <div className="card h-100 shadow-sm border-0 text-center p-4 py-4" style={{ background: 'rgba(255,255,255,0.97)', minHeight: 220 }}>
                <div className="mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, background: '#EBD3AD' }}>
                  <span className="material-icons-outlined fs-3" style={{ color: '#1F2120' }}>{icon}</span>
                </div>
                <h5 className="fw-semibold mb-1" style={{ color: '#1F2120' }}>{title}</h5>
                <p className="text-muted small mb-0">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 gap-md-4 mt-5">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="btn btn-lg text-white" style={{ background: '#1F2120', color: '#EBD3AD' }} aria-label="Go to Dashboard">Go to Dashboard</Link>
            <Link to="/track" className="btn btn-lg btn-outline-primary" style={{ color: '#1F2120', borderColor: '#1F2120' }} aria-label="Track Delivery">Track Delivery</Link>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-lg text-white" style={{ background: '#1F2120', color: '#EBD3AD' }} aria-label="Login">Login</Link>
            <Link to="/track" className="btn btn-lg btn-outline-primary" style={{ color: '#1F2120', borderColor: '#1F2120' }} aria-label="Track Delivery">Track Delivery</Link>
          </>
        )}
      </div>
      <div className="text-center text-muted small mt-5">
        Some features are for internal operations only. For support: <a href="mailto:info@morres.com" style={{ color: '#1F2120' }}>info@morres.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
      </div>
    </div>
  );
} 