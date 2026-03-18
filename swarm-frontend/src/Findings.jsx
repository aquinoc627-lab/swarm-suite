import React, { useEffect, useState, useCallback } from 'react';
import { getFindings, getFindingsSummary, updateFinding } from './api';
import SeverityBadge from './SeverityBadge';

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

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

function ExpandedFinding({ finding, onStatusChange }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      await updateFinding(finding.id, { status });
      onStatusChange(finding.id, status);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <tr>
      <td colSpan={8} style={{ background: '#181825', padding: '1.2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {finding.description && (
              <div className="neon-card">
                <h4 style={{ color: '#44ffe1', margin: '0 0 0.5rem', fontSize: '0.85rem' }}>Description</h4>
                <p style={{ color: '#ccc', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>{finding.description}</p>
              </div>
            )}
            {finding.remediation && (
              <div style={{ background: '#00ff8811', border: '1px solid #00ff8833', borderRadius: 8, padding: '0.75rem' }}>
                <h4 style={{ color: '#00ff88', margin: '0 0 0.5rem', fontSize: '0.85rem' }}>Remediation</h4>
                <p style={{ color: '#aaa', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>{finding.remediation}</p>
              </div>
            )}
            {finding.evidence && (
              <div>
                <h4 style={{ color: '#ff8800', margin: '0 0 0.5rem', fontSize: '0.85rem' }}>Evidence</h4>
                <pre style={{ background: '#0a0a0a', border: '1px solid #ff880033', borderRadius: 6, padding: '0.75rem', color: '#ff8800', fontSize: '0.78rem', overflowX: 'auto', margin: 0 }}>
                  {finding.evidence}
                </pre>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="neon-card" style={{ fontSize: '0.82rem' }}>
              <h4 style={{ color: '#44ffe1', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>Details</h4>
              {[
                ['Target', finding.target],
                ['Category', finding.category],
                ['Port', finding.port ? `${finding.port}/${finding.protocol || 'tcp'}` : null],
                ['Scan ID', finding.scan_id],
                ['Status', <span style={{ color: '#44ffe1' }}>{finding.status || 'open'}</span>],
                ['Discovered', finding.created_at ? new Date(finding.created_at).toLocaleString() : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', marginBottom: 4 }}>
                  <span style={{ color: '#555', width: 90, flexShrink: 0 }}>{k}:</span>
                  <span style={{ color: '#ccc' }}>{v}</span>
                </div>
              ))}
              {finding.cve_id && (
                <div style={{ display: 'flex', marginBottom: 4 }}>
                  <span style={{ color: '#555', width: 90, flexShrink: 0 }}>CVE:</span>
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${finding.cve_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#ff8800' }}
                  >
                    {finding.cve_id}
                  </a>
                </div>
              )}
            </div>

            {/* Status actions */}
            <div className="neon-card">
              <h4 style={{ color: '#44ffe1', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>Update Status</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { status: 'confirmed', label: 'Confirm', color: '#44ffe1' },
                  { status: 'false_positive', label: 'False Positive', color: '#888' },
                  { status: 'remediated', label: 'Mark Remediated', color: '#00ff88' },
                ].map(({ status, label, color }) => (
                  <button
                    key={status}
                    onClick={() => handleStatus(status)}
                    disabled={updatingStatus || finding.status === status}
                    style={{
                      background: `${color}22`,
                      border: `1px solid ${color}55`,
                      color,
                      borderRadius: 6, padding: '4px 12px',
                      fontSize: '0.8rem', cursor: 'pointer',
                      opacity: finding.status === status ? 0.5 : 1,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [filters, setFilters] = useState({ severity: '', category: '', status: '', search: '' });

  const fetchData = useCallback(() => {
    Promise.allSettled([
      getFindings(),
      getFindingsSummary(),
    ]).then(([f, s]) => {
      if (f.status === 'fulfilled') {
        const raw = Array.isArray(f.value.data) ? f.value.data : f.value.data?.items || [];
        // Sort by severity
        raw.sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));
        setFindings(raw);
      } else {
        setError('Failed to load findings');
      }
      if (s.status === 'fulfilled') setSummary(s.value.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = (id, status) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  // Derive categories for filter
  const categories = [...new Set(findings.map(f => f.category).filter(Boolean))];

  const filtered = findings.filter(f => {
    if (filters.severity && f.severity !== filters.severity) return false;
    if (filters.category && f.category !== filters.category) return false;
    if (filters.status && f.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (f.title || '').toLowerCase().includes(q) ||
        (f.target || '').toLowerCase().includes(q) ||
        (f.cve_id || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div style={{ color: '#44ffe1', padding: '2rem' }}>Loading findings...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: '#44ffe1', margin: 0, textShadow: '0 0 8px #44ffe1' }}>Findings</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SEV_ORDER.map(sev => {
            const cnt = summary?.by_severity?.[sev] ?? summary?.[sev] ?? 0;
            return (
              <span key={sev} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <SeverityBadge severity={sev} />
                <span style={{ color: '#888', fontSize: '0.82rem' }}>{cnt}</span>
              </span>
            );
          })}
        </div>
      </div>

      {error && <div style={{ color: '#ff4d4d', marginBottom: '1rem' }}>{error}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select
          className="neon-input"
          value={filters.severity}
          onChange={e => setFilters(p => ({ ...p, severity: e.target.value }))}
        >
          <option value="">All Severities</option>
          {SEV_ORDER.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          className="neon-input"
          value={filters.category}
          onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="neon-input"
          value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          {['open', 'confirmed', 'false_positive', 'remediated'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <input
          className="neon-input"
          placeholder="Search title, target, CVE..."
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          style={{ minWidth: 200 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: '#555', textAlign: 'center', padding: '3rem' }}>No findings match filters</div>
      ) : (
        <div className="neon-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="neon-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Title</th>
                <th>Category</th>
                <th>Target</th>
                <th>Scan</th>
                <th>Status</th>
                <th>CVE</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(finding => (
                <React.Fragment key={finding.id}>
                  <tr onClick={() => setExpanded(expanded === finding.id ? null : finding.id)}>
                    <td><SeverityBadge severity={finding.severity} /></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fcfcfc' }}>
                      {finding.title || '—'}
                    </td>
                    <td style={{ color: '#888', fontSize: '0.8rem' }}>{finding.category || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#aaa', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {finding.target || '—'}
                    </td>
                    <td style={{ color: '#555', fontSize: '0.78rem' }}>{finding.scan_id ? `#${String(finding.scan_id).slice(0, 8)}` : '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: finding.status === 'remediated' ? '#00ff88' : finding.status === 'false_positive' ? '#888' : '#ccc' }}>
                      {finding.status || 'open'}
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      {finding.cve_id
                        ? <a href={`https://nvd.nist.gov/vuln/detail/${finding.cve_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ff8800' }} onClick={e => e.stopPropagation()}>{finding.cve_id}</a>
                        : <span style={{ color: '#333' }}>—</span>
                      }
                    </td>
                    <td style={{ color: '#555', fontSize: '0.78rem' }}>{timeAgo(finding.created_at)}</td>
                  </tr>
                  {expanded === finding.id && (
                    <ExpandedFinding finding={finding} onStatusChange={handleStatusChange} />
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
