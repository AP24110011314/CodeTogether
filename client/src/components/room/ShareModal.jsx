import React, { useState } from 'react';
import { useRoomStore } from '../../store/roomStore.js';
import { regenerateInviteApi } from '../../api/rooms.js';

export function ShareModal({ isOpen, onClose }) {
  const { room, role, setRoom } = useRoomStore();
  const [copiedLink, setCopiedLink] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!isOpen || !room) return null;

  const baseUrl = window.location.origin;
  const isOwner = role === 'owner';
  const isPrivate = room.visibility === 'private';

  const editorLink = isPrivate
    ? `${baseUrl}/room/${room.slug}?invite=${room.inviteToken}`
    : `${baseUrl}/room/${room.slug}`;

  const viewerLink = `${baseUrl}/room/${room.slug}?view=${room.viewToken}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerating will invalidate existing invite links. Continue?')) {
      return;
    }
    setIsRegenerating(true);
    try {
      const data = await regenerateInviteApi(room.id);
      setRoom({ ...room, inviteToken: data.inviteToken, viewToken: data.viewToken }, role);
    } catch (err) {
      alert('Failed to regenerate invite tokens');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Share Room</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <p style={styles.subtitle}>
          Invite collaborators to <strong>{room.name}</strong> ({room.visibility.toUpperCase()}).
        </p>

        <div style={styles.linkSection}>
          <label style={styles.label}>
            {isPrivate ? 'Editor Invite Link (Edit & Execute)' : 'Public Room Link (Editor Role)'}
          </label>
          <div style={styles.inputRow}>
            <input
              type="text"
              readOnly
              value={editorLink}
              style={styles.linkInput}
            />
            <button
              onClick={() => copyToClipboard(editorLink, 'editor')}
              style={styles.copyButton}
            >
              {copiedLink === 'editor' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={styles.linkSection}>
          <label style={styles.label}>Read-Only Share Link (Viewer Role)</label>
          <div style={styles.inputRow}>
            <input
              type="text"
              readOnly
              value={viewerLink}
              style={styles.linkInput}
            />
            <button
              onClick={() => copyToClipboard(viewerLink, 'viewer')}
              style={styles.copyButton}
            >
              {copiedLink === 'viewer' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <span style={styles.hint}>
            Recipients using this link will have read-only access and cannot edit or run code.
          </span>
        </div>

        {isOwner && (
          <div style={styles.ownerActions}>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              style={styles.regenButton}
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate Invite Links'}
            </button>
          </div>
        )}
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
    maxWidth: '520px',
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
    marginBottom: '8px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '20px',
  },
  linkSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
  },
  linkInput: {
    flex: 1,
    padding: '9px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '6px',
    color: '#94a3b8',
    fontSize: '13px',
    outline: 'none',
  },
  copyButton: {
    padding: '9px 16px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  hint: {
    fontSize: '12px',
    color: '#64748b',
  },
  ownerActions: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #334155',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  regenButton: {
    padding: '8px 14px',
    backgroundColor: '#334155',
    color: '#f87171',
    border: '1px solid #475569',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};
