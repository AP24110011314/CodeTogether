import React from 'react';
import { useToastStore } from '../../store/toastStore.js';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

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
            className="glass-strong"
            style={{
              ...styles.toast,
              borderColor: theme.borderColor,
            }}
          >
            <div style={styles.content}>
              <span style={{ ...styles.icon, color: theme.color }}>{theme.icon}</span>
              <span style={styles.message}>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="btn-ghost"
              style={styles.closeButton}
              title="Dismiss notification"
              aria-label="Dismiss"
            >
              <X size={14} />
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
        color: 'var(--success)',
        borderColor: 'rgba(34, 197, 94, 0.4)',
        icon: <CheckCircle2 size={16} />,
      };
    case 'error':
      return {
        color: 'var(--danger)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
        icon: <AlertCircle size={16} />,
      };
    case 'warning':
      return {
        color: 'var(--warning)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        icon: <AlertTriangle size={16} />,
      };
    case 'info':
    default:
      return {
        color: 'var(--info)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        icon: <Info size={16} />,
      };
  }
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '380px',
    pointerEvents: 'none',
  },
  toast: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    boxShadow: 'var(--glass-shadow-lg)',
    pointerEvents: 'auto',
    animation: 'modalContentPopIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
  },
  message: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
  },
  closeButton: {
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
};
