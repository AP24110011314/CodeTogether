import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { getRoomsApi, deleteRoomApi } from '../api/rooms.js';
import { CreateRoomModal } from '../components/room/CreateRoomModal.jsx';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'joined'
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchRooms = async (scope) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getRoomsApi(scope);
      setRooms(data.rooms || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(activeTab);
  }, [activeTab]);

  const handleRoomCreated = (newRoom) => {
    setIsModalOpen(false);
    navigate(`/room/${newRoom.slug}`);
  };

  const handleDeleteRoom = async (e, roomId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this room? This cannot be undone.')) {
      return;
    }
    try {
      await deleteRoomApi(roomId);
      setRooms(rooms.filter((r) => r.id !== roomId && r._id !== roomId));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete room');
    }
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
          <button onClick={logout} style={styles.logoutButton}>
            Log Out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.actionBar}>
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab('mine')}
              style={{
                ...styles.tabButton,
                ...(activeTab === 'mine' ? styles.activeTab : {}),
              }}
            >
              My Rooms
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              style={{
                ...styles.tabButton,
                ...(activeTab === 'joined' ? styles.activeTab : {}),
              }}
            >
              Joined Rooms
            </button>
          </div>

          <button onClick={() => setIsModalOpen(true)} style={styles.createButton}>
            + Create Room
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {isLoading ? (
          <div style={styles.loadingState}>Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📂</div>
            <h3 style={styles.emptyTitle}>
              {activeTab === 'mine' ? 'No rooms created yet' : 'No joined rooms'}
            </h3>
            <p style={styles.emptySubtitle}>
              {activeTab === 'mine'
                ? 'Create your first collaborative room to share code and run live programs with your team.'
                : 'Join a room via an invite link shared with you.'}
            </p>
            {activeTab === 'mine' && (
              <button onClick={() => setIsModalOpen(true)} style={styles.emptyCreateButton}>
                Create Your First Room
              </button>
            )}
          </div>
        ) : (
          <div style={styles.roomGrid}>
            {rooms.map((room) => {
              const isOwner =
                (room.ownerId?._id || room.ownerId?.id || room.ownerId) === user?.id;

              return (
                <div
                  key={room.id || room._id}
                  style={styles.roomCard}
                  onClick={() => navigate(`/room/${room.slug}`)}
                >
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{room.name}</h3>
                    <div style={styles.cardBadges}>
                      <span style={styles.langBadge}>{room.language}</span>
                      <span
                        style={{
                          ...styles.visBadge,
                          backgroundColor:
                            room.visibility === 'private' ? '#854d0e' : '#1e3a8a',
                          color:
                            room.visibility === 'private' ? '#fef08a' : '#93c5fd',
                        }}
                      >
                        {room.visibility}
                      </span>
                    </div>
                  </div>

                  <p style={styles.cardSlug}>/room/{room.slug}</p>

                  <div style={styles.cardFooter}>
                    <span style={styles.membersCount}>
                      👥 {room.members?.length || 1} member{room.members?.length !== 1 ? 's' : ''}
                    </span>
                    <div style={styles.cardActions}>
                      {isOwner && (
                        <button
                          onClick={(e) => handleDeleteRoom(e, room.id || room._id)}
                          style={styles.deleteButton}
                          title="Delete room"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/room/${room.slug}`)}
                        style={styles.openButton}
                      >
                        Open &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleRoomCreated}
      />
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
  },
  main: {
    maxWidth: '1100px',
    margin: '32px auto',
    padding: '0 24px',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#1e293b',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  tabButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeTab: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
  },
  createButton: {
    padding: '10px 18px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)',
  },
  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#451a1a',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  loadingState: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#94a3b8',
    fontSize: '15px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '64px 20px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    maxWidth: '460px',
    margin: '0 auto 24px auto',
    lineHeight: '1.5',
  },
  emptyCreateButton: {
    padding: '10px 20px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  roomCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.15s, border-color 0.15s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '6px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0,
    color: '#f8fafc',
  },
  cardBadges: {
    display: 'flex',
    gap: '6px',
    flexShrink: 0,
  },
  langBadge: {
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#334155',
    color: '#38bdf8',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  visBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'capitalize',
  },
  cardSlug: {
    fontSize: '12px',
    color: '#64748b',
    fontFamily: 'monospace',
    margin: '0 0 16px 0',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #334155',
  },
  membersCount: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#451a1a',
    color: '#f87171',
    border: '1px solid #ef4444',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  openButton: {
    padding: '5px 12px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
