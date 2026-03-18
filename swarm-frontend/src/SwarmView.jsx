import React, { useEffect, useState } from 'react';
import { getFindingsSummary, getScans } from './api';
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

export default function SwarmView() {
  const [summary, setSummary] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    getFindingsSummary().then(r => setSummary(r.data)).catch(() => {});
    getScans({ limit: 5 }).then(r => {
      const data = Array.isArray(r.data) ? r.data : r.data?.items || [];
      setRecentScans(data.slice(0, 5));
    }).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Security Summary */}
      {summary && (
        <div className="neon-card">
          <h3 style={{ color: '#44ffe1', margin: '0 0 0.75rem', fontSize: '0.9rem', letterSpacing: 1 }}>
            SECURITY SUMMARY
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#888', fontSize: '0.8rem' }}>Open findings:</span>
            {['critical', 'high', 'medium', 'low', 'info'].map(sev => {
              const cnt = summary?.by_severity?.[sev] ?? summary?.[sev] ?? 0;
              return (
                <span key={sev} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <SeverityBadge severity={sev} />
                  <span style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 'bold' }}>{cnt}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Scan Activity */}
      {recentScans.length > 0 && (
        <div className="neon-card">
          <h3 style={{ color: '#44ffe1', margin: '0 0 0.75rem', fontSize: '0.9rem', letterSpacing: 1 }}>
            RECENT SCAN ACTIVITY
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentScans.map(scan => (
              <div key={scan.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                <span className={`status-${scan.status}`} style={{ width: 70, flexShrink: 0, fontWeight: 'bold' }}>
                  {scan.status}
                </span>
                <span style={{ color: '#44ffe1', flexShrink: 0 }}>{scan.tool_id || scan.tool || 'scan'}</span>
                <span style={{ color: '#666' }}>→</span>
                <span style={{ color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.target}</span>
                <span style={{ color: '#555', marginLeft: 'auto', flexShrink: 0 }}>{timeAgo(scan.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
