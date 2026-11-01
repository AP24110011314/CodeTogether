import React, { useState } from 'react';
import { Mic, MicOff, Monitor, Radio, Volume2, X } from 'lucide-react';
import { toast } from '../../store/toastStore.js';

export function VoiceLoungeBar({ members = [], currentUser, onClose }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  const toggleMic = () => {
    setIsMuted(!isMuted);
    toast.info(!isMuted ? 'Microphone muted' : 'Microphone unmuted');
  };

  const toggleScreen = () => {
    setIsSharingScreen(!isSharingScreen);
    toast.info(!isSharingScreen ? 'Screen sharing session initiated' : 'Screen sharing stopped');
  };

  return (
    <div className="glass-subtle" style={styles.bar}>
      <div style={styles.left}>
        <div style={styles.liveBadge}>
          <Radio size={13} style={{ color: 'var(--success)' }} />
          <span>Classroom Voice Lounge</span>
        </div>

        {/* Member Audio Avatars */}
        <div style={styles.avatarsRow}>
          {members.slice(0, 5).map((m, i) => (
            <div
              key={m.userId || i}
              style={{
                ...styles.voiceAvatar,
                backgroundColor: m.color || 'var(--primary)',
                boxShadow: m.online && !isMuted ? '0 0 0 2px var(--success)' : 'none',
              }}
              title={`${m.name} (${m.online ? 'Speaking' : 'Muted'})`}
            >
              {m.name ? m.name[0].toUpperCase() : 'U'}
            </div>
          ))}
          {members.length > 5 && (
            <span style={styles.extraCount}>+{members.length - 5}</span>
          )}
        </div>
      </div>

      <div style={styles.right}>
        <button
          onClick={toggleMic}
          className={isMuted ? 'btn btn-danger' : 'btn btn-secondary'}
          style={styles.audioBtn}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
          <span>{isMuted ? 'Muted' : 'Mute'}</span>
        </button>

        <button
          onClick={toggleScreen}
          className={isSharingScreen ? 'btn btn-primary' : 'btn btn-secondary'}
          style={styles.audioBtn}
          title="Toggle screen share presentation"
        >
          <Monitor size={13} />
          <span>{isSharingScreen ? 'Sharing' : 'Screen'}</span>
        </button>

        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ padding: '4px', color: 'var(--text-muted)' }}
          title="Minimize Audio Lounge"
          aria-label="Close voice bar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    borderRadius: 0,
    borderBottom: '1px solid var(--glass-border-subtle)',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    backgroundColor: 'var(--glass-bg-subtle)',
    zIndex: 18,
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  liveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  avatarsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  voiceAvatar: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '0.6875rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
  },
  extraCount: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    marginLeft: '2px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  audioBtn: {
    padding: '3px 8px',
    fontSize: '0.6875rem',
    height: '24px',
    gap: '4px',
  },
};

