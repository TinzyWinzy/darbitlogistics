import React, { useState, useRef } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

const chartTypes = [
  { key: 'pie', label: 'Pie' },
  { key: 'bar', label: 'Bar' },
];
const colors = ['#1976d2', '#00C49F', '#FF8042', '#A28CFF', '#FF6F91', '#6FCF97', '#F2994A', '#FFBB28'];

export default function TonnageByMineralChart({ data, onDrilldown }) {
  const [chartType, setChartType] = useState('pie');
  const chartRef = useRef();

  const handleExport = async () => {
    if (!chartRef.current) return;
    const node = chartRef.current;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(node, { scale: 3 });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tonnage_by_mineral.png';
    a.click();
  };

  return (
    <div className="mb-4" style={{ boxShadow: '0 2px 8px rgba(31,33,32,0.10)', borderRadius: 12, background: '#fff', padding: 20 }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-2 gap-2" style={{ minHeight: 48 }}>
        <span className="fw-bold" style={{ fontSize: 20, letterSpacing: 0.2 }}>{'Tonnage by Mineral'}</span>
        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ flex: 1, justifyContent: 'center' }}>
          <div className="btn-group" role="group">
            {chartTypes.map(type => (
              <button key={type.key} className={`btn btn-sm ${chartType === type.key ? 'btn-primary' : 'btn-outline-secondary'}`} style={{ minWidth: 56, fontSize: 16, padding: '0.5em 1.2em' }} onClick={() => setChartType(type.key)}>{type.label}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-outline-info" style={{ fontSize: 16, padding: '0.5em 1.2em' }} onClick={handleExport}>Export PNG</button>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: 280 }} aria-label="Tonnage by Mineral Chart">
        {chartType === 'pie' && (
          <ResponsiveContainer>
            <PieChart margin={{ bottom: 40 }}>
              <Pie
                data={data}
                dataKey="tonnage"
                nameKey="mineral"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`}
                onClick={(_, i) => onDrilldown && onDrilldown('mineral', data[i]?.mineral)}
              >
                {data.map((entry, i) => <Cell key={entry.mineral} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ bottom: 0 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {chartType === 'bar' && (
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ bottom: 40 }} onClick={e => e && e.activeLabel && onDrilldown && onDrilldown('mineral', e.activeLabel)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="tonnage" />
              <YAxis type="category" dataKey="mineral" width={90} />
              <Tooltip />
              <Bar dataKey="tonnage" fill={colors[2]} name="Tonnage">
                <LabelList dataKey="tonnage" position="right" fontSize={12} />
              </Bar>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ bottom: 0 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 