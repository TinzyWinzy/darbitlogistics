import React, { useState, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList, PieChart, Pie, Cell } from 'recharts';

const chartTypes = [
  { key: 'bar', label: 'Bar' },
  { key: 'pie', label: 'Pie' },
];
const colors = ['#FF8042', '#1976d2', '#00C49F', '#A28CFF', '#FF6F91', '#6FCF97', '#F2994A', '#FFBB28'];

export default function TopCustomersChart({ data, onDrilldown }) {
  const [chartType, setChartType] = useState('bar');
  const chartRef = useRef();

  const handleExport = async () => {
    if (!chartRef.current) return;
    const node = chartRef.current;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(node, { scale: 3 });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'top_customers.png';
    a.click();
  };

  return (
    <div className="chart-container">
      <style>{`
        :root {
          --primary-color: #1F2120;
          --secondary-color: #EBD3AD;
          --accent-color: #F4D03F;
          --text-primary: #1F2120;
          --text-secondary: #6c757d;
          --background-primary: #ffffff;
          --background-secondary: #f8f9fa;
          --border-color: #e9ecef;
          --shadow-light: 0 2px 8px rgba(31, 33, 32, 0.08);
          --shadow-medium: 0 4px 16px rgba(31, 33, 32, 0.12);
          --shadow-heavy: 0 8px 32px rgba(31, 33, 32, 0.15);
          --border-radius: 12px;
          --border-radius-sm: 8px;
          --spacing-xs: 0.5rem;
          --spacing-sm: 1rem;
          --spacing-md: 1.5rem;
          --spacing-lg: 2rem;
          --spacing-xl: 3rem;
        }

        .chart-container {
          background: var(--background-primary);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-light);
          border: 1px solid var(--border-color);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .chart-container:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        .chart-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-sm);
          gap: var(--spacing-sm);
          min-height: 48px;
        }

        .chart-title {
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text-primary);
          letter-spacing: 0.2px;
          margin: 0;
        }

        .chart-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
          flex: 1;
          justify-content: center;
        }

        .btn-group-custom {
          display: flex;
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          box-shadow: var(--shadow-light);
        }

        .btn-group-custom .btn {
          border: none;
          padding: 0.5rem 1.2rem;
          font-size: 0.9rem;
          font-weight: 600;
          min-width: 56px;
          transition: all 0.2s ease;
        }

        .btn-group-custom .btn:first-child {
          border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm);
        }

        .btn-group-custom .btn:last-child {
          border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
        }

        .btn-group-custom .btn.active {
          background: var(--primary-color);
          color: var(--secondary-color);
        }

        .btn-group-custom .btn:not(.active) {
          background: var(--background-secondary);
          color: var(--text-primary);
        }

        .btn-group-custom .btn:not(.active):hover {
          background: var(--border-color);
        }

        .btn-export {
          background: var(--background-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          padding: 0.5rem 1.2rem;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .btn-export:hover {
          background: var(--primary-color);
          color: var(--secondary-color);
          transform: translateY(-1px);
        }

        .chart-content {
          width: 100%;
          height: 280px;
          position: relative;
        }

        .chart-content .recharts-wrapper {
          cursor: pointer;
        }

        .chart-content .recharts-bar-rectangle {
          transition: opacity 0.2s ease;
        }

        .chart-content .recharts-bar-rectangle:hover {
          opacity: 0.8;
        }

        .chart-content .recharts-pie-sector {
          transition: opacity 0.2s ease;
        }

        .chart-content .recharts-pie-sector:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .chart-container {
            padding: var(--spacing-sm);
            margin-bottom: var(--spacing-sm);
          }

          .chart-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }

          .chart-title {
            font-size: 1.1rem;
            text-align: center;
          }

          .chart-controls {
            justify-content: center;
          }

          .chart-content {
            height: 250px;
          }
        }

        @media (max-width: 480px) {
          .chart-container {
            padding: var(--spacing-xs);
          }

          .chart-title {
            font-size: 1rem;
          }

          .btn-group-custom .btn,
          .btn-export {
            padding: 0.4rem 1rem;
            font-size: 0.85rem;
            min-width: 50px;
          }

          .chart-content {
            height: 220px;
          }
        }
      `}</style>

      <div className="chart-header">
        <h3 className="chart-title">Top Customers (Tonnage)</h3>
        <div className="chart-controls">
          <div className="btn-group-custom" role="group">
            {chartTypes.map(type => (
              <button 
                key={type.key} 
                className={`btn ${chartType === type.key ? 'active' : ''}`}
                onClick={() => setChartType(type.key)}
              >
                {type.label}
              </button>
            ))}
          </div>
          <button 
            className="btn-export"
            onClick={handleExport}
          >
            Export PNG
          </button>
        </div>
      </div>
      
      <div ref={chartRef} className="chart-content" aria-label="Top Customers Chart">
        {chartType === 'bar' && (
          <ResponsiveContainer>
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ bottom: 40 }} 
              onClick={e => e && e.activeLabel && onDrilldown && onDrilldown('customer', e.activeLabel)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors[7]} />
              <XAxis type="number" dataKey="tonnage" stroke={colors[1]} />
              <YAxis type="category" dataKey="customer" width={90} stroke={colors[1]} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--background-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  boxShadow: 'var(--shadow-medium)'
                }}
              />
              <Bar dataKey="tonnage" fill={colors[0]} name="Tonnage">
                <LabelList dataKey="tonnage" position="right" fontSize={12} fill={colors[1]} />
              </Bar>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ bottom: 0 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {chartType === 'pie' && (
          <ResponsiveContainer>
            <PieChart margin={{ bottom: 40 }}>
              <Pie
                data={data}
                dataKey="tonnage"
                nameKey="customer"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`}
                onClick={(_, i) => onDrilldown && onDrilldown('customer', data[i]?.customer)}
              >
                {data.map((entry, i) => <Cell key={entry.customer} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--background-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  boxShadow: 'var(--shadow-medium)'
                }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ bottom: 0 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 