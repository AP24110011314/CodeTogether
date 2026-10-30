import React from 'react';

export const SUPPORTED_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'sql', label: 'SQL' },
];

export function LanguageSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={styles.select}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}

const styles = {
  select: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
};

