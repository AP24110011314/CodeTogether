import React from 'react';
import { useRoomStore } from '../../store/roomStore.js';

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
  const { availableLanguages } = useRoomStore();
  const availableSet = new Set((availableLanguages || []).map((l) => l.id.toLowerCase()));

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="input-glass"
      style={{
        padding: '5px 10px',
        fontSize: '0.8125rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        height: '32px',
        width: 'auto',
      }}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isSupportedByRunner = ['javascript', 'python', 'typescript', 'c', 'cpp', 'java', 'go'].includes(lang.id);
        const hasHostRunner = availableSet.size === 0 || availableSet.has(lang.id.toLowerCase());
        const suffix = isSupportedByRunner && !hasHostRunner ? ' (No runtime)' : '';

        return (
          <option key={lang.id} value={lang.id} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            {lang.label}{suffix}
          </option>
        );
      })}
    </select>
  );
}
