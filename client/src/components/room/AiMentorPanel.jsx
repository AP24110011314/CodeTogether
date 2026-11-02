import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Brain,
  Cpu,
  AlertCircle,
  HelpCircle,
  Send,
  Check,
  Copy,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { askAiTutorApi } from '../../api/aiTutor.js';
import { useRoomStore } from '../../store/roomStore.js';

// Markdown and Code Block Renderer with Copy Button
function MarkdownMessage({ text }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by code fences: ```lang ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div style={markdownStyles.container}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          let lang = 'code';
          let codeContent = lines.join('\n');

          if (/^[a-zA-Z0-9_-]+$/.test(firstLine)) {
            lang = firstLine;
            codeContent = lines.slice(1).join('\n');
          }

          return (
            <div key={index} style={markdownStyles.codeBlockWrapper}>
              <div style={markdownStyles.codeBlockHeader}>
                <span style={markdownStyles.codeLang}>{lang}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeContent, index)}
                  style={markdownStyles.copyBtn}
                  title="Copy code snippet"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={12} style={{ color: '#22c55e' }} />
                      <span style={{ color: '#22c55e' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre style={markdownStyles.pre}>
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        // Render plain text with basic markdown (bold, inline code, list items)
        const paragraphs = part.split('\n\n').filter((p) => p.trim().length > 0);
        return (
          <div key={index} style={markdownStyles.textBlock}>
            {paragraphs.map((para, pIdx) => {
              const lines = para.split('\n');
              return (
                <div key={pIdx} style={markdownStyles.paragraph}>
                  {lines.map((line, lIdx) => {
                    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim());
                    return (
                      <div
                        key={lIdx}
                        style={{
                          marginBottom: lIdx < lines.length - 1 ? '4px' : '0',
                          paddingLeft: isBullet ? '12px' : '0',
                        }}
                      >
                        {formatInline(line)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Inline formatter for **bold** and `code`
function formatInline(str) {
  const tokens = str.split(/(\*\*.*?\*\*|`.*?`)/g);
  return tokens.map((t, i) => {
    if (t.startsWith('**') && t.endsWith('**')) {
      return (
        <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {t.slice(2, -2)}
        </strong>
      );
    }
    if (t.startsWith('`') && t.endsWith('`')) {
      return (
        <code key={i} style={markdownStyles.inlineCode}>
          {t.slice(1, -1)}
        </code>
      );
    }
    return t;
  });
}

export function AiMentorPanel({ getEditorCode }) {
  const { room, language } = useRoomStore();
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: "👋 Hi! I'm your **CodeTogether AI Tutor** powered by Gemini. Ask me to explain the active code, analyze Big-O complexity, debug edge cases, or guide you through algorithmic concepts!",
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [lastPrompt, setLastPrompt] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (promptText) => {
    const textToSend = promptText || inputMessage.trim();
    if (!textToSend || isLoading) return;

    setErrorState(null);
    setInputMessage('');
    setLastPrompt(textToSend);

    const userTurn = { role: 'user', text: textToSend };
    const updatedMessages = [...messages, userTurn];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const code = getEditorCode ? getEditorCode() : '';
      const context = {
        code,
        language: language || room?.language || 'javascript',
        topic: room?.name || 'Algorithmic Problem Solving',
      };

      // Send recent history (excluding the first greeting and latest user prompt)
      const history = updatedMessages.slice(1, -1).map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        text: m.text,
      }));

      const res = await askAiTutorApi({
        message: textToSend,
        history,
        context,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: res.reply || 'Analysis complete.',
        },
      ]);
    } catch (err) {
      console.error('AI Tutor request failed:', err);
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to connect to AI Tutor. Please check your network or try again.';
      setErrorState(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (type) => {
    if (isLoading) return;
    const code = getEditorCode ? getEditorCode() : '';
    if (!code || !code.trim()) {
      setErrorState('Your editor canvas is empty. Write or load some code before running analysis!');
      return;
    }

    if (type === 'explain') {
      sendMessage('Please explain this algorithm step-by-step. Break down its approach, key invariants, and logic.');
    } else if (type === 'complexity') {
      sendMessage('Analyze the Time and Space Big-O complexity of this code. Explain the worst-case and best-case scenarios.');
    } else if (type === 'edgecases') {
      sendMessage('What edge cases, boundary conditions, or potential runtime pitfalls should I test for this implementation?');
    } else if (type === 'hint') {
      sendMessage('Give me a progressive educational hint for optimizing or debugging this code without giving away the full solution.');
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'model',
        text: "👋 Chat reset. What would you like to explore or solve next?",
      },
    ]);
    setErrorState(null);
  };

  return (
    <div style={styles.container}>
      {/* Top Header & Clear Button */}
      <div style={styles.header}>
        <div style={styles.headerTitleRow}>
          <div style={styles.headerBadge}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <span style={styles.headerTitle}>AI Code Tutor</span>
          </div>
          <span className="badge-glass badge-primary" style={{ fontSize: '0.625rem' }}>
            Gemini
          </span>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          style={styles.clearBtn}
          title="Clear tutor conversation"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Quick Action Pills */}
      <div style={styles.actionGrid}>
        <button
          type="button"
          onClick={() => handleActionClick('explain')}
          disabled={isLoading}
          className="btn btn-secondary"
          style={styles.actionPill}
          title="Step-by-step code explanation"
        >
          <Brain size={13} style={{ color: 'var(--primary)' }} />
          <span>Explain</span>
        </button>

        <button
          type="button"
          onClick={() => handleActionClick('complexity')}
          disabled={isLoading}
          className="btn btn-secondary"
          style={styles.actionPill}
          title="Big-O Complexity analysis"
        >
          <Cpu size={13} style={{ color: 'var(--secondary)' }} />
          <span>Complexity</span>
        </button>

        <button
          type="button"
          onClick={() => handleActionClick('edgecases')}
          disabled={isLoading}
          className="btn btn-secondary"
          style={styles.actionPill}
          title="Edge cases and boundary tests"
        >
          <AlertCircle size={13} style={{ color: 'var(--warning)' }} />
          <span>Edge Cases</span>
        </button>

        <button
          type="button"
          onClick={() => handleActionClick('hint')}
          disabled={isLoading}
          className="btn btn-secondary"
          style={styles.actionPill}
          title="Get a progressive hint"
        >
          <Lightbulb size={13} style={{ color: 'var(--accent)' }} />
          <span>Hint</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={styles.messagesContainer}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              style={{
                ...styles.messageRow,
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(isUser ? styles.userBubble : styles.aiBubble),
                }}
              >
                {isUser ? (
                  <div style={styles.userText}>{m.text}</div>
                ) : (
                  <MarkdownMessage text={m.text} />
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={styles.loadingRow}>
            <div style={styles.loadingBubble}>
              <Sparkles
                size={14}
                style={{
                  color: 'var(--accent)',
                  animation: 'spin 2s linear infinite',
                }}
              />
              <span style={styles.loadingText}>Gemini is thinking...</span>
            </div>
          </div>
        )}

        {/* Error State with Retry */}
        {errorState && (
          <div style={styles.errorCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={styles.errorTitle}>Tutor Notification</div>
                <div style={styles.errorDesc}>{errorState}</div>
              </div>
            </div>
            {lastPrompt && (
              <button
                type="button"
                onClick={() => sendMessage(lastPrompt)}
                className="btn btn-primary"
                style={styles.retryBtn}
              >
                <RotateCcw size={12} />
                <span>Retry Question</span>
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        style={styles.inputForm}
      >
        <input
          type="text"
          className="input-glass"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask tutor about algorithms, code, or syntax..."
          disabled={isLoading}
          style={styles.textInput}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="btn btn-primary"
          style={styles.sendBtn}
          title="Send question to AI Tutor"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    gap: '10px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    flexShrink: 0,
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  headerTitle: {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.6875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 6px',
    borderRadius: '4px',
    transition: 'color 150ms ease',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
    flexShrink: 0,
  },
  actionPill: {
    padding: '6px 4px',
    fontSize: '0.6875rem',
    fontWeight: '600',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingRight: '4px',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: '14px',
    fontSize: '0.78125rem',
    lineHeight: '1.5',
    boxSizing: 'border-box',
  },
  userBubble: {
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    borderBottomRightRadius: '3px',
    maxWidth: '85%',
  },
  userText: {
    wordBreak: 'break-word',
  },
  aiBubble: {
    backgroundColor: 'var(--glass-bg-strong)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
    borderBottomLeftRadius: '3px',
    maxWidth: '95%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  },
  loadingRow: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  loadingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '12px',
    backgroundColor: 'var(--glass-bg-subtle)',
    border: '1px solid var(--glass-border-subtle)',
  },
  loadingText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  errorCard: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  errorTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--danger)',
  },
  errorDesc: {
    fontSize: '0.6875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    marginTop: '2px',
  },
  retryBtn: {
    alignSelf: 'flex-start',
    padding: '4px 10px',
    fontSize: '0.6875rem',
    borderRadius: '6px',
    gap: '4px',
  },
  inputForm: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: '6px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
  textInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '0.8125rem',
  },
  sendBtn: {
    padding: '8px 12px',
    flexShrink: 0,
    borderRadius: 'var(--radius-md)',
  },
};

const markdownStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  textBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  paragraph: {
    lineHeight: '1.5',
    color: 'var(--text-primary)',
  },
  inlineCode: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.75rem',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    padding: '1px 5px',
    borderRadius: '4px',
    color: 'var(--primary)',
  },
  codeBlockWrapper: {
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#1E1E2E',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    margin: '4px 0',
  },
  codeBlockHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 10px',
    backgroundColor: '#181825',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  codeLang: {
    fontSize: '0.6875rem',
    fontWeight: '600',
    color: '#A6ADC8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    color: '#BAC2DE',
    fontSize: '0.6875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  pre: {
    margin: 0,
    padding: '10px 12px',
    overflowX: 'auto',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.75rem',
    lineHeight: '1.5',
    color: '#CDD6F4',
  },
};
