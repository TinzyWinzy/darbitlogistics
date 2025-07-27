import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import { useMediaQuery } from 'react-responsive';
import React from 'react';
import MobileDashboardDrawer from './MobileDashboardDrawer';
import { useUserMenu } from '../hooks';
import { getFilteredMenus, renderIcon, isPublicRoute, isDashboardRoute } from '../utils/navigationUtils';
import { NetworkStatusIndicator, UserMenuDropdown } from '../components/shared';

export default function Navbar({ onHamburgerClick }) {
  const { user } = useUserMenu();
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // CSS Custom Properties for Navbar
  const navbarStyles = `
    :root {
      --primary-blue: #003366;
      --primary-orange: #FF6600;
      --accent-orange: #FF8533;
      --font-size-xl: 1.25rem;
      --font-size-2xl: 1.5rem;
      --space-2: 0.5rem;
      --space-3: 0.75rem;
      --space-4: 1rem;
      --space-8: 2rem;
      --radius-sm: 0.375rem;
    }
  `;

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  const isMobile = useMediaQuery({ maxWidth: 991 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const role = user?.role || 'guest';
  const { navbarMenu, userMenu } = getFilteredMenus(role);

  // Mobile Navbar Component
  const MobileNavbar = () => (
    <nav className="navbar navbar-expand-lg d-lg-none" style={{ background: 'var(--primary-blue)', padding: 'var(--space-3) var(--space-4)' }}>
      <div className="container-fluid">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/" style={{ color: 'var(--primary-orange)', fontWeight: 'bold', fontSize: 'var(--font-size-xl)' }}>
          <img src="/logo.svg" alt="Dar Logistics Logo" width={32} height={32} style={{ marginRight: 'var(--space-2)' }} />
          Dar Logistics
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ color: 'var(--primary-orange)', border: 'none' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Mobile Menu */}
        <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} style={{ background: 'var(--primary-blue)' }}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {navbarMenu.map((item, index) => (
              <li key={index} className="nav-item">
                <NavLink 
                  to={item.route} 
                  className="nav-link text-white"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {renderIcon(item.icon, { className: 'me-2' })}
                  {item.label}
                </NavLink>
              </li>
            ))}
            {user && (
              <>
                <li className="nav-item">
                                  <NavLink 
                  to="/profile" 
                  className="nav-link text-white"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span className="me-2">👤</span> Profile
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  to="/settings" 
                  className="nav-link text-white"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span className="me-2">⚙️</span> Settings
                </NavLink>
              </li>
              {user.role === 'admin' && (
                <li className="nav-item">
                  <NavLink 
                    to="/admin/dashboard" 
                    className="nav-link text-white"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <span className="me-2">🛡️</span> Admin
                  </NavLink>
                </li>
              )}
              </>
            )}
          </ul>
          
          {/* User Menu for Mobile */}
          {user && (
            <div className="d-flex flex-column w-100">
              <div className="text-white p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="d-flex align-items-center mb-2">
                  <span className="me-2">👤</span>
                  <span className="fw-semibold">{user.name || user.email || 'User'}</span>
                </div>
                <UserMenuDropdown 
                  variant="mobile"
                  className="w-100"
                />
              </div>
            </div>
          )}

          {/* Network Status for Mobile */}
          <div className="d-flex align-items-center justify-content-center p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <NetworkStatusIndicator 
              variant="navbar"
              size="small"
            />
          </div>
        </div>
      </div>
    </nav>
  );

  // Desktop Navbar Component
  const DesktopNavbar = () => (
    <nav className="navbar navbar-expand-lg d-none d-lg-block" style={{ background: 'var(--primary-blue)', padding: 'var(--space-4) var(--space-8)' }}>
      <div className="container-fluid">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/" style={{ color: 'var(--primary-orange)', fontWeight: 'bold', fontSize: 'var(--font-size-2xl)' }}>
          <img src="/logo.svg" alt="Dar Logistics Logo" width={40} height={40} style={{ marginRight: 'var(--space-3)' }} />
          Dar Logistics
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-nav me-auto">
          {navbarMenu.map((item, index) => (
            <NavLink 
              key={index}
              to={item.route} 
              className="nav-link text-white"
              style={{ margin: '0 var(--space-2)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)' }}
            >
              {renderIcon(item.icon, { className: 'me-2' })}
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right Side - User Menu & Status */}
        <div className="d-flex align-items-center">
          {/* Network Status */}
          <div className="me-3">
            <NetworkStatusIndicator 
              variant="navbar"
              size="small"
            />
          </div>

          {/* User Menu */}
          {user ? (
            <UserMenuDropdown variant="navbar" />
          ) : (
            // For logged out users, the navbarMenu already includes Login and Send One Delivery
            // So we don't need to add them again here
            <div className="d-flex align-items-center">
              {/* Additional actions for logged out users can be added here if needed */}
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <style>{navbarStyles}</style>
      {/* Mobile Navbar */}
      <MobileNavbar />
      
      {/* Desktop Navbar */}
      <DesktopNavbar />
      
      {/* Mobile Dashboard Drawer for authenticated users */}
      {user && isMobile && (
        <MobileDashboardDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          userRole={role}
          onLogout={() => {
            // Logout is handled by UserMenuDropdown component
          }}
          userName={user?.name || user?.email || 'User'}
        />
      )}
    </>
  );
} 