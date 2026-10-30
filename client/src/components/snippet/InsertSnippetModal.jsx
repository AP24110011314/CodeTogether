import React, { useState, useEffect } from 'react';
import { getSnippetsApi } from '../../api/snippets.js';

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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Insert Saved Snippet</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.searchBar}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search snippets by title, tags, or code..."
            style={styles.searchInput}
            autoFocus
          />
        </div>

        <div style={styles.body}>
          {/* Snippet List Column */}
          <div style={styles.listColumn}>
            {isLoading ? (
              <div style={styles.centerNotice}>Loading snippets...</div>
            ) : snippets.length === 0 ? (
              <div style={styles.centerNotice}>No snippets found</div>
            ) : (
              snippets.map((s) => {
                const isSelected = selectedSnippet?._id === s._id;
                return (
                  <div
                    key={s._id}
                    onClick={() => setSelectedSnippet(s)}
                    style={{
                      ...styles.snippetItem,
                      ...(isSelected ? styles.snippetItemSelected : {}),
                    }}
                  >
                    <div style={styles.itemTitle}>{s.title}</div>
                    <div style={styles.itemMeta}>
                      <span style={styles.langTag}>{s.language}</span>
                      {s.tags?.length > 0 && (
                        <span style={styles.tagsPreview}>
                          {s.tags.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Snippet Preview Column */}
          <div style={styles.previewColumn}>
            {selectedSnippet ? (
              <div style={styles.previewContainer}>
                <div style={styles.previewHeader}>
                  <span style={styles.previewTitle}>
                    {selectedSnippet.title}
                  </span>
                  <span style={styles.previewLang}>
                    {selectedSnippet.language}
                  </span>
                </div>

                <pre style={styles.codePreview}>
                  <code>{selectedSnippet.code}</code>
                </pre>

                <div style={styles.previewActions}>
                  <button
                    onClick={() => {
                      onInsert(selectedSnippet.code);
                      onClose();
                    }}
                    style={styles.insertButton}
                  >
                    Insert into Editor
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.centerNotice}>Select a snippet to preview</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(3px)',
  },
  modal: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '750px',
    height: '520px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #334155',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
  },
  searchBar: {
    padding: '12px 20px',
    borderBottom: '1px solid #334155',
    backgroundColor: '#0f172a',
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  listColumn: {
    width: '40%',
    borderRight: '1px solid #334155',
    overflowY: 'auto',
    backgroundColor: '#0f172a',
  },
  snippetItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e293b',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  snippetItemSelected: {
    backgroundColor: '#1e293b',
    borderLeft: '3px solid #38bdf8',
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#f8fafc',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#94a3b8',
  },
  langTag: {
    backgroundColor: '#0369a133',
    color: '#38bdf8',
    padding: '1px 5px',
    borderRadius: '3px',
    textTransform: 'lowercase',
  },
  tagsPreview: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#090d16',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  previewTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  previewLang: {
    fontSize: '11px',
    color: '#38bdf8',
    backgroundColor: '#0369a133',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  codePreview: {
    flex: 1,
    margin: 0,
    backgroundColor: '#020617',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '12px',
    color: '#cbd5e1',
    fontSize: '12px',
    fontFamily: '"SF Mono", Monaco, Menlo, Consolas, monospace',
    overflow: 'auto',
    lineHeight: '1.45',
  },
  previewActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '12px',
  },
  insertButton: {
    padding: '8px 18px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  centerNotice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#64748b',
    fontSize: '13px',
    padding: '20px',
  },
};

