import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../editor/LanguageSelect.jsx';
import { useRoomStore } from '../../store/roomStore.js';

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
      setError('Please provide a room name');
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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create New Room</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LeetCode Practice, React Component Review"
              required
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Programming Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={styles.select}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Visibility</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                />
                <span style={styles.radioText}>
                  <strong>Public</strong> (Anyone with room link can join)
                </span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                />
                <span style={styles.radioText}>
                  <strong>Private</strong> (Requires invite or view token)
                </span>
              </label>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Default Member Role</label>
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value)}
              style={styles.select}
            >
              <option value="editor">Editor (Can edit code, chat, execute)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={styles.submitButton}
            >
              {isSubmitting ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
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
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
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
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
    color: '#f8fafc',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
  },
  error: {
    padding: '10px 12px',
    backgroundColor: '#451a1a',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: '6px',
    fontSize: '13px',
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
    fontSize: '13px',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  input: {
    padding: '10px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#0f172a',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #475569',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  radioText: {
    fontSize: '13px',
    color: '#cbd5e1',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '12px',
  },
  cancelButton: {
    padding: '9px 16px',
    backgroundColor: '#334155',
    color: '#cbd5e1',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '9px 18px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

