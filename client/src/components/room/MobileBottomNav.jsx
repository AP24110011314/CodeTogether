import React from 'react';
import { Code, Terminal, MessageSquare, Brain, Users } from 'lucide-react';

export function MobileBottomNav({
  activeView,
  setActiveView,
  unreadCount = 0,
  onlineCount = 1,
  onRunClick,
  isRunning,
}) {
  return (
    <nav className="glass-strong mobile-bottom-bar" style={styles.navBar}>
      <button
        onClick={() => setActiveView('code')}
        style={{
          ...styles.navBtn,
          color: activeView === 'code' ? 'var(--primary)' : 'var(--text-secondary)',
        }}
      >
        <Code size={18} />
        <span style={styles.navLabel}>Code</span>
      </button>

      <button
        onClick={() => setActiveView('console')}
        style={{
          ...styles.navBtn,
          color: activeView === 'console' ? 'var(--primary)' : 'var(--text-secondary)',
        }}
      >
        <Terminal size={18} />
        <span style={styles.navLabel}>Console</span>
      </button>

      <button
        onClick={onRunClick}
        disabled={isRunning}
        className="btn-primary"
        style={styles.centerRunBtn}
        title="Execute Code"
      >
        <span style={{ fontSize: '0.8125rem' }}>{isRunning ? '⏳' : '▶'}</span>
      </button>

      <button
        onClick={() => setActiveView('chat')}
        style={{
          ...styles.navBtn,
          color: activeView === 'chat' ? 'var(--primary)' : 'var(--text-secondary)',
        }}
      >
        <div style={styles.iconWrapper}>
          <MessageSquare size={18} />
          {unreadCount > 0 && activeView !== 'chat' && (
            <span style={styles.badge}>{unreadCount}</span>
          )}
        </div>
        <span style={styles.navLabel}>Chat</span>
      </button>

      <button
        onClick={() => setActiveView('ai')}
        style={{
          ...styles.navBtn,
          color: activeView === 'ai' ? 'var(--primary)' : 'var(--text-secondary)',
        }}
      >
        <Brain size={18} />
        <span style={styles.navLabel}>AI Mentor</span>
      </button>
    </nav>
  );
}

const styles = {
  navBar: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: 0,
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: '1px solid var(--glass-border)',
    padding: '0 8px',
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    minWidth: '50px',
  },
  iconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-8px',
    backgroundColor: 'var(--accent)',
    color: '#FFFFFF',
    fontSize: '0.625rem',
    fontWeight: '700',
    borderRadius: '8px',
    padding: '1px 4px',
    minWidth: '14px',
    textAlign: 'center',
  },
  navLabel: {
    fontSize: '0.625rem',
    fontWeight: '500',
  },
  centerRunBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.4)',
    marginTop: '-16px',
  },
};

