import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404</h1>
      <p style={styles.subtitle}>The requested page could not be found.</p>
      <Link to="/" style={styles.button}>
        Back to Dashboard
      </Link>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '16px',
    textAlign: 'center',
  },
  title: {
    fontSize: '72px',
    fontWeight: '800',
    color: '#38bdf8',
    margin: 0,
  },
  subtitle: {
    fontSize: '18px',
    color: '#94a3b8',
    margin: '16px 0 24px 0',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
  },
};
