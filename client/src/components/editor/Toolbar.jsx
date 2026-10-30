import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSelect } from './LanguageSelect.jsx';
import { useRoomStore } from '../../store/roomStore.js';
import { getSocket } from '../../lib/socket.js';

export function Toolbar({ onShareClick, onMembersClick }) {
  const navigate = useNavigate();
  const {
    room,
    role,
    language,
    members,
    preferences,
    setTheme,
    setFontSize,
    setMinimap,
    setLanguage,
  } = useRoomStore();

  const isViewer = role === 'viewer';

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const socket = getSocket();
    if (socket && socket.connected && room?.id) {
      socket.emit('room:language', { roomId: room.id, language: newLang });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftGroup}>
        <button
          onClick={() => navigate('/')}
          title="Back to Dashboard"
          style={styles.backButton}
        >
          &larr;
        </button>
        <span style={styles.roomName}>{room?.name || 'Workspace'}</span>
        <span
          style={{
            ...styles.roleBadge,
            backgroundColor:
              role === 'owner'
                ? '#8b5cf6'
                : role === 'editor'
                ? '#10b981'
                : '#64748b',
          }}
        >
          {role?.toUpperCase()}
        </span>
      </div>

      <div style={styles.centerGroup}>
        <div style={styles.controlItem}>
          <label style={styles.controlLabel}>Lang:</label>
          <LanguageSelect
            value={language}
            onChange={handleLanguageChange}
            disabled={isViewer}
          />
        </div>

        <div style={styles.controlItem}>
          <label style={styles.controlLabel}>Theme:</label>
          <select
            value={preferences.theme}
            onChange={(e) => setTheme(e.target.value)}
            style={styles.select}
          >
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>

        <div style={styles.controlItem}>
          <label style={styles.controlLabel}>Font:</label>
          <select
            value={preferences.fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={styles.select}
          >
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
            <option value={20}>20px</option>
          </select>
        </div>

        <button
          onClick={() => setMinimap(!preferences.minimap)}
          style={{
            ...styles.toggleButton,
            backgroundColor: preferences.minimap ? '#0284c7' : '#334155',
          }}
          title="Toggle Minimap"
        >
          Map {preferences.minimap ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={styles.rightGroup}>
        <button
          disabled={isViewer}
          style={{
            ...styles.runButton,
            opacity: isViewer ? 0.5 : 1,
            cursor: isViewer ? 'not-allowed' : 'pointer',
          }}
          title={isViewer ? 'Viewers cannot execute code' : 'Execute code (Cmd/Ctrl+Enter)'}
        >
          ▶ Run
        </button>
        <button
          onClick={onShareClick}
          style={styles.actionButton}
          title="Share room link"
        >
          Share
        </button>
        <button
          onClick={onMembersClick}
          style={styles.actionButton}
          title="View room members"
        >
          Members ({members?.length || room?.members?.length || 1})
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '52px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    color: '#f8fafc',
    gap: '12px',
    flexShrink: 0,
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '200px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },
  roomName: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#f8fafc',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px',
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  centerGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  controlItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  controlLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  select: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '5px 8px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  },
  toggleButton: {
    border: 'none',
    borderRadius: '6px',
    padding: '5px 9px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  runButton: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontWeight: '700',
    fontSize: '13px',
    transition: 'background-color 0.2s',
  },
  actionButton: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

