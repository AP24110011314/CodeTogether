import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../editor/LanguageSelect.jsx';
import { useRoomStore } from '../../store/roomStore.js';
import { X, PlusCircle, Globe, Lock, Loader2, Sparkles } from 'lucide-react';

export function CreateRoomModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [visibility, setVisibility] = useState('public');
  const [defaultRole, setDefaultRole] = useState('editor');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRoom = useRoomStore((state) => state.createRoom);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a workspace title');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await createRoom({
        name: name.trim(),
        language,
        visibility,
        defaultRole,
      });
      setName('');
      onCreated(data.room);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h3 style={styles.title}>New Collaborative Workspace</h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={styles.closeBtn} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div role="alert" style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Workspace Title</label>
            <input
              type="text"
              className="input-glass"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Distributed Systems Lab, Binary Search Tree Demo"
              required
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Language Runtime</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-glass"
              style={{ cursor: 'pointer' }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} style={{ background: 'var(--bg-base)' }}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Visibility & Access</label>
            <div style={styles.visibilityGrid}>
              <div
                onClick={() => setVisibility('public')}
                className={visibility === 'public' ? 'glass' : 'glass-subtle'}
                style={{
                  ...styles.visCard,
                  borderColor: visibility === 'public' ? 'var(--primary)' : 'var(--glass-border-subtle)',
                }}
              >
                <div style={styles.visIconWrapper}>
                  <Globe size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={styles.visTitle}>Public Classroom</div>
                  <div style={styles.visDesc}>Anyone with the room link can join and collaborate</div>
                </div>
              </div>

              <div
                onClick={() => setVisibility('private')}
                className={visibility === 'private' ? 'glass' : 'glass-subtle'}
                style={{
                  ...styles.visCard,
                  borderColor: visibility === 'private' ? 'var(--accent)' : 'var(--glass-border-subtle)',
                }}
              >
                <div style={styles.visIconWrapper}>
                  <Lock size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div style={styles.visTitle}>Private Workspace</div>
                  <div style={styles.visDesc}>Only explicit invitees or secret token holders can enter</div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Default Participant Permission</label>
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value)}
              className="input-glass"
              style={{ cursor: 'pointer' }}
            >
              <option value="editor" style={{ background: 'var(--bg-base)' }}>
                Editor (Can write code, execute runs & chat)
              </option>
              <option value="viewer" style={{ background: 'var(--bg-base)' }}>
                Viewer (Read-only observation mode)
              </option>
            </select>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  modalBox: {
    width: '100%',
    maxWidth: '520px',
    padding: '24px',
    boxShadow: 'var(--glass-shadow-lg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--glass-border-subtle)',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  closeBtn: {
    padding: '6px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
  },
  errorBox: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--danger)',
    fontSize: '0.8125rem',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  visibilityGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
  },
  visCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
  },
  visIconWrapper: {
    marginTop: '2px',
  },
  visTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  visDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
};
