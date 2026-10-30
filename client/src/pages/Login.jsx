import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>CodeTogether</h1>
          <p style={styles.subtitle}>Sign in to your collaborative workspace</p>
        </div>

        {localError && <div style={styles.error}>{localError}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
              autoComplete="email"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={isLoading} style={styles.button}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </div>
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
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '16px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
    border: '1px solid #334155',
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#38bdf8',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
  form: {
    display: 'flex',
    direction: 'column',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  input: {
    padding: '10px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    marginTop: '8px',
    padding: '11px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  error: {
    padding: '10px 12px',
    backgroundColor: '#451a1a',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
  },
  link: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontWeight: '500',
  },
};
