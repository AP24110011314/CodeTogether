import React, { useState, useEffect } from 'react';
import { createSnippetApi } from '../../api/snippets.js';
import { BookmarkPlus, X, Loader2 } from 'lucide-react';

export function SaveSnippetModal({
  isOpen,
  onClose,
  defaultCode = '',
  defaultLanguage = 'javascript',
  onSuccess,
}) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState(defaultLanguage);
  const [tagsInput, setTagsInput] = useState('');
  const [code, setCode] = useState(defaultCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCode(defaultCode || '');
      setLanguage(defaultLanguage || 'javascript');
      setTitle('');
      setTagsInput('');
      setError(null);
    }
  }, [isOpen, defaultCode, defaultLanguage]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Snippet title is required');
      return;
    }
    if (!code) {
      setError('Snippet code cannot be empty');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    setIsSubmitting(true);
    setError(null);

    try {
      const data = await createSnippetApi({
        title: title.trim(),
        language,
        code,
        tags,
      });

      if (onSuccess) onSuccess(data.snippet);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save snippet');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <BookmarkPlus size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={styles.title}>Save as Snippet</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div role="alert" style={styles.errorAlert}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Snippet Title</label>
            <input
              type="text"
              className="input-glass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Binary Search Tree Insertion"
              required
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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

          <div style={styles.field}>
            <label style={styles.label}>Tags (comma separated)</label>
            <input
              type="text"
              className="input-glass"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tree, search, algorithms"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Code Content</label>
            <textarea
              className="input-glass"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              required
            />
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Snippet</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  modalBox: {
    width: '100%',
    maxWidth: '540px',
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
  errorAlert: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    fontSize: '0.8125rem',
    marginBottom: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
};
