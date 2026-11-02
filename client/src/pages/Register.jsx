import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { ThemeToggle } from '../components/common/ThemeToggle.jsx';
import {
  Code2,
  Lock,
  Mail,
  User,
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

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { register, isLoading, user, isInitialized } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = location.state?.from;
  const redirectTarget = fromLocation
    ? `${fromLocation.pathname || '/'}${fromLocation.search || ''}`
    : '/';

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

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setLocalError('Full name must be at least 2 characters');
      return;
    }
    if (!trimmedEmail) {
      setLocalError('Please enter a valid email address');
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
      await register({ name: trimmedName, email: trimmedEmail, password });
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div className="glass-strong" style={styles.cardContainer}>
        {/* LEFT PANEL: Educational Value */}
        <div style={styles.brandPanel}>
          <div style={styles.brandHeader}>
            <div style={styles.logoBadge}>
              <Code2 size={24} style={{ color: '#FFFFFF' }} />
            </div>
            <div>
              <h2 style={styles.brandLogoText}>CodeTogether</h2>
              <span className="badge-glass badge-secondary" style={{ fontSize: '0.7rem' }}>
                Join the Platform
              </span>
            </div>
          </div>

          <div style={styles.taglineSection}>
            <h1 style={styles.tagline}>
              Accelerate your engineering journey <span style={styles.gradientHighlight}>side by side</span>.
            </h1>
            <p style={styles.taglineDesc}>
              Create a free student or mentor account to start building, reviewing, and testing algorithms in real time.
            </p>
          </div>

          {/* macOS Window Preview */}
          <div className="glass-subtle" style={styles.macWindow}>
            <div style={styles.macWindowHeader}>
              <div className="mac-traffic-lights">
                <span className="mac-dot mac-dot-close" />
                <span className="mac-dot mac-dot-min" />
                <span className="mac-dot mac-dot-max" />
              </div>
              <span style={styles.macWindowTitle}>community.ts</span>
            </div>
            <pre style={styles.macCodeBody}>
              <code>
                <span style={{ color: '#93C5FD' }}>// Instant room sharing</span>{'\n'}
                <span style={{ color: '#F472B6' }}>interface</span> <span style={{ color: '#6EE7B7' }}>Developer</span> {'{'}{'\n'}
                {'  '}<span style={{ color: '#FBBF24' }}>name</span>: <span style={{ color: '#38BDF8' }}>string</span>;{'\n'}
                {'  '}<span style={{ color: '#FBBF24' }}>role</span>: <span style={{ color: '#38BDF8' }}>'owner' | 'editor' | 'viewer'</span>;{'\n'}
                {'}'}{'\n'}
                <span style={{ color: '#F472B6' }}>const</span> <span style={{ color: '#FBBF24' }}>member</span> = <span style={{ color: '#6EE7B7' }}>createMember</span>(you);
              </code>
            </pre>
          </div>

          {/* Benefits */}
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <Zap size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={styles.featureText}>No installation required — browser-native Monaco editor</span>
            </div>
            <div style={styles.featureItem}>
              <GraduationCap size={18} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <span style={styles.featureText}>Ideal for pair programming, interviews, and coding labs</span>
            </div>
            <div style={styles.featureItem}>
              <ShieldCheck size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={styles.featureText}>Full IDOR protection, end-to-end access control</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Sign-Up Form */}
        <div style={styles.formPanel}>
          <div style={styles.formTopBar}>
            <span style={styles.welcomePill}>
              <Sparkles size={14} style={{ color: 'var(--secondary)' }} /> Get Started Free
            </span>
            <ThemeToggle />
          </div>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Create developer account</h2>
            <p style={styles.formSubtitle}>Join thousands of developers coding together daily</p>
          </div>

          {localError && (
            <div role="alert" style={styles.alertBox}>
              <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span style={styles.alertText}>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Full Name */}
            <div style={styles.inputGroup}>
              <label htmlFor="reg-name" style={styles.label}>
                Full Name
              </label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  id="reg-name"
                  type="text"
                  className="input-glass"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete="name"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {/* Email Field */}
            <div style={styles.inputGroup}>
              <label htmlFor="reg-email" style={styles.label}>
                Email address
              </label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  id="reg-email"
                  type="email"
                  className="input-glass"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label htmlFor="reg-password" style={styles.label}>
                Password (min 8 characters)
              </label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-glass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div style={styles.inputGroup}>
              <label htmlFor="reg-confirm-password" style={styles.label}>
                Confirm Password
              </label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="reg-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-glass"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9375rem', marginTop: '6px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={styles.formFooter}>
            <span style={{ color: 'var(--text-secondary)' }}>Already have an account?</span>{' '}
            <Link to="/login" state={{ from: location.state?.from }} style={styles.loginLink}>
              Sign in instead
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
    background: 'linear-gradient(180deg, rgba(var(--secondary-rgb), 0.05) 0%, rgba(var(--primary-rgb), 0.05) 100%)',
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
    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(var(--secondary-rgb), 0.35)',
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
    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
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
    marginBottom: '16px',
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
    marginBottom: '20px',
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
    marginBottom: '18px',
  },
  alertText: {
    fontSize: '0.8125rem',
    color: 'var(--danger)',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
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
  formFooter: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '0.875rem',
  },
  loginLink: {
    color: 'var(--primary)',
    fontWeight: '600',
    textDecoration: 'none',
  },
};
