import React from 'react';
import { useAuthStore } from '../store/authStore.js';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logo}>&lt;/&gt;</span>
          <span style={styles.brandTitle}>CodeTogether</span>
        </div>
        <div style={styles.userSection}>
          <div
            style={{
              ...styles.avatar,
              backgroundColor: user?.avatarColor || '#38bdf8',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.userEmail}>{user?.email}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Log Out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcomeCard}>
          <h2>Welcome to CodeTogether, {user?.name}!</h2>
          <p style={styles.leadText}>
            You are securely authenticated. Real-time rooms and Monaco editor integration will be configured in the next phase.
          </p>
          <div style={styles.statusBox}>
            <div>
              <strong>User ID:</strong> {user?.id}
            </div>
            <div>
              <strong>Avatar Color:</strong>{' '}
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: user?.avatarColor,
                  marginRight: '6px',
                  verticalAlign: 'middle',
                }}
              />
              {user?.avatarColor}
            </div>
            <div>
              <strong>Session Status:</strong> Active (JWT Access + Rotating Refresh Cookie)
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#38bdf8',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#ffffff',
    fontSize: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '13px',
  },
  userName: {
    fontWeight: '600',
    color: '#f1f5f9',
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: '11px',
  },
  logoutButton: {
    padding: '7px 14px',
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: '1px solid #475569',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  main: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '0 24px',
  },
  welcomeCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '32px',
  },
  leadText: {
    color: '#94a3b8',
    fontSize: '15px',
    lineHeight: '1.6',
    marginTop: '8px',
    marginBottom: '24px',
  },
  statusBox: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '13px',
    color: '#cbd5e1',
    border: '1px solid #334155',
  },
};
