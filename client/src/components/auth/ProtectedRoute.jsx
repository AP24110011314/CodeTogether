import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Loader2, ArrowRight } from 'lucide-react';

export function ProtectedRoute({ children }) {
  const { user, isInitialized } = useAuthStore();
  const location = useLocation();
  const [showWakeupNotice, setShowWakeupNotice] = useState(false);

  useEffect(() => {
    // If auth verification takes longer than 3 seconds, show server waking notice
    const noticeTimer = setTimeout(() => {
      setShowWakeupNotice(true);
    }, 3000);

    // If still not initialized after 7 seconds, force fail to login so user is never trapped
    const fallbackTimer = setTimeout(() => {
      if (!useAuthStore.getState().isInitialized) {
        useAuthStore.setState({ isInitialized: true, user: null, accessToken: null });
      }
    }, 7000);

    return () => {
      clearTimeout(noticeTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  if (!isInitialized) {
    return (
      <div style={styles.loadingContainer}>
        <div className="glass-strong" style={styles.card}>
          <div className="mac-traffic-lights" style={{ marginBottom: '14px' }}>
            <span className="mac-dot mac-dot-close" />
            <span className="mac-dot mac-dot-min" />
            <span className="mac-dot mac-dot-max" />
          </div>
          <Loader2
            size={28}
            className="spinner"
            style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', marginBottom: '10px' }}
          />
          <div style={styles.title}>Loading CodeTogether...</div>
          <div style={styles.subtitle}>
            {showWakeupNotice ? 'Connecting to backend server...' : 'Verifying workstation credentials'}
          </div>

          {showWakeupNotice && (
            <div style={styles.noticeBox}>
              <p style={styles.noticeText}>
                The server may be waking up (Render Free Tier spins down after inactivity and takes ~30-50s on first load).
              </p>
              <div style={styles.noticeActions}>
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.75rem', gap: '5px', textDecoration: 'none' }}
                >
                  <span>Go to Login</span>
                  <ArrowRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    useAuthStore.setState({ isInitialized: true, user: null, accessToken: null });
                  }}
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '24px',
  },
  card: {
    padding: '32px 40px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '420px',
    width: '100%',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  },
  noticeBox: {
    marginTop: '16px',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--glass-bg-subtle)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  noticeText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    margin: 0,
  },
  noticeActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};
