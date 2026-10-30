import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore.js';

export function ThemeToggle({ style = {} }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="btn btn-secondary"
      style={{
        padding: '7px 11px',
        borderRadius: 'var(--radius-full)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '0.8125rem',
        cursor: 'pointer',
        border: '1px solid var(--glass-border)',
        ...style,
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label="Toggle color theme"
    >
      {isDark ? (
        <>
          <Sun size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Light</span>
        </>
      ) : (
        <>
          <Moon size={15} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Dark</span>
        </>
      )}
    </button>
  );
}

