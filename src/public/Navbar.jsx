import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCog, FaUserShield, FaSignOutAlt } from 'react-icons/fa';

export default function Navbar({ onHamburgerClick }) {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const location = useLocation();

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
          <span style={{ fontSize: '1.7em', marginRight: 10 }} role="img" aria-label="logo">🚛</span>
          Morres Logistics
        </Link>
        {/* Hamburger for dashboard/internal routes only */}
        {!isPublic && (
          <button
            className="navbar-toggler ms-3 d-lg-none"
            type="button"
            onClick={onHamburgerClick}
            aria-expanded={!isNavCollapsed}
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
        )}
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
              <div className="dropdown ms-3">
                <button
                  className="btn btn-link dropdown-toggle text-light d-flex align-items-center"
                  type="button"
                  id="userMenuButton"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ color: '#EBD3AD', textDecoration: 'none' }}
                >
                  <FaUserCircle className="me-2" size={24} />
                  <span className="fw-semibold">{user.name || user.email || 'User'}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuButton">
                  <li><Link className="dropdown-item d-flex align-items-center" to="#"><FaUserCircle className="me-2" /> Profile</Link></li>
                  <li><Link className="dropdown-item d-flex align-items-center" to="#"><FaCog className="me-2" /> Settings</Link></li>
                  {user.role === 'admin' && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li><Link className="dropdown-item d-flex align-items-center text-danger fw-bold" to="/admin/dashboard"><FaUserShield className="me-2" /> Admin</Link></li>
                    </>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item d-flex align-items-center" onClick={handleLogout}><FaSignOutAlt className="me-2" /> Logout</button></li>
                </ul>
              </div>
            )}
          </>
        ) : (
          user && (
            <div className="dropdown">
              <button
                className="btn btn-link dropdown-toggle text-light d-flex align-items-center"
                type="button"
                id="userMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ color: '#EBD3AD', textDecoration: 'none' }}
              >
                <FaUserCircle className="me-2" size={24} />
                <span className="fw-semibold">{user.name || user.email || 'User'}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuButton">
                <li><Link className="dropdown-item d-flex align-items-center" to="#"><FaUserCircle className="me-2" /> Profile</Link></li>
                <li><Link className="dropdown-item d-flex align-items-center" to="#"><FaCog className="me-2" /> Settings</Link></li>
                {user.role === 'admin' && (
                  <>
                    <li><hr className="dropdown-divider" /></li>
                    <li><Link className="dropdown-item d-flex align-items-center text-danger fw-bold" to="/admin/dashboard"><FaUserShield className="me-2" /> Admin</Link></li>
                  </>
                )}
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item d-flex align-items-center" onClick={handleLogout}><FaSignOutAlt className="me-2" /> Logout</button></li>
              </ul>
            </div>
          )
        )}
        {/* Add the Plans link for logged-in users only */}
        {!isPublic && user && (
          <li className="nav-item">
            <NavLink to="/plans" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Plans</NavLink>
          </li>
        )}
      </div>
    </nav>
  );
} 