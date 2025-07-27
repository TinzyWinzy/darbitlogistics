import { Link, useNavigate } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { FaBullseye, FaEye, FaTruck, FaWarehouse, FaLightbulb, FaDesktop, FaShieldAlt, FaGlobe, FaChartLine, FaUsers, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

export default function Landing() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-container" role="main">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-sphere sphere-1"></div>
        <div className="floating-sphere sphere-2"></div>
        <div className="floating-sphere sphere-3"></div>
        <div className="floating-sphere sphere-4"></div>
        <div className="floating-sphere sphere-5"></div>
        <div className="floating-sphere sphere-6"></div>
      </div>



      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <FaShieldAlt className="badge-icon" />
              <span>Trusted by 500+ Companies</span>
            </div>
            <h1 className="hero-title">
              <span className="gradient-text">Revolutionary</span> Logistics
              <br />
              <span className="highlight-text">Technology Platform</span>
            </h1>
            <p className="hero-description">
              Dar Logistics delivers cutting-edge supply chain solutions with real-time tracking, 
              AI-powered optimization, and seamless integration across Africa's fastest-growing markets.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Deliveries Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Active Clients</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.8%</div>
                <div className="stat-label">On-Time Delivery</div>
              </div>
            </div>
            <div className="hero-actions">
              <Link to="/track" className="btn btn-primary btn-lg">
                <FaMapMarkerAlt className="btn-icon" />
                Track Your Delivery
              </Link>
              <Link to="/send-one-delivery" className="btn btn-outline btn-lg">
                <FaTruck className="btn-icon" />
                Send One Delivery
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-container">
              <div className="floating-card card-1">
                <FaTruck className="card-icon" />
                <span>Real-time Tracking</span>
              </div>
              <div className="floating-card card-2">
                <FaGlobe className="card-icon" />
                <span>Global Network</span>
              </div>
              <div className="floating-card card-3">
                <FaChartLine className="card-icon" />
                <span>Analytics Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Dar Logistics?</h2>
            <p className="section-subtitle">
              We combine cutting-edge technology with decades of logistics expertise to deliver 
              unparalleled service across Africa's most challenging terrains.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaTruck />
              </div>
              <h3>Advanced Fleet Management</h3>
              <p>GPS-enabled vehicles with real-time monitoring, predictive maintenance, and optimized routing algorithms.</p>
              <ul className="feature-list">
                <li>Live vehicle tracking</li>
                <li>Route optimization</li>
                <li>Fuel efficiency monitoring</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaWarehouse />
              </div>
              <h3>Smart Warehousing Solutions</h3>
              <p>Intelligent inventory management with automated picking, packing, and distribution systems.</p>
              <ul className="feature-list">
                <li>Automated inventory control</li>
                <li>Climate-controlled storage</li>
                <li>24/7 security monitoring</li>
              </ul>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaDesktop />
              </div>
              <h3>Digital Operations Hub</h3>
              <p>Comprehensive dashboard providing real-time insights, analytics, and operational control.</p>
              <ul className="feature-list">
                <li>Real-time analytics</li>
                <li>Custom reporting</li>
                <li>API integration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Comprehensive Services</h2>
            <p className="section-subtitle">
              From single deliveries to enterprise logistics solutions, we provide end-to-end 
              supply chain management across Africa.
            </p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-header">
                <FaTruck className="service-icon" />
                <h3>Express Delivery</h3>
              </div>
              <p>Same-day and next-day delivery services with real-time tracking and SMS notifications.</p>
              <div className="service-features">
                <span className="feature-tag">Real-time tracking</span>
                <span className="feature-tag">SMS updates</span>
                <span className="feature-tag">Insurance included</span>
              </div>
              <Link to="/send-one-delivery" className="service-link">Learn More →</Link>
            </div>
            <div className="service-card">
              <div className="service-header">
                <FaWarehouse className="service-icon" />
                <h3>Warehousing & Storage</h3>
              </div>
              <p>Secure, climate-controlled storage facilities with advanced inventory management systems.</p>
              <div className="service-features">
                <span className="feature-tag">Climate control</span>
                <span className="feature-tag">24/7 security</span>
                <span className="feature-tag">Inventory tracking</span>
              </div>
              <Link to="/contact" className="service-link">Learn More →</Link>
            </div>
            <div className="service-card">
              <div className="service-header">
                <FaGlobe className="service-icon" />
                <h3>International Logistics</h3>
              </div>
              <p>Cross-border shipping with customs clearance, documentation, and multi-modal transport.</p>
              <div className="service-features">
                <span className="feature-tag">Customs clearance</span>
                <span className="feature-tag">Documentation</span>
                <span className="feature-tag">Multi-modal</span>
              </div>
              <Link to="/contact" className="service-link">Learn More →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology-section">
        <div className="container">
          <div className="tech-content">
            <div className="tech-text">
              <h2 className="section-title">Powered by Advanced Technology</h2>
              <p className="tech-description">
                Our proprietary Dar Logistics Technology Platform combines AI, blockchain, and IoT 
                to deliver unprecedented visibility and control over your supply chain.
              </p>
              <div className="tech-features">
                <div className="tech-feature">
                  <FaShieldAlt className="tech-icon" />
                  <div>
                    <h4>Blockchain Security</h4>
                    <p>Immutable delivery records and smart contracts for complete transparency.</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <FaChartLine className="tech-icon" />
                  <div>
                    <h4>AI-Powered Analytics</h4>
                    <p>Predictive insights and optimization algorithms for maximum efficiency.</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <FaUsers className="tech-icon" />
                  <div>
                    <h4>Real-time Collaboration</h4>
                    <p>Seamless communication between shippers, carriers, and recipients.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="tech-visual">
              <div className="tech-sphere">
                <div className="sphere-ring ring-1"></div>
                <div className="sphere-ring ring-2"></div>
                <div className="sphere-ring ring-3"></div>
                <div className="sphere-core">
                  <FaTruck />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Logistics?</h2>
            <p className="cta-description">
              Join hundreds of companies already benefiting from Dar Logistics' advanced technology platform.
            </p>
            <div className="cta-actions">
              <Link to="/track" className="btn btn-primary btn-lg">
                <FaMapMarkerAlt className="btn-icon" />
                Track Your Delivery
              </Link>
              <Link to="/send-one-delivery" className="btn btn-outline btn-lg">
                <FaTruck className="btn-icon" />
                Send One Delivery
              </Link>
              {!isAuthenticated && (
                <Link to="/login" className="btn btn-secondary btn-lg">
                  <FaUsers className="btn-icon" />
                  Access Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-brand">
                <img src="/logo.svg" alt="Dar Logistics" className="footer-logo" />
                <h3>Dar Logistics</h3>
                <p>Revolutionary logistics technology platform</p>
              </div>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <div className="contact-info">
                <p><FaMapMarkerAlt /> 6 Victor D'arcy, Borrowdale, Harare</p>
                <p><FaClock /> support@darlogistics.co.zw</p>
                <p><FaUsers /> +263 781 334474</p>
              </div>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/track">Track Delivery</Link></li>
                <li><Link to="/send-one-delivery">Send One Delivery</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/about">About Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Dar Logistics. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        /* CSS Custom Properties for Landing Page */
        :root {
          --primary-blue: #003366;
          --primary-orange: #FF6600;
          --accent-orange: #FF8533;
          --accent-blue: #0066CC;
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-size-2xl: 1.5rem;
          --font-size-3xl: 1.875rem;
          --font-size-4xl: 2.25rem;
          --space-1: 0.25rem;
          --space-2: 0.5rem;
          --space-3: 0.75rem;
          --space-4: 1rem;
          --space-5: 1.25rem;
          --space-6: 1.5rem;
          --space-8: 2rem;
          --space-10: 2.5rem;
          --radius-sm: 0.375rem;
          --radius-md: 0.5rem;
          --radius-lg: 0.75rem;
          --radius-xl: 1rem;
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --transition-slow: 0.3s ease;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        .landing-container {
          min-height: 100vh;
          height: 100vh;
          width: 100vw;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          position: relative;
        }

        /* Animated Background */
        .background-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 1;
        }

        .floating-sphere {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: float 8s ease-in-out infinite;
        }

        .sphere-1 {
          width: 300px;
          height: 300px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }

        .sphere-2 {
          width: 200px;
          height: 200px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .sphere-3 {
          width: 150px;
          height: 150px;
          bottom: 20%;
          left: 15%;
          animation-delay: 4s;
        }

        .sphere-4 {
          width: 100px;
          height: 100px;
          top: 30%;
          right: 30%;
          animation-delay: 6s;
        }

        .sphere-5 {
          width: 120px;
          height: 120px;
          bottom: 40%;
          right: 5%;
          animation-delay: 8s;
        }

        .sphere-6 {
          width: 80px;
          height: 80px;
          top: 70%;
          left: 40%;
          animation-delay: 10s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }



        /* Hero Section */
        .hero-section {
          padding: 80px 0 80px;
          position: relative;
          z-index: 2;
          min-height: 100vh;
          height: 100vh;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .hero-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 120px;
          align-items: center;
          height: 100%;
        }

        .hero-content {
          text-align: left;
          max-width: 600px;
          padding-left: 80px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 8px 16px;
          margin-bottom: 24px;
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .badge-icon {
          color: var(--primary-orange);
        }

        .hero-title {
          font-size: var(--font-size-4xl);
          font-weight: 800;
          color: white;
          margin-bottom: var(--space-6);
          line-height: 1.2;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .highlight-text {
          color: var(--primary-orange);
        }

        .hero-description {
          font-size: var(--font-size-lg);
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: var(--space-10);
          line-height: 1.6;
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: var(--space-10);
          margin-bottom: var(--space-10);
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: var(--font-size-3xl);
          font-weight: 700;
          color: var(--primary-orange);
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .hero-actions {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4) var(--space-8);
          border-radius: var(--radius-xl);
          text-decoration: none;
          font-weight: 600;
          transition: var(--transition-slow);
          border: none;
          cursor: pointer;
        }

        .btn-lg {
          padding: var(--space-5) var(--space-8);
          font-size: var(--font-size-base);
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: white;
          color: white;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-icon {
          width: 18px;
          height: 18px;
        }

        /* Hero Visual */
        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          width: 100%;
          height: 100%;
          padding-right: 80px;
        }

        .visual-container {
          position: relative;
          width: 600px;
          height: 600px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .floating-card {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-weight: 500;
          animation: float-card 6s ease-in-out infinite;
        }

        .card-1 {
          top: 15%;
          left: 5%;
          animation-delay: 0s;
        }

        .card-2 {
          top: 45%;
          right: 15%;
          animation-delay: 2s;
        }

        .card-3 {
          bottom: 25%;
          left: 25%;
          animation-delay: 4s;
        }

        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .card-icon {
          color: var(--primary-orange);
          font-size: var(--font-size-xl);
        }

        /* Sections */
        .features-section,
        .services-section,
        .technology-section,
        .cta-section {
          padding: 80px 0;
          position: relative;
          z-index: 2;
        }

        .section-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 80px;
        }
        
        .container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 80px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.8);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Features Grid */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 40px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 32px;
          color: white;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          font-size: 3rem;
          color: var(--primary-orange);
          margin-bottom: var(--space-6);
        }

        .feature-card h3 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .feature-card p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .feature-list {
          list-style: none;
          padding: 0;
        }

        .feature-list li {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }

        .feature-list li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #ff6600;
          font-weight: bold;
        }

        /* Services Grid */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 40px;
        }

        .service-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 32px;
          color: white;
          transition: all 0.3s ease;
        }

        .service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .service-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .service-icon {
          font-size: var(--font-size-3xl);
          color: var(--primary-orange);
        }

        .service-card h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .service-card p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .service-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .feature-tag {
          background: rgba(255, 102, 0, 0.2);
          color: var(--primary-orange);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-xl);
          font-size: var(--font-size-xs);
          font-weight: 500;
        }

        .service-link {
          color: var(--primary-orange);
          text-decoration: none;
          font-weight: 600;
          transition: var(--transition-slow);
        }

        .service-link:hover {
          color: var(--accent-orange);
        }

        /* Technology Section */
        .tech-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .tech-description {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .tech-features {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tech-feature {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .tech-icon {
          font-size: var(--font-size-2xl);
          color: var(--primary-orange);
          margin-top: var(--space-1);
        }

        .tech-feature h4 {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin-bottom: 8px;
        }

        .tech-feature p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        .tech-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .tech-sphere {
          position: relative;
          width: 300px;
          height: 300px;
        }

        .sphere-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border: 2px solid rgba(255, 102, 0, 0.3);
          border-radius: 50%;
          animation: rotate 20s linear infinite;
        }

        .ring-1 {
          width: 200px;
          height: 200px;
          animation-delay: 0s;
        }

        .ring-2 {
          width: 250px;
          height: 250px;
          animation-delay: -5s;
        }

        .ring-3 {
          width: 300px;
          height: 300px;
          animation-delay: -10s;
        }

        @keyframes rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .sphere-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: var(--font-size-3xl);
        }

        /* CTA Section */
        .cta-section {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cta-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }

        .cta-description {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .cta-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Footer */
        .footer {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 60px 0 20px;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
          margin-bottom: 40px;
        }

        .footer-brand h3 {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .footer-brand p {
          color: rgba(255, 255, 255, 0.7);
        }

        .footer-logo {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .footer-section h4 {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .contact-info p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
        }

        .footer-links li {
          margin-bottom: 8px;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: #ff6600;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 60px;
            text-align: center;
            padding: 0 60px;
          }
          
          .hero-content {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
            padding-left: 0;
          }
          
          .hero-visual {
            padding-right: 0;
          }
          
          .visual-container {
            width: 500px;
            height: 500px;
          }
        }

        @media (max-width: 768px) {
          .hero-container,
          .section-container {
            padding: 0 20px;
          }
          
          .hero-container {
            gap: 30px;
          }
          
          .hero-content {
            max-width: 100%;
          }
          
          .hero-title {
            font-size: 32px;
          }
          
          .hero-description {
            font-size: 16px;
          }
          
          .hero-stats {
            flex-direction: column;
            gap: 16px;
          }
          
          .hero-actions {
            flex-direction: column;
            gap: 16px;
          }
          
          .visual-container {
            width: 300px;
            height: 300px;
          }

          .tech-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .hero-actions,
          .cta-actions {
            flex-direction: column;
            align-items: center;
          }

          .btn {
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .hero-container,
          .section-container {
            padding: 0 15px;
          }
          
          .hero-title {
            font-size: 28px;
          }
          
          .section-title {
            font-size: 28px;
          }

          .features-grid,
          .services-grid {
            grid-template-columns: 1fr;
          }
          
          .visual-container {
            width: 250px;
            height: 250px;
          }
        }

        /* Large Desktop Optimizations */
        @media (min-width: 1400px) {
          .hero-container {
            padding: 0;
            gap: 160px;
          }
          
          .section-container,
          .container {
            padding: 0 120px;
          }
          
          .hero-content {
            max-width: 700px;
            padding-left: 120px;
          }
          
          .hero-visual {
            padding-right: 120px;
          }
          
          .visual-container {
            width: 700px;
            height: 700px;
          }
          
          .features-grid {
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 50px;
          }
          
          .services-grid {
            grid-template-columns: repeat(auto-fit, minmax(550px, 1fr));
            gap: 50px;
          }
        }
      `}</style>
    </div>
  );
} 