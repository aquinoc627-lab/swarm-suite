import React, { useRef, useEffect, useState } from 'react';

export default function TerminalEmulator({ output = '', title = 'Terminal Output', height = '400px' }) {
  const bottomRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const lines = (output || '').split('\n');

  return (
    <div className="terminal-container" style={{ padding: 0 }}>
      {/* Mac-style title bar */}
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
        </div>
        <span style={{ color: '#555', fontSize: '0.8rem', flex: 1, textAlign: 'center' }}>{title}</span>
        <button
          onClick={handleCopy}
          style={{ background: 'none', border: '1px solid #333', color: '#555', borderRadius: 4, padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Output area */}
      <div
        className="terminal-output"
        style={{ height, padding: '0.8rem 1rem', overflowY: 'auto' }}
      >
        {lines.map((line, i) => (
          <div key={i} className="terminal-line">
            <span style={{ color: '#444', userSelect: 'none', marginRight: 8 }}>
              {String(i + 1).padStart(3, ' ')}
            </span>
            {line || '\u00A0'}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
