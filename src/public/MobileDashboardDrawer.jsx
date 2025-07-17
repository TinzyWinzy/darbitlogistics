import React from 'react';
import { NavLink } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';
import { MENU_CONFIG, USER_ACTIONS } from '../menuConfig';

export default function MobileDashboardDrawer({ open, onClose, userRole, onLogout, userName }) {
  if (!open) return null;
  // Dashboard routes only
  const dashboardLinks = MENU_CONFIG.filter(item => item.showIn.includes('sidebar') && item.roles.includes(userRole));
  // User actions: profile, settings, logout
  const userActions = USER_ACTIONS.filter(item => ['Profile', 'Settings'].includes(item.label) && item.roles.includes(userRole));
  return (
    <>
      {/* Overlay */}
      <div
        className="mobile-dashboard-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 3000,
        }}
        onClick={onClose}
        aria-label="Close dashboard menu"
      />
      {/* Drawer */}
      <div
        className="mobile-dashboard-drawer"
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: '100vw',
          background: '#232323',
          color: '#EBD3AD',
          borderTopLeftRadius: '1.2rem',
          borderTopRightRadius: '1.2rem',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.18)',
          zIndex: 3100,
          padding: '1.2rem 1.2rem 2.2rem 1.2rem',
          minHeight: '40vh',
          maxHeight: '80vh',
          overflowY: 'auto',
          animation: 'slideUpDrawer 0.25s cubic-bezier(.4,1.6,.6,1)'
        }}
        role="menu"
        aria-modal="true"
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-bold" style={{ fontSize: '1.2rem' }}>Dashboard Menu</span>
          <button className="btn btn-link text-light fs-3" onClick={onClose} aria-label="Close menu">&times;</button>
        </div>
        <ul className="list-unstyled mb-0">
          {dashboardLinks.map(item => (
            <li key={item.route} className="mb-2">
              <NavLink
                to={item.route}
                className={({ isActive }) => `d-flex align-items-center gap-2 px-3 py-2 rounded fw-semibold${isActive ? ' bg-light text-dark' : ''}`}
                style={{ textDecoration: 'none', fontSize: '1.1rem' }}
                onClick={onClose}
              >
                {FaIcons[item.icon] && React.createElement(FaIcons[item.icon], { className: 'me-2', size: 20 })}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        {/* Divider */}
        <hr style={{ borderColor: '#444', margin: '1.2rem 0' }} />
        {/* User section */}
        <div className="d-flex align-items-center gap-2 mb-3 px-3">
          <FaIcons.FaUserCircle size={28} className="me-2" />
          <span className="fw-semibold" style={{ fontSize: '1.1rem' }}>{userName || 'User'}</span>
        </div>
        <ul className="list-unstyled mb-0">
          {userActions.map(item => (
            <li key={item.path} className="mb-2">
              <NavLink
                to={item.path}
                className={({ isActive }) => `d-flex align-items-center gap-2 px-3 py-2 rounded fw-semibold${isActive ? ' bg-light text-dark' : ''}`}
                style={{ textDecoration: 'none', fontSize: '1.1rem' }}
                onClick={onClose}
              >
                {FaIcons[item.icon] && React.createElement(FaIcons[item.icon], { className: 'me-2', size: 20 })}
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              className="d-flex align-items-center gap-2 px-3 py-2 rounded fw-semibold btn btn-link text-danger w-100"
              style={{ textDecoration: 'none', fontSize: '1.1rem' }}
              onClick={() => { onLogout(); onClose(); }}
            >
              <FaIcons.FaSignOutAlt className="me-2" size={20} /> Logout
            </button>
          </li>
        </ul>
      </div>
      {/* Drawer animation */}
      <style>{`
        @keyframes slideUpDrawer {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
} 