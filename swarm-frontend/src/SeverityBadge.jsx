import React from 'react';

const SEVERITY_COLORS = {
  critical: { bg: '#ff000033', color: '#ff4d4d', border: '#ff4d4d44', label: 'CRITICAL' },
  high:     { bg: '#ff880033', color: '#ff8800', border: '#ff880044', label: 'HIGH' },
  medium:   { bg: '#ffff0033', color: '#ffff00', border: '#ffff0044', label: 'MEDIUM' },
  low:      { bg: '#00ffff33', color: '#44ffe1', border: '#44ffe144', label: 'LOW' },
  info:     { bg: '#88888833', color: '#888888', border: '#88888844', label: 'INFO' },
};

export default function SeverityBadge({ severity, size = 'sm' }) {
  const key = (severity || 'info').toLowerCase();
  const s = SEVERITY_COLORS[key] || SEVERITY_COLORS.info;
  const padding = size === 'lg' ? '4px 12px' : '2px 8px';
  const fontSize = size === 'lg' ? '0.85rem' : '0.72rem';

  return (
    <span style={{
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      padding,
      borderRadius: 4,
      fontSize,
      fontWeight: 'bold',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap',
      textShadow: `0 0 6px ${s.color}55`,
    }}>
      {s.label}
    </span>
  );
}
