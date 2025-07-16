import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { MENU_CONFIG, USER_ACTIONS } from '../menuConfig';
import * as FaIcons from 'react-icons/fa';
import './Sidebar.css';
import { isOnline } from '../services/api';
import React from 'react';

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

  const getIcon = (name) => FaIcons[name] || null;

  const role = user?.role || 'guest';
  const sidebarMenu = MENU_CONFIG.filter(item => item.showIn.includes('sidebar') && item.roles.includes(role));
  const userMenu = USER_ACTIONS.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" onClick={onClose} style={{ zIndex: 1040 }} />}
      <nav
        ref={sidebarRef}
        className={`sidebar navbar navbar-dark bg-dark flex-column p-0${collapsed ? ' sidebar-collapsed' : ''}${isOpen ? ' open' : ''}`}
        style={{ zIndex: 1050, minHeight: '100vh', width: window.innerWidth > 991 ? (collapsed ? 64 : 240) : 220, transition: 'width 0.2s', overflowY: window.innerWidth <= 991 ? 'auto' : undefined }}
        aria-label="Main sidebar navigation"
      >
        <div className="sidebar-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
          {!collapsed && <span className="fw-bold text-warning">Menu</span>}
          <button className="btn btn-link p-0 ms-auto" onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <FaIcons.FaChevronRight /> : <FaIcons.FaChevronLeft />}
          </button>
          {onClose && (
            <button className="btn btn-link d-lg-none ms-2" onClick={onClose} aria-label="Close sidebar">&times;</button>
          )}
        </div>
        <ul className="nav nav-pills flex-column gap-1 mt-2" role="menu">
          {sidebarMenu.map(item => (
            <li key={item.route} className="nav-item" role="none">
              <Link
                to={item.route}
                className={`nav-link d-flex align-items-center px-3 py-2${location.pathname.startsWith(item.route) ? ' active' : ''}`}
                role="menuitem"
                tabIndex={0}
                aria-current={location.pathname.startsWith(item.route) ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                data-bs-toggle={collapsed ? 'tooltip' : undefined}
                data-bs-placement="right"
              >
                <span className="sidebar-icon me-2">{getIcon(item.icon) && React.createElement(getIcon(item.icon), { className: 'sidebar-icon me-2' })}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
        {user?.role === 'admin' && (
          <div className="mt-auto px-3 pb-3 border-top">
            <Link to="/admin/dashboard" className="nav-link d-flex align-items-center" tabIndex={0} title={collapsed ? 'Admin' : undefined}>
              <span className="sidebar-icon me-2">{React.createElement(FaIcons.FaCogs)}</span>
              {!collapsed && <span>Admin</span>}
            </Link>
          </div>
        )}
        {/* User menu and network status for logged-in users */}
        {user && (
          <div className="sidebar-user-menu mt-auto px-3 pb-3 border-top">
            <div className="dropdown mb-2" style={{ width: '100%' }}>
              <button
                className="btn btn-link dropdown-toggle text-light d-flex align-items-center w-100 justify-content-start"
                type="button"
                id="sidebarUserMenu"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-haspopup="true"
                tabIndex={0}
                style={{ color: '#EBD3AD', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5em 0' }}
              >
                <FaIcons.FaUserCircle className="me-2" size={24} />
                {!collapsed && <span className="fw-semibold">{user.name || user.email || 'User'}</span>}
              </button>
              <ul className="dropdown-menu w-100" aria-labelledby="sidebarUserMenu" style={{ minWidth: collapsed ? 180 : undefined }}>
                {userMenu.map(item => (
                  <li key={item.route}>
                    <Link className="dropdown-item" to={item.route}>
                      {getIcon(item.icon) && React.createElement(getIcon(item.icon), { className: 'me-2' })} {item.label}
                    </Link>
                  </li>
                ))}
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item d-flex align-items-center" onClick={handleLogout}><FaIcons.FaSignOutAlt className="me-2" /> Logout</button></li>
              </ul>
            </div>
            <div className="d-flex align-items-center gap-2">
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
      </nav>
    </>
  );
} 