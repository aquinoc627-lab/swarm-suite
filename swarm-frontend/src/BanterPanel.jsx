import React, { useEffect, useState } from 'react';
import { getBanter, postBanter } from './api';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function BanterPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchBanter = () => {
    getBanter()
      .then(r => setMessages(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanter(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      await postBanter({ message: input.trim(), content: input.trim() });
      setInput('');
      fetchBanter();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="neon-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ color: '#44ffe1', margin: 0, fontSize: '0.9rem', letterSpacing: 1 }}>BANTER / ACTIVITY</h3>

      {loading ? (
        <div style={{ color: '#555', fontSize: '0.85rem' }}>Loading...</div>
      ) : (
        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages.length === 0 ? (
            <div style={{ color: '#555', fontSize: '0.85rem' }}>No messages yet</div>
          ) : (
            messages.slice().reverse().map((msg, i) => (
              <div key={msg.id || i} style={{ padding: '0.4rem 0.6rem', background: '#181825', borderRadius: 6, borderLeft: '2px solid #44ffe133' }}>
                <div style={{ color: '#ccc', fontSize: '0.82rem' }}>{msg.message || msg.content || JSON.stringify(msg)}</div>
                {(msg.created_at || msg.timestamp) && (
                  <div style={{ color: '#444', fontSize: '0.7rem', marginTop: 2 }}>{timeAgo(msg.created_at || msg.timestamp)}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          className="neon-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a message..."
          style={{ flex: 1 }}
          disabled={sending}
        />
        <button type="submit" className="neon-btn" disabled={sending || !input.trim()}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
