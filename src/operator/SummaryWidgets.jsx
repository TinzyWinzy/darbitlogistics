import React from 'react';
import { FaUsers, FaTruck, FaCheckCircle, FaHourglassHalf, FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function SummaryWidgets({ activeLoads, completedLoads, pendingLoads, totalCustomers, analyticsTrends }) {
  const widgets = [
    {
      icon: FaTruck,
      value: activeLoads,
      label: 'Active Loads',
      color: 'warning',
      bgColor: 'rgba(255, 193, 7, 0.15)',
      borderColor: 'rgba(255, 193, 7, 0.3)',
      trend: analyticsTrends?.total,
      description: 'Currently active loads'
    },
    {
      icon: FaCheckCircle,
      value: completedLoads,
      label: 'Completed Loads',
      color: 'success',
      bgColor: 'rgba(40, 167, 69, 0.15)',
      borderColor: 'rgba(40, 167, 69, 0.3)',
      trend: analyticsTrends?.completed,
      description: 'Loads delivered or completed'
    },
    {
      icon: FaHourglassHalf,
      value: pendingLoads,
      label: 'Pending Loads',
      color: 'warning',
      bgColor: 'rgba(255, 193, 7, 0.15)',
      borderColor: 'rgba(255, 193, 7, 0.3)',
      trend: analyticsTrends?.pending,
      description: 'Loads not yet started or pending'
    },
    {
      icon: FaUsers,
      value: totalCustomers,
      label: 'Total Customers',
      color: 'info',
      bgColor: 'rgba(23, 162, 184, 0.15)',
      borderColor: 'rgba(23, 162, 184, 0.3)',
      trend: null,
      description: 'Unique customers with bookings'
    }
  ];

  const getTrendIcon = (trend) => {
    if (trend === 1) {
      return <FaArrowUp className="text-success ms-2" title="Trending Up" />;
    } else if (trend === -1) {
      return <FaArrowDown className="text-danger ms-2" title="Trending Down" />;
    }
    return null;
  };

  const getColorClass = (color) => {
    const colorMap = {
      warning: '#ffc107',
      success: '#28a745',
      info: '#17a2b8',
      primary: '#FF6600'
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div className="row g-4 mb-4">
      {widgets.map((widget, index) => (
        <div key={index} className="col-12 col-md-6 col-lg-3 mb-3">
          <div 
            className="glassmorphism-widget text-center py-4 position-relative"
            style={{
              background: widget.bgColor,
              border: `1px solid ${widget.borderColor}`,
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            title={widget.description}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Widget Icon */}
            <div className="widget-icon-container mb-3">
              <div 
                className="widget-icon-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${getColorClass(widget.color)}, ${getColorClass(widget.color)}dd)`,
                  margin: '0 auto',
                  boxShadow: `0 4px 16px ${getColorClass(widget.color)}40`
                }}
              >
                <widget.icon 
                  className="fs-3 text-white" 
                  aria-label={widget.label}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
              </div>
            </div>

            {/* Widget Value */}
            <div className="widget-value mb-2">
              <span 
                className="fw-bold fs-2"
                style={{ 
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {widget.value.toLocaleString()}
                {getTrendIcon(widget.trend)}
              </span>
            </div>

            {/* Widget Label */}
            <div className="widget-label">
              <span 
                className="text-white fw-medium"
                style={{ 
                  opacity: 0.9,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {widget.label}
              </span>
            </div>

            {/* Subtle background pattern */}
            <div 
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                background: `radial-gradient(circle at 20% 80%, ${getColorClass(widget.color)}20 0%, transparent 50%)`,
                borderRadius: '16px',
                pointerEvents: 'none',
                zIndex: -1
              }}
            />
          </div>
        </div>
      ))}

      <style>{`
        .glassmorphism-widget {
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .glassmorphism-widget::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          border-radius: 16px;
          pointer-events: none;
        }

        .widget-icon-container {
          position: relative;
          z-index: 2;
        }

        .widget-icon-circle {
          transition: all 0.3s ease;
        }

        .glassmorphism-widget:hover .widget-icon-circle {
          transform: scale(1.1);
        }

        .widget-value {
          position: relative;
          z-index: 2;
        }

        .widget-label {
          position: relative;
          z-index: 2;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .glassmorphism-widget {
            padding: 1.5rem 1rem !important;
          }

          .widget-icon-circle {
            width: 50px !important;
            height: 50px !important;
          }

          .widget-icon-circle .fs-3 {
            font-size: 1.5rem !important;
          }

          .widget-value .fs-2 {
            font-size: 1.5rem !important;
          }

          .widget-label span {
            font-size: 0.8rem !important;
          }
        }

        @media (max-width: 480px) {
          .glassmorphism-widget {
            padding: 1rem 0.75rem !important;
          }

          .widget-icon-circle {
            width: 45px !important;
            height: 45px !important;
          }

          .widget-icon-circle .fs-3 {
            font-size: 1.25rem !important;
          }

          .widget-value .fs-2 {
            font-size: 1.25rem !important;
          }

          .widget-label span {
            font-size: 0.75rem !important;
          }
        }

        /* Animation for trend icons */
        .text-success {
          animation: pulse 2s infinite;
        }

        .text-danger {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Enhanced focus states for accessibility */
        .glassmorphism-widget:focus {
          outline: 2px solid rgba(255, 255, 255, 0.5);
          outline-offset: 2px;
        }

        /* Smooth transitions for all interactive elements */
        .glassmorphism-widget * {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
} 