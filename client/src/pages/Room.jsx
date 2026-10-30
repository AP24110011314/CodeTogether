import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/roomStore.js';
import { useAuthStore } from '../store/authStore.js';
import { Toolbar } from '../components/editor/Toolbar.jsx';
import { CodeEditor } from '../components/editor/CodeEditor.jsx';
import { UserList } from '../components/presence/UserList.jsx';
import { ChatPanel } from '../components/chat/ChatPanel.jsx';
import { ShareModal } from '../components/room/ShareModal.jsx';
import { MembersModal } from '../components/room/MembersModal.jsx';
import { initSocket, disconnectSocket, getSocket } from '../lib/socket.js';

export default function Room() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const {
    room,
    role,
    members,
    isLoading,
    error,
    loadRoom,
    setRoom,
    setMembers,
    setMessages,
    addMessage,
    unreadMessagesCount,
    incrementUnread,
    clearUnread,
    setLanguage,
    setConnectionStatus,
  } = useRoomStore();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  // Tabs for right side panel and bottom panel
  const [sideTab, setSideTab] = useState('chat'); // 'chat' | 'users'
  const sideTabRef = useRef(sideTab);
  sideTabRef.current = sideTab;

  const [bottomTab, setBottomTab] = useState('output'); // 'output' | 'stdin' | 'history'
  const [isBottomOpen, setIsBottomOpen] = useState(true);

  // Initial room REST fetch
  useEffect(() => {
    const invite = searchParams.get('invite');
    const view = searchParams.get('view');
    const query = {};
    if (invite) query.invite = invite;
    if (view) query.view = view;

    loadRoom(slug, query).catch(() => {});
  }, [slug, searchParams, loadRoom]);

  // Socket.IO Room Session Connection
  useEffect(() => {
    if (!accessToken || !room?.id) return;

    setConnectionStatus('connecting');
    const socket = initSocket(accessToken);

    socket.on('connect', () => {
      setConnectionStatus('connected');
      const invite = searchParams.get('invite');
      const view = searchParams.get('view');

      socket.emit(
        'room:join',
        {
          slug,
          inviteToken: invite,
          viewToken: view,
        },
        (ack) => {
          if (ack?.ok) {
            setRoom(ack.room, ack.role);
            if (ack.members) setMembers(ack.members);
            if (ack.messages) setMessages(ack.messages);
          }
        }
      );
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('chat:message', (msg) => {
      addMessage(msg);
      if (sideTabRef.current !== 'chat') {
        incrementUnread();
      }
    });

    socket.on('room:members', (updatedMembers) => {
      setMembers(updatedMembers);
    });

    socket.on('room:language', ({ language }) => {
      setLanguage(language);
    });

    socket.on('room:role-changed', ({ userId, role: newRole }) => {
      if (userId === user?.id) {
        setRoom({ ...room }, newRole);
      }
    });

    socket.on('room:kicked', () => {
      alert('You have been removed from this room');
      navigate('/');
    });

    socket.on('room:error', (err) => {
      console.warn('Room socket error:', err);
    });

    return () => {
      if (socket.connected) {
        socket.emit('room:leave', { roomId: room.id });
      }
      disconnectSocket();
      setConnectionStatus('disconnected');
    };
  }, [
    accessToken,
    room?.id,
    slug,
    searchParams,
    setRoom,
    setMembers,
    setMessages,
    addMessage,
    incrementUnread,
    setLanguage,
    setConnectionStatus,
    user?.id,
    navigate,
  ]);

  if (isLoading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading workspace...</p>
      </div>
    );
  }

  if (error) {
    const isForbidden = error.code === 'FORBIDDEN' || error.response?.status === 403;
    return (
      <div style={styles.centerContainer}>
        <div style={styles.errorCard}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <h2 style={styles.errorTitle}>
            {isForbidden ? 'Access Denied' : 'Unable to Load Room'}
          </h2>
          <p style={styles.errorSubtitle}>
            {typeof error === 'object' && error.message
              ? error.message
              : 'This room is private or does not exist.'}
          </p>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div style={styles.container}>
      <Toolbar
        onShareClick={() => setIsShareOpen(true)}
        onMembersClick={() => setIsMembersOpen(true)}
      />

      <div style={styles.workspace}>
        {/* Main Editor & Bottom Panel Area */}
        <div style={styles.editorArea}>
          <div style={styles.editorContainer}>
            <CodeEditor />
          </div>

          {/* Bottom Panel */}
          <div style={styles.bottomPanel}>
            <div style={styles.bottomHeader}>
              <div style={styles.bottomTabs}>
                <button
                  onClick={() => {
                    setBottomTab('output');
                    setIsBottomOpen(true);
                  }}
                  style={{
                    ...styles.panelTab,
                    ...(isBottomOpen && bottomTab === 'output' ? styles.activePanelTab : {}),
                  }}
                >
                  Output
                </button>
                <button
                  onClick={() => {
                    setBottomTab('stdin');
                    setIsBottomOpen(true);
                  }}
                  style={{
                    ...styles.panelTab,
                    ...(isBottomOpen && bottomTab === 'stdin' ? styles.activePanelTab : {}),
                  }}
                >
                  Stdin
                </button>
                <button
                  onClick={() => {
                    setBottomTab('history');
                    setIsBottomOpen(true);
                  }}
                  style={{
                    ...styles.panelTab,
                    ...(isBottomOpen && bottomTab === 'history' ? styles.activePanelTab : {}),
                  }}
                >
                  Run History
                </button>
              </div>

              <button
                onClick={() => setIsBottomOpen(!isBottomOpen)}
                style={styles.collapseButton}
                title={isBottomOpen ? 'Collapse panel' : 'Expand panel'}
              >
                {isBottomOpen ? '▼' : '▲'}
              </button>
            </div>

            {isBottomOpen && (
              <div style={styles.bottomContent}>
                {bottomTab === 'output' && (
                  <div style={styles.outputBox}>
                    <span style={{ color: '#64748b' }}>
                      Ready. Click "▶ Run" in toolbar or press Cmd/Ctrl+Enter to execute.
                    </span>
                  </div>
                )}
                {bottomTab === 'stdin' && (
                  <textarea
                    placeholder="Provide standard input (stdin) for program execution..."
                    style={styles.stdinTextarea}
                  />
                )}
                {bottomTab === 'history' && (
                  <div style={styles.outputBox}>
                    <span style={{ color: '#64748b' }}>No execution runs yet.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Panel: Chat & Presence */}
        <div style={styles.sidePanel}>
          <div style={styles.sideHeader}>
            <button
              onClick={() => {
                setSideTab('chat');
                clearUnread();
              }}
              style={{
                ...styles.sideTab,
                ...(sideTab === 'chat' ? styles.activeSideTab : {}),
              }}
            >
              <span>💬 Chat</span>
              {unreadMessagesCount > 0 && sideTab !== 'chat' && (
                <span style={styles.unreadBadge}>{unreadMessagesCount}</span>
              )}
            </button>
            <button
              onClick={() => setSideTab('users')}
              style={{
                ...styles.sideTab,
                ...(sideTab === 'users' ? styles.activeSideTab : {}),
              }}
            >
              👥 Online ({onlineCount}/{members.length || 1})
            </button>
          </div>

          <div style={styles.sideContent}>
            {sideTab === 'chat' ? <ChatPanel /> : <UserList />}
          </div>
        </div>
      </div>

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
      <MembersModal isOpen={isMembersOpen} onClose={() => setIsMembersOpen(false)} />
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  workspace: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRight: '1px solid #334155',
  },
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  bottomPanel: {
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  bottomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 12px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
  },
  bottomTabs: {
    display: 'flex',
    gap: '4px',
  },
  panelTab: {
    padding: '6px 12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  activePanelTab: {
    backgroundColor: '#1e293b',
    color: '#38bdf8',
  },
  collapseButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '10px',
    padding: '4px 8px',
  },
  bottomContent: {
    height: '160px',
    padding: '12px',
    overflowY: 'auto',
    backgroundColor: '#090d16',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  outputBox: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stdinTextarea: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    color: '#f8fafc',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  sidePanel: {
    width: '320px',
    backgroundColor: '#1e293b',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sideHeader: {
    display: 'flex',
    borderBottom: '1px solid #334155',
    backgroundColor: '#0f172a',
  },
  sideTab: {
    flex: 1,
    padding: '10px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '10px',
  },
  activeSideTab: {
    color: '#38bdf8',
    borderBottom: '2px solid #38bdf8',
    backgroundColor: '#1e293b',
  },
  sideContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 0,
  },
  chatPlaceholder: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  emptyNotice: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '13px',
    padding: '16px',
  },
  chatInputRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '12px',
  },
  chatInput: {
    flex: 1,
    padding: '8px 10px',
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '13px',
  },
  sendButton: {
    padding: '8px 12px',
    backgroundColor: '#334155',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '13px',
    color: '#ffffff',
    flexShrink: 0,
  },
  userDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  youBadge: {
    fontSize: '10px',
    color: '#38bdf8',
    fontWeight: '600',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  userRoleTag: {
    fontSize: '11px',
    color: '#94a3b8',
    backgroundColor: '#1e293b',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  centerContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #334155',
    borderTopColor: '#38bdf8',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '36px',
    textAlign: 'center',
    maxWidth: '460px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '0 0 8px 0',
  },
  errorSubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0 0 20px 0',
    lineHeight: '1.5',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
