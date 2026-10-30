import React, { useState, useEffect, useRef } from 'react';
import { useRoomStore } from '../../store/roomStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { getSocket } from '../../lib/socket.js';
import { getRoomMessagesApi } from '../../api/messages.js';

export function ChatPanel() {
  const { room, messages, prependMessages, hasMoreMessages, setHasMoreMessages } =
    useRoomStore();
  const currentUser = useAuthStore((state) => state.user);

  const [inputText, setInputText] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const listContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Auto-scroll to bottom on new message if already near bottom
  useEffect(() => {
    if (isNearBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleScroll = async () => {
    const el = listContainerRef.current;
    if (!el) return;

    // Check if user is near bottom (within 100px)
    const threshold = 100;
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    isNearBottomRef.current = isNearBottom;

    // If scrolled to top and more history available, load older messages
    if (el.scrollTop === 0 && hasMoreMessages && !isLoadingMore && room?.id && messages.length > 0) {
      setIsLoadingMore(true);
      const oldestMessage = messages[0];
      const previousScrollHeight = el.scrollHeight;

      try {
        const data = await getRoomMessagesApi(room.id, {
          before: oldestMessage.createdAt,
          limit: 30,
        });

        if (data.messages && data.messages.length > 0) {
          // data.messages is returned newest-first from the API query, so reverse it
          const chronologicalOlder = [...data.messages].reverse();
          prependMessages(chronologicalOlder);
          setHasMoreMessages(data.hasMore);

          // Restore scroll position after DOM update
          requestAnimationFrame(() => {
            if (el) {
              el.scrollTop = el.scrollHeight - previousScrollHeight;
            }
          });
        } else {
          setHasMoreMessages(false);
        }
      } catch (err) {
        console.error('Failed to load older messages', err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || text.length > 2000 || !room?.id) return;

    setErrorMessage(null);
    const socket = getSocket();
    if (!socket || !socket.connected) {
      setErrorMessage('Not connected to room server');
      return;
    }

    // Always keep focus on bottom after sending own message
    isNearBottomRef.current = true;

    socket.emit('chat:send', { roomId: room.id, text }, (ack) => {
      if (ack && !ack.ok) {
        setErrorMessage(ack.error?.message || 'Failed to send message');
      }
    });

    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div style={styles.container}>
      {/* Messages Scroll Area */}
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        style={styles.messagesList}
      >
        {isLoadingMore && (
          <div style={styles.loadingBanner}>Loading older messages...</div>
        )}

        {messages.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyTitle}>No messages yet</p>
            <p style={styles.emptySubtitle}>
              Say hello or collaborate with room participants!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id || msg.createdAt} style={styles.systemMessage}>
                  <span style={styles.systemDot}>•</span>
                  <span style={styles.systemText}>{msg.text}</span>
                  <span style={styles.systemTime}>{formatTime(msg.createdAt)}</span>
                </div>
              );
            }

            const isYou = msg.userId === currentUser?.id;

            return (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  ...(isYou ? styles.messageRowYou : {}),
                }}
              >
                {!isYou && (
                  <div
                    style={{
                      ...styles.avatar,
                      backgroundColor: msg.color || '#38bdf8',
                    }}
                  >
                    {msg.name ? msg.name[0].toUpperCase() : 'U'}
                  </div>
                )}

                <div
                  style={{
                    ...styles.bubbleContainer,
                    ...(isYou ? styles.bubbleContainerYou : {}),
                  }}
                >
                  <div style={styles.metaRow}>
                    <span style={styles.senderName}>
                      {isYou ? 'You' : msg.name}
                    </span>
                    <span style={styles.timestamp}>{formatTime(msg.createdAt)}</span>
                  </div>

                  <div
                    style={{
                      ...styles.bubble,
                      ...(isYou ? styles.bubbleYou : styles.bubbleOther),
                    }}
                  >
                    {msg.text}
                  </div>
                </div>

                {isYou && (
                  <div
                    style={{
                      ...styles.avatar,
                      backgroundColor: msg.color || currentUser?.avatarColor || '#38bdf8',
                    }}
                  >
                    {msg.name ? msg.name[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error or Rate Limit Notice */}
      {errorMessage && (
        <div style={styles.errorAlert}>
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={styles.dismissError}
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div style={styles.inputArea}>
        <div style={styles.inputWrapper}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            rows={2}
            maxLength={2000}
            style={styles.textarea}
          />
          {inputText.length > 1500 && (
            <span
              style={{
                ...styles.charCount,
                color: inputText.length > 1900 ? '#ef4444' : '#94a3b8',
              }}
            >
              {2000 - inputText.length}
            </span>
          )}
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          style={{
            ...styles.sendButton,
            ...(!inputText.trim() ? styles.sendButtonDisabled : {}),
          }}
          title="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  messagesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  loadingBanner: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94a3b8',
    padding: '4px',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#64748b',
    textAlign: 'center',
    padding: '20px',
  },
  emptyIcon: {
    fontSize: '36px',
    marginBottom: '8px',
  },
  emptyTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '4px',
  },
  emptySubtitle: {
    fontSize: '12px',
    color: '#64748b',
  },
  systemMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '4px 10px',
    margin: '4px 0',
    fontSize: '11px',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  systemDot: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  systemText: {
    color: '#94a3b8',
  },
  systemTime: {
    fontSize: '10px',
    color: '#64748b',
    marginLeft: '4px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    maxWidth: '85%',
  },
  messageRowYou: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
    marginTop: '2px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  bubbleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  bubbleContainerYou: {
    alignItems: 'flex-end',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginBottom: '3px',
    padding: '0 2px',
  },
  senderName: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  timestamp: {
    fontSize: '10px',
    color: '#64748b',
  },
  bubble: {
    padding: '8px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    lineHeight: '1.45',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleOther: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderTopLeftRadius: '2px',
    border: '1px solid #334155',
  },
  bubbleYou: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderTopRightRadius: '2px',
  },
  errorAlert: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    padding: '6px 12px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid #991b1b',
  },
  dismissError: {
    background: 'none',
    border: 'none',
    color: '#fecaca',
    cursor: 'pointer',
    fontSize: '12px',
  },
  inputArea: {
    padding: '12px',
    borderTop: '1px solid #1e293b',
    backgroundColor: '#090d16',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '13px',
    padding: '8px 10px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.4',
  },
  charCount: {
    position: 'absolute',
    bottom: '6px',
    right: '8px',
    fontSize: '10px',
  },
  sendButton: {
    padding: '8px 14px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    height: '38px',
    transition: 'background-color 0.15s ease',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    color: '#64748b',
    cursor: 'not-allowed',
  },
};
