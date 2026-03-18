import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { MdDashboard, MdSecurity, MdRadar, MdBugReport, MdBarChart, MdLogout } from 'react-icons/md';
import { logout } from './api';

const navItems = [
  { path: '/', icon: MdDashboard, label: 'Dashboard' },
  { path: '/tools', icon: MdSecurity, label: 'Security Tools' },
  { path: '/scans', icon: MdRadar, label: 'Scans' },
  { path: '/findings', icon: MdBugReport, label: 'Findings' },
  { path: '/analytics', icon: MdBarChart, label: 'Analytics' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#181825', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        minWidth: 220,
        background: '#141420',
        borderRight: '1px solid #44ffe122',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0',
      }}>
        {/* Logo */}
        <div style={{ padding: '0.5rem 1.2rem 1.5rem', borderBottom: '1px solid #44ffe122' }}>
          <div style={{ color: '#44ffe1', fontWeight: 'bold', fontSize: '1.1rem', textShadow: '0 0 8px #44ffe1', letterSpacing: 1 }}>
            ⚔️ SWARM SUITE
          </div>
          <div style={{ color: '#555', fontSize: '0.7rem', marginTop: 2, letterSpacing: 2 }}>OFFENSIVE SECURITY</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} />
                <span style={{ fontSize: '0.9rem' }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem 0.5rem', borderTop: '1px solid #44ffe122' }}>
          <button
            onClick={logout}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}
          >
            <MdLogout size={18} />
            <span style={{ fontSize: '0.9rem' }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          background: '#1a1a2e',
          borderBottom: '1px solid #44ffe122',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 52,
        }}>
          <div style={{ color: '#44ffe1', fontSize: '0.85rem', letterSpacing: 2, textTransform: 'uppercase' }}>
            {navItems.find(n => n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path))?.label || 'Dashboard'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#00ff88',
              boxShadow: '0 0 6px #00ff88', animation: 'pulse 2s infinite'
            }} />
            <span style={{ color: '#555', fontSize: '0.8rem' }}>SYSTEM ONLINE</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid #44ffe111',
          padding: '0.5rem 1.5rem',
          color: '#333',
          fontSize: '0.75rem',
          textAlign: 'center',
        }}>
          SWARM SUITE | Offensive Cybersecurity Platform
        </footer>
      </div>
    </div>
  );
}
