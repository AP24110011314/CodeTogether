import React from 'react';
import { Keyboard, X } from 'lucide-react';

export function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd/Ctrl + Enter', description: 'Run code in sandbox' },
    { key: 'Cmd/Ctrl + S', description: 'Save current code as snippet' },
    { key: 'Cmd/Ctrl + B', description: 'Toggle right side panel (Chat / Users)' },
    { key: 'Cmd/Ctrl + J', description: 'Toggle bottom panel (Output / Stdin)' },
    { key: '?', description: 'Show keyboard shortcuts cheatsheet' },
    { key: 'Escape', description: 'Close any open modal or dialog' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="glass-strong modal-content"
        onClick={(e) => e.stopPropagation()}
        style={styles.modalBox}
      >
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="mac-traffic-lights">
              <span className="mac-dot mac-dot-close" onClick={onClose} style={{ cursor: 'pointer' }} />
              <span className="mac-dot mac-dot-min" />
              <span className="mac-dot mac-dot-max" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Keyboard size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={styles.title}>Keyboard Shortcuts</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={styles.list}>
          {shortcuts.map((s, idx) => (
            <div key={idx} className="glass-subtle" style={styles.item}>
              <span style={styles.description}>{s.description}</span>
              <kbd style={styles.kbd}>{s.key}</kbd>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <span style={styles.footerText}>
            Tip: Press <kbd style={styles.smallKbd}>?</kbd> anywhere in the editor to open this cheatsheet.
          </span>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '6px 14px' }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalBox: {
    width: '100%',
    maxWidth: '500px',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--glass-border-subtle)',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
  },
  description: {
    fontSize: '0.8125rem',
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  kbd: {
    backgroundColor: 'var(--glass-bg-strong)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '3px 8px',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--primary)',
    fontWeight: '600',
    boxShadow: 'var(--glass-shadow)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  smallKbd: {
    backgroundColor: 'var(--glass-bg-subtle)',
    border: '1px solid var(--glass-border)',
    borderRadius: '3px',
    padding: '1px 5px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
  },
};
