import React, { useState } from 'react';
import { useRoomStore } from '../../store/roomStore.js';
import {
  Terminal,
  FileInput,
  History,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  AlertTriangle,
  Play,
  Loader2,
} from 'lucide-react';

export function OutputPanel({ isBottomOpen, setIsBottomOpen, bottomTab, setBottomTab, isMobileFullHeight = false }) {
  const {
    runs,
    activeRun,
    latestRunResult,
    runError,
    stdin,
    setStdin,
    setLatestRunResult,
  } = useRoomStore();

  const [selectedRun, setSelectedRun] = useState(null);
  const [copied, setCopied] = useState(false);

  // The displayed run is either user-selected history run, or latest run result
  const displayRun = selectedRun || latestRunResult || (runs.length > 0 ? runs[0] : null);

  const handleCopyOutput = () => {
    if (!displayRun) return;
    const text = (displayRun.stdout || '') + (displayRun.stderr ? '\n' + displayRun.stderr : '');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status, exitCode) => {
    switch (status) {
      case 'success':
        return {
          bg: 'rgba(34, 197, 94, 0.15)',
          border: 'rgba(34, 197, 94, 0.35)',
          text: 'var(--success)',
          label: `✓ Success (Exit ${exitCode ?? 0})`,
        };
      case 'timeout':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
          text: 'var(--accent)',
          label: '⏱ Time Limit Exceeded (5s)',
        };
      case 'memory':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.35)',
          text: 'var(--danger)',
          label: '🛑 Memory Limit Exceeded (256MB)',
        };
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.35)',
          text: 'var(--danger)',
          label: `✕ Error (Exit ${exitCode ?? 1})`,
        };
      case 'rejected':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
          text: 'var(--accent)',
          label: '⚠ Run Rejected',
        };
      case 'queued':
        return {
          bg: 'rgba(79, 107, 246, 0.15)',
          border: 'rgba(79, 107, 246, 0.35)',
          text: 'var(--primary)',
          label: '⏳ Queued',
        };
      case 'running':
        return {
          bg: 'rgba(20, 184, 166, 0.15)',
          border: 'rgba(20, 184, 166, 0.35)',
          text: 'var(--secondary)',
          label: '⚡ Executing...',
        };
      default:
        return {
          bg: 'var(--glass-bg-subtle)',
          border: 'var(--glass-border-subtle)',
          text: 'var(--text-muted)',
          label: status || 'Unknown',
        };
    }
  };

  return (
    <div
      className="glass"
      style={{
        ...styles.bottomPanel,
        height: isMobileFullHeight ? '100%' : isBottomOpen ? '250px' : '40px',
        flex: isMobileFullHeight ? 1 : 'none',
      }}
    >
      {/* Header bar */}
      <div style={styles.bottomHeader}>
        <div style={styles.headerLeft}>
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
            <Terminal size={14} />
            <span>Output</span>
            {activeRun && <span style={styles.activeDot} />}
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
            <FileInput size={14} />
            <span>Stdin {stdin?.trim() ? '•' : ''}</span>
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
            <History size={14} />
            <span>History ({runs.length})</span>
          </button>
        </div>

        <div style={styles.headerRight}>
          {isBottomOpen && bottomTab === 'output' && displayRun && (
            <button
              onClick={handleCopyOutput}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem', height: '26px' }}
              title="Copy output to clipboard"
            >
              {copied ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            onClick={() => setIsBottomOpen(!isBottomOpen)}
            className="btn btn-ghost"
            style={{ padding: '4px 8px', height: '26px', color: 'var(--text-muted)' }}
            title={isBottomOpen ? 'Collapse panel' : 'Expand panel'}
            aria-label={isBottomOpen ? 'Collapse output panel' : 'Expand output panel'}
          >
            {isBottomOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {isBottomOpen && (
        <div style={styles.bottomContent}>
          {/* TAB 1: OUTPUT */}
          {bottomTab === 'output' && (
            <div style={styles.outputContainer}>
              {/* Active in-flight run indicator */}
              {activeRun && (
                <div style={styles.activeRunBanner}>
                  <Loader2 size={15} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>
                    {activeRun.status === 'queued'
                      ? `Execution request queued (position ${activeRun.position || 1})...`
                      : 'Executing code in isolated child-process sandbox...'}
                  </span>
                </div>
              )}

              {runError && (
                <div style={styles.errorAlert}>
                  <AlertTriangle size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                  <span>{runError}</span>
                </div>
              )}

              {displayRun ? (
                <div style={styles.resultBox}>
                  {/* Meta Bar */}
                  <div style={styles.resultMeta}>
                    <div style={styles.metaLeft}>
                      {(() => {
                        const badge = getStatusBadge(displayRun.status, displayRun.exitCode);
                        return (
                          <span
                            className="badge-glass"
                            style={{
                              backgroundColor: badge.bg,
                              borderColor: badge.border,
                              color: badge.text,
                              fontWeight: '600',
                            }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                      <span style={styles.metaItem}>
                        <Clock size={12} />
                        <span>{displayRun.durationMs !== undefined ? `${displayRun.durationMs}ms` : '-'}</span>
                      </span>
                      {displayRun.language && (
                        <span className="badge-glass" style={{ textTransform: 'capitalize' }}>
                          {displayRun.language}
                        </span>
                      )}
                      {(displayRun.by || displayRun.user) && (
                        <span style={styles.metaItem}>
                          <User size={12} />
                          <span>{displayRun.by?.name || displayRun.user?.name || 'User'}</span>
                        </span>
                      )}
                    </div>

                    {displayRun.truncated && (
                      <div className="badge-glass badge-accent">
                        ⚠ Output capped at 64 KB limit
                      </div>
                    )}
                  </div>

                  {/* Standard Output and Standard Error */}
                  <div style={styles.consoleBody}>
                    {displayRun.stdout && (
                      <div style={styles.stdoutBlock}>
                        <div style={styles.blockTitle}>STDOUT</div>
                        <pre style={styles.codeText}>{displayRun.stdout}</pre>
                      </div>
                    )}

                    {displayRun.stderr && (
                      <div style={styles.stderrBlock}>
                        <div style={styles.stderrTitle}>STDERR</div>
                        <pre style={styles.stderrText}>{displayRun.stderr}</pre>
                      </div>
                    )}

                    {!displayRun.stdout && !displayRun.stderr && (
                      <div style={styles.emptyNotice}>
                        (Program finished with exit code {displayRun.exitCode ?? 0} and no output)
                      </div>
                    )}
                  </div>
                </div>
              ) : !activeRun ? (
                <div style={styles.outputBox}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Ready. Click <strong>"Run"</strong> or press{' '}
                    <kbd style={styles.kbd}>Cmd/Ctrl + Enter</kbd> to execute your code.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: STDIN */}
          {bottomTab === 'stdin' && (
            <div style={styles.stdinContainer}>
              <div style={styles.stdinHint}>
                Standard input fed to your program during execution (one value per line):
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="e.g.&#10;5&#10;10 20 30 40 50"
                className="input-glass"
                style={styles.stdinTextarea}
              />
            </div>
          )}

          {/* TAB 3: RUN HISTORY */}
          {bottomTab === 'history' && (
            <div style={styles.historyContainer}>
              {runs.length === 0 ? (
                <div style={styles.emptyHistory}>No execution runs recorded in this room yet.</div>
              ) : (
                <div style={styles.historyList}>
                  {runs.map((r, i) => {
                    const isSelected = displayRun?.id === r.id || displayRun?._id === r._id;
                    const badge = getStatusBadge(r.status, r.exitCode);

                    return (
                      <div
                        key={r.id || r._id || i}
                        onClick={() => setSelectedRun(r)}
                        className={isSelected ? 'glass' : 'glass-subtle'}
                        style={{
                          ...styles.historyItem,
                          borderColor: isSelected ? 'var(--primary)' : 'var(--glass-border-subtle)',
                        }}
                      >
                        <div style={styles.historyItemTop}>
                          <span
                            className="badge-glass"
                            style={{
                              backgroundColor: badge.bg,
                              borderColor: badge.border,
                              color: badge.text,
                            }}
                          >
                            {badge.label}
                          </span>
                          <span style={styles.historyTime}>
                            {new Date(r.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={styles.historyItemMeta}>
                          <span>⏱ {r.durationMs || 0}ms</span>
                          <span>🔤 {r.language}</span>
                          <span>👤 {r.by?.name || r.user?.name || 'User'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  bottomPanel: {
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid var(--glass-border)',
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    transition: 'height var(--transition-normal)',
    overflow: 'hidden',
    zIndex: 15,
  },
  bottomHeader: {
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  panelTab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    position: 'relative',
    transition: 'all var(--transition-fast)',
  },
  activePanelTab: {
    background: 'var(--glass-bg-strong)',
    color: 'var(--primary)',
    fontWeight: '600',
    boxShadow: 'var(--glass-shadow)',
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--secondary)',
    animation: 'pulse 1.5s infinite',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bottomContent: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  outputContainer: {
    flex: 1,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  activeRunBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
    color: 'var(--primary)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginBottom: '10px',
    border: '1px solid rgba(var(--primary-rgb), 0.25)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    marginBottom: '10px',
  },
  resultBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  resultMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  metaLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  consoleBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '6px',
  },
  stdoutBlock: {
    borderRadius: 'var(--radius-sm)',
    padding: '10px',
    backgroundColor: 'var(--editor-bg)',
    border: '1px solid var(--editor-border)',
  },
  blockTitle: {
    fontSize: '0.6875rem',
    fontWeight: '600',
    color: 'var(--success)',
    marginBottom: '4px',
    fontFamily: 'var(--font-mono)',
  },
  codeText: {
    margin: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem',
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  stderrBlock: {
    borderRadius: 'var(--radius-sm)',
    padding: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  stderrTitle: {
    fontSize: '0.6875rem',
    fontWeight: '600',
    color: 'var(--danger)',
    marginBottom: '4px',
    fontFamily: 'var(--font-mono)',
  },
  stderrText: {
    margin: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem',
    color: 'var(--danger)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  emptyNotice: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    padding: '6px 0',
  },
  outputBox: {
    padding: '24px 0',
    textAlign: 'center',
    fontSize: '0.8125rem',
  },
  kbd: {
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'var(--glass-bg-subtle)',
    border: '1px solid var(--glass-border)',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
  },
  stdinContainer: {
    flex: 1,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stdinHint: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  stdinTextarea: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem',
    resize: 'none',
    minHeight: '110px',
  },
  historyContainer: {
    flex: 1,
    padding: '12px 16px',
    overflowY: 'auto',
  },
  emptyHistory: {
    textAlign: 'center',
    padding: '24px 0',
    color: 'var(--text-muted)',
    fontSize: '0.8125rem',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyItem: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'all var(--transition-fast)',
  },
  historyItemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTime: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
  },
  historyItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
};
