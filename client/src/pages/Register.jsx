import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (name.trim().length < 2) {
      setLocalError('Name must be at least 2 characters');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>CodeTogether</h1>
          <p style={styles.subtitle}>Create your developer account</p>
        </div>

        {localError && <div style={styles.error}>{localError}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              required
              minLength={2}
              maxLength={50}
              style={styles.input}
              autoComplete="name"
            />
          </div>

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
            <label style={styles.label}>Password (min 8 characters)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              style={styles.input}
              autoComplete="new-password"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={isLoading} style={styles.button}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign In
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
