import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Offerings() {
  const { isAuthenticated } = useContext(AuthContext);

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
            {/* Strategic Operations Console Banner for staff */}
            {isAuthenticated && (
              <div className="text-center py-2 mb-4 rounded" style={{ 
                background: 'rgba(255, 193, 7, 0.2)', 
                border: '1px solid rgba(255, 193, 7, 0.3)',
                color: '#FF6600',
                letterSpacing: '1px',
                fontWeight: 'bold'
              }}>
                STRATEGIC OPERATIONS CONSOLE
              </div>
            )}
            <section className="text-center mb-5">
              <h1 className="display-4 fw-bold mb-4" style={{ color: 'white' }}>Our Offerings</h1>
              <p className="lead mb-5 mx-auto" style={{ maxWidth: 800, color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.2rem' }}>
                Dar Logistics delivers seamless, transparent, and sustainable logistics solutions—empowered by next-generation logistics intelligence.
              </p>
            </section>
      <section className="mb-5">
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
              <div className="h-100 text-center p-4 rounded" style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                minHeight: 250,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: 64, 
                  height: 64, 
                  background: 'rgba(255, 102, 0, 0.2)',
                  border: '2px solid #FF6600'
                }}>
                  <span className="material-icons-outlined fs-2" style={{ color: '#FF6600' }}>{icon}</span>
                </div>
                <h5 className="fw-semibold mb-3" style={{ color: 'white', fontSize: '1.3rem' }}>{title}</h5>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem', lineHeight: '1.6' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="text-center mb-5">
        <Link
          to={isAuthenticated ? "/plans" : "/login"}
          className="btn fw-bold px-5 py-3"
          style={{ 
            background: 'linear-gradient(135deg, #FF6600, #FF8533)',
            border: 'none',
            color: 'white',
            borderRadius: '12px',
            fontSize: '1.1rem'
          }}
        >
          See our Subscription Plans
        </Link>
      </div>
      
      <div className="d-flex flex-column flex-sm-row justify-content-center gap-4 mt-5 mb-5">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="btn btn-lg px-5 py-3" style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }} aria-label="Go to Dashboard">Go to Dashboard</Link>
            <Link to="/track" className="btn btn-lg px-5 py-3" style={{ 
              background: 'linear-gradient(135deg, #FF6600, #FF8533)',
              border: 'none',
              color: 'white',
              borderRadius: '12px'
            }} aria-label="Track Delivery">Track Delivery</Link>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-lg px-5 py-3" style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }} aria-label="Login">Login</Link>
            <Link to="/track" className="btn btn-lg px-5 py-3" style={{ 
              background: 'linear-gradient(135deg, #FF6600, #FF8533)',
              border: 'none',
              color: 'white',
              borderRadius: '12px'
            }} aria-label="Track Delivery">Track Delivery</Link>
          </>
        )}
      </div>
      
      <div className="text-center" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
        For support: <a href="mailto:support@darlogistics.co.zw" style={{ color: '#FF6600' }}>support@darlogistics.co.zw</a> | <a href="tel:+263781334474" style={{ color: '#FF6600' }}>+263 781 334474</a>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
} 