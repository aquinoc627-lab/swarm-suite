import React, { useEffect, useState } from 'react';
import { getMissions } from './api';

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

const STATUS_COLORS = {
  active:    '#44ffe1',
  completed: '#00ff88',
  paused:    '#ffff00',
  failed:    '#ff4d4d',
  planning:  '#ff8800',
};

export default function MissionTimeline() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMissions()
      .then(r => setMissions(Array.isArray(r.data) ? r.data : r.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="neon-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ color: '#44ffe1', margin: 0, fontSize: '0.9rem', letterSpacing: 1 }}>MISSION TIMELINE</h3>

      {loading ? (
        <div style={{ color: '#555', fontSize: '0.85rem' }}>Loading...</div>
      ) : missions.length === 0 ? (
        <div style={{ color: '#555', fontSize: '0.85rem' }}>No missions yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {missions.map((mission, i) => {
            const color = STATUS_COLORS[mission.status] || '#888';
            return (
              <div key={mission.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Timeline dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
                  {i < missions.length - 1 && <div style={{ width: 1, flex: 1, background: '#333', minHeight: 20, marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fcfcfc', fontWeight: 'bold', fontSize: '0.88rem' }}>{mission.name}</span>
                    <span style={{ color, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{mission.status}</span>
                  </div>
                  {mission.description && (
                    <div style={{ color: '#666', fontSize: '0.78rem', marginTop: 2 }}>{mission.description}</div>
                  )}
                  <div style={{ color: '#444', fontSize: '0.72rem', marginTop: 2 }}>{timeAgo(mission.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
