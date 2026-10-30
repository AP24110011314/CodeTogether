import React, { useState, useEffect } from 'react';
import { createSnippetApi } from '../../api/snippets.js';
import { LanguageSelect } from '../editor/LanguageSelect.jsx';

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
      setError(
        err.response?.data?.error?.message || 'Failed to save snippet'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Save Code Snippet</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., QuickSort implementation"
              maxLength={100}
              required
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Language</label>
              <LanguageSelect
                value={language}
                onChange={(lang) => setLanguage(lang)}
              />
            </div>

            <div style={{ ...styles.field, flex: 2 }}>
              <label style={styles.label}>Tags (comma-separated, max 10)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g., algorithm, sorting, recursion"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <div style={styles.codeHeader}>
              <label style={styles.label}>Code Content</label>
              <span style={styles.codeSize}>
                {(new Blob([code]).size / 1024).toFixed(1)} KB / 100 KB
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              style={styles.textarea}
              spellCheck={false}
            />
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                ...(isSubmitting ? styles.submitButtonDisabled : {}),
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save to Library'}
            </button>
          </div>
        </form>
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
    width: '100%',
    maxWidth: '560px',
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
    padding: '4px',
    borderRadius: '4px',
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  error: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    border: '1px solid #991b1b',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeSize: {
    fontSize: '11px',
    color: '#64748b',
  },
  textarea: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#f8fafc',
    fontSize: '13px',
    fontFamily: '"SF Mono", Monaco, Menlo, Consolas, monospace',
    outline: 'none',
    resize: 'vertical',
    lineHeight: '1.45',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '8px 18px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  submitButtonDisabled: {
    backgroundColor: '#0369a1',
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};
