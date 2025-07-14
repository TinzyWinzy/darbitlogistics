import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCog, FaUserShield, FaSignOutAlt } from 'react-icons/fa';
import Dropdown from 'react-bootstrap/Dropdown';
import db from '../services/db';
import { isOnline } from '../services/api';

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
    >
      <div className="d-flex align-items-center">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/" style={{ color: '#EBD3AD', letterSpacing: '0.5px' }}>
          <img src="/favicon-m.svg" alt="Morres Logistics Logo" width={36} height={36} style={{ marginRight: 10, display: 'inline-block', verticalAlign: 'middle' }} />
          Morres Logistics
        </Link>
        {/* Hamburger always visible on mobile */}
        <button
          className="navbar-toggler ms-3 d-lg-none"
          type="button"
          onClick={onHamburgerClick}
          aria-label="Toggle navigation"
          style={{
            border: '2px solid #EBD3AD',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 8px rgba(235, 211, 173, 0.12)',
            padding: '0.6em 1em',
            background: 'transparent',
            transition: 'background 0.2s, box-shadow 0.2s',
            outline: 'none',
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
      </div>
      <div className="d-flex align-items-center">
        {isPublic ? (
          <>
            <ul className="navbar-nav flex-row gap-2 align-items-center mb-0">
              <li className="nav-item">
                <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/track" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Track</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/offerings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Offerings</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/help" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Help</NavLink>
              </li>
              {!user && (
                <li className="nav-item">
                  <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Login</NavLink>
                </li>
              )}
            </ul>
            {user && (
              <Dropdown align="end" className="ms-3">
                <Dropdown.Toggle variant="link" className="text-light d-flex align-items-center" style={{ color: '#EBD3AD', textDecoration: 'none' }} id="userMenuButton">
                  <FaUserCircle className="me-2" size={24} />
                  <span className="fw-semibold">{user.name || user.email || 'User'}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile" className="d-flex align-items-center"><FaUserCircle className="me-2" /> Profile</Dropdown.Item>
                  <Dropdown.Item as={Link} to="/settings" className="d-flex align-items-center"><FaCog className="me-2" /> Settings</Dropdown.Item>
                  {user.role === 'admin' && <>
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/admin/dashboard" className="d-flex align-items-center text-danger fw-bold"><FaUserShield className="me-2" /> Admin</Dropdown.Item>
                  </>}
                  <Dropdown.Divider />
                  <Dropdown.Item as="button" className="d-flex align-items-center" onClick={handleLogout}><FaSignOutAlt className="me-2" /> Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </>
        ) : (
          user && (
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="text-light d-flex align-items-center" style={{ color: '#EBD3AD', textDecoration: 'none' }} id="userMenuButton">
                <FaUserCircle className="me-2" size={24} />
                <span className="fw-semibold">{user.name || user.email || 'User'}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="#" className="d-flex align-items-center"><FaUserCircle className="me-2" /> Profile</Dropdown.Item>
                <Dropdown.Item as={Link} to="#" className="d-flex align-items-center"><FaCog className="me-2" /> Settings</Dropdown.Item>
                {user.role === 'admin' && <>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/admin/dashboard" className="d-flex align-items-center text-danger fw-bold"><FaUserShield className="me-2" /> Admin</Dropdown.Item>
                </>}
                <Dropdown.Divider />
                <Dropdown.Item as="button" className="d-flex align-items-center" onClick={handleLogout}><FaSignOutAlt className="me-2" /> Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )
        )}
        {/* Add the Plans link for logged-in users only */}
        {!isPublic && user && (
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
    </nav>
  );
} 