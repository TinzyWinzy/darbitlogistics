import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MENU_CONFIG, USER_ACTIONS } from '../menuConfig';
import * as FaIcons from 'react-icons/fa';
import Dropdown from 'react-bootstrap/Dropdown';
import db from '../services/db';
import { isOnline } from '../services/api';
import { useMediaQuery } from 'react-responsive';
import React from 'react'; // Added for React.createElement

export default function Navbar({ onHamburgerClick }) {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const location = useLocation();

  // Network status state
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let mounted = true;
    async function checkStatus() {
      const status = await isOnline();
      if (mounted) setOnline(status);
    }
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Define public routes
  const publicRoutes = [
    '/', '/track', '/track-delivery', '/login', '/register', '/offerings', '/help', '/plans', '/payment-success'
  ];
  const isPublic = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route));

  // Define dashboard/operator routes
  const dashboardRoutes = [
    '/dashboard', '/loads', '/customers', '/reports', '/billing', '/invoices', '/admin', '/admin/dashboard'
  ];
  const isDashboard = dashboardRoutes.some(route => location.pathname.startsWith(route));

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  async function handleLogout() {
    try {
      localStorage.removeItem('jwt_token');
      setUser(null);
      // Clear IndexedDB tables to prevent data leaks between operators
      await db.deliveries.clear();
      await db.parentBookings.clear();
      await db.outbox.clear();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const isMobile = useMediaQuery({ maxWidth: 991 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => setMobileMenuOpen(open => !open);
  const handleNavLinkClick = () => {
    if (isMobile) setMobileMenuOpen(false);
  };

  // Helper to get icon component by name
  const getIcon = (name) => FaIcons[name] || null;

  // Replace hardcoded menu arrays with:
  const role = user?.role || 'guest';
  const navMenu = MENU_CONFIG.filter(item => item.showIn.includes('navbar') && item.roles.includes(role));
  const userMenu = USER_ACTIONS.filter(item => item.roles.includes(role));
  // Dashboard-specific menu
  const dashboardNavMenu = MENU_CONFIG.filter(item => item.showIn.includes('sidebar') && item.roles.includes(role));
  // Public menu
  const publicNavMenu = MENU_CONFIG.filter(item => item.showIn.includes('navbar') && item.roles.includes(role));

  return (
    <nav
      className="navbar navbar-expand-lg shadow-sm d-flex justify-content-between align-items-center"
      style={{
        background: '#1F2120',
        borderRadius: '0.75rem',
        margin: '1.5rem 0 2rem 0',
        boxShadow: '0 2px 8px rgba(31, 33, 32, 0.08)',
        padding: '0.75rem 0',
      }}
      aria-label="Main navigation"
    >
      <div className="d-flex align-items-center">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/" style={{ color: '#EBD3AD', letterSpacing: '0.5px' }}>
          <img src="/favicon-m.svg" alt="Morres Logistics Logo" width={36} height={36} style={{ marginRight: 10, display: 'inline-block', verticalAlign: 'middle' }} />
          Morres Logistics
        </Link>
        {isMobile && (
          <button
            className="navbar-toggler ms-3"
            type="button"
            onClick={handleMobileMenuToggle}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            style={{
              border: '2px solid #EBD3AD',
              background: mobileMenuOpen ? '#EBD3AD' : 'transparent',
              borderRadius: '0.5rem',
              padding: '0.4em 0.7em',
              boxShadow: '0 1px 4px rgba(31,33,32,0.10)',
              transition: 'background 0.2s, border 0.2s',
            }}
          >
            <span
              className="navbar-toggler-icon"
              style={{
                filter: 'invert(1) brightness(1.5)',
                WebkitFilter: 'invert(1) brightness(1.5)',
                backgroundImage: 'none',
                width: 24,
                height: 24,
                display: 'inline-block',
                background: 'none',
                position: 'relative',
              }}
            >
              {/* Custom hamburger icon for high contrast */}
              <span style={{
                display: 'block',
                width: 22,
                height: 3,
                background: mobileMenuOpen ? '#1F2120' : '#EBD3AD',
                borderRadius: 2,
                margin: '4px 0',
                transition: 'background 0.2s',
              }} />
              <span style={{
                display: 'block',
                width: 22,
                height: 3,
                background: mobileMenuOpen ? '#1F2120' : '#EBD3AD',
                borderRadius: 2,
                margin: '4px 0',
                transition: 'background 0.2s',
              }} />
              <span style={{
                display: 'block',
                width: 22,
                height: 3,
                background: mobileMenuOpen ? '#1F2120' : '#EBD3AD',
                borderRadius: 2,
                margin: '4px 0',
                transition: 'background 0.2s',
              }} />
            </span>
          </button>
        )}
      </div>
      {/* Desktop nav: only show if not dashboard */}
      {!isMobile && (
        <div className="collapse navbar-collapse d-flex align-items-center justify-content-end">
          {isPublic ? (
            <>
              <ul className="navbar-nav flex-row gap-2 align-items-center mb-0">
                {navMenu.map((item, index) => (
                  <li key={index} className="nav-item">
                    <NavLink to={item.route} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                      {getIcon(item.icon) && React.createElement(getIcon(item.icon), { className: 'me-2' })}
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                {user && (
                  <li className="nav-item">
                    <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                      <FaIcons.FaUserCircle className="me-2" /> Profile
                    </NavLink>
                  </li>
                )}
                {user && (
                  <li className="nav-item">
                    <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                      <FaIcons.FaCog className="me-2" /> Settings
                    </NavLink>
                  </li>
                )}
                {user && user.role === 'admin' && (
                  <li className="nav-item">
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                      <FaIcons.FaUserShield className="me-2" /> Admin
                    </NavLink>
                  </li>
                )}
              </ul>
              {user && (
                <Dropdown align="end" className="ms-3">
                  <Dropdown.Toggle variant="link" className="text-light d-flex align-items-center" style={{ color: '#EBD3AD', textDecoration: 'none' }} id="userMenuButton">
                    <FaIcons.FaUserCircle className="me-2" size={24} />
                    <span className="fw-semibold">{user.name || user.email || 'User'}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {userMenu.filter(item => item.label.toLowerCase() !== 'logout').map((item, index) => (
                      <Dropdown.Item key={index} as={Link} to={item.path} className="d-flex align-items-center">
                        {getIcon(item.icon) && React.createElement(getIcon(item.icon), { className: 'me-2' })}
                        {item.label}
                      </Dropdown.Item>
                    ))}
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" className="d-flex align-items-center" onClick={handleLogout}><FaIcons.FaSignOutAlt className="me-2" /> Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </>
          ) : (
            user && (
              <Dropdown align="end">
                <Dropdown.Toggle variant="link" className="text-light d-flex align-items-center" style={{ color: '#EBD3AD', textDecoration: 'none' }} id="userMenuButton">
                  <FaIcons.FaUserCircle className="me-2" size={24} />
                  <span className="fw-semibold">{user.name || user.email || 'User'}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {userMenu.map((item, index) => (
                    <Dropdown.Item key={index} as={Link} to={item.path} className="d-flex align-items-center">
                      {getIcon(item.icon) && React.createElement(getIcon(item.icon), { className: 'me-2' })}
                      {item.label}
                    </Dropdown.Item>
                  ))}
                  <Dropdown.Divider />
                  <Dropdown.Item as="button" className="d-flex align-items-center" onClick={handleLogout}><FaIcons.FaSignOutAlt className="me-2" /> Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )
          )}
          {/* Add the Plans link for logged-in users only */}
          {!isPublic && user && !isDashboard && (
            <li className="nav-item">
              <NavLink to="/plans" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Plans</NavLink>
            </li>
          )}
          {/* Network status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 18 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: online ? '#27c93f' : '#e74c3c',
                marginRight: 0,
                border: '1.5px solid #fff',
                boxShadow: online ? '0 0 4px #27c93f88' : '0 0 4px #e74c3c88',
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
              aria-label={online ? 'App Online' : 'App Offline'}
              title={online ? 'App Online' : 'App Offline'}
            />
          </div>
        </div>
      )}
      {/* Mobile nav menu: always show on mobile, overlays content */}
      {isMobile && mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="position-fixed top-0 start-0 w-100 bg-dark text-light p-3 shadow-lg rounded-bottom"
          style={{ zIndex: 2000, minHeight: '100vh' }}
          role="menu"
        >
          <ul className="navbar-nav flex-column gap-2 align-items-stretch mb-2" style={{ fontSize: '1.15rem' }}>
            {(isDashboard ? dashboardNavMenu : publicNavMenu).map((item, index) => (
              <li key={index} className="nav-item">
                <NavLink to={item.route} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={handleNavLinkClick}>
                  {getIcon(item.icon) && React.createElement(getIcon(item.icon), { className: 'me-2' })}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {/* User dropdown for mobile: only show if not dashboard */}
          {user && (
            <Dropdown align="end" className="w-100 mb-2">
              <Dropdown.Toggle variant="link" className="text-light d-flex align-items-center w-100 justify-content-start" style={{ color: '#EBD3AD', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5em 0' }} id="userMenuButtonMobile">
                <FaIcons.FaUserCircle className="me-2" size={28} />
                <span className="fw-semibold">{user.name || user.email || 'User'}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                {userMenu.map((item, index) => (
                  <Dropdown.Item key={index} as={Link} to={item.path} className="d-flex align-items-center" onClick={handleNavLinkClick}>
                    {getIcon(item.icon) && React.createElement(getIcon(item.icon), { className: 'me-2' })}
                    {item.label}
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item as="button" className="d-flex align-items-center" onClick={() => { handleLogout(); handleNavLinkClick(); }}><FaIcons.FaSignOutAlt className="me-2" /> Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
          {/* Network status indicator for mobile */}
          <div className="d-flex align-items-center mt-2" style={{ gap: 10 }}>
            <span
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: online ? '#27c93f' : '#e74c3c',
                border: '2px solid #fff',
                boxShadow: online ? '0 0 6px #27c93f88' : '0 0 6px #e74c3c88',
                transition: 'background 0.2s',
                marginRight: 6,
              }}
              aria-label={online ? 'App Online' : 'App Offline'}
              title={online ? 'App Online' : 'App Offline'}
            />
            <span style={{ fontWeight: 500 }}>{online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      )}
    </nav>
  );
} 