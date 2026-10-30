import React, { useState } from 'react';
import { Copy, Download, Check, Wand2, ShieldCheck, Activity } from 'lucide-react';
import { toast } from '../../store/toastStore.js';

export function StatusBar({ language = 'javascript', getEditorInstance }) {
  const [copied, setCopied] = useState(false);

  const getExtension = (lang) => {
    switch (lang) {
      case 'python': return 'py';
      case 'typescript': return 'ts';
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'java': return 'java';
      case 'go': return 'go';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      default: return 'js';
    }
  };

  const handleCopy = () => {
    const editor = getEditorInstance ? getEditorInstance() : null;
    if (!editor) return;
    const code = editor.getValue();
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const editor = getEditorInstance ? getEditorInstance() : null;
    if (!editor) return;
    const code = editor.getValue();
    const ext = getExtension(language);
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codetogether-workspace.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded codetogether-workspace.${ext}`);
  };

  const handleFormat = () => {
    const editor = getEditorInstance ? getEditorInstance() : null;
    if (!editor) return;
    editor.getAction('editor.action.formatDocument')?.run();
    toast.info('Document formatted');
  };

  return (
    <footer className="glass-subtle" style={styles.statusBar}>
      <div style={styles.statusLeft}>
        <div style={styles.syncIndicator}>
          <span style={styles.syncDot} />
          <span>CRDT Synced</span>
        </div>
        <span style={styles.divider}>•</span>
        <span style={styles.infoItem}>UTF-8</span>
        <span style={styles.divider}>•</span>
        <span style={styles.infoItem}>Spaces: 2</span>
        <span style={styles.divider}>•</span>
        <span style={{ ...styles.infoItem, textTransform: 'capitalize' }}>
          {language} Runtime
        </span>
      </div>

      <div style={styles.statusRight}>
        <button
          onClick={handleFormat}
          className="btn-ghost"
          style={styles.actionBtn}
          title="Format Document (Shift+Alt+F)"
        >
          <Wand2 size={12} />
          <span>Format</span>
        </button>

        <button
          onClick={handleCopy}
          className="btn-ghost"
          style={styles.actionBtn}
          title="Copy full document"
        >
          {copied ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          onClick={handleDownload}
          className="btn-ghost"
          style={styles.actionBtn}
          title="Download code file"
        >
          <Download size={12} />
          <span>Export</span>
        </button>
      </div>
    </footer>
  );
}

const styles = {
  statusBar: {
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    borderRadius: 0,
    borderTop: '1px solid var(--glass-border-subtle)',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    flexShrink: 0,
    zIndex: 10,
  },
  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  syncIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: 'var(--success)',
    fontWeight: '500',
  },
  syncDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
  },
  divider: {
    opacity: 0.4,
  },
  infoItem: {
    color: 'var(--text-secondary)',
  },
  statusRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionBtn: {
    padding: '2px 6px',
    fontSize: '0.6875rem',
    gap: '4px',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-flex',
    alignItems: 'center',
  },
};
