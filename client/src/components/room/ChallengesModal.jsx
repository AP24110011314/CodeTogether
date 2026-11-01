import React, { useState } from 'react';
import { CODING_CHALLENGES } from '../../data/challenges.js';
import { Target, BookOpen, Clock, Cpu, CheckCircle2, X, ArrowRight } from 'lucide-react';

export function ChallengesModal({ isOpen, onClose, onLoadChallenge }) {
  const [selectedChallenge, setSelectedChallenge] = useState(CODING_CHALLENGES[0]);

  if (!isOpen) return null;

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Easy':
        return {
          bg: 'rgba(34, 197, 94, 0.15)',
          color: 'var(--success)',
          border: 'rgba(34, 197, 94, 0.35)',
        };
      case 'Medium':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--accent)',
          border: 'rgba(245, 158, 11, 0.35)',
        };
      default:
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--danger)',
          border: 'rgba(239, 68, 68, 0.35)',
        };
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="glass-strong modal-content"
        onClick={(e) => e.stopPropagation()}
        style={styles.modalBox}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="mac-traffic-lights">
              <span className="mac-dot mac-dot-close" onClick={onClose} style={{ cursor: 'pointer' }} />
              <span className="mac-dot mac-dot-min" />
              <span className="mac-dot mac-dot-max" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={styles.title}>Algorithm Practice & Labs</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body Grid */}
        <div style={styles.bodyGrid}>
          {/* Left: Challenge list */}
          <div style={styles.challengeList}>
            {CODING_CHALLENGES.map((c) => {
              const isSelected = selectedChallenge.id === c.id;
              const badge = getDifficultyBadge(c.difficulty);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedChallenge(c)}
                  className={isSelected ? 'glass' : 'glass-subtle'}
                  style={{
                    ...styles.challengeItem,
                    borderColor: isSelected ? 'var(--primary)' : 'var(--glass-border-subtle)',
                  }}
                >
                  <div style={styles.itemTitle}>{c.title}</div>
                  <div style={styles.itemMeta}>
                    <span
                      className="badge-glass"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        borderColor: badge.border,
                        fontSize: '0.625rem',
                        fontWeight: '600',
                      }}
                    >
                      {c.difficulty}
                    </span>
                    <span className="badge-glass" style={{ fontSize: '0.625rem' }}>
                      {c.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Challenge Details & Code Preview */}
          <div style={styles.detailsPane}>
            <div style={styles.detailsHeader}>
              <div>
                <h4 style={styles.detailTitle}>{selectedChallenge.title}</h4>
                <div style={styles.detailMeta}>
                  <span className="badge-glass badge-primary">{selectedChallenge.language}</span>
                  <span className="badge-glass">Time: {selectedChallenge.timeComplexity}</span>
                  <span className="badge-glass">Space: {selectedChallenge.spaceComplexity}</span>
                </div>
              </div>
            </div>

            <div style={styles.descriptionText}>
              {selectedChallenge.description}
            </div>

            <div style={styles.previewTitle}>Starter Code & Test Verification:</div>
            <pre style={styles.codePreview}>
              <code>{selectedChallenge.starterCode}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onLoadChallenge(selectedChallenge);
              onClose();
            }}
            className="btn btn-primary"
            style={{ gap: '6px' }}
          >
            <span>Load Challenge into Workspace</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalBox: {
    width: '100%',
    maxWidth: '820px',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--glass-border-subtle)',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  bodyGrid: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '16px',
    height: '380px',
    marginBottom: '20px',
  },
  challengeList: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '6px',
  },
  challengeItem: {
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  itemTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  detailsPane: {
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--editor-bg)',
    border: '1px solid var(--editor-border)',
    overflowY: 'auto',
  },
  detailsHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--editor-border)',
  },
  detailTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 6px 0',
  },
  detailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  descriptionText: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    marginBottom: '12px',
  },
  previewTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '6px',
  },
  codePreview: {
    flex: 1,
    margin: 0,
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--glass-bg-subtle)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
    overflow: 'auto',
    border: '1px solid var(--glass-border-subtle)',
    maxHeight: '160px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
};

