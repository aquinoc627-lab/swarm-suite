import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { MdVpnKey, MdContentCopy, MdDeleteSweep, MdAdd, MdWarning } from 'react-icons/md';
import './ApiKeys.css';

export default function ApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentlyGenerated, setRecentlyGenerated] = useState(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch('/api/keys/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch('/api/keys/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName })
      });
      if (res.ok) {
        const data = await res.json();
        setRecentlyGenerated(data);
        setNewKeyName('');
        fetchKeys();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to create key");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this API key? This will immediately break any CI/CD pipelines using it.")) return;
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    if (recentlyGenerated?.raw_key) {
      navigator.clipboard.writeText(recentlyGenerated.raw_key);
      alert("API Key copied to clipboard!");
    }
  };

  if (user?.tier !== 'commander' && user?.tier !== 'nexus_prime') {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "64px 24px", marginTop: "24px" }}>
        <h2 style={{ color: "#ff0040", marginBottom: "16px" }}>Clearance Denied</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Headless API Access requires Commander or Nexus Prime clearance.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2><MdVpnKey style={{ verticalAlign: "middle", marginRight: 8, color: "var(--neon-yellow)" }} /> API Integrations (CI/CD)</h2>
        <p>Manage Headless API Keys for integrating Autonomous AI Agents into your deployment pipelines.</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Generate New API Key</h3>
        </div>
        
        {recentlyGenerated && (
          <div className="api-key-alert">
            <div className="alert-icon"><MdWarning /></div>
            <div className="alert-content">
              <h4>Save this key now!</h4>
              <p>This is the only time your full API key will be displayed. If you lose it, you must generate a new one.</p>
              <div className="key-display-box">
                <code>{recentlyGenerated.raw_key}</code>
                <button className="btn btn-secondary btn-sm" onClick={handleCopy}><MdContentCopy /> Copy</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <input
            type="text"
            className="input"
            placeholder="Key Name (e.g. 'Jenkins Pipeline', 'GitHub Actions')"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            style={{ flex: 1, maxWidth: '400px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,230,0,0.3)', color: '#fff', padding: '10px 16px', borderRadius: '8px' }}
          />
          <button 
            className="btn btn-primary" 
            onClick={handleCreate} 
            disabled={!newKeyName || loading}
            style={{ background: 'var(--neon-yellow)', color: '#000', border: 'none' }}
          >
            <MdAdd /> Generate Key
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '24px' }}>
        <div className="panel-header">
          <h3>Active Integration Keys</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key Prefix</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No API keys found.</td></tr>
            ) : (
              keys.map(k => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 'bold' }}>{k.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>{k.key_prefix}********</td>
                  <td>{new Date(k.created_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${k.is_active ? 'active' : 'error'}`}>
                      {k.is_active ? 'ACTIVE' : 'REVOKED'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleRevoke(k.id)}
                      disabled={!k.is_active}
                      style={{ color: '#ff0040', borderColor: '#ff0040' }}
                    >
                      <MdDeleteSweep /> Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
