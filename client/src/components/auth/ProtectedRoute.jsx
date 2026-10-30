import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }) {
  const { user, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div style={styles.loadingContainer}>
        <div className="glass-strong" style={styles.card}>
          <div className="mac-traffic-lights" style={{ marginBottom: '14px' }}>
            <span className="mac-dot mac-dot-close" />
            <span className="mac-dot mac-dot-min" />
            <span className="mac-dot mac-dot-max" />
          </div>
          <Loader2 size={28} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', marginBottom: '10px' }} />
          <div style={styles.title}>Loading CodeTogether...</div>
          <div style={styles.subtitle}>Verifying workstation credentials</div>
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
    padding: '32px 48px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
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
};
