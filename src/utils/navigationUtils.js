import * as FaIcons from 'react-icons/fa';
import React from 'react';
import { MENU_CONFIG, USER_ACTIONS } from '../menuConfig';

// Helper to get icon component by name
export const getIcon = (name) => FaIcons[name] || null;

// Helper to render icon component
export const renderIcon = (iconName, props = {}) => {
  const IconComponent = getIcon(iconName);
  return IconComponent ? React.createElement(IconComponent, props) : null;
};

// Filter menu items by role and location
export const filterMenuByRole = (menuConfig, role, location) => {
  return menuConfig.filter(item => 
    item.showIn.includes(location) && item.roles.includes(role)
  );
};

// Get filtered menus for different contexts
export const getFilteredMenus = (role) => {
  return {
    sidebarMenu: filterMenuByRole(MENU_CONFIG, role, 'sidebar'),
    navbarMenu: filterMenuByRole(MENU_CONFIG, role, 'navbar'),
    userMenu: USER_ACTIONS.filter(item => item.roles.includes(role))
  };
};

// Check if current route is public
export const isPublicRoute = (pathname) => {
  const publicRoutes = [
    '/', '/track', '/track-delivery', '/login', '/register', 
    '/offerings', '/help', '/plans', '/payment-success', '/send-one-delivery'
  ];
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
};

// Check if current route is dashboard/operator
export const isDashboardRoute = (pathname) => {
  const dashboardRoutes = [
    '/dashboard', '/loads', '/customers', '/reports', 
    '/billing', '/invoices', '/admin', '/admin/dashboard'
  ];
  return dashboardRoutes.some(route => pathname.startsWith(route));
}; 