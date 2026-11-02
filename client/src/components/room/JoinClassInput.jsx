import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseClassLinkOrCode, joinInputSchema } from '../../lib/linkParser.js';
import { joinRoomApi } from '../../api/rooms.js';

export function JoinClassInput({ placeholder = 'Paste class link or code to join...', variant = 'default' }) {
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    setErrorMessage('');
    setSuccessMessage('');

    // Zod validation
    const valResult = joinInputSchema.safeParse(inputVal);
    if (!valResult.success) {
      setErrorMessage(valResult.error.errors[0]?.message || 'Please enter a valid link or code');
      return;
    }

    const parsed = parseClassLinkOrCode(inputVal);
    if (!parsed || !parsed.slug) {
      setErrorMessage('Invalid class link or room code format. Please check and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await joinRoomApi({
        slug: parsed.slug,
        inviteToken: parsed.inviteToken,
        viewToken: parsed.viewToken,
      });

      const destination = `/room/${parsed.slug}${
        parsed.inviteToken
          ? `?invite=${parsed.inviteToken}`
          : parsed.viewToken
          ? `?view=${parsed.viewToken}`
          : ''
      }`;

      if (result.alreadyMember) {
        setSuccessMessage('You are already a member! Opening classroom...');
      } else {
        setSuccessMessage('Joined successfully! Launching classroom...');
      }

      setTimeout(() => {
        navigate(destination);
      }, 350);
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.error?.code;
      const msg = err.response?.data?.error?.message;

      if (status === 404 || code === 'ROOM_NOT_FOUND') {
        setErrorMessage('Classroom not found. Please verify the code or link.');
      } else if (status === 403 || code === 'FORBIDDEN') {
        setErrorMessage('This classroom is private. An active invite or view token is required.');
      } else {
        setErrorMessage(msg || 'Failed to join classroom. Please check your network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div style={styles.container}>
      <form onSubmit={handleJoin} style={styles.formRow}>
        <div style={styles.inputWrapper}>
          <Link2 size={16} style={styles.inputIcon} />
          <input
            type="text"
            className="input-glass"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder={placeholder}
            disabled={isLoading}
            style={{
              ...styles.inputField,
              paddingLeft: '38px',
              height: isCompact ? '38px' : '44px',
              fontSize: isCompact ? '0.8125rem' : '0.875rem',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!inputVal.trim() || isLoading}
          className="btn btn-primary"
          style={{
            ...styles.joinBtn,
            height: isCompact ? '38px' : '44px',
            padding: isCompact ? '0 14px' : '0 20px',
          }}
          title="Join class by link or code"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Joining...</span>
            </>
          ) : (
            <>
              <span>Join</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {errorMessage && (
        <div style={styles.errorAlert} role="alert">
          <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={styles.successAlert} role="status">
          <CheckCircle2 size={14} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  inputField: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 'var(--radius-md)',
  },
  joinBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flexShrink: 0,
    fontWeight: '600',
    borderRadius: 'var(--radius-md)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: 'var(--danger)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '6px 10px',
    borderRadius: '6px',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: 'var(--secondary)',
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
    border: '1px solid rgba(20, 184, 166, 0.2)',
    padding: '6px 10px',
    borderRadius: '6px',
  },
};
