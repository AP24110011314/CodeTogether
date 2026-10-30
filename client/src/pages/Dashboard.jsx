import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { getRoomsApi, deleteRoomApi } from '../api/rooms.js';
import { CreateRoomModal } from '../components/room/CreateRoomModal.jsx';
import { ThemeToggle } from '../components/common/ThemeToggle.jsx';
import {
  Code2,
  Plus,
  Search,
  Users,
  Clock,
  Trash2,
  Bookmark,
  Sparkles,
  LogOut,
  FolderCode,
  Globe,
  Lock,
  Compass,
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'joined'
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
    if (!window.confirm('Are you sure you want to delete this workspace? This cannot be undone.')) {
      return;
    }
    try {
      await deleteRoomApi(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId && r._id !== roomId));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete room');
    }
  };

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q) ||
        r.slug?.toLowerCase().includes(q)
    );
  }, [rooms, searchQuery]);

  return (
    <div style={styles.container}>
      {/* macOS Translucent Top Navigation Bar */}
      <header className="glass" style={styles.navBar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBadge}>
            <Code2 size={20} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <span style={styles.brandTitle}>CodeTogether</span>
            <span className="badge-glass badge-primary" style={{ marginLeft: '8px', fontSize: '0.6875rem' }}>
              Labs
            </span>
          </div>

          <nav style={styles.navLinks}>
            <span style={{ ...styles.navLink, color: 'var(--primary)', fontWeight: '600' }}>
              Workspaces
            </span>
            <Link to="/snippets" style={styles.navLink}>
              <Bookmark size={15} />
              <span>Snippets</span>
            </Link>
          </nav>
        </div>

        <div style={styles.navRight}>
          <ThemeToggle />

          <div style={styles.userProfile}>
            <div
              style={{
                ...styles.avatar,
                backgroundColor: user?.avatarColor || 'var(--primary)',
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div style={styles.userMeta}>
              <span style={styles.userName}>{user?.name}</span>
              <span style={styles.userEmail}>{user?.email}</span>
            </div>
            <button onClick={logout} className="btn btn-ghost" style={styles.logoutBtn} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.main}>
        {/* Welcome Greeting Banner */}
        <section className="glass-strong" style={styles.greetingCard}>
          <div style={styles.greetingContent}>
            <div style={styles.greetingPill}>
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <span>Collaborative Learning Suite</span>
            </div>
            <h1 style={styles.greetingTitle}>
              Welcome back, <span style={styles.nameHighlight}>{user?.name || 'Engineer'}</span>
            </h1>
            <p style={styles.greetingSubtitle}>
              Dive into real-time collaborative coding, test algorithms with isolated sandboxes, or spin up an interactive classroom.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={styles.createMainBtn}
          >
            <Plus size={18} />
            <span>New Workspace</span>
          </button>
        </section>

        {/* Action & Filter Toolbar */}
        <div style={styles.toolbar}>
          {/* Tabs */}
          <div className="glass-subtle" style={styles.tabsWrapper}>
            <button
              onClick={() => setActiveTab('mine')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'mine' ? styles.tabBtnActive : {}),
              }}
            >
              My Workspaces ({activeTab === 'mine' ? rooms.length : '•'})
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'joined' ? styles.tabBtnActive : {}),
              }}
            >
              Joined Classrooms ({activeTab === 'joined' ? rooms.length : '•'})
            </button>
          </div>

          {/* Search Bar */}
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              className="input-glass"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces by title or language..."
              style={{ paddingLeft: '38px', maxWidth: '320px' }}
            />
          </div>
        </div>

        {error && (
          <div role="alert" style={styles.errorBanner}>
            {error}
          </div>
        )}

        {/* Workspaces Grid */}
        {isLoading ? (
          <div style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="glass" style={styles.skeletonCard}>
                <div style={styles.skeletonHeader} />
                <div style={styles.skeletonLine} />
                <div style={styles.skeletonLineShort} />
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="glass" style={styles.emptyContainer}>
            <div style={styles.emptyIconBox}>
              <FolderCode size={36} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 style={styles.emptyTitle}>
              {searchQuery
                ? 'No matching workspaces found'
                : activeTab === 'mine'
                ? 'No workspaces created yet'
                : 'No joined classrooms yet'}
            </h3>
            <p style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms or create a fresh workspace.'
                : activeTab === 'mine'
                ? 'Create your first collaborative canvas to write, run, and learn algorithms with classmates.'
                : 'When educators or peers invite you to a room, it will appear right here.'}
            </p>
            {activeTab === 'mine' && (
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ marginTop: '12px' }}>
                <Plus size={16} />
                <span>Create Workspace</span>
              </button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredRooms.map((room) => {
              const isOwner = (room.ownerId?._id || room.ownerId?.id || room.ownerId) === user?.id;
              const memberCount = room.members?.length || 1;

              return (
                <div
                  key={room.id || room._id}
                  onClick={() => navigate(`/room/${room.slug}`)}
                  className="glass glass-hover"
                  style={styles.roomCard}
                >
                  {/* macOS Card Top Header */}
                  <div style={styles.cardTop}>
                    <div className="mac-traffic-lights">
                      <span className="mac-dot mac-dot-close" />
                      <span className="mac-dot mac-dot-min" />
                      <span className="mac-dot mac-dot-max" />
                    </div>
                    <div style={styles.badgesRow}>
                      <span className="badge-glass badge-primary" style={{ textTransform: 'capitalize' }}>
                        {room.language}
                      </span>
                      <span
                        className="badge-glass"
                        style={{
                          backgroundColor:
                            room.visibility === 'private'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(20, 184, 166, 0.12)',
                          color: room.visibility === 'private' ? 'var(--accent)' : 'var(--secondary)',
                          borderColor:
                            room.visibility === 'private'
                              ? 'rgba(245, 158, 11, 0.3)'
                              : 'rgba(20, 184, 166, 0.3)',
                        }}
                      >
                        {room.visibility === 'private' ? (
                          <>
                            <Lock size={11} /> Private
                          </>
                        ) : (
                          <>
                            <Globe size={11} /> Public
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Title & Slug */}
                  <div style={styles.cardBody}>
                    <h3 style={styles.roomName} title={room.name}>
                      {room.name}
                    </h3>
                    <span style={styles.roomSlug}>/room/{room.slug}</span>
                  </div>

                  {/* Footer Meta */}
                  <div style={styles.cardFooter}>
                    <div style={styles.footerLeft}>
                      <div style={styles.metaItem}>
                        <Users size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{memberCount} participant{memberCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={styles.metaItem}>
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(room.updatedAt || room.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {isOwner && (
                      <button
                        onClick={(e) => handleDeleteRoom(e, room.id || room._id)}
                        className="btn-ghost"
                        style={styles.deleteBtn}
                        title="Delete Workspace"
                        aria-label="Delete room"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
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
    display: 'flex',
    flexDirection: 'column',
  },
  navBar: {
    margin: '16px 24px',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'var(--radius-xl)',
    position: 'sticky',
    top: '16px',
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(var(--primary-rgb), 0.35)',
  },
  brandTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginLeft: '28px',
  },
  navLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color var(--transition-fast)',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '14px',
    borderLeft: '1px solid var(--glass-border-subtle)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '0.8125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    lineHeight: '1.2',
  },
  userEmail: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    padding: '6px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '8px 24px 48px',
  },
  greetingCard: {
    padding: '32px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
    gap: '20px',
    flexWrap: 'wrap',
  },
  greetingContent: {
    maxWidth: '680px',
  },
  greetingPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--accent)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  greetingTitle: {
    fontSize: '1.875rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  nameHighlight: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  greetingSubtitle: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  createMainBtn: {
    padding: '12px 20px',
    fontSize: '0.9375rem',
    borderRadius: 'var(--radius-md)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  tabsWrapper: {
    display: 'inline-flex',
    padding: '4px',
    borderRadius: 'var(--radius-md)',
    gap: '4px',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  tabBtnActive: {
    background: 'var(--glass-bg-strong)',
    color: 'var(--primary)',
    fontWeight: '600',
    boxShadow: 'var(--glass-shadow)',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  errorBanner: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--danger)',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  roomCard: {
    padding: '20px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '170px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  badgesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cardBody: {
    marginBottom: '16px',
  },
  roomName: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
    lineHeight: '1.3',
  },
  roomSlug: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  deleteBtn: {
    padding: '5px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--danger)',
    opacity: 0.75,
  },
  skeletonCard: {
    padding: '24px',
    minHeight: '170px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  skeletonHeader: {
    width: '40%',
    height: '18px',
    borderRadius: '4px',
    backgroundColor: 'var(--glass-border)',
  },
  skeletonLine: {
    width: '80%',
    height: '24px',
    borderRadius: '4px',
    backgroundColor: 'var(--glass-border)',
  },
  skeletonLineShort: {
    width: '50%',
    height: '14px',
    borderRadius: '4px',
    backgroundColor: 'var(--glass-border-subtle)',
    marginTop: 'auto',
  },
  emptyContainer: {
    padding: '48px 24px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  emptyIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(var(--primary-rgb), 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  emptySubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    maxWidth: '460px',
    lineHeight: '1.5',
  },
};
