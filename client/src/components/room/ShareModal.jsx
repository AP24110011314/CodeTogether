import React, { useState } from 'react';
import { useRoomStore } from '../../store/roomStore.js';
import { regenerateInviteApi } from '../../api/rooms.js';
import { Share2, Copy, Check, RotateCcw, X, Lock, Eye, Edit3 } from 'lucide-react';

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
            <h3 style={styles.title}>Share Collaborative Workspace</h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p style={styles.subtitle}>
          Invite students or team members to <strong>{room.name}</strong> ({room.visibility.toUpperCase()}).
        </p>

        {/* Editor Link */}
        <div style={styles.linkSection}>
          <div style={styles.labelRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={14} style={{ color: 'var(--primary)' }} />
              <label style={styles.label}>
                {isPrivate ? 'Editor Invite Link' : 'Public Room Link (Editor Role)'}
              </label>
            </div>
            <span style={styles.roleHint}>Can edit code, chat & run</span>
          </div>
          <div style={styles.inputRow}>
            <input
              type="text"
              readOnly
              value={editorLink}
              className="input-glass"
              style={styles.input}
            />
            <button
              onClick={() => copyToClipboard(editorLink, 'editor')}
              className="btn btn-primary"
              style={styles.copyBtn}
            >
              {copiedLink === 'editor' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink === 'editor' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Viewer Link */}
        <div style={styles.linkSection}>
          <div style={styles.labelRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} style={{ color: 'var(--secondary)' }} />
              <label style={styles.label}>Read-Only Viewer Link</label>
            </div>
            <span style={styles.roleHint}>Observation mode</span>
          </div>
          <div style={styles.inputRow}>
            <input
              type="text"
              readOnly
              value={viewerLink}
              className="input-glass"
              style={styles.input}
            />
            <button
              onClick={() => copyToClipboard(viewerLink, 'viewer')}
              className="btn btn-secondary"
              style={styles.copyBtn}
            >
              {copiedLink === 'viewer' ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
              <span>{copiedLink === 'viewer' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Owner Regenerate Action */}
        {isOwner && (
          <div style={styles.regenerateSection}>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="btn btn-secondary"
              style={styles.regenerateBtn}
            >
              <RotateCcw size={14} />
              <span>{isRegenerating ? 'Regenerating Tokens...' : 'Regenerate Secret Tokens'}</span>
            </button>
            <p style={styles.regenDesc}>
              Invalidates prior invite tokens. Useful if a link was shared unintendedly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  modalBox: {
    width: '100%',
    maxWidth: '540px',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--glass-border-subtle)',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  linkSection: {
    marginBottom: '18px',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  roleHint: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
  },
  copyBtn: {
    padding: '8px 14px',
    fontSize: '0.8125rem',
    flexShrink: 0,
    gap: '6px',
  },
  regenerateSection: {
    marginTop: '22px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
  regenerateBtn: {
    padding: '8px 14px',
    fontSize: '0.8125rem',
    gap: '6px',
  },
  regenDesc: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
  },
};
