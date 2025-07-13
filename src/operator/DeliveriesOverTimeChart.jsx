import React, { useState, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList } from 'recharts';

const chartTypes = [
  { key: 'bar', label: 'Bar' },
  { key: 'line', label: 'Line' },
  { key: 'area', label: 'Area' },
];
const colors = ['#1976d2', '#00C49F', '#FF8042'];

export default function DeliveriesOverTimeChart({ data, onDrilldown }) {
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
    a.download = 'deliveries_over_time.png';
    a.click();
  };

  return (
    <div className="mb-4" style={{ boxShadow: '0 2px 8px rgba(31,33,32,0.10)', borderRadius: 12, background: '#fff', padding: 20 }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-2 gap-2" style={{ minHeight: 48 }}>
        <span className="fw-bold" style={{ fontSize: 20, letterSpacing: 0.2 }}>{'Deliveries Over Time'}</span>
        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ flex: 1, justifyContent: 'center' }}>
          <div className="btn-group" role="group">
            {chartTypes.map(type => (
              <button key={type.key} className={`btn btn-sm ${chartType === type.key ? 'btn-primary' : 'btn-outline-secondary'}`} style={{ minWidth: 56, fontSize: 16, padding: '0.5em 1.2em' }} onClick={() => setChartType(type.key)}>{type.label}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-outline-info" style={{ fontSize: 16, padding: '0.5em 1.2em' }} onClick={handleExport}>Export PNG</button>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: 280 }} aria-label="Deliveries Over Time Chart">
        {chartType === 'bar' && (
          <ResponsiveContainer>
            <BarChart data={data} onClick={e => e && e.activeLabel && onDrilldown && onDrilldown('month', e.activeLabel)} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={colors[0]} name="Deliveries">
                <LabelList dataKey="count" position="top" fontSize={12} />
              </Bar>
              <Bar dataKey="tonnage" fill={colors[1]} name="Tonnage">
                <LabelList dataKey="tonnage" position="top" fontSize={12} />
              </Bar>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ bottom: 0 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {chartType === 'line' && (
          <ResponsiveContainer>
            <LineChart data={data} onClick={e => e && e.activeLabel && onDrilldown && onDrilldown('month', e.activeLabel)} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={colors[0]} name="Deliveries" strokeWidth={2} dot={{ r: 3 }}>
                <LabelList dataKey="count" position="top" fontSize={12} />
              </Line>
              <Line type="monotone" dataKey="tonnage" stroke={colors[1]} name="Tonnage" strokeWidth={2} dot={{ r: 3 }}>
                <LabelList dataKey="tonnage" position="top" fontSize={12} />
              </Line>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ bottom: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        {chartType === 'area' && (
          <ResponsiveContainer>
            <AreaChart data={data} onClick={e => e && e.activeLabel && onDrilldown && onDrilldown('month', e.activeLabel)} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} name="Deliveries">
                <LabelList dataKey="count" position="top" fontSize={12} />
              </Area>
              <Area type="monotone" dataKey="tonnage" stroke={colors[1]} fill={colors[1]} fillOpacity={0.3} name="Tonnage">
                <LabelList dataKey="tonnage" position="top" fontSize={12} />
              </Area>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ bottom: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 