import React, { useState } from 'react';
import { MdWarning } from 'react-icons/md';

export default function KillSwitch() {
  const [loading, setLoading] = useState(false);
  const [armed, setArmed] = useState(false);

  const handleAbort = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch('/api/system/abort-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert("CRITICAL OVERRIDE SUCCESSFUL: " + data.message);
        window.location.reload(); // Refresh to show aborted status
      } else {
        alert("OVERRIDE FAILED: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      alert("NETWORK ERROR: " + err.message);
    } finally {
      setLoading(false);
      setArmed(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '250px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      {armed && (
        <button 
          onClick={handleAbort}
          disabled={loading}
          style={{
            background: '#ff0040',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '4px',
            padding: '8px 24px',
            fontFamily: 'Fira Code, monospace',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            textTransform: 'uppercase',
            boxShadow: '0 0 20px #ff0040',
            cursor: 'pointer',
            animation: 'pulseRed 0.5s infinite alternate'
          }}
        >
          {loading ? 'ABORTING...' : 'CONFIRM OVERRIDE'}
        </button>
      )}

      <button 
        onClick={() => setArmed(!armed)}
        style={{
          background: armed ? 'transparent' : 'rgba(255, 0, 64, 0.2)',
          color: '#ff0040',
          border: '1px solid #ff0040',
          borderRadius: '4px',
          padding: '8px 16px',
          fontFamily: 'Fira Code, monospace',
          fontWeight: 'bold',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(4px)'
        }}
      >
        <MdWarning size={16} /> 
        {armed ? 'CANCEL' : 'KILL SWITCH'}
      </button>
    </div>
  );
}
