import React, { useState } from 'react';
import { useRoomStore } from '../../store/roomStore.js';

export function OutputPanel({ isBottomOpen, setIsBottomOpen, bottomTab, setBottomTab }) {
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
          bg: '#14532d',
          border: '#22c55e',
          text: '#86efac',
          label: `✓ Success (Exit ${exitCode ?? 0})`,
        };
      case 'timeout':
        return {
          bg: '#7c2d12',
          border: '#ea580c',
          text: '#fdba74',
          label: '⏱ Time Limit Exceeded (5s)',
        };
      case 'memory':
        return {
          bg: '#7f1d1d',
          border: '#ef4444',
          text: '#fca5a5',
          label: '🛑 Memory Limit Exceeded (256MB)',
        };
      case 'error':
        return {
          bg: '#7f1d1d',
          border: '#ef4444',
          text: '#fca5a5',
          label: `✕ Error (Exit ${exitCode ?? 1})`,
        };
      case 'rejected':
        return {
          bg: '#78350f',
          border: '#d97706',
          text: '#fde68a',
          label: '⚠ Run Rejected',
        };
      case 'queued':
        return {
          bg: '#1e3a8a',
          border: '#3b82f6',
          text: '#93c5fd',
          label: '⏳ Queued',
        };
      case 'running':
        return {
          bg: '#854d0e',
          border: '#eab308',
          text: '#fef08a',
          label: '⚡ Executing...',
        };
      default:
        return {
          bg: '#334155',
          border: '#64748b',
          text: '#cbd5e1',
          label: status || 'Unknown',
        };
    }
  };

  return (
    <div style={styles.bottomPanel}>
      <div style={styles.panelHeader}>
        <div style={styles.tabGroup}>
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
            Stdin {stdin?.trim() ? '•' : ''}
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
            Run History ({runs.length})
          </button>
        </div>

        <div style={styles.headerRight}>
          {isBottomOpen && bottomTab === 'output' && displayRun && (
            <button
              onClick={handleCopyOutput}
              style={styles.copyButton}
              title="Copy output to clipboard"
            >
              {copied ? '✓ Copied' : '📋 Copy Output'}
            </button>
          )}
          <button
            onClick={() => setIsBottomOpen(!isBottomOpen)}
            style={styles.collapseButton}
            title={isBottomOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isBottomOpen ? '▼' : '▲'}
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
                  <div style={styles.spinner} />
                  <div>
                    <span style={{ fontWeight: 600 }}>
                      {activeRun.status === 'queued'
                        ? `Queued in runner queue (position ${activeRun.position || 1})...`
                        : 'Executing in isolated child process...'}
                    </span>
                    {activeRun.by && (
                      <span style={{ marginLeft: '10px', color: '#94a3b8', fontSize: '12px' }}>
                        Triggered by {activeRun.by.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Run rejection / error banner */}
              {runError && (
                <div style={styles.errorBanner}>
                  <span>⚠ Execution Rejected: {runError.message || runError.reason}</span>
                </div>
              )}

              {/* Result metadata bar */}
              {displayRun ? (
                <div>
                  <div style={styles.metadataBar}>
                    <div style={styles.metaLeft}>
                      {(() => {
                        const badge = getStatusBadge(displayRun.status, displayRun.exitCode);
                        return (
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: badge.bg,
                              borderColor: badge.border,
                              color: badge.text,
                            }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                      <span style={styles.metaItem}>
                        ⏱ {displayRun.durationMs !== undefined ? `${displayRun.durationMs}ms` : '-'}
                      </span>
                      {displayRun.language && (
                        <span style={styles.metaItem}>
                          🔤 {displayRun.language}
                        </span>
                      )}
                      {displayRun.by || displayRun.user ? (
                        <span style={styles.metaItem}>
                          👤 {displayRun.by?.name || displayRun.user?.name || 'User'}
                        </span>
                      ) : null}
                      {displayRun.createdAt && (
                        <span style={styles.metaItem}>
                          🕒 {new Date(displayRun.createdAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    {displayRun.truncated && (
                      <div style={styles.truncatedNotice}>
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
                        (Program finished with no output)
                      </div>
                    )}
                  </div>
                </div>
              ) : !activeRun ? (
                <div style={styles.outputBox}>
                  <span style={{ color: '#64748b' }}>
                    Ready. Click "▶ Run" in the toolbar or press{' '}
                    <kbd style={styles.kbd}>Cmd/Ctrl + Enter</kbd> to execute your code.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: STDIN */}
          {bottomTab === 'stdin' && (
            <div style={styles.stdinContainer}>
              <div style={styles.stdinHeader}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Standard input supplied to the process before execution (max 10 KB):
                </span>
                {stdin && (
                  <button onClick={() => setStdin('')} style={styles.clearStdinBtn}>
                    Clear Stdin
                  </button>
                )}
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Type or paste input for your program here (e.g. arguments, test cases)..."
                style={styles.stdinTextarea}
                maxLength={10240}
              />
            </div>
          )}

          {/* TAB 3: RUN HISTORY */}
          {bottomTab === 'history' && (
            <div style={styles.historyContainer}>
              {runs.length === 0 ? (
                <div style={styles.emptyHistory}>
                  <span style={{ color: '#64748b' }}>No execution runs recorded yet in this room.</span>
                </div>
              ) : (
                <div style={styles.historyList}>
                  {runs.map((r, idx) => {
                    const badge = getStatusBadge(r.status, r.exitCode);
                    const isSelected = displayRun && (displayRun.id === r.id || displayRun.runId === r.id);
                    return (
                      <div
                        key={r.id || idx}
                        onClick={() => {
                          setSelectedRun(r);
                          setLatestRunResult(r);
                          setBottomTab('output');
                        }}
                        style={{
                          ...styles.historyItem,
                          ...(isSelected ? styles.historyItemSelected : {}),
                        }}
                      >
                        <div style={styles.historyItemLeft}>
                          <span
                            style={{
                              ...styles.smallBadge,
                              backgroundColor: badge.bg,
                              borderColor: badge.border,
                              color: badge.text,
                            }}
                          >
                            {r.status}
                          </span>
                          <span style={styles.historyLang}>{r.language}</span>
                          <span style={styles.historyUser}>
                            by {r.by?.name || r.user?.name || 'User'}
                          </span>
                        </div>
                        <div style={styles.historyItemRight}>
                          <span style={styles.historyDuration}>
                            {r.durationMs !== undefined ? `${r.durationMs}ms` : ''}
                          </span>
                          <span style={styles.historyTime}>
                            {r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                          </span>
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
    backgroundColor: '#0f172a',
    borderTop: '1px solid #334155',
    maxHeight: '340px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    padding: '0 12px',
    height: '36px',
    userSelect: 'none',
  },
  tabGroup: {
    display: 'flex',
    gap: '4px',
    height: '100%',
  },
  panelTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '0 14px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  activePanelTab: {
    color: '#38bdf8',
    borderBottom: '2px solid #38bdf8',
    backgroundColor: '#0f172a',
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#eab308',
    display: 'inline-block',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  copyButton: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    border: 'none',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  collapseButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '11px',
    padding: '4px',
  },
  bottomContent: {
    height: '240px',
    overflowY: 'auto',
    backgroundColor: '#090d16',
    display: 'flex',
    flexDirection: 'column',
  },
  outputContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  activeRunBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    backgroundColor: '#1e3a8a',
    color: '#93c5fd',
    fontSize: '12px',
    borderBottom: '1px solid #2563eb',
  },
  spinner: {
    width: '12px',
    height: '12px',
    border: '2px solid #93c5fd',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBanner: {
    padding: '8px 14px',
    backgroundColor: '#78350f',
    color: '#fef08a',
    fontSize: '12px',
    borderBottom: '1px solid #b45309',
  },
  metadataBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 14px',
    backgroundColor: '#111827',
    borderBottom: '1px solid #1f2937',
    fontSize: '12px',
  },
  metaLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid transparent',
  },
  smallBadge: {
    padding: '1px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    border: '1px solid transparent',
    textTransform: 'uppercase',
  },
  metaItem: {
    color: '#94a3b8',
    fontSize: '11px',
  },
  truncatedNotice: {
    color: '#f59e0b',
    fontSize: '11px',
    fontWeight: 500,
  },
  consoleBody: {
    padding: '10px 14px',
    overflowY: 'auto',
    flex: 1,
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  stdoutBlock: {
    marginBottom: '8px',
  },
  blockTitle: {
    fontSize: '10px',
    color: '#64748b',
    fontWeight: 600,
    marginBottom: '2px',
    letterSpacing: '0.05em',
  },
  codeText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#e2e8f0',
    lineHeight: 1.5,
  },
  stderrBlock: {
    marginTop: '6px',
    padding: '8px 10px',
    backgroundColor: '#260a0a',
    border: '1px solid #7f1d1d',
    borderRadius: '4px',
  },
  stderrTitle: {
    fontSize: '10px',
    color: '#f87171',
    fontWeight: 600,
    marginBottom: '2px',
    letterSpacing: '0.05em',
  },
  stderrText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#fca5a5',
    lineHeight: 1.5,
  },
  emptyNotice: {
    color: '#64748b',
    fontStyle: 'italic',
    padding: '8px 0',
  },
  outputBox: {
    padding: '16px',
    fontSize: '13px',
  },
  kbd: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '3px',
    padding: '2px 5px',
    color: '#94a3b8',
    fontSize: '11px',
  },
  stdinContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '10px 14px',
  },
  stdinHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  clearStdinBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f87171',
    fontSize: '11px',
    cursor: 'pointer',
  },
  stdinTextarea: {
    flex: 1,
    backgroundColor: '#020617',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '12px',
    resize: 'none',
    outline: 'none',
  },
  historyContainer: {
    height: '100%',
    overflowY: 'auto',
  },
  emptyHistory: {
    padding: '16px',
    fontSize: '13px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 14px',
    borderBottom: '1px solid #1e293b',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  historyItemSelected: {
    backgroundColor: '#1e293b',
  },
  historyItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  historyLang: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  historyUser: {
    fontSize: '11px',
    color: '#64748b',
  },
  historyItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  historyDuration: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  historyTime: {
    fontSize: '11px',
    color: '#64748b',
  },
};

