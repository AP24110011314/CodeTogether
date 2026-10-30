import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div className="glass-strong" style={styles.card}>
            <div className="mac-traffic-lights" style={{ marginBottom: '16px' }}>
              <span className="mac-dot mac-dot-close" />
              <span className="mac-dot mac-dot-min" />
              <span className="mac-dot mac-dot-max" />
            </div>
            <div style={styles.iconBox}>
              <AlertTriangle size={32} style={{ color: 'var(--danger)' }} />
            </div>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              An unexpected interface error occurred. Don't worry, your collaborative documents and code are persisted on the server.
            </p>
            {this.state.error?.message && (
              <pre style={styles.errorText}>
                {this.state.error.message}
              </pre>
            )}
            <div style={styles.buttonGroup}>
              <button onClick={this.handleReload} className="btn btn-primary" style={{ gap: '6px' }}>
                <RefreshCw size={15} />
                <span>Reload Application</span>
              </button>
              <button onClick={this.handleGoHome} className="btn btn-secondary" style={{ gap: '6px' }}>
                <Home size={15} />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
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
    maxWidth: '500px',
    width: '100%',
    padding: '36px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  message: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '18px',
    lineHeight: '1.5',
  },
  errorText: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--editor-bg)',
    border: '1px solid var(--editor-border)',
    color: 'var(--danger)',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    textAlign: 'left',
    marginBottom: '24px',
    overflowX: 'auto',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
};
