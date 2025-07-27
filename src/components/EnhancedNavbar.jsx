import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const EnhancedNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/booking', label: 'Book', icon: '📅' },
    { path: '/tracking', label: 'Track', icon: '📍' },
    { path: '/payment', label: 'Payment', icon: '💳' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-neutral-900 bg-opacity-90 backdrop-blur-lg border-b border-neutral-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-accent-orange to-accent-blue rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="heading-sm gradient-text">Dar Logistics</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-accent-orange bg-opacity-20 text-accent-orange'
                    : 'text-neutral-300 hover:text-neutral-50 hover:bg-neutral-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="body-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center"
            >
              <span className="text-white text-sm font-semibold">U</span>
            </motion.button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-neutral-800 bg-neutral-900"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-accent-orange bg-opacity-20 text-accent-orange'
                      : 'text-neutral-300 hover:text-neutral-50 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="body-base font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default EnhancedNavbar; 