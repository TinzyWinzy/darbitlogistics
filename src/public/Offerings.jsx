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
        <p className="lead text-muted mb-4 mx-auto" style={{ maxWidth: 700 }}>
          Morres Logistics delivers seamless, transparent, and sustainable logistics solutions—powered by Dar Logistics Technology.
        </p>
      </section>
      <section>
        <div className="row g-4 g-md-5 justify-content-center">
          {[
            { icon: 'track_changes', title: 'Real-Time Tracking', desc: 'Track your shipments and deliveries in real time, from dispatch to arrival, with instant updates.' },
            { icon: 'sms', title: 'SMS Notifications', desc: 'Automatic SMS updates at every checkpoint, keeping you and your customers informed.' },
            { icon: 'dashboard_customize', title: 'Operator Dashboard', desc: 'Manage, update, and monitor all deliveries efficiently from a single platform.' },
            { icon: 'warehouse', title: 'Warehousing', desc: 'Secure, smart storage and inventory control for your goods.' },
            { icon: 'eco', title: 'Sustainability', desc: 'Eco-conscious operations and community impact at the core of our business.' },
            { icon: 'api', title: 'API Integration', desc: 'Integrate with your own systems using our secure, documented API.' },
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
        For support: <a href="mailto:marketing@morreslogistics.com" style={{ color: '#1F2120' }}>marketing@morreslogistics.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
        <div className="mt-2">
          <span className="badge bg-success text-white fs-6" style={{ background: '#16a34a', borderRadius: '0.5em', padding: '0.5em 1em' }}>
            Powered by Dar Logistics Technology
          </span>
        </div>
      </div>
    </div>
  );
} 