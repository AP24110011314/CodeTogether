import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { ThemeToggle } from '../components/common/ThemeToggle.jsx';
import {
  Code2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');

  const { login, isLoading, user, isInitialized } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = location.state?.from;
  const redirectTarget = fromLocation
    ? `${fromLocation.pathname || '/'}${fromLocation.search || ''}`
    : '/';

  useEffect(() => {
    document.title = 'Sign In — CodeTogether';
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isInitialized && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, isInitialized, navigate, redirectTarget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setLocalError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your email address');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      await login({ email: trimmedEmail, password });
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK' || err.message?.includes('timeout')) {
        setLocalError('Unable to connect to the backend server. If using Render Free Tier, the server may be waking up (~30-50s). Please wait a moment and retry.');
      } else {
        setLocalError(err.message || 'Invalid email or password');
      }
    }
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLocalError('');
  };

  return (
    <div style={styles.pageWrapper}>
      <div className="glass-strong auth-card-container" style={styles.cardContainer}>
        {/* LEFT PANEL: Educational Brand & macOS Window Preview */}
        <div className="auth-brand-panel" style={styles.brandPanel}>
          <div style={styles.brandHeader}>
            <div style={styles.logoBadge}>
              <Code2 size={24} style={{ color: '#FFFFFF' }} />
            </div>
            <div>
              <h2 style={styles.brandLogoText}>CodeTogether</h2>
              <span className="badge-glass badge-primary" style={{ fontSize: '0.7rem' }}>
                macOS Tahoe Edition
              </span>
            </div>
          </div>

          <div style={styles.taglineSection}>
            <h1 style={styles.tagline}>
              Learn and code together, <span style={styles.gradientHighlight}>in real time</span>.
            </h1>
            <p style={styles.taglineDesc}>
              The collaborative coding canvas engineered for students, educators, and dev teams.
            </p>
          </div>

          {/* macOS Code Preview Window */}
          <div className="glass-subtle" style={styles.macWindow}>
            <div style={styles.macWindowHeader}>
              <div className="mac-traffic-lights">
                <span className="mac-dot mac-dot-close" />
                <span className="mac-dot mac-dot-min" />
                <span className="mac-dot mac-dot-max" />
              </div>
              <span style={styles.macWindowTitle}>workspace.py</span>
            </div>
            <pre style={styles.macCodeBody}>
              <code>
                <span style={{ color: '#93C5FD' }}># Live interactive classroom</span>{'\n'}
                <span style={{ color: '#F472B6' }}>async def</span> <span style={{ color: '#6EE7B7' }}>collaborate</span>():{'\n'}
                {'  '}<span style={{ color: '#FBBF24' }}>peers</span> = <span style={{ color: '#A78BFA' }}>await</span> room.<span style={{ color: '#6EE7B7' }}>connect</span>(){'\n'}
                {'  '}<span style={{ color: '#F472B6' }}>for</span> learner <span style={{ color: '#F472B6' }}>in</span> peers:{'\n'}
                {'    '}learner.<span style={{ color: '#6EE7B7' }}>sync_cursor</span>(live=<span style={{ color: '#38BDF8' }}>True</span>){'\n'}
                {'    '}learner.<span style={{ color: '#6EE7B7' }}>execute_code</span>()
              </code>
            </pre>
          </div>

          {/* Value Props */}
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <Zap size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={styles.featureText}>Sub-millisecond Yjs CRDT conflict-free document sync</span>
            </div>
            <div style={styles.featureItem}>
              <GraduationCap size={18} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <span style={styles.featureText}>Classroom-ready awareness, colored cursors & live chat</span>
            </div>
            <div style={styles.featureItem}>
              <ShieldCheck size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={styles.featureText}>Hardened multi-runtime sandbox with memory watchdogs</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Sign-In Form */}
        <div className="auth-form-panel" style={styles.formPanel}>
          <div style={styles.formTopBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...styles.logoBadge, width: '28px', height: '28px', borderRadius: '8px' }}>
                <Code2 size={15} style={{ color: '#FFFFFF' }} />
              </div>
              <span style={styles.welcomePill}>
                <Sparkles size={13} style={{ color: 'var(--accent)' }} /> Welcome Back
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Sign in to your account</h2>
            <p style={styles.formSubtitle}>Enter your credentials to access your workspaces</p>
          </div>

          {localError && (
            <div role="alert" style={styles.alertBox}>
              <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span style={styles.alertText}>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email Field */}
            <div style={styles.inputGroup}>
              <label htmlFor="login-email" style={styles.label}>
                Email address
              </label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  id="login-email"
                  type="email"
                  className="input-glass"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  autoComplete="email"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={styles.inputGroup}>
              <div style={styles.labelRow}>
                <label htmlFor="login-password" style={styles.label}>
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    setLocalError('For local development, demo accounts use password: password123');
                  }}
                  style={styles.forgotLink}
                >
                  Forgot password?
                </a>
              </div>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-glass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={styles.rememberRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9375rem' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Demo Fill Shortcuts */}
          <div style={styles.demoSection}>
            <span style={styles.demoTitle}>Quick Demo Sign-In:</span>
            <div style={styles.demoButtons}>
              <button
                type="button"
                onClick={() => handleDemoFill('alice@codetogether.dev')}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                👤 Alice (Owner)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('bob@codetogether.dev')}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                👥 Bob (Editor)
              </button>
            </div>
          </div>

          <div style={styles.formFooter}>
            <span style={{ color: 'var(--text-secondary)' }}>Don't have an account?</span>{' '}
            <Link to="/register" state={{ from: location.state?.from }} style={styles.registerLink}>
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '1020px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    overflow: 'hidden',
  },
  brandPanel: {
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRight: '1px solid var(--glass-border-subtle)',
    background: 'linear-gradient(180deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(var(--secondary-rgb), 0.05) 100%)',
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  logoBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.35)',
  },
  brandLogoText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  taglineSection: {
    marginBottom: '28px',
  },
  tagline: {
    fontSize: '1.75rem',
    fontWeight: '800',
    lineHeight: '1.25',
    color: 'var(--text-primary)',
    letterSpacing: '-0.03em',
    marginBottom: '10px',
  },
  gradientHighlight: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  taglineDesc: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  macWindow: {
    borderRadius: '14px',
    overflow: 'hidden',
    marginBottom: '28px',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
  },
  macWindowHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    background: 'rgba(0, 0, 0, 0.08)',
  },
  macWindowTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontFamily: 'var(--font-mono)',
  },
  macCodeBody: {
    padding: '14px 18px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem',
    lineHeight: '1.6',
    background: 'var(--editor-bg)',
    color: 'var(--text-primary)',
    overflowX: 'auto',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  featureText: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  formPanel: {
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  formTopBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  welcomePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  formHeader: {
    marginBottom: '24px',
  },
  formTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '6px',
  },
  formSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  alertBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    marginBottom: '20px',
  },
  alertText: {
    fontSize: '0.8125rem',
    color: 'var(--danger)',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  forgotLink: {
    fontSize: '0.75rem',
    color: 'var(--primary)',
    textDecoration: 'none',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  rememberRow: {
    display: 'flex',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: 'var(--primary)',
    cursor: 'pointer',
  },
  demoSection: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  demoTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  demoButtons: {
    display: 'flex',
    gap: '8px',
  },
  formFooter: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '0.875rem',
  },
  registerLink: {
    color: 'var(--primary)',
    fontWeight: '600',
    textDecoration: 'none',
  },
};
