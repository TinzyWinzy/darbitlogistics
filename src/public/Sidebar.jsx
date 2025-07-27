import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FaChevronRight, FaChevronLeft, FaCogs, FaTimes } from 'react-icons/fa';
import './Sidebar.css';
import React from 'react';
import { useUserMenu } from '../hooks';
import { getFilteredMenus, renderIcon } from '../utils/navigationUtils';

// Responsive helper - consistent with Reports component
function useIsMobile() {
  if (typeof window === 'undefined') return false;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useUserMenu();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const isMobile = useIsMobile();

  // Focus trap and ESC close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      
      // Trap focus within sidebar
      if (e.key === 'Tab' && sidebarRef.current) {
        const focusable = sidebarRef.current.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
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
    
    // Auto-focus first element when sidebar opens
    setTimeout(() => {
      if (sidebarRef.current) {
        const firstFocusable = sidebarRef.current.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        firstFocusable?.focus();
      }
    }, 100);
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const role = user?.role || 'guest';
  const { sidebarMenu } = getFilteredMenus(role);

  return (
    <>
      {/* Enhanced Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="sidebar-overlay d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 fade-in" 
          onClick={onClose} 
          style={{ 
            zIndex: 1040,
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.3s ease-in-out'
          }} 
          aria-hidden="true"
        />
      )}
      
      {/* Enhanced Sidebar Navigation */}
      {(!isMobile || isOpen) && (
        <nav
          ref={sidebarRef}
          className={`modern-sidebar navbar navbar-dark flex-column p-0${collapsed ? ' sidebar-collapsed' : ''}${isOpen ? ' open slide-up' : ''}`}
          style={{ 
            zIndex: 1050, 
            minHeight: '100vh', 
            width: !isMobile ? (collapsed ? 64 : 240) : 280, 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            overflowY: isMobile ? 'auto' : undefined,
            boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.15)' : undefined,
            background: 'linear-gradient(135deg, #003366 0%, #0066CC 100%)',
            borderRight: '1px solid rgba(255,255,255,0.2)'
          }}
          aria-label="Main sidebar navigation"
        >
          {/* Enhanced Modern Header */}
          <div className="modern-card-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary position-relative" 
               style={{ 
                 backgroundColor: 'rgba(255,255,255,0.1)', 
                 backdropFilter: 'blur(10px)',
                 borderBottom: '1px solid rgba(255,255,255,0.2)'
               }}>
            {!collapsed && (
              <div className="d-flex align-items-center flex-grow-1">
                <div className="logo-container d-flex align-items-center me-3">
                  <img 
                    src="/logo.svg" 
                    alt="Dar Logistics" 
                    width="32" 
                    height="32" 
                    className="me-2"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                  <div className="brand-text">
                    <span className="fw-bold text-white fs-6 d-block">Dar Logistics</span>
                    {user?.role && (
                      <span className="text-light opacity-75 small d-block" style={{ fontSize: '0.75rem' }}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="d-flex align-items-center gap-2">
              {/* Collapse/Expand Button */}
              {!isMobile && (
                <button 
                  className="btn btn-link p-1 text-light hover-lift" 
                  onClick={() => setCollapsed(c => !c)} 
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  style={{ 
                    fontSize: '0.9rem',
                    transition: 'transform 0.2s ease',
                    borderRadius: '6px',
                    minWidth: '32px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </button>
              )}
              
              {/* Mobile Close Button */}
              {onClose && isMobile && (
                <button 
                  className="btn btn-link p-1 text-light hover-lift" 
                  onClick={onClose} 
                  aria-label="Close sidebar"
                  style={{ 
                    fontSize: '1.1rem',
                    transition: 'transform 0.2s ease',
                    borderRadius: '6px',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Navigation Menu */}
          <ul className="nav nav-pills flex-column gap-2 mt-3 px-3" role="menu" style={{ flex: 1 }}>
            {sidebarMenu.map(item => (
              <li key={item.route} className="nav-item" role="none">
                <Link
                  to={item.route}
                  className={`modern-sidebar-nav-link${location.pathname.startsWith(item.route) ? ' active' : ''}`}
                  role="menuitem"
                  tabIndex={0}
                  aria-current={location.pathname.startsWith(item.route) ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  data-bs-toggle={collapsed ? 'tooltip' : undefined}
                  data-bs-placement="right"
                  style={{
                    transition: 'all 0.2s ease',
                    borderRadius: '8px',
                    padding: isMobile ? '0.8rem 1rem' : '0.6rem 1rem',
                    fontSize: isMobile ? '1.1rem' : '1rem',
                    minHeight: isMobile ? '48px' : '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textDecoration: 'none',
                    color: 'rgba(255,255,255,0.8)',
                    backgroundColor: 'transparent',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!location.pathname.startsWith(item.route)) {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                      e.target.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!location.pathname.startsWith(item.route)) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'rgba(255,255,255,0.8)';
                    }
                  }}
                >
                  <span className="sidebar-icon" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minWidth: '20px'
                  }}>
                    {renderIcon(item.icon, { 
                      className: 'sidebar-icon',
                      style: { fontSize: isMobile ? '1.2rem' : '1.1rem' }
                    })}
                  </span>
                  {!collapsed && <span className="fw-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>

          {/* Enhanced Admin Section */}
          {user?.role === 'admin' && (
            <div className="mt-auto px-3 pb-3 border-top border-secondary" style={{ 
              borderTop: '1px solid rgba(255,255,255,0.2)',
              paddingTop: '1rem'
            }}>
              <Link 
                to="/admin/dashboard" 
                className="modern-sidebar-nav-link" 
                tabIndex={0} 
                title={collapsed ? 'Admin Dashboard' : undefined}
                style={{
                  transition: 'all 0.2s ease',
                  borderRadius: '8px',
                  padding: isMobile ? '0.8rem 1rem' : '0.6rem 1rem',
                  fontSize: isMobile ? '1.1rem' : '1rem',
                  minHeight: isMobile ? '48px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: 'rgba(255,255,255,0.8)',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.target.style.color = 'rgba(255,255,255,0.9)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'rgba(255,255,255,0.8)';
                }}
              >
                <span className="sidebar-icon" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minWidth: '20px'
                }}>
                  {renderIcon('FaCogs', { style: { fontSize: isMobile ? '1.2rem' : '1.1rem' } })}
                </span>
                {!collapsed && <span className="fw-medium">Admin Dashboard</span>}
              </Link>
            </div>
          )}
        </nav>
      )}

      {/* Mobile-specific styles */}
      <style>{`
        @media (max-width: 600px) {
          .modern-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .modern-sidebar.open {
            transform: translateX(0);
          }
          
          .modern-sidebar-nav-link.active {
            background-color: rgba(255,102,0,0.2) !important;
            color: rgba(255,255,255,1) !important;
            border-color: rgba(255,102,0,0.3) !important;
          }
          
          .modern-sidebar-nav-link:hover {
            background-color: rgba(255,255,255,0.1) !important;
            color: rgba(255,255,255,0.9) !important;
          }
        }
        
        @media (min-width: 601px) {
          .modern-sidebar {
            position: relative !important;
            transform: none !important;
          }
          
          .modern-sidebar-nav-link.active {
            background-color: rgba(255,102,0,0.2) !important;
            color: rgba(255,255,255,1) !important;
            border-color: rgba(255,102,0,0.3) !important;
          }
          
          .modern-sidebar-nav-link:hover {
            background-color: rgba(255,255,255,0.1) !important;
            color: rgba(255,255,255,0.9) !important;
          }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .slide-up {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
} 