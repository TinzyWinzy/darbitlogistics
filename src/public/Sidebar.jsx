import { Link, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../App';
import { FaTachometerAlt, FaBoxOpen, FaUsers, FaChartBar, FaCreditCard, FaQuestionCircle, FaCogs, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { to: '/loads', icon: <FaBoxOpen />, label: 'Loads' },
    { to: '/customers', icon: <FaUsers />, label: 'Customers' },
    { to: '/reports', icon: <FaChartBar />, label: 'Reports' },
    { to: '/billing', icon: <FaCreditCard />, label: 'Billing' },
    { to: '/help', icon: <FaQuestionCircle />, label: 'Help' },
  ];

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${isOpen ? ' open' : ''}`}> 
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
  );
} 