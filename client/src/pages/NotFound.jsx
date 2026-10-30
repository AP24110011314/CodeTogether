import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={styles.container}>
      <div className="glass-strong" style={styles.card}>
        <div className="mac-traffic-lights" style={{ marginBottom: '16px' }}>
          <span className="mac-dot mac-dot-close" />
          <span className="mac-dot mac-dot-min" />
          <span className="mac-dot mac-dot-max" />
        </div>
        <div style={styles.iconBox}>
          <Compass size={36} style={{ color: 'var(--primary)' }} />
        </div>
        <h1 style={styles.title}>404</h1>
        <p style={styles.subtitle}>The requested workspace or page could not be located.</p>
        <Link to="/" className="btn btn-primary" style={{ gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    padding: '40px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '440px',
    width: '100%',
  },
  iconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(var(--primary-rgb), 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: '800',
    color: 'var(--primary)',
    margin: '0 0 8px 0',
    letterSpacing: '-0.04em',
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
};
