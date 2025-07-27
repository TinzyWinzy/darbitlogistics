import React from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';

function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-4">
      <div className="modern-loading" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function DashboardAnalytics({ analytics, loadingAnalytics, activeChartTab, setActiveChartTab }) {
  // Chart color scheme matching the design system
  const chartColors = {
    primary: '#FF6600',
    secondary: '#FF8533',
    accent: '#0066CC',
    success: '#28a745',
    warning: '#ffc107',
    info: '#17a2b8',
    danger: '#dc3545'
  };

  // Chart data with enhanced styling
  const barData = {
    labels: ['Total', 'Completed', 'Pending'],
    datasets: [{
      label: 'Deliveries',
      data: [analytics?.totalDeliveries || 0, analytics?.completedDeliveries || 0, analytics?.pendingDeliveries || 0],
      backgroundColor: [chartColors.accent, chartColors.success, chartColors.warning],
      borderColor: [chartColors.accent, chartColors.success, chartColors.warning],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const pieData = {
    labels: ['Completed', 'Pending', 'Other'],
    datasets: [{
      label: 'Deliveries by Status',
      data: [
        analytics?.completedDeliveries || 0, 
        analytics?.pendingDeliveries || 0, 
        Math.max(0, ((analytics?.totalDeliveries || 0) - (analytics?.completedDeliveries || 0) - (analytics?.pendingDeliveries || 0)))
      ],
      backgroundColor: [chartColors.success, chartColors.warning, chartColors.accent],
      borderColor: [chartColors.success, chartColors.warning, chartColors.accent],
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  const lineData = {
    labels: analytics?.monthlyLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Deliveries per Month',
      data: analytics?.monthlyData || Array(12).fill(0),
      fill: true,
      borderColor: chartColors.primary,
      backgroundColor: `rgba(255, 102, 0, 0.1)`,
      tension: 0.4,
      pointBackgroundColor: chartColors.primary,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  // Enhanced chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: chartColors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: '600'
        },
        bodyFont: {
          size: 12
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        }
      }
    }
  };

  return (
    <div className="glassmorphism-card mb-4">
      <div className="card-header-glass">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0 gradient-text">
            📊 Dashboard Analytics
          </h5>
          <div className="chart-tabs">
            <div className="btn-group" role="group" aria-label="Chart type selector">
              <button 
                className={`btn-modern btn-modern-secondary ${activeChartTab === 'bar' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('bar')}
                type="button"
                aria-label="Bar chart"
              >
                📊 Bar
              </button>
              <button 
                className={`btn-modern btn-modern-secondary ${activeChartTab === 'pie' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('pie')}
                type="button"
                aria-label="Pie chart"
              >
                🥧 Pie
              </button>
              <button 
                className={`btn-modern btn-modern-secondary ${activeChartTab === 'line' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('line')}
                type="button"
                aria-label="Line chart"
              >
                📈 Line
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card-body-glass">
        {loadingAnalytics ? (
          <Spinner />
        ) : analytics ? (
          <div className="chart-container" style={{ position: 'relative', height: '300px' }}>
            {activeChartTab === 'bar' && (
              <Bar
                data={barData}
                options={{
                  ...commonOptions,
                  plugins: {
                    ...commonOptions.plugins,
                    legend: { display: false }
                  }
                }}
              />
            )}
            {activeChartTab === 'pie' && (
              <Pie
                data={pieData}
                options={{
                  ...commonOptions,
                  plugins: {
                    ...commonOptions.plugins,
                    legend: { 
                      ...commonOptions.plugins.legend,
                      position: 'bottom'
                    }
                  }
                }}
              />
            )}
            {activeChartTab === 'line' && (
              <Line
                data={lineData}
                options={{
                  ...commonOptions,
                  plugins: {
                    ...commonOptions.plugins,
                    legend: { 
                      ...commonOptions.plugins.legend,
                      position: 'top'
                    }
                  }
                }}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-muted mb-2">
              <span style={{ fontSize: '2rem' }}>📊</span>
            </div>
            <p className="text-muted mb-0">No analytics data available</p>
            <small className="text-muted">Analytics will appear here once delivery data is available</small>
          </div>
        )}
      </div>

      <style>{`
        .chart-tabs .btn-group {
          display: flex;
          gap: 4px;
        }

        .chart-tabs .btn-modern {
          padding: 8px 16px;
          font-size: 0.875rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .chart-tabs .btn-modern.active {
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          color: white;
          box-shadow: 0 4px 16px rgba(255, 102, 0, 0.3);
        }

        .chart-container {
          min-height: 300px;
          position: relative;
        }

        .chart-container canvas {
          border-radius: 8px;
        }

        /* Enhanced loading spinner */
        .modern-loading {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid var(--primary-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .card-header-glass {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .chart-tabs .btn-group {
            justify-content: center;
          }

          .chart-tabs .btn-modern {
            flex: 1;
            text-align: center;
          }

          .chart-container {
            height: 250px;
          }
        }

        @media (max-width: 480px) {
          .chart-container {
            height: 200px;
          }

          .chart-tabs .btn-modern {
            padding: 6px 12px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
} 