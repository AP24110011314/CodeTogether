import React from 'react';
import { useRoomStore } from '../../store/roomStore.js';
import { useAuthStore } from '../../store/authStore.js';

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Room Participants</span>
        <span style={styles.badge}>
          {members.filter((m) => m.online).length} online
        </span>
      </div>

      <div style={styles.list}>
        {members.map((m) => {
          const isCurrentUser = m.userId === currentUser?.id;
          const isTyping = typingUserIds.has(m.userId);
          const hasCursor = activeAwarenessUserIds.has(m.userId);

          return (
            <div key={m.userId} style={styles.userCard}>
              <div style={styles.avatarContainer}>
                <div
                  style={{
                    ...styles.avatar,
                    backgroundColor: m.color || '#38bdf8',
                  }}
                >
                  {m.name ? m.name[0].toUpperCase() : 'U'}
                </div>
                <div
                  style={{
                    ...styles.statusDot,
                    backgroundColor: m.online ? '#10b981' : '#64748b',
                  }}
                  title={m.online ? 'Online' : 'Offline'}
                />
              </div>

              <div style={styles.userInfo}>
                <div style={styles.nameRow}>
                  <span style={styles.name} title={m.name}>
                    {m.name}
                  </span>
                  {isCurrentUser && <span style={styles.youBadge}>You</span>}
                  <span
                    style={{
                      ...styles.roleBadge,
                      ...getRoleBadgeStyle(m.role),
                    }}
                  >
                    {m.role || 'editor'}
                  </span>
                </div>

                <div style={styles.statusRow}>
                  {isTyping ? (
                    <div style={styles.typingContainer}>
                      <span style={styles.typingPencil}>✍️</span>
                      <span style={styles.typingText}>typing</span>
                      <span style={styles.dots}>
                        <span style={styles.dot1}>.</span>
                        <span style={styles.dot2}>.</span>
                        <span style={styles.dot3}>.</span>
                      </span>
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

        {/* Any temporary guest awareness users not yet registered in members list */}
        {extraAwarenessUsers.map((a) => {
          const isCurrentUser = a.user.id === currentUser?.id;
          return (
            <div key={`awareness-${a.clientId}`} style={styles.userCard}>
              <div style={styles.avatarContainer}>
                <div
                  style={{
                    ...styles.avatar,
                    backgroundColor: a.user.color || '#38bdf8',
                  }}
                >
                  {a.user.name ? a.user.name[0].toUpperCase() : 'U'}
                </div>
                <div
                  style={{
                    ...styles.statusDot,
                    backgroundColor: '#10b981',
                  }}
                  title="Online"
                />
              </div>

              <div style={styles.userInfo}>
                <div style={styles.nameRow}>
                  <span style={styles.name}>{a.user.name}</span>
                  {isCurrentUser && <span style={styles.youBadge}>You</span>}
                  <span
                    style={{
                      ...styles.roleBadge,
                      ...getRoleBadgeStyle('viewer'),
                    }}
                  >
                    viewer
                  </span>
                </div>

                <div style={styles.statusRow}>
                  {a.typing ? (
                    <div style={styles.typingContainer}>
                      <span style={styles.typingPencil}>✍️</span>
                      <span style={styles.typingText}>typing...</span>
                    </div>
                  ) : (
                    <span style={styles.cursorActiveText}>• active in editor</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getRoleBadgeStyle(role) {
  switch (role) {
    case 'owner':
      return {
        backgroundColor: '#78350f',
        color: '#fef08a',
        borderColor: '#b45309',
      };
    case 'viewer':
      return {
        backgroundColor: '#1e293b',
        color: '#94a3b8',
        borderColor: '#334155',
      };
    case 'editor':
    default:
      return {
        backgroundColor: '#1e3a8a',
        color: '#93c5fd',
        borderColor: '#2563eb',
      };
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0f172a',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  badge: {
    fontSize: '11px',
    color: '#10b981',
    backgroundColor: '#064e3b',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: '500',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    transition: 'background-color 0.15s ease',
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  statusDot: {
    position: 'absolute',
    bottom: '-1px',
    right: '-1px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '2px solid #1e293b',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  name: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#f8fafc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  youBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#38bdf8',
    backgroundColor: '#0369a133',
    padding: '1px 5px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: '500',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid',
    textTransform: 'capitalize',
    marginLeft: 'auto',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '2px',
    minHeight: '16px',
  },
  typingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  typingPencil: {
    fontSize: '11px',
  },
  typingText: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#38bdf8',
  },
  dots: {
    display: 'inline-flex',
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  cursorActiveText: {
    fontSize: '11px',
    color: '#34d399',
  },
  offlineText: {
    fontSize: '11px',
    color: '#64748b',
  },
};

