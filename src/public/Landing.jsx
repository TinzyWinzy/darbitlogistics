import { Link } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthContext } from '../App';

export default function Landing() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="bg-gradient" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EBD3AD 0%, #fffbe6 100%)' }} role="main">
      {/* Strategic Operations Console Banner for staff */}
      {isAuthenticated && (
        <div className="bg-warning text-dark text-center py-1 small fw-bold mb-3" style={{ letterSpacing: '1px', borderRadius: '0.5rem' }}>
          STRATEGIC OPERATIONS CONSOLE
        </div>
      )}
      {/* Hero Section */}
      <section className="container py-5 my-5 text-center position-relative">
        <span style={{ fontSize: '3.5em', zIndex: 1, position: 'relative' }} role="img" aria-label="Morres Logistics logo">🚛</span>
        <h1 className="display-4 fw-bold mb-3 mt-3" style={{ color: '#1F2120' }}>Morres Logistics</h1>
        <p className="lead mb-4 mx-auto" style={{ maxWidth: 700 }}>
          Your Partner in Efficient, Reliable, and Sustainable Logistics
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
        <div className="mt-3">
          <span className="badge bg-success text-white fs-6" style={{ background: '#16a34a', borderRadius: '0.5em', padding: '0.5em 1em' }}>
            Powered by Dar Logistics Technology
          </span>
        </div>
      </section>

      {/* About Us */}
      <section className="container py-5 my-5">
        <h2 className="h3 fw-bold text-center mb-4" style={{ color: '#1F2120' }}>About Us</h2>
        <p className="lead text-center mx-auto mb-4" style={{ maxWidth: 800 }}>
          At <b>Morres Logistics</b>, we're more than just a transport provider — we are your strategic partner in ensuring <b>seamless cargo movement</b>, <b>optimized warehousing</b>, and <b>technology-driven logistics solutions</b>.
        </p>
        <div className="row g-4 justify-content-center">
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="mb-2" style={{ fontSize: '2em' }}>🎯</div>
              <h5 className="fw-bold mb-2">Our Mission</h5>
              <ul className="text-start small mb-0" style={{ lineHeight: 1.7 }}>
                <li><b>Customer-Centric Logistics</b>: Tailored solutions that put your operational needs first.</li>
                <li><b>Innovation-Driven</b>: Real-time tracking, automated updates, and smart scheduling.</li>
                <li><b>Sustainability-Focused</b>: Eco-conscious operations and community impact.</li>
              </ul>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="mb-2" style={{ fontSize: '2em' }}>👁️</div>
              <h5 className="fw-bold mb-2">Our Vision</h5>
              <ul className="text-start small mb-0" style={{ lineHeight: 1.7 }}>
                <li><b>Leadership through Innovation</b>: AI, blockchain, and advanced route optimization.</li>
                <li><b>Sustainable Operations</b>: Cleaner fleet tech and smarter warehousing.</li>
                <li><b>Global Growth, Local Impact</b>: Scaling internationally, investing locally.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container py-5 my-5">
        <h2 className="h3 fw-bold text-center mb-5" style={{ color: '#1F2120' }}>Our Services</h2>
        <div className="row g-4 g-md-5 justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="mb-2" style={{ fontSize: '2em' }}>🚚</div>
              <h5 className="fw-bold mb-2">Transportation</h5>
              <ul className="text-start small mb-0" style={{ lineHeight: 1.7 }}>
                <li>Safe, reliable delivery solutions</li>
                <li>Versatile fleet & experienced drivers</li>
                <li><b>Real-time tracking</b> with SMS notifications</li>
                <li>Flexible scheduling and route planning</li>
              </ul>
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="mb-2" style={{ fontSize: '2em' }}>🏢</div>
              <h5 className="fw-bold mb-2">Warehousing</h5>
              <ul className="text-start small mb-0" style={{ lineHeight: 1.7 }}>
                <li>Secure short-term and long-term storage</li>
                <li>Smart inventory control and monitoring</li>
                <li>Integrated distribution from warehouse to destination</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio/Highlights */}
      <section className="container py-5 my-5">
        <h2 className="h3 fw-bold text-center mb-5" style={{ color: '#1F2120' }}>Portfolio Highlights</h2>
        <p className="lead text-center mx-auto mb-4" style={{ maxWidth: 800 }}>
          We've helped clients streamline their operations by integrating logistics solutions that are:
        </p>
        <div className="row g-4 justify-content-center">
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="mb-2" style={{ fontSize: '2em' }}>💡</div>
              <ul className="text-start small mb-0" style={{ lineHeight: 1.7 }}>
                <li>Cost-effective</li>
                <li>Digitally enhanced</li>
                <li>Scalable across sectors</li>
              </ul>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0 text-center p-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="mb-2" style={{ fontSize: '2em' }}>🖥️</div>
              <ul className="text-start small mb-0" style={{ lineHeight: 1.7 }}>
                <li>Hands-on service with real-time tools</li>
                <li>Always in control of your cargo</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dar Logistics Tech Banner */}
      <section className="container py-4 my-4 text-center">
        <div className="alert alert-success fw-bold mb-0" style={{ fontSize: '1.15em', background: '#e6f4ea', color: '#166534', border: 'none' }}>
          Morres Logistics now runs on <b>Dar Logistics' advanced checkpoint tracking system</b>, giving our clients:
          <ul className="list-unstyled mt-2 mb-0 small">
            <li>• Transparent shipment journeys</li>
            <li>• SMS updates at every checkpoint</li>
            <li>• Secure, digital delivery records</li>
          </ul>
          <div className="mt-2">🧭 From <b>mine to port</b>, we make each delivery visible, accountable, and trackable — in real time.</div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container py-5 my-5">
        <h2 className="h3 fw-bold text-center mb-4" style={{ color: '#1F2120' }}>Contact Us</h2>
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="mb-2"><b>Address:</b> 6 Victor D'arcy, Borrowdale, Harare</div>
            <div className="mb-2"><b>Email:</b> <a href="mailto:marketing@morreslogistics.com" style={{ color: '#1F2120' }}>marketing@morreslogistics.com</a></div>
            <div className="mb-2"><b>Website:</b> <a href="http://www.morreslogistics.com" style={{ color: '#1F2120' }}>www.morreslogistics.com</a></div>
            <div className="mb-2"><b>Phone:</b> <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a></div>
          </div>
        </div>
      </section>

      <div className="container text-center text-muted small mt-5 mb-3">
        This portal is for Morres Logistics staff and clients. For support: <a href="mailto:marketing@morreslogistics.com" style={{ color: '#1F2120' }}>marketing@morreslogistics.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
      </div>
    </div>
  );
} 