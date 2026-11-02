import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/roomStore.js';
import { useAuthStore } from '../store/authStore.js';
import { Toolbar } from '../components/editor/Toolbar.jsx';
import { CodeEditor } from '../components/editor/CodeEditor.jsx';
import { StatusBar } from '../components/editor/StatusBar.jsx';
import { UserList } from '../components/presence/UserList.jsx';
import { ChatPanel } from '../components/chat/ChatPanel.jsx';
import { AiMentorPanel } from '../components/room/AiMentorPanel.jsx';
import { VoiceLoungeBar } from '../components/room/VoiceLoungeBar.jsx';
import { ChallengesModal } from '../components/room/ChallengesModal.jsx';
import { ShareModal } from '../components/room/ShareModal.jsx';
import { MembersModal } from '../components/room/MembersModal.jsx';
import { SaveSnippetModal } from '../components/snippet/SaveSnippetModal.jsx';
import { InsertSnippetModal } from '../components/snippet/InsertSnippetModal.jsx';
import { OutputPanel } from '../components/editor/OutputPanel.jsx';
import { ShortcutsModal } from '../components/common/ShortcutsModal.jsx';
import { MobileBottomNav } from '../components/room/MobileBottomNav.jsx';
import { toast } from '../store/toastStore.js';
import { getLanguagesApi, getRoomRunsApi } from '../api/runs.js';
import { initSocket, disconnectSocket, getSocket } from '../lib/socket.js';
import {
  MessageSquare,
  Users,
  Brain,
  X,
  RefreshCw,
  Lock,
  ArrowLeft,
  Loader2,
  Target,
  Sparkles,
} from 'lucide-react';

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
    language,
    stdin,
    activeRun,
    setActiveRun,
    setLatestRunResult,
    addRun,
    setRuns,
    setAvailableLanguages,
    setRunError,
    setLanguage,
    connectionStatus,
    setConnectionStatus,
  } = useRoomStore();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isSaveSnippetOpen, setIsSaveSnippetOpen] = useState(false);
  const [isInsertSnippetOpen, setIsInsertSnippetOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSideOpen, setIsSideOpen] = useState(window.innerWidth >= 900);
  const [snippetSourceCode, setSnippetSourceCode] = useState('');
  const [sideTab, setSideTab] = useState('chat'); // 'chat' | 'users' | 'ai'
  const [bottomTab, setBottomTab] = useState('output'); // 'output' | 'stdin' | 'history'
  const [isBottomOpen, setIsBottomOpen] = useState(false);
  const [mobileView, setMobileView] = useState('code'); // 'code' | 'console' | 'chat' | 'ai' | 'users'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    if (room?.name) {
      document.title = `${room.name} — CodeTogether`;
    } else {
      document.title = 'Workspace — CodeTogether';
    }
  }, [room?.name]);

  const editorRef = useRef(null);
  const sideTabRef = useRef(sideTab);
  useEffect(() => {
    sideTabRef.current = sideTab;
  }, [sideTab]);

  const handleOpenSaveSnippet = () => {
    let codeToSave = '';
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      const selection = editorRef.current.getSelection();
      if (selection && !selection.isEmpty()) {
        codeToSave = model.getValueInRange(selection);
      } else if (model) {
        codeToSave = model.getValue();
      }
    }
    setSnippetSourceCode(codeToSave);
    setIsSaveSnippetOpen(true);
  };

  const handleInsertSnippet = (code) => {
    if (!editorRef.current) return;
    const selection = editorRef.current.getSelection();
    if (selection) {
      editorRef.current.executeEdits('snippet-insert', [
        {
          range: selection,
          text: code,
          forceMoveMarkers: true,
        },
      ]);
    }
  };

  const handleLoadChallenge = (challenge) => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (model) {
      const fullRange = model.getFullModelRange();
      editorRef.current.executeEdits('challenge-load', [
        {
          range: fullRange,
          text: challenge.starterCode,
          forceMoveMarkers: true,
        },
      ]);
      if (challenge.language && challenge.language !== language) {
        setLanguage(challenge.language);
        const socket = getSocket();
        if (socket && socket.connected && room?.id) {
          socket.emit('room:language', { roomId: room.id, language: challenge.language });
        }
      }
      toast.success(`Loaded challenge: ${challenge.title}`);
    }
  };

  const handleRunCode = () => {
    if (role === 'viewer') return;
    const socket = getSocket();
    if (!socket || !socket.connected || !room?.id) return;

    setRunError(null);
    setActiveRun({
      status: 'queued',
      by: { id: user?.id, name: user?.name },
    });
    setBottomTab('output');
    setIsBottomOpen(true);

    if (window.innerWidth < 768) {
      setMobileView('console');
    }

    socket.emit(
      'run:start',
      {
        roomId: room.id,
        stdin: stdin || '',
      },
      (ack) => {
        if (!ack?.ok) {
          setActiveRun(null);
          setRunError(ack?.error?.message || 'Failed to start execution');
        }
      }
    );
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
        return;
      }

      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleOpenSaveSnippet();
        return;
      }

      if (isCmdOrCtrl && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSideOpen((prev) => !prev);
        return;
      }

      if (isCmdOrCtrl && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsBottomOpen((prev) => !prev);
        return;
      }

      if (e.key === '?' && !e.target.matches('input, textarea, [contenteditable="true"]')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsShareOpen(false);
        setIsMembersOpen(false);
        setIsSaveSnippetOpen(false);
        setIsInsertSnippetOpen(false);
        setIsShortcutsOpen(false);
        setIsChallengesOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [role, room?.id, stdin, user]);

  // Responsive auto-collapse under 900px & mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (window.innerWidth < 900) {
        setIsSideOpen(false);
      } else {
        setIsSideOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load language runtimes at mount
  useEffect(() => {
    getLanguagesApi()
      .then((data) => {
        if (data.languages) {
          setAvailableLanguages(data.languages);
        }
      })
      .catch((err) => console.warn('Could not probe sandbox languages:', err));
  }, [setAvailableLanguages]);

  // Load execution history on room change
  useEffect(() => {
    if (!room?.id) return;
    getRoomRunsApi(room.id, 20)
      .then((data) => {
        if (data.runs) {
          setRuns(data.runs);
        }
      })
      .catch((err) => console.warn('Could not load runs history:', err));
  }, [room?.id, setRuns]);

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

    socket.on('room:deleted', () => {
      alert('This room has been deleted by the owner');
      navigate('/');
    });

    socket.on('room:error', (err) => {
      console.warn('Room socket error:', err);
    });

    socket.on('run:queued', (payload) => {
      setActiveRun({
        runId: payload.runId,
        status: 'queued',
        position: payload.position,
        by: payload.by,
      });
      setRunError(null);
      setBottomTab('output');
      setIsBottomOpen(true);
    });

    socket.on('run:started', (payload) => {
      setActiveRun({
        runId: payload.runId,
        status: 'running',
        by: payload.by,
      });
      setRunError(null);
    });

    socket.on('run:result', (payload) => {
      const result = payload.run;
      setActiveRun(null);
      setLatestRunResult(result);
      addRun(result);
      setBottomTab('output');
      setIsBottomOpen(true);
      if (window.innerWidth < 768) {
        setMobileView('console');
      }
    });

    return () => {
      socket.emit('room:leave', { roomId: room.id });
      disconnectSocket();
    };
  }, [
    accessToken,
    room?.id,
    slug,
    searchParams,
    navigate,
    setRoom,
    setMembers,
    setMessages,
    addMessage,
    incrementUnread,
    setLanguage,
    setActiveRun,
    setLatestRunResult,
    addRun,
    setRunError,
    setConnectionStatus,
  ]);

  const handleReconnect = () => {
    if (!accessToken || !room?.id) return;
    setConnectionStatus('connecting');
    const socket = initSocket(accessToken);
    socket.connect();
  };

  if (isLoading) {
    return (
      <div style={styles.centerContainer}>
        <div className="glass-strong" style={styles.loadingBox}>
          <div className="mac-traffic-lights" style={{ marginBottom: '14px' }}>
            <span className="mac-dot mac-dot-close" />
            <span className="mac-dot mac-dot-min" />
            <span className="mac-dot mac-dot-max" />
          </div>
          <Loader2 size={28} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', marginBottom: '8px' }} />
          <span style={styles.loadingText}>Initializing Workspace Canvas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const isForbidden = error.code === 'FORBIDDEN' || error.response?.status === 403;
    return (
      <div style={styles.centerContainer}>
        <div className="glass-strong" style={styles.errorCard}>
          <div style={styles.errorIconBox}>
            <Lock size={32} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={styles.errorTitle}>
            {isForbidden ? 'Private Workspace' : 'Unable to Load Room'}
          </h2>
          <p style={styles.errorSubtitle}>
            {typeof error === 'object' && error.message
              ? error.message
              : 'This room requires an invite link or read-only token to join.'}
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ gap: '6px' }}>
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const onlineCount = members.filter((m) => m.online).length;
  const isRunning = Boolean(activeRun && (activeRun.status === 'running' || activeRun.status === 'queued'));

  return (
    <div style={styles.container} className="room-workspace-wrapper">
      {/* Reconnect Banner */}
      {connectionStatus !== 'connected' && (
        <div style={styles.reconnectBanner}>
          <div style={styles.reconnectInfo}>
            <span
              style={{
                ...styles.reconnectDot,
                backgroundColor: connectionStatus === 'connecting' ? 'var(--warning)' : 'var(--danger)',
              }}
            />
            <span>
              {connectionStatus === 'connecting'
                ? 'Connecting to real-time room session...'
                : 'Disconnected from server. Real-time updates paused.'}
            </span>
          </div>
          {connectionStatus === 'disconnected' && (
            <button onClick={handleReconnect} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px' }}>
              <RefreshCw size={12} />
              <span>Reconnect Now</span>
            </button>
          )}
        </div>
      )}

      {/* Classroom Voice Lounge Bar */}
      {isVoiceActive && (
        <VoiceLoungeBar
          members={members}
          currentUser={user}
          onClose={() => setIsVoiceActive(false)}
        />
      )}

      {/* Translucent Toolbar */}
      <Toolbar
        onShareClick={() => setIsShareOpen(true)}
        onMembersClick={() => setIsMembersOpen(true)}
        onSaveSnippetClick={handleOpenSaveSnippet}
        onInsertSnippetClick={() => setIsInsertSnippetOpen(true)}
        onRunClick={handleRunCode}
        onShortcutsClick={() => setIsShortcutsOpen(true)}
        onChallengesClick={() => setIsChallengesOpen(true)}
        onToggleAi={() => {
          setSideTab('ai');
          setIsSideOpen(true);
        }}
        onToggleVoice={() => setIsVoiceActive(!isVoiceActive)}
        isVoiceActive={isVoiceActive}
      />

      {/* Main Workspace Frame */}
      <div style={styles.workspace}>
        {/* Main Editor & Output Panel Area */}
        {(!isMobile || mobileView === 'code' || mobileView === 'console') && (
          <div style={styles.editorArea}>
            <div
              style={{
                ...styles.editorContainer,
                display: isMobile && mobileView === 'console' ? 'none' : 'block',
              }}
            >
              <CodeEditor onEditorMount={(ed) => { editorRef.current = ed; }} />
            </div>

            {/* Status Bar */}
            {(!isMobile || mobileView === 'code') && (
              <StatusBar
                language={language}
                getEditorInstance={() => editorRef.current}
              />
            )}

            {/* Bottom Execution Console */}
            {(!isMobile || mobileView === 'console') && (
              <OutputPanel
                isBottomOpen={isBottomOpen || (isMobile && mobileView === 'console')}
                setIsBottomOpen={(open) => {
                  setIsBottomOpen(open);
                  if (!open && mobileView === 'console') {
                    setMobileView('code');
                  }
                }}
                bottomTab={bottomTab}
                setBottomTab={setBottomTab}
                isMobileFullHeight={isMobile && mobileView === 'console'}
              />
            )}
          </div>
        )}

        {/* Right Side Panel: Chat / Participants / AI Mentor */}
        {((!isMobile && isSideOpen) || (isMobile && (mobileView === 'chat' || mobileView === 'ai' || mobileView === 'users'))) && (
          <aside
            className={`glass ${isMobile ? 'room-side-panel-mobile' : ''}`}
            style={{
              ...styles.sidePanel,
              ...(isMobile ? styles.mobileSidePanel : {}),
            }}
          >
            <div style={styles.sideHeader}>
              <div style={styles.sideHeaderTabs}>
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
                  <MessageSquare size={13} />
                  <span>Chat</span>
                  {unreadMessagesCount > 0 && sideTab !== 'chat' && (
                    <span className="badge-glass badge-primary" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setSideTab('ai')}
                  style={{
                    ...styles.sideTab,
                    ...(sideTab === 'ai' ? styles.activeSideTab : {}),
                  }}
                >
                  <Brain size={13} style={{ color: 'var(--secondary)' }} />
                  <span>AI Tutor</span>
                </button>

                <button
                  onClick={() => setSideTab('users')}
                  style={{
                    ...styles.sideTab,
                    ...(sideTab === 'users' ? styles.activeSideTab : {}),
                  }}
                >
                  <Users size={13} />
                  <span>Peers ({onlineCount})</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsSideOpen(false);
                  if (window.innerWidth < 768) {
                    setMobileView('code');
                  }
                }}
                className="btn-ghost"
                style={styles.sideCollapseBtn}
                title="Close side panel"
                aria-label="Close side panel"
              >
                <X size={15} />
              </button>
            </div>

            <div style={styles.sideContent}>
              {sideTab === 'chat' ? (
                <ChatPanel />
              ) : sideTab === 'ai' ? (
                <AiMentorPanel getEditorCode={() => editorRef.current?.getValue() || ''} />
              ) : (
                <UserList />
              )}
            </div>
          </aside>
        )}

        {/* Floating Toggle Button when side panel is collapsed on desktop */}
        {!isSideOpen && window.innerWidth >= 768 && (
          <button
            onClick={() => setIsSideOpen(true)}
            className="btn btn-primary"
            style={styles.openSideBtn}
            title="Open Chat & Participants (Cmd/Ctrl+B)"
            aria-label="Open sidebar"
          >
            <MessageSquare size={15} />
            <span>Chat ({onlineCount})</span>
            {unreadMessagesCount > 0 && (
              <span className="badge-glass badge-accent" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                {unreadMessagesCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <MobileBottomNav
        activeView={mobileView}
        setActiveView={(view) => {
          setMobileView(view);
          if (view === 'console') {
            setIsBottomOpen(true);
            setIsSideOpen(false);
          } else if (view === 'chat') {
            setSideTab('chat');
            setIsSideOpen(true);
            clearUnread();
          } else if (view === 'ai') {
            setSideTab('ai');
            setIsSideOpen(true);
          } else if (view === 'code') {
            setIsSideOpen(false);
            setIsBottomOpen(false);
          }
        }}
        unreadCount={unreadMessagesCount}
        onlineCount={onlineCount}
        onRunClick={handleRunCode}
        isRunning={isRunning}
      />

      {/* Modals */}
      <ChallengesModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        onLoadChallenge={handleLoadChallenge}
      />
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
      <MembersModal isOpen={isMembersOpen} onClose={() => setIsMembersOpen(false)} />
      <SaveSnippetModal
        isOpen={isSaveSnippetOpen}
        onClose={() => setIsSaveSnippetOpen(false)}
        defaultCode={snippetSourceCode}
        defaultLanguage={language}
      />
      <InsertSnippetModal
        isOpen={isInsertSnippetOpen}
        onClose={() => setIsInsertSnippetOpen(false)}
        onInsert={handleInsertSnippet}
      />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  centerContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  loadingBox: {
    padding: '32px 48px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  errorCard: {
    padding: '40px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '440px',
    width: '100%',
  },
  errorIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  errorSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  reconnectBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--danger)',
    padding: '6px 16px',
    fontSize: '0.75rem',
    borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
    zIndex: 30,
  },
  reconnectInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
  },
  reconnectDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  workspace: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'var(--editor-bg)',
  },
  sidePanel: {
    width: '330px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 0,
    borderTop: 'none',
    borderBottom: 'none',
    borderRight: 'none',
    borderLeft: '1px solid var(--glass-border)',
    overflow: 'hidden',
    flexShrink: 0,
    zIndex: 10,
  },
  mobileSidePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    width: '100%',
    zIndex: 900,
    borderLeft: 'none',
    backgroundColor: 'var(--bg-base)',
  },
  sideHeader: {
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px 0 14px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    backgroundColor: 'var(--glass-bg-subtle)',
    flexShrink: 0,
  },
  sideHeaderTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  sideTab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 8px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition-fast)',
  },
  activeSideTab: {
    background: 'var(--glass-bg-strong)',
    color: 'var(--primary)',
    fontWeight: '600',
    boxShadow: 'var(--glass-shadow)',
  },
  sideCollapseBtn: {
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
  },
  sideContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  openSideBtn: {
    position: 'fixed',
    right: '20px',
    bottom: '60px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.8125rem',
    boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.45)',
    zIndex: 50,
    gap: '8px',
  },
};
