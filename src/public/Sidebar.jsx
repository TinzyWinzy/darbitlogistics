import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { FaTachometerAlt, FaBoxOpen, FaUsers, FaChartBar, FaCreditCard, FaQuestionCircle, FaCogs, FaChevronLeft, FaChevronRight, FaFileInvoiceDollar } from 'react-icons/fa';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);

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
      </aside>
    </>
  );
} 