import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTools, getMissions, launchScan } from './api';

const SEVERITY_STYLES = {
  info:    { color: '#44ffe1', label: 'INFO' },
  warning: { color: '#ffff00', label: 'WARN' },
  danger:  { color: '#ff4d4d', label: 'DANGER' },
};

const CATEGORY_COLORS = {
  recon:       '#44ffe1',
  scan:        '#00ff88',
  exploit:     '#ff4d4d',
  post:        '#ff8800',
  web:         '#aa44ff',
  network:     '#4488ff',
  default:     '#888',
};

function categoryColor(cat) {
  return CATEGORY_COLORS[(cat || '').toLowerCase()] || CATEGORY_COLORS.default;
}

function ToolCard({ tool, onClick }) {
  const sev = SEVERITY_STYLES[tool.severity] || SEVERITY_STYLES.info;
  const isDanger = tool.severity === 'danger' || tool.requires_confirmation;
  return (
    <div
      className={`tool-card${isDanger ? ' danger' : ''}`}
      onClick={() => onClick(tool)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ color: '#fcfcfc', fontWeight: 'bold', fontSize: '0.95rem' }}>{tool.name}</span>
        {tool.requires_confirmation && (
          <span style={{ fontSize: '0.8rem' }} title="Destructive action">⚠️</span>
        )}
      </div>
      <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 10px', lineHeight: 1.5 }}>
        {tool.description || 'No description'}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tool.category && (
          <span style={{
            background: `${categoryColor(tool.category)}22`,
            color: categoryColor(tool.category),
            border: `1px solid ${categoryColor(tool.category)}44`,
            borderRadius: 4, fontSize: '0.72rem', padding: '2px 8px', fontWeight: 'bold'
          }}>
            {tool.category.toUpperCase()}
          </span>
        )}
        <span style={{
          background: `${sev.color}22`,
          color: sev.color,
          border: `1px solid ${sev.color}44`,
          borderRadius: 4, fontSize: '0.72rem', padding: '2px 8px', fontWeight: 'bold'
        }}>
          {sev.label}
        </span>
      </div>
    </div>
  );
}

function ParamInput({ param, value, onChange }) {
  const type = param.type || 'string';
  if (type === 'boolean') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          style={{ accentColor: '#44ffe1' }}
        />
        {param.description || param.name}
      </label>
    );
  }
  if (type === 'select' && param.options) {
    return (
      <select
        className="neon-input"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%' }}
      >
        <option value="">Select...</option>
        {param.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input
      type={type === 'number' ? 'number' : 'text'}
      className="neon-input"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={param.default !== undefined ? String(param.default) : param.description || ''}
      style={{ width: '100%', boxSizing: 'border-box' }}
    />
  );
}

function LaunchModal({ tool, missions, onClose, onLaunched }) {
  const [target, setTarget] = useState('');
  const [params, setParams] = useState({});
  const [missionId, setMissionId] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = target.trim() &&
    (!tool.requires_confirmation || confirmText === 'CONFIRM');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const cleanParams = {};
      (tool.parameters || []).forEach(p => {
        if (params[p.name] !== undefined && params[p.name] !== '') {
          cleanParams[p.name] = params[p.name];
        } else if (p.default !== undefined) {
          cleanParams[p.name] = p.default;
        }
      });
      await launchScan({
        name: `${tool.name} of ${target}`,
        tool_id: tool.id,
        target: target.trim(),
        parameters: cleanParams,
        mission_id: missionId || null,
      });
      onLaunched();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Launch failed');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
          <div>
            <h2 style={{ color: '#44ffe1', margin: 0, fontSize: '1.1rem' }}>{tool.name}</h2>
            <p style={{ color: '#888', fontSize: '0.82rem', margin: '4px 0 0' }}>{tool.description}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {tool.requires_confirmation && (
          <div style={{ background: '#ff000022', border: '1px solid #ff4d4d55', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ color: '#ff4d4d', fontSize: '0.85rem' }}>⚠️ This is a destructive action. Review carefully before launching.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#aaa', fontSize: '0.82rem', display: 'block', marginBottom: 4 }}>TARGET *</label>
            <input
              className="neon-input"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="IP, domain, or URL"
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {(tool.parameters || []).map(param => (
            <div key={param.name} style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#aaa', fontSize: '0.82rem', display: 'block', marginBottom: 4 }}>
                {(param.name || '').toUpperCase()}{param.required ? ' *' : ''}
                {param.description && <span style={{ color: '#555', fontWeight: 'normal', marginLeft: 6 }}>— {param.description}</span>}
              </label>
              <ParamInput
                param={param}
                value={params[param.name]}
                onChange={v => setParams(prev => ({ ...prev, [param.name]: v }))}
              />
            </div>
          ))}

          {missions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#aaa', fontSize: '0.82rem', display: 'block', marginBottom: 4 }}>MISSION (optional)</label>
              <select
                className="neon-input"
                value={missionId}
                onChange={e => setMissionId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">None</option>
                {missions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          {tool.requires_confirmation && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#ff8800', fontSize: '0.82rem', display: 'block', marginBottom: 4 }}>
                Type <strong>CONFIRM</strong> to proceed
              </label>
              <input
                className="neon-input"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="CONFIRM"
                style={{ width: '100%', boxSizing: 'border-box', borderColor: '#ff4d4d55' }}
              />
            </div>
          )}

          {error && <div style={{ color: '#ff4d4d', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="neon-btn outline" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className={`neon-btn${tool.requires_confirmation ? ' danger' : ''}`}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Launching...' : 'Launch Scan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SecurityTools() {
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.allSettled([getTools(), getMissions()]).then(([t, m]) => {
      if (t.status === 'fulfilled') setTools(Array.isArray(t.value.data) ? t.value.data : t.value.data?.items || []);
      if (m.status === 'fulfilled') setMissions(Array.isArray(m.value.data) ? m.value.data : []);
      if (t.status === 'rejected') setError('Failed to load tools');
      setLoading(false);
    });
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLaunched = () => {
    setSelectedTool(null);
    showToast('✅ Scan queued!');
    setTimeout(() => navigate('/scans'), 1000);
  };

  // Group tools by category
  const grouped = tools.reduce((acc, t) => {
    const cat = t.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  if (loading) return <div style={{ color: '#44ffe1', padding: '2rem' }}>Loading tools...</div>;
  if (error) return <div style={{ color: '#ff4d4d', padding: '2rem' }}>{error}</div>;

  return (
    <div>
      <h2 style={{ color: '#44ffe1', marginBottom: '1.5rem', textShadow: '0 0 8px #44ffe1' }}>
        Security Tools
      </h2>

      {tools.length === 0 && (
        <div style={{ color: '#555', padding: '2rem', textAlign: 'center' }}>No tools available</div>
      )}

      {Object.entries(grouped).map(([category, catTools]) => (
        <div key={category} style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: categoryColor(category), fontSize: '0.85rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, height: 1, background: `${categoryColor(category)}33` }} />
            {category}
            <span style={{ flex: 1, height: 1, background: `${categoryColor(category)}33` }} />
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {catTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onClick={setSelectedTool} />
            ))}
          </div>
        </div>
      ))}

      {selectedTool && (
        <LaunchModal
          tool={selectedTool}
          missions={missions}
          onClose={() => setSelectedTool(null)}
          onLaunched={handleLaunched}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#222234', border: '1px solid #44ffe1', borderRadius: 8,
          padding: '0.75rem 1.5rem', color: '#44ffe1', fontWeight: 'bold',
          boxShadow: '0 0 20px #44ffe133', zIndex: 2000,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
