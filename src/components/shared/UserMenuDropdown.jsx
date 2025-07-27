import React from 'react';
import { Link } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useUserMenu } from '../../hooks/useUserMenu';
import { getFilteredMenus, renderIcon } from '../../utils/navigationUtils';

export default function UserMenuDropdown({ 
  variant = 'navbar', 
  collapsed = false,
  className = ''
}) {
  const { user, handleLogout } = useUserMenu();
  const { userMenu } = getFilteredMenus(user?.role || 'guest');

  if (!user) return null;

  const getToggleStyles = () => {
    if (variant === 'sidebar') {
      return {
        color: 'var(--brand-secondary)',
        textDecoration: 'none',
        fontSize: '1rem',
        padding: '0.5em 0',
        border: 'none',
        background: 'transparent',
        width: '100%',
        justifyContent: 'flex-start'
      };
    }

    return {
      color: '#FF6600',
      textDecoration: 'none',
      border: 'none'
    };
  };

  const getMenuStyles = () => {
    if (variant === 'sidebar') {
      return {
        minWidth: collapsed ? 180 : undefined,
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-lg)'
      };
    }

    return {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB'
    };
  };

  const renderSidebarUserMenu = () => (
    <div className="dropdown mb-3" style={{ width: '100%' }}>
      <button
        className="btn btn-link dropdown-toggle text-light d-flex align-items-center w-100 justify-content-start modern-sidebar-nav-link"
        type="button"
        id="sidebarUserMenu"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-haspopup="true"
        tabIndex={0}
        style={getToggleStyles()}
      >
        <FaUserCircle className="me-2" size={24} />
        {!collapsed && (
          <span className="fw-semibold text-truncate">
            {user.name || user.email || 'User'}
          </span>
        )}
      </button>
      <ul 
        className="dropdown-menu w-100 modern-card" 
        aria-labelledby="sidebarUserMenu" 
        style={getMenuStyles()}
      >
        {userMenu.map(item => (
          <li key={item.route}>
            <Link className="dropdown-item d-flex align-items-center py-2" to={item.route}>
              {renderIcon(item.icon, { className: 'me-2', style: { fontSize: '0.9rem' } })}
              {item.label}
            </Link>
          </li>
        ))}
        <li><hr className="dropdown-divider" /></li>
        <li>
          <button 
            className="dropdown-item d-flex align-items-center py-2 text-danger" 
            onClick={handleLogout}
          >
            <FaSignOutAlt className="me-2" /> Logout
          </button>
        </li>
      </ul>
    </div>
  );

  const renderNavbarUserMenu = () => (
    <Dropdown align="end">
      <Dropdown.Toggle 
        variant="link" 
        className="d-flex align-items-center text-white"
        style={getToggleStyles()}
      >
        <FaUserCircle className="me-2" size={24} />
        <span className="fw-semibold">{user.name || user.email || 'User'}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu style={getMenuStyles()}>
        {userMenu.filter(item => item.label.toLowerCase() !== 'logout').map((item, index) => (
          <Dropdown.Item key={index} as={Link} to={item.path} className="d-flex align-items-center">
            {renderIcon(item.icon, { className: 'me-2' })}
            {item.label}
          </Dropdown.Item>
        ))}
        <Dropdown.Divider />
        <Dropdown.Item as="button" className="d-flex align-items-center" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  return (
    <div className={className}>
      {variant === 'sidebar' ? renderSidebarUserMenu() : renderNavbarUserMenu()}
    </div>
  );
} 