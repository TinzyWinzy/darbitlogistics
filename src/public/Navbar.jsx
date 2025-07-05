import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

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
      className="navbar navbar-expand-lg shadow-sm"
      style={{
        background: '#1F2120',
        borderRadius: '0.75rem',
        margin: '1.5rem 0 2rem 0',
        boxShadow: '0 2px 8px rgba(31, 33, 32, 0.08)',
        padding: '0.75rem 0',
      }}
    >
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold d-flex flex-column align-items-start" to="/" style={{ color: '#EBD3AD', letterSpacing: '0.5px' }}>
          <span className="d-flex align-items-center">
            <span style={{ fontSize: '1.7em', marginRight: 10 }} role="img" aria-label="logo">🚛</span>
            Morres Logistics
          </span>
          <span className="small fw-normal mt-1" style={{ color: '#16a34a', letterSpacing: '0.5px', fontSize: '0.95em' }}>
            Powered by Dar Logistics Technology
          </span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={handleNavCollapse}
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="mainNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-3 gap-2">
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  'nav-link px-3 py-2 rounded' +
                  (isActive
                    ? ' fw-bold text-light'
                    : ' text-light opacity-85')
                }
                style={{ color: '#EBD3AD' }}
              >
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/offerings"
                className={({ isActive }) =>
                  'nav-link px-3 py-2 rounded' +
                  (isActive
                    ? ' fw-bold text-light'
                    : ' text-light opacity-85')
                }
                style={{ color: '#EBD3AD' }}
              >
                Offerings
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/track"
                className={({ isActive }) =>
                  'nav-link px-3 py-2 rounded' +
                  (isActive
                    ? ' fw-bold text-light'
                    : ' text-light opacity-85')
                }
                style={{ color: '#EBD3AD' }}
              >
                Track Delivery
              </NavLink>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link px-3 py-2 rounded text-light" to="/operator/dashboard" style={{ color: '#EBD3AD' }}>
                    Dashboard
                  </Link>
                </li>
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link px-3 py-2 rounded text-light" to="/admin/dashboard" style={{ color: '#EBD3AD' }}>
                      Admin
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className="nav-link px-3 py-2 rounded text-light" to="/billing" style={{ color: '#EBD3AD' }}>
                    Billing
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link px-3 py-2 rounded text-light" to="/help" title="Help / How it works">
                    <span style={{ fontSize: '1.2em', fontWeight: 600 }}>?</span> Help
                  </Link>
                </li>
                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                  <button
                    className="btn fw-bold px-4 py-2"
                    style={{
                      background: '#EBD3AD',
                      color: '#1F2120',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 4px rgba(31,33,32,0.06)',
                      letterSpacing: '0.5px',
                    }}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
} 