import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getFindings, getFindingsSummary, getScans } from './api';

const NEON_COLORS = {
  critical: '#ff4d4d',
  high:     '#ff8800',
  medium:   '#ffff00',
  low:      '#44ffe1',
  info:     '#888888',
};

const STATUS_COLORS = {
  queued:    '#ffff00',
  running:   '#44ffe1',
  completed: '#00ff88',
  failed:    '#ff4d4d',
  cancelled: '#888888',
};

const chartTheme = {
  style: { background: 'transparent' },
  tick: { fill: '#666', fontSize: 11 },
  axisLine: { stroke: '#333' },
  tooltip: { contentStyle: { background: '#222234', border: '1px solid #44ffe133', borderRadius: 6, color: '#ccc', fontSize: 12 } },
  legend: { wrapperStyle: { color: '#888', fontSize: 12 } },
};

function StatWidget({ label, value, color = '#44ffe1' }) {
  return (
    <div className="neon-card" style={{ textAlign: 'center', flex: 1, minWidth: 120 }}>
      <div style={{ color: '#666', fontSize: '0.72rem', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color, textShadow: `0 0 8px ${color}` }}>{value ?? '—'}</div>
    </div>
  );
}

function SectionCard({ title, children, style }) {
  return (
    <div className="neon-card" style={{ ...style }}>
      <h3 style={{ color: '#44ffe1', margin: '0 0 1rem', fontSize: '0.9rem', letterSpacing: 1 }}>{title}</h3>
      {children}
    </div>
  );
}

// Build last-7-days timeline data from scans
function buildTimeline(scans) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    days.push({ day: key, count: 0, date: d.toDateString() });
  }
  scans.forEach(scan => {
    const d = new Date(scan.created_at).toDateString();
    const entry = days.find(e => e.date === d);
    if (entry) entry.count++;
  });
  return days;
}

export default function Analytics() {
  const [findings, setFindings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getFindings(),
      getFindingsSummary(),
      getScans(),
    ]).then(([f, s, sc]) => {
      if (f.status === 'fulfilled') setFindings(Array.isArray(f.value.data) ? f.value.data : f.value.data?.items || []);
      if (s.status === 'fulfilled') setSummary(s.value.data);
      if (sc.status === 'fulfilled') setScans(Array.isArray(sc.value.data) ? sc.value.data : sc.value.data?.items || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#44ffe1', padding: '2rem' }}>Loading analytics...</div>;

  // Compute severity pie data
  const sevPieData = ['critical', 'high', 'medium', 'low', 'info'].map(sev => ({
    name: sev.charAt(0).toUpperCase() + sev.slice(1),
    value: summary?.by_severity?.[sev] ?? findings.filter(f => f.severity === sev).length,
    color: NEON_COLORS[sev],
  })).filter(d => d.value > 0);

  // Scan status bar data
  const statusGroups = {};
  scans.forEach(s => { statusGroups[s.status] = (statusGroups[s.status] || 0) + 1; });
  const statusBarData = Object.entries(statusGroups).map(([status, count]) => ({ status, count }));

  // Timeline
  const timelineData = buildTimeline(scans);

  // Category bar data
  const catGroups = {};
  findings.forEach(f => { if (f.category) catGroups[f.category] = (catGroups[f.category] || 0) + 1; });
  const catBarData = Object.entries(catGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const totalScansCompleted = scans.filter(s => s.status === 'completed').length;
  const criticalOpen = summary?.by_severity?.critical ?? findings.filter(f => f.severity === 'critical' && f.status !== 'remediated').length;
  const totalFindings = summary?.total ?? findings.length;

  return (
    <div>
      <h2 style={{ color: '#44ffe1', marginBottom: '1.5rem', textShadow: '0 0 8px #44ffe1' }}>Analytics</h2>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatWidget label="Total Findings" value={totalFindings} />
        <StatWidget label="Critical Open" value={criticalOpen} color="#ff4d4d" />
        <StatWidget label="Scans Completed" value={totalScansCompleted} color="#00ff88" />
        <StatWidget label="Total Scans" value={scans.length} color="#ff8800" />
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Findings by Severity - Pie */}
        <SectionCard title="Findings by Severity">
          {sevPieData.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>No findings data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={sevPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {sevPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke={entry.color} strokeWidth={1} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip {...chartTheme.tooltip} />
                <Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Scans by Status - Bar */}
        <SectionCard title="Scans by Status">
          {statusBarData.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>No scan data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusBarData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="status" tick={chartTheme.tick} axisLine={chartTheme.axisLine} tickLine={false} />
                <YAxis tick={chartTheme.tick} axisLine={chartTheme.axisLine} tickLine={false} />
                <Tooltip contentStyle={chartTheme.tooltip.contentStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusBarData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#44ffe1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Scans timeline - Line */}
        <SectionCard title="Scans – Last 7 Days">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timelineData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="day" tick={chartTheme.tick} axisLine={chartTheme.axisLine} tickLine={false} />
              <YAxis allowDecimals={false} tick={chartTheme.tick} axisLine={chartTheme.axisLine} tickLine={false} />
              <Tooltip contentStyle={chartTheme.tooltip.contentStyle} />
              <Line type="monotone" dataKey="count" stroke="#44ffe1" strokeWidth={2} dot={{ fill: '#44ffe1', r: 3 }} activeDot={{ r: 5 }} name="Scans" />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Top Categories - Horizontal Bar */}
        <SectionCard title="Top Vulnerability Categories">
          {catBarData.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>No category data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={catBarData} margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
                <XAxis type="number" tick={chartTheme.tick} axisLine={chartTheme.axisLine} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...chartTheme.tick, width: 100 }} axisLine={chartTheme.axisLine} tickLine={false} width={100} />
                <Tooltip contentStyle={chartTheme.tooltip.contentStyle} />
                <Bar dataKey="count" fill="#ff8800" radius={[0, 4, 4, 0]} name="Findings" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
