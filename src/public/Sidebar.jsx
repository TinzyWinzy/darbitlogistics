import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { FaTachometerAlt, FaBoxOpen, FaUsers, FaChartBar, FaCreditCard, FaQuestionCircle, FaCogs, FaChevronLeft, FaChevronRight, FaFileInvoiceDollar, FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './Sidebar.css';
import { isOnline } from '../services/api';

export default function Sidebar({ isOpen, onClose }) {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const [online, setOnline] = useState(true);

  // Focus trap and ESC close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      // Trap focus
      if (e.key === 'Tab' && sidebarRef.current) {
        const focusable = sidebarRef.current.querySelectorAll('a,button');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Focus first link
    setTimeout(() => {
      if (sidebarRef.current) {
        const first = sidebarRef.current.querySelector('a,button');
        first?.focus();
      }
    }, 100);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { to: '/loads', icon: <FaBoxOpen />, label: 'Loads' },
    { to: '/customers', icon: <FaUsers />, label: 'Customers' },
    { to: '/reports', icon: <FaChartBar />, label: 'Reports' },
    { to: '/billing', icon: <FaCreditCard />, label: 'Billing' },
    { to: '/invoices', icon: <FaFileInvoiceDollar />, label: 'Invoices' }, // Added Invoices link
    { to: '/help', icon: <FaQuestionCircle />, label: 'Help' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay d-lg-none" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(31,33,32,0.35)', zIndex: 1040 }} />}
      <aside ref={sidebarRef} className={`sidebar${collapsed ? ' collapsed' : ''}${isOpen ? ' open' : ''}`} style={{ zIndex: 1050 }}>
        <div className="sidebar-header d-flex align-items-center justify-content-between px-3 py-2">
          {!collapsed && <span className="fw-bold" style={{ color: '#EBD3AD' }}>Menu</span>}
          <button className="btn btn-link p-0 ms-auto" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          {onClose && (
            <button className="btn btn-link d-lg-none ms-2" onClick={onClose}>&times;</button>
          )}
        </div>
        <ul className="nav flex-column gap-1 mt-2">
          {navItems.map(item => (
            <li key={item.to} className={`nav-item${location.pathname.startsWith(item.to) ? ' active' : ''}`}>
              <Link to={item.to} className="nav-link d-flex align-items-center px-3 py-2">
                <span className="sidebar-icon me-2">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
        {user?.role === 'admin' && (
          <div className="mt-auto px-3 pb-3">
            <Link to="/admin/dashboard" className="nav-link d-flex align-items-center">
              <span className="sidebar-icon me-2"><FaCogs /></span>
              {!collapsed && <span>Admin</span>}
            </Link>
          </div>
        )}
        {/* User menu and network status for logged-in users */}
        {user && (
          <div className="sidebar-user-menu mt-auto px-3 pb-3">
            <div className="dropdown mb-2">
              <button className="btn btn-link dropdown-toggle text-light d-flex align-items-center" type="button" id="sidebarUserMenu" data-bs-toggle="dropdown" aria-expanded="false" style={{ color: '#EBD3AD', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5em 0' }}>
                <FaUserCircle className="me-2" size={24} />
                {!collapsed && <span className="fw-semibold">{user.name || user.email || 'User'}</span>}
              </button>
              <ul className="dropdown-menu" aria-labelledby="sidebarUserMenu">
                <li><Link className="dropdown-item" to="/profile"><FaUserCircle className="me-2" /> Profile</Link></li>
                <li><Link className="dropdown-item" to="/settings"><FaCog className="me-2" /> Settings</Link></li>
                {user.role === 'admin' && <>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item text-danger fw-bold" to="/admin/dashboard"><FaCogs className="me-2" /> Admin</Link></li>
                </>}
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item d-flex align-items-center" onClick={handleLogout}><FaSignOutAlt className="me-2" /> Logout</button></li>
              </ul>
            </div>
            <div className="d-flex align-items-center" style={{ gap: 10 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
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
              {!collapsed && <span style={{ fontWeight: 500 }}>{online ? 'Online' : 'Offline'}</span>}
            </div>
          </div>
        )}
      </aside>
    </>
  );
} 