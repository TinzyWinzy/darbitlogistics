import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function NetworkStatusIndicator({ 
  variant = 'default', 
  showText = true, 
  className = '',
  size = 'default' 
}) {
  const { online } = useNetworkStatus();

  const getStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      borderRadius: 'var(--radius)',
      transition: 'var(--transition)',
      fontSize: size === 'small' ? '0.75rem' : '0.875rem',
      fontWeight: 500
    };

    if (variant === 'sidebar') {
      return {
        ...baseStyles,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: online ? 'var(--success)' : 'var(--danger)'
      };
    }

    if (variant === 'navbar') {
      return {
        ...baseStyles,
        background: 'transparent',
        color: online ? 'var(--success)' : 'var(--danger)'
      };
    }

    return {
      ...baseStyles,
      background: online ? 'var(--success)' : 'var(--danger)',
      color: 'white'
    };
  };

  const getIndicatorStyles = () => ({
    display: 'inline-block',
    width: size === 'small' ? 8 : 12,
    height: size === 'small' ? 8 : 12,
    borderRadius: '50%',
    background: online ? 'var(--success)' : 'var(--danger)',
    border: variant === 'sidebar' ? '2px solid rgba(255, 255, 255, 0.3)' : 'none',
    boxShadow: online 
      ? `0 0 8px var(--success)` 
      : `0 0 8px var(--danger)`,
    transition: 'var(--transition)'
  });

  return (
    <div 
      className={className}
      style={getStyles()}
      aria-label={online ? 'App Online' : 'App Offline'}
      title={online ? 'App Online' : 'App Offline'}
    >
      <div style={getIndicatorStyles()} />
      {showText && (
        <span>
          {online ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
} 