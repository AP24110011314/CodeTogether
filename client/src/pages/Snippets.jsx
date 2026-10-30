import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSnippetsApi,
  deleteSnippetApi,
  updateSnippetApi,
  createSnippetApi,
} from '../api/snippets.js';
import { createRoomApi } from '../api/rooms.js';
import { useAuthStore } from '../store/authStore.js';
import { LanguageSelect } from '../components/editor/LanguageSelect.jsx';

export default function Snippets() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [snippets, setSnippets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Edit / Create Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalLanguage, setModalLanguage] = useState('javascript');
  const [modalCode, setModalCode] = useState('');
  const [modalTags, setModalTags] = useState('');
  const [modalError, setModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSnippets = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: 12 };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedLang) params.language = selectedLang;
      if (selectedTag) params.tag = selectedTag;

      const data = await getSnippetsApi(params);
      setSnippets(data.snippets || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load snippets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, [page, selectedLang, selectedTag]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSnippets();
  };

  const handleCopyCode = async (snippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopiedId(snippet._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this snippet?')) return;
    try {
      await deleteSnippetApi(id);
      fetchSnippets();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete snippet');
    }
  };

  const handleOpenInNewRoom = async (snippet) => {
    try {
      const data = await createRoomApi({
        name: snippet.title,
        language: snippet.language || 'javascript',
        visibility: 'public',
      });
      navigate(`/room/${data.room.slug}`);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create room');
    }
  };

  const openCreateModal = () => {
    setEditingSnippet(null);
    setModalTitle('');
    setModalLanguage('javascript');
    setModalCode('');
    setModalTags('');
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const openEditModal = (snippet) => {
    setEditingSnippet(snippet);
    setModalTitle(snippet.title);
    setModalLanguage(snippet.language);
    setModalCode(snippet.code);
    setModalTags(snippet.tags ? snippet.tags.join(', ') : '');
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setModalError('Title is required');
      return;
    }
    if (!modalCode) {
      setModalError('Code cannot be empty');
      return;
    }

    const tags = modalTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingSnippet) {
        await updateSnippetApi(editingSnippet._id, {
          title: modalTitle.trim(),
          language: modalLanguage,
          code: modalCode,
          tags,
        });
      } else {
        await createSnippetApi({
          title: modalTitle.trim(),
          language: modalLanguage,
          code: modalCode,
          tags,
        });
      }
      setIsEditModalOpen(false);
      fetchSnippets();
    } catch (err) {
      setModalError(
        err.response?.data?.error?.message || 'Failed to save snippet'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            &larr; Dashboard
          </button>
          <span style={styles.brandTitle}>CodeTogether</span>
          <span style={styles.pageBadge}>Snippets Library</span>
        </div>

        <div style={styles.navRight}>
          <button onClick={openCreateModal} style={styles.newSnippetButton}>
            + New Snippet
          </button>
          <div
            style={{
              ...styles.userAvatar,
              backgroundColor: user?.avatarColor || '#38bdf8',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.main}>
        {/* Search & Filter Toolbar */}
        <div style={styles.filterToolbar}>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search snippets by title, tag, or code..."
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>
              Search
            </button>
          </form>

          <div style={styles.filterGroup}>
            <select
              value={selectedLang}
              onChange={(e) => {
                setSelectedLang(e.target.value);
                setPage(1);
              }}
              style={styles.filterSelect}
            >
              <option value="">All Languages</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
            </select>

            {selectedTag && (
              <div style={styles.activeTagBadge}>
                <span>Tag: {selectedTag}</span>
                <button
                  onClick={() => {
                    setSelectedTag('');
                    setPage(1);
                  }}
                  style={styles.clearTagBtn}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Snippets Grid */}
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: '12px', color: '#94a3b8' }}>
              Loading snippets...
            </p>
          </div>
        ) : snippets.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>📂</div>
            <h3 style={styles.emptyTitle}>No snippets found</h3>
            <p style={styles.emptySubtitle}>
              {searchQuery || selectedLang || selectedTag
                ? 'Try adjusting your search filters'
                : 'Save useful code blocks from the editor or create one here.'}
            </p>
            <button onClick={openCreateModal} style={styles.newSnippetButton}>
              Create your first snippet
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {snippets.map((s) => (
              <div key={s._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleRow}>
                    <h4 style={styles.cardTitle} title={s.title}>
                      {s.title}
                    </h4>
                    <span style={styles.langBadge}>{s.language}</span>
                  </div>
                  <span style={styles.cardDate}>
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Code Preview */}
                <pre style={styles.codeBlock}>
                  <code>{s.code}</code>
                </pre>

                {/* Tags */}
                {s.tags && s.tags.length > 0 && (
                  <div style={styles.tagsContainer}>
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        onClick={() => {
                          setSelectedTag(t);
                          setPage(1);
                        }}
                        style={styles.tagPill}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Actions */}
                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleCopyCode(s)}
                    style={styles.actionBtn}
                    title="Copy code to clipboard"
                  >
                    {copiedId === s._id ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={() => handleOpenInNewRoom(s)}
                    style={styles.actionBtn}
                    title="Open snippet in a collaborative room"
                  >
                    🚀 Open in Room
                  </button>
                  <button
                    onClick={() => openEditModal(s)}
                    style={styles.actionBtn}
                    title="Edit snippet"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    style={{ ...styles.actionBtn, color: '#f87171' }}
                    title="Delete snippet"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{
                ...styles.pageButton,
                ...(page === 1 ? styles.pageButtonDisabled : {}),
              }}
            >
              Previous
            </button>
            <span style={styles.pageInfo}>
              Page {page} of {totalPages} ({total} snippets)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              style={{
                ...styles.pageButton,
                ...(page === totalPages ? styles.pageButtonDisabled : {}),
              }}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Edit / Create Modal */}
      {isEditModalOpen && (
        <div style={styles.overlay} onClick={() => setIsEditModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingSnippet ? 'Edit Snippet' : 'New Snippet'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSave} style={styles.modalForm}>
              {modalError && <div style={styles.errorAlert}>{modalError}</div>}

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Title *</label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Snippet title"
                  maxLength={100}
                  required
                  style={styles.formInput}
                  autoFocus
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>Language</label>
                  <LanguageSelect
                    value={modalLanguage}
                    onChange={(l) => setModalLanguage(l)}
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 2 }}>
                  <label style={styles.formLabel}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={modalTags}
                    onChange={(e) => setModalTags(e.target.value)}
                    placeholder="e.g. utility, math, react"
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Code Content</label>
                <textarea
                  value={modalCode}
                  onChange={(e) => setModalCode(e.target.value)}
                  rows={9}
                  style={styles.formTextarea}
                  spellCheck={false}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={styles.saveBtn}
                >
                  {isSubmitting ? 'Saving...' : 'Save Snippet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    height: '60px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  backButton: {
    background: 'none',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#38bdf8',
  },
  pageBadge: {
    backgroundColor: '#0369a133',
    color: '#38bdf8',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  newSnippetButton: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
    color: '#ffffff',
  },
  main: {
    flex: 1,
    padding: '28px',
    maxWidth: '1280px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  filterToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  searchForm: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    maxWidth: '480px',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 14px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  searchButton: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filterSelect: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
  },
  activeTagBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1e293b',
    border: '1px solid #0284c7',
    color: '#38bdf8',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  clearTagBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '12px',
    padding: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
    color: '#f8fafc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  langBadge: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#38bdf8',
    padding: '1px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    textTransform: 'lowercase',
  },
  cardDate: {
    fontSize: '11px',
    color: '#64748b',
  },
  codeBlock: {
    margin: 0,
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#cbd5e1',
    fontSize: '12px',
    fontFamily: '"SF Mono", Monaco, Menlo, Consolas, monospace',
    height: '110px',
    overflow: 'hidden',
    lineHeight: '1.4',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  tagPill: {
    fontSize: '11px',
    color: '#94a3b8',
    backgroundColor: '#0f172a',
    padding: '2px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid #1e293b',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: 'auto',
    paddingTop: '8px',
    borderTop: '1px solid #334155',
  },
  actionBtn: {
    background: 'none',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '5px 10px',
    borderRadius: '5px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '32px',
  },
  pageButton: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  pageButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  pageInfo: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '6px',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '20px',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #334155',
    borderTopColor: '#38bdf8',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 1s linear infinite',
  },
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
    maxWidth: '560px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #334155',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
  },
  modalForm: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  errorAlert: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  formInput: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  formTextarea: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#f8fafc',
    fontSize: '13px',
    fontFamily: '"SF Mono", Monaco, Menlo, Consolas, monospace',
    outline: 'none',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '6px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 18px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};
