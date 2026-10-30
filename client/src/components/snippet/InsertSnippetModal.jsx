import React, { useState, useEffect } from 'react';
import { getSnippetsApi } from '../../api/snippets.js';
import { FileInput, Search, X, Loader2 } from 'lucide-react';

export function InsertSnippetModal({ isOpen, onClose, onInsert }) {
  const [snippets, setSnippets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSnippets();
      setSelectedSnippet(null);
    }
  }, [isOpen]);

  const loadSnippets = async (q = '') => {
    setIsLoading(true);
    try {
      const data = await getSnippetsApi({ q, limit: 50 });
      setSnippets(data.snippets || []);
      if (data.snippets?.length > 0 && !selectedSnippet) {
        setSelectedSnippet(data.snippets[0]);
      }
    } catch (err) {
      console.error('Failed to load snippets', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadSnippets(val);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="glass-strong modal-content"
        onClick={(e) => e.stopPropagation()}
        style={styles.modalBox}
      >
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="mac-traffic-lights">
              <span className="mac-dot mac-dot-close" onClick={onClose} style={{ cursor: 'pointer' }} />
              <span className="mac-dot mac-dot-min" />
              <span className="mac-dot mac-dot-max" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileInput size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={styles.title}>Insert Saved Snippet</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchBar}>
          <div style={styles.searchWrapper}>
            <Search size={15} style={styles.searchIcon} />
            <input
              type="text"
              className="input-glass"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search snippets by title, tag, or code..."
              style={{ paddingLeft: '36px' }}
              autoFocus
            />
          </div>
        </div>

        {/* Split Browser */}
        <div style={styles.body}>
          {/* Left: Snippet list */}
          <div style={styles.snippetList}>
            {isLoading && snippets.length === 0 ? (
              <div style={styles.loadingState}>
                <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading snippets...</span>
              </div>
            ) : snippets.length === 0 ? (
              <div style={styles.emptyState}>No saved snippets found</div>
            ) : (
              snippets.map((s) => {
                const isSelected = selectedSnippet?._id === s._id;
                return (
                  <div
                    key={s._id}
                    onClick={() => setSelectedSnippet(s)}
                    className={isSelected ? 'glass' : 'glass-subtle'}
                    style={{
                      ...styles.snippetItem,
                      borderColor: isSelected ? 'var(--primary)' : 'var(--glass-border-subtle)',
                    }}
                  >
                    <div style={styles.itemTitle}>{s.title}</div>
                    <div style={styles.itemMeta}>
                      <span className="badge-glass badge-primary" style={{ fontSize: '0.625rem' }}>
                        {s.language}
                      </span>
                      {s.tags && s.tags[0] && (
                        <span style={styles.tagText}>#{s.tags[0]}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Code preview */}
          <div style={styles.previewPane}>
            {selectedSnippet ? (
              <>
                <div style={styles.previewHeader}>
                  <div style={styles.previewTitle}>{selectedSnippet.title}</div>
                  <span className="badge-glass">{selectedSnippet.language}</span>
                </div>
                <pre style={styles.codePreview}>
                  <code>{selectedSnippet.code}</code>
                </pre>
              </>
            ) : (
              <div style={styles.emptyPreview}>Select a snippet to preview</div>
            )}
          </div>
        </div>

        <div style={styles.footer}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedSnippet}
            onClick={() => {
              if (selectedSnippet) {
                onInsert(selectedSnippet.code);
                onClose();
              }
            }}
            className="btn btn-primary"
          >
            Insert at Cursor
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalBox: {
    width: '100%',
    maxWidth: '740px',
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
  searchBar: {
    marginBottom: '16px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  body: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '14px',
    height: '320px',
    marginBottom: '20px',
  },
  snippetList: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '6px',
  },
  snippetItem: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  itemTitle: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tagText: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
  },
  previewPane: {
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--editor-bg)',
    border: '1px solid var(--editor-border)',
    overflow: 'hidden',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  previewTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  codePreview: {
    flex: 1,
    margin: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem',
    color: 'var(--text-primary)',
    overflow: 'auto',
  },
  emptyPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '0.8125rem',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '0.8125rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '24px 0',
    color: 'var(--text-muted)',
    fontSize: '0.8125rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
};
