// Centralized menu config for all navigation
// Icon values are string names; import and map in consumers
export const MENU_CONFIG = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'FaTachometerAlt',
    roles: ['operator', 'admin'],
    showIn: ['sidebar', 'mobile', 'navbar'],
  },
  {
    label: 'Loads',
    route: '/loads',
    icon: 'FaBoxOpen',
    roles: ['operator', 'admin'],
    showIn: ['sidebar', 'mobile'],
  },
  {
    label: 'Customers',
    route: '/customers',
    icon: 'FaUsers',
    roles: ['operator', 'admin'],
    showIn: ['sidebar', 'mobile'],
  },
  {
    label: 'Reports',
    route: '/reports',
    icon: 'FaChartBar',
    roles: ['operator', 'admin'],
    showIn: ['sidebar', 'mobile'],
  },
  {
    label: 'Billing',
    route: '/billing',
    icon: 'FaCreditCard',
    roles: ['operator', 'admin'],
    showIn: ['sidebar', 'mobile'],
  },
  {
    label: 'Send One Delivery',
    route: '/send-one-delivery',
    icon: 'FaTruck',
    roles: ['guest', 'user', 'operator', 'admin'],
    showIn: ['navbar', 'mobile'],
  },
  {
    label: 'Help',
    route: '/help',
    icon: 'FaQuestionCircle',
    roles: ['guest', 'user', 'operator', 'admin'],
    showIn: ['navbar', 'mobile'],
  },
  {
    label: 'Offerings',
    route: '/offerings',
    icon: 'FaBoxOpen',
    roles: ['guest', 'user'],
    showIn: ['navbar', 'mobile'],
  },
  {
    label: 'Track',
    route: '/track',
    icon: 'FaChartBar',
    roles: ['guest', 'user'],
    showIn: ['navbar', 'mobile'],
  },
  {
    label: 'Plans',
    route: '/plans',
    icon: 'FaFileInvoiceDollar',
    roles: ['user', 'operator', 'admin'],
    showIn: ['navbar', 'mobile'],
  },
  {
    label: 'Login',
    route: '/login',
    icon: 'FaUserCircle',
    roles: ['guest'],
    showIn: ['navbar', 'mobile'],
  },
];

export const USER_ACTIONS = [
  {
    label: 'Profile',
    route: '/profile',
    icon: 'FaUserCircle',
    roles: ['user', 'operator', 'admin'],
  },
  {
    label: 'Settings',
    route: '/settings',
    icon: 'FaCog',
    roles: ['user', 'operator', 'admin'],
  },
  {
    label: 'Admin',
    route: '/admin/dashboard',
    icon: 'FaCogs',
    roles: ['admin'],
  },
  {
    label: 'Logout',
    route: '/logout',
    icon: 'FaSignOutAlt',
    roles: ['user', 'operator', 'admin'],
  },
]; 