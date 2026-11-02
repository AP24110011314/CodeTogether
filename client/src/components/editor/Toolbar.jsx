import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSelect } from './LanguageSelect.jsx';
import { useRoomStore } from '../../store/roomStore.js';
import { ThemeToggle } from '../common/ThemeToggle.jsx';
import { getSocket } from '../../lib/socket.js';
import {
  ArrowLeft,
  Play,
  Share2,
  Users,
  BookmarkPlus,
  FileInput,
  Keyboard,
  Loader2,
  Target,
  Brain,
  Volume2,
} from 'lucide-react';

export function Toolbar({
  onShareClick,
  onMembersClick,
  onSaveSnippetClick,
  onInsertSnippetClick,
  onRunClick,
  onShortcutsClick,
  onChallengesClick,
  onToggleAi,
  onToggleVoice,
  isVoiceActive,
}) {
  const navigate = useNavigate();
  const {
    room,
    role,
    language,
    members,
    activeRun,
    preferences,
    setFontSize,
    setMinimap,
    setLanguage,
  } = useRoomStore();

  const isViewer = role === 'viewer';
  const isRunning = Boolean(activeRun && (activeRun.status === 'running' || activeRun.status === 'queued'));

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const socket = getSocket();
    if (socket && socket.connected && room?.id) {
      socket.emit('room:language', { roomId: room.id, language: newLang });
    }
  };

  return (
    <header className="glass" style={styles.container}>
      {/* Left Group: Traffic Lights & Room Meta */}
      <div style={styles.leftGroup}>
        <div className="mac-traffic-lights desktop-only" style={{ marginRight: '6px' }}>
          <span
            className="mac-dot mac-dot-close"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
            title="Return to Dashboard"
          />
          <span
            className="mac-dot mac-dot-min"
            onClick={() => setMinimap(!preferences.minimap)}
            style={{ cursor: 'pointer' }}
            title="Toggle Minimap"
          />
          <span
            className="mac-dot mac-dot-max"
            onClick={!isViewer && !isRunning ? onRunClick : undefined}
            style={{ cursor: !isViewer && !isRunning ? 'pointer' : 'default' }}
            title="Run Code"
          />
        </div>

        <button
          onClick={() => navigate('/')}
          className="btn-ghost"
          style={styles.backBtn}
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} />
        </button>

        <span className="toolbar-room-name" style={styles.roomName} title={room?.name}>
          {room?.name || 'Workspace'}
        </span>

        <span
          className="badge-glass toolbar-role-badge"
          style={{
            backgroundColor:
              role === 'owner'
                ? 'rgba(124, 147, 255, 0.15)'
                : role === 'editor'
                ? 'rgba(45, 212, 191, 0.15)'
                : 'rgba(100, 116, 139, 0.15)',
            color:
              role === 'owner'
                ? 'var(--primary)'
                : role === 'editor'
                ? 'var(--secondary)'
                : 'var(--text-muted)',
            borderColor:
              role === 'owner'
                ? 'rgba(124, 147, 255, 0.3)'
                : role === 'editor'
                ? 'rgba(45, 212, 191, 0.3)'
                : 'rgba(100, 116, 139, 0.3)',
            textTransform: 'uppercase',
            fontSize: '0.6875rem',
            fontWeight: '600',
          }}
        >
          {role || 'editor'}
        </span>
      </div>

      {/* Center Controls: Language, Font, Minimap */}
      <div style={styles.centerGroup}>
        <div style={styles.controlItem}>
          <LanguageSelect
            value={language}
            onChange={handleLanguageChange}
            disabled={isViewer}
          />
        </div>

        <div style={styles.controlItem} className="desktop-only">
          <select
            value={preferences.fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="input-glass"
            style={styles.compactSelect}
            title="Editor Font Size"
          >
            <option value={12} style={{ background: 'var(--bg-base)' }}>12px</option>
            <option value={14} style={{ background: 'var(--bg-base)' }}>14px</option>
            <option value={16} style={{ background: 'var(--bg-base)' }}>16px</option>
            <option value={18} style={{ background: 'var(--bg-base)' }}>18px</option>
          </select>
        </div>

        <button
          onClick={onChallengesClick}
          className="btn btn-secondary desktop-only"
          style={{ padding: '5px 9px', fontSize: '0.75rem', height: '32px', gap: '5px' }}
          title="Pick an educational challenge or template"
        >
          <Target size={13} style={{ color: 'var(--primary)' }} />
          <span>Labs</span>
        </button>

        <button
          onClick={onToggleAi}
          className="btn btn-secondary desktop-only"
          style={{ padding: '5px 9px', fontSize: '0.75rem', height: '32px', gap: '5px' }}
          title="Open AI Code Mentor"
        >
          <Brain size={13} style={{ color: 'var(--secondary)' }} />
          <span>AI Tutor</span>
        </button>
      </div>

      {/* Right Group: Snippets, Run, Share, Members, Theme */}
      <div style={styles.rightGroup}>
        <button
          onClick={onToggleVoice}
          className={isVoiceActive ? 'btn btn-primary desktop-only' : 'btn btn-secondary desktop-only'}
          style={{ padding: '5px 8px', fontSize: '0.75rem', height: '32px', gap: '4px' }}
          title="Toggle Classroom Audio Lounge"
        >
          <Volume2 size={13} />
          <span>Lounge</span>
        </button>

        <button
          onClick={onInsertSnippetClick}
          disabled={isViewer}
          className="btn btn-secondary desktop-only"
          style={styles.actionBtn}
          title="Insert saved snippet at cursor"
        >
          <FileInput size={14} />
          <span>Insert</span>
        </button>

        <button
          onClick={onSaveSnippetClick}
          className="btn btn-secondary desktop-only"
          style={styles.actionBtn}
          title="Save code as snippet (Cmd/Ctrl+S)"
        >
          <BookmarkPlus size={14} />
          <span>Save</span>
        </button>

        <button
          onClick={onRunClick}
          disabled={isViewer || isRunning}
          className="btn btn-primary"
          style={{
            ...styles.runBtn,
            background: isRunning
              ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
              : 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
          }}
          title={
            isViewer
              ? 'Viewers have read-only permissions'
              : isRunning
              ? 'Execution in progress...'
              : 'Execute code (Cmd/Ctrl + Enter)'
          }
        >
          {isRunning ? (
            <>
              <Loader2 size={14} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              <span className="desktop-only">{activeRun.status === 'queued' ? 'Queued' : 'Running'}</span>
            </>
          ) : (
            <>
              <Play size={13} fill="currentColor" />
              <span>Run</span>
            </>
          )}
        </button>

        <button
          onClick={onShareClick}
          className="btn btn-secondary"
          style={styles.actionBtn}
          title="Share room link"
        >
          <Share2 size={14} />
          <span className="desktop-only">Share</span>
        </button>

        <button
          onClick={onMembersClick}
          className="btn btn-secondary desktop-only"
          style={styles.actionBtn}
          title="Manage room participants"
        >
          <Users size={14} />
          <span>{members?.length || room?.members?.length || 1}</span>
        </button>

        <button
          onClick={onShortcutsClick}
          className="btn btn-ghost desktop-only"
          style={{ padding: '6px', color: 'var(--text-muted)' }}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={16} />
        </button>

        <ThemeToggle style={{ height: '32px' }} />
      </div>
    </header>
  );
}

const styles = {
  container: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    borderRadius: '0',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: '1px solid var(--glass-border)',
    gap: '8px',
    flexShrink: 0,
    zIndex: 20,
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  backBtn: {
    padding: '6px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
  },
  roomName: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '160px',
  },
  centerGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  controlItem: {
    display: 'flex',
    alignItems: 'center',
  },
  compactSelect: {
    padding: '4px 6px',
    height: '32px',
    fontSize: '0.75rem',
    width: 'auto',
    cursor: 'pointer',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  actionBtn: {
    padding: '5px 8px',
    fontSize: '0.75rem',
    height: '32px',
    gap: '5px',
  },
  runBtn: {
    padding: '6px 12px',
    fontSize: '0.8125rem',
    height: '32px',
    gap: '5px',
    color: '#FFFFFF',
    fontWeight: '600',
  },
};
