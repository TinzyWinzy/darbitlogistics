import React from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';

function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-4">
      <div className="spinner-border" style={{ color: '#1F2120' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function DashboardAnalytics({ analytics, loadingAnalytics, activeChartTab, setActiveChartTab }) {
  return (
    <div className="mb-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light fw-bold d-flex align-items-center">
          <span>Dashboard Analytics</span>
          <ul className="nav nav-tabs ms-auto" style={{ borderBottom: 'none' }}>
            <li className="nav-item">
              <button className={`nav-link${activeChartTab === 'bar' ? ' active' : ''}`} onClick={() => setActiveChartTab('bar')} type="button">Bar</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link${activeChartTab === 'pie' ? ' active' : ''}`} onClick={() => setActiveChartTab('pie')} type="button">Pie</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link${activeChartTab === 'line' ? ' active' : ''}`} onClick={() => setActiveChartTab('line')} type="button">Line</button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {loadingAnalytics ? <Spinner /> : analytics ? (
            <>
              {activeChartTab === 'bar' && (
                <Bar
                  data={{
                    labels: ['Total', 'Completed', 'Pending'],
                    datasets: [{
                      label: 'Deliveries',
                      data: [analytics.totalDeliveries, analytics.completedDeliveries, analytics.pendingDeliveries],
                      backgroundColor: ['#1e40af', '#16a34a', '#d2691e']
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                  height={80}
                />
              )}
              {activeChartTab === 'pie' && (
                <Pie
                  data={{
                    labels: ['Completed', 'Pending', 'Other'],
                    datasets: [{
                      label: 'Deliveries by Status',
                      data: [analytics.completedDeliveries, analytics.pendingDeliveries, Math.max(0, (analytics.totalDeliveries - analytics.completedDeliveries - analytics.pendingDeliveries))],
                      backgroundColor: ['#16a34a', '#d2691e', '#1e40af']
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
                />
              )}
              {activeChartTab === 'line' && (
                <Line
                  data={{
                    labels: analytics.monthlyLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                      label: 'Deliveries per Month',
                      data: analytics.monthlyData || Array(12).fill(0),
                      fill: false,
                      borderColor: '#1e40af',
                      backgroundColor: '#1e40af',
                      tension: 0.3
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                  height={80}
                />
              )}
            </>
          ) : <div className="text-muted">No analytics data.</div>}
        </div>
      </div>
    </div>
  );
} 