import React from 'react';

export function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd/Ctrl + Enter', description: 'Run code in sandbox' },
    { key: 'Cmd/Ctrl + S', description: 'Save current code as snippet' },
    { key: 'Cmd/Ctrl + B', description: 'Toggle right side panel (Chat / Users)' },
    { key: 'Cmd/Ctrl + J', description: 'Toggle bottom panel (Output / Stdin)' },
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'Escape', description: 'Close any open modal or dialog' },
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>⌨️ Keyboard Shortcuts</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.list}>
          {shortcuts.map((s, idx) => (
            <div key={idx} style={styles.item}>
              <span style={styles.description}>{s.description}</span>
              <kbd style={styles.kbd}>{s.key}</kbd>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <span style={styles.footerText}>
            Tip: Press <kbd style={styles.smallKbd}>?</kbd> anytime to open this guide.
          </span>
          <button onClick={onClose} style={styles.dismissButton}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    padding: '24px',
    color: '#f8fafc',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  description: {
    fontSize: '13px',
    color: '#cbd5e1',
  },
  kbd: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#38bdf8',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #334155',
  },
  footerText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  smallKbd: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: '11px',
    color: '#cbd5e1',
  },
  dismissButton: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

