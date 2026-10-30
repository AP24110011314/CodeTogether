import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getSnippetsApi,
  deleteSnippetApi,
  updateSnippetApi,
  createSnippetApi,
} from '../api/snippets.js';
import { createRoomApi } from '../api/rooms.js';
import { useAuthStore } from '../store/authStore.js';
import { ThemeToggle } from '../components/common/ThemeToggle.jsx';
import {
  Code2,
  Bookmark,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Trash2,
  ArrowLeft,
  X,
  FileCode,
  Tag,
  Loader2,
} from 'lucide-react';

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
      const room = await createRoomApi({
        name: `${snippet.title} (from snippet)`,
        language: snippet.language || 'javascript',
        visibility: 'public',
      });
      navigate(`/room/${room.slug}`);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create room from snippet');
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
      setModalError(err.response?.data?.error?.message || 'Failed to save snippet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Translucent Top Header */}
      <header className="glass" style={styles.navBar}>
        <div style={styles.navLeft}>
          <Link to="/" style={styles.backLink} title="Back to Workspaces">
            <ArrowLeft size={18} />
          </Link>
          <div style={styles.logoBadge}>
            <Bookmark size={18} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <h1 style={styles.navTitle}>Snippet Library</h1>
            <span style={styles.navSubtitle}>{total} saved algorithms & blocks</span>
          </div>
        </div>

        <div style={styles.navRight}>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ padding: '8px 16px' }}>
            <Plus size={16} />
            <span>New Snippet</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Search & Filter Toolbar */}
        <div style={styles.toolbar}>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <div style={styles.searchWrapper}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                className="input-glass"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search snippets by title, tag, or code..."
                style={{ paddingLeft: '38px', minWidth: '280px' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary">
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
              className="input-glass"
              style={{ cursor: 'pointer', minWidth: '150px' }}
            >
              <option value="">All Languages</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="go">Go</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
            </select>

            {selectedTag && (
              <div className="badge-glass badge-primary" style={{ padding: '6px 10px', gap: '8px' }}>
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
          <div style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass" style={styles.skeletonCard}>
                <div style={styles.skeletonHeader} />
                <div style={styles.skeletonCode} />
              </div>
            ))}
          </div>
        ) : snippets.length === 0 ? (
          <div className="glass" style={styles.emptyContainer}>
            <div style={styles.emptyIconBox}>
              <FileCode size={36} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 style={styles.emptyTitle}>No snippets found</h3>
            <p style={styles.emptySubtitle}>
              {searchQuery || selectedLang || selectedTag
                ? 'Try adjusting your search filters or clear tags.'
                : 'Save reusable code blocks directly from the Monaco editor or create one here.'}
            </p>
            <button onClick={openCreateModal} className="btn btn-primary" style={{ marginTop: '12px' }}>
              <Plus size={16} />
              <span>Create your first snippet</span>
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {snippets.map((s) => (
              <div key={s._id} className="glass glass-hover" style={styles.card}>
                {/* macOS Card Top Header */}
                <div style={styles.cardTop}>
                  <div className="mac-traffic-lights">
                    <span className="mac-dot mac-dot-close" />
                    <span className="mac-dot mac-dot-min" />
                    <span className="mac-dot mac-dot-max" />
                  </div>
                  <div style={styles.badgesRow}>
                    <span className="badge-glass badge-primary" style={{ textTransform: 'capitalize' }}>
                      {s.language}
                    </span>
                    <span style={styles.cardDate}>
                      {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h3 style={styles.cardTitle} title={s.title}>
                  {s.title}
                </h3>

                {/* Code Preview Box */}
                <pre style={styles.codeBlock}>
                  <code>{s.code}</code>
                </pre>

                {/* Tags */}
                {s.tags && s.tags.length > 0 && (
                  <div style={styles.tagsContainer}>
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag);
                          setPage(1);
                        }}
                        className="badge-glass"
                        style={{ cursor: 'pointer' }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Actions */}
                <div style={styles.cardActions}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleCopyCode(s)}
                      className="btn btn-secondary"
                      style={styles.actionBtn}
                      title="Copy code"
                    >
                      {copiedId === s._id ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                      <span>{copiedId === s._id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenInNewRoom(s)}
                      className="btn btn-secondary"
                      style={styles.actionBtn}
                      title="Open in new collaborative workspace"
                    >
                      <ExternalLink size={14} />
                      <span>Workspace</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => openEditModal(s)}
                      className="btn-ghost"
                      style={styles.iconBtn}
                      title="Edit snippet"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="btn-ghost"
                      style={{ ...styles.iconBtn, color: 'var(--danger)' }}
                      title="Delete snippet"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span style={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Edit / Create Snippet Modal */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="glass-strong modal-content"
            onClick={(e) => e.stopPropagation()}
            style={styles.modalBox}
          >
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="mac-traffic-lights">
                  <span className="mac-dot mac-dot-close" onClick={() => setIsEditModalOpen(false)} style={{ cursor: 'pointer' }} />
                  <span className="mac-dot mac-dot-min" />
                  <span className="mac-dot mac-dot-max" />
                </div>
                <h3 style={styles.modalTitle}>
                  {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="btn-ghost"
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {modalError && <div style={styles.modalError}>{modalError}</div>}

            <form onSubmit={handleModalSave} style={styles.modalForm}>
              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Title</label>
                <input
                  type="text"
                  className="input-glass"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. QuickSort Partition Algorithm"
                  required
                  autoFocus
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Language</label>
                <select
                  value={modalLanguage}
                  onChange={(e) => setModalLanguage(e.target.value)}
                  className="input-glass"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="go">Go</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Tags (comma separated)</label>
                <input
                  type="text"
                  className="input-glass"
                  value={modalTags}
                  onChange={(e) => setModalTags(e.target.value)}
                  placeholder="algorithms, sorting, leetcode"
                />
              </div>

              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Code Content</label>
                <textarea
                  className="input-glass"
                  value={modalCode}
                  onChange={(e) => setModalCode(e.target.value)}
                  placeholder="Paste or write snippet code here..."
                  rows={8}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
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
    display: 'flex',
    flexDirection: 'column',
  },
  navBar: {
    margin: '16px 24px',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'var(--radius-xl)',
    position: 'sticky',
    top: '16px',
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  backLink: {
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(var(--primary-rgb), 0.35)',
  },
  navTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  navSubtitle: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  main: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '8px 24px 48px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
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
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  clearTagBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  card: {
    padding: '18px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '260px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  badgesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  cardTitle: {
    fontSize: '1.0625rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '10px',
  },
  codeBlock: {
    flex: 1,
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--editor-bg)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem',
    overflow: 'hidden',
    maxHeight: '130px',
    marginBottom: '12px',
    border: '1px solid var(--editor-border)',
  },
  tagsContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '10px',
    borderTop: '1px solid var(--glass-border-subtle)',
    marginTop: 'auto',
  },
  actionBtn: {
    padding: '6px 10px',
    fontSize: '0.75rem',
    borderRadius: 'var(--radius-sm)',
  },
  iconBtn: {
    padding: '6px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
  },
  skeletonCard: {
    padding: '20px',
    minHeight: '260px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  skeletonHeader: {
    width: '50%',
    height: '20px',
    backgroundColor: 'var(--glass-border)',
    borderRadius: '4px',
  },
  skeletonCode: {
    flex: 1,
    backgroundColor: 'var(--glass-border-subtle)',
    borderRadius: '8px',
  },
  emptyContainer: {
    padding: '48px 24px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  emptyIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(var(--primary-rgb), 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  emptySubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    maxWidth: '460px',
    lineHeight: '1.5',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '32px',
  },
  pageInfo: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  modalBox: {
    width: '100%',
    maxWidth: '560px',
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--glass-border-subtle)',
  },
  modalTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  modalError: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    fontSize: '0.8125rem',
    marginBottom: '14px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  modalField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modalLabel: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
    paddingTop: '14px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
};
