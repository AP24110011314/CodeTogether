import React from 'react';
import { useRoomStore } from '../../store/roomStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { Users, Edit2, Circle } from 'lucide-react';

export function UserList() {
  const { members, awarenessUsers } = useRoomStore();
  const currentUser = useAuthStore((state) => state.user);

  // Group awareness by user ID
  const typingUserIds = new Set(
    awarenessUsers.filter((a) => a.typing).map((a) => a.user?.id)
  );
  const activeAwarenessUserIds = new Set(
    awarenessUsers.map((a) => a.user?.id)
  );

  // Combine members list with awareness
  const memberUserIds = new Set(members.map((m) => m.userId));
  const extraAwarenessUsers = awarenessUsers.filter(
    (a) => a.user?.id && !memberUserIds.has(a.user.id)
  );

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'owner':
        return {
          backgroundColor: 'rgba(124, 147, 255, 0.15)',
          color: 'var(--primary)',
          borderColor: 'rgba(124, 147, 255, 0.3)',
        };
      case 'editor':
        return {
          backgroundColor: 'rgba(45, 212, 191, 0.15)',
          color: 'var(--secondary)',
          borderColor: 'rgba(45, 212, 191, 0.3)',
        };
      default:
        return {
          backgroundColor: 'rgba(100, 116, 139, 0.15)',
          color: 'var(--text-muted)',
          borderColor: 'rgba(100, 116, 139, 0.3)',
        };
    }
  };

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} style={{ color: 'var(--primary)' }} />
          <span style={styles.title}>Participants</span>
        </div>
        <span className="badge-glass badge-secondary">
          {onlineCount} active
        </span>
      </div>

      <div style={styles.list}>
        {members.map((m) => {
          const isCurrentUser = m.userId === currentUser?.id;
          const isTyping = typingUserIds.has(m.userId);
          const hasCursor = activeAwarenessUserIds.has(m.userId);

          return (
            <div key={m.userId} className="glass-subtle" style={styles.userCard}>
              <div style={styles.avatarContainer}>
                <div
                  style={{
                    ...styles.avatar,
                    backgroundColor: m.color || 'var(--primary)',
                  }}
                >
                  {m.name ? m.name[0].toUpperCase() : 'U'}
                </div>
                <div
                  style={{
                    ...styles.statusDot,
                    backgroundColor: m.online ? 'var(--success)' : 'var(--text-muted)',
                  }}
                  title={m.online ? 'Online' : 'Offline'}
                />
              </div>

              <div style={styles.userInfo}>
                <div style={styles.nameRow}>
                  <span style={styles.name} title={m.name}>
                    {m.name}
                  </span>
                  {isCurrentUser && (
                    <span className="badge-glass badge-primary" style={{ fontSize: '0.625rem' }}>
                      You
                    </span>
                  )}
                  <span
                    className="badge-glass"
                    style={{
                      ...getRoleBadgeStyle(m.role),
                      fontSize: '0.625rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    {m.role || 'editor'}
                  </span>
                </div>

                <div style={styles.statusRow}>
                  {isTyping ? (
                    <div style={styles.typingContainer}>
                      <Edit2 size={11} style={{ color: 'var(--primary)' }} />
                      <span style={styles.typingText}>typing...</span>
                    </div>
                  ) : hasCursor && m.online ? (
                    <span style={styles.cursorActiveText}>• active in editor</span>
                  ) : (
                    <span style={styles.offlineText}>
                      {m.online ? 'idle' : 'offline'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Guest awareness users */}
        {extraAwarenessUsers.map((a) => {
          const isCurrentUser = a.user.id === currentUser?.id;
          return (
            <div key={a.clientId} className="glass-subtle" style={styles.userCard}>
              <div style={styles.avatarContainer}>
                <div
                  style={{
                    ...styles.avatar,
                    backgroundColor: a.user.color || 'var(--primary)',
                  }}
                >
                  {a.user.name ? a.user.name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ ...styles.statusDot, backgroundColor: 'var(--success)' }} />
              </div>
              <div style={styles.userInfo}>
                <div style={styles.nameRow}>
                  <span style={styles.name}>{a.user.name}</span>
                  {isCurrentUser && (
                    <span className="badge-glass badge-primary" style={{ fontSize: '0.625rem' }}>
                      You
                    </span>
                  )}
                </div>
                <div style={styles.statusRow}>
                  <span style={styles.cursorActiveText}>• connected</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  header: {
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--glass-border-subtle)',
    backgroundColor: 'var(--glass-bg-subtle)',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '0.8125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: '-1px',
    right: '-1px',
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    border: '2px solid var(--bg-base)',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '2px',
  },
  name: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusRow: {
    fontSize: '0.6875rem',
  },
  typingContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--primary)',
    fontWeight: '500',
  },
  typingText: {
    color: 'var(--primary)',
  },
  cursorActiveText: {
    color: 'var(--secondary)',
  },
  offlineText: {
    color: 'var(--text-muted)',
  },
};
