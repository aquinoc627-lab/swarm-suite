import React, { useEffect, useState, useCallback } from 'react';
import { getScans, getScanFindings } from './api';
import SeverityBadge from './SeverityBadge';
import TerminalEmulator from './TerminalEmulator';

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

function duration(start, end) {
  if (!start) return '—';
  const endTime = end ? new Date(end) : new Date();
  const diff = endTime - new Date(start);
  if (!end) return `running ${Math.floor(diff / 1000)}s`;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function SeveritySummary({ counts }) {
  if (!counts) return <span style={{ color: '#555' }}>—</span>;
  const items = [
    { key: 'critical', color: '#ff4d4d', abbr: 'C' },
    { key: 'high', color: '#ff8800', abbr: 'H' },
    { key: 'medium', color: '#ffff00', abbr: 'M' },
    { key: 'low', color: '#44ffe1', abbr: 'L' },
  ];
  return (
    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {items.map(({ key, color, abbr }) => {
        const cnt = counts[key] || 0;
        if (cnt === 0) return null;
        return (
          <span key={key} style={{ color, fontSize: '0.78rem', fontWeight: 'bold' }}>
            {cnt}{abbr}
          </span>
        );
      })}
    </span>
  );
}

const STATUS_TABS = ['all', 'queued', 'running', 'completed', 'failed'];

function ExpandedScan({ scan }) {
  const [findings, setFindings] = useState([]);
  const [loadingF, setLoadingF] = useState(true);

  useEffect(() => {
    getScanFindings(scan.id)
      .then(r => setFindings(Array.isArray(r.data) ? r.data : r.data?.items || []))
      .catch(() => setFindings([]))
      .finally(() => setLoadingF(false));
  }, [scan.id]);

  return (
    <tr>
      <td colSpan={8} style={{ background: '#181825', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Metadata panel */}
          <div className="neon-card" style={{ fontSize: '0.82rem' }}>
            <h4 style={{ color: '#44ffe1', margin: '0 0 0.75rem' }}>Scan Details</h4>
            {[
              ['Tool', scan.tool_id || scan.tool],
              ['Target', scan.target],
              ['Status', <span className={`status-${scan.status}`}>{scan.status}</span>],
              ['Mission', scan.mission_id || '—'],
              ['Agent', scan.agent_id || '—'],
              ['Started', scan.started_at ? new Date(scan.started_at).toLocaleString() : '—'],
              ['Completed', scan.completed_at ? new Date(scan.completed_at).toLocaleString() : '—'],
              ['Duration', duration(scan.started_at, scan.completed_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', marginBottom: 4 }}>
                <span style={{ color: '#555', width: 90, flexShrink: 0 }}>{k}:</span>
                <span style={{ color: '#ccc' }}>{v || '—'}</span>
              </div>
            ))}
          </div>

          {/* Findings table */}
          <div className="neon-card">
            <h4 style={{ color: '#44ffe1', margin: '0 0 0.75rem' }}>Findings ({findings.length})</h4>
            {loadingF ? (
              <div style={{ color: '#555' }}>Loading...</div>
            ) : findings.length === 0 ? (
              <div style={{ color: '#555', fontSize: '0.85rem' }}>No findings</div>
            ) : (
              <table className="neon-table">
                <thead>
                  <tr><th>Severity</th><th>Title</th><th>Category</th></tr>
                </thead>
                <tbody>
                  {findings.map(f => (
                    <tr key={f.id}>
                      <td><SeverityBadge severity={f.severity} /></td>
                      <td style={{ fontSize: '0.8rem' }}>{f.title}</td>
                      <td style={{ fontSize: '0.8rem', color: '#888' }}>{f.category || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Terminal output */}
        {scan.raw_output && (
          <TerminalEmulator output={scan.raw_output} title={`Output: ${scan.tool_id || scan.tool} → ${scan.target}`} height="300px" />
        )}
      </td>
    </tr>
  );
}

export default function ScanResults() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const fetchScans = useCallback(() => {
    getScans()
      .then(r => setScans(Array.isArray(r.data) ? r.data : r.data?.items || []))
      .catch(() => setError('Failed to load scans'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  // Auto-refresh when running/queued scans exist
  useEffect(() => {
    const hasActive = scans.some(s => s.status === 'running' || s.status === 'queued');
    if (!hasActive) return;
    const interval = setInterval(fetchScans, 10000);
    return () => clearInterval(interval);
  }, [scans, fetchScans]);

  const filtered = activeTab === 'all' ? scans : scans.filter(s => s.status === activeTab);

  if (loading) return <div style={{ color: '#44ffe1', padding: '2rem' }}>Loading scans...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#44ffe1', margin: 0, textShadow: '0 0 8px #44ffe1' }}>Scans</h2>
        <button className="neon-btn outline" onClick={fetchScans} style={{ fontSize: '0.82rem' }}>
          ↻ Refresh
        </button>
      </div>

      {error && <div style={{ color: '#ff4d4d', marginBottom: '1rem' }}>{error}</div>}

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#44ffe122' : 'transparent',
              border: `1px solid ${activeTab === tab ? '#44ffe1' : '#44ffe133'}`,
              color: activeTab === tab ? '#44ffe1' : '#888',
              borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontSize: '0.82rem',
              textTransform: 'capitalize',
            }}
          >
            {tab}
            <span style={{ marginLeft: 6, color: '#555', fontSize: '0.75rem' }}>
              ({tab === 'all' ? scans.length : scans.filter(s => s.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: '#555', textAlign: 'center', padding: '3rem' }}>No scans found</div>
      ) : (
        <div className="neon-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="neon-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Target</th>
                <th>Status</th>
                <th>Findings</th>
                <th>Severity</th>
                <th>Duration</th>
                <th>Launched By</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(scan => (
                <React.Fragment key={scan.id}>
                  <tr onClick={() => setExpanded(expanded === scan.id ? null : scan.id)}>
                    <td style={{ color: '#44ffe1' }}>{scan.tool_id || scan.tool || '—'}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.target || '—'}</td>
                    <td>
                      <span className={`status-${scan.status}`} style={{ fontWeight: 'bold', fontSize: '0.82rem' }}>
                        {scan.status === 'running' ? '● ' : ''}{scan.status}
                      </span>
                    </td>
                    <td style={{ color: '#ccc' }}>{scan.findings_count ?? '—'}</td>
                    <td><SeveritySummary counts={scan.severity_counts} /></td>
                    <td style={{ color: '#888', fontSize: '0.8rem' }}>{duration(scan.started_at, scan.completed_at)}</td>
                    <td style={{ color: '#888', fontSize: '0.8rem' }}>{scan.launched_by || scan.user || '—'}</td>
                    <td style={{ color: '#555', fontSize: '0.78rem' }}>{timeAgo(scan.created_at)}</td>
                  </tr>
                  {expanded === scan.id && <ExpandedScan scan={scan} />}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
