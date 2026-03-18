import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Dashboard';
import SecurityTools from './SecurityTools';
import ScanResults from './ScanResults';
import Findings from './Findings';
import Analytics from './Analytics';
import './neonTheme.css';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      onLogin();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#181825' }}>
      <div style={{ background: '#222234', border: '1px solid #44ffe1', borderRadius: 12, padding: '2rem', width: 360, boxShadow: '0 0 32px #44ffe133' }}>
        <h1 style={{ color: '#44ffe1', textAlign: 'center', marginBottom: '1.5rem', textShadow: '0 0 8px #44ffe1' }}>
          ⚔️ SWARM SUITE
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>USERNAME</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', background: '#181825', border: '1px solid #44ffe155', borderRadius: 6, padding: '0.5rem', color: '#fcfcfc', marginTop: 4, boxSizing: 'border-box' }}
              placeholder="admin"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#aaa', fontSize: '0.85rem' }}>PASSWORD</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', background: '#181825', border: '1px solid #44ffe155', borderRadius: 6, padding: '0.5rem', color: '#fcfcfc', marginTop: 4, boxSizing: 'border-box' }}
              placeholder="••••••••"
            />
          </div>
          {error && <div style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: '#44ffe1', color: '#181825', border: 'none', borderRadius: 6, padding: '0.75rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
            {loading ? 'Connecting...' : 'LOGIN'}
          </button>
        </form>
        <p style={{ color: '#555', textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
          Demo: admin / admin123
        </p>
      </div>
    </div>
  );
}

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('access_token'));

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tools" element={<SecurityTools />} />
          <Route path="scans" element={<ScanResults />} />
          <Route path="findings" element={<Findings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
