import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgents, getMissions, getScans, getFindingsSummary, getBanter } from './api';
import SeverityBadge from './SeverityBadge';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({ label, value, sub, color = '#44ffe1', onClick }) {
  return (
    <div className="neon-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', flex: 1, minWidth: 140 }}>
      <div style={{ color: '#888', fontSize: '0.75rem', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      {sub && <div style={{ color: '#555', fontSize: '0.78rem', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [missions, setMissions] = useState([]);
  const [scans, setScans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [banter, setBanter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getAgents(),
      getMissions(),
      getScans({ limit: 10 }),
      getFindingsSummary(),
      getBanter(),
    ]).then(([a, m, s, f, b]) => {
      if (a.status === 'fulfilled') setAgents(a.value.data || []);
      if (m.status === 'fulfilled') setMissions(m.value.data || []);
      if (s.status === 'fulfilled') setScans(Array.isArray(s.value.data) ? s.value.data : s.value.data?.items || []);
      if (f.status === 'fulfilled') setSummary(f.value.data);
      if (b.status === 'fulfilled') setBanter(Array.isArray(b.value.data) ? b.value.data.slice(0, 8) : []);
      setLoading(false);
    }).catch(() => { setError('Failed to load dashboard'); setLoading(false); });
  }, []);

  const openFindings = summary ? (summary.open || summary.total || 0) : 0;
  const criticalCount = summary?.by_severity?.critical || summary?.critical || 0;
  const highCount = summary?.by_severity?.high || summary?.high || 0;
  const recentScans = scans.slice(0, 5);
  const runningScans = scans.filter(s => s.status === 'running').length;
  const activeMissions = missions.filter(m => m.status === 'active').length;

  if (loading) return <div style={{ color: '#44ffe1', padding: '2rem' }}>Loading dashboard...</div>;
  if (error) return <div style={{ color: '#ff4d4d', padding: '2rem' }}>{error}</div>;

  return (
    <div>
      <h2 style={{ color: '#44ffe1', marginBottom: '1.5rem', textShadow: '0 0 8px #44ffe1' }}>
        Dashboard
      </h2>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatCard label="Total Agents" value={agents.length} sub={`${agents.filter(a => a.status === 'active').length} active`} />
        <StatCard label="Active Missions" value={activeMissions} sub={`${missions.length} total`} color="#ff8800" />
        <StatCard label="Total Scans" value={scans.length} sub={`${runningScans} running`} color="#00ff88" onClick={() => navigate('/scans')} />
        <StatCard label="Open Findings" value={openFindings} sub={`${criticalCount} critical, ${highCount} high`} color="#ff4d4d" onClick={() => navigate('/findings')} />
      </div>

      {/* Security summary bar */}
      {summary && (
        <div className="neon-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: '0.8rem', marginRight: 8 }}>FINDINGS SUMMARY</span>
          {['critical', 'high', 'medium', 'low', 'info'].map(sev => {
            const cnt = summary?.by_severity?.[sev] ?? summary?.[sev] ?? 0;
            return (
              <span key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SeverityBadge severity={sev} />
                <span style={{ color: '#ccc', fontWeight: 'bold' }}>{cnt}</span>
              </span>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Scans */}
        <div className="neon-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#44ffe1', margin: 0, fontSize: '0.95rem' }}>Recent Scans</h3>
            <button className="neon-btn outline" style={{ fontSize: '0.75rem', padding: '3px 10px' }} onClick={() => navigate('/scans')}>
              View All
            </button>
          </div>
          {recentScans.length === 0 ? (
            <div style={{ color: '#555', fontSize: '0.85rem' }}>No scans yet</div>
          ) : (
            <table className="neon-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map(scan => (
                  <tr key={scan.id} onClick={() => navigate('/scans')}>
                    <td>{scan.tool_id || scan.tool || '—'}</td>
                    <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.target || '—'}</td>
                    <td><span className={`status-${scan.status}`}>{scan.status}</span></td>
                    <td style={{ color: '#555', fontSize: '0.8rem' }}>{timeAgo(scan.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity Feed */}
        <div className="neon-card">
          <h3 style={{ color: '#44ffe1', margin: '0 0 1rem', fontSize: '0.95rem' }}>Activity Feed</h3>
          {banter.length === 0 ? (
            <div style={{ color: '#555', fontSize: '0.85rem' }}>No activity yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {banter.map((item, i) => (
                <div key={item.id || i} style={{ padding: '0.5rem', background: '#181825', borderRadius: 6, borderLeft: '2px solid #44ffe133' }}>
                  <div style={{ color: '#ccc', fontSize: '0.82rem' }}>{item.message || item.content || JSON.stringify(item)}</div>
                  <div style={{ color: '#444', fontSize: '0.72rem', marginTop: 2 }}>{timeAgo(item.created_at || item.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
