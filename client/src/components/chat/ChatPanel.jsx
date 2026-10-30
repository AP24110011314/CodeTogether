import React, { useState, useEffect, useRef } from 'react';
import { useRoomStore } from '../../store/roomStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { getSocket } from '../../lib/socket.js';
import { getRoomMessagesApi } from '../../api/messages.js';
import { Send, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

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

    const threshold = 100;
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    isNearBottomRef.current = isNearBottom;

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
          const chronologicalOlder = [...data.messages].reverse();
          prependMessages(chronologicalOlder);
          setHasMoreMessages(data.hasMore);

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

    socket.emit(
      'chat:send',
      {
        roomId: room.id,
        text,
      },
      (ack) => {
        if (!ack?.ok) {
          setErrorMessage(ack?.error?.message || 'Failed to send message');
        } else {
          setInputText('');
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <div style={styles.loadingBanner}>
            <Loader2 size={13} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading older messages...</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIconBox}>
              <MessageSquare size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <p style={styles.emptyTitle}>Workspace Chat</p>
            <p style={styles.emptySubtitle}>
              Say hello or collaborate with room participants in real time.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id || msg.createdAt} style={styles.systemMessage}>
                  <span style={styles.systemDot}>•</span>
                  <span>{msg.text}</span>
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
                  justifyContent: isYou ? 'flex-end' : 'flex-start',
                }}
              >
                {!isYou && (
                  <div
                    style={{
                      ...styles.avatar,
                      backgroundColor: msg.color || 'var(--primary)',
                    }}
                  >
                    {msg.userName ? msg.userName[0].toUpperCase() : 'U'}
                  </div>
                )}

                <div
                  style={{
                    ...styles.messageContent,
                    alignItems: isYou ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={styles.metaRow}>
                    <span style={styles.senderName}>{isYou ? 'You' : msg.userName}</span>
                    <span style={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                  </div>

                  <div
                    style={{
                      ...styles.bubble,
                      ...(isYou ? styles.bubbleYou : styles.bubbleThem),
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        {errorMessage && (
          <div role="alert" style={styles.errorAlert}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div style={styles.inputRow}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message (Enter to send)..."
            rows={1}
            maxLength={2000}
            className="input-glass"
            style={styles.textarea}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="btn btn-primary"
            style={styles.sendButton}
            title="Send Message"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
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
  messagesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  loadingBanner: {
    textAlign: 'center',
    padding: '6px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '24px 16px',
  },
  emptyIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'rgba(var(--primary-rgb), 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  emptySubtitle: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  systemMessage: {
    alignSelf: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--glass-bg-subtle)',
    border: '1px solid var(--glass-border-subtle)',
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    margin: '4px 0',
  },
  systemDot: {
    color: 'var(--primary)',
  },
  systemTime: {
    opacity: 0.7,
  },
  messageRow: {
    display: 'flex',
    gap: '8px',
    width: '100%',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '4px',
  },
  messageContent: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '82%',
    gap: '3px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 4px',
  },
  senderName: {
    fontSize: '0.6875rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  messageTime: {
    fontSize: '0.625rem',
    color: 'var(--text-muted)',
  },
  bubble: {
    padding: '8px 12px',
    borderRadius: '14px',
    fontSize: '0.8125rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  bubbleYou: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#FFFFFF',
    borderBottomRightRadius: '3px',
  },
  bubbleThem: {
    backgroundColor: 'var(--glass-bg-strong)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
    borderBottomLeftRadius: '3px',
  },
  inputArea: {
    padding: '12px 14px',
    borderTop: '1px solid var(--glass-border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: 'var(--glass-bg-subtle)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    fontSize: '0.75rem',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  textarea: {
    flex: 1,
    resize: 'none',
    maxHeight: '80px',
    padding: '8px 12px',
    fontSize: '0.8125rem',
  },
  sendButton: {
    width: '36px',
    height: '36px',
    padding: 0,
    borderRadius: 'var(--radius-md)',
    flexShrink: 0,
  },
};
