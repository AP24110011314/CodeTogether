import React from 'react';
import { useToastStore } from '../../store/toastStore.js';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map((t) => {
        const theme = getToastTheme(t.type);
        return (
          <div
            key={t.id}
            style={{
              ...styles.toast,
              backgroundColor: theme.bg,
              borderColor: theme.border,
              color: theme.color,
            }}
          >
            <div style={styles.content}>
              <span style={styles.icon}>{theme.icon}</span>
              <span style={styles.message}>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={styles.closeButton}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function getToastTheme(type) {
  switch (type) {
    case 'success':
      return {
        bg: '#064e3b',
        border: '#10b981',
        color: '#ecfdf5',
        icon: '✓',
      };
    case 'error':
      return {
        bg: '#7f1d1d',
        border: '#ef4444',
        color: '#fef2f2',
        icon: '✕',
      };
    case 'warning':
      return {
        bg: '#78350f',
        border: '#f59e0b',
        color: '#fffbeb',
        icon: '⚠',
      };
    case 'info':
    default:
      return {
        bg: '#1e293b',
        border: '#38bdf8',
        color: '#f8fafc',
        icon: 'ℹ',
      };
  }
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 9999,
    maxWidth: '380px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
    fontSize: '13px',
    fontWeight: 500,
    animation: 'slideIn 0.2s ease-out',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginRight: '12px',
  },
  icon: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  message: {
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.7,
    fontSize: '14px',
    padding: '2px 4px',
    lineHeight: 1,
  },
};

